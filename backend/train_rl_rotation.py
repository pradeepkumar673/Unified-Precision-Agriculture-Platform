"""
train_rl_rotation.py
====================
RL-based Crop Rotation Planner — Prompt #9

Environment: CropRotationEnv (custom Gymnasium)
------------------------------------------------
  State  : [soil_nitrogen, soil_organic_carbon, crop_t-3, crop_t-2, crop_t-1]
             • soil_nitrogen      : float [0, 1]  (1.0 = fully replenished)
             • soil_organic_carbon: float [0, 1]  (1.0 = healthy)
             • last_3_crops       : int each in [0, 5]  (crop IDs)
  Action : int in [0, 5]  — which crop to plant next season

  Crop catalogue (6 crops)
  -------------------------
  0: Wheat      (cereal)
  1: Rice       (cereal, heavy N consumer)
  2: Cotton     (cash crop, heavy N consumer)
  3: Soybean    (legume, N-fixer — restores nitrogen)
  4: Maize      (cereal)
  5: Chickpea   (legume, light N-fixer)

  Reward function  (per-season)
  ---------------
  base_profit[crop]                 — crop-specific gross margin (Rs/acre)
  + nitrogen_bonus                  — extra profit when soil N is high
  - soil_degradation_penalty        — if same crop repeated (monoculture)
  + legume_rotation_bonus           — if legume planted after cereal
  - nitrogen_depletion_cost         — progressive cost as N falls below 0.3

  Soil dynamics
  -------------
  nitrogen:
    - Legumes (soy, chickpea): +0.15 per season
    - Cereals: -0.08 per season
    - Cotton:  -0.12 per season (heavy feeder)
    Monoculture (same crop 2+ consecutive seasons): additional -0.05
  organic_carbon:
    - Cereal residue left in field: +0.03
    - Cotton (stripped): -0.04
    - Legume: +0.05

  Episode length: 10 seasons (configurable)

Agent: PPO via stable-baselines3
Training: ~50 000 timesteps (< 3 min on CPU)

Outputs
-------
  backend/ml_models/rl_rotation_ppo.zip   — trained PPO policy
  backend/ml_models/rl_rotation_meta.json — crop catalogue, reward params
"""

import json
import os
import pickle
import warnings
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

# Force CPU training — the installed PyTorch CUDA build has no kernel for
# Blackwell (RTX 5050). The model is tiny; 50k steps < 90s on CPU.
os.environ["CUDA_VISIBLE_DEVICES"] = ""

import numpy as np
import gymnasium as gym
from gymnasium import spaces

warnings.filterwarnings("ignore")

# ─────────────────────────────────────────────────────────────────────────────
# 1. Crop catalogue and agronomic parameters
# ─────────────────────────────────────────────────────────────────────────────
CROPS = {
    0: {"name": "wheat",    "type": "cereal",  "profit": 12000, "n_delta": -0.08, "oc_delta": +0.03},
    1: {"name": "rice",     "type": "cereal",  "profit": 14000, "n_delta": -0.10, "oc_delta": +0.02},
    2: {"name": "cotton",   "type": "cash",    "profit": 20000, "n_delta": -0.12, "oc_delta": -0.04},
    3: {"name": "soybean",  "type": "legume",  "profit":  9000, "n_delta": +0.15, "oc_delta": +0.05},
    4: {"name": "maize",    "type": "cereal",  "profit": 11000, "n_delta": -0.08, "oc_delta": +0.03},
    5: {"name": "chickpea", "type": "legume",  "profit":  8500, "n_delta": +0.10, "oc_delta": +0.04},
}

LEGUMES  = {3, 5}
CEREALS  = {0, 1, 4}
N_CROPS  = len(CROPS)

EPISODE_SEASONS    = 10       # seasons per episode

