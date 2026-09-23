"""Planning business logic and rule engines.

Implements MASTER-SPEC features:
  #2  AI Crop Planning  — XGBoost crop planner (ml_models/crop_planner.pkl)
  #19 Variety Recommendation — ALS collaborative + cosine content fallback
  #23 RL Crop Rotation — PPO agent (ml_models/rl_rotation_ppo.zip)
  #40 Variable-Rate Application — linear scaled prescriptions (kept as-is; no ML target)
"""
import os
import sys
from datetime import date
from pathlib import Path
from typing import List

from app.services import llm

os.environ.setdefault("CUDA_VISIBLE_DEVICES", "")

# Resolve ml_models dir relative to this file's location
_ML_DIR = Path(__file__).resolve().parents[2] / "ml_models"


# --------------------------------------------------------------------------- #
# Lazy-load helpers — models only imported when first called
# --------------------------------------------------------------------------- #
_CROP_PLANNER_CACHE = {}
_ROTATION_CACHE = {}
_VARIETY_CACHE = {}


def _get_crop_planner():
    if "model" not in _CROP_PLANNER_CACHE:
        import pickle, json
        with open(_ML_DIR / "crop_planner.pkl", "rb") as f:
            bundle = pickle.load(f)
        # crop_planner.pkl is a dict: {pipeline, label_encoder}
        if isinstance(bundle, dict):
            _CROP_PLANNER_CACHE["pipeline"] = bundle["pipeline"]
            _CROP_PLANNER_CACHE["le"]       = bundle["label_encoder"]
        else:
            _CROP_PLANNER_CACHE["pipeline"] = bundle
            _CROP_PLANNER_CACHE["le"]       = None
        with open(_ML_DIR / "crop_planner_classes.json") as f:
            _CROP_PLANNER_CACHE["meta"] = json.load(f)
        _CROP_PLANNER_CACHE["model"] = True   # sentinel
    return (_CROP_PLANNER_CACHE["pipeline"],
            _CROP_PLANNER_CACHE["le"],
            _CROP_PLANNER_CACHE["meta"])


def _get_variety_models():
    if "als" not in _VARIETY_CACHE:
        import pickle
        with open(_ML_DIR / "variety_als_model.pkl", "rb") as f:
            _VARIETY_CACHE["als"] = pickle.load(f)
        with open(_ML_DIR / "variety_content.pkl", "rb") as f:
            _VARIETY_CACHE["content"] = pickle.load(f)
    return _VARIETY_CACHE["als"], _VARIETY_CACHE["content"]


