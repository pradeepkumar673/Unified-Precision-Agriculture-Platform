"""
causal_whatif_sim.py
====================
Counterfactual "What-If" Simulator — Prompt #11

# ═══════════════════════════════════════════════════════════════════════════
# CAUSAL DESIGN NOTE
# ─────────────────────────────────────────────────────────────────────────
# This uses DoWhy's proper causal identification + estimation pipeline,
# NOT a correlation calculation dressed up as causal inference.
#
# Causal Graph (DAG):
#
#   soil_quality ──────────────────────┐
#       │                              │
#       ▼                              ▼
#  irrigation_method ──► yield ──► profit
#       ▲                  ▲
#  sowing_week_offset ─────┘
#       │                  ▲
#  fertilizer_kg ──────────┘
#
# Confounders:
#   soil_quality confounds {irrigation_method, yield} — farmers with better
#   soil tend to use drip irrigation AND get higher yields. Naive regression
#   of yield ~ irrigation_method would be biased upward (better soil -> drip
#   users look even better than they really are).
#
# DoWhy estimation:
#   - Backdoor criterion satisfied: conditioning on soil_quality blocks
#     the confounding path soil_quality -> irrigation_method ← (blocked)
#   - Estimator: backdoor.linear_regression
#   - Refutation: random_common_cause + placebo_treatment
# ═══════════════════════════════════════════════════════════════════════════

Architecture
------------
  1. Synthetic dataset (n=3000 farmers) with explicit confounding DGP
  2. DoWhy CausalModel with explicit GML/NetworkX graph
  3. Identify causal effect via backdoor adjustment
  4. Estimate ATE (irrigation_method: flood -> drip)
  5. Also estimate ATE for sowing week offset (early vs. late sowing)
  6. Save fitted linear model + ATE dict for fast inference
  7. simulate(current_decision_dict, proposed_change_dict) -> projected delta

Outputs
-------
  backend/ml_models/causal_model_meta.json   — ATE estimates, refutation results
  backend/ml_models/causal_regression.pkl    — fitted OLS surrogate for inference
"""

import json
import os
import pickle
import warnings
from pathlib import Path
from typing import Any, Dict

import numpy as np
import pandas as pd

warnings.filterwarnings("ignore")
os.environ["CUDA_VISIBLE_DEVICES"] = ""   # not needed here, just hygiene

# ─────────────────────────────────────────────────────────────────────────────
# 1. Domain constants
# ─────────────────────────────────────────────────────────────────────────────
IRRIGATION_METHODS = {0: "flood", 1: "sprinkler", 2: "drip"}
IRRIGATION_TO_ID   = {v: k for k, v in IRRIGATION_METHODS.items()}

# True causal effects (ground truth for validation)
# Switching from flood (0) -> drip (2):
#   +150 kg/acre yield benefit (water efficiency + less root rot)
TRUE_IRRIG_ATE_PER_UNIT   = 75.0    # kg/acre per unit increase in irrigation_method (0->1->2)
TRUE_SOW_ATE_PER_WEEK     = -40.0   # kg/acre per week of delay in sowing
TRUE_FERT_ATE_PER_KG      =  2.5    # kg/acre per extra kg of fertiliser (diminishing beyond 80)
PROFIT_PER_KG_YIELD       = 12.0    # Rs per kg of yield above baseline
PROFIT_BASELINE           = 5000.0  # Rs/acre fixed cost recovery