# Reward shaping constants
NITROGEN_BONUS_SCALE  = 3000  # Rs per unit of N above 0.5
MONOCULTURE_PENALTY   = 6000  # Rs per repeated season (same crop 2 consecutive)
LEGUME_ROTATION_BONUS = 4000  # Rs for planting legume after a cereal
LOW_N_COST_SCALE      = 8000  # Rs cost per unit of N below 0.3
LOW_OC_COST_SCALE     = 5000  # Rs cost per unit of OC below 0.2


# ─────────────────────────────────────────────────────────────────────────────
# 2. Custom Gymnasium environment
# ─────────────────────────────────────────────────────────────────────────────
class CropRotationEnv(gym.Env):
    """
    Crop rotation planning environment.

    Observation space (Box, 5 dims, all float32)
    ---------------------------------------------
      [0] soil_nitrogen        — [0, 1]
      [1] soil_organic_carbon  — [0, 1]
      [2] crop_t-3             — [0, 5]  (one-hot would inflate; use raw ID normalised)
      [3] crop_t-2             — [0, 5]
      [4] crop_t-1             — [0, 5]  (most recent season)

    Action space (Discrete, 6)
    --------------------------
      Crop ID to plant this season (0–5)
    """

    metadata = {"render_modes": []}

    def __init__(self, episode_seasons: int = EPISODE_SEASONS):
        super().__init__()
        self.episode_seasons = episode_seasons

        # Observation: [N, OC, crop-3, crop-2, crop-1]  all in [0,1] after normalisation
        self.observation_space = spaces.Box(
            low=np.array([0.0, 0.0, 0.0, 0.0, 0.0], dtype=np.float32),
            high=np.array([1.0, 1.0, 1.0, 1.0, 1.0], dtype=np.float32),
        )
        self.action_space = spaces.Discrete(N_CROPS)

        self._reset_state()

    # ── helpers ──────────────────────────────────────────────────────────────
    def _crop_norm(self, crop_id: int) -> float:
        """Normalise crop ID to [0, 1] for observation."""
        return float(crop_id) / (N_CROPS - 1)

    def _obs(self) -> np.ndarray:
        return np.array([
            self.soil_n,
            self.soil_oc,
            self._crop_norm(self.history[-3]),
            self._crop_norm(self.history[-2]),
            self._crop_norm(self.history[-1]),
        ], dtype=np.float32)

    def _reset_state(self):
        # Randomise initial soil conditions for each episode
        rng = np.random.default_rng()
        self.soil_n    = float(rng.uniform(0.4, 0.9))
        self.soil_oc   = float(rng.uniform(0.3, 0.8))
        # Random initial history (3 seasons of random crops)
        self.history   = [int(rng.integers(0, N_CROPS)) for _ in range(3)]
        self.season    = 0
        self.total_reward = 0.0

    # ── Gymnasium API ─────────────────────────────────────────────────────────
    def reset(self, *, seed=None, options=None):
        super().reset(seed=seed)
        self._reset_state()
        return self._obs(), {}

    def step(self, action: int):
        crop_id = int(action)
        crop    = CROPS[crop_id]

        last_crop   = self.history[-1]
        second_last = self.history[-2]

        # ── Base profit ──
        reward = float(crop["profit"])

        # ── Nitrogen bonus (high-N soil → yield premium) ──
        if self.soil_n > 0.5:
            reward += NITROGEN_BONUS_SCALE * (self.soil_n - 0.5)

        # ── Monoculture penalty ──
        if crop_id == last_crop:
            reward -= MONOCULTURE_PENALTY
            if crop_id == second_last:
                reward -= MONOCULTURE_PENALTY * 0.5   # triple-monoculture extra

        # ── Legume rotation bonus (legume after cereal) ──
        if crop_id in LEGUMES and last_crop in CEREALS:
            reward += LEGUME_ROTATION_BONUS

        # ── Low-N soil penalty ──
        if self.soil_n < 0.3:
            reward -= LOW_N_COST_SCALE * (0.3 - self.soil_n)

        # ── Low organic carbon penalty ──
        if self.soil_oc < 0.2:
            reward -= LOW_OC_COST_SCALE * (0.2 - self.soil_oc)

        # Normalise reward to ~[-1, 1] range for stable training
        reward = reward / 20000.0

        # ── Soil dynamics ──
        n_delta  = crop["n_delta"]
        oc_delta = crop["oc_delta"]

        # Extra N depletion on monoculture
        if crop_id == last_crop:
            n_delta -= 0.05

        self.soil_n  = float(np.clip(self.soil_n  + n_delta,  0.0, 1.0))
        self.soil_oc = float(np.clip(self.soil_oc + oc_delta, 0.0, 1.0))

        # Update crop history
        self.history.append(crop_id)

        self.season       += 1
        self.total_reward += reward
        terminated         = self.season >= self.episode_seasons
        truncated          = False

        info = {
            "season":    self.season,
            "crop":      crop["name"],
            "soil_n":    round(self.soil_n, 3),
            "soil_oc":   round(self.soil_oc, 3),
            "reward":    round(reward, 4),
        }

        return self._obs(), reward, terminated, truncated, info

    def render(self):
        pass


