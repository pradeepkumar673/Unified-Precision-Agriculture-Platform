"""
train_grain_quality_weed.py
===========================
Grain Quality Grading (A/B/C) + Weed Classification — Prompt #14
MobileNetV3-Small transfer-learning training script.

# ═══════════════════════════════════════════════════════════════════════════
# USAGE INSTRUCTIONS
# ─────────────────────────────────────────────────────────────────────────
# This script is READY TO RUN as soon as you have images.
#
# Required directory structure:
#
#   For Grain Quality:
#   data/grain_quality/
#       A/          ← ~30+ photos of Grade-A grain (clean, full, uniform)
#       B/          ← ~30+ photos of Grade-B grain (minor defects)
#       C/          ← ~30+ photos of Grade-C grain (broken, discolored)
#
#   For Weed Classification:
#   data/weed_species/
#       Parthenium/     ← ~30+ photos of Parthenium hysterophorus
#       Cynodon/        ← ~30+ photos of Cynodon dactylon (doob grass)
#       Cyperus/        ← ~30+ photos of Cyperus rotundus (motha)
#       ...             ← add as many weed species as you photograph
#
# With ~30 images/class:
#   - Unfreeze only the final classifier head
#   - Data augmentation heavily (flip, rotate, color jitter, cutout)
#   - Expected accuracy: 70-85% on held-out test set
#
# With ~100+ images/class:
#   - Also unfreeze last 2 InvertedResidual blocks
#   - Expected accuracy: 85-95%
#
# Run:
#   python train_grain_quality_weed.py --task grain --data_dir data/grain_quality
#   python train_grain_quality_weed.py --task weed  --data_dir data/weed_species
# ═══════════════════════════════════════════════════════════════════════════

Model Architecture
------------------
  Backbone : MobileNetV3-Small (ImageNet pretrained, ~2.5M params)
  Head     : AdaptiveAvgPool -> Flatten -> Dropout(0.3) -> Linear(576, n_classes)
  Input    : 224x224 RGB
  Training : Adam lr=1e-3 (head only) → fine-tune lr=1e-4 (last 2 blocks + head)
  Loss     : CrossEntropy with label smoothing 0.1

Augmentations (heavy, for small datasets)
------------------------------------------
  Train : RandomResizedCrop(224, scale=0.7-1.0)
          RandomHorizontalFlip + RandomVerticalFlip
          ColorJitter(brightness=0.3, contrast=0.3, saturation=0.2, hue=0.05)
          RandomRotation(30)
          RandomGrayscale(p=0.05)
          Normalize(ImageNet stats)
  Val   : CenterCrop(224) + Normalize

Outputs
-------
  ml_models/grain_quality_mobilenetv3.pt   — full model (torch.save)
  ml_models/grain_quality_meta.json        — classes, threshold, metrics
  OR
  ml_models/weed_mobilenetv3.pt
  ml_models/weed_meta.json
"""

import argparse
import json
import os
import sys
import warnings
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import numpy as np

os.environ["CUDA_VISIBLE_DEVICES"] = ""   # CPU training (CUDA build incompatible on this system)
warnings.filterwarnings("ignore")

# ─────────────────────────────────────────────────────────────────────────────
# 1. Task configurations
# ─────────────────────────────────────────────────────────────────────────────
TASK_CONFIGS = {
    "grain": {
        "classes":       ["A", "B", "C"],
        "class_labels":  {"A": "Grade A (premium)", "B": "Grade B (standard)", "C": "Grade C (reject)"},
        "model_name":    "grain_quality_mobilenetv3.pt",
        "meta_name":     "grain_quality_meta.json",
        "description":   "Grain quality grade classifier (A/B/C)",
        "advice": {
            "A": "Premium grade. Eligible for export market or highest mandi rate.",
            "B": "Standard grade. Suitable for domestic market at standard rate.",
            "C": "Below standard. Consider processing/milling rather than direct sale.",
        },
    },
    "weed": {
        "classes":       None,          # auto-discovered from subdirectory names
        "class_labels":  {},            # filled at train time
        "model_name":    "weed_mobilenetv3.pt",
        "meta_name":     "weed_meta.json",
        "description":   "Weed species classifier",
        "advice": {
            "default": "Weed identified. Consult local agronomist for targeted herbicide.",
        },
    },
}


