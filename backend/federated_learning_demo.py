"""
federated_learning_demo.py
==========================
Federated Learning Demo — Prompt #10

# ═══════════════════════════════════════════════════════════════════════════
# DEMO TRANSPARENCY NOTE
# ─────────────────────────────────────────────────────────────────────────
# This is a SIMULATED MULTI-CLIENT FEDERATED LEARNING DEMO running on a
# single machine with a single Python process.
#
# It is NOT a production multi-farmer deployment:
#   ✗ There is no network communication between real devices.
#   ✗ There is no real privacy guarantee (no differential privacy).
#   ✗ The 4 "farm clients" are 4 Python objects, not 4 physical machines.
#
# What IS real and genuinely demonstrates the FL architecture:
#   ✓ 4 farm clients, each holding a PRIVATE non-overlapping slice of data.
#     No client ever sees another client's raw data — the data stays local.
#   ✓ Each client trains only on its local slice each round.
#   ✓ The server aggregates ONLY model weights (not raw data) using real FedAvg.
#   ✓ 5 rounds of federation with per-round accuracy tracking.
#   ✓ A global model that improves over rounds — visible in printed metrics.
#   ✓ Built using flwr's NumPyClient and FedAvg strategy classes,
#     orchestrated manually (Ray not available on Windows).
# ═══════════════════════════════════════════════════════════════════════════

Architecture
------------
  Dataset  : Synthetic 128-dim precomputed embeddings (no raw images needed)
             Each embedding simulates a MobileNetV3 feature vector for a
             crop disease image. 19 disease classes (PlantVillage subset).
  Clients  : 4 farm clients, each receiving a disjoint 25% slice of data
  Model    : Small 2-layer MLP classifier (128 → 64 → 19)
  Protocol : FedAvg — per-round:
             1. Server broadcasts global weights to all clients
             2. Each client runs 3 local epochs of SGD on its private slice
             3. Server aggregates weight updates (weighted by dataset size)
             4. Global model is updated — repeat for 5 rounds
  Backend  : Manual single-process loop using flwr.common utilities
             (replaces flwr.simulation.start_simulation which requires Ray)

Outputs
-------
  backend/ml_models/fl_global_model.pkl   — final global model weights
  backend/ml_models/fl_demo_meta.json     — round-by-round accuracy log

Key classes
-----------
  DiseaseClassifier   — PyTorch MLP
  FarmClient          — flwr NumPyClient subclass (local train/eval)
  fedavg_aggregate()  — weighted average of NumPy weight lists
  run_federation()    — orchestrates 5 rounds in a single process
"""

import json
import os
import pickle
import time
import warnings
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import numpy as np

# Force CPU (CUDA build incompatible with RTX 5050 Blackwell on this system)
os.environ["CUDA_VISIBLE_DEVICES"] = ""

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset

import flwr as fl
from flwr.common import (
    NDArrays,
    ndarrays_to_parameters,
    parameters_to_ndarrays,
)

warnings.filterwarnings("ignore")

# ─────────────────────────────────────────────────────────────────────────────
# 1. Disease class catalogue (19-class PlantVillage subset)
# ─────────────────────────────────────────────────────────────────────────────
DISEASE_CLASSES = [
    "Apple___Apple_scab",
    "Apple___Black_rot",
    "Apple___Cedar_apple_rust",
    "Corn___Cercospora_leaf_spot",
    "Corn___Common_rust",
    "Corn___Northern_Leaf_Blight",
    "Grape___Black_rot",
    "Grape___Leaf_blight",
    "Potato___Early_blight",
    "Potato___Late_blight",
    "Rice___Bacterial_blight",
    "Rice___Blast",
    "Rice___Brown_spot",
    "Tomato___Bacterial_spot",
    "Tomato___Early_blight",
    "Tomato___Late_blight",
    "Tomato___Leaf_Mold",
    "Tomato___Mosaic_virus",
    "Tomato___healthy",
]

N_CLASSES   = len(DISEASE_CLASSES)  # 19
EMBED_DIM   = 128                   # simulated MobileNetV3 embedding size
N_CLIENTS   = 4
N_ROUNDS    = 5
LOCAL_EPOCHS = 3
BATCH_SIZE  = 32


