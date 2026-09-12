"""SQLAlchemy 2.0 models for the health feature-group.

Covers MASTER-SPEC features #4 (Crop Health AI), #13 (Weed Classification),
#20 (Pest Spread), #56 (Community Surveillance), and #51 (Livestock Health).
"""
import enum
import uuid
from datetime import date, datetime
from typing import Optional

from sqlalchemy import (
    JSON,
    Boolean,
    Date,
    DateTime,
    Enum as SAEnum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class DiseaseSeverity(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"


class AnimalType(str, enum.Enum):
    cow = "cow"
    buffalo = "buffalo"
    goat = "goat"
    poultry = "poultry"


# --------------------------------------------------------------------------- #
# disease_reports
# --------------------------------------------------------------------------- #
class DiseaseReport(Base):
    __tablename__ = "disease_reports"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    farm_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("farms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    image_path: Mapped[str] = mapped_column(String(500), nullable=False)
    crop: Mapped[str] = mapped_column(String(255), nullable=False)
    predicted_disease: Mapped[str] = mapped_column(String(255), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    severity: Mapped[DiseaseSeverity] = mapped_column(
        SAEnum(DiseaseSeverity, name="disease_severity"), nullable=False
    )
    treatment_recommendation: Mapped[str] = mapped_column(Text, nullable=False)
    language: Mapped[str] = mapped_column(String(10), default="en", nullable=False)
    is_public_surveillance: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    # Village/district for community surveillance grouping
    village: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    district: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


# --------------------------------------------------------------------------- #
# weed_reports
# --------------------------------------------------------------------------- #
class WeedReport(Base):
    __tablename__ = "weed_reports"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    farm_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("farms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    image_path: Mapped[str] = mapped_column(String(500), nullable=False)
    predicted_species: Mapped[str] = mapped_column(String(255), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    recommended_herbicide: Mapped[str] = mapped_column(String(255), nullable=False)
    dosage_ml_per_acre: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


# --------------------------------------------------------------------------- #
# pest_risk_scores
# --------------------------------------------------------------------------- #
class PestRiskScore(Base):
    __tablename__ = "pest_risk_scores"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    village_name: Mapped[str] = mapped_column(String(255), nullable=False)
    district: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    risk_score: Mapped[float] = mapped_column(Float, nullable=False)
    week_of: Mapped[date] = mapped_column(Date, nullable=False)
    contributing_reports_count: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


# --------------------------------------------------------------------------- #
# livestock
# --------------------------------------------------------------------------- #
class Livestock(Base):
    __tablename__ = "livestock"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    farm_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("farms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    animal_type: Mapped[AnimalType] = mapped_column(
        SAEnum(AnimalType, name="animal_type"), nullable=False
    )
    tag_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    vaccination_schedule: Mapped[list] = mapped_column(
        JSON, default=list, nullable=False
    )
    breeding_cycle: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    milk_yield_log: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


# --------------------------------------------------------------------------- #
# livestock_health_reports
# --------------------------------------------------------------------------- #
class LivestockHealthReport(Base):
    __tablename__ = "livestock_health_reports"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    livestock_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("livestock.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    image_path: Mapped[str] = mapped_column(String(500), nullable=False)
    predicted_condition: Mapped[str] = mapped_column(String(255), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    vet_booking_requested: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
