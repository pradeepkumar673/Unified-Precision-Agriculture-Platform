"""
train_crop_planner.py
=====================
Generates a synthetic dataset of 5000 Indian farm observations and trains
an XGBoost multiclass classifier to recommend the best crop.

Features
--------
  soil_type          : categorical — 'clayey','loamy','sandy','black','red','alluvial'
  rainfall_mm        : annual rainfall (mm)
  temperature        : mean kharif-season temperature (°C)
  past_crop          : categorical — last-season crop (nitrogen fixers tracked)
  market_price_trend : 'rising', 'stable', 'falling'

Target
------
  recommended_crop : one of 12 common Indian crops

Agronomy rules encoded
----------------------
  Rice      — wet, heavy clay/alluvial, >900 mm rain, hot (26-36 °C)
  Wheat     — cool (14-22 °C), loamy/alluvial, 250-650 mm rain, after rice/legume
  Maize     — moderate rain (500-900 mm), loamy/sandy, warm (20-30 °C)
  Cotton    — black soil, semi-arid (500-800 mm), very warm (25-35 °C)
  Sugarcane — alluvial/loamy, high rainfall (900-1600 mm), hot
  Soybean   — black/loamy, medium rain (600-900 mm), after cereal (nitrogen reset)
  Chickpea  — low rain (<500 mm), loamy/red, cool (14-22 °C)
  Groundnut — sandy/red, 450-750 mm, warm (24-32 °C)
  Mustard   — loamy/alluvial, cool (10-20 °C), dry (<450 mm), rising oilseed price
  Turmeric  — heavy rain (>1200 mm), loamy, hot-humid
  Jowar     — black/red, drought-tolerant (300-600 mm), warm
  Bajra     — very sandy, very arid (<400 mm), hot

Outputs
-------
  backend/ml_models/crop_planner.pkl           — trained pipeline (encoder + XGBoost)
  backend/ml_models/crop_planner_classes.json  — label index <-> crop name mapping
"""
import json
import pickle
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder, OrdinalEncoder
from xgboost import XGBClassifier

# ──────────────────────────────────────────────────────────────
# 1. Agronomy knowledge base
# ──────────────────────────────────────────────────────────────
SOIL_TYPES   = ["clayey", "loamy", "sandy", "black", "red", "alluvial"]
PAST_CROPS   = ["rice", "wheat", "maize", "cotton", "soybean",
                "chickpea", "groundnut", "mustard", "jowar", "bajra",
                "sugarcane", "turmeric", "fallow"]
PRICE_TRENDS = ["rising", "stable", "falling"]
TARGET_CROPS = [
    "rice", "wheat", "maize", "cotton", "sugarcane",
    "soybean", "chickpea", "groundnut", "mustard",
    "turmeric", "jowar", "bajra",
]

# Crop-specific feasibility config
# (preferred_soils, (rain_lo, rain_hi), (temp_lo, temp_hi), price_boost_if_rising)
CROP_CONFIG = {
    "rice":      (["clayey", "alluvial"],   (900,  2000), (26, 36), 0.0),
    "wheat":     (["loamy",  "alluvial"],   (250,   650), (14, 22), 0.0),
    "maize":     (["loamy",  "sandy"],      (500,   900), (20, 30), 0.0),
    "cotton":    (["black"],                (500,   800), (25, 35), 0.3),
    "sugarcane": (["alluvial", "loamy"],    (900,  1600), (24, 34), 0.0),
    "soybean":   (["black", "loamy"],       (600,   900), (22, 30), 0.2),
    "chickpea":  (["loamy", "red"],         (200,   500), (14, 22), 0.0),
    "groundnut": (["sandy", "red"],         (450,   750), (24, 32), 0.1),
    "mustard":   (["loamy", "alluvial"],    (200,   450), (10, 20), 0.4),
    "turmeric":  (["loamy"],               (1200,  1800), (25, 35), 0.2),
    "jowar":     (["black", "red"],         (300,   600), (25, 35), 0.0),
    "bajra":     (["sandy"],               (150,   400), (25, 38), 0.0),
}

NITROGEN_FIXERS = {"soybean", "chickpea", "groundnut"}
CEREALS         = {"rice", "wheat", "maize", "jowar", "bajra", "sugarcane"}


