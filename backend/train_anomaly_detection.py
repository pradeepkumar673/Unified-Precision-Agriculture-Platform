"""
train_anomaly_detection.py
==========================
Anomaly Detection for Fraud/Quality — Prompt #13

Model: Isolation Forest (scikit-learn) on synthetic marketplace transactions.

Feature space
-------------
  amount_rs              float  — transaction value in rupees
  quality_grade_reported int    — seller-reported grade (1=A, 2=B, 3=C)
  time_since_last_txn_h  float  — hours since same farmer's last transaction
  buyer_txn_frequency    float  — buyer's historical transactions/week
  farmer_txn_frequency   float  — farmer's historical transactions/week
  price_per_kg           float  — derived: amount / quantity_kg
  quantity_kg            float  — quantity in kg
  quantity_to_avg_ratio  float  — this txn qty / farmer's typical qty (>2 = suspicious)
  grade_vs_history       float  — grade - farmer's modal grade (>0 = grade inflation)
  hour_of_day            int    — transaction hour (0-23)

Anomaly taxonomy (injected in synthetic dataset)
-------------------------------------------------
  Type 1 — Grade inflation      : seller reports A but historically sells B/C
  Type 2 — Wash trading         : same buyer-farmer pair, very short interval
  Type 3 — Price spike          : price_per_kg >> 3x district median
  Type 4 — Quantity stuffing    : unusually large single-shipment vs. history
  Type 5 — Off-hours trading    : transactions at 1-4 AM (suspicious timing)
  Normal : ~90% of dataset

Outputs
-------
  backend/ml_models/anomaly_iforest.pkl   — trained Isolation Forest
  backend/ml_models/anomaly_scaler.pkl    — StandardScaler for normalization
  backend/ml_models/anomaly_meta.json     — thresholds, feature list, evaluation
"""

import json
import pickle
import warnings
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    classification_report, precision_recall_fscore_support, roc_auc_score,
)

warnings.filterwarnings("ignore")

# ─────────────────────────────────────────────────────────────────────────────
# 1. Constants
# ─────────────────────────────────────────────────────────────────────────────
FEATURES = [
    "amount_rs",
    "quality_grade_reported",
    "time_since_last_txn_h",
    "buyer_txn_frequency",
    "farmer_txn_frequency",
    "price_per_kg",
    "quantity_kg",
    "quantity_to_avg_ratio",
    "grade_vs_history",
    "hour_of_day",
]

FEATURE_LABELS = {
    "amount_rs":               "Transaction amount (Rs)",
    "quality_grade_reported":  "Reported quality grade (1=A, 2=B, 3=C)",
    "time_since_last_txn_h":   "Hours since last transaction",
    "buyer_txn_frequency":     "Buyer transaction frequency (txn/week)",
    "farmer_txn_frequency":    "Farmer transaction frequency (txn/week)",
    "price_per_kg":            "Price per kg",
    "quantity_kg":             "Quantity (kg)",
    "quantity_to_avg_ratio":   "Quantity vs. farmer average",
    "grade_vs_history":        "Grade vs. historical modal grade",
    "hour_of_day":             "Transaction hour",
}

ANOMALY_TYPES = {
    0: "normal",
    1: "grade_inflation",
    2: "wash_trading",
    3: "price_spike",
    4: "quantity_stuffing",
    5: "off_hours_trading",
}

# Contamination rate (fraction of anomalies in training data)
# Isolation Forest uses this as the decision threshold
CONTAMINATION = 0.08   # ~8% anomalies