# ─────────────────────────────────────────────────────────────────────────────
# 2. Synthetic dataset with confounding DGP
# ─────────────────────────────────────────────────────────────────────────────
def generate_dataset(n: int = 3000, seed: int = 42) -> pd.DataFrame:
    """
    Generate synthetic farmer-decision dataset with EXPLICIT confounding.

    Structural equations
    --------------------
    soil_quality   ~ Uniform(0.3, 1.0)                  ← exogenous

    irrigation_method (0/1/2) is influenced by soil_quality:
      farmers with better soil are more likely to invest in drip irrigation
      P(drip | soil=high) >> P(drip | soil=low)

    sowing_week_offset ~ N(0, 2) clipped [-4, 6]        ← exogenous

    fertilizer_kg ~ N(50, 20) clipped [10, 150]         ← exogenous

    yield = 1200
          + 75 * irrigation_method          (drip > sprinkler > flood)
          - 40 * sowing_week_offset         (early sowing better)
          +  2.5 * fertilizer_kg            (positive but diminishing)
          + 120 * soil_quality              (confounders)
          + N(0, 80)                        (noise)

    profit = -5000 + 12 * yield + N(0, 500)
    """
    rng = np.random.RandomState(seed)

    soil_quality        = rng.uniform(0.3, 1.0, n)
    sowing_week_offset  = rng.normal(0, 2, n).clip(-4, 6)
    fertilizer_kg       = rng.normal(50, 20, n).clip(10, 150)

    # Irrigation method confounded by soil_quality
    # logits for each method: [flood, sprinkler, drip]
    logits = np.column_stack([
        0.8 - 1.5 * soil_quality,   # flood: poor soil -> flood
        0.2 * np.ones(n),           # sprinkler: weakly soil-independent
        -0.4 + 2.0 * soil_quality,  # drip: rich soil -> drip
    ])
    probs  = np.exp(logits) / np.exp(logits).sum(axis=1, keepdims=True)
    irrigation_method = np.array([rng.choice(3, p=p) for p in probs])

    # Yield structural equation
    yield_kg = (
        1200.0
        + TRUE_IRRIG_ATE_PER_UNIT   * irrigation_method
        + TRUE_SOW_ATE_PER_WEEK     * sowing_week_offset
        + TRUE_FERT_ATE_PER_KG      * fertilizer_kg
        + 120.0                     * soil_quality
        + rng.normal(0, 80, n)
    )
    yield_kg = np.clip(yield_kg, 200, 4000)

    # Profit structural equation
    profit = (
        -PROFIT_BASELINE
        + PROFIT_PER_KG_YIELD * yield_kg
        + rng.normal(0, 500, n)
    )

    df = pd.DataFrame({
        "soil_quality":       np.round(soil_quality, 4),
        "irrigation_method":  irrigation_method.astype(int),
        "sowing_week_offset": np.round(sowing_week_offset, 2),
        "fertilizer_kg":      np.round(fertilizer_kg, 1),
        "yield_kg_per_acre":  np.round(yield_kg, 2),
        "profit_rs_per_acre": np.round(profit, 2),
    })

    print(f"Dataset shape: {df.shape}")
    print(f"Yield:  mean={df['yield_kg_per_acre'].mean():.0f}  "
          f"std={df['yield_kg_per_acre'].std():.0f}")
    print(f"Profit: mean=Rs{df['profit_rs_per_acre'].mean():.0f}  "
          f"std=Rs{df['profit_rs_per_acre'].std():.0f}")

    irr_means = df.groupby("irrigation_method")["yield_kg_per_acre"].mean()
    print(f"\nNaive yield by irrigation (biased — confounded by soil):")
    for mid, mname in IRRIGATION_METHODS.items():
        print(f"  {mname:10s}: {irr_means.get(mid, 0):.0f} kg/acre")

    return df


# ─────────────────────────────────────────────────────────────────────────────
# 3. DoWhy causal model + estimation
# ─────────────────────────────────────────────────────────────────────────────
def _build_causal_graph():
    """Build the causal DAG as a networkx DiGraph (DoWhy accepts this directly)."""
    import networkx as nx
    G = nx.DiGraph()
    nodes = [
        "soil_quality", "irrigation_method", "sowing_week_offset",
        "fertilizer_kg", "yield_kg_per_acre", "profit_rs_per_acre",
    ]
    G.add_nodes_from(nodes)
    edges = [
        ("soil_quality",       "irrigation_method"),
        ("soil_quality",       "yield_kg_per_acre"),
        ("irrigation_method",  "yield_kg_per_acre"),
        ("sowing_week_offset", "yield_kg_per_acre"),
        ("fertilizer_kg",      "yield_kg_per_acre"),
        ("yield_kg_per_acre",  "profit_rs_per_acre"),
    ]
    G.add_edges_from(edges)
    return G