# --------------------------------------------------------------------------- #
# Crop planning rules: covers all 6 soil types x 3 seasons
# Kept as a fallback lookup for when the model is unavailable / edge soil types
# --------------------------------------------------------------------------- #
CROP_RULES = {
    ("black", "kharif"): ("Cotton", "Bunny BG-II", 55000.0,
        "Black (regur) soil retains moisture and is the classic cotton-growing soil of India."),
    ("black", "rabi"):   ("Chickpea (Gram)", "JG-11", 30000.0,
        "Black soil's moisture retention supports rabi chickpea without heavy irrigation."),
    ("black", "zaid"):   ("Sunflower", "KBSH-44", 25000.0,
        "Sunflower tolerates the black soil's cracking/drying cycle in the short zaid season."),
    ("red", "kharif"):   ("Groundnut", "TAG-24", 40000.0,
        "Red soil's good drainage and moderate fertility suit groundnut pegging in kharif."),
    ("red", "rabi"):     ("Horse Gram", "BGM-1", 15000.0,
        "A hardy legume that grows on red soil's lower fertility with minimal input in rabi."),
    ("red", "zaid"):     ("Sesame", "TMV-7", 18000.0,
        "Sesame is drought-tolerant, fitting red soil's low water-holding capacity in zaid."),
    ("clay", "kharif"):  ("Paddy (Rice)", "IR-64", 45000.0,
        "Clay soil has high water retention ideal for wetland paddy cultivation during monsoon."),
    ("clay", "rabi"):    ("Wheat", "HD-2967", 35000.0,
        "Moisture retention in heavy clay soil provides steady root zone water for rabi wheat."),
    ("clay", "zaid"):    ("Green Gram (Moong)", "IPM 02-3", 20000.0,
        "Short duration moong utilizes residual clay moisture in summer to fix nitrogen."),
    ("loam", "kharif"):  ("Maize", "Vivek QPM-9", 32000.0,
        "Loamy soil provides ideal balance of aeration and moisture for kharif maize."),
    ("loam", "rabi"):    ("Mustard", "Pusa Bold", 22000.0,
        "Loam soil promotes excellent root development for high-yield rabi mustard."),
    ("loam", "zaid"):    ("Vegetables (Cucumber)", "Poinsette", 28000.0,
        "Warm weather and fertile loam enable quick-yielding summer vegetable production."),
    ("sandy", "kharif"): ("Bajra (Pearl Millet)", "HHB-67", 22000.0,
        "Bajra is the premier drought-resilient crop for light sandy soils with fast drainage."),
    ("sandy", "rabi"):   ("Mustard", "RH-749", 20000.0,
        "Mustard requires minimal irrigation, matching sandy soil's low moisture retention."),
    ("sandy", "zaid"):   ("Watermelon", "Sugar Baby", 26000.0,
        "Warm sandy loam/sand beds along rivers or irrigated plots produce sweet zaid melons."),
    ("silt", "kharif"):  ("Sugarcane", "Co-0238", 65000.0,
        "Deep, rich alluvial silt deposits provide organic nutrition for long-duration sugarcane."),
    ("silt", "rabi"):    ("Potato", "Kufri Jyoti", 48000.0,
        "Loose, friable silt soil enables rapid tuber expansion and easy harvesting."),
    ("silt", "zaid"):    ("Fodder Maize", "African Tall", 18000.0,
        "Fast-growing green fodder leverages silt fertility before next season planting."),
}
DEFAULT_SOIL_TYPE = "loam"

# Soil type → numeric code used by the XGBoost model
_SOIL_CODE = {"black": 0, "red": 1, "clay": 2, "loam": 3, "sandy": 4, "silt": 5}
_SEASON_CODE = {"kharif": 0, "rabi": 1, "zaid": 2}

# Investment lookup per crop (used when model picks a crop outside CROP_RULES)
_CROP_INVESTMENT = {
    "cotton": 55000, "chickpea": 30000, "sunflower": 25000,
    "groundnut": 40000, "horse gram": 15000, "sesame": 18000,
    "paddy": 45000, "rice": 45000, "wheat": 35000, "green gram": 20000,
    "maize": 32000, "mustard": 22000, "sugarcane": 65000, "potato": 48000,
}


def recommend_crop_plan(soil_type: str, season: str, year: int) -> dict:
    """
    Recommend a crop plan using the trained XGBoost crop planner model.
    Falls back to the agronomic rule table for unseen soil/season combinations.
    """
    soil_key   = (soil_type or DEFAULT_SOIL_TYPE).strip().lower()
    season_key = season.strip().lower()
    sowing_month = {"kharif": 6, "rabi": 10, "zaid": 3}.get(season_key, 6)

    try:
        import pandas as pd
        pipeline, le, meta = _get_crop_planner()

        # Feature columns matching train_crop_planner.py exactly:
        # soil_type (cat), rainfall_mm (num), temperature (num),
        # past_crop (cat), market_price_trend (cat)
        X = pd.DataFrame([{
            "soil_type":           soil_key,
            "rainfall_mm":         700.0,
            "temperature":         28.0,
            "past_crop":           "wheat",        # neutral default
            "market_price_trend":  "stable",       # neutral default
        }])
        pred_raw  = pipeline.predict(X)[0]
        crop_name = str(le.inverse_transform([int(pred_raw)])[0]) if le else str(pred_raw)
        try:
            proba     = pipeline.predict_proba(X)[0]
            pred_idx  = int(proba.argmax())
            confidence = round(float(proba[pred_idx]), 3)
        except Exception:
            confidence = 0.75

        # Try to get investment from rule table first
        rule_key = (soil_key, season_key)
        if rule_key in CROP_RULES:
            _, variety, investment, _ = CROP_RULES[rule_key]
        else:
            variety    = "Certified Local Seed"
            investment = _CROP_INVESTMENT.get(crop_name.lower().split()[0], 30000.0)

        # Generate reasoning dynamically via Groq LLM
        reasoning = llm.generate_crop_plan_reasoning(
            crop=crop_name,
            soil_type=soil_key,
            season=season_key,
            confidence=confidence
        )

        return {
            "recommended_crop":    crop_name,
            "recommended_variety": variety,
            "sowing_date":         date(year, sowing_month, 15),
            "expected_investment": investment,
            "reasoning":           reasoning,
            "model_confidence":    confidence,
            "model_type":          "xgboost_trained",
        }

    except Exception as exc:
        # Graceful degradation to rule table
        if (soil_key, season_key) in CROP_RULES:
            crop, variety, investment, reasoning = CROP_RULES[(soil_key, season_key)]
        else:
            crop, variety, investment, reasoning = CROP_RULES.get(
                (DEFAULT_SOIL_TYPE, season_key),
                ("Cotton", "Bunny BG-II", 50000.0,
                 "Standard recommendation based on season conditions."),
            )
        return {
            "recommended_crop":    crop,
            "recommended_variety": variety,
            "sowing_date":         date(year, sowing_month, 15),
            "expected_investment": investment,
            "reasoning":           reasoning,
            "model_type":          "rule_based_fallback",
            "_fallback_reason":    str(exc),
        }


