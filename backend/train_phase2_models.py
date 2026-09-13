"""
train_phase2_models.py
======================
Phase 2 / Lower-Priority Models — Item #15

Covers:
  1. Livestock Health Monitor  (#51) — XGBoost multiclass on vitals
  2. Climate Risk Scorer       (#29) — LightGBM regression -> risk [0,1]
  3. Buyer-Seller Match Ranker (#26) — XGBoost pointwise ranking
  4. Satellite Crop Stress     (#11) — LightGBM on spectral indices
  5. Drone Plant Counter       (#12) — LightGBM regression on image stats

All five use REAL trained models on SYNTHETIC datasets.
None are hardcoded lookup tables or bare return values.

Run:
    python train_phase2_models.py                  # trains all 5
    python train_phase2_models.py --model livestock # trains one

Saved models (ml_models/):
    livestock_health_xgb.pkl + livestock_meta.json
    climate_risk_lgbm.pkl    + climate_risk_meta.json
    buyer_match_xgb.pkl      + buyer_match_meta.json
    satellite_stress_lgbm.pkl+ satellite_stress_meta.json
    drone_counter_lgbm.pkl   + drone_counter_meta.json
"""

import argparse
import json
import pickle
import warnings
from pathlib import Path
from typing import Any, Dict

import numpy as np
import pandas as pd

warnings.filterwarnings("ignore")

OUT_DIR = Path(__file__).parent / "ml_models"
OUT_DIR.mkdir(parents=True, exist_ok=True)


# ═══════════════════════════════════════════════════════════════════════════════
# MODEL 1 — Livestock Health Monitor (#51)
# ═══════════════════════════════════════════════════════════════════════════════
"""
Features: temperature_C, heart_rate_bpm, respiration_rpm, milk_yield_L,
          movement_score [0-10], eating_frequency_per_day, body_condition_score [1-5],
          days_since_last_vet, age_years, breed_code [0-3]

Target: health_status (0=healthy, 1=mild_illness, 2=severe_illness)

DGP:
  Healthy animals: temp 38-39, HR 60-80, good milk yield, high movement
  Mild illness:    slightly elevated temp, low milk, reduced movement
  Severe illness:  high fever (>40), very low milk, almost no movement, fast HR
"""

LIVESTOCK_CLASSES = ["healthy", "mild_illness", "severe_illness"]
LIVESTOCK_FEATURES = [
    "temperature_C", "heart_rate_bpm", "respiration_rpm",
    "milk_yield_L", "movement_score", "eating_frequency_per_day",
    "body_condition_score", "days_since_last_vet", "age_years", "breed_code",
]
LIVESTOCK_ADVICE = {
    "healthy":        "Animal is healthy. Schedule routine check in 30 days.",
    "mild_illness":   "Mild signs detected. Monitor closely; consult vet if symptoms persist >48h.",
    "severe_illness": "Severe illness indicators. Contact veterinarian IMMEDIATELY.",
}


def _gen_livestock(n=3000, seed=42):
    rng = np.random.RandomState(seed)

    # Class allocation: 70% healthy, 20% mild, 10% severe
    labels = rng.choice([0, 1, 2], size=n, p=[0.70, 0.20, 0.10])

    temp  = np.where(labels == 0, rng.normal(38.5, 0.3, n),
            np.where(labels == 1, rng.normal(39.3, 0.4, n),
                                  rng.normal(40.3, 0.5, n))).clip(36, 42)

    hr    = np.where(labels == 0, rng.normal(68, 6, n),
            np.where(labels == 1, rng.normal(80, 8, n),
                                  rng.normal(95, 10, n))).clip(40, 130)

    resp  = np.where(labels == 0, rng.normal(18, 3, n),
            np.where(labels == 1, rng.normal(24, 4, n),
                                  rng.normal(34, 5, n))).clip(8, 60)

    milk  = np.where(labels == 0, rng.normal(12, 2, n),
            np.where(labels == 1, rng.normal(7,  2, n),
                                  rng.normal(2,  1, n))).clip(0, 25)

    move  = np.where(labels == 0, rng.normal(7, 1.5, n),
            np.where(labels == 1, rng.normal(4, 1.5, n),
                                  rng.normal(1.5, 1, n))).clip(0, 10)

    eat   = np.where(labels == 0, rng.normal(8, 1.5, n),
            np.where(labels == 1, rng.normal(5, 1.5, n),
                                  rng.normal(2, 1, n))).clip(0, 15)

    bcs   = np.where(labels == 0, rng.normal(3.2, 0.4, n),
            np.where(labels == 1, rng.normal(2.8, 0.5, n),
                                  rng.normal(2.0, 0.5, n))).clip(1, 5)

    days_vet = rng.exponential(20, n).clip(0, 90)
    age      = rng.uniform(1, 12, n)
    breed    = rng.randint(0, 4, n)

    return pd.DataFrame({
        "temperature_C":            np.round(temp, 2),
        "heart_rate_bpm":           np.round(hr, 1),
        "respiration_rpm":          np.round(resp, 1),
        "milk_yield_L":             np.round(milk, 2),
        "movement_score":           np.round(move, 2),
        "eating_frequency_per_day": np.round(eat, 1),
        "body_condition_score":     np.round(bcs, 2),
        "days_since_last_vet":      np.round(days_vet, 0),
        "age_years":                np.round(age, 1),
        "breed_code":               breed,
        "health_status":            labels,
    })


