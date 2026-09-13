"""Business logic, integrations, and credit scoring for the finance feature-group.

Covers MASTER-SPEC features #46, #47, #49, #50, #54, #28.
"""
import io
import random
import uuid
from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

import razorpay
from fastapi import HTTPException
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.farm import Farm, User
from app.models.finance import (
    ClaimStatus,
    FraudFlag,
    InsuranceClaim,
    Loan,
    LoanStatus,
    Transaction,
    TransactionStatus,
    TransactionType,
    WarehouseBooking,
)
from app.models.health import DiseaseReport
from app.models.planning import CropPlan, PlanStatusEnum
from app.models.vision_forecast import StressAlert


# --------------------------------------------------------------------------- #
# #46 Payment Gateway (Razorpay SDK)
# --------------------------------------------------------------------------- #
def initiate_razorpay_order(
    db: Session,
    user_id: uuid.UUID,
    amount: float,
    tx_type: TransactionType,
    related_entity_id: str,
) -> Tuple[Transaction, str, str]:
    """Initiate a real Razorpay test-mode order and create a pending transaction."""
    # Create initial pending transaction
    tx = Transaction(
        user_id=user_id,
        type=tx_type,
        amount=amount,
        status=TransactionStatus.pending,
        related_entity_id=related_entity_id,
        tag="rzp_order:pending",
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)

    try:
        client = razorpay.Client(
            auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
        )
        receipt_id = f"rcpt_{tx.id.hex[:12]}"
        order_data = {
            "amount": int(round(amount * 100)),  # in paise
            "currency": "INR",
            "receipt": receipt_id,
            "notes": {
                "transaction_id": str(tx.id),
                "user_id": str(user_id),
                "type": tx_type.value,
                "related_entity_id": str(related_entity_id),
            },
        }
        order = client.order.create(data=order_data)
        razorpay_order_id = order.get("id", f"order_{uuid.uuid4().hex[:14]}")
        checkout_url = f"https://rzp.io/i/{razorpay_order_id}"

        tx.tag = f"rzp_order:{razorpay_order_id}"
        db.commit()
        db.refresh(tx)

        return tx, razorpay_order_id, checkout_url

    except Exception as exc:
        # If Razorpay cannot be reached (e.g. mock keys or offline test environment)
        raise HTTPException(
            status_code=502,
            detail=f"Could not reach Razorpay: {str(exc)}",
        )


def handle_razorpay_webhook(
    db: Session, event_name: str, payload: Dict[str, Any]
) -> Optional[Transaction]:
    """Process incoming Razorpay webhook events and update escrow/transaction state."""
    payment_entity = payload.get("payment", {}).get("entity", {})
    order_id = payment_entity.get("order_id")

    if not order_id:
        return None

    # Search by tag match
    stmt = select(Transaction).where(Transaction.tag == f"rzp_order:{order_id}")
    tx = db.execute(stmt).scalars().first()

    if not tx:
        # Fallback search if tag contains order_id
        stmt = select(Transaction).where(Transaction.tag.contains(order_id))
        tx = db.execute(stmt).scalars().first()

    if not tx:
        return None

    if event_name in ["payment.captured", "order.paid"]:
        tx.status = TransactionStatus.released
    elif event_name in ["payment.authorized"]:
        tx.status = TransactionStatus.escrow_held
    elif event_name in ["payment.failed", "refund.processed"]:
        tx.status = TransactionStatus.refunded

    db.commit()
    db.refresh(tx)
    return tx