# ─────────────────────────────────────────────────────────────────────────────
# 2. Dataset setup
# ─────────────────────────────────────────────────────────────────────────────
def build_dataloaders(
    data_dir: Path,
    classes: Optional[List[str]],
    batch_size: int = 16,
    val_split: float = 0.20,
    seed: int = 42,
):
    """
    Build train/val DataLoaders from an ImageFolder-style directory.

    data_dir/
        ClassName1/
            img001.jpg ...
        ClassName2/
            img001.jpg ...
    """
    import torch
    from torchvision import datasets, transforms
    from torch.utils.data import DataLoader, Subset
    from sklearn.model_selection import StratifiedShuffleSplit

    # Auto-discover classes if not specified
    if classes is None:
        classes = sorted([d.name for d in data_dir.iterdir() if d.is_dir()])

    print(f"  Classes found: {classes}")
    per_class_counts = {c: len(list((data_dir / c).glob("*.*")))
                        for c in classes if (data_dir / c).exists()}
    print(f"  Image counts:  {per_class_counts}")

    total = sum(per_class_counts.values())
    if total < len(classes) * 10:
        print(f"  WARNING: Only {total} images total ({total//len(classes)} avg/class).")
        print(f"           Need ~30/class for reasonable accuracy.")

    # Strong augmentation for small datasets
    train_tf = transforms.Compose([
        transforms.RandomResizedCrop(224, scale=(0.70, 1.0)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomVerticalFlip(),
        transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.2, hue=0.05),
        transforms.RandomRotation(30),
        transforms.RandomGrayscale(p=0.05),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])
    val_tf = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])

    # Full dataset (with train transform first; swap for val subset)
    full_ds = datasets.ImageFolder(str(data_dir), transform=train_tf)
    labels  = [s[1] for s in full_ds.samples]

    # Stratified split
    splitter = StratifiedShuffleSplit(n_splits=1, test_size=val_split, random_state=seed)
    train_idx, val_idx = next(splitter.split(np.zeros(len(labels)), labels))

    # Val dataset uses val_tf
    val_ds = datasets.ImageFolder(str(data_dir), transform=val_tf)

    train_loader = DataLoader(
        Subset(full_ds, train_idx), batch_size=batch_size,
        shuffle=True, num_workers=0, pin_memory=False,
    )
    val_loader = DataLoader(
        Subset(val_ds, val_idx), batch_size=batch_size,
        shuffle=False, num_workers=0, pin_memory=False,
    )

    print(f"  Train: {len(train_idx)} images  |  Val: {len(val_idx)} images")
    return train_loader, val_loader, full_ds.classes


# ─────────────────────────────────────────────────────────────────────────────
# 3. Model builder
# ─────────────────────────────────────────────────────────────────────────────
def build_model(n_classes: int, freeze_backbone: bool = True):
    """
    MobileNetV3-Small with a custom classification head.

    freeze_backbone=True  → train only the head (phase 1, few images)
    freeze_backbone=False → fine-tune last 2 blocks + head (phase 2, more images)
    """
    import torch
    import torch.nn as nn
    from torchvision.models import mobilenet_v3_small, MobileNet_V3_Small_Weights

    model = mobilenet_v3_small(weights=MobileNet_V3_Small_Weights.IMAGENET1K_V1)

    if freeze_backbone:
        for param in model.parameters():
            param.requires_grad = False

    else:
        # Unfreeze last 2 InvertedResidual blocks (features[10] and [11])
        for param in model.parameters():
            param.requires_grad = False
        for block in list(model.features.children())[-2:]:
            for param in block.parameters():
                param.requires_grad = True

    # Replace classifier head
    in_features = model.classifier[0].in_features
    model.classifier = nn.Sequential(
        nn.Linear(in_features, 256),
        nn.Hardswish(),
        nn.Dropout(p=0.3),
        nn.Linear(256, n_classes),
    )

    total   = sum(p.numel() for p in model.parameters())
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"  Model: MobileNetV3-Small  "
          f"total={total/1e6:.2f}M  trainable={trainable/1e6:.2f}M")

    return model