def train_livestock(out_dir: Path):
    import xgboost as xgb
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import accuracy_score, classification_report

    print("\n[1/5] Livestock Health Monitor")
    df = _gen_livestock()
    X  = df[LIVESTOCK_FEATURES].values
    y  = df["health_status"].values

    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2,
                                               random_state=42, stratify=y)
    model = xgb.XGBClassifier(
        n_estimators=200, max_depth=4, learning_rate=0.05,
        subsample=0.8, colsample_bytree=0.8, use_label_encoder=False,
        eval_metric="mlogloss", random_state=42, device="cpu", verbosity=0,
    )
    model.fit(X_tr, y_tr, eval_set=[(X_te, y_te)], verbose=False)

    y_pred = model.predict(X_te)
    acc    = accuracy_score(y_te, y_pred)
    print(f"  Accuracy: {acc*100:.1f}%")
    print(f"  {classification_report(y_te, y_pred, target_names=LIVESTOCK_CLASSES, zero_division=0)}")

    pkl = out_dir / "livestock_health_xgb.pkl"
    with open(pkl, "wb") as f: pickle.dump(model, f)
    meta = {
        "features": LIVESTOCK_FEATURES, "classes": LIVESTOCK_CLASSES,
        "advice": LIVESTOCK_ADVICE, "accuracy": round(acc, 4),
        "model_file": "livestock_health_xgb.pkl",
    }
    with open(out_dir / "livestock_meta.json", "w") as f: json.dump(meta, f, indent=2)
    print(f"  Saved: {pkl}  ({pkl.stat().st_size // 1024} KB)")
    return model


def predict_livestock(features: Dict, model_dir: str = None) -> Dict:
    """
    Assess livestock health from vitals.

    Parameters: temperature_C, heart_rate_bpm, respiration_rpm, milk_yield_L,
                movement_score, eating_frequency_per_day, body_condition_score,
                days_since_last_vet, age_years, breed_code
    Returns: health_status, confidence, advice, all_probabilities
    """
    if model_dir is None: model_dir = str(OUT_DIR)
    key = f"livestock_{model_dir}"
    if key not in _CACHE:
        with open(Path(model_dir) / "livestock_health_xgb.pkl", "rb") as f:
            _CACHE[key] = pickle.load(f)
        with open(Path(model_dir) / "livestock_meta.json") as f:
            _CACHE[f"{key}_meta"] = json.load(f)
    model = _CACHE[key]
    meta  = _CACHE[f"{key}_meta"]

    DEFAULTS = {
        "temperature_C": 38.5, "heart_rate_bpm": 68, "respiration_rpm": 18,
        "milk_yield_L": 10, "movement_score": 7, "eating_frequency_per_day": 8,
        "body_condition_score": 3.2, "days_since_last_vet": 15,
        "age_years": 4, "breed_code": 0,
    }
    row  = [features.get(f, DEFAULTS[f]) for f in LIVESTOCK_FEATURES]
    prob = model.predict_proba([row])[0]
    pred = int(prob.argmax())

    return {
        "health_status":    LIVESTOCK_CLASSES[pred],
        "confidence":       round(float(prob[pred]), 4),
        "all_probabilities": {c: round(float(p), 4) for c, p in zip(LIVESTOCK_CLASSES, prob)},
        "advice":           meta["advice"][LIVESTOCK_CLASSES[pred]],
    }


# ═══════════════════════════════════════════════════════════════════════════════
# MODEL 2 — Climate Risk Scorer (#29)
# ═══════════════════════════════════════════════════════════════════════════════
"""
Features: temp_anomaly_C, rainfall_pct_normal, consecutive_dry_days,
          soil_moisture_deficit, wind_speed_kmh, historical_risk_score,
          month, crop_type_code [0-5], elevation_m, district_vulnerability

Target: risk_score [0,1] -> continuous regression
        risk_category: low(<0.3) / moderate(0.3-0.6) / high(0.6-0.8) / extreme(>0.8)
"""

CLIMATE_FEATURES = [
    "temp_anomaly_C", "rainfall_pct_normal", "consecutive_dry_days",
    "soil_moisture_deficit", "wind_speed_kmh", "historical_risk_score",
    "month", "crop_type_code", "elevation_m", "district_vulnerability",
]

CLIMATE_RISK_BANDS = [
    (0.80, "extreme",  "Extreme climate risk. Activate disaster response protocol."),
    (0.60, "high",     "High risk. Advise crop insurance claim and contingency planting."),
    (0.30, "moderate", "Moderate risk. Monitor closely; prepare irrigation backup."),
    (0.00, "low",      "Low climate risk. Normal farming operations can proceed."),
]


def _gen_climate(n=4000, seed=42):
    rng = np.random.RandomState(seed)

    temp_anom     = rng.normal(1.2, 2.0, n).clip(-4, 6)
    rain_pct      = rng.beta(3, 2, n) * 150           # 0-150% of normal
    dry_days      = rng.exponential(8, n).clip(0, 90)
    sm_deficit    = (rng.normal(0.3, 0.2, n) - 0.1 * rain_pct / 150).clip(0, 1)
    wind_speed    = rng.exponential(15, n).clip(0, 80)
    hist_risk     = rng.beta(2, 3, n)
    month         = rng.randint(1, 13, n)
    crop_code     = rng.randint(0, 6, n)
    elevation     = rng.uniform(100, 2000, n)
    district_vuln = rng.beta(2, 3, n)

    # Risk DGP
    risk = (
        0.20 * np.clip(temp_anom / 5, 0, 1)
        + 0.25 * np.clip(1 - rain_pct / 150, 0, 1)
        + 0.15 * np.clip(dry_days / 60, 0, 1)
        + 0.15 * sm_deficit
        + 0.10 * hist_risk
        + 0.10 * district_vuln
        + 0.05 * np.clip(wind_speed / 80, 0, 1)
        + rng.normal(0, 0.05, n)
    ).clip(0, 1)

    return pd.DataFrame({
        "temp_anomaly_C":        np.round(temp_anom, 2),
        "rainfall_pct_normal":   np.round(rain_pct, 1),
        "consecutive_dry_days":  np.round(dry_days, 0),
        "soil_moisture_deficit": np.round(sm_deficit, 3),
        "wind_speed_kmh":        np.round(wind_speed, 1),
        "historical_risk_score": np.round(hist_risk, 3),
        "month":                 month,
        "crop_type_code":        crop_code,
        "elevation_m":           np.round(elevation, 0),
        "district_vulnerability": np.round(district_vuln, 3),
        "risk_score":            np.round(risk, 4),
    })


