"""Pydantic v2 schemas for the vision_forecast feature-group."""
from uuid import UUID

from pydantic import BaseModel

from app.models.vision_forecast import GrainGrade, StressLevel


class StressCheckRequest(BaseModel):
    farm_id: UUID


class StressCheckResponse(BaseModel):
    ndvi_value: float
    ndwi_value: float
    stress_level: StressLevel


class PlantCountResponse(BaseModel):
    count: int
    gaps_detected: int
    growth_stage: str
    stand_pct: float
    plants_per_acre: int
    healthy_pct: int
    sparse_pct: int
    weed_pct: int
    benchmark_min: int
    benchmark_max: int


class GrainQualityResponse(BaseModel):
    moisture_pct: float
    broken_pct: float
    foreign_matter_pct: float
    grade: GrainGrade


class PriceForecastPoint(BaseModel):
    week: int
    predicted_price: float
    low_ci: float
    high_ci: float


class PriceForecastResponse(BaseModel):
    predicted_price: float
    low_ci: float
    high_ci: float
    timeline: list[PriceForecastPoint]


class YieldForecastRequest(BaseModel):
    farm_id: UUID
    crop: str


class YieldForecastResponse(BaseModel):
    low_kg: float
    median_kg: float
    high_kg: float


class ClimateRiskResponse(BaseModel):
    drought_risk: float
    flood_risk: float
    heat_risk: float
    overall_risk: float
    overall_index: int
    risk_category: str
    station_name: str
    season_name: str
    overall_insight: str
    drought_insight: str
    flood_insight: str
    heat_insight: str
