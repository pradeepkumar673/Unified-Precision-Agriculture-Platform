"""
train_variety_recommender.py
============================
Variety Recommendation Engine — Prompt #7

Architecture: Hybrid recommender
---------------------------------
  1. Collaborative Filtering (warm start — known farmer)
     ALS (Alternating Least Squares) via the `implicit` library.
     Trained on a 500-farmer × 30-variety sparse interaction matrix where
     each entry is a "success score" (0 = never tried / failed, 1-5 = tried
     and succeeded at increasing yield). ALS learns latent farmer and variety
     embeddings that capture "farmers like you also succeeded with variety X".

  2. Content-based Cosine Similarity (cold start — new farmer / no history)
     Each variety is described by a 6-dimensional feature vector:
       [soil_pref_encoded, min_rainfall, max_rainfall, temp_min, temp_max, Kc_yield]
     A new farmer's field conditions are mapped into the same space and the
     cosine similarity ranks varieties best matching their inputs.

  3. recommend(farmer_id_or_features) dispatch logic:
     - If farmer_id (int) is provided → ALS collaborative filtering
     - If features_dict is provided  → content-based cosine similarity fallback
     - If both provided             → weighted blend (0.7 ALS + 0.3 content)

Outputs
-------
  backend/ml_models/variety_als_model.pkl      — trained implicit ALS model
  backend/ml_models/variety_content.pkl        — variety feature matrix + metadata
  backend/ml_models/variety_meta.json          — variety names, ids, descriptions
"""

import json
import pickle
import warnings
from pathlib import Path
from typing import Dict, List, Optional, Union

import numpy as np
import scipy.sparse as sp
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import MinMaxScaler

warnings.filterwarnings("ignore")

# ─────────────────────────────────────────────────────────────────────────────
# 1. Variety catalogue (30 Indian crop varieties)
# ─────────────────────────────────────────────────────────────────────────────
# Each variety: (name, crop, soil_code, rain_lo, rain_hi, temp_lo, temp_hi, base_yield_q)
# soil_code: 0=sandy 1=loamy 2=clayey 3=black 4=red 5=alluvial
VARIETIES = [
    # Wheat
    ( 0, "HD-2967",     "wheat",    5, 300, 650, 12, 22, 45),
    ( 1, "PBW-343",     "wheat",    5, 350, 600, 14, 22, 42),
    ( 2, "GW-496",      "wheat",    1, 280, 580, 12, 20, 40),
    # Rice
    ( 3, "IR-36",       "rice",     2, 900,1600, 24, 34, 55),
    ( 4, "Swarna",      "rice",     5, 800,1500, 26, 34, 52),
    ( 5, "BPT-5204",    "rice",     2, 850,1400, 25, 33, 50),
    ( 6, "Pusa-44",     "rice",     5, 900,1600, 26, 36, 58),
    # Cotton
    ( 7, "MCU-5",       "cotton",   1, 500, 800, 22, 35, 18),
    ( 8, "Bt-JKCH-1947","cotton",   3, 450, 750, 24, 36, 20),
    ( 9, "NHH-44",      "cotton",   3, 480, 760, 23, 35, 19),
    # Maize
    (10, "DHM-117",     "maize",    1, 500, 900, 18, 30, 38),
    (11, "PEHM-2",      "maize",    1, 550, 850, 20, 32, 35),
    (12, "Ganga-11",    "maize",    0, 480, 800, 18, 30, 33),
    # Soybean
    (13, "JS-335",      "soybean",  3, 600, 900, 22, 30, 22),
    (14, "NRC-7",       "soybean",  1, 550, 850, 20, 30, 20),
    (15, "MACS-450",    "soybean",  3, 580, 880, 21, 29, 21),
    # Chickpea
    (16, "JG-11",       "chickpea", 1, 200, 500, 12, 22, 18),
    (17, "ICCC-37",     "chickpea", 4, 180, 480, 14, 24, 16),
    (18, "KAK-2",       "chickpea", 1, 220, 520, 12, 22, 17),
    # Groundnut
    (19, "TAG-24",      "groundnut",0, 450, 750, 24, 34, 25),
    (20, "GG-20",       "groundnut",4, 400, 700, 22, 32, 23),
    (21, "TG-37A",      "groundnut",0, 420, 720, 23, 33, 24),
    # Mustard
    (22, "Pusa-Bold",   "mustard",  1, 200, 450,  8, 20, 12),
    (23, "Varuna",      "mustard",  5, 220, 440,  8, 20, 11),
    (24, "Kranti",      "mustard",  1, 200, 420, 10, 22, 12),
    # Sugarcane
    (25, "Co-0238",     "sugarcane",5, 900,1500, 24, 34,380),
    (26, "CoJ-64",      "sugarcane",5, 850,1400, 22, 32,360),
    # Tomato
    (27, "Arka-Rakshak","tomato",   1, 400, 900, 18, 32, 60),
    (28, "Naveen",      "tomato",   1, 350, 850, 16, 30, 55),
    # Turmeric
    (29, "Pratibha",    "turmeric", 1,1100,1800, 24, 34,120),
]