def train_climate_risk(out_dir: Path):
    import lightgbm as lgb
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import mean_absolute_error, r2_score

    print("\n[2/5] Climate Risk Scorer")
    df = _gen_climate()
    X  = df[CLIMATE_FEATURES].values
    y  = df["risk_score"].values

    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=42)
    model = lgb.LGBMRegressor(
        n_estimators=300, max_depth=5, learning_rate=0.05,
        subsample=0.8, colsample_bytree=0.8, random_state=42, verbose=-1,
    )
    model.fit(X_tr, y_tr)

    y_pred = model.predict(X_te)
    mae  = mean_absolute_error(y_te, y_pred)
    r2   = r2_score(y_te, y_pred)
    print(f"  MAE: {mae:.4f}  R²: {r2:.4f}")

    pkl = out_dir / "climate_risk_lgbm.pkl"
    with open(pkl, "wb") as f: pickle.dump(model, f)
    meta = {
        "features": CLIMATE_FEATURES, "risk_bands": [
            {"min": b[0], "category": b[1], "description": b[2]} for b in CLIMATE_RISK_BANDS
        ],
        "mae": round(mae, 4), "r2": round(r2, 4),
        "model_file": "climate_risk_lgbm.pkl",
    }
    with open(out_dir / "climate_risk_meta.json", "w") as f: json.dump(meta, f, indent=2)
    print(f"  Saved: {pkl}  ({pkl.stat().st_size // 1024} KB)")
    return model


def predict_climate_risk(features: Dict, model_dir: str = None) -> Dict:
    """
    Score climate risk for a location/season.

    Parameters: temp_anomaly_C, rainfall_pct_normal, consecutive_dry_days,
                soil_moisture_deficit, wind_speed_kmh, historical_risk_score,
                month [1-12], crop_type_code [0-5], elevation_m, district_vulnerability
    Returns: risk_score [0,1], risk_category, description, top_drivers
    """
    if model_dir is None: model_dir = str(OUT_DIR)
    key = f"climate_{model_dir}"
    if key not in _CACHE:
        with open(Path(model_dir) / "climate_risk_lgbm.pkl", "rb") as f:
            _CACHE[key] = pickle.load(f)
        with open(Path(model_dir) / "climate_risk_meta.json") as f:
            _CACHE[f"{key}_meta"] = json.load(f)
    model = _CACHE[key]
    meta  = _CACHE[f"{key}_meta"]

    DEFAULTS = {
        "temp_anomaly_C": 0.0, "rainfall_pct_normal": 100.0, "consecutive_dry_days": 0,
        "soil_moisture_deficit": 0.1, "wind_speed_kmh": 10, "historical_risk_score": 0.2,
        "month": 6, "crop_type_code": 0, "elevation_m": 300, "district_vulnerability": 0.3,
    }
    row   = [features.get(f, DEFAULTS[f]) for f in CLIMATE_FEATURES]
    score = float(np.clip(model.predict([row])[0], 0, 1))

    category, description = "low", ""
    for min_score, cat, desc in CLIMATE_RISK_BANDS:
        if score >= min_score:
            category, description = cat, desc
            break

    # Simple driver attribution
    drivers = []
    v = dict(zip(CLIMATE_FEATURES, row))
    if v["consecutive_dry_days"] > 20:  drivers.append(f"drought ({v['consecutive_dry_days']:.0f} dry days)")
    if v["temp_anomaly_C"] > 2:         drivers.append(f"heat anomaly (+{v['temp_anomaly_C']:.1f}°C)")
    if v["rainfall_pct_normal"] < 60:   drivers.append(f"rainfall deficit ({v['rainfall_pct_normal']:.0f}% of normal)")
    if v["soil_moisture_deficit"] > 0.5: drivers.append("severe soil moisture deficit")

    return {
        "risk_score":    round(score, 4),
        "risk_category": category,
        "description":   description,
        "top_drivers":   drivers or ["No dominant risk factor"],
    }


# ═══════════════════════════════════════════════════════════════════════════════
# MODEL 3 — Buyer-Seller Match Ranker (#26)
# ═══════════════════════════════════════════════════════════════════════════════
"""
Pointwise ranking: given (farmer_product, buyer_profile) pair -> match_score [0,1]

Farmer features: crop_type, quality_grade, quantity_kg, price_ask_rs_kg,
                 location_code, cert_organic, storage_days_remaining

Buyer features:  preferred_crop, preferred_grade, min_qty_kg, max_price_rs_kg,
                 buyer_location_code, bulk_buyer, payment_days

Combined: 14 interaction features -> XGBoost regressor -> match_score
"""

BUYER_MATCH_FEATURES = [
    "crop_match",          # 1 if crop_type == preferred_crop else 0
    "grade_match",         # 1 if grade_ok, 0 if buyer wants A and seller has C
    "quantity_feasible",   # min(1, seller_qty / buyer_min_qty)
    "price_ok",            # 1 if price_ask <= max_price else 1 - gap_fraction
    "location_proximity",  # 1 - abs(loc_code_diff) / 10  proxy for distance
    "organic_bonus",       # buyer_wants_organic AND seller_is_organic
    "freshness_score",     # storage_days_remaining / 30
    "bulk_match",          # bulk_buyer AND quantity_kg > 1000
    "payment_terms_ok",    # payment_days <= 7 -> 1.0, else degrades
    "seller_qty_log",      # log(quantity_kg)
    "price_ask_norm",      # price_ask / 100
    "buyer_max_price_norm",# max_price / 100
    "grade_gap",           # buyer_preferred_grade - seller_grade (0=perfect, >0 means seller worse)
    "delivery_urgency",    # 1 if storage_days < 7 (perishable urgency)
]


