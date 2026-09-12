"""Planning business logic and rule engines.

Implements MASTER-SPEC features:
  #2  AI Crop Planning (rule-based agronomy matrix; ML swap point marked)
  #19 Variety Recommendation (rule-based per-crop varieties; ML swap point marked)
  #23 RL Crop Rotation (heuristic rotation logic; RL swap point marked)
  #40 Variable-Rate Application (linear scaled prescriptions based on soil/NDVI)
"""
from datetime import date
from typing import List

# --------------------------------------------------------------------------- #
# Crop planning rules: covers all 6 soil types x 3 seasons
# --------------------------------------------------------------------------- #
CROP_RULES = {
    ("black", "kharif"): (
        "Cotton",
        "Bunny BG-II",
        55000.0,
        "Black (regur) soil retains moisture and is the classic cotton-growing soil of India."
    ),
    ("black", "rabi"): (
        "Chickpea (Gram)",
        "JG-11",
        30000.0,
        "Black soil's moisture retention supports rabi chickpea without heavy irrigation."
    ),
    ("black", "zaid"): (
        "Sunflower",
        "KBSH-44",
        25000.0,
        "Sunflower tolerates the black soil's cracking/drying cycle in the short zaid season."
    ),

    ("red", "kharif"): (
        "Groundnut",
        "TAG-24",
        40000.0,
        "Red soil's good drainage and moderate fertility suit groundnut pegging in kharif."
    ),
    ("red", "rabi"): (
        "Horse Gram",
        "BGM-1",
        15000.0,
        "A hardy legume that grows on red soil's lower fertility with minimal input in rabi."
    ),
    ("red", "zaid"): (
        "Sesame",
        "TMV-7",
        18000.0,
        "Sesame is drought-tolerant, fitting red soil's low water-holding capacity in zaid."
    ),

    ("clay", "kharif"): (
        "Paddy (Rice)",
        "IR-64",
        45000.0,
        "Clay soil has high water retention ideal for wetland paddy cultivation during monsoon."
    ),
    ("clay", "rabi"): (
        "Wheat",
        "HD-2967",
        35000.0,
        "Moisture retention in heavy clay soil provides steady root zone water for rabi wheat."
    ),
    ("clay", "zaid"): (
        "Green Gram (Moong)",
        "IPM 02-3",
        20000.0,
        "Short duration moong utilizes residual clay moisture in summer to fix nitrogen."
    ),

    ("loam", "kharif"): (
        "Maize",
        "Vivek QPM-9",
        32000.0,
        "Loamy soil provides ideal balance of aeration and moisture for kharif maize."
    ),
    ("loam", "rabi"): (
        "Mustard",
        "Pusa Bold",
        22000.0,
        "Loam soil promotes excellent root development for high-yield rabi mustard."
    ),
    ("loam", "zaid"): (
        "Vegetables (Cucumber)",
        "Poinsette",
        28000.0,
        "Warm weather and fertile loam enable quick-yielding summer vegetable production."
    ),

    ("sandy", "kharif"): (
        "Bajra (Pearl Millet)",
        "HHB-67",
        22000.0,
        "Bajra is the premier drought-resilient crop for light sandy soils with fast drainage."
    ),
    ("sandy", "rabi"): (
        "Mustard",
        "RH-749",
        20000.0,
        "Mustard requires minimal irrigation, matching sandy soil's low moisture retention."
    ),
    ("sandy", "zaid"): (
        "Watermelon",
        "Sugar Baby",
        26000.0,
        "Warm sandy loam/sand beds along rivers or irrigated plots produce sweet zaid melons."
    ),

    ("silt", "kharif"): (
        "Sugarcane",
        "Co-0238",
        65000.0,
        "Deep, rich alluvial silt deposits provide organic nutrition for long-duration sugarcane."
    ),
    ("silt", "rabi"): (
        "Potato",
        "Kufri Jyoti",
        48000.0,
        "Loose, friable silt soil enables rapid tuber expansion and easy harvesting."
    ),
    ("silt", "zaid"): (
        "Fodder Maize",
        "African Tall",
        18000.0,
        "Fast-growing green fodder leverages silt fertility before next season planting."
    ),
}

DEFAULT_SOIL_TYPE = "loam"


# TODO(ml-swap): swap rule-based lookup for trained XGBoost/LightGBM crop recommendation model
def recommend_crop_plan(soil_type: str, season: str, year: int) -> dict:
    soil_key = (soil_type or DEFAULT_SOIL_TYPE).strip().lower()
    season_key = season.strip().lower()

    # Fallback to general mapping if specific combination missing
    if (soil_key, season_key) in CROP_RULES:
        crop, variety, investment, reasoning = CROP_RULES[(soil_key, season_key)]
    else:
        crop, variety, investment, reasoning = CROP_RULES.get(
            (DEFAULT_SOIL_TYPE, season_key),
            ("Cotton", "Bunny BG-II", 50000.0, "Standard recommendation based on season conditions.")
        )

    sowing_month = {"kharif": 6, "rabi": 10, "zaid": 3}.get(season_key, 6)
    return {
        "recommended_crop": crop,
        "recommended_variety": variety,
        "sowing_date": date(year, sowing_month, 15),
        "expected_investment": investment,
        "reasoning": reasoning,
    }


