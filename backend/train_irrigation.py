"""
train_irrigation.py
===================
Smart Irrigation / Water Demand model — Prompt #3

Architecture
------------
1. Penman-Monteith ET0  (real FAO-56 formula, not ML)
   Inputs: temp_max, temp_min, humidity_pct, wind_speed_ms, solar_rad_MJm2,
           elevation_m, latitude_deg, day_of_year
   Output: ET0 mm/day  (reference evapotranspiration)

2. Gradient Boosting correction layer  (scikit-learn)
   Inputs: ET0, soil_moisture_pct, crop_stage (0-3)
   Output: adjusted_liters_per_day  (per 1000 m² / 1 bigha)
   Correction captures: soil water-holding offset, crop-growth-stage
   coefficient (Kc), and practical scheduling adjustments.

Outputs
-------
  backend/ml_models/irrigation_correction.pkl   — fitted GradientBoostingRegressor
  backend/train_irrigation.py                   — this script
"""

import json
import math
import pickle
import warnings
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

warnings.filterwarnings("ignore")

# ─────────────────────────────────────────────────────────────────────────────
# 1. FAO-56 Penman-Monteith ET0
# ─────────────────────────────────────────────────────────────────────────────

def penman_monteith_et0(
    temp_max_c: float,
    temp_min_c: float,
    humidity_pct: float,
    wind_speed_ms: float,
    solar_rad_MJm2: float,
    elevation_m: float,
    latitude_deg: float,
    day_of_year: int,
) -> float:
    """
    Compute FAO-56 Penman-Monteith reference evapotranspiration (ET0).

    Reference: Allen et al. (1998), FAO Irrigation and Drainage Paper No. 56.

    Parameters
    ----------
    temp_max_c      : Daily maximum temperature (°C)
    temp_min_c      : Daily minimum temperature (°C)
    humidity_pct    : Mean relative humidity (%)
    wind_speed_ms   : Wind speed at 2 m height (m/s)
    solar_rad_MJm2  : Incoming solar radiation (MJ/m²/day)
    elevation_m     : Site elevation above sea level (m)
    latitude_deg    : Site latitude (degrees, positive = North)
    day_of_year     : Julian day number (1–365)

    Returns
    -------
    ET0 : float — mm/day
    """
    # Mean temperature
    T_mean = (temp_max_c + temp_min_c) / 2.0

    # Atmospheric pressure (kPa) — function of elevation
    P = 101.3 * ((293.0 - 0.0065 * elevation_m) / 293.0) ** 5.26

    # Psychrometric constant γ (kPa/°C)
    gamma = 0.000665 * P

    # Slope of saturation vapour pressure curve Δ (kPa/°C)
    Delta = (4098.0 * (0.6108 * math.exp(17.27 * T_mean / (T_mean + 237.3)))) / (T_mean + 237.3) ** 2

    # Saturation vapour pressure es (kPa)
    es_max = 0.6108 * math.exp(17.27 * temp_max_c / (temp_max_c + 237.3))
    es_min = 0.6108 * math.exp(17.27 * temp_min_c / (temp_min_c + 237.3))
    es = (es_max + es_min) / 2.0

    # Actual vapour pressure ea (kPa)
    ea = humidity_pct / 100.0 * es

    # Extraterrestrial radiation Ra (MJ/m²/day) — FAO-56 Eq 21
    phi    = math.radians(latitude_deg)
    delta  = 0.409 * math.sin(2 * math.pi / 365 * day_of_year - 1.39)   # solar declination
    dr     = 1 + 0.033 * math.cos(2 * math.pi / 365 * day_of_year)       # inverse relative distance
    omega_s = math.acos(-math.tan(phi) * math.tan(delta))                 # sunset hour angle
    Ra = (24.0 * 60.0 / math.pi) * 0.0820 * dr * (
        omega_s * math.sin(phi) * math.sin(delta)
        + math.cos(phi) * math.cos(delta) * math.sin(omega_s)
    )

    # Clear-sky solar radiation Rso (MJ/m²/day)
    Rso = (0.75 + 2e-5 * elevation_m) * Ra

    # Net shortwave radiation Rns
    alpha = 0.23   # albedo for reference grass surface
    Rns = (1 - alpha) * solar_rad_MJm2

    # Net longwave radiation Rnl (FAO-56 Eq 39)
    sigma = 4.903e-9   # Stefan–Boltzmann constant MJ/(K^4·m²·day)
    T_max_K = temp_max_c + 273.16
    T_min_K = temp_min_c + 273.16
    Rnl = sigma * ((T_max_K ** 4 + T_min_K ** 4) / 2.0) * (
        0.34 - 0.14 * math.sqrt(max(ea, 0.0))
    ) * (1.35 * min(solar_rad_MJm2 / max(Rso, 0.001), 1.0) - 0.35)

    # Net radiation Rn (MJ/m²/day)
    Rn = Rns - Rnl

    # Soil heat flux G (assumed 0 for daily ET0)
    G = 0.0

    # FAO-56 PM equation (Eq 6)
    numerator   = 0.408 * Delta * (Rn - G) + gamma * (900.0 / (T_mean + 273)) * wind_speed_ms * (es - ea)
    denominator = Delta + gamma * (1 + 0.34 * wind_speed_ms)

    ET0 = numerator / denominator
    return max(ET0, 0.0)