# --------------------------------------------------------------------------- #
# RL Crop Rotation
# --------------------------------------------------------------------------- #
LEGUMES = {
    "moong", "urad", "chickpea", "soybean", "groundnut", "lentil",
    "arhar", "horse gram", "guar", "gram",
}
HIGH_VALUE_ROTATION_CROPS = [
    "Cotton", "Sugarcane", "Soybean", "Maize", "Wheat", "Groundnut",
]

# Crop name → integer action index used by the PPO environment
_CROP_ACTION = {
    "wheat": 0, "rice": 1, "maize": 2,
    "chickpea": 3, "soybean": 4, "cotton": 5,
}
_ACTION_CROP = {v: k for k, v in _CROP_ACTION.items()}


def recommend_rotation(
    soil_nitrogen: float, soil_organic_carbon: float, last_3_crops: List[str]
) -> dict:
    """
    Recommend next crop in rotation using the trained PPO RL agent.
    Falls back to the legume-rotation heuristic if the agent is unavailable.
    """
    try:
        # ml_rotation.predict() wraps the PPO agent
        # It looks for rl_rotation_model.zip; our trained file is rl_rotation_ppo.zip
        # Create a symlink-equivalent: copy path alias via env var
        import shutil
        _src = _ML_DIR / "rl_rotation_ppo.zip"
        _dst = _ML_DIR / "rl_rotation_model.zip"
        if _src.exists() and not _dst.exists():
            shutil.copy2(str(_src), str(_dst))

        sys.path.insert(0, str(Path(__file__).resolve().parents[0]))
        from ml_rotation import predict as rl_predict

        result = rl_predict(
            soil_nitrogen=soil_nitrogen,
            soil_organic_carbon=soil_organic_carbon,
            last_3_crops=last_3_crops,
        )
        reasoning = llm.generate_rotation_reasoning(
            next_crop=result["next_crop"],
            soil_nitrogen=soil_nitrogen,
            soil_organic_carbon=soil_organic_carbon,
            last_3_crops=last_3_crops
        )
        return {
            "next_crop":             result["next_crop"],
            "projected_profit":      result["projected_profit"],
            "projected_soil_impact": result["projected_soil_impact"],
            "reasoning":             reasoning,
            "model_type":            "ppo_rl_agent",
        }

    except Exception as exc:
        # Heuristic fallback
        last_lower = {c.strip().lower() for c in last_3_crops}
        has_legume = any(l in last_lower for l in LEGUMES)

        if not has_legume:
            next_crop   = "Chickpea"
            soil_impact = 0.8
            profit      = 30000.0
        else:
            candidates = [c for c in HIGH_VALUE_ROTATION_CROPS if c.lower() not in last_lower]
            next_crop   = candidates[0] if candidates else HIGH_VALUE_ROTATION_CROPS[0]
            soil_impact = round(min(0.6, 0.3 + soil_organic_carbon * 0.1), 2)
            profit      = round(45000.0 + soil_nitrogen * 200, 2)

        reasoning = llm.generate_rotation_reasoning(
            next_crop=next_crop,
            soil_nitrogen=soil_nitrogen,
            soil_organic_carbon=soil_organic_carbon,
            last_3_crops=last_3_crops
        )

        return {
            "next_crop":             next_crop,
            "projected_profit":      profit,
            "projected_soil_impact": soil_impact,
            "reasoning":             reasoning,
            "model_type":            "heuristic_fallback",
            "_fallback_reason":      str(exc),
        }


