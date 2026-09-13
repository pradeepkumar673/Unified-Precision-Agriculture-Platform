"""
pest_outbreak_sim.py
====================
Pest Outbreak Spread Prediction — Prompt #8

Model: SIR-style epidemiological simulation over a village network graph.
       This is a *simulation model*, not a trained ML classifier.

Architecture
------------
Village graph (50 nodes, networkx)
  • Nodes  : villages with attributes (x, y, crop_area_ha, susceptible_pct)
  • Edges  : adjacency (shared borders or proximity < 25 km)
             weighted by crop corridor overlap (higher weight = easier spread)

State per village per time step (discrete SIR variant)
  S : proportion of crop area Susceptible (uninfected)
  I : proportion Infected (active pest)
  R : proportion Recovered / treated (immune this season)

Transition equations (weekly, stochastic)
  new_exposed = β_ij × I_j × S_i × wind_boost_ij   (neighbour j → village i)
  recovery    = γ × I_i
  Where:
    β_ij   = base transmission rate × edge_weight_ij
    γ      = recovery rate (treated / natural die-off)
    wind_boost_ij = modifier when wind vector points FROM j TOWARD i

Wind model
  wind_vector = (wind_speed_ms, wind_dir_deg)  — synthetic from caller
  Each village pair (j→i) gets a directional alignment score:
    alignment = cos(angle_from_j_to_i - wind_dir_deg)
    if alignment > 0 and wind_speed > threshold:
        boost = 1 + WIND_BOOST_FACTOR × alignment × (wind_speed / REF_SPEED)

Outputs
-------
  backend/ml_models/pest_village_graph.pkl   — pre-built village graph
  backend/ml_models/pest_sim_meta.json       — village coordinates, names

Key functions
-------------
  build_village_graph()          — build & save the synthetic village network
  predict_risk(current_infected_villages, wind_vector, n_steps=1)
    → dict per village: {risk_score, state, risk_level, advice}
"""

import json
import math
import pickle
import warnings
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Union

import networkx as nx
import numpy as np

warnings.filterwarnings("ignore")

# ─────────────────────────────────────────────────────────────────────────────
# 1. Model parameters
# ─────────────────────────────────────────────────────────────────────────────
N_VILLAGES          = 50
PROXIMITY_KM        = 80.0      # villages within this radius are connected
BASE_BETA           = 0.18      # base transmission rate per week
GAMMA               = 0.08      # recovery rate per week (treatment / die-off)
WIND_BOOST_FACTOR   = 0.45      # max additional transmission from tailwind
WIND_SPEED_THRESHOLD= 2.0       # m/s below which wind boost is negligible
REF_WIND_SPEED      = 8.0       # m/s reference for normalising wind boost

# Field for synthetic geography (approx Vidarbha/Marathwada, Maharashtra)
LAT_MIN, LAT_MAX    = 18.5, 22.0
LON_MIN, LON_MAX    = 75.0, 80.5

CROPS = ["cotton", "soybean", "rice", "chickpea", "wheat"]


