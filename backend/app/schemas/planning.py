"""Pydantic v2 schemas for the planning feature-group."""
from datetime import date, datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.planning import PlanStatusEnum, SeasonEnum


# ---------- crop plan ----------

class CropPlanRequest(BaseModel):
    farm_id: UUID
    season: SeasonEnum
    year: int


class CropPlanResponse(BaseModel):
    recommended_crop: str
    recommended_variety: str
    sowing_date: date
    expected_investment: float
    reasoning: str


class CropPlanRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    farm_id: UUID
    season: SeasonEnum
    year: int
    recommended_crop: str
    recommended_variety: str
    sowing_date: date
    expected_investment: float
    status: PlanStatusEnum
    created_at: datetime


# ---------- rotation plan ----------

class RotationPlanRequest(BaseModel):
    farm_id: UUID
    soil_nitrogen: float
    soil_organic_carbon: float
    last_3_crops: List[str]


class RotationPlanResponse(BaseModel):
    next_crop: str
    projected_profit: float
    projected_soil_impact: float


# ---------- variety recommendation ----------

class VarietyRecommendationRequest(BaseModel):
    farm_id: UUID
    crop: str


class VarietyItem(BaseModel):
    name: str
    score: float


class VarietyRecommendationResponse(BaseModel):
    recommended_varieties: List[VarietyItem]


# ---------- variable rate ----------

class ZoneInput(BaseModel):
    zone_id: str
    soil_score: float  # 0.0 - 1.0 or 0 - 100
    ndvi_score: float  # 0.0 - 1.0


class VariableRateRequest(BaseModel):
    farm_id: UUID
    crop: str
    zones: List[ZoneInput]


class ZonePrescription(BaseModel):
    zone_id: str
    seed_rate_kg: float
    fertilizer_kg: float
    pesticide_ml: float


class VariableRateResponse(BaseModel):
    id: UUID
    zone_prescriptions: List[ZonePrescription]
    export_format: str
