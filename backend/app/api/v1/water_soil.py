"""Water & soil feature-group router.

Endpoints:
  POST  /api/v1/water_soil/irrigation-recommendation    -> ET0-based irrigation advice
  GET   /api/v1/water_soil/irrigation-history/{farm_id} -> list past irrigation schedules
  POST  /api/v1/water_soil/soil-map                      -> GPR-interpolated 20x20 soil grid
  GET   /api/v1/water_soil/soil-map/{farm_id}            -> latest soil health map
"""
import uuid
from datetime import date
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.farm import Farm
from app.models.water_soil import IrrigationSchedule, SoilHealthMap
from app.schemas.water_soil import (
    IrrigationRecommendationRequest,
    IrrigationRecommendationResponse,
    IrrigationScheduleRead,
    SoilMapRequest,
    SoilMapResponse,
)
from app.services import water_soil as water_soil_service

router = APIRouter(prefix="/api/v1/water_soil", tags=["water_soil"])


@router.post(
    "/irrigation-recommendation",
    response_model=IrrigationRecommendationResponse,
    status_code=status.HTTP_201_CREATED,
)
def irrigation_recommendation(
    payload: IrrigationRecommendationRequest, db: Session = Depends(get_db)
):
    farm = db.get(Farm, payload.farm_id)
    if farm is None:
        raise HTTPException(status_code=404, detail="Farm not found")

    result = water_soil_service.recommend_irrigation(
        crop=payload.crop,
        growth_stage=payload.growth_stage,
        current_moisture_pct=payload.current_moisture_pct,
        land_size_acres=farm.land_size_acres,
        lat=farm.latitude,
        lng=farm.longitude,
    )

    schedule = IrrigationSchedule(
        id=uuid.uuid4(),
        farm_id=payload.farm_id,
        crop=payload.crop,
        date=date.today(),
        recommended_liters=result["recommended_liters_per_day"],
        current_moisture_pct=payload.current_moisture_pct,
        et0_value=result["et0"],
    )
    db.add(schedule)
    db.commit()
    db.refresh(schedule)

    return IrrigationRecommendationResponse(**result)


@router.get("/irrigation-history/{farm_id}", response_model=List[IrrigationScheduleRead])
def irrigation_history(
    farm_id: UUID,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    farm = db.get(Farm, farm_id)
    if farm is None:
        raise HTTPException(status_code=404, detail="Farm not found")

    return db.scalars(
        select(IrrigationSchedule)
        .where(IrrigationSchedule.farm_id == farm_id)
        .order_by(IrrigationSchedule.created_at.desc())
        .offset(offset)
        .limit(limit)
    ).all()


@router.post("/soil-map", response_model=SoilMapResponse, status_code=status.HTTP_201_CREATED)
def create_soil_map(payload: SoilMapRequest, db: Session = Depends(get_db)):
    farm = db.get(Farm, payload.farm_id)
    if farm is None:
        raise HTTPException(status_code=404, detail="Farm not found")
    if len(payload.sparse_readings) < 1:
        raise HTTPException(status_code=422, detail="At least 1 soil reading is required")

    readings = [r.model_dump() for r in payload.sparse_readings]
    grid_data = water_soil_service.interpolate_soil_grid(readings)

    soil_map = SoilHealthMap(id=uuid.uuid4(), farm_id=payload.farm_id, grid_data=grid_data)
    db.add(soil_map)
    db.commit()
    db.refresh(soil_map)

    return SoilMapResponse(grid_data=grid_data)


@router.get("/soil-map/{farm_id}", response_model=SoilMapResponse)
def get_soil_map(farm_id: UUID, db: Session = Depends(get_db)):
    farm = db.get(Farm, farm_id)
    if farm is None:
        raise HTTPException(status_code=404, detail="Farm not found")

    soil_map = db.scalar(
        select(SoilHealthMap)
        .where(SoilHealthMap.farm_id == farm_id)
        .order_by(SoilHealthMap.generated_at.desc())
        .limit(1)
    )
    if soil_map is None:
        raise HTTPException(status_code=404, detail="No soil map generated for this farm yet")

    return SoilMapResponse(grid_data=soil_map.grid_data)