N_FARMERS  = 500
N_VARIETIES = len(VARIETIES)   # 30

VARIETY_NAMES = [v[1] for v in VARIETIES]
VARIETY_CROPS = [v[2] for v in VARIETIES]


# ─────────────────────────────────────────────────────────────────────────────
# 2. Build variety content-feature matrix
# ─────────────────────────────────────────────────────────────────────────────
def build_variety_features() -> np.ndarray:
    """
    6-column feature matrix for content-based similarity:
    [soil_code, rain_lo, rain_hi, temp_lo, temp_hi, base_yield_q]
    Rows = 30 varieties.
    """
    mat = np.array([
        [v[3], v[4], v[5], v[6], v[7], v[8]]
        for v in VARIETIES
    ], dtype=float)
    return mat


# ─────────────────────────────────────────────────────────────────────────────
# 3. Synthetic interaction matrix
# ─────────────────────────────────────────────────────────────────────────────
def generate_interaction_matrix(seed: int = 42) -> sp.csr_matrix:
    """
    Synthetic 500-farmer × 30-variety success-outcome matrix.

    Data generating process
    -----------------------
    • Each farmer has a latent "soil-climate profile" drawn from realistic
      Indian distributions.
    • A farmer's success with a variety is proportional to how well the
      variety's soil/climate requirements match the farmer's profile.
    • ~8% of entries are observed (sparse — realistic for a recommendation
      setting where farmers have only tried a few varieties).
    • Observed success is binarised to integer 1–5 scores with noise.
    """
    rng = np.random.RandomState(seed)

    # Farmer latent profiles: (soil_code, annual_rain, mean_temp)
    farmer_soil  = rng.randint(0, 6, N_FARMERS)            # 0–5
    farmer_rain  = rng.normal(700, 350, N_FARMERS).clip(100, 2200)
    farmer_temp  = rng.normal(26, 6, N_FARMERS).clip(10, 40)

    rows, cols, data = [], [], []

    for f_idx in range(N_FARMERS):
        s  = farmer_soil[f_idx]
        r  = farmer_rain[f_idx]
        t  = farmer_temp[f_idx]

        # Compute affinity to each variety
        affinity = np.zeros(N_VARIETIES)
        for v_idx, (vid, name, crop, sc, r_lo, r_hi, t_lo, t_hi, yld) in enumerate(VARIETIES):
            soil_match   = 1.0 if sc == s else 0.20
            r_mid = (r_lo + r_hi) / 2.0
            r_score = np.exp(-0.5 * ((r - r_mid) / max(r_hi - r_lo, 1)) ** 2)
            t_mid = (t_lo + t_hi) / 2.0
            t_score = np.exp(-0.5 * ((t - t_mid) / max((t_hi - t_lo) / 2, 1)) ** 2)
            affinity[v_idx] = soil_match * r_score * t_score

        # Each farmer has tried ~6 varieties (Poisson)
        n_tried = max(rng.poisson(6), 1)
        # Sample proportional to affinity (farmers more likely to try what suits them)
        probs = affinity / affinity.sum()
        tried = rng.choice(N_VARIETIES, size=min(n_tried, N_VARIETIES),
                           replace=False, p=probs)

        for v_idx in tried:
            # Success score 1–5 driven by affinity + noise
            base_score = affinity[v_idx] * 5.0
            noise = rng.normal(0, 0.6)
            score = int(np.clip(round(base_score + noise), 1, 5))
            rows.append(f_idx)
            cols.append(v_idx)
            data.append(score)

    mat = sp.csr_matrix((data, (rows, cols)), shape=(N_FARMERS, N_VARIETIES),
                        dtype=np.float32)

    density = mat.nnz / (N_FARMERS * N_VARIETIES)
    print(f"Interaction matrix: {N_FARMERS}×{N_VARIETIES}  "
          f"nnz={mat.nnz}  density={density*100:.1f}%")
    return mat


