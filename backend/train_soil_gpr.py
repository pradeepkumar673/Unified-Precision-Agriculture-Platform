"""
train_soil_gpr.py
=================
Soil Health Modeling — Prompt #6

Architecture
------------
  Gaussian Process Regression (GPR) — a.k.a. Kriging — for spatial
  interpolation of soil nutrients (N, P, K) and pH from sparse sensor
  readings to a dense 20×20 field grid.

  Why GPR / how it differs from plain interpolation
  --------------------------------------------------
  GPR is a Bayesian non-parametric interpolator. Beyond the predicted
  mean it gives a full predictive standard deviation at each grid cell,
  which the frontend can display as a confidence/uncertainty heatmap.

  Workflow
  --------
  1. Pre-optimize kernel hyperparameters (length scale, noise level)
     on a synthetic "representative dataset" of 500 field measurements.
     This is the training step — saves compute at inference time.
  2. At inference (predict_grid call):
       a. Accept sparse_points — a list of dicts with (x, y, N, P, K, pH)
       b. For each nutrient, fit GPR using the pre-optimized kernel params
          (warm-start: no hyperparameter search needed at runtime)
       c. Predict on a 20×20 regular grid
       d. Return mean + uncertainty grid as JSON

  Saved artefacts
  ---------------
    backend/ml_models/soil_gpr_kernels.pkl  — pre-optimised kernel params per nutrient
    backend/ml_models/soil_gpr_meta.json    — feature ranges, grid spec, training stats

  Key sklearn classes
  -------------------
    GaussianProcessRegressor with RBF + WhiteKernel (nugget noise)
"""

import json
import math
import pickle
import warnings
from pathlib import Path
from typing import List, Dict, Any

import numpy as np
from sklearn.gaussian_process import GaussianProcessRegressor
from sklearn.gaussian_process.kernels import RBF, WhiteKernel, ConstantKernel as C
from sklearn.preprocessing import StandardScaler

warnings.filterwarnings("ignore")

# ─────────────────────────────────────────────────────────────────────────────
# 1. Constants
# ─────────────────────────────────────────────────────────────────────────────
GRID_N      = 20          # 20×20 prediction grid
NUTRIENTS   = ["N", "P", "K", "pH"]

# Realistic Indian soil nutrient ranges
NUTRIENT_RANGE = {
    "N":   (80,  280),    # kg/ha  (nitrogen)
    "P":   (10,   60),    # kg/ha  (phosphorus)
    "K":   (80,  300),    # kg/ha  (potassium)
    "pH":  (5.5,  8.5),   # pH scale
}

# Field dimensions: 0–100 metres in each direction
FIELD_X_MAX = 100.0
FIELD_Y_MAX = 100.0


# ─────────────────────────────────────────────────────────────────────────────
# 2. Synthetic field data generator (for kernel hyperparameter optimisation)
# ─────────────────────────────────────────────────────────────────────────────
def _spatial_trend(x: np.ndarray, y: np.ndarray, nutrient: str, seed: int = 0) -> np.ndarray:
    """
    Generate realistic spatially-correlated nutrient values using a
    deterministic trend + two Gaussian bumps (simulates natural field variation).
    """
    rng   = np.random.RandomState(seed)
    lo, hi = NUTRIENT_RANGE[nutrient]
    base   = (lo + hi) / 2.0
    half   = (hi - lo) / 2.0

    # Two random "hotspots" — e.g. areas of high-N due to organic matter or water pooling
    cx1, cy1 = rng.uniform(20, 80, 2)
    cx2, cy2 = rng.uniform(20, 80, 2)
    amp1 = rng.uniform(0.25, 0.50) * half
    amp2 = rng.uniform(0.15, 0.35) * half
    ls1  = rng.uniform(20, 40)     # length scale of first patch
    ls2  = rng.uniform(15, 30)

    # Linear gradient (slope across field)
    slope_x = rng.uniform(-0.3, 0.3) * half / FIELD_X_MAX
    slope_y = rng.uniform(-0.2, 0.2) * half / FIELD_Y_MAX

    bump1 = amp1 * np.exp(-0.5 * ((x - cx1) ** 2 + (y - cy1) ** 2) / ls1 ** 2)
    bump2 = amp2 * np.exp(-0.5 * ((x - cx2) ** 2 + (y - cy2) ** 2) / ls2 ** 2)
    vals  = base + slope_x * (x - 50) + slope_y * (y - 50) + bump1 + bump2
    return np.clip(vals, lo, hi)


