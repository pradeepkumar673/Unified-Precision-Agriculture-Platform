"""SQLAlchemy 2.0 models for the water_soil feature-group.

Covers MASTER-SPEC features #3 (Smart Irrigation), #17 (Water Demand
Forecast), and #18 (Soil Health Modeling).
"""
import uuid
from datetime import date, datetime

from sqlalchemy import JSON, Date, DateTime, Float, ForeignKey, String, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class IrrigationSchedule(Base):
    __tablename__ = "irrigation_schedules"

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
    date: Mapped[date] = mapped_column(Date, nullable=False)
    recommended_liters: Mapped[float] = mapped_column(Float, nullable=False)
    current_moisture_pct: Mapped[float] = mapped_column(Float, nullable=False)
    et0_value: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class SoilHealthMap(Base):
    __tablename__ = "soil_health_maps"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    farm_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("farms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    grid_data: Mapped[list] = mapped_column(JSON, nullable=False)  # 20x20 [{n,p,k,ph}]
    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
