import uuid
import datetime
from sqlalchemy.orm import Session
from app.core.db import engine, SessionLocal, Base
from app.models.farm import Farm
from app.models.cea_iot import SensorReading, CEASetpoint, ActuatorCommand, TraceabilityBatch
from app.models.vision_forecast import (
    StressAlert, PlantCount, GrainQualityReport, PriceForecast, YieldForecast, ClimateRiskScore,
    StressLevel, GrainGrade
)

def seed():
    # Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    farm_id = uuid.UUID("ee2fdcf4-80b5-490a-97cc-b61dce15d9e2")
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    
    now = datetime.datetime.now(datetime.timezone.utc)
    
    print("Seeding CEA IoT data...")
    db.add(SensorReading(
        farm_id=farm_id,
        device_id="hydro-sensor-01",
        device_type="hydroponics",
        readings={"ph": 5.8, "ec": 1.2, "temperature": 22.5, "humidity": 65.0, "power_kw": 4.5},
        observed_at=now
    ))
    db.add(SensorReading(
        farm_id=farm_id,
        device_id="vertical-01",
        device_type="vertical_shelf_1",
        readings={"light_intensity_lux": 15000, "air_temp_c": 21.0},
        observed_at=now
    ))
    db.add(CEASetpoint(
        farm_id=farm_id,
        values={"ph": 6.0, "ec": 1.5, "temperature": 23.0}
    ))
    db.add(ActuatorCommand(
        farm_id=farm_id,
        device_id="hydro-sensor-01",
        command={"adjust_ph_to": 6.0, "dose_nutrient_ml": 30},
        reason="Scheduled balancing."
    ))
    
    batch_id = "BATCH-" + str(uuid.uuid4())[:8].upper()
    # Check if batch exists first just in case
    db.add(TraceabilityBatch(
        farm_id=farm_id,
        batch_id=batch_id,
        crop="Lettuce",
        sown_date=now - datetime.timedelta(days=30),
        harvest_date=now + datetime.timedelta(days=5),
        quality_grade="A",
        metadata_json={"seed_variety": "Butterhead", "certifications": ["Organic"]}
    ))
    
    print("Seeding Vision & Forecast data...")
    db.add(StressAlert(
        farm_id=farm_id,
        date=now.date(),
        ndvi_value=0.45,
        ndwi_value=0.30,
        stress_level=StressLevel.moderate
    ))
    db.add(PlantCount(
        farm_id=farm_id,
        video_path="/storage/drones/plot1-count.mp4",
        count=4500,
        gaps_detected=150,
        growth_stage="Vegetative"
    ))
    db.add(GrainQualityReport(
        farm_id=farm_id,
        image_path="/storage/scans/grain-scan-wheat.jpg",
        moisture_pct=12.5,
        broken_pct=2.5,
        foreign_matter_pct=1.0,
        grade=GrainGrade.A
    ))
    db.add(PriceForecast(
        crop="Wheat",
        district="Nashik",
        forecast_date=now.date() + datetime.timedelta(days=7),
        predicted_price=2350.0,
        low_ci=2200.0,
        high_ci=2500.0
    ))
    db.add(YieldForecast(
        farm_id=farm_id,
        crop="Wheat",
        low_kg=4000.0,
        median_kg=4200.0,
        high_kg=4500.0,
        forecast_date=now.date() + datetime.timedelta(days=30)
    ))
    db.add(ClimateRiskScore(
        farm_id=farm_id,
        drought_risk=0.15,
        flood_risk=0.05,
        heat_risk=0.45,
        horizon_years=5
    ))
    
    try:
        db.commit()
        print("Database seeding completed successfully.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
