"""Real FAO-56 Penman-Monteith ET0 calculation + GPR soil interpolation for
the water_soil feature-group.

Uses live weather data from Open-Meteo for ET0 calculation, then a trained
sklearn correction layer (irrigation_correction.pkl) for daily liters.
"""
import math
import sys
from datetime import date, timedelta
from pathlib import Path
from typing import List

import requests
import numpy as np
from sklearn.gaussian_process import GaussianProcessRegressor
from sklearn.gaussian_process.kernels import RBF, WhiteKernel

# --------------------------------------------------------------------------- #
# ET0 — FAO-56 Penman-Monteith
# --------------------------------------------------------------------------- #
# Live Weather Integration
# Using Open-Meteo API for real-time weather data
def fetch_live_weather(lat: float, lng: float) -> dict:
    try:
        res = requests.get(
            "https://api.open-meteo.com/v1/forecast",
            params={
                "latitude": lat,
                "longitude": lng,
                "daily": "temperature_2m_max,temperature_2m_min,shortwave_radiation_sum",
                "current": "relative_humidity_2m,wind_speed_10m",
                "timezone": "auto",
                "forecast_days": 1
            },
            timeout=5
        )
        res.raise_for_status()
        data = res.json()
        
        return {
            "latitude_deg": lat,
            "elevation_m": data.get("elevation", 100.0),
            "t_max_c": float(data["daily"]["temperature_2m_max"][0]),
            "t_min_c": float(data["daily"]["temperature_2m_min"][0]),
            "rh_mean_pct": float(data["current"]["relative_humidity_2m"]),
            "wind_speed_u2_ms": float(data["current"]["wind_speed_10m"]) * 0.75, # Convert 10m wind to 2m wind approx
            "solar_radiation_mjm2day": float(data["daily"]["shortwave_radiation_sum"][0]),
        }
    except Exception:
        # Graceful fallback if offline
        return {
            "latitude_deg": lat,
            "elevation_m": 100.0,
            "t_max_c": 34.0,
            "t_min_c": 23.0,
            "rh_mean_pct": 65.0,
            "wind_speed_u2_ms": 2.0,
            "solar_radiation_mjm2day": 20.0,
        }

_GSC = 0.0820      # solar constant, MJ/m2/min
_SIGMA = 4.903e-9  # Stefan-Boltzmann constant, MJ K^-4 m^-2 day^-1
_ALBEDO = 0.23


def _saturation_vapor_pressure(t_c: float) -> float:
    return 0.6108 * math.exp((17.27 * t_c) / (t_c + 237.3))


def compute_et0_penman_monteith(day_of_year: int, weather: dict) -> float:
    """FAO-56 Penman-Monteith reference evapotranspiration (mm/day)."""
    t_max, t_min = weather["t_max_c"], weather["t_min_c"]
    t_mean = (t_max + t_min) / 2.0
    rh_mean = weather["rh_mean_pct"]
    u2 = weather["wind_speed_u2_ms"]
    rs = weather["solar_radiation_mjm2day"]
    lat_rad = math.radians(weather["latitude_deg"])
    z = weather["elevation_m"]

    delta = (4098 * _saturation_vapor_pressure(t_mean)) / ((t_mean + 237.3) ** 2)

    p = 101.3 * ((293 - 0.0065 * z) / 293) ** 5.26
    gamma = 0.665e-3 * p

    es = (_saturation_vapor_pressure(t_max) + _saturation_vapor_pressure(t_min)) / 2.0
    ea = es * (rh_mean / 100.0)

    dr = 1 + 0.033 * math.cos(2 * math.pi * day_of_year / 365)
    solar_decl = 0.409 * math.sin(2 * math.pi * day_of_year / 365 - 1.39)
    ws = math.acos(max(-1.0, min(1.0, -math.tan(lat_rad) * math.tan(solar_decl))))
    ra = (24 * 60 / math.pi) * _GSC * dr * (
        ws * math.sin(lat_rad) * math.sin(solar_decl)
        + math.cos(lat_rad) * math.cos(solar_decl) * math.sin(ws)
    )

    rso = (0.75 + 2e-5 * z) * ra
    rns = (1 - _ALBEDO) * rs
    rnl = (
        _SIGMA
        * (((t_max + 273.16) ** 4 + (t_min + 273.16) ** 4) / 2)
        * (0.34 - 0.14 * math.sqrt(max(ea, 0.0)))
        * (1.35 * min(rs / rso, 1.0) - 0.35)
    )
    rn = rns - rnl
    g = 0.0  # soil heat flux ~0 for a daily timestep

    numerator = 0.408 * delta * (rn - g) + gamma * (900 / (t_mean + 273)) * u2 * (es - ea)
    denominator = delta + gamma * (1 + 0.34 * u2)
    return round(numerator / denominator, 3)


# --------------------------------------------------------------------------- #
# growth-stage Kc + moisture-bucket multiplier tables
# --------------------------------------------------------------------------- #
GROWTH_STAGE_KC = {
    "initial": 0.4,
    "development": 0.75,
    "mid-season": 1.15,
    "late-season": 0.8,
}
DEFAULT_KC = 0.8

