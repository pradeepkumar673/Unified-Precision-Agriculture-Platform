"""Rule-based / classical-CV / classical-stats placeholder logic for the
vision_forecast feature-group. Every TODO(ml-swap) marks where a trained
model eventually replaces the heuristic — signatures stay stable.
"""
import math
import random
from datetime import date, timedelta

import cv2
import numpy as np


# --------------------------------------------------------------------------- #
# #11 Satellite Stress — synthetic NDVI/NDWI
# --------------------------------------------------------------------------- #
def generate_ndvi_ndwi(farm_id: str) -> dict:
    """
    TODO(ml-swap): replace synthetic NDVI/NDWI with a real Sentinel-2 API
    pull (band math on B4/B8/B8A/B11) for this farm's field boundary AOI.
    Seeded per (farm_id, day) so repeat calls the same day are stable.
    """
    rng = random.Random(f"{farm_id}-{date.today().isoformat()}")
    return {
        "ndvi_value": round(rng.uniform(0.15, 0.85), 3),
        "ndwi_value": round(rng.uniform(-0.3, 0.5), 3),
    }


def classify_stress(ndvi: float, ndwi: float) -> str:
    if ndvi >= 0.6 and ndwi >= 0.1:
        return "none"
    if ndvi >= 0.45:
        return "mild"
    if ndvi >= 0.3:
        return "moderate"
    return "severe"


