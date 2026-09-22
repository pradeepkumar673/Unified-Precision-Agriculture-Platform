"""API router for community endpoints.

Covers MASTER-SPEC features #5, #10, #34, #35, #36, #53.

Routes:
  GET  /api/v1/community/alerts/{farm_id}
  GET  /api/v1/community/season-report/{farm_id}?season=X&year=Y
  POST /api/v1/community/support-ticket
  POST /api/v1/community/shg/create
  POST /api/v1/community/shg/{id}/book
  GET  /api/v1/community/grower-score/{farm_id}
  POST /api/v1/community/fpo/create
  POST /api/v1/community/fpo/{id}/pool-purchase
  POST /api/v1/community/fpo/{id}/pool-sale
"""
from datetime import datetime, timezone
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.community import (
    Alert,
    FPOGroup,
    FPOMember,
    FPOTender,
    GrowerScore,
    SeasonReport,
    SHGBooking,
    SHGGroup,
    SupportTicket,
    TicketStatus,
)
from app.models.farm import Farm
from app.models.marketplace import EquipmentBooking
from app.schemas.community import (
    AlertRead,
    GrowerScoreRead,
    SeasonReportRead,
    SHGBookingCreate,
    SHGBookingRead,
    SHGGroupCreate,
    SHGGroupRead,
    SupportTicketCreate,
    SupportTicketRead,
    FPOGroupDetailedRead,
    JoinTenderRequest,
)
from app.services.community import (
    compute_grower_score,
    compute_season_report,
    generate_synthetic_alerts,
)

router = APIRouter(prefix="/api/v1/community", tags=["community"])


# ---------------------------------------------------------------------------
# #5 Smart Alerts
# ---------------------------------------------------------------------------
@router.get("/alerts/{farm_id}", response_model=List[AlertRead])
def get_alerts(
    farm_id: UUID,
    db: Session = Depends(get_db),
):
    """Return alerts for a farm; generate 2-3 synthetic ones if none exist."""
    if str(farm_id) == "00000000-0000-0000-0000-000000000000":
        farm = db.execute(select(Farm)).scalars().first()
    else:
        farm = db.execute(select(Farm).where(Farm.id == farm_id)).scalars().first()
        
    if not farm:
        # Fallback for invalid/cached localStorage farm IDs
        farm = db.execute(select(Farm)).scalars().first()
        if not farm:
            raise HTTPException(status_code=404, detail="Farm not found")
        
    # Reassign farm_id to the actual farm id we are using
    farm_id = farm.id

    existing = db.execute(
        select(Alert)
        .where(Alert.farm_id == farm_id)
        .order_by(Alert.created_at.desc())
    ).scalars().all()

    if not existing:
        existing = generate_synthetic_alerts(db, farm)

    return existing


# ---------------------------------------------------------------------------
# #10 Season Report
# ---------------------------------------------------------------------------
@router.get("/season-report/{farm_id}", response_model=SeasonReportRead)
def get_season_report(
    farm_id: UUID,
    season: str = Query("kharif", description="Season name: kharif | rabi | zaid"),
    year: int = Query(..., description="Year e.g. 2026"),
    db: Session = Depends(get_db),
):
    """Aggregate transactions, crop_plans, and yield_forecasts into a season report."""
    if str(farm_id) == "00000000-0000-0000-0000-000000000000":
        farm = db.execute(select(Farm)).scalars().first()
    else:
        farm = db.execute(select(Farm).where(Farm.id == farm_id)).scalars().first()
        
    if not farm:
        # Fallback for invalid/cached localStorage farm IDs
        farm = db.execute(select(Farm)).scalars().first()
        if not farm:
            raise HTTPException(status_code=404, detail="Farm not found")
        
    farm_id = farm.id

    # Check for cached report
    cached = db.execute(
        select(SeasonReport).where(
            SeasonReport.farm_id == farm_id,
            SeasonReport.season == season,
            SeasonReport.year == year,
        )
    ).scalars().first()

    if cached:
        return cached

    report = compute_season_report(db, farm, season, year)
    return report