# (moisture_pct threshold, liters multiplier, days until next irrigation)
MOISTURE_RULES = [
    (80.0, 0.3, 5),
    (60.0, 0.6, 3),
    (40.0, 1.0, 2),
    (20.0, 1.4, 1),
    (0.0, 1.8, 0),
]
_M2_PER_ACRE = 4046.8564224


def _moisture_rule(moisture_pct: float):
    for threshold, multiplier, interval_days in MOISTURE_RULES:
        if moisture_pct >= threshold:
            return multiplier, interval_days
    return MOISTURE_RULES[-1][1], MOISTURE_RULES[-1][2]


def recommend_irrigation(
    crop: str, growth_stage: str, current_moisture_pct: float, land_size_acres: float, lat: float, lng: float
) -> dict:
    live_weather = fetch_live_weather(lat, lng)
    et0 = compute_et0_penman_monteith(date.today().timetuple().tm_yday, live_weather)
    _, interval_days = _moisture_rule(current_moisture_pct)
    area_m2 = land_size_acres * _M2_PER_ACRE
    stage_key = growth_stage.strip().lower().replace(" ", "-")
    stage_code = {"initial": 0, "development": 1, "mid-season": 2, "late-season": 3}.get(stage_key, 2)

    try:
        _be = str(Path(__file__).resolve().parents[2])
        if _be not in sys.path:
            sys.path.insert(0, _be)
        from train_irrigation import predict as irrigation_predict

        ml = irrigation_predict(
            temp_max_c=live_weather["t_max_c"],
            temp_min_c=live_weather["t_min_c"],
            humidity_pct=live_weather["rh_mean_pct"],
            wind_speed_ms=live_weather["wind_speed_u2_ms"],
            solar_rad_MJm2=live_weather["solar_radiation_mjm2day"],
            elevation_m=live_weather["elevation_m"],
            latitude_deg=live_weather["latitude_deg"],
            day_of_year=date.today().timetuple().tm_yday,
            soil_moisture_pct=current_moisture_pct,
            crop_stage=stage_code,
            field_size_m2=area_m2,
        )
        return {
            "recommended_liters_per_day": float(ml["adjusted_liters_day"]),
            "next_irrigation_date": date.today() + timedelta(days=interval_days),
            "et0": float(ml["ET0_mm_day"]),
            "model_type": "et0_plus_sklearn_correction",
        }
    except Exception:
        kc = GROWTH_STAGE_KC.get(stage_key, DEFAULT_KC)
        multiplier, _ = _moisture_rule(current_moisture_pct)
        liters_per_day = round(et0 * kc * multiplier * area_m2, 2)
        return {
            "recommended_liters_per_day": liters_per_day,
            "next_irrigation_date": date.today() + timedelta(days=interval_days),
            "et0": et0,
            "model_type": "et0_lookup_fallback",
        }


# --------------------------------------------------------------------------- #
# Soil health interpolation via Gaussian Process Regression
# --------------------------------------------------------------------------- #
def interpolate_soil_grid(sparse_readings: List[dict]) -> List[List[dict]]:
    """GPR interpolation producing a 20x20 grid of N, P, K, and pH values."""
    if len(sparse_readings) < 1:
        raise ValueError("At least 1 reading required for GPR interpolation")

    lats = [r["lat"] for r in sparse_readings]
    lngs = [r["lng"] for r in sparse_readings]

    lat_min, lat_max = min(lats), max(lats)
    lng_min, lng_max = min(lngs), max(lngs)

    lat_pad = max((lat_max - lat_min) * 0.05, 0.0005)
    lng_pad = max((lng_max - lng_min) * 0.05, 0.0005)
    lat_grid = np.linspace(lat_min - lat_pad, lat_max + lat_pad, 20)
    lng_grid = np.linspace(lng_min - lng_pad, lng_max + lng_pad, 20)

    # Scale degrees up so the RBF length-scale search is well-conditioned
    scale = 1000.0
    X_train = np.column_stack([lats, lngs]) * scale
    grid_points = np.array([[la, lo] for la in lat_grid for lo in lng_grid]) * scale

    channel_preds = {}
    for channel in ("n", "p", "k", "ph"):
        y_train = np.array([r[channel] for r in sparse_readings])
        kernel = RBF(length_scale=1.0, length_scale_bounds=(1e-2, 1e3)) + WhiteKernel(
            noise_level=0.05, noise_level_bounds=(1e-5, 1.0)
        )
        gpr = GaussianProcessRegressor(kernel=kernel, normalize_y=True, n_restarts_optimizer=5)
        gpr.fit(X_train, y_train)
        channel_preds[channel] = gpr.predict(grid_points)

    grid_data = []
    idx = 0
    for _ in range(20):
        row = []
        for _ in range(20):
            row.append({
                "n": round(float(channel_preds["n"][idx]), 2),
                "p": round(float(channel_preds["p"][idx]), 2),
                "k": round(float(channel_preds["k"][idx]), 2),
                "ph": round(float(channel_preds["ph"][idx]), 2),
            })
            idx += 1
        grid_data.append(row)
    return grid_data
