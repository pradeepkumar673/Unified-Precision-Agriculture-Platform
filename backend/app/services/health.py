"""Rule-based / classical-CV placeholder logic for the `health` feature group.

TODO(ml-swap): every image-analysis function here is an OpenCV colour/texture
heuristic standing in for a trained CNN (see docs/02-ML-TRAINING-PROMPTS.md).
Signatures are kept stable so api/v1/health.py doesn't change on the swap.
"""
import random
from datetime import date, timedelta
from typing import Tuple

import cv2
import numpy as np


# --------------------------------------------------------------------------- #
# shared colour-ratio helper
# --------------------------------------------------------------------------- #
def _color_ratios(image_path: str) -> Tuple[float, float]:
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Could not read image at {image_path}")

    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    total_px = hsv.shape[0] * hsv.shape[1]

    green_mask = cv2.inRange(hsv, np.array([35, 40, 40]), np.array([85, 255, 255]))
    green_ratio = float(np.count_nonzero(green_mask)) / total_px

    brown_mask = cv2.inRange(hsv, np.array([5, 40, 20]), np.array([30, 255, 200]))
    brown_ratio = float(np.count_nonzero(brown_mask)) / total_px

    return green_ratio, brown_ratio


# --------------------------------------------------------------------------- #
# #4 Crop Health AI - disease detection
# --------------------------------------------------------------------------- #
DISEASE_TREATMENTS = {
    "Healthy": "No treatment needed. Continue regular monitoring and balanced NPK fertilization.",
    "Leaf Blight": "Apply Mancozeb 75% WP at 2.5g/litre water; remove and destroy infected leaves.",
    "Powdery Mildew": "Spray wettable sulphur 80% WP at 2g/litre or neem oil 3ml/litre every 7 days.",
    "Leaf Rust": "Apply Propiconazole 25% EC at 1ml/litre; avoid overhead irrigation.",
    "Bacterial Spot": "Apply copper oxychloride 50% WP at 3g/litre; ensure field drainage and rotate crops.",
}


def analyze_crop_disease_image(image_path: str, crop: str) -> dict:
    """
    TODO(ml-swap): replace this OpenCV colour heuristic with inference from
    the trained CNN at backend/ml_models/crop_disease_model.pt (MobileNetV3).
    Keep the return contract (predicted_disease/confidence/severity/
    treatment_recommendation) identical.
    """
    green_ratio, brown_ratio = _color_ratios(image_path)

    if green_ratio >= 0.55:
        label, confidence = "Healthy", round(min(0.95, 0.6 + green_ratio * 0.4), 3)
    elif brown_ratio >= 0.35:
        label, confidence = "Leaf Blight", round(min(0.92, 0.5 + brown_ratio * 0.5), 3)
    elif 0.20 <= brown_ratio < 0.35:
        label, confidence = "Bacterial Spot", round(min(0.88, 0.45 + brown_ratio * 0.6), 3)
    elif green_ratio < 0.25 and brown_ratio < 0.20:
        label, confidence = "Powdery Mildew", round(min(0.85, 0.5 + (0.25 - green_ratio) * 1.2), 3)
    else:
        label, confidence = "Leaf Rust", round(min(0.80, 0.4 + brown_ratio * 0.8), 3)

    if label == "Healthy":
        severity = "low"
    elif confidence >= 0.75:
        severity = "high"
    elif confidence >= 0.55:
        severity = "medium"
    else:
        severity = "low"

    return {
        "predicted_disease": label,
        "confidence": confidence,
        "severity": severity,
        "treatment_recommendation": f"[{crop}] {DISEASE_TREATMENTS[label]}",
    }


# --------------------------------------------------------------------------- #
# #13 Weed Classification
# --------------------------------------------------------------------------- #
WEED_HERBICIDES = {
    "Broadleaf Weed": ("2,4-D Amine 58% SL", 800.0),
    "Grassy Weed": ("Quizalofop-ethyl 5% EC", 400.0),
    "Sedge Weed": ("Halosulfuron-methyl 75% WG", 36.0),
}


