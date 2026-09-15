"""
Train AI Product Ranking model (#44) — LightGBM pointwise ranker.

Replaces the price-ascending sort in services/marketplace.py with a real
ML-based product ranking model that considers farm soil type, historical yield,
nutrient deficiency, and climate risk alongside product attributes.

Saves: ml_models/product_ranker_lgbm.pkl
"""
import json
import pickle
from pathlib import Path

import numpy as np
from sklearn.metrics import ndcg_score
from sklearn.model_selection import train_test_split

import lightgbm as lgb

ML_DIR = Path(__file__).parent / "ml_models"
ML_DIR.mkdir(exist_ok=True)

# ──────────────────────────────────────────────────────────────────────────────
# Feature definitions
# ──────────────────────────────────────────────────────────────────────────────
FEATURE_NAMES = [
    "product_price_norm",       # price / max_price (0-1)
    "product_category_code",    # 0=seed, 1=fertilizer, 2=pesticide
    "product_stock_norm",       # stock / max_stock
    "farm_soil_code",           # 0-5 soil type encoding
    "farm_land_size_acres",     # farm size
    "soil_nitrogen_norm",       # recent soil N / 100
    "soil_phosphorus_norm",     # recent soil P / 50
    "soil_potassium_norm",      # recent soil K / 200
    "ndvi_avg",                 # recent NDVI (crop health)
    "yield_history_norm",       # recent yield / expected_yield
    "climate_risk_score",       # drought+heat risk
    "season_match",             # 1 if product suits current season, else 0
]


def generate_synthetic_ranking_data(n_queries: int = 500, items_per_query: int = 10, seed: int = 42):
    """Generate synthetic farm-product interaction data with relevance labels."""
    rng = np.random.RandomState(seed)
    X_all, y_all, qids = [], [], []

    for q in range(n_queries):
        # Simulate a farm context
        soil_code = rng.randint(0, 6)
        land_size = rng.uniform(0.5, 20.0)
        soil_n = rng.uniform(0.1, 0.9)
        soil_p = rng.uniform(0.1, 0.9)
        soil_k = rng.uniform(0.1, 0.9)
        ndvi = rng.uniform(0.2, 0.8)
        yield_hist = rng.uniform(0.5, 1.2)
        climate_risk = rng.uniform(0.1, 0.7)
        current_season = rng.choice([0, 1, 2])

        for _ in range(items_per_query):
            price = rng.uniform(0.05, 1.0)
            category = rng.randint(0, 3)
            stock = rng.uniform(0.1, 1.0)
            season_match = float(rng.random() > 0.3)  # 70% chance of season match

            features = [
                price, category, stock, soil_code, land_size,
                soil_n, soil_p, soil_k, ndvi, yield_hist,
                climate_risk, season_match,
            ]

            # Relevance label (0-4 scale): higher is better
            # Products that match nutrient deficiencies are more relevant
            relevance = 0.0

            # Low N -> fertilizer more relevant
            if category == 1 and soil_n < 0.4:
                relevance += 2.0 * (0.4 - soil_n)
            # Low NDVI -> pesticide more relevant
            if category == 2 and ndvi < 0.4:
                relevance += 2.0 * (0.4 - ndvi)
            # Good season match
            if season_match:
                relevance += 1.0
            # Lower price preferred
            relevance += (1.0 - price) * 0.8
            # Stock availability matters
            relevance += stock * 0.5
            # Climate risk -> pesticide/seeds more relevant
            if climate_risk > 0.4 and category in (0, 2):
                relevance += climate_risk * 0.8

            # Add noise and clip to 0-4 integer
            relevance += rng.normal(0, 0.3)
            relevance = int(np.clip(round(relevance), 0, 4))

            X_all.append(features)
            y_all.append(relevance)
            qids.append(q)

    return np.array(X_all), np.array(y_all), np.array(qids)


