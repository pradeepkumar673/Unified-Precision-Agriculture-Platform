"""Health feature-group router.

Endpoints:
  POST  /api/v1/health/disease-detect                    -> crop disease detection
  GET   /api/v1/health/disease-history/{farm_id}         -> list past disease reports
  POST  /api/v1/health/weed-detect                       -> weed species detection
  GET   /api/v1/health/pest-risk-map?district=X          -> village pest risk scores
  GET   /api/v1/health/surveillance-map?district=X       -> disease report counts by village
  POST  /api/v1/health/livestock                          -> register livestock
  POST  /api/v1/health/livestock/{id}/health-check        -> livestock health image check
  GET   /api/v1/health/livestock/{id}/schedule            -> vaccination + breeding schedule
"""
import os
import shutil
import uuid
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.farm import Farm
from app.models.health import (
    DiseaseReport,
    DiseaseSeverity,
    Livestock,
    LivestockHealthReport,
    PestRiskScore,
    WeedReport,
)
from app.schemas.health import (
    DiseaseDetectResponse,
    DiseaseReportRead,
    LivestockCreate,
    LivestockHealthCheckResponse,
    LivestockRead,
    LivestockScheduleResponse,
    PestRiskEntry,
    SurveillanceMapEntry,
    WeedDetectResponse,
    WeedReportRead,
)
from app.services import health as health_service

router = APIRouter(prefix="/api/v1/health", tags=["health"])

MEDIA_ROOT = os.path.join("media", "health")


def _save_upload(file: UploadFile, subdir: str) -> str:
    target_dir = os.path.join(MEDIA_ROOT, subdir)
    os.makedirs(target_dir, exist_ok=True)
    ext = os.path.splitext(file.filename or "")[1] or ".jpg"
    path = os.path.join(target_dir, f"{uuid.uuid4()}{ext}")
    with open(path, "wb") as out_file:
        shutil.copyfileobj(file.file, out_file)
    return path


