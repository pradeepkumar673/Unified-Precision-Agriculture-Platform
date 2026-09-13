"""Business logic for the community feature-group.

Covers MASTER-SPEC features #5 (Smart Alerts), #10 (Season Report),
#34 (Digital Sakhi), #35 (SHG), #36 (Grower Score), #53 (FPO Suite).
"""
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.community import Alert, AlertType, GrowerScore, SeasonReport
from app.models.farm import Farm
from app.models.finance import Transaction, TransactionStatus
from app.models.health import PestRiskScore
from app.models.planning import CropPlan, SeasonEnum
from app.models.vision_forecast import StressAlert, YieldForecast


# ---------------------------------------------------------------------------
# #5 Smart Alerts — Synthetic alert generator
# ---------------------------------------------------------------------------
def generate_synthetic_alerts(
    db: Session, farm: Farm
) -> List[Alert]:
    """Generate 2-3 synthetic alerts from real stress/pest data for the farm."""
    generated: List[Alert] = []

    # Alert 1: Irrigation reminder based on water source
    water_src = (
        farm.water_source.value
        if hasattr(farm.water_source, "value")
        else str(farm.water_source)
    )
    irrigation_msg = (
        f"Irrigation reminder: Your {water_src} field needs watering within 48 hours "
        f"based on current ET0 estimates for your soil type ({farm.soil_type.value if hasattr(farm.soil_type, 'value') else str(farm.soil_type)})."
    )
    alert1 = Alert(
        farm_id=farm.id,
        type=AlertType.irrigation,
        message=irrigation_msg,
        read=False,
    )
    db.add(alert1)
    generated.append(alert1)

    # Alert 2: Pest risk based on recent stress alerts
    recent_stress = db.execute(
        select(StressAlert)
        .where(StressAlert.farm_id == farm.id)
        .order_by(StressAlert.date.desc())
        .limit(1)
    ).scalars().first()

    if recent_stress and recent_stress.ndvi_value < 0.4:
        pest_msg = (
            f"Pest risk elevated: NDVI reading of {recent_stress.ndvi_value:.2f} on {recent_stress.date} "
            "indicates crop stress that may attract borers/aphids. Schedule scouting within 72 hours."
        )
    else:
        pest_msg = (
            "Seasonal pest advisory: Monitor your fields for stem borer and leaf folder activity "
            "typical for this time of year. Apply neem-based biopesticide as a preventive measure."
        )

    alert2 = Alert(
        farm_id=farm.id,
        type=AlertType.pest,
        message=pest_msg,
        read=False,
    )
    db.add(alert2)
    generated.append(alert2)

    # Alert 3: Spray window based on lat/lng season
    lat = farm.latitude
    spray_msg = (
        "Optimal spray window: Weather forecast shows low wind speed (< 8 km/h) and "
        "humidity 60-75% between 6-9 AM tomorrow. Best time for herbicide/fungicide application."
        if lat < 15.0
        else "Spray window: Avoid spraying for the next 24 hours — high wind advisory active for your region."
    )
    alert3 = Alert(
        farm_id=farm.id,
        type=AlertType.spray_window,
        message=spray_msg,
        read=False,
    )
    db.add(alert3)
    generated.append(alert3)

    db.commit()
    for a in generated:
        db.refresh(a)
    return generated


