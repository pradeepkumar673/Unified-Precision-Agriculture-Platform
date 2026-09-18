"""Persistent CEA telemetry APIs; absent data is reported, never fabricated."""
import os
import secrets
from datetime import datetime
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.cea_iot import ActuatorCommand, CEASetpoint, SensorReading, TraceabilityBatch
from app.models.farm import Farm

router = APIRouter(prefix="/api/v1/cea_iot", tags=["cea_iot"])


class SensorIngest(BaseModel):
    farm_id: UUID
    device_id: str = Field(min_length=1, max_length=128)
    device_type: str = Field(min_length=1, max_length=128)
    readings: dict[str, float | int] = Field(min_length=1)
    timestamp: datetime

    @field_validator("readings")
    @classmethod
    def finite_readings(cls, values):
        import math
        if any(not math.isfinite(float(value)) for value in values.values()):
            raise ValueError("readings must be finite numbers")
        return values


class SetpointUpdate(BaseModel):
    farm_id: UUID
    values: dict[str, float] = Field(min_length=1)


class BatchCreate(BaseModel):
    farm_id: UUID
    batch_id: str = Field(min_length=1, max_length=128)
    crop: str = Field(min_length=1, max_length=128)
    sown_date: datetime
    harvest_date: datetime
    quality_grade: str = Field(min_length=1, max_length=32)
    metadata: dict[str, Any] = Field(default_factory=dict)


def _farm(db: Session, farm_id: UUID) -> Farm:
    farm = db.get(Farm, farm_id)
    if not farm:
        raise HTTPException(404, "Farm not found")
    return farm


def _latest(db: Session, farm_id: UUID) -> SensorReading:
    row = db.scalar(select(SensorReading).where(SensorReading.farm_id == farm_id).order_by(SensorReading.observed_at.desc()))
    if not row:
        raise HTTPException(404, "No persisted sensor readings for this farm")
    return row


@router.post("/ingest", status_code=status.HTTP_201_CREATED)
def ingest_sensor_data(payload: SensorIngest, x_device_key: str | None = Header(default=None), db: Session = Depends(get_db)):
    configured_key = os.getenv("CEA_DEVICE_API_KEY")
    if not configured_key:
        raise HTTPException(503, "CEA device authentication is not configured")
    if not x_device_key or not secrets.compare_digest(x_device_key, configured_key):
        raise HTTPException(401, "Invalid device credentials")
    _farm(db, payload.farm_id)
    reading = SensorReading(farm_id=payload.farm_id, device_id=payload.device_id, device_type=payload.device_type, readings=payload.readings, observed_at=payload.timestamp)
    db.add(reading); db.commit(); db.refresh(reading)
    return {"status": "recorded", "reading_id": str(reading.id), "observed_at": reading.observed_at}


@router.get("/dashboard")
def get_dashboard(farm_id: UUID, db: Session = Depends(get_db)):
    _farm(db, farm_id); reading = _latest(db, farm_id)
    setpoint = db.scalar(select(CEASetpoint).where(CEASetpoint.farm_id == farm_id).order_by(CEASetpoint.updated_at.desc()))
    return {"farm_id": str(farm_id), "latest_reading": {"id": str(reading.id), "timestamp": reading.observed_at, "device_id": reading.device_id, "device_type": reading.device_type, "data": reading.readings}, "setpoints": setpoint.values if setpoint else None, "system_status": "configured" if setpoint else "setpoints_required"}


@router.post("/setpoints")
def update_setpoints(payload: SetpointUpdate, db: Session = Depends(get_db)):
    _farm(db, payload.farm_id)
    row = db.scalar(select(CEASetpoint).where(CEASetpoint.farm_id == payload.farm_id).order_by(CEASetpoint.updated_at.desc()))
    if row:
        row.values = payload.values
    else:
        row = CEASetpoint(farm_id=payload.farm_id, values=payload.values); db.add(row)
    db.commit(); db.refresh(row)
    return {"status": "recorded", "setpoints": row.values, "updated_at": row.updated_at}