def _gen_buyer_match(n=5000, seed=42):
    rng = np.random.RandomState(seed)

    crop_match    = rng.binomial(1, 0.5, n).astype(float)
    seller_grade  = rng.randint(1, 4, n)     # 1=A, 2=B, 3=C
    buyer_grade   = rng.randint(1, 4, n)
    grade_gap     = (seller_grade - buyer_grade).astype(float)   # >0 = seller worse
    grade_match   = (grade_gap <= 0).astype(float)

    qty           = np.exp(rng.normal(5, 1, n)).clip(10, 5000)
    buyer_min_qty = rng.uniform(50, 2000, n)
    qty_feasible  = np.minimum(1.0, qty / buyer_min_qty)

    price_ask     = rng.uniform(15, 120, n)
    buyer_max     = rng.uniform(20, 150, n)
    price_ok      = np.where(price_ask <= buyer_max, 1.0,
                             np.maximum(0, 1 - (price_ask - buyer_max) / buyer_max))

    loc_seller    = rng.randint(0, 10, n)
    loc_buyer     = rng.randint(0, 10, n)
    proximity     = 1 - np.abs(loc_seller - loc_buyer) / 10

    organic_s     = rng.binomial(1, 0.2, n)
    organic_b     = rng.binomial(1, 0.3, n)
    org_bonus     = (organic_s & organic_b).astype(float)

    storage_days  = rng.uniform(1, 30, n)
    freshness     = storage_days / 30

    bulk_buyer    = rng.binomial(1, 0.3, n)
    bulk_match    = (bulk_buyer & (qty > 1000)).astype(float)

    pay_days      = rng.choice([0, 7, 14, 30], n, p=[0.3, 0.3, 0.2, 0.2])
    pay_ok        = np.maximum(0, 1 - pay_days / 30)

    delivery_urg  = (storage_days < 7).astype(float)

    # Match score DGP
    score = (
        0.30 * crop_match
        + 0.20 * grade_match
        + 0.15 * qty_feasible
        + 0.15 * price_ok
        + 0.10 * proximity
        + 0.05 * org_bonus
        + 0.05 * freshness
        + rng.normal(0, 0.05, n)
    ).clip(0, 1)

    return pd.DataFrame({
        "crop_match": crop_match, "grade_match": grade_match,
        "quantity_feasible": np.round(qty_feasible, 3),
        "price_ok": np.round(price_ok, 3),
        "location_proximity": np.round(proximity, 3),
        "organic_bonus": org_bonus, "freshness_score": np.round(freshness, 3),
        "bulk_match": bulk_match, "payment_terms_ok": np.round(pay_ok, 3),
        "seller_qty_log": np.round(np.log(qty), 3),
        "price_ask_norm": np.round(price_ask / 100, 3),
        "buyer_max_price_norm": np.round(buyer_max / 100, 3),
        "grade_gap": grade_gap,
        "delivery_urgency": delivery_urg,
        "match_score": np.round(score, 4),
    })


def train_buyer_match(out_dir: Path):
    import xgboost as xgb
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import mean_absolute_error, r2_score

    print("\n[3/5] Buyer-Seller Match Ranker")
    df = _gen_buyer_match()
    X  = df[BUYER_MATCH_FEATURES].values
    y  = df["match_score"].values

    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=42)
    model = xgb.XGBRegressor(
        n_estimators=200, max_depth=4, learning_rate=0.05,
        subsample=0.8, colsample_bytree=0.8,
        random_state=42, device="cpu", verbosity=0,
    )
    model.fit(X_tr, y_tr)

    y_pred = model.predict(X_te)
    mae = mean_absolute_error(y_te, y_pred)
    r2  = r2_score(y_te, y_pred)

    # Top-k ranking precision@5
    n_test = len(y_te)
    test_df = pd.DataFrame({"true": y_te, "pred": y_pred})
    top5_hits = (test_df.nlargest(5, "pred")["true"] > 0.6).mean()
    print(f"  MAE: {mae:.4f}  R²: {r2:.4f}  Precision@5 (>0.6): {top5_hits*100:.0f}%")

    pkl = out_dir / "buyer_match_xgb.pkl"
    with open(pkl, "wb") as f: pickle.dump(model, f)
    meta = {
        "features": BUYER_MATCH_FEATURES,
        "mae": round(mae, 4), "r2": round(r2, 4),
        "score_threshold_good_match": 0.6,
        "model_file": "buyer_match_xgb.pkl",
    }
    with open(out_dir / "buyer_match_meta.json", "w") as f: json.dump(meta, f, indent=2)
    print(f"  Saved: {pkl}  ({pkl.stat().st_size // 1024} KB)")
    return model


