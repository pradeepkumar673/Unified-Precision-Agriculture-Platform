"""
train_credit_scoring.py
=======================
Farm/Alternative Credit Scoring — Prompt #12

Model: XGBoost binary classifier → loan_repaid (yes/no)
       Post-processed to a 300-900 credit score scale.
       Top-3 contributing factors via SHAP TreeExplainer.

Dataset: 3000 synthetic farmer records with realistic cross-feature correlations.

Feature space
-------------
  crop_plan_adherence    [0, 1]  — fraction of crop-plan actions followed
  yield_score            [0, 1]  — normalised 3-season average yield vs. district median
  yield_consistency      [0, 1]  — 1 - CV of last 3 season yields (lower variance = higher)
  txn_ledger_consistency [0, 1]  — fraction of transactions with matching buyer records
  repayment_history      [0, 1]  — fraction of past loans repaid on time (0 = no history)
  n_loans_taken          int     — total loans taken (history depth)
  loan_size_norm         [0, 1]  — normalised loan size (larger = riskier)
  income_stability       [0, 1]  — proxy for off-farm income regularity
  district_risk_score    [0, 1]  — district-level drought/flood risk (higher = riskier)
  land_holding_ha        float   — land area in hectares

Target: loan_repaid (1=yes, 0=no)

DGP (realistic correlations)
----------------------------
  Repayment probability is driven by:
    + crop_plan_adherence   (main agronomic predictor)
    + repayment_history     (strongest historical signal)
    + yield_score           (profitability)
    + txn_ledger_consistency (financial discipline proxy)
    - loan_size_norm         (larger loans → more risk)
    - district_risk_score    (climate risk → crop failure → default)
    + income_stability       (diversified income reduces default)

Score mapping
-------------
  XGBoost P(repaid) → scaled to [300, 900] via:
    score = 300 + 600 * P(repaid)
  Buckets: 300-499 Poor | 500-599 Fair | 600-699 Good | 700-799 Very Good | 800+ Excellent

Outputs
-------
  backend/ml_models/credit_xgb.pkl          — trained XGBoost model
  backend/ml_models/credit_shap_explainer.pkl — SHAP TreeExplainer
  backend/ml_models/credit_meta.json        — feature list, thresholds, eval metrics
"""

import json
import pickle
import warnings
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd

warnings.filterwarnings("ignore")

# ─────────────────────────────────────────────────────────────────────────────
# 1. Constants
# ─────────────────────────────────────────────────────────────────────────────
FEATURES = [
    "crop_plan_adherence",
    "yield_score",
    "yield_consistency",
    "txn_ledger_consistency",
    "repayment_history",
    "n_loans_taken",
    "loan_size_norm",
    "income_stability",
    "district_risk_score",
    "land_holding_ha",
]

FEATURE_LABELS = {
    "crop_plan_adherence":    "Crop-plan adherence",
    "yield_score":            "Yield performance",
    "yield_consistency":      "Yield consistency",
    "txn_ledger_consistency": "Transaction ledger consistency",
    "repayment_history":      "Past repayment history",
    "n_loans_taken":          "Number of loans taken",
    "loan_size_norm":         "Loan size (relative)",
    "income_stability":       "Income stability",
    "district_risk_score":    "District climate risk",
    "land_holding_ha":        "Land holding (ha)",
}

SCORE_MIN, SCORE_MAX = 300, 900

SCORE_BANDS = [
    (800, "Excellent",   "Very low credit risk. Eligible for highest loan amounts at best rates."),
    (700, "Very Good",   "Low credit risk. Eligible for standard agricultural loan products."),
    (600, "Good",        "Moderate credit risk. May require co-signer or smaller loan tranche."),
    (500, "Fair",        "Elevated risk. Recommend smaller loan with crop insurance requirement."),
    (300, "Poor",        "High credit risk. Consider microfinance or government-backed scheme."),
]