# ─────────────────────────────────────────────────────────────────────────────
# 2. Build synthetic village graph
# ─────────────────────────────────────────────────────────────────────────────
def _haversine_km(lat1, lon1, lat2, lon2) -> float:
    """Great-circle distance between two lat/lon points (km)."""
    R   = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a    = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def build_village_graph(seed: int = 42) -> nx.Graph:
    """
    Construct a synthetic village network of 50 nodes.

    Node attributes
    ---------------
      lat, lon          : geographic coordinates
      name              : "Village_XX"
      dominant_crop     : most planted crop
      crop_area_ha      : total crop area
      base_susceptibility: baseline S proportion [0.7 – 1.0]

    Edge attributes
    ---------------
      distance_km       : Haversine distance
      weight            : transmission weight (inversely proportional to distance,
                          scaled by shared crop corridor similarity)
    """
    rng = np.random.RandomState(seed)

    G = nx.Graph()

    # Generate village coordinates (realistic scatter across ~360×390 km region)
    lats = rng.uniform(LAT_MIN, LAT_MAX, N_VILLAGES)
    lons = rng.uniform(LON_MIN, LON_MAX, N_VILLAGES)

    for i in range(N_VILLAGES):
        crop   = rng.choice(CROPS)
        area   = float(rng.uniform(500, 5000))   # ha under cultivation
        sus    = float(rng.uniform(0.70, 1.00))  # initial susceptibility

        G.add_node(i,
            name=f"Village_{i:02d}",
            lat=float(lats[i]),
            lon=float(lons[i]),
            dominant_crop=crop,
            crop_area_ha=round(area, 1),
            base_susceptibility=round(sus, 3),
        )

    # Add edges for villages within proximity threshold
    for i in range(N_VILLAGES):
        for j in range(i + 1, N_VILLAGES):
            d = _haversine_km(lats[i], lons[i], lats[j], lons[j])
            if d <= PROXIMITY_KM:
                # Crop corridor similarity: higher weight if same dominant crop
                same_crop = G.nodes[i]["dominant_crop"] == G.nodes[j]["dominant_crop"]
                corridor  = 1.3 if same_crop else 1.0
                # Proximity weight: closer villages spread pest more easily
                prox_w    = max(0.05, 1.0 - d / PROXIMITY_KM)
                weight    = round(prox_w * corridor, 4)

                G.add_edge(i, j,
                    distance_km=round(d, 2),
                    weight=weight,
                )

    n_edges = G.number_of_edges()
    avg_deg = sum(dict(G.degree()).values()) / N_VILLAGES
    print(f"Village graph: {N_VILLAGES} nodes, {n_edges} edges, "
          f"avg degree={avg_deg:.1f}, "
          f"connected={nx.is_connected(G)}")

    # If graph is disconnected, add minimum spanning tree edges to connect components
    if not nx.is_connected(G):
        comps = list(nx.connected_components(G))
        print(f"  Graph has {len(comps)} components — adding bridging edges...")
        for k in range(len(comps) - 1):
            # Connect nearest pair of villages across the two components
            best_d, bi, bj = 1e9, None, None
            for vi in comps[k]:
                for vj in comps[k + 1]:
                    d = _haversine_km(lats[vi], lons[vi], lats[vj], lons[vj])
                    if d < best_d:
                        best_d, bi, bj = d, vi, vj
            G.add_edge(bi, bj, distance_km=round(best_d, 2), weight=0.02)
        print(f"  After bridging: connected={nx.is_connected(G)}")

    return G


# ─────────────────────────────────────────────────────────────────────────────
# 3. Wind directional boost calculator
# ─────────────────────────────────────────────────────────────────────────────
def _wind_boost(
    lat_src: float, lon_src: float,
    lat_dst: float, lon_dst: float,
    wind_dir_deg: float,
    wind_speed_ms: float,
) -> float:
    """
    Compute the wind-driven transmission multiplier from src → dst.

    If wind is blowing FROM src TOWARD dst (i.e., the bearing src→dst aligns
    with wind direction), the multiplier is > 1.0.  Against the wind → no boost.

    Parameters
    ----------
    wind_dir_deg : meteorological convention — direction wind is coming FROM.
                   0° = wind from North, 90° = from East, 180° from South, etc.
    """
    if wind_speed_ms < WIND_SPEED_THRESHOLD:
        return 1.0   # calm — no directional boost

    # Bearing from src to dst (degrees clockwise from North)
    dlat = lat_dst - lat_src
    dlon = lon_dst - lon_src
    bearing_to_dst = math.degrees(math.atan2(dlon, dlat)) % 360

    # Wind is coming FROM wind_dir_deg, so it blows TOWARD (wind_dir_deg + 180) % 360
    wind_toward = (wind_dir_deg + 180) % 360

    # Alignment: cosine of angle between "direction to dst" and "wind toward"
    angle_diff  = math.radians(bearing_to_dst - wind_toward)
    alignment   = math.cos(angle_diff)     # 1 = perfectly aligned, -1 = opposing

    if alignment <= 0:
        return 1.0   # headwind or crosswind — no boost

    boost = 1.0 + WIND_BOOST_FACTOR * alignment * min(wind_speed_ms / REF_WIND_SPEED, 1.0)
    return round(boost, 4)