def compute_match_features(farmer: Dict, buyer: Dict) -> Dict:
    """Helper: compute the 14 interaction features from raw farmer/buyer dicts."""
    crop_m  = float(farmer.get("crop_type", 0) == buyer.get("preferred_crop", 0))
    sg      = farmer.get("quality_grade", 2)  # 1=A,2=B,3=C
    bg      = buyer.get("preferred_grade", 2)
    grade_gap = float(sg - bg)
    grade_m = float(grade_gap <= 0)
    qty     = float(farmer.get("quantity_kg", 100))
    b_min   = float(buyer.get("min_qty_kg", 50))
    qty_f   = min(1.0, qty / max(b_min, 1))
    pa      = float(farmer.get("price_ask_rs_kg", 30))
    bmax    = float(buyer.get("max_price_rs_kg", 50))
    price_ok = 1.0 if pa <= bmax else max(0, 1 - (pa - bmax) / max(bmax, 1))
    prox    = 1 - abs(farmer.get("location_code", 5) - buyer.get("buyer_location_code", 5)) / 10
    org_b   = float(farmer.get("cert_organic", 0) and buyer.get("wants_organic", 0))
    storage = float(farmer.get("storage_days_remaining", 15))
    fresh   = storage / 30
    bk      = float(buyer.get("bulk_buyer", 0))
    bulk_m  = float(bk and qty > 1000)
    pay_d   = float(buyer.get("payment_days", 7))
    pay_ok  = max(0, 1 - pay_d / 30)
    urg     = float(storage < 7)
    return {
        "crop_match": crop_m, "grade_match": grade_m,
        "quantity_feasible": qty_f, "price_ok": price_ok,
        "location_proximity": prox, "organic_bonus": org_b,
        "freshness_score": fresh, "bulk_match": bulk_m,
        "payment_terms_ok": pay_ok,
        "seller_qty_log": float(np.log(max(qty, 1))),
        "price_ask_norm": pa / 100,
        "buyer_max_price_norm": bmax / 100,
        "grade_gap": grade_gap, "delivery_urgency": urg,
    }


def rank_buyers(farmer: Dict, buyers: list, model_dir: str = None, top_n: int = 5) -> list:
    """
    Rank a list of buyer profiles against a farmer's product listing.

    Parameters
    ----------
    farmer : dict — crop_type, quality_grade, quantity_kg, price_ask_rs_kg,
                    location_code, cert_organic, storage_days_remaining
    buyers : list[dict] — each buyer: preferred_crop, preferred_grade,
                          min_qty_kg, max_price_rs_kg, buyer_location_code,
                          bulk_buyer, payment_days, buyer_id
    top_n  : int — number of top buyers to return

    Returns: list of {buyer_id, match_score, is_good_match, match_summary}
    """
    if model_dir is None: model_dir = str(OUT_DIR)
    key = f"buyer_{model_dir}"
    if key not in _CACHE:
        with open(Path(model_dir) / "buyer_match_xgb.pkl", "rb") as f:
            _CACHE[key] = pickle.load(f)
        with open(Path(model_dir) / "buyer_match_meta.json") as f:
            _CACHE[f"{key}_meta"] = json.load(f)
    model = _CACHE[key]
    meta  = _CACHE[f"{key}_meta"]
    threshold = meta.get("score_threshold_good_match", 0.6)

    results = []
    for buyer in buyers:
        feats = compute_match_features(farmer, buyer)
        X     = [[feats[f] for f in BUYER_MATCH_FEATURES]]
        score = float(np.clip(model.predict(X)[0], 0, 1))
        results.append({
            "buyer_id":      buyer.get("buyer_id", "unknown"),
            "match_score":   round(score, 4),
            "is_good_match": bool(score >= threshold),
            "match_summary": (
                f"Score {score:.0%}. "
                + ("Crop match. " if feats["crop_match"] else "Crop mismatch. ")
                + ("Price OK. " if feats["price_ok"] > 0.8 else f"Price gap. ")
                + ("Good proximity." if feats["location_proximity"] > 0.7 else "Far distance.")
            ),
        })
    return sorted(results, key=lambda x: x["match_score"], reverse=True)[:top_n]


# ═══════════════════════════════════════════════════════════════════════════════
# MODEL 4 — Satellite Crop Stress (#11)
# ═══════════════════════════════════════════════════════════════════════════════
"""
Features: ndvi, evi, ndwi, lai, lst_celsius, soil_moisture_pct,
          days_since_rain, growth_stage_code [0=seedling,1=veg,2=flower,3=grain],
          crop_type_code, rainfall_30d_mm

Target: stress_level (0=none, 1=mild, 2=moderate, 3=severe)
"""

SAT_CLASSES  = ["none", "mild", "moderate", "severe"]
SAT_FEATURES = [
    "ndvi", "evi", "ndwi", "lai", "lst_celsius",
    "soil_moisture_pct", "days_since_rain", "growth_stage_code",
    "crop_type_code", "rainfall_30d_mm",
]
SAT_ADVICE = {
    "none":     "No crop stress detected. Normal irrigation schedule.",
    "mild":     "Mild stress detected. Consider supplemental irrigation within 3 days.",
    "moderate": "Moderate stress. Immediate irrigation required. Check for pest/disease.",
    "severe":   "Severe stress. Emergency intervention needed. Contact extension officer.",
}