# ─────────────────────────────────────────────────────────────────────────────
# 2. Crop coefficient (Kc) by growth stage
#    Stage: 0=initial, 1=development, 2=mid-season, 3=late
# ─────────────────────────────────────────────────────────────────────────────
# FAO-56 Table 12 representative Kc values (generalised for common crops)
KC_BY_STAGE = {
    0: 0.40,   # initial: low canopy cover, low transpiration
    1: 0.85,   # development: rapid growth
    2: 1.15,   # mid-season: full canopy, peak demand
    3: 0.75,   # late-season: maturation, senescence
}


# ─────────────────────────────────────────────────────────────────────────────
# 3. Synthetic dataset generator
# ─────────────────────────────────────────────────────────────────────────────
FIELD_SIZE_M2 = 1000.0   # 1 bigha ≈ 1000 m² (used throughout)


def generate_irrigation_dataset(n: int = 4000, seed: int = 42) -> pd.DataFrame:
    """
    Generate synthetic daily irrigation records.

    Ground-truth adjusted_liters_per_day formula:
      ETcrop  = ET0 × Kc(stage)                    (mm/day crop ET)
      deficit  = ETcrop - (soil_moisture_pct / 100) × ETcrop × 0.8
                # soil already supplies up to 80% of crop need at FC
      liters   = max(deficit, 0) × FIELD_SIZE_M2   # 1 mm/m² = 1 litre
      + noise
    """
    rng = np.random.RandomState(seed)

    # Simulate across Indian climate range (lat 8–32°N, elevation 50–1200m)
    N = n
    lat       = rng.uniform(8, 32, N)
    elev      = rng.uniform(50, 1200, N)
    doy       = rng.randint(1, 366, N)

    temp_max  = rng.uniform(20, 42, N)
    temp_min  = temp_max - rng.uniform(6, 14, N)
    humidity  = rng.uniform(30, 95, N)
    wind      = rng.uniform(0.5, 5.0, N)
    solar     = rng.uniform(10, 28, N)

    soil_moist = rng.uniform(10, 80, N)   # % field capacity
    crop_stage = rng.randint(0, 4, N)     # 0–3

    records = []
    for i in range(N):
        et0 = penman_monteith_et0(
            temp_max_c=float(temp_max[i]),
            temp_min_c=float(temp_min[i]),
            humidity_pct=float(humidity[i]),
            wind_speed_ms=float(wind[i]),
            solar_rad_MJm2=float(solar[i]),
            elevation_m=float(elev[i]),
            latitude_deg=float(lat[i]),
            day_of_year=int(doy[i]),
        )

        kc      = KC_BY_STAGE[int(crop_stage[i])]
        et_crop = et0 * kc                              # crop evapotranspiration (mm/day)

        # Soil supplies a fraction proportional to moisture level
        soil_supply_frac = (float(soil_moist[i]) / 100.0) * 0.8
        deficit_mm       = max(et_crop * (1.0 - soil_supply_frac), 0.0)
        liters_true      = deficit_mm * FIELD_SIZE_M2

        # Add realistic noise (±10%)
        liters_obs = liters_true * rng.uniform(0.90, 1.10)

        records.append({
            "ET0":                  round(et0, 4),
            "soil_moisture_pct":    round(float(soil_moist[i]), 2),
            "crop_stage":           int(crop_stage[i]),
            "adjusted_liters_day":  round(liters_obs, 2),
            # kept for reference / validation
            "_et_crop_mm":          round(et_crop, 4),
            "_deficit_mm":          round(deficit_mm, 4),
        })

    df = pd.DataFrame(records)
    print(f"Dataset shape : {df.shape}")
    print(f"ET0 range     : {df['ET0'].min():.2f} – {df['ET0'].max():.2f} mm/day")
    print(f"Liters range  : {df['adjusted_liters_day'].min():.0f} – {df['adjusted_liters_day'].max():.0f} L/day")
    return df