# ─────────────────────────────────────────────────────────────────────────────
# 4. Training loop
# ─────────────────────────────────────────────────────────────────────────────
def train_model(
    data_dir: Path,
    task: str,
    out_dir: Path,
    n_epochs_head: int = 15,
    n_epochs_finetune: int = 10,
    batch_size: int = 16,
    seed: int = 42,
):
    import torch
    import torch.nn as nn
    from torch.optim import Adam
    from torch.optim.lr_scheduler import CosineAnnealingLR

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"  Device: {device}")

    cfg     = TASK_CONFIGS[task]
    classes = cfg["classes"]

    print(f"\nBuilding dataloaders from: {data_dir}")
    train_loader, val_loader, discovered_classes = build_dataloaders(
        data_dir, classes, batch_size=batch_size, seed=seed
    )
    classes = discovered_classes
    n_cls   = len(classes)

    def _train_phase(model, loader, val_loader, n_epochs, lr, phase_name):
        model = model.to(device)
        criterion = nn.CrossEntropyLoss(label_smoothing=0.1)
        optimizer = Adam(filter(lambda p: p.requires_grad, model.parameters()), lr=lr)
        scheduler = CosineAnnealingLR(optimizer, T_max=n_epochs, eta_min=lr * 0.01)

        best_acc, best_state = 0.0, None
        history = []

        for epoch in range(1, n_epochs + 1):
            model.train()
            ep_loss, ep_correct, ep_total = 0.0, 0, 0
            for X, y in loader:
                X, y = X.to(device), y.to(device)
                optimizer.zero_grad()
                logits = model(X)
                loss   = criterion(logits, y)
                loss.backward()
                optimizer.step()
                ep_loss    += loss.item() * len(y)
                ep_correct += (logits.argmax(1) == y).sum().item()
                ep_total   += len(y)
            scheduler.step()

            # Validation
            model.eval()
            val_correct, val_total = 0, 0
            with torch.no_grad():
                for X, y in val_loader:
                    X, y = X.to(device), y.to(device)
                    preds = model(X).argmax(1)
                    val_correct += (preds == y).sum().item()
                    val_total   += len(y)

            train_acc = ep_correct / max(ep_total, 1)
            val_acc   = val_correct / max(val_total, 1)
            history.append({"epoch": epoch, "train_acc": round(train_acc, 4),
                            "val_acc": round(val_acc, 4)})

            if val_acc > best_acc:
                best_acc   = val_acc
                best_state = {k: v.clone() for k, v in model.state_dict().items()}

            if epoch % 5 == 0 or epoch == n_epochs:
                print(f"    [{phase_name}] ep {epoch:3d}/{n_epochs}  "
                      f"train={train_acc*100:.1f}%  val={val_acc*100:.1f}%"
                      + (" (best)" if val_acc == best_acc else ""))

        model.load_state_dict(best_state)
        return model, best_acc, history

    # ── Phase 1: head only ──────────────────────────────────────────────
    print(f"\n--- Phase 1: Train head only ({n_epochs_head} epochs, lr=1e-3) ---")
    model = build_model(n_cls, freeze_backbone=True)
    model, best_head_acc, hist1 = _train_phase(
        model, train_loader, val_loader, n_epochs_head, lr=1e-3, phase_name="head"
    )

    # ── Phase 2: fine-tune last 2 blocks + head ─────────────────────────
    print(f"\n--- Phase 2: Fine-tune last 2 blocks ({n_epochs_finetune} epochs, lr=1e-4) ---")
    for block in list(model.features.children())[-2:]:
        for param in block.parameters():
            param.requires_grad = True
    model, best_ft_acc, hist2 = _train_phase(
        model, train_loader, val_loader, n_epochs_finetune, lr=1e-4, phase_name="finetune"
    )

    best_val_acc = max(best_head_acc, best_ft_acc)
    print(f"\n  Final best val accuracy: {best_val_acc*100:.1f}%")

    # Save
    model_path = out_dir / cfg["model_name"]
    torch.save({
        "model_state_dict": model.state_dict(),
        "classes":          classes,
        "n_classes":        n_cls,
        "task":             task,
        "input_size":       224,
    }, str(model_path))
    print(f"  Model saved => {model_path}  ({model_path.stat().st_size // 1024} KB)")

    # Metadata
    meta = {
        "task":           task,
        "classes":        classes,
        "class_labels":   cfg.get("class_labels", {}),
        "description":    cfg["description"],
        "best_val_acc":   round(best_val_acc, 4),
        "training_phases": [
            {"phase": "head_only",   "epochs": n_epochs_head,   "best_acc": round(best_head_acc, 4)},
            {"phase": "fine_tuned",  "epochs": n_epochs_finetune, "best_acc": round(best_ft_acc, 4)},
        ],
        "advice":         cfg.get("advice", {}),
        "model_file":     cfg["model_name"],
        "note":           "MobileNetV3-Small, ImageNet pretrained, 224x224 input.",
    }
    meta_path = out_dir / cfg["meta_name"]
    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2)
    print(f"  Metadata saved => {meta_path}")

    return model, classes, best_val_acc


