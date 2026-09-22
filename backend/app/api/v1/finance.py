"""API router for finance endpoints.

Covers MASTER-SPEC features #46, #47, #49, #50, #54, #28.
"""
import uuid
from typing import Any, Dict, List
from uuid import UUID

from fastapi import APIRouter, Body, Depends, HTTPException, Response, status, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.farm import Farm, User
from app.models.finance import (
    ClaimStatus,
    FraudFlag,
    InsuranceClaim,
    Loan,
    LoanStatus,
    Transaction,
    TransactionStatus,
    WarehouseBooking,
)
from app.schemas.finance import (
    ENWRGenerateResponse,
    FraudCheckRequest,
    FraudCheckResponse,
    InsuranceClaimCreate,
    InsuranceClaimRead,
    LoanApplyRequest,
    LoanApplyResponse,
    LoanRead,
    PaymentInitiateRequest,
    PaymentInitiateResponse,
    PaymentWebhookRequest,
    TransactionRead,
    WarehouseBookingCreate,
    WarehouseBookingRead,
)
from app.services.finance import (
    detect_transaction_anomaly,
    evaluate_loan_application,
    gather_claim_evidence,
    generate_ledger_pdf,
    generate_mock_enwr,
    handle_razorpay_webhook,
    initiate_razorpay_order,
)

router = APIRouter(prefix="/api/v1/finance", tags=["finance"])


# --------------------------------------------------------------------------- #
# #46 Payment Gateway & Razorpay Test Mode
# --------------------------------------------------------------------------- #
@router.post(
    "/payment/initiate",
    response_model=PaymentInitiateResponse,
    status_code=status.HTTP_200_OK,
)
def initiate_payment(
    payload: PaymentInitiateRequest,
    db: Session = Depends(get_db),
):
    """Initiate a Razorpay payment order and register a pending ledger transaction."""
    # Resolve target user_id
    user = None
    try:
        candidate_uuid = UUID(payload.related_entity_id)
        # Check if candidate_uuid is a User
        user = db.execute(select(User).where(User.id == candidate_uuid)).scalars().first()
        if not user:
            # Check if candidate_uuid is a Farm
            farm = db.execute(select(Farm).where(Farm.id == candidate_uuid)).scalars().first()
            if farm:
                user = db.execute(select(User).where(User.id == farm.user_id)).scalars().first()
    except ValueError:
        pass

    if not user:
        # Fallback to the first available user in the system
        user = db.execute(select(User)).scalars().first()
        if not user:
            # Create a default system user for demo purposes
            user = User(
                email="farmer_finance_demo@example.com",
                hashed_password="mock_password_hash",
                full_name="Demo Farmer",
            )
            db.add(user)
            db.commit()
            db.refresh(user)

    tx, rzp_order_id, checkout_url = initiate_razorpay_order(
        db=db,
        user_id=user.id,
        amount=payload.amount,
        tx_type=payload.type,
        related_entity_id=payload.related_entity_id,
    )

    return PaymentInitiateResponse(
        razorpay_order_id=rzp_order_id,
        checkout_url=checkout_url,
        transaction_id=tx.id,
        amount=tx.amount,
        status=tx.status.value if hasattr(tx.status, "value") else str(tx.status),
    )


@router.post("/payment/webhook")
def payment_webhook(
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
):
    """Receive and process Razorpay webhook callbacks."""
    event_name = payload.get("event", "payment.captured")
    event_payload = payload.get("payload", payload)

    tx = handle_razorpay_webhook(db, event_name, event_payload)

    return {
        "status": "ok",
        "event": event_name,
        "transaction_id": str(tx.id) if tx else None,
        "new_status": tx.status.value if tx and hasattr(tx.status, "value") else (str(tx.status) if tx else None),
    }