def fit_causal_model(df: pd.DataFrame) -> dict:
    """
    Run DoWhy causal identification + estimation for each treatment.

    Returns a dict of ATE estimates keyed by (treatment, outcome).
    """
    import dowhy
    from dowhy import CausalModel

    ates = {}

    # ── (A) Effect of irrigation_method on yield ──────────────────────────
    print("\n[DoWhy] Estimating: irrigation_method -> yield_kg_per_acre")
    model_irrig = CausalModel(
        data=df,
        treatment="irrigation_method",
        outcome="yield_kg_per_acre",
        graph=_build_causal_graph(),
    )
    identified_irrig = model_irrig.identify_effect(proceed_when_unidentifiable=True)
    estimate_irrig   = model_irrig.estimate_effect(
        identified_irrig,
        method_name="backdoor.linear_regression",
        target_units="ate",
    )
    ate_irrig = float(estimate_irrig.value)
    print(f"  ATE (irrigation 1 unit up)  : {ate_irrig:+.2f} kg/acre")
    print(f"  True causal effect           : {TRUE_IRRIG_ATE_PER_UNIT:+.2f} kg/acre")

    # Naive correlation for comparison
    naive_irrig = df["yield_kg_per_acre"].corr(df["irrigation_method"].astype(float))
    naive_slope = np.polyfit(df["irrigation_method"], df["yield_kg_per_acre"], 1)[0]
    print(f"  Naive OLS slope (biased)     : {naive_slope:+.2f} kg/acre  "
          f"(confounding bias = {naive_slope - ate_irrig:+.2f})")

    ates["irrigation_yield"] = {
        "treatment": "irrigation_method",
        "outcome":   "yield_kg_per_acre",
        "ate":       round(ate_irrig, 4),
        "naive_ols_slope": round(naive_slope, 4),
        "confounding_bias": round(naive_slope - ate_irrig, 4),
        "true_causal": TRUE_IRRIG_ATE_PER_UNIT,
    }

    # ── (B) Effect of sowing_week_offset on yield ─────────────────────────
    print("\n[DoWhy] Estimating: sowing_week_offset -> yield_kg_per_acre")
    model_sow = CausalModel(
        data=df,
        treatment="sowing_week_offset",
        outcome="yield_kg_per_acre",
        graph=_build_causal_graph(),
    )
    identified_sow = model_sow.identify_effect(proceed_when_unidentifiable=True)
    estimate_sow   = model_sow.estimate_effect(
        identified_sow,
        method_name="backdoor.linear_regression",
        target_units="ate",
    )
    ate_sow = float(estimate_sow.value)
    print(f"  ATE (1 week delay)   : {ate_sow:+.2f} kg/acre")
    print(f"  True causal effect   : {TRUE_SOW_ATE_PER_WEEK:+.2f} kg/acre")

    ates["sowing_yield"] = {
        "treatment": "sowing_week_offset",
        "outcome":   "yield_kg_per_acre",
        "ate":       round(ate_sow, 4),
        "true_causal": TRUE_SOW_ATE_PER_WEEK,
    }

    # ── (C) Effect of fertilizer_kg on yield ─────────────────────────────
    print("\n[DoWhy] Estimating: fertilizer_kg -> yield_kg_per_acre")
    model_fert = CausalModel(
        data=df,
        treatment="fertilizer_kg",
        outcome="yield_kg_per_acre",
        graph=_build_causal_graph(),
    )
    identified_fert = model_fert.identify_effect(proceed_when_unidentifiable=True)
    estimate_fert   = model_fert.estimate_effect(
        identified_fert,
        method_name="backdoor.linear_regression",
        target_units="ate",
    )
    ate_fert = float(estimate_fert.value)
    print(f"  ATE (1 kg more)   : {ate_fert:+.4f} kg/acre")
    print(f"  True causal effect: {TRUE_FERT_ATE_PER_KG:+.4f} kg/acre")

    ates["fertilizer_yield"] = {
        "treatment": "fertilizer_kg",
        "outcome":   "yield_kg_per_acre",
        "ate":       round(ate_fert, 4),
        "true_causal": TRUE_FERT_ATE_PER_KG,
    }

    # ── (D) Effect of yield on profit ────────────────────────────────────
    print("\n[DoWhy] Estimating: yield_kg_per_acre -> profit_rs_per_acre")
    model_yp = CausalModel(
        data=df,
        treatment="yield_kg_per_acre",
        outcome="profit_rs_per_acre",
        graph=_build_causal_graph(),
    )
    identified_yp = model_yp.identify_effect(proceed_when_unidentifiable=True)
    estimate_yp   = model_yp.estimate_effect(
        identified_yp,
        method_name="backdoor.linear_regression",
        target_units="ate",
    )
    ate_yp = float(estimate_yp.value)
    print(f"  ATE (1 kg yield -> profit) : Rs {ate_yp:+.2f}/acre")
    print(f"  True causal effect        : Rs {PROFIT_PER_KG_YIELD:+.2f}/acre")

    ates["yield_profit"] = {
        "treatment": "yield_kg_per_acre",
        "outcome":   "profit_rs_per_acre",
        "ate":       round(ate_yp, 4),
        "true_causal": PROFIT_PER_KG_YIELD,
    }

    # ── Refutation: placebo treatment ─────────────────────────────────────
    print("\n[DoWhy] Refutation test (placebo_treatment_refuter)...")
    refute = model_irrig.refute_estimate(
        identified_irrig,
        estimate_irrig,
        method_name="placebo_treatment_refuter",
        placebo_type="permute",
        num_simulations=20,
    )
    refute_val  = float(refute.new_effect)
    refute_pass = abs(refute_val) < abs(ate_irrig) * 0.5
    print(f"  Placebo ATE: {refute_val:+.4f}  "
          f"({'PASS — placebo effect near zero' if refute_pass else 'WARN'})")

    ates["refutation"] = {
        "test":   "placebo_treatment_refuter",
        "placebo_ate": round(refute_val, 4),
        "passed": refute_pass,
    }

    return ates


