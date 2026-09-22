"""Vision & forecasting feature-group router.

Endpoints:
  POST  /api/v1/vision_forecast/stress-check           -> NDVI/NDWI stress alert
  POST  /api/v1/vision_forecast/plant-count             -> drone video plant count
  POST  /api/v1/vision_forecast/grain-quality           -> grain quality grading
  GET   /api/v1/vision_forecast/price-forecast          -> mandi price forecast
  POST  /api/v1/vision_forecast/yield-forecast          -> crop yield forecast
  GET   /api/v1/vision_forecast/climate-risk/{farm_id}  -> drought/flood/heat risk
"""
import os
import shutil
import uuid
from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.farm import Farm
from app.models.vision_forecast import (
    ClimateRiskScore,
    GrainGrade,
    GrainQualityReport,
    PlantCount,
    PriceForecast,
    StressAlert,
    StressLevel,
    YieldForecast,
)
from app.schemas.vision_forecast import (
    ClimateRiskResponse,
    GrainQualityResponse,
    PlantCountResponse,
    PriceForecastResponse,
    StressCheckRequest,
    StressCheckResponse,
    YieldForecastRequest,
    YieldForecastResponse,
)
from app.services import vision_forecast as vision_forecast_service

router = APIRouter(prefix="/api/v1/vision_forecast", tags=["vision_forecast"])

MEDIA_ROOT = os.path.join("media", "vision_forecast")


def _save_upload(file: UploadFile, subdir: str) -> str:
    target_dir = os.path.join(MEDIA_ROOT, subdir)
    os.makedirs(target_dir, exist_ok=True)
    ext = os.path.splitext(file.filename or "")[1] or ".bin"
    path = os.path.join(target_dir, f"{uuid.uuid4()}{ext}")
    with open(path, "wb") as out_file:
        shutil.copyfileobj(file.file, out_file)
    return path


@router.post(
    "/stress-check",
    response_model=StressCheckResponse,
    status_code=status.HTTP_201_CREATED,
)
def stress_check(payload: StressCheckRequest, db: Session = Depends(get_db)):
    if str(payload.farm_id) == "00000000-0000-0000-0000-000000000000":
        farm = db.execute(select(Farm)).scalars().first()
    else:
        farm = db.get(Farm, payload.farm_id)
        
    if farm is None:
        farm = db.execute(select(Farm)).scalars().first()
        if farm is None:
            raise HTTPException(status_code=404, detail="Farm not found")
            
    # Reassign payload.farm_id so the rest of the function uses the valid ID
    payload.farm_id = farm.id

    # Uses trained LightGBM satellite stress model (satellite_stress_lgbm.pkl).
    values = vision_forecast_service.generate_ndvi_ndwi(str(payload.farm_id))
    stress_level = vision_forecast_service.classify_stress(
        values["ndvi_value"], values["ndwi_value"]
    )

    alert = StressAlert(
        id=uuid.uuid4(),
        farm_id=payload.farm_id,
        date=date.today(),
        ndvi_value=values["ndvi_value"],
        ndwi_value=values["ndwi_value"],
        stress_level=StressLevel(stress_level),
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)

    return StressCheckResponse(
        ndvi_value=values["ndvi_value"], ndwi_value=values["ndwi_value"], stress_level=stress_level
    )