# --------------------------------------------------------------------------- #
# #47 Transaction Ledger & PDF Export
# --------------------------------------------------------------------------- #
@router.get("/ledger/{farm_id}", response_model=List[TransactionRead])
def get_ledger(
    farm_id: UUID,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Get ledger transactions for a user or farm."""
    # Check if farm_id is directly a User ID
    user = db.execute(select(User).where(User.id == farm_id)).scalars().first()
    target_user_id = farm_id

    if not user:
        # Check if farm_id is a Farm ID
        farm = db.execute(select(Farm).where(Farm.id == farm_id)).scalars().first()
        if farm:
            target_user_id = farm.user_id

    stmt = (
        select(Transaction)
        .where(Transaction.user_id == target_user_id)
        .order_by(Transaction.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    transactions = db.execute(stmt).scalars().all()
    return transactions


@router.get("/ledger/{farm_id}/export")
def export_ledger_pdf(
    farm_id: UUID,
    db: Session = Depends(get_db),
):
    """Export farmer ledger as a downloadable ReportLab PDF."""
    user = db.execute(select(User).where(User.id == farm_id)).scalars().first()
    farm = None

    if not user:
        farm = db.execute(select(Farm).where(Farm.id == farm_id)).scalars().first()
        if farm:
            user = db.execute(select(User).where(User.id == farm.user_id)).scalars().first()

    if not user:
        # Fallback dummy user for export
        user = User(
            id=farm_id,
            email="farmer@example.com",
            hashed_password="mock",
            full_name="Farmer Member",
        )

    # Fetch transactions
    stmt = (
        select(Transaction)
        .where(Transaction.user_id == user.id)
        .order_by(Transaction.created_at.desc())
    )
    transactions = db.execute(stmt).scalars().all()

    pdf_bytes = generate_ledger_pdf(user, farm, transactions)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=ledger_{farm_id}.pdf"
        },
    )


# --------------------------------------------------------------------------- #
# #49 Cold Storage & Receipt Financing (e-NWR)
# --------------------------------------------------------------------------- #
@router.post(
    "/warehouse/book",
    response_model=WarehouseBookingRead,
    status_code=status.HTTP_201_CREATED,
)
def book_warehouse(
    payload: WarehouseBookingCreate,
    db: Session = Depends(get_db),
):
    """Book cold storage / warehouse space."""
    farm = db.execute(select(Farm).where(Farm.id == payload.farm_id)).scalars().first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    booking = WarehouseBooking(
        farm_id=payload.farm_id,
        facility_id=payload.facility_id,
        qty_kg=payload.qty_kg,
        quality_grade=payload.quality_grade,
        e_nwr_id=None,
        loan_eligible=False,
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


@router.post(
    "/warehouse/{booking_id}/generate-enwr",
    response_model=ENWRGenerateResponse,
)
def generate_enwr(
    booking_id: UUID,
    db: Session = Depends(get_db),
):
    """Generate WDRA electronic Negotiable Warehouse Receipt (e-NWR)."""
    booking = db.execute(
        select(WarehouseBooking).where(WarehouseBooking.id == booking_id)
    ).scalars().first()
    if not booking:
        raise HTTPException(status_code=404, detail="Warehouse booking not found")

    enwr_id = generate_mock_enwr(booking.facility_id, booking.id)
    booking.e_nwr_id = enwr_id
    booking.loan_eligible = True

    db.commit()
    db.refresh(booking)

    return ENWRGenerateResponse(
        id=booking.id,
        farm_id=booking.farm_id,
        facility_id=booking.facility_id,
        qty_kg=booking.qty_kg,
        quality_grade=booking.quality_grade,
        e_nwr_id=booking.e_nwr_id,
        loan_eligible=booking.loan_eligible,
        created_at=booking.created_at,
        is_mock=True,
    )


# --------------------------------------------------------------------------- #
# #50 Credit Marketplace & Scoring
# --------------------------------------------------------------------------- #
@router.post(
    "/loan/apply",
    response_model=LoanApplyResponse,
    status_code=status.HTTP_201_CREATED,
)
def apply_loan(
    payload: LoanApplyRequest,
    db: Session = Depends(get_db),
):
    """Apply for agricultural microcredit with automated scoring."""
    farm = db.execute(select(Farm).where(Farm.id == payload.farm_id)).scalars().first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    score, approved, top_factors, terms = evaluate_loan_application(
        db, farm, payload.amount
    )

    loan = Loan(
        farm_id=farm.id,
        amount=payload.amount,
        credit_score=score,
        status=LoanStatus.approved if approved else LoanStatus.applied,
        lender="AgriFinance Partner Network",
        top_factors=top_factors,
        terms=terms,
    )
    db.add(loan)
    db.commit()
    db.refresh(loan)

    return LoanApplyResponse(
        id=loan.id,
        farm_id=loan.farm_id,
        amount=loan.amount,
        credit_score=loan.credit_score,
        approved=approved,
        status=loan.status,
        top_factors=top_factors,
        terms=terms,
    )


# --------------------------------------------------------------------------- #
# #54 Insurance Claims
# --------------------------------------------------------------------------- #
@router.post(
    "/insurance/claim",
    response_model=InsuranceClaimRead,
    status_code=status.HTTP_201_CREATED,
)
def file_insurance_claim(
    payload: InsuranceClaimCreate,
    db: Session = Depends(get_db),
):
    """File parametric/indemnity crop insurance claim with auto-gathered evidence."""
    farm = db.execute(select(Farm).where(Farm.id == payload.farm_id)).scalars().first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    evidence = gather_claim_evidence(
        db, farm.id, payload.loss_event_date, payload.photo_paths
    )

    claim = InsuranceClaim(
        farm_id=farm.id,
        policy_id=payload.policy_id,
        loss_event_date=payload.loss_event_date,
        evidence=evidence,
        status=ClaimStatus.filed,
        settlement_amount=None,
    )
    db.add(claim)
    db.commit()
    db.refresh(claim)
    return claim


@router.get("/insurance/claim/{claim_id}", response_model=InsuranceClaimRead)
def get_insurance_claim(
    claim_id: UUID,
    db: Session = Depends(get_db),
):
    """Retrieve insurance claim status and attached evidence."""
    claim = db.execute(
        select(InsuranceClaim).where(InsuranceClaim.id == claim_id)
    ).scalars().first()
    if not claim:
        raise HTTPException(status_code=404, detail="Insurance claim not found")
    return claim


# --------------------------------------------------------------------------- #
# #28 Anomaly Detection & Fraud Prevention
# --------------------------------------------------------------------------- #
@router.post("/fraud-check", response_model=FraudCheckResponse)
def fraud_check(
    payload: FraudCheckRequest,
    db: Session = Depends(get_db),
):
    """Run anomaly detection scoring on a financial transaction."""
    score, flagged = detect_transaction_anomaly(db, payload.transaction_id)
    return FraudCheckResponse(
        transaction_id=payload.transaction_id,
        anomaly_score=score,
        flagged=flagged,
    )