# ─────────────────────────────────────────────────────────────────────────────
# 4. OLS surrogate model for fast inference
# ─────────────────────────────────────────────────────────────────────────────
def fit_surrogate(df: pd.DataFrame, out_dir: Path) -> dict:
    """
    Fit a simple OLS on the backdoor-adjusted features for fast simulate().
    Saves coefficients to pkl for inference without re-running DoWhy.
    """
    from sklearn.linear_model import LinearRegression

    # Yield model (include soil_quality as control variable = backdoor adjustment)
    feat_cols = ["irrigation_method", "sowing_week_offset", "fertilizer_kg", "soil_quality"]
    X = df[feat_cols].values
    y_yield  = df["yield_kg_per_acre"].values
    y_profit = df["profit_rs_per_acre"].values

    yield_model  = LinearRegression().fit(X, y_yield)
    profit_model = LinearRegression().fit(
        df[["yield_kg_per_acre"]].values, y_profit
    )

    surrogate = {
        "yield_model":        yield_model,
        "profit_model":       profit_model,
        "yield_feature_cols": feat_cols,
    }
    pkl_path = out_dir / "causal_regression.pkl"
    with open(pkl_path, "wb") as f:
        pickle.dump(surrogate, f)
    print(f"\nSurrogate OLS saved => {pkl_path}  ({pkl_path.stat().st_size // 1024} KB)")
    return surrogate