# ─────────────────────────────────────────────────────────────────────────────
# 4. SIR simulation step
# ─────────────────────────────────────────────────────────────────────────────
def _sir_step(
    G: nx.Graph,
    state: Dict[int, Dict[str, float]],
    wind_dir_deg: float,
    wind_speed_ms: float,
    beta: float = BASE_BETA,
    gamma: float = GAMMA,
    rng: np.random.RandomState = None,
) -> Dict[int, Dict[str, float]]:
    """
    Advance the SIR simulation by one week.

    state : dict mapping village_id → {"S": float, "I": float, "R": float}
    Returns a new state dict.
    """
    if rng is None:
        rng = np.random.RandomState(0)

    new_state = {}

    for v in G.nodes():
        S_v = state[v]["S"]
        I_v = state[v]["I"]
        R_v = state[v]["R"]
        lat_v = G.nodes[v]["lat"]
        lon_v = G.nodes[v]["lon"]

        # Force from infected neighbours
        infection_pressure = 0.0
        for u in G.neighbors(v):
            I_u  = state[u]["I"]
            if I_u <= 0:
                continue
            w_uv = G[u][v].get("weight", 0.1)
            lat_u = G.nodes[u]["lat"]
            lon_u = G.nodes[u]["lon"]
            wb    = _wind_boost(lat_u, lon_u, lat_v, lon_v,
                                wind_dir_deg, wind_speed_ms)
            infection_pressure += beta * w_uv * wb * I_u

        # Self-infection (within-village spread)
        infection_pressure += beta * 0.5 * I_v

        # New infections this week
        dI = infection_pressure * S_v
        dI = min(dI, S_v)                              # can't infect more than susceptible
        dI = max(dI + rng.normal(0, 0.005), 0.0)       # small stochastic perturbation

        # Recoveries / treatments
        dR = gamma * I_v

        new_S = max(S_v - dI, 0.0)
        new_I = max(I_v + dI - dR, 0.0)
        new_R = min(R_v + dR, 1.0)

        # Normalise (floating point guard)
        total = new_S + new_I + new_R
        if total > 0:
            new_S /= total
            new_I /= total
            new_R /= total

        new_state[v] = {"S": round(new_S, 6),
                        "I": round(new_I, 6),
                        "R": round(new_R, 6)}

    return new_state


# ─────────────────────────────────────────────────────────────────────────────
# 5. predict_risk() — importable by the FastAPI service
# ─────────────────────────────────────────────────────────────────────────────
_GRAPH_CACHE: dict = {}


def _load_graph(model_dir: str) -> nx.Graph:
    if model_dir not in _GRAPH_CACHE:
        path = Path(model_dir) / "pest_village_graph.pkl"
        with open(path, "rb") as f:
            _GRAPH_CACHE[model_dir] = pickle.load(f)
    return _GRAPH_CACHE[model_dir]