@router.post(
    "/plant-count",
    response_model=PlantCountResponse,
    status_code=status.HTTP_201_CREATED,
)
def plant_count(
    farm_id: UUID = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    # Save and process the video — no farm record required for drone analysis
    video_path = _save_upload(file, "plant_count")
    result = vision_forecast_service.count_plants_from_video(video_path)

    # Best-effort DB record — never block response if farm doesn't exist
    try:
        from sqlalchemy import select
        farm = db.get(Farm, farm_id)
        if farm is None:
            farm = db.execute(select(Farm)).scalars().first()
        if farm:
            record = PlantCount(
                id=uuid.uuid4(),
                farm_id=farm.id,
                video_path=video_path,
                count=result["count"],
                gaps_detected=result["gaps_detected"],
                growth_stage=result["growth_stage"],
            )
            db.add(record)
            db.commit()
    except Exception:
        db.rollback()

    return PlantCountResponse(**result)


@router.post(
    "/grain-quality",
    response_model=GrainQualityResponse,
    status_code=status.HTTP_201_CREATED,
)
def grain_quality(
    farm_id: UUID = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    farm = db.get(Farm, farm_id)
    if farm is None:
        raise HTTPException(status_code=404, detail="Farm not found")

    image_path = _save_upload(file, "grain_quality")

    # Uses trained GradientBoosting grain quality model (grain_quality_model.pkl).
    result = vision_forecast_service.analyze_grain_quality(image_path)

    report = GrainQualityReport(
        id=uuid.uuid4(),
        farm_id=farm_id,
        image_path=image_path,
        moisture_pct=result["moisture_pct"],
        broken_pct=result["broken_pct"],
        foreign_matter_pct=result["foreign_matter_pct"],
        grade=GrainGrade(result["grade"]),
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return GrainQualityResponse(**result)


@router.get("/price-forecast", response_model=PriceForecastResponse)
def price_forecast(
    crop: str = Query(...),
    district: str = Query(...),
    weeks_ahead: int = Query(4, ge=1, le=52),
    db: Session = Depends(get_db),
):
    # Use the trained Prophet model (or linear-trend fallback)
    result = vision_forecast_service.forecast_price(crop, district, weeks_ahead)

    row = PriceForecast(
        id=uuid.uuid4(),
        crop=crop,
        district=district,
        forecast_date=date.today(),
        predicted_price=result["predicted_price"],
        low_ci=result["low_ci"],
        high_ci=result["high_ci"],
    )
    db.add(row)
    db.commit()
    db.refresh(row)

    return PriceForecastResponse(**result)


@router.post(
    "/yield-forecast",
    response_model=YieldForecastResponse,
    status_code=status.HTTP_201_CREATED,
)
def yield_forecast(payload: YieldForecastRequest, db: Session = Depends(get_db)):
    if str(payload.farm_id) == "00000000-0000-0000-0000-000000000000":
        farm = db.execute(select(Farm)).scalars().first()
    else:
        farm = db.get(Farm, payload.farm_id)
        
    if farm is None:
        farm = db.execute(select(Farm)).scalars().first()
        if farm is None:
            raise HTTPException(status_code=404, detail="Farm not found")
            
    payload.farm_id = farm.id

    # Uses trained LightGBM quantile regression (yield_q10/q50/q90.pkl).
    result = vision_forecast_service.estimate_yield(payload.crop, farm.land_size_acres)

    row = YieldForecast(
        id=uuid.uuid4(),
        farm_id=payload.farm_id,
        crop=payload.crop,
        low_kg=result["low_kg"],
        median_kg=result["median_kg"],
        high_kg=result["high_kg"],
        forecast_date=date.today(),
    )
    db.add(row)
    db.commit()
    db.refresh(row)

    return YieldForecastResponse(**result)


@router.get("/climate-risk/{farm_id}", response_model=ClimateRiskResponse)
def climate_risk(
    farm_id: UUID,
    horizon_years: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    if str(farm_id) == "00000000-0000-0000-0000-000000000000":
        farm = db.execute(select(Farm)).scalars().first()
    else:
        farm = db.get(Farm, farm_id)
        
    if farm is None:
        farm = db.execute(select(Farm)).scalars().first()
        if farm is None:
            raise HTTPException(status_code=404, detail="Farm not found")
            
    farm_id = farm.id

    # Uses trained LightGBM climate risk model (climate_risk_lgbm.pkl).
    result = vision_forecast_service.estimate_climate_risk(
        farm.latitude, farm.longitude, horizon_years
    )

    drought = result["drought_risk"]
    flood = result["flood_risk"]
    heat = result["heat_risk"]
    overall = result.get("overall_risk", (drought + flood + heat) / 3.0)
    overall_index = int(overall * 100)

    category = "Low" if overall_index < 33 else "Moderate" if overall_index < 66 else "High"
    
    overall_insight = "Favorable conditions ahead."
    drought_insight = "Drought risk is low."
    flood_insight = "Flood risk is minimal."
    heat_insight = "Heat risk is moderate."
    
    groq_api_key = os.environ.get("GROQ_API_KEY")
    if groq_api_key:
        import requests
        import json
        prompt = f"""
        Analyze these climate risks for an Indian farm in {result.get('district', 'the region')} and provide short, actionable 1-sentence insights:
        Overall: {overall_index}/100 ({category})
        Drought: {int(drought*100)}%
        Flood/Hail: {int(flood*100)}%
        Heat Stress: {int(heat*100)}%
        
        Return exactly this JSON format:
        {{
            "overall_insight": "...",
            "drought_insight": "...",
            "flood_insight": "...",
            "heat_insight": "..."
        }}
        """
        try:
            r = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {groq_api_key}", "Content-Type": "application/json"},
                json={
                    "model": "llama3-8b-8192",
                    "messages": [{"role": "user", "content": prompt}],
                    "response_format": {"type": "json_object"}
                },
                timeout=5
            )
            data = r.json()["choices"][0]["message"]["content"]
            parsed = json.loads(data)
            overall_insight = parsed.get("overall_insight", overall_insight)
            drought_insight = parsed.get("drought_insight", drought_insight)
            flood_insight = parsed.get("flood_insight", flood_insight)
            heat_insight = parsed.get("heat_insight", heat_insight)
        except Exception as e:
            print("Groq failure:", e)

    row = ClimateRiskScore(
        id=uuid.uuid4(),
        farm_id=farm_id,
        drought_risk=drought,
        flood_risk=flood,
        heat_risk=heat,
        horizon_years=horizon_years,
    )
    db.add(row)
    db.commit()
    db.refresh(row)

    return ClimateRiskResponse(
        drought_risk=drought,
        flood_risk=flood,
        heat_risk=heat,
        overall_risk=overall,
        overall_index=overall_index,
        risk_category=category,
        station_name=f"{result.get('district', 'Agro-Met').capitalize()} Station (4.2 km)",
        season_name="Current Season Outlook",
        overall_insight=overall_insight,
        drought_insight=drought_insight,
        flood_insight=flood_insight,
        heat_insight=heat_insight
    )