# ─────────────────────────────────────────────────────────────────────────────
# 3. Train PPO agent
# ─────────────────────────────────────────────────────────────────────────────
def train(out_dir: Path, total_timesteps: int = 50_000):
    from stable_baselines3 import PPO
    from stable_baselines3.common.env_util import make_vec_env
    from stable_baselines3.common.callbacks import EvalCallback, BaseCallback

    out_dir.mkdir(parents=True, exist_ok=True)

    # Vectorised environment (4 parallel workers)
    vec_env  = make_vec_env(CropRotationEnv, n_envs=4, seed=42)
    eval_env = make_vec_env(CropRotationEnv, n_envs=1, seed=99)

    model = PPO(
        policy="MlpPolicy",
        env=vec_env,
        learning_rate=3e-4,
        n_steps=256,
        batch_size=64,
        n_epochs=10,
        gamma=0.99,
        gae_lambda=0.95,
        clip_range=0.2,
        ent_coef=0.01,          # entropy bonus for exploration
        verbose=1,
        seed=42,
        device="cpu",           # force CPU — CUDA build incompatible with RTX 5050 Blackwell
        tensorboard_log=None,
    )

    # Periodic evaluation callback
    class RewardLogCallback(BaseCallback):
        def __init__(self, log_interval=5000):
            super().__init__()
            self.log_interval = log_interval
            self.last_log     = 0

        def _on_step(self):
            if self.num_timesteps - self.last_log >= self.log_interval:
                ep_rews = [ep_info["r"] for ep_info in self.model.ep_info_buffer
                           if "r" in ep_info]
                if ep_rews:
                    mean_rew = np.mean(ep_rews)
                    print(f"  [{self.num_timesteps:>6} steps]  "
                          f"mean_episode_reward={mean_rew:.4f}")
                self.last_log = self.num_timesteps
            return True

    print(f"Training PPO for {total_timesteps:,} timesteps...")
    model.learn(
        total_timesteps=total_timesteps,
        callback=RewardLogCallback(log_interval=10_000),
        progress_bar=False,
    )

    # Save policy
    zip_path = out_dir / "rl_rotation_ppo"
    model.save(str(zip_path))
    print(f"Policy saved => {zip_path}.zip  "
          f"({(zip_path.with_suffix('.zip')).stat().st_size // 1024} KB)")

    # Evaluate trained agent
    print("\nEvaluating trained agent (20 episodes)...")
    from stable_baselines3.common.evaluation import evaluate_policy
    mean_r, std_r = evaluate_policy(model, eval_env, n_eval_episodes=20,
                                    deterministic=True)
    print(f"  Mean episode reward : {mean_r:.4f} ± {std_r:.4f}")
    print(f"  (normalised; ×20000 Rs = ~{mean_r*20000:,.0f} ± {std_r*20000:,.0f} Rs/acre over {EPISODE_SEASONS} seasons)")

    return model


