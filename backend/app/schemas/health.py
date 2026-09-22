"""Pydantic v2 schemas for the health feature-group."""
from datetime import date, datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.health import AnimalType, DiseaseSeverity


# ---------- disease detection ----------

class DiseaseDetectResponse(BaseModel):
    report_id: UUID
    predicted_disease: str
    confidence: float
    severity: DiseaseSeverity
    treatment_recommendation: str
    nearby_cases: int
    nearby_farmers: int


class DiseaseReportRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    farm_id: UUID
    image_path: str
    crop: str
    predicted_disease: str
    confidence: float
    severity: DiseaseSeverity
    treatment_recommendation: str
    language: str
    is_public_surveillance: bool
    village: Optional[str] = None
    district: Optional[str] = None
    created_at: datetime


# ---------- weed detection ----------

class WeedDetectResponse(BaseModel):
    species: str
    confidence: float
    herbicide: str
    dosage_ml_per_acre: float


class WeedReportRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    farm_id: UUID
    image_path: str
    predicted_species: str
    confidence: float
    recommended_herbicide: str
    dosage_ml_per_acre: float
    created_at: datetime


# ---------- pest risk / surveillance ----------

class PestRiskEntry(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    village_name: str
    district: str
    risk_score: float
    week_of: date
    contributing_reports_count: int


class SurveillanceMapEntry(BaseModel):
    village: str
    report_count: int


# ---------- livestock ----------

class LivestockCreate(BaseModel):
    farm_id: UUID
    animal_type: AnimalType
    tag_id: str


class LivestockRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    farm_id: UUID
    animal_type: AnimalType
    tag_id: str
    vaccination_schedule: list
    breeding_cycle: dict
    milk_yield_log: list
    created_at: datetime


class LivestockHealthCheckResponse(BaseModel):
    predicted_condition: str
    confidence: float
    vet_booking_requested: bool


class LivestockScheduleResponse(BaseModel):
    vaccination_schedule: list
    breeding_cycle: dict