# ─────────────────────────────────────────────────────────────────────────────
# 4. Train ALS (collaborative filtering)
# ─────────────────────────────────────────────────────────────────────────────
def train_als(interaction_mat: sp.csr_matrix, out_dir: Path):
    import implicit
    # implicit ALS: first dimension of matrix = "users".
    # Farmers are users (500), varieties are items (30).
    # Pass user×item (500×30) so model.user_factors has shape (500, factors).
    user_items = interaction_mat.tocsr()   # (500 farmers × 30 varieties)

    model = implicit.als.AlternatingLeastSquares(
        factors=40,
        regularization=0.05,
        iterations=30,
        calculate_training_loss=True,
        random_state=42,
    )
    print("Training ALS collaborative filter (30 iterations)...")
    model.fit(user_items)   # user×item — farmers as rows

    pkl_path = out_dir / "variety_als_model.pkl"
    with open(pkl_path, "wb") as f:
        pickle.dump({"model": model, "user_items": user_items}, f)
    print(f"ALS model saved => {pkl_path}  ({pkl_path.stat().st_size // 1024} KB)")
    return model


# ─────────────────────────────────────────────────────────────────────────────
# 5. Build & save content-based feature store
# ─────────────────────────────────────────────────────────────────────────────
def build_content_store(out_dir: Path) -> dict:
    raw_features = build_variety_features()

    # Scale to [0,1] for cosine similarity to be meaningful
    scaler       = MinMaxScaler()
    feat_scaled  = scaler.fit_transform(raw_features)

    store = {
        "variety_features_raw":    raw_features,
        "variety_features_scaled": feat_scaled,
        "feature_scaler":          scaler,
        "variety_names":           VARIETY_NAMES,
        "variety_crops":           VARIETY_CROPS,
        "feature_cols":            ["soil_code", "rain_lo", "rain_hi",
                                    "temp_lo", "temp_hi", "base_yield_q"],
    }
    pkl_path = out_dir / "variety_content.pkl"
    with open(pkl_path, "wb") as f:
        pickle.dump(store, f)
    print(f"Content store saved => {pkl_path}  ({pkl_path.stat().st_size // 1024} KB)")
    return store


# ─────────────────────────────────────────────────────────────────────────────
# 6. recommend() — importable by the FastAPI service
# ─────────────────────────────────────────────────────────────────────────────
_CACHE: dict = {}


def _load_models(model_dir: str) -> tuple:
    if model_dir not in _CACHE:
        d = Path(model_dir)
        with open(d / "variety_als_model.pkl", "rb") as f:
            als_bundle = pickle.load(f)
        with open(d / "variety_content.pkl", "rb") as f:
            content    = pickle.load(f)
        _CACHE[model_dir] = (als_bundle, content)
    return _CACHE[model_dir]


def _als_recommend(
    farmer_id: int,
    als_bundle: dict,
    top_n: int,
) -> List[dict]:
    """Return top-N varieties via ALS collaborative filtering."""
    model      = als_bundle["model"]
    user_items = als_bundle["user_items"]    # shape: (n_farmers, n_varieties)

    ids, scores = model.recommend(
        farmer_id,
        user_items[farmer_id],               # this farmer's interaction row
        N=top_n,
        filter_already_liked_items=True,
    )
    results = []
    for rank, (vid, score) in enumerate(zip(ids, scores), 1):
        results.append({
            "rank":         rank,
            "variety_id":   int(vid),
            "variety_name": VARIETY_NAMES[vid],
            "crop":         VARIETY_CROPS[vid],
            "score":        round(float(score), 4),
            "method":       "collaborative_filtering",
        })
    return results