# ─────────────────────────────────────────────────────────────────────────────
# 2. Synthetic dataset generator
# ─────────────────────────────────────────────────────────────────────────────
def generate_dataset(n: int = 3000, seed: int = 42) -> pd.DataFrame:
    """
    Generate 3000 synthetic farmer credit records with realistic correlations.

    Key confounders
    ---------------
    - Farmers with high crop-plan adherence tend to have better yields AND
      better ledger consistency (discipline propagates across dimensions).
    - District risk affects yield_score and increases default probability.
    - Repayment history (strongest signal) correlates with income_stability.
    """
    rng = np.random.RandomState(seed)
    N   = n

    # Exogenous variables
    district_risk_score = rng.beta(2, 4, N)          # most farmers in medium-low risk districts
    land_holding_ha     = rng.lognormal(1.2, 0.8, N).clip(0.5, 50)
    n_loans_taken       = rng.poisson(3.5, N).clip(0, 15).astype(int)
    loan_size_norm      = rng.beta(1.5, 3, N)

    # Latent "farmer discipline" factor — drives adherence, consistency, ledger
    discipline = rng.beta(3, 2, N)                    # skewed toward good farmers

    # Dependent agronomic features
    crop_plan_adherence    = (0.6 * discipline + 0.3 * rng.uniform(0, 1, N)
                              + 0.1 * (1 - district_risk_score)).clip(0, 1)
    yield_score            = (0.5 * crop_plan_adherence
                              + 0.3 * rng.uniform(0, 1, N)
                              - 0.2 * district_risk_score
                              + rng.normal(0, 0.08, N)).clip(0, 1)
    yield_consistency      = (0.6 * discipline + 0.2 * yield_score
                              - 0.1 * district_risk_score
                              + rng.normal(0, 0.06, N)).clip(0, 1)
    txn_ledger_consistency = (0.5 * discipline + 0.3 * rng.uniform(0, 1, N)
                              + rng.normal(0, 0.07, N)).clip(0, 1)

    # Repayment history: depends on discipline + income stability + history depth
    income_stability    = (0.5 * discipline + 0.4 * (land_holding_ha / 50)
                           + rng.normal(0, 0.08, N)).clip(0, 1)
    repayment_history   = np.where(
        n_loans_taken == 0,
        rng.uniform(0.4, 0.6, N),                    # no history → neutral score
        (0.6 * discipline + 0.2 * income_stability
         + 0.1 * (1 - loan_size_norm)
         - 0.1 * district_risk_score
         + rng.normal(0, 0.07, N)).clip(0, 1),
    )

    # Target: loan_repaid — logistic probability model
    log_odds = (
        4.0 * repayment_history
        + 2.5 * crop_plan_adherence
        + 2.0 * yield_score
        + 1.5 * txn_ledger_consistency
        + 1.0 * income_stability
        - 2.5 * loan_size_norm
        - 1.5 * district_risk_score
        - 1.0
        + rng.normal(0, 0.4, N)           # irreducible noise
    )
    prob_repaid = 1 / (1 + np.exp(-log_odds))
    loan_repaid = (rng.uniform(0, 1, N) < prob_repaid).astype(int)

    df = pd.DataFrame({
        "crop_plan_adherence":    np.round(crop_plan_adherence,    4),
        "yield_score":            np.round(yield_score,            4),
        "yield_consistency":      np.round(yield_consistency,      4),
        "txn_ledger_consistency": np.round(txn_ledger_consistency, 4),
        "repayment_history":      np.round(repayment_history,      4),
        "n_loans_taken":          n_loans_taken,
        "loan_size_norm":         np.round(loan_size_norm,         4),
        "income_stability":       np.round(income_stability,       4),
        "district_risk_score":    np.round(district_risk_score,    4),
        "land_holding_ha":        np.round(land_holding_ha,        2),
        "loan_repaid":            loan_repaid,
    })

    repay_rate = df["loan_repaid"].mean()
    print(f"Dataset: {N} records  |  Repayment rate: {repay_rate*100:.1f}%")
    return df