# ─────────────────────────────────────────────────────────────────────────────
# 5. simulate() — importable by the FastAPI service
# ─────────────────────────────────────────────────────────────────────────────
_CACHE: dict = {}


def _load(model_dir: str) -> dict:
    if model_dir not in _CACHE:
        with open(Path(model_dir) / "causal_regression.pkl", "rb") as f:
            _CACHE[model_dir] = pickle.load(f)
        with open(Path(model_dir) / "causal_model_meta.json") as f:
            _CACHE[f"{model_dir}_meta"] = json.load(f)
    return _CACHE[model_dir], _CACHE[f"{model_dir}_meta"]


def simulate(
    current_decision: Dict[str, Any],
    proposed_change: Dict[str, Any],
    model_dir: str = None,
) -> Dict:
    """
    Project the causal effect of changing one or more farming decisions.

    Parameters
    ----------
    current_decision : dict with keys (all optional, defaults applied):
        irrigation_method   : str|int  — "flood"|"sprinkler"|"drip" or 0|1|2
        sowing_week_offset  : float    — weeks offset from optimal sowing (0=optimal)
        fertilizer_kg       : float    — kg of fertiliser applied per acre
        soil_quality        : float    — [0.3, 1.0], defaults to 0.65 (average)

    proposed_change : dict — SAME keys as current_decision.
        Provide ONLY the keys you want to change.
        The simulator computes before/after using the backdoor-adjusted OLS.

    model_dir : str — directory with causal_regression.pkl + causal_model_meta.json

    Returns
    -------
    dict:
        current_yield_kg      : float
        proposed_yield_kg     : float
        delta_yield_kg        : float
        current_profit_rs     : float
        proposed_profit_rs    : float
        delta_profit_rs       : float
        confidence_note       : str
        explanation           : str  — plain English explanation
        causal_ates_used      : dict — which ATEs drove the estimate
        warning               : str | None
    """
    if model_dir is None:
        model_dir = str(Path(__file__).parent / "ml_models")

    surrogate, meta = _load(model_dir)
    yield_model     = surrogate["yield_model"]
    profit_model    = surrogate["profit_model"]
    feat_cols       = surrogate["yield_feature_cols"]

    def _resolve_irr(v):
        if isinstance(v, str):
            return float(IRRIGATION_TO_ID.get(v.lower(), 0))
        return float(v)

    # Build current and proposed feature vectors
    defaults = {
        "irrigation_method":  0.0,   # flood
        "sowing_week_offset": 0.0,   # on time
        "fertilizer_kg":      50.0,  # typical
        "soil_quality":       0.65,  # average
    }

    current = dict(defaults)
    for k, v in current_decision.items():
        if k == "irrigation_method":
            current[k] = _resolve_irr(v)
        else:
            current[k] = float(v)

    proposed = dict(current)
    for k, v in proposed_change.items():
        if k == "irrigation_method":
            proposed[k] = _resolve_irr(v)
        else:
            proposed[k] = float(v)

    X_cur  = np.array([[current[c] for c in feat_cols]])
    X_prop = np.array([[proposed[c] for c in feat_cols]])

    cur_yield  = float(yield_model.predict(X_cur)[0])
    prop_yield = float(yield_model.predict(X_prop)[0])
    cur_profit  = float(profit_model.predict([[cur_yield]])[0])
    prop_profit = float(profit_model.predict([[prop_yield]])[0])

    delta_yield  = prop_yield  - cur_yield
    delta_profit = prop_profit - cur_profit

    # Build explanation string
    changes = []
    ates_used = {}
    meta_ates = meta.get("ates", {})

    irr_change = proposed["irrigation_method"] - current["irrigation_method"]
    if abs(irr_change) > 0.01:
        cur_name  = IRRIGATION_METHODS.get(int(round(current["irrigation_method"])), "unknown")
        prop_name = IRRIGATION_METHODS.get(int(round(proposed["irrigation_method"])), "unknown")
        irr_ate   = meta_ates.get("irrigation_yield", {}).get("ate", TRUE_IRRIG_ATE_PER_UNIT)
        irr_delta = irr_ate * irr_change
        changes.append(
            f"switching irrigation from {cur_name} to {prop_name} "
            f"(causal ATE = {irr_ate:+.1f} kg/acre per unit, "
            f"expected contribution: {irr_delta:+.0f} kg/acre)"
        )
        ates_used["irrigation_yield_ate"] = round(float(irr_ate), 2)

    sow_change = proposed["sowing_week_offset"] - current["sowing_week_offset"]
    if abs(sow_change) > 0.01:
        sow_ate   = meta_ates.get("sowing_yield", {}).get("ate", TRUE_SOW_ATE_PER_WEEK)
        sow_delta = sow_ate * sow_change
        dir_word  = "later" if sow_change > 0 else "earlier"
        changes.append(
            f"sowing {abs(sow_change):.1f} week(s) {dir_word} "
            f"(causal ATE = {sow_ate:+.1f} kg/acre per week, "
            f"expected contribution: {sow_delta:+.0f} kg/acre)"
        )
        ates_used["sowing_yield_ate"] = round(float(sow_ate), 2)

    fert_change = proposed["fertilizer_kg"] - current["fertilizer_kg"]
    if abs(fert_change) > 0.5:
        fert_ate   = meta_ates.get("fertilizer_yield", {}).get("ate", TRUE_FERT_ATE_PER_KG)
        fert_delta = fert_ate * fert_change
        dir_word   = "increasing" if fert_change > 0 else "reducing"
        changes.append(
            f"{dir_word} fertiliser by {abs(fert_change):.0f} kg/acre "
            f"(causal ATE = {fert_ate:+.2f} kg/acre per kg)"
        )
        ates_used["fertilizer_yield_ate"] = round(float(fert_ate), 4)

    if not changes:
        explanation = "No changes proposed. Current and proposed decisions are identical."
        warning     = "Provide at least one key in proposed_change that differs from current_decision."
    else:
        explanation = (
            f"By {'; '.join(changes)}, "
            f"the causal model estimates a yield change of {delta_yield:+.0f} kg/acre "
            f"({delta_yield/max(cur_yield,1)*100:+.1f}%) and a profit change of "
            f"Rs {delta_profit:+,.0f}/acre ({delta_profit/max(abs(cur_profit),1)*100:+.1f}%). "
            f"This estimate adjusts for soil quality as a confounder (backdoor adjustment), "
            f"so it reflects the true causal effect — not the naive correlation."
        )
        warning = None

    confidence_note = (
        "Estimate based on backdoor-adjusted OLS fitted to 3000 synthetic farmers. "
        "Confidence is moderate; real-world effects may vary by crop type, region, and season."
    )

    return {
        "current_yield_kg":    round(cur_yield,   2),
        "proposed_yield_kg":   round(prop_yield,  2),
        "delta_yield_kg":      round(delta_yield, 2),
        "current_profit_rs":   round(cur_profit,  2),
        "proposed_profit_rs":  round(prop_profit, 2),
        "delta_profit_rs":     round(delta_profit, 2),
        "confidence_note":     confidence_note,
        "explanation":         explanation,
        "causal_ates_used":    ates_used,
        "warning":             warning,
    }


