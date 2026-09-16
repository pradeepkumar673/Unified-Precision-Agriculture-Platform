from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/v1/cea_iot", tags=["cea_iot"])

# In-memory store for demo purposes
latest_readings = {}
sensor_history = []
setpoints = {
    "temperature": 24.0,
    "humidity": 65.0,
    "co2": 800,
    "ph": 6.0,
    "ec": 1.5,
    "light_intensity": 400
}

@router.post("/ingest")
def ingest_sensor_data(payload: Dict[str, Any]):
    global latest_readings
    farm_id = payload.get("farm_id", "default")
    reading = {
        "id": str(uuid.uuid4()),
        "timestamp": datetime.now().isoformat(),
        "data": payload.get("data", {})
    }
    latest_readings[farm_id] = reading
    sensor_history.append(reading)
    # Keep history bounded
    if len(sensor_history) > 1000:
        sensor_history.pop(0)
    return {"status": "success", "reading_id": reading["id"]}


@router.get("/dashboard")
def get_dashboard(farm_id: str = "default"):
    reading = latest_readings.get(farm_id, {})
    return {
        "farm_id": farm_id,
        "latest_reading": reading,
        "setpoints": setpoints,
        "system_status": "optimal"
    }


@router.post("/setpoints")
def update_setpoints(payload: Dict[str, Any]):
    global setpoints
    for k, v in payload.items():
        if k in setpoints:
            setpoints[k] = v
    return {"status": "success", "setpoints": setpoints}


@router.get("/aqua-balance")
def get_aqua_balance(farm_id: str = "default"):
    reading = latest_readings.get(farm_id, {}).get("data", {})
    ph = reading.get("ph", 6.2)
    ec = reading.get("ec", 1.8)
    return {
        "ph": ph,
        "ec": ec,
        "ph_status": "optimal" if 5.5 <= ph <= 6.5 else "warning",
        "ec_status": "optimal" if 1.2 <= ec <= 2.0 else "warning",
        "recommendation": "Maintain current nutrient dosing."
    }


@router.get("/vertical-optimization")
def get_vertical_optimization(farm_id: str = "default"):
    return {
        "layers": [
            {"layer": 1, "light_intensity": 350, "temp": 22.5, "status": "optimal"},
            {"layer": 2, "light_intensity": 380, "temp": 23.0, "status": "optimal"},
            {"layer": 3, "light_intensity": 400, "temp": 23.5, "status": "optimal"},
        ],
        "recommendation": "Airflow adjustment needed on layer 3 to reduce temperature gradient."
    }


@router.post("/shelf-image")
def upload_shelf_image():
    # Mocking image upload and analysis
    return {
        "status": "success",
        "analysis": {
            "disease_detected": False,
            "growth_stage": "vegetative",
            "biomass_estimate": "450g/m2"
        }
    }


@router.get("/energy-optimization")
def get_energy_optimization(farm_id: str = "default"):
    return {
        "current_consumption_kw": 4.5,
        "forecast_consumption_kw": 5.2,
        "recommendation": "Dim LED lights by 10% during peak tariff hours (14:00 - 18:00)."
    }


@router.get("/traceability")
def get_traceability(batch_id: str):
    return {
        "batch_id": batch_id,
        "crop": "Lettuce",
        "sown_date": "2024-08-01",
        "harvest_date": "2024-09-10",
        "environmental_history": {
            "avg_temp": 23.4,
            "avg_humidity": 64.2,
            "anomalies": 0
        },
        "quality_grade": "A",
        "qr_code_data": f"https://agri.test/trace/{batch_id}"
    }