# ─────────────────────────────────────────────────────────────────────────────
# 4. Train correction layer
# ─────────────────────────────────────────────────────────────────────────────
def train(df: pd.DataFrame, out_dir: Path):
    out_dir.mkdir(parents=True, exist_ok=True)

    FEATURE_COLS = ["ET0", "soil_moisture_pct", "crop_stage"]
    TARGET_COL   = "adjusted_liters_day"

    X = df[FEATURE_COLS]
    y = df[TARGET_COL]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("gbr", GradientBoostingRegressor(
            n_estimators=200,
            max_depth=4,
            learning_rate=0.08,
            subsample=0.85,
            min_samples_leaf=10,
            random_state=42,
        )),
    ])

    print("\nTraining GradientBoostingRegressor correction layer...")
    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    mae    = mean_absolute_error(y_test, y_pred)
    r2     = r2_score(y_test, y_pred)
    print(f"MAE  : {mae:.2f} L/day")
    print(f"R²   : {r2:.4f}")

    # Feature importances from GBR
    gbr   = pipeline.named_steps["gbr"]
    imprt = dict(zip(FEATURE_COLS, gbr.feature_importances_))
    print("Feature importances:", {k: f"{v:.3f}" for k, v in imprt.items()})

    # Save
    bundle   = {"pipeline": pipeline, "feature_cols": FEATURE_COLS}
    pkl_path = out_dir / "irrigation_correction.pkl"
    with open(pkl_path, "wb") as f:
        pickle.dump(bundle, f)
    print(f"\nModel saved => {pkl_path}  ({pkl_path.stat().st_size // 1024} KB)")
    return pipeline


# ─────────────────────────────────────────────────────────────────────────────
# 5. predict() — importable by the FastAPI service
# ─────────────────────────────────────────────────────────────────────────────
_MODEL_CACHE: dict = {}


def predict(
    # Weather inputs for ET0
    temp_max_c: float,
    temp_min_c: float,
    humidity_pct: float,
    wind_speed_ms: float,
    solar_rad_MJm2: float,
    elevation_m: float,
    latitude_deg: float,
    day_of_year: int,
    # Field inputs for correction
    soil_moisture_pct: float,
    crop_stage: int,                   # 0=initial 1=dev 2=mid 3=late
    field_size_m2: float = 1000.0,     # default 1 bigha
    model_path: str = None,
) -> dict:
    """
    Estimate daily irrigation water requirement for a field.

    Returns
    -------
    dict:
        ET0_mm_day           : float — FAO-56 reference ET (mm/day)
        ETcrop_mm_day        : float — crop-adjusted ET (ET0 × Kc)
        Kc                   : float — crop coefficient for the given stage
        raw_liters_day       : float — physics-based estimate before ML correction
        adjusted_liters_day  : float — ML-corrected estimate
        field_size_m2        : float — area used in calculation
        crop_stage_label     : str
        recommendation       : str   — human-readable irrigation advice
    """
    STAGE_LABELS = {0: "initial", 1: "development", 2: "mid-season", 3: "late-season"}

    # ── Step 1: Penman-Monteith ET0 ──
    et0 = penman_monteith_et0(
        temp_max_c, temp_min_c, humidity_pct,
        wind_speed_ms, solar_rad_MJm2, elevation_m,
        latitude_deg, day_of_year,
    )

    # ── Step 2: Crop ET ──
    kc      = KC_BY_STAGE.get(int(crop_stage), 1.0)
    et_crop = et0 * kc

    # ── Step 3: Physics-based estimate ──
    soil_supply_frac = (soil_moisture_pct / 100.0) * 0.8
    deficit_mm       = max(et_crop * (1.0 - soil_supply_frac), 0.0)
    raw_liters       = deficit_mm * field_size_m2

    # ── Step 4: ML correction ──
    if model_path is None:
        model_path = str(Path(__file__).parent / "ml_models" / "irrigation_correction.pkl")

    if model_path not in _MODEL_CACHE:
        with open(model_path, "rb") as f:
            _MODEL_CACHE[model_path] = pickle.load(f)

    bundle   = _MODEL_CACHE[model_path]
    pipeline = bundle["pipeline"]

    row      = pd.DataFrame([{"ET0": et0, "soil_moisture_pct": soil_moisture_pct, "crop_stage": crop_stage}])
    # Correction is trained on 1000 m² base; scale to actual field
    scale    = field_size_m2 / FIELD_SIZE_M2
    adj_lit  = float(pipeline.predict(row)[0]) * scale

    # ── Step 5: Recommendation text — thresholds scale with field size ──
    # Use mm/day deficit as the decision variable (field-size-independent)
    deficit_per_m2 = max(adj_lit, 0.0) / max(field_size_m2, 1.0)  # L/m²/day ~ mm/day

    if deficit_per_m2 < 0.5:
        advice = "No irrigation needed today — soil moisture is sufficient."
    elif deficit_per_m2 < 2.0:
        advice = f"Light irrigation recommended: ~{adj_lit:.0f} L for {field_size_m2:.0f} m². Consider drip/micro-sprinkler."
    elif deficit_per_m2 < 5.0:
        advice = f"Moderate irrigation: ~{adj_lit:.0f} L for {field_size_m2:.0f} m². Irrigate in early morning to reduce evaporation."
    else:
        advice = f"Heavy irrigation required: ~{adj_lit:.0f} L for {field_size_m2:.0f} m². Split into 2 sessions to avoid waterlogging."

    return {
        "ET0_mm_day":          round(et0, 3),
        "ETcrop_mm_day":       round(et_crop, 3),
        "Kc":                  kc,
        "raw_liters_day":      round(raw_liters, 1),
        "adjusted_liters_day": round(max(adj_lit, 0.0), 1),
        "field_size_m2":       field_size_m2,
        "crop_stage_label":    STAGE_LABELS.get(int(crop_stage), "unknown"),
        "recommendation":      advice,
    }