def predict_risk(
    current_infected_villages: Union[List[int], Dict[int, float]],
    wind_vector: Tuple[float, float],
    n_steps: int = 1,
    beta: float = BASE_BETA,
    gamma: float = GAMMA,
    model_dir: str = None,
    seed: int = 42,
) -> Dict:
    """
    Predict next-week (or n_steps-week) pest outbreak risk for all 50 villages.

    Parameters
    ----------
    current_infected_villages : list[int] or dict[int, float]
        Either:
          - A list of village IDs currently infected (each starts at I=0.5)
          - A dict mapping village_id → initial_I proportion (0.0–1.0)
    wind_vector : (wind_speed_ms, wind_dir_deg)
        wind_speed_ms : float — wind speed in m/s (0=calm, typical 2–8)
        wind_dir_deg  : float — meteorological direction wind is coming FROM
                        (0=North, 90=East, 180=South, 270=West)
    n_steps      : int — number of weekly simulation steps (default 1)
    beta         : float — transmission rate (default 0.18)
    gamma        : float — recovery rate (default 0.08)
    model_dir    : str — directory with pest_village_graph.pkl (auto-resolved)
    seed         : int — RNG seed for reproducibility

    Returns
    -------
    dict:
        wind_speed_ms     : float
        wind_dir_deg      : float
        wind_dir_label    : str  (N/NE/E/SE/S/SW/W/NW)
        n_steps           : int
        simulation_weeks  : int
        villages          : dict[str, dict] — keyed by village name:
            village_id    : int
            risk_score    : float [0,1]  — I proportion after n_steps
            delta_I       : float  — change from initial I (+ means worsening)
            state_S       : float
            state_I       : float
            state_R       : float
            risk_level    : str  (none/low/moderate/high/critical)
            advice        : str
        summary           : dict — outbreak totals and hotspots
    """
    if model_dir is None:
        model_dir = str(Path(__file__).parent / "ml_models")

    G   = _load_graph(model_dir)
    rng = np.random.RandomState(seed)

    wind_speed_ms = float(wind_vector[0])
    wind_dir_deg  = float(wind_vector[1]) % 360

    # Build compass label
    dirs  = ["N","NE","E","SE","S","SW","W","NW"]
    label = dirs[int((wind_dir_deg + 22.5) / 45) % 8]

    # ── Initialise SIR state ──
    # Default: all susceptible, based on village base_susceptibility
    state: Dict[int, Dict[str, float]] = {}
    for v in G.nodes():
        S0 = G.nodes[v]["base_susceptibility"]
        state[v] = {"S": S0, "I": 0.0, "R": 1.0 - S0}

    # Seed infected villages
    if isinstance(current_infected_villages, list):
        infected_map = {vid: 0.50 for vid in current_infected_villages}
    else:
        infected_map = dict(current_infected_villages)

    for vid, I0 in infected_map.items():
        if vid not in G.nodes():
            continue
        I0   = float(np.clip(I0, 0.0, 1.0))
        S_v  = state[vid]["S"]
        R_v  = state[vid]["R"]
        I_v  = min(I0, S_v)          # can't infect beyond susceptible pool
        S_v -= I_v
        state[vid] = {"S": max(S_v, 0.0), "I": I_v, "R": R_v}

    initial_I = {v: state[v]["I"] for v in G.nodes()}

    # ── Run simulation ──
    for _ in range(n_steps):
        state = _sir_step(G, state, wind_dir_deg, wind_speed_ms, beta, gamma, rng)

    # ── Build output ──
    RISK_THRESHOLDS = [
        (0.00, "none",     "No active infection — monitor regularly."),
        (0.05, "low",      "Low risk. Inspect fields weekly. No immediate action needed."),
        (0.15, "moderate", "Moderate risk. Deploy scouts; consider preventive spray."),
        (0.35, "high",     "High risk. Immediate pesticide application recommended."),
        (1.01, "critical", "CRITICAL. Emergency intervention — coordinate with district agriculture officer."),
    ]

    villages_out = {}
    for v in sorted(G.nodes()):
        I_now  = state[v]["I"]
        delta  = I_now - initial_I[v]

        risk_level, advice = "none", ""
        for threshold, level, adv in RISK_THRESHOLDS:
            if I_now >= threshold:
                risk_level, advice = level, adv

        villages_out[G.nodes[v]["name"]] = {
            "village_id":   v,
            "risk_score":   round(I_now, 4),
            "delta_I":      round(delta, 4),
            "state_S":      round(state[v]["S"], 4),
            "state_I":      round(I_now, 4),
            "state_R":      round(state[v]["R"], 4),
            "risk_level":   risk_level,
            "dominant_crop": G.nodes[v]["dominant_crop"],
            "advice":       advice,
        }

    # Summary statistics
    risk_scores = [d["risk_score"] for d in villages_out.values()]
    hotspots    = sorted(
        [(name, d["risk_score"]) for name, d in villages_out.items()],
        key=lambda x: x[1], reverse=True
    )[:5]
    counts = {lvl: sum(1 for d in villages_out.values() if d["risk_level"] == lvl)
              for lvl in ["none", "low", "moderate", "high", "critical"]}

    return {
        "wind_speed_ms":   wind_speed_ms,
        "wind_dir_deg":    wind_dir_deg,
        "wind_dir_label":  label,
        "n_steps":         n_steps,
        "simulation_weeks": n_steps,
        "villages":        villages_out,
        "summary": {
            "total_villages":      N_VILLAGES,
            "currently_infected":  len(infected_map),
            "mean_risk_score":     round(float(np.mean(risk_scores)), 4),
            "max_risk_score":      round(float(np.max(risk_scores)), 4),
            "risk_level_counts":   counts,
            "top5_hotspots":       [{"village": h[0], "risk": round(h[1], 4)}
                                    for h in hotspots],
        },
    }


