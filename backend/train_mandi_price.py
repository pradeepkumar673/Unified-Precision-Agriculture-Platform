"""
train_mandi_price.py
====================
Hyperlocal Mandi Price Forecasting — Prompt #4

Architecture
------------
  • Synthetic 2-year daily price time series for 5 crops × 3 districts = 15 series
  • Each series has:
      - Base price (crop-specific)
      - Annual harvest-season dip  (supply glut post-harvest)
      - Lean-season premium        (pre-harvest, Apr-May)
      - Kharif/Rabi seasonality
      - Festival demand spikes     (Diwali, Holi, Eid, Onam, Makar Sankranti)
      - District-level price premium/discount (transport costs, local demand)
      - AR(1) autocorrelation + heteroskedastic noise
  • Prophet model (additive mode) trained per (crop, district) pair
  • All 15 models saved in one pickle dict

Outputs
-------
  backend/ml_models/mandi_price_models.pkl   — {(crop, district): Prophet model}
  backend/ml_models/mandi_price_meta.json    — crop base prices, series stats
"""

import json
import pickle
import warnings
from datetime import datetime, timedelta
from pathlib import Path

import numpy as np
import pandas as pd

warnings.filterwarnings("ignore")

# ─────────────────────────────────────────────────────────────────────────────
# 1. Domain constants
# ─────────────────────────────────────────────────────────────────────────────
CROPS = ["wheat", "rice", "cotton", "soybean", "tomato"]
DISTRICTS = ["Pune", "Ludhiana", "Warangal"]

# Base MSP / typical mandi price (Rs/quintal)
CROP_BASE_PRICE = {
    "wheat":   2200,
    "rice":    2100,
    "cotton":  6200,
    "soybean": 4400,
    "tomato":  1800,  # highly volatile
}

# Harvest months (calendar month numbers) — supply glut => price dip
HARVEST_MONTHS = {
    "wheat":   [4, 5],          # Rabi harvest Apr-May
    "rice":    [10, 11],        # Kharif harvest Oct-Nov
    "cotton":  [11, 12, 1],     # Kharif cotton Nov-Jan
    "soybean": [10, 11],        # Oct-Nov
    "tomato":  [2, 3, 9, 10],   # Two seasons
}

# Festival demand spikes: (month, day, name, amplitude_pct)
FESTIVALS = [
    (10, 24, "Diwali",         0.12),   # ±12% spike
    (3,   8, "Holi",           0.07),
    (4,  14, "Baisakhi",       0.05),
    (8,  15, "Independence",   0.04),
    (1,  14, "MakarSankranti", 0.06),
    (9,   1, "Onam",           0.05),   # approximate
    (4,  11, "Eid",            0.08),   # approximate
]

# District price modifiers (relative to national base)
DISTRICT_PREMIUM = {
    "Pune":     +0.05,    # urban market, higher prices
    "Ludhiana": -0.02,    # large grain market, competitive
    "Warangal": -0.04,    # cotton belt, some surplus
}

# Crop-specific volatility (std as fraction of price)
CROP_VOLATILITY = {
    "wheat":   0.04,
    "rice":    0.04,
    "cotton":  0.07,
    "soybean": 0.06,
    "tomato":  0.18,   # highly volatile vegetable
}