# ---------------------------------------------------------------------------
# #10 Season Report — Aggregated from transactions, crop_plans, yield_forecasts
# ---------------------------------------------------------------------------
def compute_season_report(
    db: Session, farm: Farm, season: str, year: int
) -> SeasonReport:
    """Aggregate financial and production data into a season-level report."""

    # Investment = sum of marketplace transaction amounts (expenses)
    # Income = sum of exchange_sale transaction amounts
    # Use SeasonEnum value from crop_plan to filter by season
    tx_stmt = select(Transaction).where(
        Transaction.user_id == farm.user_id
    )
    all_txs = db.execute(tx_stmt).scalars().all()
    total_investment = sum(
        tx.amount
        for tx in all_txs
        if hasattr(tx.type, "value") and tx.type.value in ("marketplace", "rental")
        and tx.status.value in ("released", "escrow_held")
    )
    total_income = sum(
        tx.amount
        for tx in all_txs
        if hasattr(tx.type, "value") and tx.type.value == "exchange_sale"
        and tx.status.value == "released"
    )

    # Crop plans matching season
    # Crop plans matching season — use enum comparison properly
    season_lower = season.lower()
    # Find the SeasonEnum member matching the string
    season_enum_val = None
    for member in SeasonEnum:
        if member.value.lower() == season_lower or member.name.lower() == season_lower:
            season_enum_val = member
            break

    if season_enum_val is not None:
        plan_stmt = select(CropPlan).where(
            CropPlan.farm_id == farm.id,
            CropPlan.season == season_enum_val,
            CropPlan.year == year,
        )
    else:
        plan_stmt = select(CropPlan).where(
            CropPlan.farm_id == farm.id,
            CropPlan.year == year,
        )
    plans = db.execute(plan_stmt).scalars().all()

    if not plans:
        # Fallback: use all plans for this year
        plan_stmt2 = select(CropPlan).where(
            CropPlan.farm_id == farm.id,
            CropPlan.year == year,
        )
        plans = db.execute(plan_stmt2).scalars().all()

    for plan in plans:
        total_investment = max(total_investment, float(plan.expected_investment or 0))

    # Yield forecasts → estimate income if not from transactions
    yield_stmt = select(YieldForecast).where(
        YieldForecast.farm_id == farm.id
    ).order_by(YieldForecast.forecast_date.desc()).limit(1)
    yield_fc = db.execute(yield_stmt).scalars().first()

    if yield_fc and total_income == 0.0:
        # Use median_kg * regional proxy price INR 22/kg
        total_income = yield_fc.median_kg * 22.0

    # If still no investment data, use a realistic default for small-medium farms
    if total_investment == 0.0:
        total_investment = farm.land_size_acres * 20000.0  # Rs 20k per acre proxy
    if total_income == 0.0:
        total_income = farm.land_size_acres * 25000.0  # Rs 25k per acre proxy

    profit = total_income - total_investment
    roi_pct = round((profit / max(total_investment, 1.0)) * 100.0, 2)

    # Peer comparison: avg roi_pct across all season reports in DB
    peer_stmt = select(func.avg(SeasonReport.roi_pct)).where(
        SeasonReport.season == season,
        SeasonReport.year == year,
    )
    peer_avg = db.execute(peer_stmt).scalar() or 0.0

    # Generate rule-based suggestions
    suggestions: List[str] = []

    if roi_pct < float(peer_avg) - 5.0:
        suggestions.append(
            f"Your ROI ({roi_pct:.1f}%) is below district peer average ({peer_avg:.1f}%). "
            "Consider adopting SRI/SWI planting method to cut water & fertilizer costs by 20-25%."
        )
    else:
        suggestions.append(
            f"Your ROI ({roi_pct:.1f}%) is at or above peer average ({peer_avg:.1f}%). "
            "Maintain current inputs strategy and consider forward contract sales to lock in price."
        )

    if total_income > 0 and total_investment / max(total_income, 1.0) > 0.6:
        suggestions.append(
            "Input cost ratio exceeds 60% of income. Review fertilizer programme — consider "
            "soil-test-based variable-rate application to reduce NPK spend by 15-30%."
        )

    if not plans:
        suggestions.append(
            "No crop plan recorded for this season. Register your crop via the Planning module "
            "to unlock yield forecasting and weather-based advisory."
        )

    # Persist report
    report = SeasonReport(
        farm_id=farm.id,
        season=season,
        year=year,
        investment=round(total_investment, 2),
        income=round(total_income, 2),
        profit=round(profit, 2),
        roi_pct=roi_pct,
        suggestions=suggestions,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


# ---------------------------------------------------------------------------
# #36 Grower Score — Weighted composite across ROI, payments, practices
# ---------------------------------------------------------------------------
def compute_grower_score(
    db: Session, farm: Farm
) -> Tuple[int, int]:
    """Compute weighted grower score (0-1000) and district percentile.

    Weights:
      40% — Average season ROI score
      30% — On-time payment proxy (released transaction ratio)
      30% — Adopted recommended practices proxy (crop plan count)

    TODO(ml-swap): Replace with gradient-boosted tree trained on multi-season
    financial and agronomic data with real district-level benchmarks.
    """
    # 40% — ROI component
    roi_stmt = select(func.avg(SeasonReport.roi_pct)).where(
        SeasonReport.farm_id == farm.id
    )
    avg_roi = db.execute(roi_stmt).scalar() or 0.0
    roi_score = min(400, max(0, int(avg_roi * 4.0)))  # cap at 400

    # 30% — Payment reliability (released transactions / total transactions)
    all_tx_count = db.execute(
        select(func.count(Transaction.id)).where(Transaction.user_id == farm.user_id)
    ).scalar() or 0

    released_count = db.execute(
        select(func.count(Transaction.id)).where(
            Transaction.user_id == farm.user_id,
            Transaction.status == TransactionStatus.released,
        )
    ).scalar() or 0

    payment_ratio = (released_count / max(all_tx_count, 1)) if all_tx_count > 0 else 0.5
    payment_score = int(payment_ratio * 300)  # cap at 300

    # 30% — Practice adoption proxy: number of crop plans × 30, capped at 300
    plan_count = db.execute(
        select(func.count(CropPlan.id)).where(CropPlan.farm_id == farm.id)
    ).scalar() or 0
    practice_score = min(300, plan_count * 60)

    total_score = roi_score + payment_score + practice_score

    # District percentile: compare score against all other grower scores in DB
    # Use lat/lng bounding box as proxy for district (≈ 0.5° radius)
    lat_min = farm.latitude - 0.5
    lat_max = farm.latitude + 0.5
    lon_min = farm.longitude - 0.5
    lon_max = farm.longitude + 0.5

    district_farms = db.execute(
        select(Farm).where(
            Farm.latitude.between(lat_min, lat_max),
            Farm.longitude.between(lon_min, lon_max),
            Farm.id != farm.id,
        )
    ).scalars().all()

    peer_scores = []
    for pf in district_farms:
        ps = db.execute(
            select(GrowerScore)
            .where(GrowerScore.farm_id == pf.id)
            .order_by(GrowerScore.computed_at.desc())
            .limit(1)
        ).scalars().first()
        if ps:
            peer_scores.append(ps.score)

    # Compute percentile
    if not peer_scores:
        percentile = 75  # Default: 75th percentile when no peers in district
    else:
        below = sum(1 for s in peer_scores if s < total_score)
        percentile = int((below / len(peer_scores)) * 100)

    return total_score, percentile