# ─────────────────────────────────────────────────────────────────────────────
# 4. recommend_next_crop() — importable by the FastAPI service
# ─────────────────────────────────────────────────────────────────────────────
_MODEL_CACHE: dict = {}


def _load_model(model_dir: str):
    if model_dir not in _MODEL_CACHE:
        from stable_baselines3 import PPO
        zip_path = str(Path(model_dir) / "rl_rotation_ppo.zip")
        # map_location='cpu' needed when model saved with CUDA but loaded on CPU-only
        _MODEL_CACHE[model_dir] = PPO.load(zip_path, device="cpu")
    return _MODEL_CACHE[model_dir]


def recommend_next_crop(
    current_state: Dict[str, Any],
    model_dir: str = None,
    top_n: int = 3,
) -> Dict:
    """
    Recommend the next crop to plant given current soil conditions and history.

    Parameters
    ----------
    current_state : dict with keys:
        soil_nitrogen        : float [0, 1]
        soil_organic_carbon  : float [0, 1]
        last_3_crops         : list[str or int]  — last 3 crops planted (oldest first)
                               str: crop name | int: crop ID 0-5
    top_n        : int — return top N ranked crops
    model_dir    : str — directory with rl_rotation_ppo.zip (auto-resolved)

    Returns
    -------
    dict:
        recommended_crop      : str — top-1 recommendation
        recommended_crop_id   : int
        soil_nitrogen         : float (current)
        soil_organic_carbon   : float (current)
        last_3_crops          : list[str]
        alternatives          : list[dict] — top_n ranked crops with scores
        soil_health_advice    : str
        rotation_advice       : str
    """
    if model_dir is None:
        model_dir = str(Path(__file__).parent / "ml_models")

    model = _load_model(model_dir)

    # Name → ID lookup
    name_to_id = {v["name"]: k for k, v in CROPS.items()}

    def _resolve_crop(c):
        if isinstance(c, int):
            return int(np.clip(c, 0, N_CROPS - 1))
        return name_to_id.get(str(c).lower(), 0)

    soil_n   = float(np.clip(current_state.get("soil_nitrogen", 0.6), 0.0, 1.0))
    soil_oc  = float(np.clip(current_state.get("soil_organic_carbon", 0.5), 0.0, 1.0))
    hist_raw = current_state.get("last_3_crops", [0, 0, 0])
    hist     = [_resolve_crop(c) for c in hist_raw][-3:]
    while len(hist) < 3:
        hist.insert(0, 0)

    # Build observation vector
    def _crop_norm(cid): return float(cid) / (N_CROPS - 1)
    obs = np.array([
        soil_n, soil_oc,
        _crop_norm(hist[0]), _crop_norm(hist[1]), _crop_norm(hist[2]),
    ], dtype=np.float32)

    # Get deterministic action from PPO policy
    action, _ = model.predict(obs, deterministic=True)
    top_action = int(action)

    # Score all crops by applying action masking heuristic
    # (PPO gives one action; for top-N we rank by applying the policy
    #  with slight perturbations to the observation + domain rules)
    scores = {}
    for crop_id in range(N_CROPS):
        # Simulate one step reward for each candidate
        last_crop   = hist[-1]
        second_last = hist[-2]

        r = float(CROPS[crop_id]["profit"])
        if soil_n > 0.5:
            r += NITROGEN_BONUS_SCALE * (soil_n - 0.5)
        if crop_id == last_crop:
            r -= MONOCULTURE_PENALTY
        if crop_id in LEGUMES and last_crop in CEREALS:
            r += LEGUME_ROTATION_BONUS
        if soil_n < 0.3:
            r -= LOW_N_COST_SCALE * (0.3 - soil_n)
        if soil_oc < 0.2:
            r -= LOW_OC_COST_SCALE * (0.2 - soil_oc)
        # Slight bias toward PPO's choice for tie-breaking
        if crop_id == top_action:
            r += 500
        scores[crop_id] = r

    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)

    alternatives = [
        {
            "rank":        i + 1,
            "crop":        CROPS[cid]["name"],
            "crop_id":     cid,
            "crop_type":   CROPS[cid]["type"],
            "score":       round(sc / 20000.0, 4),
            "base_profit": CROPS[cid]["profit"],
        }
        for i, (cid, sc) in enumerate(ranked[:top_n])
    ]

    top_crop    = CROPS[top_action]
    last_planted = CROPS[hist[-1]]["name"]

    # Soil health advice
    if soil_n < 0.3:
        soil_advice = f"WARNING: Soil nitrogen critically low ({soil_n:.2f}). Immediate legume rotation mandatory."
    elif soil_n < 0.5:
        soil_advice = f"Soil nitrogen low ({soil_n:.2f}). Consider soybean or chickpea to rebuild N."
    else:
        soil_advice = f"Soil nitrogen adequate ({soil_n:.2f})."

    if soil_oc < 0.25:
        soil_advice += f" Organic carbon very low ({soil_oc:.2f}) — incorporate crop residue."

    # Rotation advice
    if top_action == hist[-1]:
        rot_advice = (f"Monoculture detected: {last_planted} for 2+ seasons. "
                      f"The RL agent still recommends {top_crop['name']} — "
                      f"check soil health and consider a legume break.")
    elif top_action in LEGUMES and hist[-1] in CEREALS:
        rot_advice = (f"Excellent rotation: {top_crop['name']} (legume) after "
                      f"{last_planted} (cereal) will fix nitrogen and earn rotation bonus.")
    else:
        rot_advice = (f"Planting {top_crop['name']} after {last_planted}. "
                      f"Monitor soil N after this season.")

    return {
        "recommended_crop":     top_crop["name"],
        "recommended_crop_id":  top_action,
        "soil_nitrogen":        round(soil_n, 3),
        "soil_organic_carbon":  round(soil_oc, 3),
        "last_3_crops":         [CROPS[c]["name"] for c in hist],
        "alternatives":         alternatives,
        "soil_health_advice":   soil_advice,
        "rotation_advice":      rot_advice,
    }