# --------------------------------------------------------------------------- #
# RL Crop Rotation logic
# --------------------------------------------------------------------------- #
# TODO(ml-swap): replace with stable-baselines3 RL agent inference (backend/ml_models/rotation_rl_agent.zip)
LEGUMES = {"moong", "urad", "chickpea", "soybean", "groundnut", "lentil", "arhar", "horse gram", "guar", "gram"}
HIGH_VALUE_ROTATION_CROPS = ["Cotton", "Sugarcane", "Soybean", "Maize", "Wheat", "Groundnut"]


def recommend_rotation(
    soil_nitrogen: float, soil_organic_carbon: float, last_3_crops: List[str]
) -> dict:
    last_lower = {c.strip().lower() for c in last_3_crops}
    has_legume = any(l in last_lower for l in LEGUMES)

    if not has_legume:
        next_crop = "Chickpea"  # legume rotation-in to fix nitrogen
        soil_impact = 0.8  # positive: improves soil
        profit = 30000.0
    else:
        candidates = [c for c in HIGH_VALUE_ROTATION_CROPS if c.lower() not in last_lower]
        next_crop = candidates[0] if candidates else HIGH_VALUE_ROTATION_CROPS[0]
        soil_impact = round(min(0.6, 0.3 + soil_organic_carbon * 0.1), 2)
        profit = round(45000.0 + soil_nitrogen * 200, 2)

    return {
        "next_crop": next_crop,
        "projected_profit": profit,
        "projected_soil_impact": soil_impact,
    }


# --------------------------------------------------------------------------- #
# Variety recommendations
# --------------------------------------------------------------------------- #
# TODO(ml-swap): replace with trained variety-ranking model per docs/02-ML-TRAINING-PROMPTS.md
VARIETY_RULES = {
    "rice": [("Pusa Basmati 1121", 0.91), ("Swarna", 0.85), ("IR-64", 0.78)],
    "wheat": [("HD-2967", 0.90), ("PBW-343", 0.83)],
    "cotton": [("Bunny BG-II", 0.88), ("RCH-2", 0.80), ("Ankur-3028", 0.75)],
    "maize": [("Vivek QPM-9", 0.87), ("DKC-9108", 0.82)],
    "groundnut": [("TAG-24", 0.86), ("GG-20", 0.79)],
    "chickpea": [("JG-11", 0.89), ("KAK-2", 0.81)],
}
DEFAULT_VARIETIES = [("Local Certified Seed", 0.6)]


def recommend_varieties(crop: str) -> List[dict]:
    options = VARIETY_RULES.get(crop.strip().lower(), DEFAULT_VARIETIES)
    return [{"name": name, "score": score} for name, score in options]


# --------------------------------------------------------------------------- #
# Variable-Rate Prescription calculation
# --------------------------------------------------------------------------- #
# TODO(ml-swap): replace linear scaling with trained per-zone variable-rate model
BASE_RATES = {
    "default": {"seed_rate_kg": 20.0, "fertilizer_kg": 50.0, "pesticide_ml": 500.0},
    "cotton": {"seed_rate_kg": 4.0, "fertilizer_kg": 80.0, "pesticide_ml": 800.0},
    "rice": {"seed_rate_kg": 25.0, "fertilizer_kg": 60.0, "pesticide_ml": 400.0},
    "wheat": {"seed_rate_kg": 100.0, "fertilizer_kg": 70.0, "pesticide_ml": 300.0},
}


def compute_variable_rate(crop: str, zones: List[dict]) -> List[dict]:
    base = BASE_RATES.get(crop.strip().lower(), BASE_RATES["default"])
    prescriptions = []
    for z in zones:
        # Normalize soil_score and ndvi_score to 0.0 - 1.0 range
        raw_soil = float(z["soil_score"])
        soil_score = (raw_soil / 100.0) if raw_soil > 1.0 else raw_soil
        soil_score = max(0.0, min(1.0, soil_score))

        raw_ndvi = float(z["ndvi_score"])
        ndvi_score = max(0.0, min(1.0, raw_ndvi))

        # better soil -> can support slightly higher seed rate (up to +20%)
        seed_rate = round(base["seed_rate_kg"] * (0.9 + 0.2 * soil_score), 2)
        # lower NDVI (weaker crop vigor) -> more fertilizer, up to +40%
        fertilizer = round(base["fertilizer_kg"] * (1.4 - 0.4 * ndvi_score), 2)
        # lower soil score -> slightly more pesticide, up to +30%
        pesticide = round(base["pesticide_ml"] * (1.3 - 0.3 * soil_score), 2)

        prescriptions.append({
            "zone_id": str(z["zone_id"]),
            "seed_rate_kg": seed_rate,
            "fertilizer_kg": fertilizer,
            "pesticide_ml": pesticide,
        })
    return prescriptions
