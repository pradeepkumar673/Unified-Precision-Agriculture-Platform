"""Persistent device telemetry and controlled-environment records.

These tables intentionally store observed readings and generated commands. They
do not contain demo defaults: a CEA endpoint reports missing data instead of
inventing a healthy facility state.
"""
import uuid
from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, String, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farm_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("farms.id", ondelete="CASCADE"), index=True)
    device_id: Mapped[str] = mapped_column(String(128), index=True)
    device_type: Mapped[str] = mapped_column(String(128), index=True)
    readings: Mapped[dict] = mapped_column(JSON, nullable=False)
    observed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class CEASetpoint(Base):
    __tablename__ = "cea_setpoints"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farm_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("farms.id", ondelete="CASCADE"), index=True)
    values: Mapped[dict] = mapped_column(JSON, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class ActuatorCommand(Base):
    __tablename__ = "actuator_commands"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farm_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("farms.id", ondelete="CASCADE"), index=True)
    device_id: Mapped[str] = mapped_column(String(128), index=True)
    command: Mapped[dict] = mapped_column(JSON, nullable=False)
    reason: Mapped[str] = mapped_column(String(500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class TraceabilityBatch(Base):
    __tablename__ = "traceability_batches"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farm_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("farms.id", ondelete="CASCADE"), index=True)
    batch_id: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    crop: Mapped[str] = mapped_column(String(128), nullable=False)
    sown_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    harvest_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    quality_grade: Mapped[str] = mapped_column(String(32), nullable=False)
    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
