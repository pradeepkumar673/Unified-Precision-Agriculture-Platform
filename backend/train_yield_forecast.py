"""
train_yield_forecast.py
=======================
Yield Forecasting with Uncertainty — Prompt #5

Architecture
------------
  Three LightGBM models, one per quantile (0.1, 0.5, 0.9), trained with
  objective='quantile' and alpha=q.

  Features
  --------
    crop             : categorical  (8 common Indian crops)
    soil_score       : float [0,1]  (composite soil health index)
    rainfall_mm      : float        (season cumulative rainfall, mm)
    ndvi_avg         : float [0,1]  (mean NDVI during growing season)
    days_since_sowing: int          (days elapsed at prediction time)

  Target
  ------
    yield_kg_per_acre : float

  Structural equations (ground truth)
  ------------------------------------
  Each crop has:
    - Expected yield at ideal conditions (base_yield)
    - Rainfall response curve (optimum + penalty beyond range)
    - NDVI multiplier  (direct vegetation health signal)
    - Soil score linear contribution
    - Growth-stage penalty if queried before/after optimum window
    + heteroskedastic Gaussian noise (more uncertainty early in season)

Outputs
-------
  backend/ml_models/yield_q10.pkl  — LightGBM Booster (10th percentile)
  backend/ml_models/yield_q50.pkl  — LightGBM Booster (50th percentile / median)
  backend/ml_models/yield_q90.pkl  — LightGBM Booster (90th percentile)
  backend/ml_models/yield_meta.json — crop labels, feature names, stats
"""

import json
import pickle
import warnings
from pathlib import Path

import numpy as np
import pandas as pd
import lightgbm as lgb
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

warnings.filterwarnings("ignore")

# ─────────────────────────────────────────────────────────────────────────────
# 1. Crop agronomic profiles
# ─────────────────────────────────────────────────────────────────────────────
CROPS = ["wheat", "rice", "maize", "cotton", "soybean",
         "sugarcane", "chickpea", "groundnut"]

# (base_yield_kg_acre, rain_optimum_mm, rain_tolerance_mm, season_days)
CROP_PROFILE = {
    #              base   rain_opt  rain_tol  season_days
    "wheat":     ( 900,    400,     200,       120),
    "rice":      (1100,   1200,     400,       130),
    "maize":     ( 800,    700,     250,       110),
    "cotton":    ( 350,    650,     200,       180),
    "soybean":   ( 450,    700,     200,       100),
    "sugarcane": (4000,   1300,     400,       360),
    "chickpea":  ( 400,    350,     150,       100),
    "groundnut": ( 500,    600,     200,       120),
}

# Noise scale as fraction of base yield — more uncertain early in season
NOISE_BASE_FRAC = 0.22   # wider noise => better Q10/Q90 coverage