def generate_field_dataset(n_points: int = 500, seed: int = 42) -> dict:
    """
    Generate a representative dataset of (x, y, N, P, K, pH) field measurements.
    Used ONLY for kernel hyperparameter optimisation — not exposed at inference.
    """
    rng = np.random.RandomState(seed)
    xs  = rng.uniform(0, FIELD_X_MAX, n_points)
    ys  = rng.uniform(0, FIELD_Y_MAX, n_points)

    data = {"x": xs, "y": ys}
    for nut in NUTRIENTS:
        true_vals = _spatial_trend(xs, ys, nut, seed=seed + hash(nut) % 999)
        lo, hi    = NUTRIENT_RANGE[nut]
        noise_std = (hi - lo) * 0.04      # 4% of range as sensor noise
        data[nut] = true_vals + rng.normal(0, noise_std, n_points)
    return data


# ─────────────────────────────────────────────────────────────────────────────
# 3. Pre-optimise GPR kernels on training data
# ─────────────────────────────────────────────────────────────────────────────
def _make_kernel(nutrient: str):
    """
    Build a GPR kernel: ConstantKernel × RBF + WhiteKernel (nugget noise).
    Initial length scale tuned to ~1/4 of field width (25m) — typical soil
    variogram range for Indian agricultural fields.
    """
    lo, hi   = NUTRIENT_RANGE[nutrient]
    var_init = ((hi - lo) / 4.0) ** 2   # rough initial signal variance

    kernel = (
        C(var_init, constant_value_bounds=(1e-3, 1e6))
        * RBF(length_scale=25.0, length_scale_bounds=(5.0, 80.0))
        + WhiteKernel(noise_level=(hi - lo) * 0.01, noise_level_bounds=(1e-4, 1e3))
    )
    return kernel


def optimise_kernels(data: dict, out_dir: Path) -> dict:
    """
    Fit one GPR per nutrient on the training data to learn kernel hyperparameters.
    Returns a dict of fitted GPR objects (used only for their .kernel_ attribute).
    """
    out_dir.mkdir(parents=True, exist_ok=True)

    X_train = np.column_stack([data["x"], data["y"]])
    fitted  = {}
    meta_kernels = {}

    for nut in NUTRIENTS:
        print(f"  Optimising kernel for {nut}...")
        y_train = data[nut]

        gpr = GaussianProcessRegressor(
            kernel=_make_kernel(nut),
            n_restarts_optimizer=5,
            normalize_y=True,
            alpha=1e-6,         # numerical stability
            random_state=42,
        )
        gpr.fit(X_train, y_train)
        fitted[nut] = gpr

        # Extract optimised hyperparameters
        params = gpr.kernel_.get_params()
        print(f"    Fitted kernel: {gpr.kernel_}")
        meta_kernels[nut] = {
            "kernel_str": str(gpr.kernel_),
            "log_likelihood": round(gpr.log_marginal_likelihood_value_, 4),
        }

    # Save kernels bundle
    pkl_path = out_dir / "soil_gpr_kernels.pkl"
    with open(pkl_path, "wb") as f:
        pickle.dump(fitted, f)
    print(f"\nKernels saved => {pkl_path}  ({pkl_path.stat().st_size // 1024} KB)")
    return fitted, meta_kernels


# ─────────────────────────────────────────────────────────────────────────────
# 4. predict_grid() — importable by the FastAPI service
# ─────────────────────────────────────────────────────────────────────────────
_KERNEL_CACHE: dict = {}

# Pre-built 20×20 grid coordinates (reused across calls)
_GRID_XY: np.ndarray = None


def _get_grid_xy() -> np.ndarray:
    global _GRID_XY
    if _GRID_XY is None:
        gx = np.linspace(0, FIELD_X_MAX, GRID_N)
        gy = np.linspace(0, FIELD_Y_MAX, GRID_N)
        gxx, gyy = np.meshgrid(gx, gy)
        _GRID_XY = np.column_stack([gxx.ravel(), gyy.ravel()])
    return _GRID_XY


def _load_kernels(model_dir: str) -> dict:
    if model_dir not in _KERNEL_CACHE:
        with open(Path(model_dir) / "soil_gpr_kernels.pkl", "rb") as f:
            _KERNEL_CACHE[model_dir] = pickle.load(f)
    return _KERNEL_CACHE[model_dir]