def analyze_weed_image(image_path: str) -> dict:
    """
    TODO(ml-swap): replace with the trained weed-classification CNN once
    backend/ml_models/weed_classifier.pt exists. Contract must not change.
    """
    green_ratio, brown_ratio = _color_ratios(image_path)

    if green_ratio >= 0.5:
        species, confidence = "Grassy Weed", round(min(0.9, 0.5 + green_ratio * 0.4), 3)
    elif brown_ratio >= 0.3:
        species, confidence = "Sedge Weed", round(min(0.85, 0.5 + brown_ratio * 0.4), 3)
    else:
        remainder = max(0.0, 1.0 - green_ratio - brown_ratio)
        species, confidence = "Broadleaf Weed", round(min(0.8, 0.45 + remainder * 0.3), 3)

    herbicide, base_dosage = WEED_HERBICIDES[species]
    dosage = round(base_dosage * (0.8 + confidence * 0.4), 2)

    return {
        "species": species,
        "confidence": confidence,
        "herbicide": herbicide,
        "dosage_ml_per_acre": dosage,
    }


# --------------------------------------------------------------------------- #
# #20 Pest Spread - synthetic seed data
# --------------------------------------------------------------------------- #
VILLAGE_NAME_POOL = [
    "Rampur", "Keshavpur", "Ganeshpur", "Lakshmipuram", "Chandanpur",
    "Sundarpur", "Mahadevpur", "Anandnagar", "Shivpuri", "Krishnanagar",
]


def generate_synthetic_pest_risk(district: str) -> list:
    """Deterministic-per-district synthetic pest risk scores for villages."""
    seed = sum(ord(c) for c in district)
    rng = random.Random(seed)
    villages = rng.sample(VILLAGE_NAME_POOL, k=5)
    week_of = date.today() - timedelta(days=date.today().weekday())

    seeds = []
    for village in villages:
        seeds.append({
            "village_name": village,
            "district": district,
            "risk_score": round(rng.uniform(0.15, 0.85), 2),
            "week_of": week_of,
            "contributing_reports_count": rng.randint(1, 40),
        })
    return seeds


# --------------------------------------------------------------------------- #
# #51 Livestock Health
# --------------------------------------------------------------------------- #
LIVESTOCK_NEEDS_VET = {
    "Healthy": False,
    "Skin Lesion Suspected": True,
    "Lethargy Indicators": True,
    "Possible Infection": True,
}


def analyze_livestock_image(image_path: str) -> dict:
    """
    TODO(ml-swap): replace with the trained livestock-health CNN once
    available (see docs/02-ML-TRAINING-PROMPTS.md).
    """
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Could not read image at {image_path}")

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    mean_brightness = float(np.mean(gray)) / 255.0
    std_dev = float(np.std(gray)) / 255.0

    if mean_brightness >= 0.55 and std_dev < 0.25:
        condition, confidence = "Healthy", round(min(0.92, 0.6 + mean_brightness * 0.35), 3)
    elif std_dev >= 0.30:
        condition, confidence = "Skin Lesion Suspected", round(min(0.85, 0.5 + std_dev * 0.8), 3)
    elif mean_brightness < 0.35:
        condition, confidence = "Lethargy Indicators", round(min(0.8, 0.5 + (0.35 - mean_brightness) * 1.2), 3)
    else:
        condition, confidence = "Possible Infection", round(min(0.78, 0.45 + std_dev * 0.9), 3)

    vet_booking_requested = LIVESTOCK_NEEDS_VET[condition] and confidence >= 0.55

    return {
        "predicted_condition": condition,
        "confidence": confidence,
        "vet_booking_requested": vet_booking_requested,
    }


# --------------------------------------------------------------------------- #
# livestock defaults (vaccination schedule / breeding cycle) - rule-based
# --------------------------------------------------------------------------- #
VACCINATION_RULES = {
    "cow": [("FMD", 30), ("HS", 90), ("BQ", 90)],
    "buffalo": [("FMD", 30), ("HS", 90)],
    "goat": [("PPR", 45), ("ET", 60)],
    "poultry": [("Newcastle Disease", 14), ("Fowl Pox", 60)],
}

BREEDING_CYCLE_DAYS = {
    "cow": 283,
    "buffalo": 310,
    "goat": 150,
    "poultry": 21,
}


def generate_default_vaccination_schedule(animal_type: str) -> list:
    today = date.today()
    rules = VACCINATION_RULES.get(animal_type, [("General Deworming", 90)])
    return [
        {"vaccine": name, "due_date": (today + timedelta(days=days)).isoformat()}
        for name, days in rules
    ]


def generate_default_breeding_cycle(animal_type: str) -> dict:
    cycle_days = BREEDING_CYCLE_DAYS.get(animal_type, 180)
    return {
        "cycle_length_days": cycle_days,
        "next_expected_event": (date.today() + timedelta(days=cycle_days)).isoformat(),
    }