# --------------------------------------------------------------------------- #
# #4 Crop Health AI
# --------------------------------------------------------------------------- #
@router.post(
    "/disease-detect",
    response_model=DiseaseDetectResponse,
    status_code=status.HTTP_201_CREATED,
)
def detect_disease(
    farm_id: UUID = Form(...),
    crop: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    farm = db.get(Farm, farm_id)
    if farm is None:
        raise HTTPException(status_code=404, detail="Farm not found")

    image_path = _save_upload(file, "disease")

    # TODO(ml-swap): swap OpenCV colour-ratio heuristic for
    # backend/ml_models/crop_disease_model.pt (MobileNetV3) inference.
    result = health_service.analyze_crop_disease_image(image_path, crop)

    report = DiseaseReport(
        id=uuid.uuid4(),
        farm_id=farm_id,
        image_path=image_path,
        crop=crop,
        predicted_disease=result["predicted_disease"],
        confidence=result["confidence"],
        severity=DiseaseSeverity(result["severity"]),
        treatment_recommendation=result["treatment_recommendation"],
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return DiseaseDetectResponse(**result)


@router.get("/disease-history/{farm_id}", response_model=List[DiseaseReportRead])
def disease_history(
    farm_id: UUID,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    farm = db.get(Farm, farm_id)
    if farm is None:
        raise HTTPException(status_code=404, detail="Farm not found")

    return db.scalars(
        select(DiseaseReport)
        .where(DiseaseReport.farm_id == farm_id)
        .order_by(DiseaseReport.created_at.desc())
        .offset(offset)
        .limit(limit)
    ).all()


# --------------------------------------------------------------------------- #
# #13 Weed Classification
# --------------------------------------------------------------------------- #
@router.post(
    "/weed-detect",
    response_model=WeedDetectResponse,
    status_code=status.HTTP_201_CREATED,
)
def detect_weed(
    farm_id: UUID = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    farm = db.get(Farm, farm_id)
    if farm is None:
        raise HTTPException(status_code=404, detail="Farm not found")

    image_path = _save_upload(file, "weed")

    # TODO(ml-swap): swap OpenCV colour-ratio heuristic for the trained weed
    # classification CNN once backend/ml_models/weed_classifier.pt exists.
    result = health_service.analyze_weed_image(image_path)

    report = WeedReport(
        id=uuid.uuid4(),
        farm_id=farm_id,
        image_path=image_path,
        predicted_species=result["species"],
        confidence=result["confidence"],
        recommended_herbicide=result["herbicide"],
        dosage_ml_per_acre=result["dosage_ml_per_acre"],
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return WeedDetectResponse(**result)


# --------------------------------------------------------------------------- #
# #20 Pest Spread + #56 Community Surveillance
# --------------------------------------------------------------------------- #
@router.get("/pest-risk-map", response_model=List[PestRiskEntry])
def pest_risk_map(district: str = Query(...), db: Session = Depends(get_db)):
    scores = db.scalars(
        select(PestRiskScore)
        .where(PestRiskScore.district == district)
        .order_by(PestRiskScore.week_of.desc())
    ).all()

    if not scores:
        # TODO(ml-swap): replace synthetic seed with the real pest-spread
        # model (#20) once enough live reports exist for this district.
        seeds = health_service.generate_synthetic_pest_risk(district)
        rows = [PestRiskScore(id=uuid.uuid4(), **seed) for seed in seeds]
        db.add_all(rows)
        db.commit()
        for row in rows:
            db.refresh(row)
        scores = rows

    return scores


@router.get("/surveillance-map", response_model=List[SurveillanceMapEntry])
def surveillance_map(district: str = Query(...), db: Session = Depends(get_db)):
    rows = db.execute(
        select(DiseaseReport.village, func.count(DiseaseReport.id))
        .where(
            DiseaseReport.district == district,
            DiseaseReport.is_public_surveillance.is_(True),
            DiseaseReport.village.is_not(None),
        )
        .group_by(DiseaseReport.village)
    ).all()

    return [{"village": village, "report_count": count} for village, count in rows]


# --------------------------------------------------------------------------- #
# #51 Livestock Health
# --------------------------------------------------------------------------- #
@router.post("/livestock", response_model=LivestockRead, status_code=status.HTTP_201_CREATED)
def create_livestock(payload: LivestockCreate, db: Session = Depends(get_db)):
    farm = db.get(Farm, payload.farm_id)
    if farm is None:
        raise HTTPException(status_code=404, detail="Farm not found")

    animal_val = payload.animal_type.value

    livestock = Livestock(
        id=uuid.uuid4(),
        farm_id=payload.farm_id,
        animal_type=payload.animal_type,
        tag_id=payload.tag_id,
        vaccination_schedule=health_service.generate_default_vaccination_schedule(animal_val),
        breeding_cycle=health_service.generate_default_breeding_cycle(animal_val),
        milk_yield_log=[],
    )
    db.add(livestock)
    db.commit()
    db.refresh(livestock)
    return livestock


@router.post(
    "/livestock/{livestock_id}/health-check",
    response_model=LivestockHealthCheckResponse,
    status_code=status.HTTP_201_CREATED,
)
def livestock_health_check(
    livestock_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    livestock = db.get(Livestock, livestock_id)
    if livestock is None:
        raise HTTPException(status_code=404, detail="Livestock record not found")

    image_path = _save_upload(file, "livestock")

    # TODO(ml-swap): swap OpenCV brightness/variance heuristic for the
    # trained livestock health CNN once available.
    result = health_service.analyze_livestock_image(image_path)

    report = LivestockHealthReport(
        id=uuid.uuid4(),
        livestock_id=livestock_id,
        image_path=image_path,
        predicted_condition=result["predicted_condition"],
        confidence=result["confidence"],
        vet_booking_requested=result["vet_booking_requested"],
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return LivestockHealthCheckResponse(**result)


@router.get("/livestock/{livestock_id}/schedule", response_model=LivestockScheduleResponse)
def livestock_schedule(livestock_id: UUID, db: Session = Depends(get_db)):
    livestock = db.get(Livestock, livestock_id)
    if livestock is None:
        raise HTTPException(status_code=404, detail="Livestock record not found")

    return LivestockScheduleResponse(
        vaccination_schedule=livestock.vaccination_schedule,
        breeding_cycle=livestock.breeding_cycle,
    )