# --------------------------------------------------------------------------- #
# Variety recommendations
# --------------------------------------------------------------------------- #
VARIETY_RULES = {
    "rice":      [("Pusa Basmati 1121", 0.91), ("Swarna", 0.85), ("IR-64", 0.78)],
    "wheat":     [("HD-2967", 0.90), ("PBW-343", 0.83)],
    "cotton":    [("Bunny BG-II", 0.88), ("RCH-2", 0.80), ("Ankur-3028", 0.75)],
    "maize":     [("Vivek QPM-9", 0.87), ("DKC-9108", 0.82)],
    "groundnut": [("TAG-24", 0.86), ("GG-20", 0.79)],
    "chickpea":  [("JG-11", 0.89), ("KAK-2", 0.81)],
}
DEFAULT_VARIETIES = [("Local Certified Seed", 0.6)]


def recommend_varieties(crop: str, farmer_id: str = None) -> List[dict]:
    """
    Recommend seed varieties using the trained ALS collaborative filter
    with cosine-similarity content-based fallback for cold start.
    """
    try:
        import pickle
        sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
        from train_variety_recommender import recommend

        result = recommend(
            farmer_id_or_features=farmer_id or {"crop": crop.strip().lower()},
            top_n=5,
        )
        # Map to API contract: [{name, score}]
        return [
            {
                "name":  r.get("variety_name", r.get("variety_id", "Unknown")),
                "score": round(float(r.get("score", 0.7)), 3),
                "model_type": r.get("method", "als"),
            }
            for r in result.get("recommendations", [])
        ]

    except Exception:
        # Fallback to rule table
        options = VARIETY_RULES.get(crop.strip().lower(), DEFAULT_VARIETIES)
        return [{"name": name, "score": score, "model_type": "rule_based"}
                for name, score in options]


# --------------------------------------------------------------------------- #
# Variable-Rate Prescription calculation (no ML target — kept as-is)
# --------------------------------------------------------------------------- #
BASE_RATES = {
    "default": {"seed_rate_kg": 20.0, "fertilizer_kg": 50.0, "pesticide_ml": 500.0},
    "cotton":  {"seed_rate_kg": 4.0,  "fertilizer_kg": 80.0, "pesticide_ml": 800.0},
    "rice":    {"seed_rate_kg": 25.0, "fertilizer_kg": 60.0, "pesticide_ml": 400.0},
    "wheat":   {"seed_rate_kg": 100.0, "fertilizer_kg": 70.0, "pesticide_ml": 300.0},
}


def compute_variable_rate(crop: str, zones: List[dict]) -> List[dict]:
    base = BASE_RATES.get(crop.strip().lower(), BASE_RATES["default"])
    prescriptions = []
    for z in zones:
        raw_soil  = float(z["soil_score"])
        soil_score = (raw_soil / 100.0) if raw_soil > 1.0 else raw_soil
        soil_score = max(0.0, min(1.0, soil_score))

        raw_ndvi   = float(z["ndvi_score"])
        ndvi_score = max(0.0, min(1.0, raw_ndvi))

        seed_rate  = round(base["seed_rate_kg"]  * (0.9 + 0.2 * soil_score), 2)
        fertilizer = round(base["fertilizer_kg"] * (1.4 - 0.4 * ndvi_score), 2)
        pesticide  = round(base["pesticide_ml"]  * (1.3 - 0.3 * soil_score), 2)

        prescriptions.append({
            "zone_id":       str(z["zone_id"]),
            "seed_rate_kg":  seed_rate,
            "fertilizer_kg": fertilizer,
            "pesticide_ml":  pesticide,
        })
    return prescriptions