# ──────────────────────────────────────────────────────────────
# 2. Synthetic data generator
# ──────────────────────────────────────────────────────────────
def score_crop(crop, soil, rain, temp, past_crop, price_trend, rng):
    """
    Return a suitability score for planting `crop` under the given conditions.
    Score is noisy so the data is learnable but not trivially rule-based.
    """
    preferred_soils, (r_lo, r_hi), (t_lo, t_hi), price_boost = CROP_CONFIG[crop]

    # Soil match
    soil_ok = 1.0 if soil in preferred_soils else 0.15

    # Rainfall: Gaussian centred on mid-range
    r_mid   = (r_lo + r_hi) / 2.0
    r_span  = max(r_hi - r_lo, 1)
    r_score = float(np.exp(-0.5 * ((rain - r_mid) / r_span) ** 2))

    # Temperature: Gaussian
    t_mid   = (t_lo + t_hi) / 2.0
    t_half  = max((t_hi - t_lo) / 2.0, 1)
    t_score = float(np.exp(-0.5 * ((temp - t_mid) / t_half) ** 2))

    # Crop rotation
    rotation_bonus = 0.0
    if crop in NITROGEN_FIXERS and past_crop in CEREALS:
        rotation_bonus = 0.25   # legume after cereal: soil N benefit
    elif crop in CEREALS and past_crop in NITROGEN_FIXERS:
        rotation_bonus = 0.10   # cereal after legume
    elif crop == past_crop:
        rotation_bonus = -0.30  # monoculture penalty

    # Market signal
    market_bonus = price_boost if price_trend == "rising" else 0.0

    score = soil_ok * r_score * t_score + rotation_bonus + market_bonus
    score += rng.normal(0, 0.08)
    return max(score, 0.0)


def generate_dataset(n: int = 5000, seed: int = 42) -> pd.DataFrame:
    rng = np.random.RandomState(seed)

    soils        = rng.choice(SOIL_TYPES,   n)
    rainfalls    = np.clip(rng.normal(700, 350, n), 100, 2200).astype(int)
    temps        = np.clip(rng.normal(26, 6, n), 8, 42).astype(float).round(1)
    past_crops   = rng.choice(PAST_CROPS,   n)
    price_trends = rng.choice(PRICE_TRENDS, n)

    records = []
    for i in range(n):
        soil  = soils[i]
        rain  = int(rainfalls[i])
        temp  = float(temps[i])
        past  = past_crops[i]
        price = price_trends[i]

        scores = {
            crop: score_crop(crop, soil, rain, temp, past, price, rng)
            for crop in TARGET_CROPS
        }
        best_crop = max(scores, key=scores.get)

        records.append({
            "soil_type":          soil,
            "rainfall_mm":        rain,
            "temperature":        temp,
            "past_crop":          past,
            "market_price_trend": price,
            "recommended_crop":   best_crop,
        })

    df = pd.DataFrame(records)
    print(f"Dataset shape: {df.shape}")
    print("\nClass distribution:")
    print(df["recommended_crop"].value_counts().to_string())
    return df


# ──────────────────────────────────────────────────────────────
# 3. Train XGBoost pipeline
# ──────────────────────────────────────────────────────────────
def train(df: pd.DataFrame, out_dir: Path):
    out_dir.mkdir(parents=True, exist_ok=True)

    X = df.drop(columns=["recommended_crop"])
    y = df["recommended_crop"]

    # Encode target labels
    le    = LabelEncoder()
    y_enc = le.fit_transform(y)

    # Save class index map
    class_map   = {int(i): name for i, name in enumerate(le.classes_)}
    classes_path = out_dir / "crop_planner_classes.json"
    with open(classes_path, "w") as f:
        json.dump(class_map, f, indent=2)
    print(f"\nClasses saved to {classes_path}")

    # Feature preprocessing
    cat_cols = ["soil_type", "past_crop", "market_price_trend"]
    num_cols = ["rainfall_mm", "temperature"]

    preprocessor = ColumnTransformer(transformers=[
        ("cat", OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1), cat_cols),
        ("num", "passthrough", num_cols),
    ])

    xgb = XGBClassifier(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.08,
        subsample=0.8,
        colsample_bytree=0.8,
        eval_metric="mlogloss",
        random_state=42,
        tree_method="hist",
    )

    pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier",   xgb),
    ])

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_enc, test_size=0.2, random_state=42, stratify=y_enc
    )

    print("\nTraining XGBoost (n_estimators=300, depth=6)...")
    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    acc    = (y_pred == y_test).mean()
    print(f"\nTest accuracy: {acc:.4f}  ({acc * 100:.2f}%)")
    print("\nClassification report:")
    print(classification_report(y_test, y_pred, target_names=le.classes_))

    bundle   = {"pipeline": pipeline, "label_encoder": le}
    pkl_path = out_dir / "crop_planner.pkl"
    with open(pkl_path, "wb") as f:
        pickle.dump(bundle, f)
    print(f"\nModel saved => {pkl_path}  ({pkl_path.stat().st_size // 1024} KB)")
    return bundle