# ─────────────────────────────────────────────────────────────────────────────
# 2. Synthetic dataset generator
# ─────────────────────────────────────────────────────────────────────────────
def generate_dataset(n: int = 5000, anomaly_frac: float = 0.10, seed: int = 42) -> pd.DataFrame:
    """
    Generate synthetic marketplace transaction records with realistic patterns
    and labelled anomaly injections.

    Normal transactions
    -------------------
      amount_rs         ~ LogNormal(mu=9.5, sigma=1.0)   → Rs 1k-100k
      quality_grade     ~ Categorical({A:30%, B:50%, C:20%})
      time_since_last   ~ Exponential(lambda=1/24h)      (one/day average)
      price_per_kg      ~ Normal(district_median, 0.15*median)
      quantity_kg       ~ LogNormal(mu=3.5, sigma=0.8)   → 5-500 kg

    Anomalies (injected after normal generation, labelled)
    -------------------------------------------------------
      1. Grade inflation (25% of anomalies): grade=1(A), hist_grade=3(C)
      2. Wash trading    (20%): time_since_last < 0.5h, same buyer/farmer pair
      3. Price spike     (20%): price_per_kg > 3.5x median
      4. Quantity stuffing(20%): quantity > 5x farmer average
      5. Off-hours       (15%): hour in [1,2,3,4]
    """
    rng  = np.random.RandomState(seed)
    n_norm  = int(n * (1 - anomaly_frac))
    n_anom  = n - n_norm

    # District price medians per commodity (Rs/kg)
    commodity_medians = [15, 25, 40, 60, 80, 120]  # 6 commodity types

    # ── Normal transactions ──
    farmer_ids  = rng.randint(1, 501, n_norm)
    buyer_ids   = rng.randint(1, 201, n_norm)
    commodities = rng.randint(0, 6, n_norm)
    district_median = np.array([commodity_medians[c] for c in commodities], dtype=float)

    quantity_kg   = np.exp(rng.normal(3.5, 0.8, n_norm)).clip(5, 1000)
    price_per_kg  = district_median * rng.normal(1.0, 0.12, n_norm).clip(0.6, 1.6)
    amount_rs     = quantity_kg * price_per_kg

    quality_grade = rng.choice([1, 2, 3], size=n_norm, p=[0.30, 0.50, 0.20])
    # Farmer modal grade (from their "history")
    farmer_modal  = {fid: rng.choice([1, 2, 3], p=[0.25, 0.50, 0.25])
                     for fid in np.unique(farmer_ids)}
    grade_vs_hist = np.array([quality_grade[i] - farmer_modal[farmer_ids[i]]
                               for i in range(n_norm)], dtype=float)

    time_since = rng.exponential(24, n_norm).clip(0.5, 720)   # hours
    hour_of_day = rng.randint(6, 22, n_norm)   # normal: 6am-10pm

    buyer_freq  = rng.gamma(2, 3, n_norm).clip(0.5, 50)
    farmer_freq = rng.gamma(2, 2, n_norm).clip(0.5, 30)

    # Quantity-to-average ratio (for normal, should be near 1)
    farmer_avg_qty = {fid: np.exp(rng.normal(3.5, 0.4))
                      for fid in np.unique(farmer_ids)}
    qty_ratio = np.array([quantity_kg[i] / farmer_avg_qty[farmer_ids[i]]
                           for i in range(n_norm)])

    labels = np.zeros(n_norm, dtype=int)  # 0 = normal

    # ── Anomalous transactions ──
    # Allocate anomaly types
    anom_types = rng.choice([1, 2, 3, 4, 5], size=n_anom,
                             p=[0.25, 0.20, 0.20, 0.20, 0.15])
    a_farmer  = rng.randint(1, 501, n_anom)
    a_buyer   = rng.randint(1, 201, n_anom)
    a_comm    = rng.randint(0, 6, n_anom)
    a_dm      = np.array([commodity_medians[c] for c in a_comm], dtype=float)

    a_qty    = np.exp(rng.normal(3.5, 0.8, n_anom)).clip(5, 1000)
    a_ppkg   = a_dm * rng.normal(1.0, 0.12, n_anom).clip(0.6, 1.6)
    a_amount = a_qty * a_ppkg
    a_grade  = rng.choice([1, 2, 3], size=n_anom, p=[0.30, 0.50, 0.20])
    a_gvh    = np.array([a_grade[i] - farmer_modal.get(a_farmer[i], 2)
                          for i in range(n_anom)], dtype=float)
    a_time   = rng.exponential(24, n_anom).clip(0.5, 720)
    a_hour   = rng.randint(6, 22, n_anom)
    a_bfreq  = rng.gamma(2, 3, n_anom).clip(0.5, 50)
    a_ffreq  = rng.gamma(2, 2, n_anom).clip(0.5, 30)
    a_qratio = np.array([a_qty[i] / farmer_avg_qty.get(a_farmer[i], 30)
                          for i in range(n_anom)])

    for i, atype in enumerate(anom_types):
        if atype == 1:    # grade inflation
            a_grade[i]  = 1     # reports A
            a_gvh[i]    = 1 - farmer_modal.get(a_farmer[i], 3)  # negative = grade up
            a_gvh[i]    = max(a_gvh[i], -1)
        elif atype == 2:  # wash trading
            a_time[i]   = rng.uniform(0.05, 0.4)   # <30 min
        elif atype == 3:  # price spike
            a_ppkg[i]   = a_dm[i] * rng.uniform(3.5, 6.0)
            a_amount[i] = a_qty[i] * a_ppkg[i]
        elif atype == 4:  # quantity stuffing
            a_qty[i]    = farmer_avg_qty.get(a_farmer[i], 30) * rng.uniform(5, 12)
            a_amount[i] = a_qty[i] * a_ppkg[i]
            a_qratio[i] = rng.uniform(5, 12)
        elif atype == 5:  # off-hours
            a_hour[i]   = rng.choice([1, 2, 3, 4])

    # Merge normal + anomalous
    all_data = {
        "farmer_id":              np.concatenate([farmer_ids, a_farmer]),
        "buyer_id":               np.concatenate([buyer_ids,  a_buyer]),
        "amount_rs":              np.concatenate([amount_rs,  a_amount]),
        "quality_grade_reported": np.concatenate([quality_grade, a_grade]),
        "time_since_last_txn_h":  np.concatenate([time_since, a_time]),
        "buyer_txn_frequency":    np.concatenate([buyer_freq,  a_bfreq]),
        "farmer_txn_frequency":   np.concatenate([farmer_freq, a_ffreq]),
        "price_per_kg":           np.concatenate([price_per_kg, a_ppkg]),
        "quantity_kg":            np.concatenate([quantity_kg, a_qty]),
        "quantity_to_avg_ratio":  np.concatenate([qty_ratio, a_qratio]),
        "grade_vs_history":       np.concatenate([grade_vs_hist, a_gvh]),
        "hour_of_day":            np.concatenate([hour_of_day, a_hour]),
        "anomaly_type":           np.concatenate([labels, anom_types]),
        "is_anomaly":             np.concatenate([np.zeros(n_norm, int),
                                                   np.ones(n_anom, int)]),
    }

    df = pd.DataFrame(all_data)

    # Shuffle
    df = df.sample(frac=1, random_state=seed).reset_index(drop=True)

    print(f"Dataset: {len(df)} records  |  "
          f"Anomalies: {df['is_anomaly'].sum()} ({df['is_anomaly'].mean()*100:.1f}%)")
    print(f"Anomaly breakdown:")
    for atype, aname in ANOMALY_TYPES.items():
        if atype == 0:
            continue
        cnt = (df["anomaly_type"] == atype).sum()
        print(f"  Type {atype} ({aname:20s}): {cnt:4d}")

    return df