def _gen_satellite(n=4000, seed=42):
    rng = np.random.RandomState(seed)
    labels = rng.choice([0, 1, 2, 3], n, p=[0.45, 0.30, 0.17, 0.08])

    ndvi = np.where(labels == 0, rng.normal(0.65, 0.08, n),
           np.where(labels == 1, rng.normal(0.50, 0.10, n),
           np.where(labels == 2, rng.normal(0.35, 0.10, n),
                                 rng.normal(0.18, 0.08, n)))).clip(0, 1)

    evi  = ndvi * rng.uniform(0.8, 1.1, n)
    ndwi = np.where(labels == 0, rng.normal(0.20, 0.08, n),
           np.where(labels == 1, rng.normal(0.05, 0.08, n),
           np.where(labels == 2, rng.normal(-0.10, 0.08, n),
                                 rng.normal(-0.25, 0.08, n)))).clip(-1, 1)

    lai  = ndvi * rng.uniform(4, 6, n)
    lst  = np.where(labels == 0, rng.normal(28, 3, n),
           np.where(labels == 1, rng.normal(33, 3, n),
           np.where(labels == 2, rng.normal(38, 3, n),
                                 rng.normal(43, 3, n)))).clip(15, 55)

    sm   = np.where(labels == 0, rng.normal(55, 10, n),
           np.where(labels == 1, rng.normal(38, 10, n),
           np.where(labels == 2, rng.normal(22, 8, n),
                                 rng.normal(10, 5, n)))).clip(0, 100)

    dry  = np.where(labels == 0, rng.exponential(3, n),
           np.where(labels == 1, rng.exponential(8, n),
           np.where(labels == 2, rng.exponential(15, n),
                                 rng.exponential(25, n)))).clip(0, 60)

    stage   = rng.randint(0, 4, n)
    crop_c  = rng.randint(0, 6, n)
    rain30  = np.where(labels == 0, rng.normal(80, 20, n),
              np.where(labels == 1, rng.normal(45, 15, n),
              np.where(labels == 2, rng.normal(20, 10, n),
                                    rng.normal(5,  5, n)))).clip(0, 250)

    return pd.DataFrame({
        "ndvi": np.round(ndvi, 4), "evi": np.round(evi.clip(0, 1), 4),
        "ndwi": np.round(ndwi, 4), "lai": np.round(lai.clip(0, 10), 2),
        "lst_celsius": np.round(lst, 1), "soil_moisture_pct": np.round(sm, 1),
        "days_since_rain": np.round(dry, 0), "growth_stage_code": stage,
        "crop_type_code": crop_c, "rainfall_30d_mm": np.round(rain30, 1),
        "stress_level": labels,
    })


def train_satellite_stress(out_dir: Path):
    import lightgbm as lgb
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import accuracy_score, classification_report

    print("\n[4/5] Satellite Crop Stress Detector")
    df = _gen_satellite()
    X  = df[SAT_FEATURES].values
    y  = df["stress_level"].values

    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2,
                                               random_state=42, stratify=y)
    model = lgb.LGBMClassifier(
        n_estimators=300, max_depth=5, learning_rate=0.05,
        subsample=0.8, colsample_bytree=0.8, random_state=42, verbose=-1,
    )
    model.fit(X_tr, y_tr)

    y_pred = model.predict(X_te)
    acc    = accuracy_score(y_te, y_pred)
    print(f"  Accuracy: {acc*100:.1f}%")
    print(f"  {classification_report(y_te, y_pred, target_names=SAT_CLASSES, zero_division=0)}")

    pkl = out_dir / "satellite_stress_lgbm.pkl"
    with open(pkl, "wb") as f: pickle.dump(model, f)
    meta = {
        "features": SAT_FEATURES, "classes": SAT_CLASSES,
        "advice": SAT_ADVICE, "accuracy": round(acc, 4),
        "model_file": "satellite_stress_lgbm.pkl",
    }
    with open(out_dir / "satellite_stress_meta.json", "w") as f: json.dump(meta, f, indent=2)
    print(f"  Saved: {pkl}  ({pkl.stat().st_size // 1024} KB)")
    return model


def predict_satellite_stress(features: Dict, model_dir: str = None) -> Dict:
    """
    Assess crop stress level from satellite spectral indices.

    Parameters: ndvi [0,1], evi [0,1], ndwi [-1,1], lai [0,10],
                lst_celsius, soil_moisture_pct [0,100],
                days_since_rain, growth_stage_code [0-3],
                crop_type_code [0-5], rainfall_30d_mm
    Returns: stress_level, confidence, advice, all_probabilities
    """
    if model_dir is None: model_dir = str(OUT_DIR)
    key = f"sat_{model_dir}"
    if key not in _CACHE:
        with open(Path(model_dir) / "satellite_stress_lgbm.pkl", "rb") as f:
            _CACHE[key] = pickle.load(f)
        with open(Path(model_dir) / "satellite_stress_meta.json") as f:
            _CACHE[f"{key}_meta"] = json.load(f)
    model = _CACHE[key]
    meta  = _CACHE[f"{key}_meta"]

    DEFAULTS = {
        "ndvi": 0.5, "evi": 0.4, "ndwi": 0.0, "lai": 3.0, "lst_celsius": 30,
        "soil_moisture_pct": 45, "days_since_rain": 5, "growth_stage_code": 1,
        "crop_type_code": 0, "rainfall_30d_mm": 60,
    }
    row  = [features.get(f, DEFAULTS[f]) for f in SAT_FEATURES]
    prob = model.predict_proba([row])[0]
    pred = int(prob.argmax())

    return {
        "stress_level":      SAT_CLASSES[pred],
        "confidence":        round(float(prob[pred]), 4),
        "all_probabilities": {c: round(float(p), 4) for c, p in zip(SAT_CLASSES, prob)},
        "advice":            meta["advice"][SAT_CLASSES[pred]],
        "ndvi_observed":     features.get("ndvi", DEFAULTS["ndvi"]),
    }


# ═══════════════════════════════════════════════════════════════════════════════
# MODEL 5 — Drone Plant Counter (#12)
# ═══════════════════════════════════════════════════════════════════════════════
"""
In the absence of real drone images, we train LightGBM on SYNTHETIC
image-derived statistics that a real drone image processor would extract.

Features (image statistics, not raw pixels):
  blob_count_raw        — raw blob detector count (OpenCV SimpleBlobDetector)
  mean_blob_area_px2    — mean detected blob area in pixels²
  blob_density_per_m2   — blobs per square meter (from GPS altitude)
  area_fraction_green   — green pixel fraction of image
  row_regularity_score  — autocorrelation regularity of plant rows [0,1]
  image_brightness      — mean pixel brightness (0-255)
  edge_density          — Canny edge pixel fraction
  altitude_m            — drone flight altitude
  field_area_m2         — field area from GPS polygon
  crop_type_code        — 0=rice, 1=wheat, 2=maize, 3=cotton, 4=soybean

Target: plant_count_per_acre (regression)
"""