# ─────────────────────────────────────────────────────────────────────────────
# 3. Train XGBoost classifier
# ─────────────────────────────────────────────────────────────────────────────
def train_model(df: pd.DataFrame, out_dir: Path) -> Tuple[Any, Any, dict]:
    import xgboost as xgb
    import shap
    from sklearn.model_selection import train_test_split, cross_val_score
    from sklearn.metrics import (
        roc_auc_score, accuracy_score, classification_report,
        precision_recall_fscore_support,
    )

    X = df[FEATURES].values
    y = df["loan_repaid"].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Class weight for mild imbalance
    pos_rate = y_train.mean()
    scale_pw = (1 - pos_rate) / pos_rate

    model = xgb.XGBClassifier(
        n_estimators=300,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        scale_pos_weight=scale_pw,
        use_label_encoder=False,
        eval_metric="logloss",
        random_state=42,
        device="cpu",
        verbosity=0,
    )

    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        verbose=False,
    )

    # Evaluation
    y_prob = model.predict_proba(X_test)[:, 1]
    y_pred = (y_prob >= 0.5).astype(int)

    auc      = roc_auc_score(y_test, y_prob)
    acc      = accuracy_score(y_test, y_pred)
    prec, rec, f1, _ = precision_recall_fscore_support(y_test, y_pred, average="binary")

    # 5-fold cross-validated AUC
    cv_aucs = cross_val_score(model, X, y, cv=5, scoring="roc_auc")

    print(f"  Test AUC     : {auc:.4f}")
    print(f"  Test Accuracy: {acc*100:.1f}%")
    print(f"  Precision    : {prec:.3f}  Recall: {rec:.3f}  F1: {f1:.3f}")
    print(f"  CV AUC (5-fold): {cv_aucs.mean():.4f} +/- {cv_aucs.std():.4f}")

    # SHAP TreeExplainer (fast, exact for XGBoost)
    explainer = shap.TreeExplainer(model)

    # Save model and explainer
    model_path = out_dir / "credit_xgb.pkl"
    with open(model_path, "wb") as f:
        pickle.dump(model, f)
    print(f"  Model saved => {model_path}  ({model_path.stat().st_size // 1024} KB)")

    expl_path = out_dir / "credit_shap_explainer.pkl"
    with open(expl_path, "wb") as f:
        pickle.dump(explainer, f)
    print(f"  SHAP explainer saved => {expl_path}  ({expl_path.stat().st_size // 1024} KB)")

    # Feature importance via mean |SHAP|
    shap_vals  = explainer.shap_values(X_test)
    mean_shap  = np.abs(shap_vals).mean(axis=0)
    feat_imp   = sorted(zip(FEATURES, mean_shap), key=lambda x: x[1], reverse=True)
    print("\n  Global feature importance (mean |SHAP|):")
    for feat, imp in feat_imp:
        bar = "=" * int(imp / mean_shap.max() * 20)
        print(f"    {FEATURE_LABELS[feat]:35s} {imp:.4f}  {bar}")

    metrics = {
        "test_auc":        round(float(auc),   4),
        "test_accuracy":   round(float(acc),   4),
        "precision":       round(float(prec),  4),
        "recall":          round(float(rec),   4),
        "f1":              round(float(f1),    4),
        "cv_auc_mean":     round(float(cv_aucs.mean()), 4),
        "cv_auc_std":      round(float(cv_aucs.std()),  4),
        "global_feature_importance": [
            {"feature": f, "label": FEATURE_LABELS[f], "mean_shap": round(float(i), 4)}
            for f, i in feat_imp
        ],
    }

    return model, explainer, metrics


# ─────────────────────────────────────────────────────────────────────────────
# 4. score() — importable by the FastAPI service
# ─────────────────────────────────────────────────────────────────────────────
_CACHE: dict = {}


def _load(model_dir: str):
    if model_dir not in _CACHE:
        with open(Path(model_dir) / "credit_xgb.pkl", "rb") as f:
            model = pickle.load(f)
        with open(Path(model_dir) / "credit_shap_explainer.pkl", "rb") as f:
            explainer = pickle.load(f)
        with open(Path(model_dir) / "credit_meta.json") as f:
            meta = json.load(f)
        _CACHE[model_dir] = (model, explainer, meta)
    return _CACHE[model_dir]


