"""Pydantic v2 schemas mirroring app.models.farm."""
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.farm import AnnualIncomeRange, SoilType, WaterSource


# --------------------------------------------------------------------------- #
# reusable sub-objects
# --------------------------------------------------------------------------- #
class CropHistoryItem(BaseModel):
    season: str
    year: int
    crop: str


class LatLng(BaseModel):
    lat: float
    lng: float


class Zone(BaseModel):
    zone_id: int
    polygon_points: List[LatLng]
    soil_score: float
    ndvi_score: float


# --------------------------------------------------------------------------- #
# Farm
# --------------------------------------------------------------------------- #
class FarmBase(BaseModel):
    name: str
    land_size_acres: float
    soil_type: SoilType
    water_source: WaterSource
    latitude: Optional[float] = 0.0
    longitude: Optional[float] = 0.0
    equipment_owned: List[str] = Field(default_factory=list)
    annual_income_range: Optional[AnnualIncomeRange] = None
    crop_history: List[CropHistoryItem] = Field(default_factory=list)


class FarmCreate(FarmBase):
    pass


class FarmUpdate(BaseModel):
    name: Optional[str] = None
    land_size_acres: Optional[float] = None
    soil_type: Optional[SoilType] = None
    water_source: Optional[WaterSource] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    equipment_owned: Optional[List[str]] = None
    annual_income_range: Optional[AnnualIncomeRange] = None
    crop_history: Optional[List[CropHistoryItem]] = None


class FarmRead(FarmBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime


# --------------------------------------------------------------------------- #
# Field boundary
# --------------------------------------------------------------------------- #
class BoundaryCreate(BaseModel):
    gps_points: List[LatLng] = Field(..., min_length=3)


class BoundaryResponse(BaseModel):
    boundary_points: List[LatLng]
    zones: List[Zone]
