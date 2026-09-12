"""SQLAlchemy 2.0 models for the planning feature-group.

Covers MASTER-SPEC features #2 (AI Crop Planning), #19 (Variety Recommendation),
#23 (RL Crop Rotation), and #40 (Variable-Rate Application).
"""
import enum
import uuid
from datetime import date, datetime

from sqlalchemy import (
    JSON,
    Date,
    DateTime,
    Enum as SAEnum,
    Float,
    ForeignKey,
    Integer,
    String,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


class SeasonEnum(str, enum.Enum):
    kharif = "kharif"
    rabi = "rabi"
    zaid = "zaid"


class PlanStatusEnum(str, enum.Enum):
    planned = "planned"
    active = "active"
    harvested = "harvested"


class CropPlan(Base):
    __tablename__ = "crop_plans"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    farm_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("farms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    season: Mapped[SeasonEnum] = mapped_column(
        SAEnum(SeasonEnum, name="season_enum"), nullable=False
    )
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    recommended_crop: Mapped[str] = mapped_column(String(255), nullable=False)
    recommended_variety: Mapped[str] = mapped_column(String(255), nullable=False)
    sowing_date: Mapped[date] = mapped_column(Date, nullable=False)
    expected_investment: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[PlanStatusEnum] = mapped_column(
        SAEnum(PlanStatusEnum, name="plan_status_enum"),
        default=PlanStatusEnum.planned,
        nullable=False,
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


class RotationPlan(Base):
    __tablename__ = "rotation_plans"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    farm_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("farms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    season_sequence: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    rl_confidence: Mapped[float] = mapped_column(Float, nullable=False)
    soil_impact_score: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class VarietyRecommendation(Base):
    __tablename__ = "variety_recommendations"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    farm_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("farms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    crop: Mapped[str] = mapped_column(String(255), nullable=False)
    recommended_varieties: Mapped[list] = mapped_column(
        JSON, default=list, nullable=False
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


class PrescriptionMap(Base):
    __tablename__ = "prescription_maps"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    farm_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("farms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    crop: Mapped[str] = mapped_column(String(255), nullable=False)
    zone_prescriptions: Mapped[list] = mapped_column(
        JSON, default=list, nullable=False
    )
    export_format: Mapped[str] = mapped_column(
        String(50), default="geojson", nullable=False
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