# --------------------------------------------------------------------------- #
# #47 Transaction Ledger Export (ReportLab PDF)
# --------------------------------------------------------------------------- #
def generate_ledger_pdf(
    user: User, farm: Optional[Farm], transactions: List[Transaction]
) -> bytes:
    """Generate a clean, professional PDF ledger export for a farmer."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()
    title_style = styles["Heading1"]
    title_style.textColor = colors.HexColor("#1b4332")
    normal_style = styles["Normal"]

    story = []

    # Header
    story.append(Paragraph("<b>Unified Precision Agriculture Platform</b>", title_style))
    story.append(Paragraph("<b>Farmer Transaction Ledger & Financial Statement</b>", styles["Heading2"]))
    story.append(Spacer(1, 12))

    # Farmer / Farm Details
    farm_name = farm.name if farm else "N/A"
    land_size = f"{farm.land_size_acres} Acres" if farm else "N/A"
    farmer_info = f"""
    <b>Farmer Name:</b> {user.full_name}<br/>
    <b>Email:</b> {user.email}<br/>
    <b>Farm:</b> {farm_name} ({land_size})<br/>
    <b>Statement Date:</b> {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}<br/>
    """
    story.append(Paragraph(farmer_info, normal_style))
    story.append(Spacer(1, 16))

    # Table Header & Data
    table_data = [
        ["Date", "Type", "Amount (INR)", "Status", "Reference / Tag"]
    ]

    for tx in transactions:
        created_str = (
            tx.created_at.strftime("%Y-%m-%d %H:%M")
            if tx.created_at
            else "N/A"
        )
        table_data.append([
            created_str,
            tx.type.value if hasattr(tx.type, "value") else str(tx.type),
            f"₹{tx.amount:,.2f}",
            tx.status.value if hasattr(tx.status, "value") else str(tx.status),
            tx.tag or tx.related_entity_id,
        ])

    table = Table(table_data, colWidths=[110, 95, 95, 90, 150])
    table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2d6a4f")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 10),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
            ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#f8f9fa")),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#dee2e6")),
            ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
            ("FONTSIZE", (0, 1), (-1, -1), 9),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f1f5f9")]),
        ])
    )

    story.append(table)
    story.append(Spacer(1, 20))
    story.append(
        Paragraph(
            "<i>This is an electronically generated statement from the Unified Precision Agriculture Platform.</i>",
            styles["Italic"],
        )
    )

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes


# --------------------------------------------------------------------------- #
# #49 WDRA Electronic Negotiable Warehouse Receipt (Mock Adapter)
# --------------------------------------------------------------------------- #
def generate_mock_enwr(facility_id: str, booking_id: uuid.UUID) -> str:
    """Generate a realistic mock e-NWR ID string.

    MOCK WDRA ADAPTER:
    In production, this connects to the Warehousing Development and Regulatory
    Authority (WDRA) e-NWR repository via CCRL/NERL APIs.
    """
    clean_fac = "".join(ch for ch in facility_id if ch.isalnum()).upper()[:6]
    year = datetime.now().year
    rand_seq = random.randint(10000000, 99999999)
    return f"WDRA-ENWR-{clean_fac}-{year}-{rand_seq}"


# --------------------------------------------------------------------------- #
# #50 Credit Marketplace (Credit Score Engine)
# --------------------------------------------------------------------------- #
def evaluate_loan_application(
    db: Session, farm: Farm, amount: float
) -> Tuple[int, bool, List[Dict[str, Any]], Dict[str, Any]]:
    """Evaluate farm creditworthiness and generate scoring breakdown.

    TODO(ml-swap): Swap rule-based credit engine with XGBoost Classifier trained on
    historical seasonal yield, mandi price volatility, and microfinance repayment records.
    """
    base_score = 600
    top_factors: List[Dict[str, Any]] = [
        {"factor": "base_score", "impact": 600}
    ]

    # Rule 1: +50 if farm has > 2 completed crop plans
    stmt_plans = select(func.count(CropPlan.id)).where(
        CropPlan.farm_id == farm.id,
        CropPlan.status == PlanStatusEnum.harvested,
    )
    harvested_count = db.execute(stmt_plans).scalar() or 0

    if harvested_count >= 2:
        base_score += 50
        top_factors.append({"factor": "harvest_track_record", "impact": 50})

    # Rule 2: +30 if no fraud flags on user transactions
    stmt_fraud = (
        select(func.count(FraudFlag.id))
        .join(Transaction, FraudFlag.transaction_id == Transaction.id)
        .where(
            Transaction.user_id == farm.user_id,
            FraudFlag.flagged == True,  # noqa: E712
        )
    )
    fraud_count = db.execute(stmt_fraud).scalar() or 0

    if fraud_count == 0:
        base_score += 30
        top_factors.append({"factor": "no_fraud_flags", "impact": 30})
    else:
        base_score -= 50
        top_factors.append({"factor": "fraud_warning_history", "impact": -50})

    # Rule 3: -100 if land_size_acres < 1.0
    if farm.land_size_acres < 1.0:
        base_score -= 100
        top_factors.append({"factor": "marginal_land_holding", "impact": -100})

    final_score = max(300, min(900, base_score))
    approved = final_score >= 650

    terms = None
    if approved:
        interest_rate = round(8.5 + (900 - final_score) * 0.01, 2)
        terms = {
            "interest_rate_pct": interest_rate,
            "tenure_months": 12,
            "monthly_emi": round((amount * (1 + interest_rate / 100)) / 12, 2),
            "collateral_required": False,
        }

    return final_score, approved, top_factors, terms


# --------------------------------------------------------------------------- #
# #54 Insurance Claim Evidence Aggregator
# --------------------------------------------------------------------------- #
def gather_claim_evidence(
    db: Session, farm_id: uuid.UUID, loss_event_date: date, photo_paths: List[str]
) -> Dict[str, Any]:
    """Pull stress alerts and disease reports surrounding loss event date."""
    date_min = loss_event_date - timedelta(days=30)
    date_max = loss_event_date + timedelta(days=30)

    # Fetch stress alerts
    stmt_stress = select(StressAlert).where(
        StressAlert.farm_id == farm_id,
        StressAlert.date >= date_min,
        StressAlert.date <= date_max,
    )
    stress_alerts = db.execute(stmt_stress).scalars().all()

    # Fetch disease reports
    stmt_disease = select(DiseaseReport).where(
        DiseaseReport.farm_id == farm_id,
        func.date(DiseaseReport.created_at) >= date_min,
        func.date(DiseaseReport.created_at) <= date_max,
    )
    disease_reports = db.execute(stmt_disease).scalars().all()

    evidence = {
        "stress_alerts": [
            {
                "id": str(a.id),
                "date": str(a.date),
                "ndvi": a.ndvi_value,
                "stress_level": a.stress_level.value if hasattr(a.stress_level, "value") else str(a.stress_level),
            }
            for a in stress_alerts
        ],
        "disease_reports": [
            {
                "id": str(d.id),
                "crop": d.crop,
                "disease": d.predicted_disease,
                "severity": d.severity.value if hasattr(d, "severity") and hasattr(d.severity, "value") else "medium",
            }
            for d in disease_reports
        ],
        "photo_paths": photo_paths,
    }
    return evidence


# --------------------------------------------------------------------------- #
# #28 Anomaly Detection (Rule-based / Isolation Forest hook)
# --------------------------------------------------------------------------- #
def detect_transaction_anomaly(
    db: Session, transaction_id: uuid.UUID
) -> Tuple[float, bool]:
    """Rule-based anomaly detection on transaction amounts.

    TODO(ml-swap): Swap with scikit-learn IsolationForest or PyOD COPOD model
    trained on multi-dimensional transaction velocity and geolocation vectors.
    """
    tx = db.execute(
        select(Transaction).where(Transaction.id == transaction_id)
    ).scalars().first()

    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # Fetch other transactions by user
    stmt_others = select(Transaction.amount).where(
        Transaction.user_id == tx.user_id,
        Transaction.id != tx.id,
    )
    past_amounts = db.execute(stmt_others).scalars().all()

    if past_amounts:
        avg_amount = sum(past_amounts) / len(past_amounts)
        ratio = round(tx.amount / max(avg_amount, 1.0), 2)
        if tx.amount > 3.0 * avg_amount:
            flagged = True
            anomaly_score = ratio
        else:
            flagged = False
            anomaly_score = ratio
    else:
        # Single transaction baseline
        if tx.amount > 100000.0:
            flagged = True
            anomaly_score = 4.5
        else:
            flagged = False
            anomaly_score = 1.0

    # Persist fraud flag record
    flag_rec = FraudFlag(
        transaction_id=tx.id,
        anomaly_score=anomaly_score,
        flagged=flagged,
    )
    db.add(flag_rec)
    db.commit()
    db.refresh(flag_rec)

    return anomaly_score, flagged