@router.get("/aqua-balance")
def get_aqua_balance(farm_id: UUID, db: Session = Depends(get_db)):
    _farm(db, farm_id); reading = _latest(db, farm_id); values = reading.readings
    if "ph" not in values or "ec" not in values:
        raise HTTPException(422, "Latest reading must include ph and ec")
    setpoint = db.scalar(select(CEASetpoint).where(CEASetpoint.farm_id == farm_id).order_by(CEASetpoint.updated_at.desc()))
    if not setpoint or "ph" not in setpoint.values or "ec" not in setpoint.values:
        raise HTTPException(409, "pH and EC setpoints must be configured before balancing")
    ph, ec = float(values["ph"]), float(values["ec"]); ph_target, ec_target = setpoint.values["ph"], setpoint.values["ec"]
    command = {"adjust_ph_to": ph_target, "dose_nutrient_ml": max(0.0, round((ec_target - ec) * 100, 2))}
    reason = f"Measured pH={ph}, EC={ec}; configured targets pH={ph_target}, EC={ec_target}"
    row = ActuatorCommand(farm_id=farm_id, device_id=reading.device_id, command=command, reason=reason)
    db.add(row); db.commit(); db.refresh(row)
    return {"ph": ph, "ec": ec, "ph_status": "optimal" if ph == ph_target else "adjustment_required", "ec_status": "optimal" if ec == ec_target else "adjustment_required", "command_id": str(row.id), "recommendation": reason}


@router.get("/vertical-optimization")
def get_vertical_optimization(farm_id: UUID, db: Session = Depends(get_db)):
    _farm(db, farm_id)
    rows = db.scalars(select(SensorReading).where(SensorReading.farm_id == farm_id, SensorReading.device_type.like("vertical_shelf_%")).order_by(SensorReading.observed_at.desc())).all()
    latest_by_device = {}
    for row in rows: latest_by_device.setdefault(row.device_id, row)
    if not latest_by_device:
        raise HTTPException(404, "No persisted vertical-shelf readings for this farm")
    layers = [{"layer": row.device_type.removeprefix("vertical_shelf_"), "light_intensity": row.readings.get("light_intensity_lux"), "temp": row.readings.get("air_temp_c"), "status": "observed"} for row in latest_by_device.values()]
    return {"layers": layers, "recommendation": "Optimization requires configured facility constraints; showing observed values."}


@router.get("/energy-optimization")
def get_energy_optimization(farm_id: UUID, tariff_per_kwh: float = Query(..., gt=0), db: Session = Depends(get_db)):
    _farm(db, farm_id); reading = _latest(db, farm_id)
    if "power_kw" not in reading.readings:
        raise HTTPException(422, "Latest reading must include power_kw")
    current_kw = float(reading.readings["power_kw"])
    return {"current_consumption_kw": current_kw, "forecast_consumption_kw": current_kw, "tariff_per_kwh": tariff_per_kwh, "recommendation": "No controllable-load schedule is available until actuator constraints are configured."}


@router.post("/traceability/batches", status_code=status.HTTP_201_CREATED)
def create_traceability_batch(payload: BatchCreate, db: Session = Depends(get_db)):
    _farm(db, payload.farm_id)
    if payload.harvest_date < payload.sown_date: raise HTTPException(422, "harvest_date must not precede sown_date")
    if db.scalar(select(TraceabilityBatch).where(TraceabilityBatch.batch_id == payload.batch_id)): raise HTTPException(409, "batch_id already exists")
    batch = TraceabilityBatch(farm_id=payload.farm_id, batch_id=payload.batch_id, crop=payload.crop, sown_date=payload.sown_date, harvest_date=payload.harvest_date, quality_grade=payload.quality_grade, metadata_json=payload.metadata)
    db.add(batch); db.commit()
    return {"batch_id": batch.batch_id, "status": "recorded"}


@router.get("/traceability")
def get_traceability(batch_id: str, db: Session = Depends(get_db)):
    batch = db.scalar(select(TraceabilityBatch).where(TraceabilityBatch.batch_id == batch_id))
    if not batch: raise HTTPException(404, "Traceability batch not found")
    readings = db.scalars(select(SensorReading).where(SensorReading.farm_id == batch.farm_id, SensorReading.observed_at >= batch.sown_date, SensorReading.observed_at <= batch.harvest_date)).all()
    temperatures = [float(row.readings["temperature"]) for row in readings if "temperature" in row.readings]
    humidity = [float(row.readings["humidity"]) for row in readings if "humidity" in row.readings]
    return {"batch_id": batch.batch_id, "crop": batch.crop, "sown_date": batch.sown_date, "harvest_date": batch.harvest_date, "environmental_history": {"avg_temp": sum(temperatures) / len(temperatures) if temperatures else None, "avg_humidity": sum(humidity) / len(humidity) if humidity else None, "reading_count": len(readings)}, "quality_grade": batch.quality_grade, "metadata": batch.metadata_json}