# ──────────────────────────────────────────────────────────────
# 4. predict() — importable by the FastAPI service
# ──────────────────────────────────────────────────────────────
_BUNDLE_CACHE = {}   # module-level cache so pkl is only loaded once per process


def predict(features_dict: dict, model_path: str = None) -> dict:
    """
    Recommend the best crop to plant given farm conditions.

    Parameters
    ----------
    features_dict : dict
        soil_type          : str   — 'clayey' | 'loamy' | 'sandy' | 'black' | 'red' | 'alluvial'
        rainfall_mm        : int   — annual rainfall in mm
        temperature        : float — mean season temperature in degrees C
        past_crop          : str   — last crop grown (or 'fallow')
        market_price_trend : str   — 'rising' | 'stable' | 'falling'
    model_path : str, optional
        Absolute path to crop_planner.pkl.  Auto-resolved if None.

    Returns
    -------
    dict
        recommended_crop : str
        confidence_pct   : float (0-100)
        top3             : list[dict] with keys 'crop', 'confidence_pct'
    """
    if model_path is None:
        model_path = str(Path(__file__).parent / "ml_models" / "crop_planner.pkl")

    if model_path not in _BUNDLE_CACHE:
        with open(model_path, "rb") as f:
            _BUNDLE_CACHE[model_path] = pickle.load(f)

    bundle   = _BUNDLE_CACHE[model_path]
    pipeline = bundle["pipeline"]
    le       = bundle["label_encoder"]

    row = pd.DataFrame([{
        "soil_type":          str(features_dict.get("soil_type", "loamy")),
        "rainfall_mm":        int(features_dict.get("rainfall_mm", 700)),
        "temperature":        float(features_dict.get("temperature", 26)),
        "past_crop":          str(features_dict.get("past_crop", "fallow")),
        "market_price_trend": str(features_dict.get("market_price_trend", "stable")),
    }])

    proba   = pipeline.predict_proba(row)[0]
    top_idx = proba.argsort()[::-1][:3]

    recommended = str(le.classes_[top_idx[0]])
    confidence  = round(float(proba[top_idx[0]]) * 100, 2)
    top3 = [
        {"crop": str(le.classes_[i]), "confidence_pct": round(float(proba[i]) * 100, 2)}
        for i in top_idx
    ]

    return {
        "recommended_crop": recommended,
        "confidence_pct":   confidence,
        "top3":             top3,
    }


# ──────────────────────────────────────────────────────────────
# 5. Entry point
# ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    out_dir = Path(__file__).parent / "ml_models"

    print("=" * 60)
    print("STEP 1 — Generate synthetic dataset (n=5000)")
    print("=" * 60)
    df = generate_dataset(n=5000, seed=42)

    print("\n" + "=" * 60)
    print("STEP 2 — Train XGBoost pipeline")
    print("=" * 60)
    bundle = train(df, out_dir)

    print("\n" + "=" * 60)
    print("STEP 3 — Smoke-test predict()")
    print("=" * 60)

    test_cases = [
        # soil          rain  temp  past          price     expected
        ("clayey",      1400,  30,  "wheat",     "stable"),   # rice or sugarcane
        ("loamy",        400,  18,  "rice",      "stable"),   # wheat or chickpea
        ("black",        650,  30,  "soybean",   "rising"),   # cotton
        ("sandy",        280,  34,  "groundnut", "stable"),   # bajra
        ("loamy",        300,  15,  "rice",      "rising"),   # mustard
        ("alluvial",    1500,  31,  "wheat",     "stable"),   # sugarcane
        ("red",          550,  27,  "maize",     "stable"),   # groundnut or jowar
    ]

    for soil, rain, temp, past, price in test_cases:
        fd = dict(soil_type=soil, rainfall_mm=rain, temperature=temp,
                  past_crop=past, market_price_trend=price)
        res = predict(fd, model_path=str(out_dir / "crop_planner.pkl"))
        top3_str = ", ".join(
            f"{r['crop']}({r['confidence_pct']:.0f}%)" for r in res["top3"]
        )
        print(f"  [{soil:8s} rain={rain:4d} temp={temp:2.0f}C past={past:10s} {price:7s}]"
              f"  =>  {res['recommended_crop']:10s}  {res['confidence_pct']:.1f}%"
              f"   top3: {top3_str}")

    print("\nAll done — crop_planner.pkl ready for the FastAPI /crop-plan endpoint.")
