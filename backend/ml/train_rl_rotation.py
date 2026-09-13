"""
Crop-Rotation RL Training Script
=================================
Run from the repo root (Unified Precision Agriculture Platform/) with:

    backend\\venv\\Scripts\\python backend\\ml\\train_rl_rotation.py

Expected runtime on CPU: ~2-4 minutes for 50,000 PPO timesteps.

Saves: backend/ml_models/rl_rotation_model.zip
"""

import os
import sys

import gymnasium as gym
import numpy as np
from gymnasium import spaces
from stable_baselines3 import PPO
from stable_baselines3.common.env_checker import check_env
from stable_baselines3.common.monitor import Monitor

# ---------------------------------------------------------------------------
# Constants — 6-crop set
# ---------------------------------------------------------------------------
CROPS = ["rice", "wheat", "maize", "soybean", "groundnut", "cotton"]
N_CROPS = len(CROPS)
CROP_IDX = {c: i for i, c in enumerate(CROPS)}
LEGUMES = {"soybean", "groundnut"}  # nitrogen-fixing crops

# Agro-economic profit estimates (Rs/acre, rough averages for India)
BASE_PROFIT = {
    "rice":      22000.0,
    "wheat":     18000.0,
    "maize":     15000.0,
    "soybean":   16000.0,
    "groundnut": 20000.0,
    "cotton":    25000.0,
}

# Soil nitrogen change per crop per season (kg/ha equivalent, positive = improvement)
N_IMPACT = {
    "rice":      -8.0,
    "wheat":    -10.0,
    "maize":    -12.0,
    "soybean":  +15.0,   # N-fixing
    "groundnut": +12.0,  # N-fixing
    "cotton":    -9.0,
}

# Soil organic carbon (SOC) change per crop (% equivalent)
SOC_IMPACT = {
    "rice":       0.5,
    "wheat":     -0.3,
    "maize":     -0.5,
    "soybean":    0.8,
    "groundnut":  0.6,
    "cotton":    -0.4,
}


# ---------------------------------------------------------------------------
# Custom Gymnasium Environment
# ---------------------------------------------------------------------------
class CropRotationEnv(gym.Env):
    """
    State space:
      - soil_nitrogen         : float in [0, 100]
      - soil_organic_carbon   : float in [0, 100]
      - one-hot last_3_crops  : 3 × N_CROPS binary flags (18 dims total)
    Total observation dim = 2 + 3*6 = 20

    Action space:
      - Discrete(6): pick one of the 6 crops to plant next season

    Episode length: 5 seasons
    """

    metadata = {"render_modes": []}

    def __init__(self):
        super().__init__()

        obs_dim = 2 + 3 * N_CROPS  # 20
        self.observation_space = spaces.Box(
            low=0.0, high=1.0, shape=(obs_dim,), dtype=np.float32
        )
        self.action_space = spaces.Discrete(N_CROPS)

        self.max_seasons = 5
        self._season = 0
        self._soil_n = 50.0
        self._soil_soc = 50.0
        self._last_3: list[int] = [-1, -1, -1]  # -1 = no crop yet

    # ------------------------------------------------------------------
    def _make_obs(self) -> np.ndarray:
        obs = np.zeros(2 + 3 * N_CROPS, dtype=np.float32)
        obs[0] = np.clip(self._soil_n / 100.0, 0.0, 1.0)
        obs[1] = np.clip(self._soil_soc / 100.0, 0.0, 1.0)
        for slot, crop_idx in enumerate(self._last_3):
            if crop_idx >= 0:
                obs[2 + slot * N_CROPS + crop_idx] = 1.0
        return obs

    # ------------------------------------------------------------------
    def reset(self, *, seed=None, options=None):
        super().reset(seed=seed)
        # Randomise initial soil conditions for diversity
        self._soil_n = float(self.np_random.uniform(20, 80))
        self._soil_soc = float(self.np_random.uniform(20, 80))
        self._last_3 = [-1, -1, -1]
        self._season = 0
        return self._make_obs(), {}

    # ------------------------------------------------------------------
    def step(self, action: int):
        assert self.action_space.contains(action)
        crop = CROPS[action]

        # ---------- Reward components ----------
        # 1. Base profit (normalised to ~1.0 scale)
        profit = BASE_PROFIT[crop] / 25000.0

        # 2. Soil degradation penalty: same crop 2+ consecutive times
        consecutive = sum(1 for c in self._last_3 if c == action)
        degradation_penalty = 0.0
        if self._last_3[-1] == action:
            degradation_penalty = 0.3 * consecutive  # escalating penalty

        # 3. Soil recovery bonus: legume follows non-legume
        recovery_bonus = 0.0
        prev_crop = CROPS[self._last_3[-1]] if self._last_3[-1] >= 0 else None
        if crop in LEGUMES and (prev_crop is None or prev_crop not in LEGUMES):
            recovery_bonus = 0.25

        # 4. Nitrogen-stress penalty: low soil N hurts non-legume crops
        n_stress_penalty = 0.0
        if crop not in LEGUMES and self._soil_n < 30:
            n_stress_penalty = 0.15 * ((30 - self._soil_n) / 30.0)

        reward = profit - degradation_penalty + recovery_bonus - n_stress_penalty

        # ---------- Update soil state ----------
        self._soil_n = np.clip(self._soil_n + N_IMPACT[crop], 0, 100)
        self._soil_soc = np.clip(self._soil_soc + SOC_IMPACT[crop], 0, 100)

        # ---------- Update crop history ----------
        self._last_3 = self._last_3[1:] + [action]
        self._season += 1

        terminated = self._season >= self.max_seasons
        truncated = False

        return self._make_obs(), float(reward), terminated, truncated, {}

    # ------------------------------------------------------------------
    def render(self):
        pass