DRONE_FEATURES = [
    "blob_count_raw", "mean_blob_area_px2", "blob_density_per_m2",
    "area_fraction_green", "row_regularity_score", "image_brightness",
    "edge_density", "altitude_m", "field_area_m2", "crop_type_code",
]

PLANTS_PER_ACRE = {
    0: (350000, 50000),   # rice: dense transplanting
    1: (120000, 20000),   # wheat: drill sown
    2: (30000,  5000),    # maize: wider spacing
    3: (20000,  3000),    # cotton: widest spacing
    4: (180000, 25000),   # soybean: medium density
}


def _gen_drone(n=4000, seed=42):
    rng = np.random.RandomState(seed)
    crop = rng.randint(0, 5, n)

    mu  = np.array([PLANTS_PER_ACRE[c][0] for c in crop], dtype=float)
    sig = np.array([PLANTS_PER_ACRE[c][1] for c in crop], dtype=float)
    true_count = (rng.normal(0, 1, n) * sig + mu).clip(5000, 500000)

    # Synthetic image features derived from true_count
    altitude     = rng.uniform(30, 120, n)
    field_area   = rng.uniform(2000, 20000, n)  # m²
    blob_raw     = (true_count / field_area * (altitude / 60) ** 0.5 * rng.uniform(0.7, 1.0, n)).clip(5, 5000)
    blob_area    = (2000 / (true_count / field_area)).clip(5, 2000) * rng.uniform(0.8, 1.2, n)
    blob_dens    = true_count / field_area * rng.uniform(0.85, 1.15, n)
    green_frac   = np.minimum(1.0, true_count / mu * 0.6 * rng.uniform(0.85, 1.15, n))
    row_reg      = rng.beta(5, 2, n) * rng.uniform(0.8, 1.0, n)
    brightness   = rng.normal(128, 25, n).clip(50, 220)
    edge_dens    = (blob_dens * blob_area / 10000).clip(0.05, 0.7) * rng.uniform(0.9, 1.1, n)

    return pd.DataFrame({
        "blob_count_raw":       np.round(blob_raw, 1),
        "mean_blob_area_px2":   np.round(blob_area, 1),
        "blob_density_per_m2":  np.round(blob_dens, 4),
        "area_fraction_green":  np.round(green_frac.clip(0, 1), 3),
        "row_regularity_score": np.round(row_reg, 3),
        "image_brightness":     np.round(brightness, 1),
        "edge_density":         np.round(edge_dens.clip(0, 1), 4),
        "altitude_m":           np.round(altitude, 1),
        "field_area_m2":        np.round(field_area, 0),
        "crop_type_code":       crop,
        "plant_count_per_acre": np.round(true_count, 0),
    })


def train_drone_counter(out_dir: Path):
    import lightgbm as lgb
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import mean_absolute_error, r2_score

    print("\n[5/5] Drone Plant Counter")
    df = _gen_drone()
    X  = df[DRONE_FEATURES].values
    y  = df["plant_count_per_acre"].values

    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=42)
    model = lgb.LGBMRegressor(
        n_estimators=300, max_depth=5, learning_rate=0.05,
        subsample=0.8, colsample_bytree=0.8, random_state=42, verbose=-1,
    )
    model.fit(X_tr, y_tr)

    y_pred = model.predict(X_te)
    mae    = mean_absolute_error(y_te, y_pred)
    r2     = r2_score(y_te, y_pred)
    mape   = np.mean(np.abs((y_te - y_pred) / np.maximum(y_te, 1))) * 100
    print(f"  MAE: {mae:,.0f} plants/acre  MAPE: {mape:.1f}%  R²: {r2:.4f}")

    crop_names = ["rice", "wheat", "maize", "cotton", "soybean"]
    print(f"  Typical plant densities (reference):")
    for c, name in enumerate(crop_names):
        mu, sg = PLANTS_PER_ACRE[c]
        print(f"    {name:8s}: {mu:,} ± {sg:,} plants/acre")

    pkl = out_dir / "drone_counter_lgbm.pkl"
    with open(pkl, "wb") as f: pickle.dump(model, f)
    meta = {
        "features": DRONE_FEATURES,
        "crop_names": crop_names,
        "plants_per_acre_reference": {str(c): list(v) for c, v in PLANTS_PER_ACRE.items()},
        "mae": round(mae, 0), "r2": round(r2, 4), "mape": round(mape, 2),
        "model_file": "drone_counter_lgbm.pkl",
        "note": "Trained on synthetic image statistics. Replace with real drone image pipeline "
                "by extracting the same feature set via OpenCV before calling predict_drone_count().",
    }
    with open(out_dir / "drone_counter_meta.json", "w") as f: json.dump(meta, f, indent=2)
    print(f"  Saved: {pkl}  ({pkl.stat().st_size // 1024} KB)")
    return model