# ─────────────────────────────────────────────────────────────────────────────
# 2. Time series generator
# ─────────────────────────────────────────────────────────────────────────────
def generate_price_series(
    crop: str,
    district: str,
    start_date: str = "2023-01-01",
    n_days: int = 731,   # 2 years
    seed: int = 42,
) -> pd.DataFrame:
    """
    Generate a realistic synthetic daily mandi price series.

    Returns a DataFrame with columns: ds (date), y (price Rs/quintal)
    — ready for Prophet.
    """
    rng   = np.random.RandomState(seed + hash(crop + district) % 9999)
    dates = pd.date_range(start=start_date, periods=n_days, freq="D")

    base     = CROP_BASE_PRICE[crop]
    premium  = DISTRICT_PREMIUM[district]
    vol      = CROP_VOLATILITY[crop]
    harvest  = HARVEST_MONTHS[crop]

    prices = np.zeros(n_days)
    prev   = base * (1 + premium)

    for i, dt in enumerate(dates):
        m = dt.month
        d = dt.day

        # ── Harvest-season supply dip (−8 to −15% in harvest months)
        if m in harvest:
            harvest_factor = -0.12
        else:
            harvest_factor = 0.0

        # ── Lean-season premium: 2 months before main harvest, prices rise
        # (farmers hold stock, traders anticipate supply crunch)
        lean_months = [(h - 2 - 1) % 12 + 1 for h in harvest[:1]]
        lean_factor = 0.06 if m in lean_months else 0.0

        # ── Smooth annual trend: slight price increase across 2 years
        annual_drift = (i / n_days) * 0.08   # +8% over 2 years (inflation)

        # ── Festival spike: check if today ±3 days is a festival
        fest_factor = 0.0
        for fm, fd, fname, amp in FESTIVALS:
            diff_days = abs((dt - dt.replace(month=fm, day=min(fd, 28))).days)
            if diff_days <= 3:
                # Spike decays with distance from festival date
                fest_factor += amp * np.exp(-0.5 * (diff_days / 1.5) ** 2)

        # ── Week-day effect: prices dip on Sunday (thin market)
        weekday_factor = -0.02 if dt.weekday() == 6 else 0.0

        # ── Expected price
        expected = base * (1 + premium + harvest_factor + lean_factor
                           + annual_drift + fest_factor + weekday_factor)

        # ── AR(1) autocorrelation: yesterday's price anchors today
        alpha    = 0.65                          # mean-reversion strength
        noise    = rng.normal(0, vol * base)
        price    = alpha * prev + (1 - alpha) * expected + noise
        price    = max(price, base * 0.3)        # floor at 30% of base
        prices[i] = round(price, 2)
        prev       = price

    df = pd.DataFrame({"ds": dates, "y": prices})
    return df


# ─────────────────────────────────────────────────────────────────────────────
# 3. Train Prophet per (crop, district)
# ─────────────────────────────────────────────────────────────────────────────
def train_all(out_dir: Path):
    from prophet import Prophet

    out_dir.mkdir(parents=True, exist_ok=True)
    models = {}
    meta   = {}

    total  = len(CROPS) * len(DISTRICTS)
    done   = 0

    for crop in CROPS:
        for district in DISTRICTS:
            done += 1
            key = (crop, district)
            print(f"  [{done:2d}/{total}] Training Prophet for {crop} / {district}...")

            df = generate_price_series(crop, district, seed=42)

            # Add festival regressors as binary columns
            for fm, fd, fname, amp in FESTIVALS:
                col = f"fest_{fname.lower()}"
                df[col] = df["ds"].apply(
                    lambda dt, m=fm, d=fd: 1
                    if abs((dt - dt.replace(month=m, day=min(d, 28))).days) <= 3 else 0
                )

            m = Prophet(
                yearly_seasonality=True,
                weekly_seasonality=True,
                daily_seasonality=False,
                seasonality_mode="additive",
                changepoint_prior_scale=0.15,   # moderate flexibility
                seasonality_prior_scale=12.0,
                interval_width=0.90,
            )
            # Add festival regressors
            for fm, fd, fname, amp in FESTIVALS:
                col = f"fest_{fname.lower()}"
                m.add_regressor(col)

            m.fit(df)
            models[key] = m

            # Compute in-sample stats for meta
            forecast  = m.predict(df)
            mae_insample = float((forecast["yhat"] - df["y"]).abs().mean())
            meta[f"{crop}|{district}"] = {
                "base_price":    CROP_BASE_PRICE[crop],
                "district_prem": DISTRICT_PREMIUM[district],
                "n_obs":         len(df),
                "y_mean":        round(float(df["y"].mean()), 2),
                "y_std":         round(float(df["y"].std()), 2),
                "mae_insample":  round(mae_insample, 2),
                "festival_cols": [f"fest_{fn.lower()}" for _, _, fn, _ in FESTIVALS],
            }
            print(f"          in-sample MAE: Rs {mae_insample:.1f}/quintal")

    # Save all models in one pickle
    pkl_path = out_dir / "mandi_price_models.pkl"
    with open(pkl_path, "wb") as f:
        pickle.dump(models, f)
    print(f"\nAll {total} models saved => {pkl_path}  ({pkl_path.stat().st_size // 1024} KB)")

    # Save metadata
    meta_path = out_dir / "mandi_price_meta.json"
    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2)
    print(f"Metadata saved => {meta_path}")

    return models, meta