# ─────────────────────────────────────────────────────────────────────────────
# 5. Inference — predict() using trained model
# ─────────────────────────────────────────────────────────────────────────────
_MODEL_CACHE: dict = {}


def _load_model(model_path: Path, n_classes: int):
    key = str(model_path)
    if key not in _MODEL_CACHE:
        import torch
        from torchvision.models import mobilenet_v3_small
        import torch.nn as nn
        checkpoint = torch.load(str(model_path), map_location="cpu", weights_only=False)
        n_cls = checkpoint["n_classes"]
        m = mobilenet_v3_small(weights=None)
        in_features = m.classifier[0].in_features
        m.classifier = nn.Sequential(
            nn.Linear(in_features, 256),
            nn.Hardswish(),
            nn.Dropout(p=0.3),
            nn.Linear(256, n_cls),
        )
        m.load_state_dict(checkpoint["model_state_dict"])
        m.eval()
        _MODEL_CACHE[key] = (m, checkpoint["classes"])
    return _MODEL_CACHE[key]


def predict(image_path: str, task: str = "grain", model_dir: str = None, top_k: int = 3) -> dict:
    """
    Classify a grain quality photo or weed species photo using the trained model.

    Parameters
    ----------
    image_path : str — path to JPEG/PNG image
    task       : str — "grain" or "weed"
    model_dir  : str — directory containing model file
    top_k      : int — number of top predictions to return

    Returns
    -------
    dict:
        predicted_class  : str
        confidence       : float
        top_k            : list[dict]
        advice           : str
        model_type       : str  ("mobilenetv3_trained")
    """
    import torch
    from torchvision import transforms
    from PIL import Image

    if model_dir is None:
        model_dir = str(Path(__file__).parent / "ml_models")

    cfg        = TASK_CONFIGS[task]
    model_path = Path(model_dir) / cfg["model_name"]

    if not model_path.exists():
        raise FileNotFoundError(
            f"No trained model found at {model_path}. "
            f"Run: python {__file__} --task {task} --data_dir data/{task}_images"
        )

    model, classes = _load_model(model_path, n_classes=len(cfg["classes"] or []))

    tf = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])

    img   = Image.open(image_path).convert("RGB")
    x     = tf(img).unsqueeze(0)
    with torch.no_grad():
        probs = torch.softmax(model(x)[0], dim=0).numpy()

    top_ids = probs.argsort()[::-1][:top_k]
    pred    = classes[int(top_ids[0])]

    advice_map  = cfg.get("advice", {})
    advice      = advice_map.get(pred, advice_map.get("default", "Consult local agronomist."))

    return {
        "predicted_class": pred,
        "confidence":      round(float(probs[top_ids[0]]), 4),
        "top_k":           [{"class": classes[int(i)], "confidence": round(float(probs[i]), 4)}
                            for i in top_ids],
        "advice":          advice,
        "model_type":      "mobilenetv3_trained",
    }


# ─────────────────────────────────────────────────────────────────────────────
# 6. CLI entry point
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train grain quality / weed classifier")
    parser.add_argument("--task",       choices=["grain", "weed"], required=True)
    parser.add_argument("--data_dir",   type=str, required=True,
                        help="ImageFolder-style root: data_dir/ClassA/, data_dir/ClassB/ ...")
    parser.add_argument("--out_dir",    type=str, default="ml_models")
    parser.add_argument("--epochs_head",type=int, default=15)
    parser.add_argument("--epochs_ft",  type=int, default=10)
    parser.add_argument("--batch_size", type=int, default=16)
    args = parser.parse_args()

    data_dir = Path(args.data_dir)
    out_dir  = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    if not data_dir.exists():
        print(f"ERROR: data_dir '{data_dir}' does not exist.")
        print(f"Create subdirectories for each class and put your images inside.")
        sys.exit(1)

    print(f"Task          : {args.task}")
    print(f"Data dir      : {data_dir.resolve()}")
    print(f"Output dir    : {out_dir.resolve()}")

    model, classes, best_acc = train_model(
        data_dir       = data_dir,
        task           = args.task,
        out_dir        = out_dir,
        n_epochs_head  = args.epochs_head,
        n_epochs_finetune = args.epochs_ft,
        batch_size     = args.batch_size,
    )

    print(f"\nDone. Best val accuracy: {best_acc*100:.1f}%")
    print(f"To run inference:")
    print(f"  from train_grain_quality_weed import predict")
    print(f"  result = predict('photo.jpg', task='{args.task}')")
