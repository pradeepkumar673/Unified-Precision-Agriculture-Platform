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
    FPOGroupCreate,
    FPOGroupRead,
    FPOPoolItemCreate,
    GrowerScoreRead,
    SeasonReportRead,
    SHGBookingCreate,
    SHGBookingRead,
    SHGGroupCreate,
    SHGGroupRead,
    SupportTicketCreate,
    SupportTicketRead,
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
@router.post(
    "/fpo/create",
    response_model=FPOGroupRead,
    status_code=status.HTTP_201_CREATED,
)
def create_fpo_group(
    payload: FPOGroupCreate,
    db: Session = Depends(get_db),
):
    """Create a Farmer Producer Organization (FPO) group."""
    fpo = FPOGroup(
        name=payload.name,
        member_farm_ids=payload.member_farm_ids,
        pooled_purchases=[],
        pooled_sales=[],
        scheme_compliance={},
    )
    db.add(fpo)
    db.commit()
    db.refresh(fpo)
    return fpo


@router.post("/fpo/{fpo_id}/pool-purchase", response_model=FPOGroupRead)
def fpo_pool_purchase(
    fpo_id: UUID,
    payload: FPOPoolItemCreate,
    db: Session = Depends(get_db),
):
    """Append a pooled purchase record to the FPO group."""
    fpo = db.execute(select(FPOGroup).where(FPOGroup.id == fpo_id)).scalars().first()
    if not fpo:
        raise HTTPException(status_code=404, detail="FPO group not found")

    purchase_entry = {
        "recorded_at": datetime.now(timezone.utc).isoformat(),
        "item": payload.item,
        "qty_kg": payload.qty_kg,
        "amount": payload.amount,
        "vendor": payload.vendor,
        "notes": payload.notes,
    }
    # SQLAlchemy JSON column mutation detection requires reassignment
    new_purchases = list(fpo.pooled_purchases or [])
    new_purchases.append(purchase_entry)
    fpo.pooled_purchases = new_purchases

    db.commit()
    db.refresh(fpo)
    return fpo


@router.post("/fpo/{fpo_id}/pool-sale", response_model=FPOGroupRead)
def fpo_pool_sale(
    fpo_id: UUID,
    payload: FPOPoolItemCreate,
    db: Session = Depends(get_db),
):
    """Append a pooled sale record to the FPO group."""
    fpo = db.execute(select(FPOGroup).where(FPOGroup.id == fpo_id)).scalars().first()
    if not fpo:
        raise HTTPException(status_code=404, detail="FPO group not found")

    sale_entry = {
        "recorded_at": datetime.now(timezone.utc).isoformat(),
        "item": payload.item,
        "qty_kg": payload.qty_kg,
        "amount": payload.amount,
        "buyer": payload.buyer,
        "notes": payload.notes,
    }
    new_sales = list(fpo.pooled_sales or [])
    new_sales.append(sale_entry)
    fpo.pooled_sales = new_sales

    db.commit()
    db.refresh(fpo)
    return fpo