def _content_recommend(
    features_dict: dict,
    content: dict,
    top_n: int,
    crop_filter: Optional[str] = None,
) -> List[dict]:
    """Return top-N varieties via cosine similarity on content features."""
    scaler       = content["feature_scaler"]
    feat_scaled  = content["variety_features_scaled"]
    names        = content["variety_names"]
    crops        = content["variety_crops"]

    # Encode farmer features into the same 6-dim space
    SOIL_CODE = {"sandy": 0, "loamy": 1, "clayey": 2, "black": 3, "red": 4, "alluvial": 5}
    soil_code = SOIL_CODE.get(str(features_dict.get("soil_type", "loamy")).lower(), 1)
    rain      = float(features_dict.get("rainfall_mm", 700))
    temp      = float(features_dict.get("temperature", 26))

    # Query vector: [soil_code, rain, rain, temp, temp, 0]
    # rain_lo=rain, rain_hi=rain (point query), base_yield ignored
    query_raw = np.array([[soil_code, rain, rain, temp, temp, 0.0]])
    query_scaled = scaler.transform(query_raw)

    sims  = cosine_similarity(query_scaled, feat_scaled)[0]   # (30,)
    order = sims.argsort()[::-1]

    results = []
    rank    = 1
    for vid in order:
        if crop_filter and crops[vid].lower() != crop_filter.lower():
            continue
        results.append({
            "rank":         rank,
            "variety_id":   int(vid),
            "variety_name": names[vid],
            "crop":         crops[vid],
            "score":        round(float(sims[vid]), 4),
            "method":       "content_based",
        })
        rank += 1
        if rank > top_n:
            break
    return results


def recommend(
    farmer_id: Optional[int] = None,
    features_dict: Optional[dict] = None,
    top_n: int = 5,
    crop_filter: Optional[str] = None,
    als_weight: float = 0.70,
    model_dir: str = None,
) -> dict:
    """
    Recommend crop varieties for a farmer.

    Parameters
    ----------
    farmer_id     : int, optional
        Known farmer ID (0–499). Triggers ALS collaborative filtering.
    features_dict : dict, optional
        Field conditions for cold-start / content-based fallback:
          soil_type   : str   — 'sandy'|'loamy'|'clayey'|'black'|'red'|'alluvial'
          rainfall_mm : float — annual rainfall
          temperature : float — mean season temperature °C
    top_n         : int — number of recommendations to return (default 5)
    crop_filter   : str, optional — restrict to one crop type
    als_weight    : float [0,1] — blend weight for ALS score in hybrid mode
    model_dir     : str — directory with pkl files (auto-resolved if None)

    Returns
    -------
    dict:
        farmer_id       : int or None
        mode            : 'collaborative' | 'content_based' | 'hybrid'
        recommendations : list[dict] with rank, variety_name, crop, score, method
        explanation     : str
    """
    if model_dir is None:
        model_dir = str(Path(__file__).parent / "ml_models")

    als_bundle, content = _load_models(model_dir)

    has_id       = farmer_id is not None and 0 <= farmer_id < N_FARMERS
    has_features = features_dict is not None and len(features_dict) > 0

    if has_id and not has_features:
        # Pure collaborative filtering
        recs  = _als_recommend(farmer_id, als_bundle, top_n * 2)
        if crop_filter:
            recs = [r for r in recs if r["crop"].lower() == crop_filter.lower()]
        recs  = recs[:top_n]
        mode  = "collaborative"
        expl  = (f"ALS collaborative filtering: farmers with similar variety histories "
                 f"to farmer #{farmer_id} succeeded with these varieties.")

    elif has_features and not has_id:
        # Pure content-based (cold start)
        recs  = _content_recommend(features_dict, content, top_n, crop_filter)
        mode  = "content_based"
        expl  = ("Content-based: varieties matched to your soil/climate profile "
                 "using cosine similarity on agronomic feature vectors.")

    elif has_id and has_features:
        # Hybrid blend
        als_recs  = _als_recommend(farmer_id, als_bundle, top_n * 3)
        cb_recs   = _content_recommend(features_dict, content, top_n * 3, crop_filter)

        # Build score dicts
        als_scores = {r["variety_id"]: r["score"] for r in als_recs}
        cb_scores  = {r["variety_id"]: r["score"] for r in cb_recs}

        # Normalise independently to [0,1]
        def _norm(d):
            mx = max(d.values()) if d else 1.0
            return {k: v / max(mx, 1e-9) for k, v in d.items()}

        als_n = _norm(als_scores)
        cb_n  = _norm(cb_scores)

        all_ids = set(als_n.keys()) | set(cb_n.keys())
        blended = {
            vid: als_weight * als_n.get(vid, 0.0) + (1 - als_weight) * cb_n.get(vid, 0.0)
            for vid in all_ids
        }

        # Filter by crop if requested
        if crop_filter:
            blended = {vid: s for vid, s in blended.items()
                       if VARIETY_CROPS[vid].lower() == crop_filter.lower()}

        top_ids = sorted(blended, key=blended.get, reverse=True)[:top_n]
        recs    = []
        for rank, vid in enumerate(top_ids, 1):
            recs.append({
                "rank":         rank,
                "variety_id":   int(vid),
                "variety_name": VARIETY_NAMES[vid],
                "crop":         VARIETY_CROPS[vid],
                "score":        round(float(blended[vid]), 4),
                "als_score":    round(float(als_n.get(vid, 0.0)), 4),
                "cb_score":     round(float(cb_n.get(vid, 0.0)), 4),
                "method":       "hybrid",
            })
        mode  = "hybrid"
        expl  = (f"Hybrid (ALS {als_weight*100:.0f}% + content {(1-als_weight)*100:.0f}%): "
                 f"blends collaborative history of farmer #{farmer_id} with "
                 f"your soil/climate profile.")

    else:
        raise ValueError("Provide at least one of: farmer_id, features_dict")

    return {
        "farmer_id":       farmer_id,
        "mode":            mode,
        "recommendations": recs,
        "explanation":     expl,
    }