def predict_drone_count(image_features: Dict, model_dir: str = None) -> Dict:
    """
    Estimate plant count per acre from drone image statistics.

    Parameters: blob_count_raw, mean_blob_area_px2, blob_density_per_m2,
                area_fraction_green, row_regularity_score, image_brightness,
                edge_density, altitude_m, field_area_m2, crop_type_code [0-4]
    Returns: plant_count_per_acre, stand_density_pct, recommendation
    """
    if model_dir is None: model_dir = str(OUT_DIR)
    key = f"drone_{model_dir}"
    if key not in _CACHE:
        with open(Path(model_dir) / "drone_counter_lgbm.pkl", "rb") as f:
            _CACHE[key] = pickle.load(f)
        with open(Path(model_dir) / "drone_counter_meta.json") as f:
            _CACHE[f"{key}_meta"] = json.load(f)
    model = _CACHE[key]
    meta  = _CACHE[f"{key}_meta"]

    DEFAULTS = {
        "blob_count_raw": 200, "mean_blob_area_px2": 150, "blob_density_per_m2": 0.5,
        "area_fraction_green": 0.5, "row_regularity_score": 0.8,
        "image_brightness": 128, "edge_density": 0.15,
        "altitude_m": 60, "field_area_m2": 5000, "crop_type_code": 2,
    }
    row   = [image_features.get(f, DEFAULTS[f]) for f in DRONE_FEATURES]
    count = float(max(0, model.predict([row])[0]))

    crop_code = int(image_features.get("crop_type_code", 2))
    ref_mu, _ = PLANTS_PER_ACRE.get(crop_code, (50000, 10000))
    stand_pct = round(count / ref_mu * 100, 1)

    if stand_pct >= 90:
        rec = "Excellent stand. No replanting required."
    elif stand_pct >= 70:
        rec = "Acceptable stand. Monitor for gaps and consider gap-filling."
    elif stand_pct >= 50:
        rec = "Poor stand (<70%). Gap-filling recommended within 5 days."
    else:
        rec = "Critical stand failure (<50%). Consider full replanting."

    return {
        "plant_count_per_acre": round(count, 0),
        "stand_density_pct":    stand_pct,
        "expected_for_crop":    ref_mu,
        "recommendation":       rec,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# Shared cache + CLI
# ═══════════════════════════════════════════════════════════════════════════════
_CACHE: dict = {}


def _smoke_tests(out_dir: Path):
    md = str(out_dir)
    print("\n" + "=" * 65)
    print("SMOKE TESTS")
    print("=" * 65)

    # Livestock
    r = predict_livestock({
        "temperature_C": 40.5, "heart_rate_bpm": 98, "milk_yield_L": 1.5,
        "movement_score": 1.2, "eating_frequency_per_day": 1.5,
    }, model_dir=md)
    print(f"\n[livestock] sick cow: {r['health_status']} ({r['confidence']:.0%})")
    r2 = predict_livestock({
        "temperature_C": 38.4, "heart_rate_bpm": 66, "milk_yield_L": 13,
        "movement_score": 7.5, "eating_frequency_per_day": 8,
    }, model_dir=md)
    print(f"[livestock] healthy cow: {r2['health_status']} ({r2['confidence']:.0%})")

    # Climate risk
    rc = predict_climate_risk({
        "temp_anomaly_C": 3.5, "rainfall_pct_normal": 30,
        "consecutive_dry_days": 45, "soil_moisture_deficit": 0.75,
    }, model_dir=md)
    print(f"\n[climate]  drought scenario: {rc['risk_category']} ({rc['risk_score']:.2f})")
    rc2 = predict_climate_risk({
        "temp_anomaly_C": 0.2, "rainfall_pct_normal": 105, "consecutive_dry_days": 2,
    }, model_dir=md)
    print(f"[climate]  normal season:     {rc2['risk_category']} ({rc2['risk_score']:.2f})")

    # Buyer match
    farmer = {"crop_type": 1, "quality_grade": 1, "quantity_kg": 800,
              "price_ask_rs_kg": 35, "location_code": 3, "cert_organic": 1,
              "storage_days_remaining": 10}
    buyers = [
        {"buyer_id": "B001", "preferred_crop": 1, "preferred_grade": 1,
         "min_qty_kg": 500, "max_price_rs_kg": 40, "buyer_location_code": 4,
         "wants_organic": 1, "bulk_buyer": 1, "payment_days": 7},
        {"buyer_id": "B002", "preferred_crop": 2, "preferred_grade": 2,
         "min_qty_kg": 100, "max_price_rs_kg": 25, "buyer_location_code": 9,
         "wants_organic": 0, "bulk_buyer": 0, "payment_days": 30},
    ]
    ranked = rank_buyers(farmer, buyers, model_dir=md)
    print(f"\n[buyer]  top match: {ranked[0]['buyer_id']} score={ranked[0]['match_score']:.2f}")

    # Satellite stress
    rs = predict_satellite_stress({
        "ndvi": 0.22, "ndwi": -0.30, "lst_celsius": 42,
        "soil_moisture_pct": 8, "days_since_rain": 28,
    }, model_dir=md)
    print(f"\n[satellite] drought field: {rs['stress_level']} ({rs['confidence']:.0%})")
    rs2 = predict_satellite_stress({
        "ndvi": 0.70, "ndwi": 0.25, "lst_celsius": 26,
        "soil_moisture_pct": 62, "days_since_rain": 2,
    }, model_dir=md)
    print(f"[satellite] healthy field:  {rs2['stress_level']} ({rs2['confidence']:.0%})")

    # Drone count
    rd = predict_drone_count({
        "blob_count_raw": 450, "blob_density_per_m2": 3.2,
        "area_fraction_green": 0.65, "row_regularity_score": 0.85,
        "altitude_m": 50, "field_area_m2": 4000, "crop_type_code": 2,
    }, model_dir=md)
    print(f"\n[drone]  maize field: {rd['plant_count_per_acre']:,.0f} plants/acre "
          f"({rd['stand_density_pct']:.0f}% stand)  -> {rd['recommendation']}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", choices=[
        "livestock", "climate", "buyer", "satellite", "drone", "all"
    ], default="all")
    args = parser.parse_args()

    trainers = {
        "livestock": train_livestock,
        "climate":   train_climate_risk,
        "buyer":     train_buyer_match,
        "satellite": train_satellite_stress,
        "drone":     train_drone_counter,
    }

    to_train = list(trainers.keys()) if args.model == "all" else [args.model]
    print("=" * 65)
    print(f"PHASE 2 MODELS — training: {to_train}")
    print("=" * 65)

    for name in to_train:
        trainers[name](OUT_DIR)

    _smoke_tests(OUT_DIR)
    print("\nDone — all Phase 2 models saved to ml_models/")