# ─────────────────────────────────────────────────────────────────────────────
# 2. Synthetic dataset generator
# ─────────────────────────────────────────────────────────────────────────────
def generate_yield_dataset(n: int = 6000, seed: int = 42) -> pd.DataFrame:
    """
    Generate synthetic (features, yield) pairs with realistic agronomic DGP.

    Ground-truth yield model:
      yield = base
            × soil_factor        (linear in soil_score)
            × rainfall_factor    (Gaussian around rain_optimum)
            × ndvi_factor        (linear in ndvi_avg)
            × stage_factor       (penalty if queried too early)
            + noise              (heteroskedastic: noisier early in season)
    """
    rng = np.random.RandomState(seed)

    crop_names   = rng.choice(CROPS, n)
    soil_scores  = rng.beta(3, 2, n)                          # 0–1, skewed high
    ndvi_avgs    = rng.beta(4, 2, n)                          # 0–1, skewed high
    days_sowing  = rng.randint(30, 361, n).astype(float)      # 30–360 DAS

    rainfalls = np.zeros(n)
    for i, crop in enumerate(crop_names):
        opt = CROP_PROFILE[crop][1]
        rainfalls[i] = max(rng.normal(opt, opt * 0.30), 50)

    records = []
    for i in range(n):
        crop  = crop_names[i]
        base, rain_opt, rain_tol, season_days = CROP_PROFILE[crop]

        soil   = float(soil_scores[i])
        ndvi   = float(ndvi_avgs[i])
        rain   = float(rainfalls[i])
        days   = float(days_sowing[i])

        # Soil factor: 0.5 to 1.3 linearly
        soil_factor = 0.50 + 0.80 * soil

        # Rainfall factor: Gaussian response centred on rain_opt
        rain_factor = float(np.exp(-0.5 * ((rain - rain_opt) / rain_tol) ** 2))
        rain_factor = max(rain_factor, 0.20)    # floor: some yield even in drought

        # NDVI factor: strong positive signal (0.5 to 1.5)
        ndvi_factor = 0.50 + 1.00 * ndvi

        # Growth-stage factor: penalise queries too early (days < 60% of season)
        # or harvest already past (days > season_days * 1.1)
        frac_done   = min(days / season_days, 1.0)
        if frac_done < 0.60:
            stage_factor = 0.75 + 0.40 * (frac_done / 0.60)    # ramp up to 1.15
        else:
            stage_factor = 1.0 + 0.15 * min(frac_done - 0.60, 0.40) / 0.40

        # Base yield
        true_yield = base * soil_factor * rain_factor * ndvi_factor * stage_factor

        # Heteroskedastic noise — much wider early in season
        noise_frac = NOISE_BASE_FRAC * (1.5 - frac_done)       # 1.5× early, 0.5× late
        noise      = rng.normal(0, true_yield * noise_frac)
        observed   = max(true_yield + noise, 0.0)

        records.append({
            "crop":              crop,
            "soil_score":        round(soil, 4),
            "rainfall_mm":       round(rain, 1),
            "ndvi_avg":          round(ndvi, 4),
            "days_since_sowing": int(days),
            "yield_kg_per_acre": round(observed, 2),
        })

    df = pd.DataFrame(records)
    print(f"Dataset shape : {df.shape}")
    print("\nYield stats by crop (kg/acre):")
    stats = df.groupby("crop")["yield_kg_per_acre"].agg(["mean", "std", "min", "max"])
    print(stats.round(0).to_string())
    return df


# ─────────────────────────────────────────────────────────────────────────────
# 3. Train quantile models
# ─────────────────────────────────────────────────────────────────────────────
QUANTILES = [0.10, 0.50, 0.90]
QUANTILE_NAMES = {0.10: "q10", 0.50: "q50", 0.90: "q90"}


def train(df: pd.DataFrame, out_dir: Path):
    out_dir.mkdir(parents=True, exist_ok=True)

    # Encode crop label
    le = LabelEncoder()
    df["crop_enc"] = le.fit_transform(df["crop"])

    FEATURE_COLS = ["crop_enc", "soil_score", "rainfall_mm",
                    "ndvi_avg", "days_since_sowing"]
    TARGET_COL   = "yield_kg_per_acre"

    X = df[FEATURE_COLS].values
    y = df[TARGET_COL].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # LightGBM datasets
    dtrain = lgb.Dataset(X_train, label=y_train, feature_name=FEATURE_COLS)

    models = {}
    for q in QUANTILES:
        name = QUANTILE_NAMES[q]
        print(f"\nTraining LightGBM quantile={q} ({name})...")

        params = {
            "objective":         "quantile",
            "alpha":             q,
            "metric":            "quantile",
            "n_estimators":      500,
            "num_leaves":        63,
            "learning_rate":     0.05,
            "min_child_samples": 20,
            "subsample":         0.85,
            "colsample_bytree":  0.85,
            "reg_lambda":        1.0,
            "verbose":           -1,
            "random_state":      42,
        }

        bst = lgb.train(
            params,
            dtrain,
            num_boost_round=500,
            valid_sets=[lgb.Dataset(X_test, label=y_test)],
            callbacks=[lgb.early_stopping(50, verbose=False),
                       lgb.log_evaluation(period=-1)],
        )

        # Pinball loss (quantile loss) on test set
        preds     = bst.predict(X_test)
        errors    = y_test - preds
        pinball   = np.mean(np.where(errors >= 0, q * errors, (q - 1) * errors))
        coverage  = np.mean((y_test >= preds) if q == 0.10
                            else (y_test <= preds) if q == 0.90
                            else np.ones(len(y_test), dtype=bool))

        print(f"  Best iteration : {bst.best_iteration}")
        print(f"  Pinball loss   : {pinball:.2f}")
        if q in (0.10, 0.90):
            print(f"  Coverage check : {coverage*100:.1f}%  (target: {q*100:.0f}%)")

        models[name] = bst

        pkl_path = out_dir / f"yield_{name}.pkl"
        with open(pkl_path, "wb") as f:
            pickle.dump(bst, f)
        print(f"  Saved => {pkl_path}  ({pkl_path.stat().st_size // 1024} KB)")

    # Interval width sanity check on test set
    q10_pred = models["q10"].predict(X_test)
    q90_pred = models["q90"].predict(X_test)
    q50_pred = models["q50"].predict(X_test)
    interval_width = (q90_pred - q10_pred).mean()
    interval_cover = np.mean((y_test >= q10_pred) & (y_test <= q90_pred))
    print(f"\nInterval (Q10-Q90) avg width : {interval_width:.1f} kg/acre")
    print(f"Interval (Q10-Q90) coverage  : {interval_cover*100:.1f}%  (target: 80%)")

    # Save metadata
    meta = {
        "crops":        list(le.classes_),
        "feature_cols": FEATURE_COLS,
        "quantiles":    QUANTILES,
        "quantile_files": {QUANTILE_NAMES[q]: f"yield_{QUANTILE_NAMES[q]}.pkl" for q in QUANTILES},
        "interval_coverage_80pct": round(float(interval_cover), 4),
        "interval_avg_width_kg":   round(float(interval_width), 1),
        "crop_label_map":          {int(i): c for i, c in enumerate(le.classes_)},
    }
    meta_path = out_dir / "yield_meta.json"
    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2)
    print(f"Metadata saved => {meta_path}")

    return models, le