# ─────────────────────────────────────────────────────────────────────────────
# 4. predict() — importable by the FastAPI service
# ─────────────────────────────────────────────────────────────────────────────
_MODELS_CACHE: dict = {}


def _load_models(model_path: str):
    if model_path not in _MODELS_CACHE:
        with open(model_path, "rb") as f:
            _MODELS_CACHE[model_path] = pickle.load(f)
    return _MODELS_CACHE[model_path]


def _make_future_df(model, start_date: datetime, n_days: int) -> pd.DataFrame:
    """Build a future DataFrame with zero-valued festival regressors."""
    from prophet import Prophet
    dates = pd.date_range(start=start_date, periods=n_days, freq="D")
    future = pd.DataFrame({"ds": dates})

    # Populate festival columns
    for fm, fd, fname, amp in FESTIVALS:
        col = f"fest_{fname.lower()}"
        future[col] = future["ds"].apply(
            lambda dt, m=fm, d=fd: 1
            if abs((dt - dt.replace(month=m, day=min(d, 28))).days) <= 3 else 0
        )
    return future


def predict(
    crop: str,
    district: str,
    weeks_ahead: int = 4,
    model_path: str = None,
) -> dict:
    """
    Forecast mandi price for a given crop-district pair.

    Parameters
    ----------
    crop         : str — one of 'wheat','rice','cotton','soybean','tomato'
    district     : str — one of 'Pune','Ludhiana','Warangal'
    weeks_ahead  : int — number of weeks to forecast (1–52)
    model_path   : str — path to mandi_price_models.pkl (auto-resolved if None)

    Returns
    -------
    dict:
        crop              : str
        district          : str
        forecast_start    : str  (ISO date, tomorrow)
        forecast_weeks    : int
        weekly_forecasts  : list[dict] with:
            week_ending       : str  (ISO date)
            price_forecast    : float  (Rs/quintal, weekly median)
            price_lower_90    : float
            price_upper_90    : float
            trend             : str  ('up'|'down'|'flat')
        overall_trend     : str
        recommendation    : str
    """
    if model_path is None:
        model_path = str(Path(__file__).parent / "ml_models" / "mandi_price_models.pkl")

    models = _load_models(model_path)
    key    = (crop.lower(), district)

    if key not in models:
        avail = sorted(models.keys())
        raise ValueError(
            f"No model for ({crop}, {district}). "
            f"Available: {avail}"
        )

    model    = models[key]
    n_days   = weeks_ahead * 7
    tomorrow = datetime.today().replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)

    future   = _make_future_df(model, tomorrow, n_days)
    forecast = model.predict(future)

    # Aggregate to weekly buckets
    forecast["week"] = (forecast["ds"] - forecast["ds"].min()).dt.days // 7
    weekly = (
        forecast.groupby("week")
        .agg(
            week_ending=("ds", "max"),
            price_forecast=("yhat", "median"),
            price_lower_90=("yhat_lower", "median"),
            price_upper_90=("yhat_upper", "median"),
        )
        .reset_index(drop=True)
    )

    # Trend per week
    def _trend(row, prev_price):
        delta_pct = (row["price_forecast"] - prev_price) / max(prev_price, 1) * 100
        if delta_pct >  1.5:
            return "up"
        elif delta_pct < -1.5:
            return "down"
        return "flat"

    weekly_list = []
    prev = float(weekly.iloc[0]["price_forecast"]) if len(weekly) > 1 else CROP_BASE_PRICE.get(crop, 2000)
    for _, row in weekly.iterrows():
        t = _trend(row, prev)
        weekly_list.append({
            "week_ending":     str(row["week_ending"].date()),
            "price_forecast":  round(float(row["price_forecast"]), 2),
            "price_lower_90":  round(float(row["price_lower_90"]), 2),
            "price_upper_90":  round(float(row["price_upper_90"]), 2),
            "trend":           t,
        })
        prev = float(row["price_forecast"])

    # Overall trend
    first_p = weekly_list[0]["price_forecast"]
    last_p  = weekly_list[-1]["price_forecast"]
    overall_delta_pct = (last_p - first_p) / max(first_p, 1) * 100
    if overall_delta_pct > 3:
        overall_trend = "rising"
        recommendation = (
            f"{crop.capitalize()} prices in {district} are expected to RISE by "
            f"{overall_delta_pct:.1f}% over the next {weeks_ahead} weeks. "
            f"Consider holding stock or forward-selling at a premium."
        )
    elif overall_delta_pct < -3:
        overall_trend = "falling"
        recommendation = (
            f"{crop.capitalize()} prices in {district} are expected to FALL by "
            f"{abs(overall_delta_pct):.1f}% over the next {weeks_ahead} weeks. "
            f"Consider selling early or securing forward contracts now."
        )
    else:
        overall_trend = "stable"
        recommendation = (
            f"{crop.capitalize()} prices in {district} are expected to remain "
            f"STABLE ({overall_delta_pct:+.1f}%) over the next {weeks_ahead} weeks."
        )

    return {
        "crop":             crop,
        "district":         district,
        "forecast_start":   str(tomorrow.date()),
        "forecast_weeks":   weeks_ahead,
        "weekly_forecasts": weekly_list,
        "overall_trend":    overall_trend,
        "recommendation":   recommendation,
    }