# ─────────────────────────────────────────────────────────────────────────────
# 3. Train Isolation Forest
# ─────────────────────────────────────────────────────────────────────────────
def train_model(df: pd.DataFrame, out_dir: Path) -> Tuple[Any, Any, dict]:
    """Train Isolation Forest + StandardScaler and evaluate."""

    X     = df[FEATURES].values
    y_true = df["is_anomaly"].values

    # Normalise features for stable iForest distances
    scaler = StandardScaler()
    X_sc   = scaler.fit_transform(X)

    # Isolation Forest
    # contamination matches dataset anomaly rate for threshold calibration
    iforest = IsolationForest(
        n_estimators=200,
        max_samples="auto",
        contamination=CONTAMINATION,
        max_features=1.0,
        bootstrap=False,
        random_state=42,
        n_jobs=-1,
    )
    iforest.fit(X_sc)

    # Raw scores (more negative = more anomalous)
    raw_scores = iforest.decision_function(X_sc)   # range: ~[-0.5, 0.5]
    # Convert to [0,1]: higher = more anomalous
    anom_scores = 1 - (raw_scores - raw_scores.min()) / (raw_scores.max() - raw_scores.min())
    y_pred = (iforest.predict(X_sc) == -1).astype(int)   # -1=anomaly, 1=normal

    # Metrics
    auc    = roc_auc_score(y_true, anom_scores)
    prec, rec, f1, _ = precision_recall_fscore_support(y_true, y_pred, average="binary")

    print(f"  Detection AUC              : {auc:.4f}")
    print(f"  Precision (anomaly class)  : {prec:.3f}")
    print(f"  Recall    (anomaly class)  : {rec:.3f}")
    print(f"  F1                         : {f1:.3f}")

    # Per-type recall
    print(f"\n  Per-anomaly-type detection rate:")
    for atype, aname in ANOMALY_TYPES.items():
        if atype == 0:
            continue
        mask = df["anomaly_type"] == atype
        detected = (y_pred[mask] == 1).mean() if mask.sum() > 0 else 0.0
        print(f"    Type {atype} ({aname:22s}): {detected*100:.1f}% detected")

    # Find optimal score threshold (F1-maximising)
    thresholds = np.linspace(0.3, 0.9, 100)
    best_f1, best_thresh = 0, 0.5
    for t in thresholds:
        y_t   = (anom_scores >= t).astype(int)
        p, r, f, _ = precision_recall_fscore_support(y_true, y_t, average="binary",
                                                      zero_division=0)
        if f > best_f1:
            best_f1, best_thresh = f, t
    print(f"\n  Optimal anomaly_score threshold: {best_thresh:.2f}  "
          f"(F1={best_f1:.3f})")

    # Save
    model_path = out_dir / "anomaly_iforest.pkl"
    with open(model_path, "wb") as f:
        pickle.dump(iforest, f)
    print(f"  Model saved => {model_path}  ({model_path.stat().st_size // 1024} KB)")

    scaler_path = out_dir / "anomaly_scaler.pkl"
    with open(scaler_path, "wb") as f:
        pickle.dump(scaler, f)
    print(f"  Scaler saved => {scaler_path}")

    metrics = {
        "detection_auc": round(float(auc),  4),
        "precision":     round(float(prec), 4),
        "recall":        round(float(rec),  4),
        "f1":            round(float(f1),   4),
        "optimal_threshold": round(float(best_thresh), 3),
        "contamination": CONTAMINATION,
    }
    return iforest, scaler, metrics