def predict_grid(
    sparse_points: List[Dict[str, float]],
    model_dir: str = None,
    grid_n: int = GRID_N,
) -> Dict[str, Any]:
    """
    Interpolate N, P, K, pH from sparse field sensor readings to a 20×20 grid.

    Parameters
    ----------
    sparse_points : list of dicts, each with keys:
        x    : float  — sensor x-position in metres [0, 100]
        y    : float  — sensor y-position in metres [0, 100]
        N    : float  — nitrogen reading  (kg/ha)    [optional — omit to skip]
        P    : float  — phosphorus reading (kg/ha)
        K    : float  — potassium reading  (kg/ha)
        pH   : float  — soil pH
        (Any subset of N/P/K/pH can be present; missing nutrients are skipped)

    model_dir : str
        Directory containing soil_gpr_kernels.pkl.
        Defaults to backend/ml_models/.

    grid_n : int
        Grid resolution (grid_n × grid_n cells). Default 20.

    Returns
    -------
    dict:
        grid_x          : list[float]   — x-coordinates of grid columns (length grid_n)
        grid_y          : list[float]   — y-coordinates of grid rows    (length grid_n)
        nutrients       : dict          — one entry per available nutrient:
            mean        : list[list[float]] — grid_n × grid_n predicted mean
            std         : list[list[float]] — grid_n × grid_n predictive std deviation
            unit        : str
            range       : [float, float]    — [min, max] of the mean grid
        n_sensors       : int
        sensor_summary  : dict          — mean ± std of each sensor reading
        warnings        : list[str]
    """
    if model_dir is None:
        model_dir = str(Path(__file__).parent / "ml_models")

    fitted_gprs  = _load_kernels(model_dir)
    warns        = []

    # Build sensor array
    n_sensors = len(sparse_points)
    if n_sensors < 3:
        warns.append(f"Only {n_sensors} sensor points provided — interpolation may be unreliable. Minimum recommended: 6.")

    X_obs = np.array([[p["x"], p["y"]] for p in sparse_points], dtype=float)

    # Build prediction grid
    gx   = np.linspace(0, FIELD_X_MAX, grid_n)
    gy   = np.linspace(0, FIELD_Y_MAX, grid_n)
    gxx, gyy = np.meshgrid(gx, gy)
    X_grid   = np.column_stack([gxx.ravel(), gyy.ravel()])

    UNITS = {"N": "kg/ha", "P": "kg/ha", "K": "kg/ha", "pH": ""}

    nutrients_out = {}
    for nut in NUTRIENTS:
        # Check if this nutrient is in the sparse_points
        nut_values = [p[nut] for p in sparse_points if nut in p and p[nut] is not None]
        if not nut_values:
            continue

        y_obs = np.array(nut_values, dtype=float)
        X_nut = X_obs[:len(nut_values)]    # align if some points missing nutrient

        # Retrieve pre-optimised kernel (copy so we don't mutate the cache)
        base_gpr = fitted_gprs[nut]
        gpr = GaussianProcessRegressor(
            kernel=base_gpr.kernel_,        # reuse optimised hyperparams — no search
            n_restarts_optimizer=0,         # no re-optimisation at inference
            normalize_y=True,
            alpha=1e-6,
            random_state=42,
            optimizer=None,                 # CRITICAL: skip hyperparameter search
        )
        gpr.fit(X_nut, y_obs)

        mean_flat, std_flat = gpr.predict(X_grid, return_std=True)

        # Clip to realistic range
        lo, hi = NUTRIENT_RANGE[nut]
        mean_flat = np.clip(mean_flat, lo * 0.8, hi * 1.2)
        std_flat  = np.clip(std_flat,  0.0, (hi - lo) * 0.5)

        mean_grid = mean_flat.reshape(grid_n, grid_n).tolist()
        std_grid  = std_flat.reshape(grid_n, grid_n).tolist()

        nutrients_out[nut] = {
            "mean":  [[round(v, 2) for v in row] for row in mean_grid],
            "std":   [[round(v, 2) for v in row] for row in std_grid],
            "unit":  UNITS[nut],
            "range": [round(float(mean_flat.min()), 2), round(float(mean_flat.max()), 2)],
        }

    # Sensor summary stats
    sensor_summary = {}
    for nut in NUTRIENTS:
        vals = [p[nut] for p in sparse_points if nut in p and p[nut] is not None]
        if vals:
            sensor_summary[nut] = {
                "n":    len(vals),
                "mean": round(float(np.mean(vals)), 2),
                "std":  round(float(np.std(vals)), 2),
                "min":  round(float(np.min(vals)), 2),
                "max":  round(float(np.max(vals)), 2),
            }

    return {
        "grid_x":        [round(float(v), 2) for v in gx],
        "grid_y":        [round(float(v), 2) for v in gy],
        "nutrients":     nutrients_out,
        "n_sensors":     n_sensors,
        "sensor_summary": sensor_summary,
        "warnings":      warns,
    }