def score(
    farmer_features: Dict[str, Any],
    model_dir: str = None,
    top_n_factors: int = 3,
) -> Dict:
    """
    Compute a 300-900 style credit score for a farmer.

    Parameters
    ----------
    farmer_features : dict with any subset of:
        crop_plan_adherence    : float [0, 1]
        yield_score            : float [0, 1]
        yield_consistency      : float [0, 1]
        txn_ledger_consistency : float [0, 1]
        repayment_history      : float [0, 1]  (0.5 if no prior history)
        n_loans_taken          : int   [0, 15]
        loan_size_norm         : float [0, 1]
        income_stability       : float [0, 1]
        district_risk_score    : float [0, 1]
        land_holding_ha        : float [0.5, 50]
    model_dir : str — directory with credit_xgb.pkl etc.
    top_n_factors : int — number of top SHAP contributors to return

    Returns
    -------
    dict:
        credit_score      : int    [300, 900]
        repayment_prob    : float  [0, 1]
        score_band        : str    (Poor/Fair/Good/Very Good/Excellent)
        band_description  : str
        top_factors       : list[dict] (factor, label, direction, shap_value, impact)
        all_shap_values   : dict[str, float]
        recommendation    : str
        missing_features  : list[str]  — features defaulted
    """
    if model_dir is None:
        model_dir = str(Path(__file__).parent / "ml_models")

    model, explainer, meta = _load(model_dir)

    # Defaults for missing features
    DEFAULTS = {
        "crop_plan_adherence":    0.5,
        "yield_score":            0.5,
        "yield_consistency":      0.5,
        "txn_ledger_consistency": 0.5,
        "repayment_history":      0.5,   # neutral — no history
        "n_loans_taken":          0,
        "loan_size_norm":         0.3,
        "income_stability":       0.5,
        "district_risk_score":    0.3,
        "land_holding_ha":        2.0,
    }

    missing = [f for f in FEATURES if f not in farmer_features]
    row = {f: farmer_features.get(f, DEFAULTS[f]) for f in FEATURES}
    X   = np.array([[row[f] for f in FEATURES]], dtype=np.float32)

    # Predict
    prob   = float(model.predict_proba(X)[0, 1])
    credit = int(round(SCORE_MIN + (SCORE_MAX - SCORE_MIN) * prob))
    credit = max(SCORE_MIN, min(SCORE_MAX, credit))

    # Score band
    band, band_desc = "Poor", SCORE_BANDS[-1][2]
    for threshold, name, desc in SCORE_BANDS:
        if credit >= threshold:
            band, band_desc = name, desc
            break

    # SHAP explanation (per-feature contribution)
    import shap as shap_lib
    shap_vals = explainer.shap_values(X)[0]              # shape: (n_features,)

    # Top-N contributors by absolute SHAP value
    shap_dict  = {f: float(shap_vals[i]) for i, f in enumerate(FEATURES)}
    top_feats  = sorted(shap_dict.items(), key=lambda x: abs(x[1]), reverse=True)[:top_n_factors]

    top_factors = []
    for feat, sv in top_feats:
        direction = "positive" if sv > 0 else "negative"
        value     = row[feat]
        if feat == "n_loans_taken":
            value_str = f"{int(value)} loans"
        elif feat == "land_holding_ha":
            value_str = f"{value:.1f} ha"
        else:
            value_str = f"{value*100:.0f}%"

        # Human-readable impact
        if abs(sv) < 0.02:
            impact = "minor"
        elif abs(sv) < 0.05:
            impact = "moderate"
        elif abs(sv) < 0.10:
            impact = "significant"
        else:
            impact = "major"

        top_factors.append({
            "feature":    feat,
            "label":      FEATURE_LABELS[feat],
            "value":      value_str,
            "direction":  direction,
            "shap_value": round(sv, 4),
            "impact":     impact,
            "explanation": (
                f"{FEATURE_LABELS[feat]} ({value_str}) "
                f"{'increases' if sv > 0 else 'decreases'} creditworthiness "
                f"({impact} effect)."
            ),
        })

    # Plain-English recommendation
    pos_factors = [f["label"] for f in top_factors if f["direction"] == "positive"]
    neg_factors = [f["label"] for f in top_factors if f["direction"] == "negative"]

    if pos_factors and neg_factors:
        rec = (
            f"Score {credit} ({band}). "
            f"Strengths: {', '.join(pos_factors)}. "
            f"Risk factors: {', '.join(neg_factors)}. "
            f"Improving loan size or district risk exposure could raise the score."
        )
    elif pos_factors:
        rec = f"Score {credit} ({band}). Strong profile driven by {', '.join(pos_factors)}."
    else:
        rec = (
            f"Score {credit} ({band}). "
            f"Main risks: {', '.join(neg_factors)}. "
            f"Focus on repayment history and crop-plan adherence to improve score."
        )

    return {
        "credit_score":     credit,
        "repayment_prob":   round(prob, 4),
        "score_band":       band,
        "band_description": band_desc,
        "top_factors":      top_factors,
        "all_shap_values":  {f: round(v, 4) for f, v in shap_dict.items()},
        "recommendation":   rec,
        "missing_features": missing,
    }