# --------------------------------------------------------------------------- #
# #12 Drone Plant Counting — OpenCV contour-blob heuristic
# --------------------------------------------------------------------------- #
def count_plants_from_video(video_path: str) -> dict:
    """
    TODO(ml-swap): replace green-blob contour counting with a trained YOLOv8
    plant-detection model (backend/ml_models/plant_counter_yolov8.pt).
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Could not open video at {video_path}")

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 1
    sample_indices = sorted(set(int(total_frames * f) for f in (0.1, 0.3, 0.5, 0.7, 0.9)))

    counts_per_frame = []
    for idx in sample_indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
        ret, frame = cap.read()
        if not ret:
            continue
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        green_mask = cv2.inRange(hsv, (35, 40, 40), (85, 255, 255))
        contours, _ = cv2.findContours(green_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        min_area = 150  # px^2 noise-filter threshold
        counts_per_frame.append(sum(1 for c in contours if cv2.contourArea(c) >= min_area))

    cap.release()
    if not counts_per_frame:
        raise ValueError("No readable frames found in video")

    avg_count = round(sum(counts_per_frame) / len(counts_per_frame))
    gaps_detected = max(0, max(counts_per_frame) - avg_count)

    if avg_count >= 40:
        growth_stage = "canopy-closure"
    elif avg_count >= 20:
        growth_stage = "vegetative"
    elif avg_count >= 5:
        growth_stage = "seedling"
    else:
        growth_stage = "germination"

    return {"count": avg_count, "gaps_detected": gaps_detected, "growth_stage": growth_stage}


# --------------------------------------------------------------------------- #
# #14 Grain Quality — OpenCV colour/texture heuristic
# --------------------------------------------------------------------------- #
def analyze_grain_quality(image_path: str) -> dict:
    """
    TODO(ml-swap): replace with the trained grain-quality CNN once
    backend/ml_models/grain_quality_model.pt exists.
    """
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Could not read image at {image_path}")

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    total_px = gray.shape[0] * gray.shape[1]

    std_dev = float(np.std(gray))  # texture-roughness proxy for broken grains
    dark_mask = cv2.inRange(hsv, (0, 0, 0), (180, 255, 60))
    dark_ratio = float(np.count_nonzero(dark_mask)) / total_px  # foreign matter/staining proxy

    moisture_pct = round(min(18.0, 10.0 + dark_ratio * 20.0), 2)
    broken_pct = round(min(25.0, (std_dev / 255.0) * 40.0), 2)
    foreign_matter_pct = round(min(10.0, dark_ratio * 15.0), 2)

    if moisture_pct <= 13.0 and broken_pct <= 5.0 and foreign_matter_pct <= 1.0:
        grade = "A"
    elif moisture_pct <= 15.0 and broken_pct <= 12.0 and foreign_matter_pct <= 3.0:
        grade = "B"
    else:
        grade = "C"

    return {
        "moisture_pct": moisture_pct,
        "broken_pct": broken_pct,
        "foreign_matter_pct": foreign_matter_pct,
        "grade": grade,
    }


# --------------------------------------------------------------------------- #
# #15 Mandi Price Forecast — synthetic history + linear-trend/MA model
# --------------------------------------------------------------------------- #
def generate_synthetic_price_history(crop: str, district: str, weeks_back: int = 52) -> list:
    """
    TODO(ml-swap): replace synthetic history + naive trend/MA model with the
    trained Prophet model (backend/ml_models/price_forecast_<crop>.pkl) fit
    on real mandi price history (docs/02-ML-TRAINING-PROMPTS.md).
    """
    seed_str = f"{crop.lower()}-{district.lower()}"
    rng = np.random.default_rng(abs(hash(seed_str)) % (2**32))

    base_price = 2000 + (abs(hash(crop.lower())) % 3000)
    weeks = np.arange(weeks_back)

    trend = 0.5 * weeks
    seasonal = 200 * np.sin(2 * np.pi * weeks / 52.0)
    noise = rng.normal(0, 50, size=weeks_back)
    prices = base_price + trend + seasonal + noise
    return [round(float(p), 2) for p in prices]


def forecast_price(history: list, weeks_ahead: int) -> dict:
    y = np.array(history)
    x = np.arange(len(y))

    # Fit linear trend
    slope, intercept = np.polyfit(x, y, 1)
    # Fit simple 1-harmonic seasonal component
    residuals = y - (slope * x + intercept)
    cos_part = np.cos(2 * np.pi * x / 52.0)
    sin_part = np.sin(2 * np.pi * x / 52.0)
    a = 2.0 * np.mean(residuals * cos_part)
    b = 2.0 * np.mean(residuals * sin_part)

    target_x = len(y) - 1 + weeks_ahead
    pred = (
        slope * target_x
        + intercept
        + a * math.cos(2 * math.pi * target_x / 52.0)
        + b * math.sin(2 * math.pi * target_x / 52.0)
    )

    std_err = float(np.std(residuals))
    ci_width = 1.96 * std_err * math.sqrt(1 + weeks_ahead / len(y))

    return {
        "predicted_price": round(float(pred), 2),
        "low_ci": round(float(pred - ci_width), 2),
        "high_ci": round(float(pred + ci_width), 2),
    }


# --------------------------------------------------------------------------- #
# #16 Yield Forecast — baseline per-acre yield table
# --------------------------------------------------------------------------- #
AVG_YIELD_KG_PER_ACRE = {
    "rice": 2200.0,
    "wheat": 1800.0,
    "cotton": 800.0,
    "maize": 2500.0,
    "sugarcane": 30000.0,
    "groundnut": 1000.0,
    "chickpea": 700.0,
    "mustard": 600.0,
}
DEFAULT_AVG_YIELD = 1200.0


def estimate_yield(crop: str, land_size_acres: float) -> dict:
    """
    TODO(ml-swap): replace with LightGBM quantile regression model fit on
    soil/weather/crop/variety features (see docs/02-ML-TRAINING-PROMPTS.md).
    """
    base_per_acre = AVG_YIELD_KG_PER_ACRE.get(crop.strip().lower(), DEFAULT_AVG_YIELD)
    median = round(base_per_acre * land_size_acres, 2)
    return {
        "low_kg": round(median * 0.85, 2),
        "median_kg": median,
        "high_kg": round(median * 1.15, 2),
    }


# --------------------------------------------------------------------------- #
# #29 Climate Risk — hardcoded district-risk lookup, nearest by haversine
# --------------------------------------------------------------------------- #
_EARTH_RADIUS_KM = 6371.0


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * _EARTH_RADIUS_KM * math.asin(math.sqrt(a))


DISTRICT_CENTERS = {
    "madurai": (9.9252, 78.1198),
    "chennai": (13.0827, 80.2707),
    "coimbatore": (11.0168, 76.9558),
    "trichy": (10.7905, 78.7047),
    "thanjavur": (10.7870, 79.1378),
    "pune": (18.5204, 73.8567),
}

DISTRICT_RISK_TABLE = {
    "madurai": {"drought": 0.55, "flood": 0.20, "heat": 0.65},
    "chennai": {"drought": 0.25, "flood": 0.60, "heat": 0.55},
    "coimbatore": {"drought": 0.40, "flood": 0.15, "heat": 0.45},
    "trichy": {"drought": 0.50, "flood": 0.25, "heat": 0.60},
    "thanjavur": {"drought": 0.30, "flood": 0.55, "heat": 0.50},
    "pune": {"drought": 0.45, "flood": 0.35, "heat": 0.50},
}
DEFAULT_RISK = {"drought": 0.4, "flood": 0.3, "heat": 0.5}


def _nearest_district(lat: float, lng: float) -> str:
    return min(DISTRICT_CENTERS, key=lambda d: _haversine_km(lat, lng, *DISTRICT_CENTERS[d]))


def estimate_climate_risk(lat: float, lng: float, horizon_years: int) -> dict:
    """
    TODO(ml-swap): replace hardcoded district table with the real downscaled
    climate projection model (#29) once regional climate data is available.
    Nearest district picked via haversine distance from farm lat/lng, per
    MASTER-SPEC Section 4's plain-lat/lng-and-haversine geospatial approach.
    """
    district = _nearest_district(lat, lng)
    base = DISTRICT_RISK_TABLE.get(district, DEFAULT_RISK)
    horizon_multiplier = 1.0 + 0.03 * max(0, horizon_years - 1)
    return {
        "drought_risk": round(min(0.95, base["drought"] * horizon_multiplier), 3),
        "flood_risk": round(min(0.95, base["flood"] * horizon_multiplier), 3),
        "heat_risk": round(min(0.95, base["heat"] * horizon_multiplier), 3),
    }