# ---------------------------------------------------------------------------
# #34 Digital Sakhi / Support Tickets
# ---------------------------------------------------------------------------
@router.post(
    "/support-ticket",
    response_model=SupportTicketRead,
    status_code=status.HTTP_201_CREATED,
)
def create_support_ticket(
    payload: SupportTicketCreate,
    db: Session = Depends(get_db),
):
    """Create a farmer support ticket."""
    farm = db.execute(select(Farm).where(Farm.id == payload.farm_id)).scalars().first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    ticket = SupportTicket(
        farm_id=payload.farm_id,
        issue=payload.issue,
        status=TicketStatus.open,
        notes="",
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket


# ---------------------------------------------------------------------------
# #35 SHG Bookings
# ---------------------------------------------------------------------------
@router.post(
    "/shg/create",
    response_model=SHGGroupRead,
    status_code=status.HTTP_201_CREATED,
)
def create_shg_group(
    payload: SHGGroupCreate,
    db: Session = Depends(get_db),
):
    """Create a Self-Help Group (SHG) for collective equipment booking."""
    group = SHGGroup(
        name=payload.name,
        member_farm_ids=payload.member_farm_ids,
    )
    db.add(group)
    db.commit()
    db.refresh(group)
    return group


@router.post(
    "/shg/{shg_id}/book",
    response_model=SHGBookingRead,
    status_code=status.HTTP_201_CREATED,
)
def create_shg_booking(
    shg_id: UUID,
    payload: SHGBookingCreate,
    db: Session = Depends(get_db),
):
    """Create an SHG cost-split booking for shared equipment."""
    group = db.execute(select(SHGGroup).where(SHGGroup.id == shg_id)).scalars().first()
    if not group:
        raise HTTPException(status_code=404, detail="SHG group not found")

    eq_booking = db.execute(
        select(EquipmentBooking).where(EquipmentBooking.id == payload.equipment_booking_id)
    ).scalars().first()
    if not eq_booking:
        raise HTTPException(status_code=404, detail="Equipment booking not found")

    shg_booking = SHGBooking(
        shg_id=shg_id,
        equipment_booking_id=payload.equipment_booking_id,
        split_amounts=payload.split_amounts,
    )
    db.add(shg_booking)
    db.commit()
    db.refresh(shg_booking)
    return shg_booking


# ---------------------------------------------------------------------------
# #36 Grower Score
# ---------------------------------------------------------------------------
@router.get("/grower-score/{farm_id}", response_model=GrowerScoreRead)
def get_grower_score(
    farm_id: UUID,
    db: Session = Depends(get_db),
):
    """Compute weighted grower score and district percentile."""
    farm = db.execute(select(Farm).where(Farm.id == farm_id)).scalars().first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    score, percentile = compute_grower_score(db, farm)

    grower_score = GrowerScore(
        farm_id=farm.id,
        score=score,
        district_percentile=percentile,
    )
    db.add(grower_score)
    db.commit()
    db.refresh(grower_score)

    return GrowerScoreRead(
        id=grower_score.id,
        farm_id=grower_score.farm_id,
        score=grower_score.score,
        district_percentile=grower_score.district_percentile,
        computed_at=grower_score.computed_at,
    )


# ---------------------------------------------------------------------------
# #53 FPO Suite
# ---------------------------------------------------------------------------
from pydantic import BaseModel

class CreateFPORep(BaseModel):
    name: str
    registration_no: str
    hubs: str

@router.get("/fpo/active", response_model=FPOGroupDetailedRead)
def get_active_fpo(db: Session = Depends(get_db)):
    """Fetch the active FPO for the user, return 404 if it doesn't exist."""
    fpo = db.execute(select(FPOGroup)).scalars().first()
    
    if not fpo:
        raise HTTPException(status_code=404, detail="No active FPO found")

    members = db.execute(select(FPOMember).where(FPOMember.fpo_id == fpo.id)).scalars().all()
    tenders = db.execute(select(FPOTender).where(FPOTender.fpo_id == fpo.id)).scalars().all()

    return FPOGroupDetailedRead(
        id=fpo.id,
        name=fpo.name,
        registration_no=fpo.registration_no,
        hubs=fpo.hubs,
        wallet_balance=fpo.wallet_balance,
        members=list(members),
        tenders=list(tenders),
        created_at=fpo.created_at,
    )

@router.post("/fpo", response_model=FPOGroupDetailedRead)
def create_fpo(payload: CreateFPORep, db: Session = Depends(get_db)):
    """Create a new FPO."""
    fpo = FPOGroup(
        name=payload.name,
        registration_no=payload.registration_no,
        hubs=payload.hubs,
        wallet_balance=0.0
    )
    db.add(fpo)
    db.commit()
    db.refresh(fpo)
    return FPOGroupDetailedRead(
        id=fpo.id,
        name=fpo.name,
        registration_no=fpo.registration_no,
        hubs=fpo.hubs,
        wallet_balance=fpo.wallet_balance,
        members=[],
        tenders=[],
        created_at=fpo.created_at,
    )

@router.post("/fpo/tender/{tender_id}/join", response_model=FPOGroupDetailedRead)
def join_fpo_tender(
    tender_id: UUID,
    payload: JoinTenderRequest,
    db: Session = Depends(get_db),
):
    """Join an active collective bargaining tender."""
    tender = db.execute(select(FPOTender).where(FPOTender.id == tender_id)).scalars().first()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")

    fpo = db.execute(select(FPOGroup).where(FPOGroup.id == tender.fpo_id)).scalars().first()
    
    # 1. Update the tender pool
    tender.current_pooled += payload.quantity_qtl
    
    # 2. Add the farmer as a member of this FPO if not already
    member = db.execute(select(FPOMember).where(FPOMember.fpo_id == fpo.id, FPOMember.farm_id == payload.farm_id)).scalars().first()
    if member:
        member.pooled_quantity += payload.quantity_qtl
        member.crop_type = tender.crop_name
        member.tag = "Awaiting Action"
    else:
        new_member = FPOMember(
            fpo_id=fpo.id,
            farm_id=payload.farm_id,
            member_name="Ramesh Patil (You)",
            pooled_quantity=payload.quantity_qtl,
            crop_type=tender.crop_name,
            tag="Awaiting Action"
        )
        db.add(new_member)
        
    db.commit()
    
    members = db.execute(select(FPOMember).where(FPOMember.fpo_id == fpo.id)).scalars().all()
    tenders = db.execute(select(FPOTender).where(FPOTender.fpo_id == fpo.id)).scalars().all()

    return FPOGroupDetailedRead(
        id=fpo.id,
        name=fpo.name,
        registration_no=fpo.registration_no,
        hubs=fpo.hubs,
        wallet_balance=fpo.wallet_balance,
        members=list(members),
        tenders=list(tenders),
        created_at=fpo.created_at,
    )