# ─────────────────────────────────────────────────────────────────────────────
# 4. predict() — importable by the FastAPI service
# ─────────────────────────────────────────────────────────────────────────────
_MODEL_CACHE: dict = {}


def _load_bundle(model_dir: str):
    if model_dir not in _MODEL_CACHE:
        d = Path(model_dir)
        with open(d / "yield_q10.pkl", "rb") as f:
            q10 = pickle.load(f)
        with open(d / "yield_q50.pkl", "rb") as f:
            q50 = pickle.load(f)
        with open(d / "yield_q90.pkl", "rb") as f:
            q90 = pickle.load(f)
        with open(d / "yield_meta.json") as f:
            meta = json.load(f)
        crop_to_enc = {c: i for i, c in enumerate(meta["crops"])}
        _MODEL_CACHE[model_dir] = (q10, q50, q90, meta, crop_to_enc)
    return _MODEL_CACHE[model_dir]


def predict(
    crop: str,
    soil_score: float,
    rainfall_mm: float,
    ndvi_avg: float,
    days_since_sowing: int,
    model_dir: str = None,
) -> dict:
    """
    Forecast yield with uncertainty bands (10th / 50th / 90th percentile).

    Parameters
    ----------
    crop               : str   — one of the 8 trained crops
    soil_score         : float — composite soil health index [0, 1]
    rainfall_mm        : float — cumulative seasonal rainfall (mm)
    ndvi_avg           : float — mean NDVI during growing season [0, 1]
    days_since_sowing  : int   — days elapsed since sowing at query time
    model_dir          : str   — directory containing yield_q*.pkl files
                                 (auto-resolved to backend/ml_models/ if None)

    Returns
    -------
    dict:
        crop                  : str
        days_since_sowing     : int
        yield_low_kg_acre     : float  (10th percentile — pessimistic)
        yield_median_kg_acre  : float  (50th percentile — best estimate)
        yield_high_kg_acre    : float  (90th percentile — optimistic)
        interval_width_kg     : float  (Q90 - Q10)
        confidence_band       : str    (narrow / moderate / wide)
        forecast_note         : str    (human-readable explanation)
    """
    if model_dir is None:
        model_dir = str(Path(__file__).parent / "ml_models")

    q10, q50, q90, meta, crop_to_enc = _load_bundle(model_dir)

    crop_lower = crop.lower()
    if crop_lower not in crop_to_enc:
        raise ValueError(
            f"Unknown crop '{crop}'. Supported: {sorted(crop_to_enc.keys())}"
        )

    row = np.array([[
        crop_to_enc[crop_lower],
        float(soil_score),
        float(rainfall_mm),
        float(ndvi_avg),
        int(days_since_sowing),
    ]])

    low_y    = round(float(q10.predict(row)[0]), 1)
    median_y = round(float(q50.predict(row)[0]), 1)
    high_y   = round(float(q90.predict(row)[0]), 1)

    # Ensure ordering (quantile crossing is possible but rare)
    low_y, median_y, high_y = sorted([low_y, median_y, high_y])
    interval = round(high_y - low_y, 1)

    # Confidence band label
    base = CROP_PROFILE.get(crop_lower, (1000, 700, 200, 120))[0]
    rel_width = interval / max(base, 1)
    if rel_width < 0.25:
        band_label = "narrow"
        note_suffix = "Conditions are well-defined — estimate is reliable."
    elif rel_width < 0.60:
        band_label = "moderate"
        note_suffix = "Some uncertainty — revisit forecast closer to harvest."
    else:
        band_label = "wide"
        note_suffix = "High uncertainty — early season or highly variable inputs."

    season_days = CROP_PROFILE.get(crop_lower, (1000, 700, 200, 120))[3]
    pct_done    = min(days_since_sowing / season_days, 1.0) * 100

    note = (
        f"{crop.capitalize()} yield forecast at {days_since_sowing} DAS "
        f"({pct_done:.0f}% of season): "
        f"median {median_y:.0f} kg/acre "
        f"[{low_y:.0f} – {high_y:.0f}]. "
        + note_suffix
    )

    return {
        "crop":                 crop_lower,
        "days_since_sowing":    int(days_since_sowing),
        "yield_low_kg_acre":    max(low_y, 0.0),
        "yield_median_kg_acre": max(median_y, 0.0),
        "yield_high_kg_acre":   max(high_y, 0.0),
        "interval_width_kg":    interval,
        "confidence_band":      band_label,
        "forecast_note":        note,
    }


