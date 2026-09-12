"""SQLAlchemy 2.0 models for the vision_forecast feature-group.

Covers MASTER-SPEC features #11 (Satellite Stress), #12 (Drone Plant
Counting), #14 (Grain Quality), #15 (Mandi Price Forecast), #16 (Yield
Forecast), and #29 (Climate Risk).
"""
import enum
import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum as SAEnum, Float, ForeignKey, Integer, String, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class StressLevel(str, enum.Enum):
    none = "none"
    mild = "mild"
    moderate = "moderate"
    severe = "severe"


class GrainGrade(str, enum.Enum):
    A = "A"
    B = "B"
    C = "C"


class StressAlert(Base):
    __tablename__ = "stress_alerts"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farm_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True
    )
    date: Mapped[date] = mapped_column(Date, nullable=False)
    ndvi_value: Mapped[float] = mapped_column(Float, nullable=False)
    ndwi_value: Mapped[float] = mapped_column(Float, nullable=False)
    stress_level: Mapped[StressLevel] = mapped_column(
        SAEnum(StressLevel, name="stress_level"), nullable=False
    )


class PlantCount(Base):
    __tablename__ = "plant_counts"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farm_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True
    )
    video_path: Mapped[str] = mapped_column(String(500), nullable=False)
    count: Mapped[int] = mapped_column(Integer, nullable=False)
    gaps_detected: Mapped[int] = mapped_column(Integer, nullable=False)
    growth_stage: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class GrainQualityReport(Base):
    __tablename__ = "grain_quality_reports"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farm_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True
    )
    image_path: Mapped[str] = mapped_column(String(500), nullable=False)
    moisture_pct: Mapped[float] = mapped_column(Float, nullable=False)
    broken_pct: Mapped[float] = mapped_column(Float, nullable=False)
    foreign_matter_pct: Mapped[float] = mapped_column(Float, nullable=False)
    grade: Mapped[GrainGrade] = mapped_column(
        SAEnum(GrainGrade, name="grain_grade"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class PriceForecast(Base):
    __tablename__ = "price_forecasts"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    crop: Mapped[str] = mapped_column(String(255), nullable=False)
    district: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    forecast_date: Mapped[date] = mapped_column(Date, nullable=False)
    predicted_price: Mapped[float] = mapped_column(Float, nullable=False)
    low_ci: Mapped[float] = mapped_column(Float, nullable=False)
    high_ci: Mapped[float] = mapped_column(Float, nullable=False)


class YieldForecast(Base):
    __tablename__ = "yield_forecasts"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farm_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True
    )
    crop: Mapped[str] = mapped_column(String(255), nullable=False)
    low_kg: Mapped[float] = mapped_column(Float, nullable=False)
    median_kg: Mapped[float] = mapped_column(Float, nullable=False)
    high_kg: Mapped[float] = mapped_column(Float, nullable=False)
    forecast_date: Mapped[date] = mapped_column(Date, nullable=False)


class ClimateRiskScore(Base):
    __tablename__ = "climate_risk_scores"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farm_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True
    )
    drought_risk: Mapped[float] = mapped_column(Float, nullable=False)
    flood_risk: Mapped[float] = mapped_column(Float, nullable=False)
    heat_risk: Mapped[float] = mapped_column(Float, nullable=False)
    horizon_years: Mapped[int] = mapped_column(Integer, nullable=False)
