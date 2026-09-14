"""RL-based crop rotation prediction service.

Loads the PPO model trained by backend/ml/train_rl_rotation.py and exposes
a single predict() function consumed by the rotation-plan endpoint.

The model artifact must exist at backend/ml_models/rl_rotation_model.zip.
Run  `backend/venv/Scripts/python backend/ml/train_rl_rotation.py`  to produce it.
"""
import os
from typing import Any, Dict, List, Optional

import numpy as np

# ---------------------------------------------------------------------------
# Crop constants — must stay in sync with train_rl_rotation.py
# ---------------------------------------------------------------------------
CROPS = ["rice", "wheat", "maize", "soybean", "groundnut", "cotton"]
N_CROPS = len(CROPS)
CROP_IDX = {c: i for i, c in enumerate(CROPS)}
LEGUMES = {"soybean", "groundnut"}

BASE_PROFIT = {
    "rice":      22000.0,
    "wheat":     18000.0,
    "maize":     15000.0,
    "soybean":   16000.0,
    "groundnut": 20000.0,
    "cotton":    25000.0,
}

N_IMPACT = {
    "rice":      -8.0,
    "wheat":    -10.0,
    "maize":    -12.0,
    "soybean":  +15.0,
    "groundnut": +12.0,
    "cotton":    -9.0,
}

SOC_IMPACT = {
    "rice":       0.5,
    "wheat":     -0.3,
    "maize":     -0.5,
    "soybean":    0.8,
    "groundnut":  0.6,
    "cotton":    -0.4,
}

# ---------------------------------------------------------------------------
# Model path
# ---------------------------------------------------------------------------
_MODEL_PATH = os.path.join(
    os.path.dirname(__file__),          # backend/app/services/
    "..", "..", "ml_models",            # backend/ml_models/
    "rl_rotation_model",
)
_model = None  # lazy-loaded singleton


def _load_model():
    """Load PPO model once; cache in module-level _model."""
    global _model
    if _model is not None:
        return _model

    try:
        import os as _os
        from stable_baselines3 import PPO

        abs_path = _os.path.abspath(_MODEL_PATH)
        # Accept either bare path or .zip suffix
        if not _os.path.exists(abs_path + ".zip") and not _os.path.exists(abs_path):
            raise FileNotFoundError(
                f"RL model not found at {abs_path}.zip. "
                "Run backend/ml/train_rl_rotation.py first."
            )
        # Force CPU — avoids CUDA deserialization errors on CPU-only machines
        _model = PPO.load(abs_path, device="cpu")
        return _model
    except Exception as exc:
        raise RuntimeError(f"Failed to load RL rotation model: {exc}") from exc


# ---------------------------------------------------------------------------
# Observation builder — mirrors CropRotationEnv._make_obs()
# ---------------------------------------------------------------------------
def _build_obs(
    soil_nitrogen: float,
    soil_organic_carbon: float,
    last_3_crops: List[str],
) -> np.ndarray:
    """Build 5-dim observation matching CropRotationEnv:
        [soil_nitrogen/100, soil_organic_carbon/100, crop_t-3, crop_t-2, crop_t-1]
    Crop codes are integer indices 0-5 matching CROPS list.
    """
    padded = ([-1] * 3 + [CROP_IDX.get(c.lower().strip(), 0) for c in last_3_crops])[-3:]
    obs = np.array(
        [
            float(np.clip(soil_nitrogen / 100.0, 0.0, 1.0)),
            float(np.clip(soil_organic_carbon / 100.0, 0.0, 1.0)),
        ] + [float(max(0, c)) for c in padded],
        dtype=np.float32,
    )
    return obs


# ---------------------------------------------------------------------------
# Projected soil impact score
# ---------------------------------------------------------------------------
def _soil_impact_score(
    chosen_crop: str,
    soil_nitrogen: float,
    soil_organic_carbon: float,
) -> float:
    """Return a composite soil impact score in [-1.0, 1.0].

    Positive = soil improvement, Negative = soil degradation.
    """
    n_delta = N_IMPACT.get(chosen_crop, 0.0)
    soc_delta = SOC_IMPACT.get(chosen_crop, 0.0)
    # Normalise: N max change ~15, SOC max change ~0.8
    n_score = np.clip(n_delta / 15.0, -1.0, 1.0)
    soc_score = np.clip(soc_delta / 1.0, -1.0, 1.0)
    return round(float(0.6 * n_score + 0.4 * soc_score), 3)


# ---------------------------------------------------------------------------
# Projected profit (Rs/acre)
# ---------------------------------------------------------------------------
def _projected_profit(
    chosen_crop: str,
    soil_nitrogen: float,
    last_3_crops: List[str],
) -> float:
    """Estimate profit adjusted for soil nitrogen level and repetition penalty."""
    base = BASE_PROFIT.get(chosen_crop, 15000.0)

    # Nitrogen stress reduction (non-legumes hurt more under low N)
    if chosen_crop not in LEGUMES and soil_nitrogen < 40:
        stress_factor = (soil_nitrogen / 40.0) ** 0.5   # 0..1
        base *= (0.75 + 0.25 * stress_factor)            # max 25% reduction

    # Repetition penalty: same crop ≥ 2 consecutive seasons → 15% revenue hit
    last_crops_norm = [c.lower().strip() for c in last_3_crops]
    if len(last_crops_norm) >= 2 and last_crops_norm[-1] == chosen_crop:
        base *= 0.85

    return round(base, 2)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def predict(
    soil_nitrogen: float,
    soil_organic_carbon: float,
    last_3_crops: List[str],
) -> Dict[str, Any]:
    """Run one inference step on the trained PPO rotation agent.

    Args:
        soil_nitrogen:       Current soil nitrogen level (0–100).
        soil_organic_carbon: Current SOC level (0–100).
        last_3_crops:        List of up to 3 recent crop names (oldest first).

    Returns:
        {
            "next_crop":              str,   # recommended crop name
            "projected_profit":       float, # estimated Rs/acre
            "projected_soil_impact":  float, # -1.0 (degradation) … +1.0 (improvement)
        }
    """
    model = _load_model()

    obs = _build_obs(soil_nitrogen, soil_organic_carbon, last_3_crops)
    # SB3 expects shape (1, obs_dim) or (obs_dim,) — predict handles both
    action, _states = model.predict(obs, deterministic=True)
    chosen_crop = CROPS[int(action)]

    return {
        "next_crop": chosen_crop,
        "projected_profit": _projected_profit(chosen_crop, soil_nitrogen, last_3_crops),
        "projected_soil_impact": _soil_impact_score(
            chosen_crop, soil_nitrogen, soil_organic_carbon
        ),
    }