# ─────────────────────────────────────────────────────────────────────────────
# 5. Entry point
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    out_dir = Path(__file__).parent / "ml_models"

    print("=" * 65)
    print("STEP 1 — Preview synthetic series (wheat / Ludhiana)")
    print("=" * 65)
    df_preview = generate_price_series("wheat", "Ludhiana", seed=42)
    print(df_preview.head(10).to_string(index=False))
    print(f"\nSeries stats:  mean={df_preview['y'].mean():.0f}  "
          f"std={df_preview['y'].std():.0f}  "
          f"min={df_preview['y'].min():.0f}  "
          f"max={df_preview['y'].max():.0f}  Rs/quintal")

    print("\n" + "=" * 65)
    print("STEP 2 — Train Prophet models (15 crop-district pairs)")
    print("=" * 65)
    models, meta = train_all(out_dir)

    print("\n" + "=" * 65)
    print("STEP 3 — Smoke-test predict()")
    print("=" * 65)

    test_cases = [
        ("wheat",   "Ludhiana",  4),
        ("cotton",  "Warangal",  8),
        ("tomato",  "Pune",      2),
        ("soybean", "Pune",      6),
    ]

    model_path = str(out_dir / "mandi_price_models.pkl")
    for crop, district, weeks in test_cases:
        result = predict(crop, district, weeks_ahead=weeks, model_path=model_path)
        print(f"\n  {crop.upper()} / {district} ({weeks} weeks ahead)")
        print(f"  Forecast start: {result['forecast_start']}")
        for w in result["weekly_forecasts"]:
            print(f"    {w['week_ending']}  Rs {w['price_forecast']:7.0f}  "
                  f"[{w['price_lower_90']:6.0f} – {w['price_upper_90']:6.0f}]  {w['trend']}")
        print(f"  Overall: {result['overall_trend'].upper()}")
        print(f"  => {result['recommendation']}")

    print("\nAll done — mandi_price_models.pkl ready for the /mandi-price/forecast endpoint.")