# ---------------------------------------------------------------------------
# Training
# ---------------------------------------------------------------------------
def train():
    os.makedirs("backend/ml_models", exist_ok=True)

    print("=== Crop-Rotation RL Training ===")
    print(f"Crops:    {CROPS}")
    print(f"Episode:  {CropRotationEnv().max_seasons} seasons")
    print(f"Timesteps: 50,000")
    print()

    env = Monitor(CropRotationEnv())
    print("Checking environment compatibility with Gym API...")
    check_env(CropRotationEnv(), warn=True)
    print("Environment OK.")
    print()

    model = PPO(
        policy="MlpPolicy",
        env=env,
        learning_rate=3e-4,
        n_steps=256,           # steps per rollout (small = fast on CPU)
        batch_size=64,
        n_epochs=10,
        gamma=0.99,
        gae_lambda=0.95,
        clip_range=0.2,
        ent_coef=0.01,         # small entropy bonus for exploration
        verbose=1,
        seed=42,
        device="cpu",
    )

    print("Training PPO for 50,000 timesteps...")
    model.learn(total_timesteps=50_000, progress_bar=False)
    print()

    save_path = "backend/ml_models/rl_rotation_model"
    model.save(save_path)
    print(f"Model saved to {save_path}.zip")

    # Quick evaluation
    print()
    print("=== Quick Evaluation (5 sample episodes) ===")
    eval_env = CropRotationEnv()
    total_rewards = []
    for ep in range(5):
        obs, _ = eval_env.reset()
        ep_reward = 0.0
        season_sequence = []
        done = False
        while not done:
            action, _ = model.predict(obs, deterministic=True)
            obs, reward, terminated, truncated, _ = eval_env.step(int(action))
            ep_reward += reward
            season_sequence.append(CROPS[int(action)])
            done = terminated or truncated
        total_rewards.append(ep_reward)
        print(f"  Episode {ep+1}: crops={season_sequence}  total_reward={ep_reward:.3f}")

    print(f"\nMean episode reward: {np.mean(total_rewards):.3f}")
    print()
    print("Training complete. Run your prediction via:")
    print("  from app.services.ml_rotation import predict")
    print("  predict(soil_nitrogen=45, soil_organic_carbon=60, last_3_crops=['rice','wheat','rice'])")


if __name__ == "__main__":
    # Allow running from repo root or from backend/
    if not os.path.exists("backend"):
        os.chdir("..")
    train()