def train():
    print("=" * 70)
    print("Training Product Ranking Model (#44)")
    print("=" * 70)

    X, y, qids = generate_synthetic_ranking_data(n_queries=500, items_per_query=10)
    print(f"  Total samples: {len(X)}, Queries: {len(set(qids))}")

    # Split by query groups
    unique_qids = np.unique(qids)
    train_qids, test_qids = train_test_split(unique_qids, test_size=0.2, random_state=42)

    train_mask = np.isin(qids, train_qids)
    test_mask = np.isin(qids, test_qids)

    X_train, y_train = X[train_mask], y[train_mask]
    X_test, y_test = X[test_mask], y[test_mask]
    qids_train = qids[train_mask]
    qids_test = qids[test_mask]

    # Build group sizes for LambdaRank
    train_groups = [int(np.sum(qids_train == q)) for q in np.unique(qids_train)]
    test_groups = [int(np.sum(qids_test == q)) for q in np.unique(qids_test)]

    # Train LightGBM ranker
    train_data = lgb.Dataset(X_train, label=y_train, group=train_groups)
    test_data = lgb.Dataset(X_test, label=y_test, group=test_groups, reference=train_data)

    params = {
        "objective": "lambdarank",
        "metric": "ndcg",
        "ndcg_eval_at": [3, 5],
        "num_leaves": 31,
        "learning_rate": 0.05,
        "n_estimators": 200,
        "min_child_samples": 10,
        "verbose": -1,
    }

    model = lgb.train(
        params, train_data,
        num_boost_round=200,
        valid_sets=[test_data],
    )

    # Evaluate
    y_pred = model.predict(X_test)

    # Compute per-query NDCG
    ndcg_scores = []
    for q in np.unique(qids_test):
        mask = qids_test == q
        if len(set(y_test[mask])) > 1:  # NDCG needs diverse labels
            ndcg_scores.append(ndcg_score([y_test[mask]], [y_pred[mask]], k=5))
    mean_ndcg = np.mean(ndcg_scores) if ndcg_scores else 0.0
    print(f"\n  Mean NDCG@5: {mean_ndcg:.4f}")

    # Save
    path = ML_DIR / "product_ranker_lgbm.pkl"
    with open(path, "wb") as f:
        pickle.dump({
            "model": model,
            "features": FEATURE_NAMES,
            "ndcg_at_5": round(mean_ndcg, 4),
        }, f)
    print(f"  Saved: {path} ({path.stat().st_size / 1024:.0f} KB)")

    meta_path = ML_DIR / "product_ranker_meta.json"
    with open(meta_path, "w") as f:
        json.dump({
            "features": FEATURE_NAMES,
            "ndcg_at_5": round(mean_ndcg, 4),
            "n_queries_train": len(train_qids),
            "n_queries_test": len(test_qids),
        }, f, indent=2)

    print(f"\n✅ Product ranker trained! NDCG@5: {mean_ndcg:.4f}")
    return model


# ──────────────────────────────────────────────────────────────────────────────
# Predict function — imported by services/marketplace.py
# ──────────────────────────────────────────────────────────────────────────────
_RANKER_CACHE = {}


def rank_score(product_features: dict, farm_features: dict) -> float:
    """Score a single product for a farm. Higher = more relevant."""
    if "model" not in _RANKER_CACHE:
        with open(ML_DIR / "product_ranker_lgbm.pkl", "rb") as f:
            _RANKER_CACHE["model"] = pickle.load(f)

    model = _RANKER_CACHE["model"]["model"]

    soil_codes = {"black": 0, "red": 1, "clay": 2, "loam": 3, "sandy": 4, "silt": 5}

    X = np.array([[
        product_features.get("price_norm", 0.5),
        product_features.get("category_code", 1),
        product_features.get("stock_norm", 0.5),
        soil_codes.get(farm_features.get("soil_type", "loam"), 3),
        farm_features.get("land_size_acres", 5.0),
        farm_features.get("soil_n_norm", 0.5),
        farm_features.get("soil_p_norm", 0.5),
        farm_features.get("soil_k_norm", 0.5),
        farm_features.get("ndvi_avg", 0.5),
        farm_features.get("yield_history_norm", 0.8),
        farm_features.get("climate_risk_score", 0.3),
        product_features.get("season_match", 1.0),
    ]])

    return float(model.predict(X)[0])


if __name__ == "__main__":
    train()