# ─────────────────────────────────────────────────────────────────────────────
# 5. Entry point
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    out_dir = Path(__file__).parent / "ml_models"
    out_dir.mkdir(parents=True, exist_ok=True)

    print("=" * 65)
    print("STEP 1 -- Generate synthetic farmer credit dataset (n=3000)")
    print("=" * 65)
    df = generate_dataset(n=3000, seed=42)

    print("\n  Feature correlations with loan_repaid:")
    for feat in FEATURES:
        corr = df[feat].corr(df["loan_repaid"])
        bar  = "+" * int(abs(corr) * 20) if corr > 0 else "-" * int(abs(corr) * 20)
        print(f"    {FEATURE_LABELS[feat]:35s}: {corr:+.3f}  {bar}")

    print("\n" + "=" * 65)
    print("STEP 2 -- Train XGBoost classifier")
    print("=" * 65)
    model, explainer, metrics = train_model(df, out_dir)

    # Save metadata
    meta = {
        "features":      FEATURES,
        "feature_labels": FEATURE_LABELS,
        "score_range":   [SCORE_MIN, SCORE_MAX],
        "score_bands":   [
            {"min": t, "name": n, "description": d}
            for t, n, d in SCORE_BANDS
        ],
        "eval_metrics":  metrics,
        "n_samples":     len(df),
        "repayment_rate": round(df["loan_repaid"].mean(), 4),
    }
    meta_path = out_dir / "credit_meta.json"
    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2)
    print(f"\n  Metadata saved => {meta_path}")

    print("\n" + "=" * 65)
    print("STEP 3 -- Smoke-test score()")
    print("=" * 65)

    model_dir = str(out_dir)

    test_cases = [
        dict(
            label="Excellent farmer — high adherence, strong history, low risk",
            features={
                "crop_plan_adherence":    0.92,
                "yield_score":            0.88,
                "yield_consistency":      0.85,
                "txn_ledger_consistency": 0.90,
                "repayment_history":      0.95,
                "n_loans_taken":          5,
                "loan_size_norm":         0.15,
                "income_stability":       0.80,
                "district_risk_score":    0.10,
                "land_holding_ha":        8.0,
            },
        ),
        dict(
            label="Poor farmer — low adherence, no history, large loan, high risk area",
            features={
                "crop_plan_adherence":    0.22,
                "yield_score":            0.30,
                "yield_consistency":      0.25,
                "txn_ledger_consistency": 0.35,
                "repayment_history":      0.20,
                "n_loans_taken":          2,
                "loan_size_norm":         0.85,
                "income_stability":       0.20,
                "district_risk_score":    0.75,
                "land_holding_ha":        1.0,
            },
        ),
        dict(
            label="New farmer — no loan history, average everything",
            features={
                "crop_plan_adherence":    0.60,
                "yield_score":            0.55,
                "txn_ledger_consistency": 0.58,
                "n_loans_taken":          0,
                "loan_size_norm":         0.25,
                "land_holding_ha":        3.0,
            },
        ),
        dict(
            label="Good farmer degraded by large loan ask",
            features={
                "crop_plan_adherence":    0.75,
                "yield_score":            0.70,
                "yield_consistency":      0.68,
                "txn_ledger_consistency": 0.72,
                "repayment_history":      0.80,
                "n_loans_taken":          4,
                "loan_size_norm":         0.90,  # large loan!
                "income_stability":       0.65,
                "district_risk_score":    0.25,
                "land_holding_ha":        5.0,
            },
        ),
    ]

    for tc in test_cases:
        result = score(tc["features"], model_dir=model_dir)
        print(f"\n  [{tc['label']}]")
        print(f"  Credit Score : {result['credit_score']}  [{result['score_band']}]  "
              f"P(repaid)={result['repayment_prob']:.2%}")
        print(f"  Band info    : {result['band_description'][:80]}...")
        if result["missing_features"]:
            print(f"  Defaults used: {result['missing_features']}")
        print(f"  Top-3 factors:")
        for f in result["top_factors"]:
            sym = "(+)" if f["direction"] == "positive" else "(-)"
            print(f"    {sym} {f['label']:35s} = {f['value']:>8s}  "
                  f"SHAP={f['shap_value']:+.4f}  [{f['impact']}]")
        print(f"  Rec: {result['recommendation'][:120]}...")

    print("\nDone -- credit_xgb.pkl + credit_shap_explainer.pkl ready for /credit/score endpoint.")