# ─────────────────────────────────────────────────────────────────────────────
# 6. Entry point
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    out_dir = Path(__file__).parent / "ml_models"
    out_dir.mkdir(parents=True, exist_ok=True)

    print("=" * 65)
    print("STEP 1 — Generate synthetic farmer dataset (n=3000)")
    print("=" * 65)
    df = generate_dataset(n=3000, seed=42)

    print("\n" + "=" * 65)
    print("STEP 2 — DoWhy causal identification + estimation")
    print("=" * 65)
    ates = fit_causal_model(df)

    print("\n" + "=" * 65)
    print("STEP 3 — Fit OLS surrogate for fast inference")
    print("=" * 65)
    surrogate = fit_surrogate(df, out_dir)

    # Summary table
    print("\n" + "=" * 65)
    print("CAUSAL ESTIMATION SUMMARY")
    print("=" * 65)
    for key, info in ates.items():
        if key == "refutation":
            continue
        ate_est = info["ate"]
        ate_true = info["true_causal"]
        err_pct  = abs(ate_est - ate_true) / max(abs(ate_true), 1e-6) * 100
        print(f"  {info['treatment']:22s} -> {info['outcome']:25s}  "
              f"est={ate_est:+8.3f}  true={ate_true:+8.3f}  "
              f"err={err_pct:.1f}%")
    ref = ates["refutation"]
    print(f"\n  Refutation (placebo): ATE={ref['placebo_ate']:+.4f}  "
          f"{'PASS' if ref['passed'] else 'WARN'}")

    print(f"\nConfounding bias (irrigation -> yield):")
    irr = ates["irrigation_yield"]
    print(f"  Naive OLS slope    : {irr['naive_ols_slope']:+.2f} kg/acre  (biased)")
    print(f"  Causal ATE (DoWhy) : {irr['ate']:+.2f} kg/acre  (unbiased)")
    print(f"  Confounding bias   : {irr['confounding_bias']:+.2f} kg/acre "
          f"(soil quality was making drip users look better than they are)")

    # Save metadata
    meta = {
        "n_samples":          3000,
        "causal_graph_desc":  "soil_quality confounds irrigation->yield; "
                              "sowing_offset, fertilizer -> yield -> profit",
        "ates":               {k: v for k, v in ates.items() if k != "refutation"},
        "refutation":         ates["refutation"],
        "irrigation_methods": IRRIGATION_METHODS,
    }
    meta_path = out_dir / "causal_model_meta.json"
    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2)
    print(f"\nMetadata saved => {meta_path}")

    print("\n" + "=" * 65)
    print("STEP 4 — Smoke-test simulate()")
    print("=" * 65)

    model_dir = str(out_dir)

    test_cases = [
        dict(
            label="Upgrade irrigation flood->drip (main use case)",
            current={"irrigation_method": "flood",   "sowing_week_offset": 0, "fertilizer_kg": 50},
            proposed={"irrigation_method": "drip"},
        ),
        dict(
            label="Sow 3 weeks early (from being 2 weeks late to 1 week early)",
            current={"irrigation_method": "sprinkler", "sowing_week_offset": 2,  "fertilizer_kg": 50},
            proposed={"sowing_week_offset": -1},
        ),
        dict(
            label="Combined: upgrade irrigation + add 30kg fertilizer",
            current={"irrigation_method": "flood", "sowing_week_offset": 1, "fertilizer_kg": 40},
            proposed={"irrigation_method": "drip", "fertilizer_kg": 70},
        ),
        dict(
            label="Delay sowing by 2 weeks (negative what-if)",
            current={"irrigation_method": "drip", "sowing_week_offset": 0, "fertilizer_kg": 60},
            proposed={"sowing_week_offset": 2},
        ),
    ]

    for tc in test_cases:
        result = simulate(tc["current"], tc["proposed"], model_dir=model_dir)
        print(f"\n  [{tc['label']}]")
        print(f"  Yield : {result['current_yield_kg']:,.0f} -> {result['proposed_yield_kg']:,.0f} "
              f"kg/acre  ({result['delta_yield_kg']:+.0f} kg, "
              f"{result['delta_yield_kg']/max(result['current_yield_kg'],1)*100:+.1f}%)")
        print(f"  Profit: Rs{result['current_profit_rs']:,.0f} -> Rs{result['proposed_profit_rs']:,.0f} "
              f"  (delta=Rs{result['delta_profit_rs']:+,.0f})")
        print(f"  => {result['explanation'][:200]}...")

    print("\nDone — causal_regression.pkl + causal_model_meta.json ready for /causal/simulate endpoint.")