# ─────────────────────────────────────────────────────────────────────────────
# 6. Entry point
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    out_dir = Path(__file__).parent / "ml_models"

    print("=" * 60)
    print("STEP 1 — Verify Penman-Monteith ET0 formula")
    print("=" * 60)
    # FAO-56 worked example (Table 1, p. 133) — Ρoma, Bolivia, July 15
    # Expected ET0 ≈ 3.9 mm/day
    et0_test = penman_monteith_et0(
        temp_max_c=21.5, temp_min_c=12.3,
        humidity_pct=70.0, wind_speed_ms=2.78,
        solar_rad_MJm2=18.8, elevation_m=3874,
        latitude_deg=-16.2, day_of_year=196,
    )
    print(f"FAO-56 reference example ET0 = {et0_test:.3f} mm/day  (expected ~3.9)")

    # Indian summer conditions
    et0_india = penman_monteith_et0(
        temp_max_c=38.0, temp_min_c=26.0,
        humidity_pct=55.0, wind_speed_ms=2.5,
        solar_rad_MJm2=24.0, elevation_m=250,
        latitude_deg=23.0, day_of_year=182,
    )
    print(f"Indian summer  ET0 = {et0_india:.3f} mm/day  (expect 6–9)")

    print("\n" + "=" * 60)
    print("STEP 2 — Generate synthetic dataset (n=4000)")
    print("=" * 60)
    df = generate_irrigation_dataset(n=4000, seed=42)

    print("\n" + "=" * 60)
    print("STEP 3 — Train correction layer")
    print("=" * 60)
    pipeline = train(df, out_dir)

    print("\n" + "=" * 60)
    print("STEP 4 — Smoke-test predict()")
    print("=" * 60)

    test_cases = [
        dict(
            label="Hot dry summer, stage 2 (mid), low moisture",
            temp_max_c=40, temp_min_c=28, humidity_pct=40,
            wind_speed_ms=3.0, solar_rad_MJm2=26, elevation_m=200,
            latitude_deg=25, day_of_year=180,
            soil_moisture_pct=20, crop_stage=2,
        ),
        dict(
            label="Monsoon, stage 1 (dev), high moisture",
            temp_max_c=32, temp_min_c=24, humidity_pct=85,
            wind_speed_ms=1.5, solar_rad_MJm2=15, elevation_m=150,
            latitude_deg=20, day_of_year=210,
            soil_moisture_pct=75, crop_stage=1,
        ),
        dict(
            label="Winter, stage 0 (initial), medium moisture",
            temp_max_c=22, temp_min_c=10, humidity_pct=60,
            wind_speed_ms=2.0, solar_rad_MJm2=16, elevation_m=300,
            latitude_deg=28, day_of_year=350,
            soil_moisture_pct=50, crop_stage=0,
        ),
        dict(
            label="Late season, stage 3 — high moisture (no irrigation expected)",
            temp_max_c=30, temp_min_c=18, humidity_pct=70,
            wind_speed_ms=2.0, solar_rad_MJm2=18, elevation_m=100,
            latitude_deg=18, day_of_year=280,
            soil_moisture_pct=78, crop_stage=3,
        ),
    ]

    for tc in test_cases:
        label = tc.pop("label")
        result = predict(**tc, model_path=str(out_dir / "irrigation_correction.pkl"))
        print(f"\n  [{label}]")
        print(f"    ET0={result['ET0_mm_day']} mm/day  "
              f"ETcrop={result['ETcrop_mm_day']} mm/day  "
              f"Kc={result['Kc']}")
        print(f"    Raw: {result['raw_liters_day']} L  |  "
              f"Adjusted: {result['adjusted_liters_day']} L  |  "
              f"Stage: {result['crop_stage_label']}")
        print(f"    => {result['recommendation']}")

    print("\nDone — irrigation_correction.pkl ready for /irrigation/predict endpoint.")
