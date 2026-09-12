"""Pydantic v2 schemas for the water_soil feature-group."""
from datetime import date, datetime
from typing import List
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class IrrigationRecommendationRequest(BaseModel):
    farm_id: UUID
    crop: str
    growth_stage: str
    current_moisture_pct: float


class IrrigationRecommendationResponse(BaseModel):
    recommended_liters_per_day: float
    next_irrigation_date: date
    et0: float


class IrrigationScheduleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    farm_id: UUID
    crop: str
    date: date
    recommended_liters: float
    current_moisture_pct: float
    et0_value: float
    created_at: datetime


class SoilReadingPoint(BaseModel):
    lat: float
    lng: float
    n: float
    p: float
    k: float
    ph: float


class SoilMapRequest(BaseModel):
    farm_id: UUID
    sparse_readings: List[SoilReadingPoint]


class SoilGridCell(BaseModel):
    n: float
    p: float
    k: float
    ph: float


class SoilMapResponse(BaseModel):
    grid_data: List[List[SoilGridCell]]
