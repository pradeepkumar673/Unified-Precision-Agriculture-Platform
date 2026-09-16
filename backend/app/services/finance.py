"""Business logic, integrations, and credit scoring for the finance feature-group.

Covers MASTER-SPEC features #46, #47, #49, #50, #54, #28.
  #50 Credit Scoring      -- XGBoost + SHAP  (credit_xgb.pkl)
  #28 Anomaly Detection   -- Isolation Forest (anomaly_iforest.pkl)
"""
import io
import os
import pickle
import random
import sys
import uuid
from pathlib import Path

os.environ.setdefault("CUDA_VISIBLE_DEVICES", "")
_ML_DIR = Path(__file__).resolve().parents[2] / "ml_models"
_BE_DIR = Path(__file__).resolve().parents[2]
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

    if not settings.RAZORPAY_KEY_ID or settings.RAZORPAY_KEY_ID == "rzp_test_mock":
        raise HTTPException(
            status_code=503,
            detail={"error": "Razorpay keys not configured", "is_mock": True},
        )

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
    """Evaluate farm creditworthiness using the trained XGBoost credit scorer.

    Returns (credit_score 300-900, approved, top_factors, loan_terms).
    Falls back to rule-based engine if model files are unavailable.
    """
    # ── Gather DB signals ────────────────────────────────────────────────────
    stmt_plans = select(func.count(CropPlan.id)).where(
        CropPlan.farm_id == farm.id,
        CropPlan.status == PlanStatusEnum.harvested,
    )
    harvested_count = db.execute(stmt_plans).scalar() or 0

    stmt_fraud = (
        select(func.count(FraudFlag.id))
        .join(Transaction, FraudFlag.transaction_id == Transaction.id)
        .where(
            Transaction.user_id == farm.user_id,
            FraudFlag.flagged == True,  # noqa: E712
        )
    )
    fraud_count = db.execute(stmt_fraud).scalar() or 0

    stmt_tx = select(func.count(Transaction.id)).where(
        Transaction.user_id == farm.user_id,
    )
    tx_count = db.execute(stmt_tx).scalar() or 0

    try:
        sys.path.insert(0, str(_BE_DIR))
        from train_credit_scoring import score as credit_score_fn
        from app.services.vision_forecast import estimate_climate_risk, estimate_yield

        # Get real climate risk
        climate_res = estimate_climate_risk(farm.latitude, farm.longitude, horizon_years=1)
        # We can map overall_risk to district_risk_score (0-1)
        district_risk_score = climate_res.get("overall_risk", 0.3)
        
        # Get real yield prediction to derive yield_score
        # We assume a default crop "rice" if no plan is found
        yield_res = estimate_yield("rice", farm.land_size_acres)
        # Yield score can be approximated by comparing median to a baseline (e.g., 2000kg/acre)
        yield_score = min(1.0, max(0.0, yield_res["median_kg"] / (farm.land_size_acres * 2500)))

        loan_size_norm = min(1.0, amount / 500000.0)
        features = {
            "crop_plan_adherence":      min(1.0, harvested_count / 5.0),
            "yield_score":              yield_score,
            "yield_consistency":        0.6,  # Still hard to compute without historical array
            "txn_ledger_consistency":   min(1.0, tx_count / 20.0),
            "repayment_history":        max(0.0, 1.0 - fraud_count * 0.5),
            "n_loans_taken":            min(15, tx_count // 5),
            "loan_size_norm":           loan_size_norm,
            "income_stability":         min(1.0, farm.land_size_acres / 10.0),
            "district_risk_score":      district_risk_score,
            "land_holding_ha":          farm.land_size_acres * 0.4047,
        }
        result      = credit_score_fn(features)
        final_score = int(result["credit_score"])
        approved    = final_score >= 650

        top_factors: List[Dict[str, Any]] = [
            {
                "factor":    f["label"],
                "impact":    int(f["shap_value"] * 100),
                "direction": f["direction"],
            }
            for f in result.get("top_factors", [])[:3]
        ]
        model_type = "xgboost_trained"

    except Exception:
        # ── Rule-based fallback ──────────────────────────────────────────────
        base_score = 600
        top_factors = [{"factor": "base_score", "impact": 600, "direction": "positive"}]

        if harvested_count >= 2:
            base_score += 50
            top_factors.append({"factor": "harvest_track_record", "impact": 50, "direction": "positive"})
        if fraud_count == 0:
            base_score += 30
            top_factors.append({"factor": "no_fraud_flags", "impact": 30, "direction": "positive"})
        else:
            base_score -= 50
            top_factors.append({"factor": "fraud_warning_history", "impact": -50, "direction": "negative"})
        if farm.land_size_acres < 1.0:
            base_score -= 100
            top_factors.append({"factor": "marginal_land_holding", "impact": -100, "direction": "negative"})

        final_score = max(300, min(900, base_score))
        approved    = final_score >= 650
        model_type  = "rule_based_fallback"

    terms = None
    if approved:
        interest_rate = round(8.5 + (900 - final_score) * 0.01, 2)
        terms = {
            "interest_rate_pct":  interest_rate,
            "tenure_months":      12,
            "monthly_emi":        round((amount * (1 + interest_rate / 100)) / 12, 2),
            "collateral_required": False,
            "model_type":         model_type,
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
# #28 Anomaly Detection — Isolation Forest
# --------------------------------------------------------------------------- #
def detect_transaction_anomaly(
    db: Session, transaction_id: uuid.UUID
) -> Tuple[float, bool]:
    """Detect anomalous transactions using the trained Isolation Forest model.

    Builds feature vector from DB transaction context and calls the trained
    anomaly_iforest.pkl model.  Falls back to ratio heuristic if unavailable.
    """
    tx = db.execute(
        select(Transaction).where(Transaction.id == transaction_id)
    ).scalars().first()

    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # Fetch user's transaction history for context features
    stmt_others = select(Transaction.amount, Transaction.created_at).where(
        Transaction.user_id == tx.user_id,
        Transaction.id != tx.id,
    ).order_by(Transaction.created_at.desc()).limit(50)
    past_txns = db.execute(stmt_others).all()
    past_amounts = [float(r.amount) for r in past_txns]

    try:
        sys.path.insert(0, str(_BE_DIR))
        from train_anomaly_detection import flag as anomaly_flag

        avg_amount = sum(past_amounts) / len(past_amounts) if past_amounts else float(tx.amount)
        qty_ratio  = float(tx.amount) / max(avg_amount, 1.0)

        # Compute time-since-last feature
        if past_txns:
            last_ts = past_txns[0].created_at
            now_ts  = tx.created_at if tx.created_at else __import__("datetime").datetime.utcnow()
            hours_since = max(0.01, (now_ts - last_ts).total_seconds() / 3600.0)
        else:
            hours_since = 24.0

        features = {
            "amount_rs":               float(tx.amount),
            "quality_grade_reported":  2,
            "time_since_last_txn_h":   hours_since,
            "buyer_txn_frequency":     min(50.0, len(past_amounts) / max(1, 4)),
            "farmer_txn_frequency":    min(30.0, len(past_amounts) / max(1, 8)),
            "price_per_kg":            float(tx.amount) / 100.0,
            "quantity_kg":             100.0,
            "quantity_to_avg_ratio":   qty_ratio,
            "grade_vs_history":        0.0,
            "hour_of_day":             (tx.created_at.hour if tx.created_at else 10),
        }
        result       = anomaly_flag(features, model_dir=str(_ML_DIR))
        flagged       = bool(result["is_anomaly"])
        model_score   = float(result["anomaly_score"])
        anomaly_score = max(model_score, qty_ratio) if flagged else model_score
        return anomaly_score, flagged

    except Exception:
        # ── Ratio-based fallback ─────────────────────────────────────────────
        if past_amounts:
            avg_amount    = sum(past_amounts) / len(past_amounts)
            anomaly_score = round(float(tx.amount) / max(avg_amount, 1.0), 2)
            flagged       = float(tx.amount) > 3.0 * avg_amount
        else:
            if float(tx.amount) > 100000.0:
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