# ─────────────────────────────────────────────────────────────────────────────
# 6. Entry point — build graph and run smoke tests
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    out_dir = Path(__file__).parent / "ml_models"
    out_dir.mkdir(parents=True, exist_ok=True)

    print("=" * 65)
    print("STEP 1 — Build synthetic village graph (50 nodes)")
    print("=" * 65)
    G = build_village_graph(seed=42)

    # Save graph
    pkl_path = out_dir / "pest_village_graph.pkl"
    with open(pkl_path, "wb") as f:
        pickle.dump(G, f)
    print(f"Graph saved => {pkl_path}  ({pkl_path.stat().st_size // 1024} KB)")

    # Save metadata
    meta = {
        "n_villages":   N_VILLAGES,
        "proximity_km": PROXIMITY_KM,
        "base_beta":    BASE_BETA,
        "gamma":        GAMMA,
        "wind_boost":   WIND_BOOST_FACTOR,
        "crops":        CROPS,
        "villages": [
            {
                "id":           v,
                "name":         G.nodes[v]["name"],
                "lat":          G.nodes[v]["lat"],
                "lon":          G.nodes[v]["lon"],
                "dominant_crop": G.nodes[v]["dominant_crop"],
                "crop_area_ha": G.nodes[v]["crop_area_ha"],
            }
            for v in G.nodes()
        ],
    }
    meta_path = out_dir / "pest_sim_meta.json"
    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2)
    print(f"Metadata saved => {meta_path}")

    print("\n" + "=" * 65)
    print("STEP 2 — Wind boost verification")
    print("=" * 65)

    # Verify wind boost directionality
    for wdir, label in [(0,"N wind"),(90,"E wind"),(180,"S wind"),(270,"W wind")]:
        # src at south, dst at north — N wind (from N) should REDUCE spread S→N
        boost = _wind_boost(18.5, 77.0, 22.0, 77.0, wdir, 6.0)
        print(f"  {label:8s}: boost for spread S->N = {boost:.3f}")

    print()
    boost_tailwind = _wind_boost(18.5, 77.0, 22.0, 77.0, 180, 6.0)  # S wind → N spread
    boost_headwind = _wind_boost(18.5, 77.0, 22.0, 77.0, 0,   6.0)  # N wind → vs N spread
    print(f"  S wind (from S, blows N): boost = {boost_tailwind:.3f}  (should be > 1.0)")
    print(f"  N wind (from N, blows S): boost = {boost_headwind:.3f}  (should be = 1.0)")

    print("\n" + "=" * 65)
    print("STEP 3 — Smoke-test predict_risk()")
    print("=" * 65)

    model_dir = str(out_dir)

    test_cases = [
        dict(
            label="3 southern villages infected, strong S wind blowing north (spreading)",
            infected=[0, 1, 2],
            wind=(7.0, 180),   # 7 m/s from South → spreading northward
            n_steps=1,
        ),
        dict(
            label="Same outbreak, calm wind (no directional spread)",
            infected=[0, 1, 2],
            wind=(1.0, 180),   # calm — negligible wind
            n_steps=1,
        ),
        dict(
            label="3-week forecast, 5 central villages infected, E wind",
            infected=[20, 21, 22, 23, 24],
            wind=(5.0, 90),    # from East → westward spread
            n_steps=3,
        ),
        dict(
            label="Single village infected, high wind (1 week)",
            infected={10: 0.8},  # 80% infection rate in village 10
            wind=(9.0, 225),   # SW wind
            n_steps=1,
        ),
    ]

    for tc in test_cases:
        label  = tc["label"]
        result = predict_risk(
            current_infected_villages=tc["infected"],
            wind_vector=tc["wind"],
            n_steps=tc["n_steps"],
            model_dir=model_dir,
        )
        s = result["summary"]
        print(f"\n  [{label}]")
        print(f"  Wind: {result['wind_speed_ms']} m/s from {result['wind_dir_label']} "
              f"({result['wind_dir_deg']}°)  |  Steps: {result['n_steps']}")
        print(f"  Mean risk: {s['mean_risk_score']:.4f}  "
              f"Max risk: {s['max_risk_score']:.4f}")
        print(f"  Risk counts: {s['risk_level_counts']}")
        print(f"  Top-5 hotspots:")
        for h in s["top5_hotspots"]:
            v_name = h["village"]
            v_info = result["villages"][v_name]
            print(f"    {v_name}: risk={h['risk']:.4f}  [{v_info['risk_level']}]"
                  f"  {v_info['dominant_crop']}")

    print("\nDone — pest_village_graph.pkl ready for /pest/risk endpoint.")