# ─────────────────────────────────────────────────────────────────────────────
# 7. Entry point
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    out_dir = Path(__file__).parent / "ml_models"
    out_dir.mkdir(parents=True, exist_ok=True)

    print("=" * 65)
    print("STEP 1 — Generate 500×30 interaction matrix")
    print("=" * 65)
    int_mat = generate_interaction_matrix(seed=42)

    print("\n" + "=" * 65)
    print("STEP 2 — Train ALS collaborative filter")
    print("=" * 65)
    als_model = train_als(int_mat, out_dir)

    print("\n" + "=" * 65)
    print("STEP 3 — Build content-based feature store")
    print("=" * 65)
    content_store = build_content_store(out_dir)

    # Save metadata JSON
    meta = {
        "n_farmers":     N_FARMERS,
        "n_varieties":   N_VARIETIES,
        "variety_names": VARIETY_NAMES,
        "variety_crops": VARIETY_CROPS,
        "variety_catalogue": [
            {"id": v[0], "name": v[1], "crop": v[2],
             "soil_code": v[3], "rain_lo": v[4], "rain_hi": v[5],
             "temp_lo": v[6], "temp_hi": v[7], "base_yield_q": v[8]}
            for v in VARIETIES
        ],
    }
    with open(out_dir / "variety_meta.json", "w") as f:
        json.dump(meta, f, indent=2)
    print(f"Metadata saved => {out_dir / 'variety_meta.json'}")

    print("\n" + "=" * 65)
    print("STEP 4 — Smoke-test recommend()")
    print("=" * 65)
    model_dir = str(out_dir)

    test_cases = [
        # Mode, kwargs, description
        ("collaborative",  dict(farmer_id=42, top_n=5),
         "Farmer #42 — pure ALS"),
        ("content_based",  dict(features_dict={"soil_type": "black", "rainfall_mm": 650, "temperature": 30}, top_n=5),
         "Cold-start: black soil, 650mm, 30°C"),
        ("hybrid",         dict(farmer_id=7,
                                features_dict={"soil_type": "loamy", "rainfall_mm": 400, "temperature": 18},
                                top_n=5),
         "Farmer #7, loamy/cool/dry — hybrid blend"),
        ("content+filter", dict(features_dict={"soil_type": "sandy", "rainfall_mm": 280, "temperature": 34},
                                crop_filter="groundnut", top_n=3),
         "Cold-start + crop_filter=groundnut"),
    ]

    for mode, kwargs, desc in test_cases:
        print(f"\n  [{desc}]")
        result = recommend(**kwargs, model_dir=model_dir)
        print(f"  Mode: {result['mode']}")
        for r in result["recommendations"]:
            als_info = f"  ALS={r.get('als_score','N/A'):.3f}  CB={r.get('cb_score','N/A'):.3f}" \
                       if r.get("method") == "hybrid" else ""
            print(f"    #{r['rank']:2d} {r['variety_name']:15s} ({r['crop']:10s})  "
                  f"score={r['score']:.3f}{als_info}")
        print(f"  => {result['explanation']}")

    print("\nDone — ALS + content models ready for /variety/recommend endpoint.")