# ─────────────────────────────────────────────────────────────────────────────
# 5. Entry point
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    out_dir = Path(__file__).parent / "ml_models"

    print("=" * 65)
    print("STEP 1 — Generate representative training field (n=500)")
    print("=" * 65)
    data = generate_field_dataset(n_points=500, seed=42)
    for nut in NUTRIENTS:
        lo, hi = NUTRIENT_RANGE[nut]
        vals   = data[nut]
        print(f"  {nut:4s}: mean={vals.mean():.1f}  std={vals.std():.1f}  "
              f"range=[{lo}, {hi}]")

    print("\n" + "=" * 65)
    print("STEP 2 — Optimise GPR kernels (one per nutrient)")
    print("=" * 65)
    fitted_gprs, meta_kernels = optimise_kernels(data, out_dir)

    # Save metadata
    meta = {
        "nutrients": NUTRIENTS,
        "nutrient_ranges": NUTRIENT_RANGE,
        "grid_n": GRID_N,
        "field_x_max": FIELD_X_MAX,
        "field_y_max": FIELD_Y_MAX,
        "kernels": meta_kernels,
    }
    meta_path = out_dir / "soil_gpr_meta.json"
    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2)
    print(f"Metadata saved => {meta_path}")

    print("\n" + "=" * 65)
    print("STEP 3 — Smoke-test predict_grid() with 10 synthetic sensors")
    print("=" * 65)

    # Simulate 10 sensor readings from the true field surface
    rng = np.random.RandomState(7)
    xs  = rng.uniform(5, 95, 10)
    ys  = rng.uniform(5, 95, 10)

    sparse_points = []
    for i in range(10):
        pt = {"x": round(float(xs[i]), 1), "y": round(float(ys[i]), 1)}
        for nut in NUTRIENTS:
            true_v = _spatial_trend(
                np.array([xs[i]]), np.array([ys[i]]), nut, seed=42 + hash(nut) % 999
            )[0]
            lo, hi = NUTRIENT_RANGE[nut]
            noise  = rng.normal(0, (hi - lo) * 0.04)
            pt[nut] = round(float(np.clip(true_v + noise, lo * 0.8, hi * 1.2)), 2)
        sparse_points.append(pt)

    print(f"\nSensor readings ({len(sparse_points)} points):")
    print(f"  {'x':>6}  {'y':>6}  {'N':>7}  {'P':>6}  {'K':>7}  {'pH':>5}")
    for p in sparse_points:
        print(f"  {p['x']:6.1f}  {p['y']:6.1f}  {p['N']:7.1f}  {p['P']:6.1f}  "
              f"{p['K']:7.1f}  {p['pH']:5.2f}")

    model_dir = str(out_dir)
    result = predict_grid(sparse_points, model_dir=model_dir, grid_n=20)

    print(f"\nGrid output: {result['grid_n'] if 'grid_n' in result else 20}×20 cells")
    print(f"n_sensors: {result['n_sensors']}")

    for nut, info in result["nutrients"].items():
        grid_mean = np.array(info["mean"])
        grid_std  = np.array(info["std"])
        lo, hi    = NUTRIENT_RANGE[nut]
        unit      = info["unit"]
        print(
            f"  {nut:4s}: mean_grid={grid_mean.mean():.1f}  "
            f"std_avg={grid_std.mean():.2f}  "
            f"grid_range=[{info['range'][0]:.1f}, {info['range'][1]:.1f}] {unit}"
        )

    print("\nSensor summary (input stats):")
    for nut, ss in result["sensor_summary"].items():
        print(f"  {nut}: n={ss['n']}  mean={ss['mean']:.1f}  std={ss['std']:.1f}")

    if result["warnings"]:
        print("\nWarnings:", result["warnings"])

    # Verify JSON-serialisable
    json_str = json.dumps(result)
    print(f"\nJSON payload size: {len(json_str) / 1024:.1f} KB  (frontend-ready)")

    print("\nDone — soil_gpr_kernels.pkl ready for /soil/interpolate endpoint.")