# ─────────────────────────────────────────────────────────────────────────────
# 5. Entry point
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    out_dir = Path(__file__).parent / "ml_models"

    print("=" * 65)
    print("STEP 1 — Generate synthetic dataset (n=6000)")
    print("=" * 65)
    df = generate_yield_dataset(n=6000, seed=42)

    print("\n" + "=" * 65)
    print("STEP 2 — Train 3 LightGBM quantile models (Q10, Q50, Q90)")
    print("=" * 65)
    models, le = train(df, out_dir)

    print("\n" + "=" * 65)
    print("STEP 3 — Smoke-test predict()")
    print("=" * 65)

    test_cases = [
        # crop        soil  rain  ndvi  days  expected_range
        ("wheat",     0.80, 380,  0.75, 100,  "~700-1000 kg/acre, narrow band"),
        ("wheat",     0.80, 380,  0.75,  45,  "~700-1000 kg/acre, WIDE band (early)"),
        ("rice",      0.70, 1100, 0.80, 110,  "~900-1200 kg/acre"),
        ("cotton",    0.55, 600,  0.60, 150,  "~250-400 kg/acre"),
        ("sugarcane", 0.75, 1200, 0.82, 300,  "~3500-4500 kg/acre"),
        ("chickpea",  0.60, 300,  0.65,  80,  "~300-500 kg/acre"),
        ("wheat",     0.25, 150,  0.30, 110,  "low yield — poor soil, drought"),
    ]

    for crop, soil, rain, ndvi, days, note in test_cases:
        res = predict(crop, soil, rain, ndvi, days, model_dir=str(out_dir))
        band = res["confidence_band"]
        print(
            f"\n  {crop:10s}  soil={soil:.2f} rain={rain:4.0f}mm "
            f"ndvi={ndvi:.2f} days={days:3d}"
        )
        print(
            f"    => Low:{res['yield_low_kg_acre']:6.0f}  "
            f"Median:{res['yield_median_kg_acre']:6.0f}  "
            f"High:{res['yield_high_kg_acre']:6.0f} kg/acre"
            f"  [{band}]"
        )
        print(f"    Expected: {note}")
        print(f"    Note: {res['forecast_note']}")

    print("\nDone — yield_q10/q50/q90.pkl ready for /yield/forecast endpoint.")