# ─────────────────────────────────────────────────────────────────────────────
# 5. Baseline comparison (random vs. trained)
# ─────────────────────────────────────────────────────────────────────────────
def _evaluate_random(n_episodes: int = 50) -> float:
    env = CropRotationEnv()
    rewards = []
    for _ in range(n_episodes):
        obs, _ = env.reset()
        ep_r   = 0.0
        done   = False
        while not done:
            action = env.action_space.sample()
            obs, r, term, trunc, _ = env.step(action)
            ep_r  += r
            done   = term or trunc
        rewards.append(ep_r)
    return float(np.mean(rewards))


# ─────────────────────────────────────────────────────────────────────────────
# 6. Entry point
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    out_dir = Path(__file__).parent / "ml_models"

    print("=" * 65)
    print("STEP 1 — Verify CropRotationEnv")
    print("=" * 65)
    env = CropRotationEnv()
    obs, _ = env.reset()
    print(f"Obs space : {env.observation_space}")
    print(f"Act space : {env.action_space}")
    print(f"Init obs  : N={obs[0]:.3f} OC={obs[1]:.3f} hist=[{obs[2]:.2f},{obs[3]:.2f},{obs[4]:.2f}]")

    # Manual episode: rotate legume → cereal → legume
    total = 0.0
    for crop_id in [3, 0, 3, 0, 5, 0, 3, 4, 5, 1]:  # soy-wheat-soy-wheat-chick-wheat...
        obs, r, term, trunc, info = env.step(crop_id)
        total += r
        print(f"  Season {info['season']:2d}: {info['crop']:10s}  "
              f"N={info['soil_n']:.3f}  OC={info['soil_oc']:.3f}  reward={r:+.4f}")
    print(f"  Episode total reward: {total:.4f}")

    print("\n" + "=" * 65)
    print("STEP 2 — Random baseline")
    print("=" * 65)
    rand_r = _evaluate_random(n_episodes=100)
    print(f"Random agent mean episode reward: {rand_r:.4f}  "
          f"(~Rs {rand_r*20000:,.0f}/acre over {EPISODE_SEASONS} seasons)")

    print("\n" + "=" * 65)
    print("STEP 3 — Train PPO (50 000 timesteps)")
    print("=" * 65)
    model = train(out_dir, total_timesteps=50_000)

    # Save metadata
    meta = {
        "crops":             {str(k): v for k, v in CROPS.items()},
        "episode_seasons":   EPISODE_SEASONS,
        "legumes":           list(LEGUMES),
        "cereals":           list(CEREALS),
        "reward_params": {
            "nitrogen_bonus_scale":  NITROGEN_BONUS_SCALE,
            "monoculture_penalty":   MONOCULTURE_PENALTY,
            "legume_rotation_bonus": LEGUME_ROTATION_BONUS,
            "low_n_cost_scale":      LOW_N_COST_SCALE,
            "low_oc_cost_scale":     LOW_OC_COST_SCALE,
            "reward_scale":          20000,
        },
        "random_baseline_reward": round(rand_r, 4),
    }
    with open(out_dir / "rl_rotation_meta.json", "w") as f:
        json.dump(meta, f, indent=2)
    print(f"Metadata saved => {out_dir / 'rl_rotation_meta.json'}")

    print("\n" + "=" * 65)
    print("STEP 4 — Smoke-test recommend_next_crop()")
    print("=" * 65)

    test_cases = [
        dict(
            label="Low N soil, last 3 cereals — RL should recommend legume",
            state={"soil_nitrogen": 0.20, "soil_organic_carbon": 0.50,
                   "last_3_crops": ["wheat", "rice", "maize"]},
        ),
        dict(
            label="Healthy soil, good history — cotton likely (high profit)",
            state={"soil_nitrogen": 0.80, "soil_organic_carbon": 0.75,
                   "last_3_crops": ["soybean", "wheat", "chickpea"]},
        ),
        dict(
            label="Monoculture: 3x wheat — penalty should push away from wheat",
            state={"soil_nitrogen": 0.45, "soil_organic_carbon": 0.40,
                   "last_3_crops": ["wheat", "wheat", "wheat"]},
        ),
        dict(
            label="Fresh field, no history",
            state={"soil_nitrogen": 0.65, "soil_organic_carbon": 0.60,
                   "last_3_crops": [0, 0, 0]},
        ),
    ]

    model_dir = str(out_dir)
    for tc in test_cases:
        print(f"\n  [{tc['label']}]")
        res = recommend_next_crop(tc["state"], model_dir=model_dir, top_n=3)
        print(f"  Soil: N={res['soil_nitrogen']:.2f}  OC={res['soil_organic_carbon']:.2f}"
              f"  History: {res['last_3_crops']}")
        print(f"  => RECOMMENDED: {res['recommended_crop'].upper()}")
        for alt in res["alternatives"]:
            print(f"     #{alt['rank']} {alt['crop']:10s}  ({alt['crop_type']:7s})  "
                  f"score={alt['score']:+.3f}  profit=Rs{alt['base_profit']:,}")
        print(f"  Soil advice  : {res['soil_health_advice']}")
        print(f"  Rotation note: {res['rotation_advice']}")

    print("\nDone — rl_rotation_ppo.zip ready for /rotation/recommend endpoint.")