# ─────────────────────────────────────────────────────────────────────────────
# 4. flag() — importable by the FastAPI service
# ─────────────────────────────────────────────────────────────────────────────
_CACHE: dict = {}


def _load(model_dir: str):
    if model_dir not in _CACHE:
        with open(Path(model_dir) / "anomaly_iforest.pkl", "rb") as f:
            iforest = pickle.load(f)
        with open(Path(model_dir) / "anomaly_scaler.pkl", "rb") as f:
            scaler = pickle.load(f)
        with open(Path(model_dir) / "anomaly_meta.json") as f:
            meta = json.load(f)
        _CACHE[model_dir] = (iforest, scaler, meta)
    return _CACHE[model_dir]


def flag(
    transaction: Dict[str, Any],
    model_dir: str = None,
    threshold: float = None,
) -> Dict:
    """
    Flag a marketplace transaction as anomalous or normal.

    Parameters
    ----------
    transaction : dict with keys (all optional, defaults applied):
        amount_rs              : float   — transaction value in Rs
        quality_grade_reported : int     — 1=A (best), 2=B, 3=C
        time_since_last_txn_h  : float   — hours since same farmer's last txn
        buyer_txn_frequency    : float   — buyer's txn/week (default 5)
        farmer_txn_frequency   : float   — farmer's txn/week (default 3)
        price_per_kg           : float   — price per kg
        quantity_kg            : float   — quantity in this transaction
        quantity_to_avg_ratio  : float   — qty / farmer's typical qty (default 1)
        grade_vs_history       : float   — grade - farmer's modal grade (default 0)
        hour_of_day            : int     — transaction hour 0-23 (default 10)
    threshold : float [0,1] — anomaly score above which to flag (default from meta)
    model_dir : str — directory with model files

    Returns
    -------
    dict:
        is_anomaly      : bool
        anomaly_score   : float [0, 1]  (higher = more suspicious)
        risk_level      : str   (normal/low/medium/high/critical)
        triggered_rules : list[str]  — which anomaly patterns were heuristically matched
        explanation     : str   — plain-English description
        raw_if_score    : float — raw Isolation Forest decision score
    """
    if model_dir is None:
        model_dir = str(Path(__file__).parent / "ml_models")

    iforest, scaler, meta = _load(model_dir)
    threshold = threshold or meta.get("optimal_threshold", 0.60)

    DEFAULTS = {
        "amount_rs":               5000.0,
        "quality_grade_reported":  2,
        "time_since_last_txn_h":   24.0,
        "buyer_txn_frequency":     5.0,
        "farmer_txn_frequency":    3.0,
        "price_per_kg":            30.0,
        "quantity_kg":             100.0,
        "quantity_to_avg_ratio":   1.0,
        "grade_vs_history":        0.0,
        "hour_of_day":             10,
    }

    row    = {f: transaction.get(f, DEFAULTS[f]) for f in FEATURES}
    X      = np.array([[row[f] for f in FEATURES]], dtype=np.float64)
    X_sc   = scaler.transform(X)

    raw_score  = float(iforest.decision_function(X_sc)[0])
    # Normalise using trained score range from meta
    score_min  = meta.get("score_range_min", -0.5)
    score_max  = meta.get("score_range_max",  0.5)
    anom_score = float(np.clip(
        1 - (raw_score - score_min) / max(score_max - score_min, 1e-6),
        0.0, 1.0
    ))

    is_anomaly = bool(anom_score >= threshold)

    # Risk level
    if anom_score >= 0.80:
        risk = "critical"
    elif anom_score >= 0.65:
        risk = "high"
    elif anom_score >= 0.50:
        risk = "medium"
    elif anom_score >= 0.35:
        risk = "low"
    else:
        risk = "normal"

    # Heuristic rule-based triggers (interpretability layer)
    rules = []
    if row["time_since_last_txn_h"] < 0.5:
        rules.append("wash_trading: transaction interval <30 minutes")
    if row["grade_vs_history"] < -1:
        rules.append("grade_inflation: reported grade significantly better than history")
    if row["quantity_to_avg_ratio"] > 4.0:
        rules.append(f"quantity_stuffing: {row['quantity_to_avg_ratio']:.1f}x farmer's normal quantity")
    if row["hour_of_day"] in [1, 2, 3, 4]:
        rules.append(f"off_hours_trading: transaction at {int(row['hour_of_day'])}:00 AM")
    if row["price_per_kg"] > 0:
        # Check if price is >3x a rough district estimate
        typical = meta.get("median_price_per_kg", 35.0)
        if row["price_per_kg"] > 3 * typical:
            rules.append(f"price_spike: Rs{row['price_per_kg']:.0f}/kg "
                         f"is {row['price_per_kg']/typical:.1f}x median")
    if row["amount_rs"] > 500_000:
        rules.append(f"large_transaction: Rs{row['amount_rs']:,.0f} above normal range")

    # Plain-English explanation
    if not is_anomaly and not rules:
        explanation = (
            f"Transaction appears normal (anomaly_score={anom_score:.2f}, "
            f"threshold={threshold:.2f}). No suspicious patterns detected."
        )
    elif rules:
        explanation = (
            f"FLAGGED ({risk.upper()}) — anomaly_score={anom_score:.2f}. "
            f"Suspicious patterns: {'; '.join(rules)}."
        )
    else:
        explanation = (
            f"FLAGGED ({risk.upper()}) — anomaly_score={anom_score:.2f} "
            f"exceeds threshold {threshold:.2f}. Isolation Forest identified "
            f"this transaction as an outlier compared to typical patterns."
        )

    return {
        "is_anomaly":     is_anomaly,
        "anomaly_score":  round(anom_score, 4),
        "risk_level":     risk,
        "triggered_rules": rules,
        "explanation":    explanation,
        "raw_if_score":   round(raw_score, 4),
    }