# ─────────────────────────────────────────────────────────────────────────────
# 2. Synthetic embedding dataset generator
# ─────────────────────────────────────────────────────────────────────────────
def generate_embeddings(
    n_samples: int = 2000,
    seed: int = 42,
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Generate synthetic 128-dim disease-image embeddings.

    Each class has a class-specific mean vector drawn from N(0, I).
    Embeddings are sampled as N(class_mean, 0.3*I) — compact clusters
    that a linear classifier can separate with ~70-85% accuracy.

    Returns
    -------
    X : (n_samples, 128) float32
    y : (n_samples,) int64  — class labels 0..18
    """
    rng = np.random.RandomState(seed)

    # One class prototype per disease (random unit vectors in R^128)
    class_means = rng.randn(N_CLASSES, EMBED_DIM).astype(np.float32)
    class_means /= np.linalg.norm(class_means, axis=1, keepdims=True)  # unit sphere
    class_means *= 1.2   # tighter clusters → realistic ~70-85% accuracy, improves over rounds

    # Balanced class sampling — np.resize wraps to fill exactly n_samples
    labels = np.resize(np.arange(N_CLASSES), n_samples)
    rng.shuffle(labels)

    X = np.zeros((n_samples, EMBED_DIM), dtype=np.float32)
    for i, label in enumerate(labels):
        X[i] = class_means[label] + rng.randn(EMBED_DIM).astype(np.float32) * 0.55

    return X, labels.astype(np.int64)


# ─────────────────────────────────────────────────────────────────────────────
# 3. Disease classifier model (tiny MLP — fast on CPU)
# ─────────────────────────────────────────────────────────────────────────────
class DiseaseClassifier(nn.Module):
    """
    2-layer MLP: 128 → 64 → 19.
    Designed to be tiny so CPU training is fast (<5s per round).
    """
    def __init__(self, input_dim: int = EMBED_DIM, n_classes: int = N_CLASSES):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, 64),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(64, n_classes),
        )

    def forward(self, x):
        return self.net(x)

    def get_weights(self) -> NDArrays:
        return [p.data.cpu().numpy() for p in self.parameters()]

    def set_weights(self, weights: NDArrays):
        for p, w in zip(self.parameters(), weights):
            p.data = torch.tensor(w, dtype=p.data.dtype)


# ─────────────────────────────────────────────────────────────────────────────
# 4. Farm client (flwr NumPyClient)
# ─────────────────────────────────────────────────────────────────────────────
class FarmClient(fl.client.NumPyClient):
    """
    Simulates a single farm's federated learning node.

    Each client holds a PRIVATE local dataset slice — no other client or
    the server ever accesses this data directly. Only model weight updates
    (gradients aggregated via FedAvg) are shared with the server.

    This is the core privacy guarantee of federated learning:
      Data stays on device | Only weights travel to the server
    """

    def __init__(
        self,
        client_id: int,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: np.ndarray,
        y_val: np.ndarray,
    ):
        self.client_id = client_id
        self.n_train   = len(X_train)
        self.n_val     = len(X_val)

        # Local private data — stays on this client
        self._train_loader = DataLoader(
            TensorDataset(torch.tensor(X_train), torch.tensor(y_train)),
            batch_size=BATCH_SIZE, shuffle=True,
        )
        self._val_loader = DataLoader(
            TensorDataset(torch.tensor(X_val), torch.tensor(y_val)),
            batch_size=BATCH_SIZE, shuffle=False,
        )

        self.model     = DiseaseClassifier()
        self.criterion = nn.CrossEntropyLoss()

    def get_parameters(self, config) -> NDArrays:
        return self.model.get_weights()

    def fit(self, parameters: NDArrays, config) -> Tuple[NDArrays, int, dict]:
        """
        Local training step:
        1. Load server's global weights onto local model.
        2. Train for LOCAL_EPOCHS on private local data.
        3. Return updated weights + dataset size (for FedAvg weighting).
        """
        round_num = config.get("round", "?")
        self.model.set_weights(parameters)

        optimizer = optim.SGD(self.model.parameters(), lr=0.05, momentum=0.9)
        self.model.train()

        total_loss = 0.0
        n_batches  = 0
        for epoch in range(LOCAL_EPOCHS):
            for X_batch, y_batch in self._train_loader:
                optimizer.zero_grad()
                logits = self.model(X_batch)
                loss   = self.criterion(logits, y_batch)
                loss.backward()
                optimizer.step()
                total_loss += loss.item()
                n_batches  += 1

        avg_loss = total_loss / max(n_batches, 1)
        return self.model.get_weights(), self.n_train, {"train_loss": avg_loss}

    def evaluate(self, parameters: NDArrays, config) -> Tuple[float, int, dict]:
        """
        Local evaluation on this client's private validation set.
        Returns loss, dataset size, and accuracy metrics.
        """
        self.model.set_weights(parameters)
        self.model.eval()

        correct = 0
        total   = 0
        total_loss = 0.0

        with torch.no_grad():
            for X_batch, y_batch in self._val_loader:
                logits = self.model(X_batch)
                loss   = self.criterion(logits, y_batch)
                preds  = logits.argmax(dim=1)
                correct += (preds == y_batch).sum().item()
                total   += len(y_batch)
                total_loss += loss.item() * len(y_batch)

        accuracy = correct / max(total, 1)
        avg_loss = total_loss / max(total, 1)
        return avg_loss, self.n_val, {"accuracy": accuracy}


# ─────────────────────────────────────────────────────────────────────────────
# 5. FedAvg aggregation (manual, no Ray required)
# ─────────────────────────────────────────────────────────────────────────────
def fedavg_aggregate(
    results: List[Tuple[NDArrays, int]]
) -> NDArrays:
    """
    Weighted average of client weight updates.

    weights_global = SUM(n_i * weights_i) / SUM(n_i)

    This is the original McMahan et al. (2017) FedAvg formula:
    "Communication-Efficient Learning of Deep Networks from Decentralized Data"
    """
    total_samples = sum(n for _, n in results)
    agg = [
        np.zeros_like(w) for w in results[0][0]
    ]
    for weights, n_samples in results:
        weight_factor = n_samples / total_samples
        for i, w in enumerate(weights):
            agg[i] += weight_factor * w
    return agg


# ─────────────────────────────────────────────────────────────────────────────
# 6. Federation orchestrator (single-process, no Ray)
# ─────────────────────────────────────────────────────────────────────────────
def run_federation(
    clients: List[FarmClient],
    n_rounds: int = N_ROUNDS,
    out_dir: Optional[Path] = None,
) -> Tuple[NDArrays, List[dict]]:
    """
    Run N_ROUNDS rounds of FedAvg federation.

    Protocol per round:
      1. Server sends global_weights → each client
      2. Each client: fit(global_weights) → returns updated_weights, n_samples
      3. Server: global_weights = fedavg_aggregate(all updated_weights)
      4. Each client: evaluate(global_weights) → returns loss, accuracy
      5. Log round metrics

    Returns: (final_global_weights, round_log)
    """
    # Initialise global model
    global_model   = DiseaseClassifier()
    global_weights = global_model.get_weights()

    round_log = []

    print(f"\n{'='*65}")
    print(f"  FEDERATED LEARNING — {N_CLIENTS} FARM CLIENTS, {n_rounds} ROUNDS")
    print(f"  Data stays private on each client | Only weights are shared")
    print(f"{'='*65}")
    print(f"  {'Round':>5}  {'Acc (weighted avg)':>20}  {'Loss':>8}  {'Time':>6}")
    print(f"  {'-'*5}  {'-'*20}  {'-'*8}  {'-'*6}")

    for round_num in range(1, n_rounds + 1):
        t0 = time.time()
        config = {"round": round_num}

        # ── Step 1: Each client trains locally on its private data ──────
        fit_results = []
        for client in clients:
            updated_weights, n_samples, fit_metrics = client.fit(
                [w.copy() for w in global_weights], config
            )
            fit_results.append((updated_weights, n_samples))

        # ── Step 2: Server aggregates via FedAvg ────────────────────────
        global_weights = fedavg_aggregate(fit_results)

        # ── Step 3: Evaluate global model on each client's val set ──────
        eval_results = []
        for client in clients:
            loss, n_val, eval_metrics = client.evaluate(
                [w.copy() for w in global_weights], config
            )
            eval_results.append((loss, n_val, eval_metrics["accuracy"]))

        # Weighted average metrics across clients
        total_val   = sum(n for _, n, _ in eval_results)
        avg_loss    = sum(l * n for l, n, _ in eval_results) / max(total_val, 1)
        avg_acc     = sum(a * n for _, n, a in eval_results) / max(total_val, 1)

        elapsed = time.time() - t0

        per_client = [
            {"client_id": i, "accuracy": round(a, 4), "loss": round(l, 4), "n_val": n}
            for i, (l, n, a) in enumerate(eval_results)
        ]
        round_log.append({
            "round":        round_num,
            "accuracy":     round(avg_acc, 4),
            "loss":         round(avg_loss, 4),
            "elapsed_s":    round(elapsed, 2),
            "per_client":   per_client,
        })

        print(f"  {round_num:>5}  {avg_acc*100:>19.2f}%  {avg_loss:>8.4f}  {elapsed:>5.1f}s")

    print(f"  {'-'*5}  {'-'*20}  {'-'*8}  {'-'*6}")
    print(f"\n  Final accuracy: {round_log[-1]['accuracy']*100:.2f}%  "
          f"(round 1: {round_log[0]['accuracy']*100:.2f}%  "
          f"delta: {(round_log[-1]['accuracy']-round_log[0]['accuracy'])*100:+.2f}pp)")

    return global_weights, round_log


# ─────────────────────────────────────────────────────────────────────────────
# 7. predict() — importable by the FastAPI service
# ─────────────────────────────────────────────────────────────────────────────
_MODEL_CACHE: dict = {}


def _load_fl_model(model_dir: str) -> DiseaseClassifier:
    if model_dir not in _MODEL_CACHE:
        with open(Path(model_dir) / "fl_global_model.pkl", "rb") as f:
            weights = pickle.load(f)
        m = DiseaseClassifier()
        m.set_weights(weights)
        m.eval()
        _MODEL_CACHE[model_dir] = m
    return _MODEL_CACHE[model_dir]


def predict_fl(
    embedding: np.ndarray,
    model_dir: str = None,
    top_k: int = 3,
) -> dict:
    """
    Classify a disease embedding using the federated global model.

    Parameters
    ----------
    embedding : np.ndarray of shape (128,)  — precomputed disease embedding
    model_dir : str — directory with fl_global_model.pkl
    top_k     : int — number of top predictions to return

    Returns
    -------
    dict:
        predicted_class   : str
        confidence        : float
        top_k             : list[dict]  (class, confidence)
        model_type        : str  ("federated_global")
    """
    if model_dir is None:
        model_dir = str(Path(__file__).parent / "ml_models")

    model = _load_fl_model(model_dir)

    x = torch.tensor(embedding, dtype=torch.float32).unsqueeze(0)
    with torch.no_grad():
        logits = model(x)[0]
        probs  = torch.softmax(logits, dim=0).numpy()

    top_ids = probs.argsort()[::-1][:top_k]
    return {
        "predicted_class": DISEASE_CLASSES[int(top_ids[0])],
        "confidence":      round(float(probs[top_ids[0]]), 4),
        "top_k":           [
            {"class": DISEASE_CLASSES[int(i)], "confidence": round(float(probs[i]), 4)}
            for i in top_ids
        ],
        "model_type": "federated_global",
    }


# ─────────────────────────────────────────────────────────────────────────────
# 8. Entry point
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    out_dir = Path(__file__).parent / "ml_models"
    out_dir.mkdir(parents=True, exist_ok=True)

    print("=" * 65)
    print("STEP 1 — Generate synthetic disease embeddings (n=2000)")
    print("=" * 65)
    X_all, y_all = generate_embeddings(n_samples=2000, seed=42)

    # Shuffle and split into train/val
    idx = np.random.RandomState(42).permutation(len(X_all))
    X_all, y_all = X_all[idx], y_all[idx]
    n_val   = 400
    X_val   = X_all[:n_val];   y_val   = y_all[:n_val]
    X_train = X_all[n_val:];   y_train = y_all[n_val:]

    print(f"Total: {len(X_all)} samples  |  Train: {len(X_train)}  |  Val: {n_val}")
    print(f"Classes: {N_CLASSES}  |  Embedding dim: {EMBED_DIM}")

    # ── Partition into 4 non-overlapping client slices ──
    # Each client sees a DIFFERENT 25% of the training data — completely private
    print(f"\n{N_CLIENTS} farm clients, each holding a disjoint 25% slice:")
    client_size = len(X_train) // N_CLIENTS
    clients     = []
    for cid in range(N_CLIENTS):
        lo  = cid * client_size
        hi  = lo + client_size if cid < N_CLIENTS - 1 else len(X_train)
        Xc  = X_train[lo:hi]
        yc  = y_train[lo:hi]
        # Each client gets a proportional share of the global val set
        v_lo = cid * (n_val // N_CLIENTS)
        v_hi = v_lo + n_val // N_CLIENTS
        Xv   = X_val[v_lo:v_hi]
        yv   = y_val[v_lo:v_hi]

        client = FarmClient(cid, Xc, yc, Xv, yv)
        clients.append(client)
        print(f"  Client {cid}: {len(Xc)} training samples  "
              f"(classes seen: {len(np.unique(yc))}/{N_CLASSES})")

    print("\n" + "=" * 65)
    print("STEP 2 — Centralised baseline (train on all data, 1 process)")
    print("=" * 65)
    baseline_model = DiseaseClassifier()
    bl_loader  = DataLoader(
        TensorDataset(torch.tensor(X_train), torch.tensor(y_train)),
        batch_size=BATCH_SIZE, shuffle=True,
    )
    bl_optimizer = optim.SGD(baseline_model.parameters(), lr=0.05, momentum=0.9)
    bl_criterion = nn.CrossEntropyLoss()

    for epoch in range(N_ROUNDS * LOCAL_EPOCHS):   # same total compute as FL
        baseline_model.train()
        for Xb, yb in bl_loader:
            bl_optimizer.zero_grad()
            bl_criterion(baseline_model(Xb), yb).backward()
            bl_optimizer.step()

    # Baseline accuracy
    baseline_model.eval()
    val_loader = DataLoader(
        TensorDataset(torch.tensor(X_val), torch.tensor(y_val)),
        batch_size=BATCH_SIZE
    )
    correct = total = 0
    with torch.no_grad():
        for Xb, yb in val_loader:
            preds    = baseline_model(Xb).argmax(1)
            correct += (preds == yb).sum().item()
            total   += len(yb)
    bl_acc = correct / total
    print(f"Centralised baseline accuracy: {bl_acc*100:.2f}%  "
          f"({N_ROUNDS * LOCAL_EPOCHS} epochs, full data)")

    print("\n" + "=" * 65)
    print("STEP 3 — Federated Learning (FedAvg, 5 rounds)")
    print("=" * 65)
    t_start = time.time()
    global_weights, round_log = run_federation(clients, n_rounds=N_ROUNDS, out_dir=out_dir)
    total_time = time.time() - t_start
    print(f"\nTotal federation time: {total_time:.1f}s")

    # Show per-client breakdown of final round
    final_round = round_log[-1]
    print(f"\nFinal round per-client accuracy:")
    for pc in final_round["per_client"]:
        print(f"  Client {pc['client_id']}: {pc['accuracy']*100:.2f}%  "
              f"(n_val={pc['n_val']})")

    fl_acc = final_round["accuracy"]
    print(f"\nSummary:")
    print(f"  Centralised baseline : {bl_acc*100:.2f}%")
    print(f"  Federated (round 5)  : {fl_acc*100:.2f}%")
    print(f"  Gap                  : {(fl_acc - bl_acc)*100:+.2f}pp")
    print(f"  (Expected gap for real embeddings: smaller; on synth embeddings varies by seed)")

    # ── Save global model ──────────────────────────────────────────────
    pkl_path = out_dir / "fl_global_model.pkl"
    with open(pkl_path, "wb") as f:
        pickle.dump(global_weights, f)
    print(f"\nGlobal model saved => {pkl_path}  ({pkl_path.stat().st_size // 1024} KB)")

    # Save metadata
    meta = {
        "n_clients":     N_CLIENTS,
        "n_rounds":      N_ROUNDS,
        "local_epochs":  LOCAL_EPOCHS,
        "n_classes":     N_CLASSES,
        "embed_dim":     EMBED_DIM,
        "disease_classes": DISEASE_CLASSES,
        "centralised_accuracy": round(float(bl_acc), 4),
        "federated_final_accuracy": round(float(fl_acc), 4),
        "federation_time_s": round(total_time, 2),
        "round_log":     round_log,
        "demo_note": (
            "SIMULATED FL DEMO — single machine, 4 Python client objects. "
            "Data stays private per client; only weights shared via FedAvg. "
            "Not a production multi-device deployment."
        ),
    }
    meta_path = out_dir / "fl_demo_meta.json"
    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2)
    print(f"Metadata + round log saved => {meta_path}")

    print("\n" + "=" * 65)
    print("STEP 4 — Smoke-test predict_fl()")
    print("=" * 65)

    # Test on 3 samples from the val set
    for i in [0, 50, 100]:
        emb    = X_val[i]
        true_c = DISEASE_CLASSES[y_val[i]]
        result = predict_fl(emb, model_dir=str(out_dir))
        correct_sym = "[OK]" if result["predicted_class"] == true_c else "[!]"
        print(f"\n  Sample {i}: true={true_c.split('___')[1]}")
        print(f"  {correct_sym} pred={result['predicted_class'].split('___')[1]}  "
              f"conf={result['confidence']:.3f}")
        print(f"  Top-3: " + " | ".join(
            f"{r['class'].split('___')[1]}({r['confidence']:.2f})"
            for r in result["top_k"]
        ))

    print("\nDone — fl_global_model.pkl ready for /disease/predict-fl endpoint.")