# ─────────────────────────────────────────────────────────────────────────────
# 5. Entry point
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    out_dir = Path(__file__).parent / "ml_models"
    out_dir.mkdir(parents=True, exist_ok=True)

    print("=" * 65)
    print("STEP 1 -- Generate synthetic transaction dataset (n=5000)")
    print("=" * 65)
    df = generate_dataset(n=5000, anomaly_frac=0.10, seed=42)

    print("\n  Feature statistics (normal vs. anomalous):")
    for feat in ["amount_rs", "price_per_kg", "time_since_last_txn_h",
                 "quantity_to_avg_ratio", "grade_vs_history"]:
        n_mean = df.loc[df["is_anomaly"]==0, feat].mean()
        a_mean = df.loc[df["is_anomaly"]==1, feat].mean()
        print(f"  {FEATURE_LABELS[feat]:35s}  "
              f"normal={n_mean:8.2f}  anomaly={a_mean:8.2f}")

    print("\n" + "=" * 65)
    print("STEP 2 -- Train Isolation Forest (n_estimators=200)")
    print("=" * 65)
    iforest, scaler, metrics = train_model(df, out_dir)

    # Compute score range for normalisation at inference time
    X_sc_all = scaler.transform(df[FEATURES].values)
    raw_all  = iforest.decision_function(X_sc_all)
    score_min, score_max = float(raw_all.min()), float(raw_all.max())

    # Compute median price/kg for heuristic rule
    median_ppkg = float(df.loc[df["is_anomaly"]==0, "price_per_kg"].median())

    # Save metadata
    meta = {
        "features":           FEATURES,
        "feature_labels":     FEATURE_LABELS,
        "anomaly_types":      ANOMALY_TYPES,
        "contamination":      CONTAMINATION,
        "optimal_threshold":  metrics["optimal_threshold"],
        "score_range_min":    round(score_min, 6),
        "score_range_max":    round(score_max, 6),
        "median_price_per_kg": round(median_ppkg, 2),
        "eval_metrics":       metrics,
        "n_samples":          len(df),
        "anomaly_rate":       round(df["is_anomaly"].mean(), 4),
    }
    meta_path = out_dir / "anomaly_meta.json"
    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2)
    print(f"\n  Metadata saved => {meta_path}")

    print("\n" + "=" * 65)
    print("STEP 3 -- Smoke-test flag()")
    print("=" * 65)

    model_dir = str(out_dir)

    test_txns = [
        dict(
            label="Normal transaction (weekday, typical quantity, fair price)",
            txn={"amount_rs": 8500, "quality_grade_reported": 2,
                 "time_since_last_txn_h": 36, "buyer_txn_frequency": 6,
                 "farmer_txn_frequency": 3, "price_per_kg": 38,
                 "quantity_kg": 220, "quantity_to_avg_ratio": 1.1,
                 "grade_vs_history": 0, "hour_of_day": 10},
        ),
        dict(
            label="Wash trading (same pair, <15 min apart)",
            txn={"amount_rs": 12000, "quality_grade_reported": 2,
                 "time_since_last_txn_h": 0.2, "buyer_txn_frequency": 80,
                 "farmer_txn_frequency": 40, "price_per_kg": 35,
                 "quantity_kg": 340, "quantity_to_avg_ratio": 1.3,
                 "grade_vs_history": 0, "hour_of_day": 14},
        ),
        dict(
            label="Grade inflation (reporting A but historically C seller)",
            txn={"amount_rs": 45000, "quality_grade_reported": 1,
                 "time_since_last_txn_h": 48, "buyer_txn_frequency": 5,
                 "farmer_txn_frequency": 2, "price_per_kg": 95,
                 "quantity_kg": 470, "quantity_to_avg_ratio": 1.8,
                 "grade_vs_history": -2, "hour_of_day": 11},
        ),
        dict(
            label="Price spike (8x district median)",
            txn={"amount_rs": 320000, "quality_grade_reported": 1,
                 "time_since_last_txn_h": 72, "buyer_txn_frequency": 2,
                 "farmer_txn_frequency": 1, "price_per_kg": 280,
                 "quantity_kg": 1140, "quantity_to_avg_ratio": 2.1,
                 "grade_vs_history": 0, "hour_of_day": 15},
        ),
        dict(
            label="Quantity stuffing (7x farmer's normal shipment)",
            txn={"amount_rs": 85000, "quality_grade_reported": 2,
                 "time_since_last_txn_h": 24, "buyer_txn_frequency": 8,
                 "farmer_txn_frequency": 3, "price_per_kg": 34,
                 "quantity_kg": 2500, "quantity_to_avg_ratio": 7.2,
                 "grade_vs_history": 0, "hour_of_day": 9},
        ),
        dict(
            label="Off-hours trading (3 AM)",
            txn={"amount_rs": 9000, "quality_grade_reported": 2,
                 "time_since_last_txn_h": 18, "buyer_txn_frequency": 4,
                 "farmer_txn_frequency": 2.5, "price_per_kg": 40,
                 "quantity_kg": 225, "quantity_to_avg_ratio": 1.2,
                 "grade_vs_history": 0, "hour_of_day": 3},
        ),
    ]

    for tc in test_txns:
        result = flag(tc["txn"], model_dir=model_dir)
        sym    = "[FLAGGED]" if result["is_anomaly"] else "[OK]     "
        print(f"\n  {sym} {tc['label']}")
        print(f"    anomaly_score={result['anomaly_score']:.3f}  "
              f"risk={result['risk_level']:8s}  "
              f"raw_IF={result['raw_if_score']:+.4f}")
        if result["triggered_rules"]:
            print(f"    Rules triggered: {'; '.join(result['triggered_rules'])}")

    print("\nDone -- anomaly_iforest.pkl ready for /marketplace/flag endpoint.")
