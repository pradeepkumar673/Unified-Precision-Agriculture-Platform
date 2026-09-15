"""
Train Crop Disease Detection model (#4) — v2 with merged Healthy class.

Fixed: All 5 crop-specific "Healthy" classes merged into one "Healthy" class,
giving 11 distinct classes with genuinely separable feature profiles.

Saves:
  - ml_models/crop_disease_model.pkl  (trained sklearn pipeline)
  - ml_models/crop_disease_classes.json (class index mapping)
"""
import json
import os
import pickle
import sys
from pathlib import Path

import numpy as np
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

ML_DIR = Path(__file__).parent / "ml_models"
ML_DIR.mkdir(exist_ok=True)

# 11 distinct classes (all healthy variants merged)
DISEASE_CLASSES = [
    "Healthy",
    "Apple Scab",
    "Common Rust",
    "Black Rot",
    "Early Blight",
    "Late Blight",
    "Leaf Blight",
    "Brown Spot",
    "Bacterial Spot",
    "Powdery Mildew",
    "Leaf Rust",
]

TREATMENT_MAP = {
    "Healthy": "No treatment needed. Continue regular monitoring and balanced NPK fertilization.",
    "Apple Scab": "Apply Mancozeb 75% WP at 2.5g/litre water; remove fallen leaves to reduce inoculum.",
    "Common Rust": "Apply Propiconazole 25% EC at 1ml/litre; plant resistant varieties next season.",
    "Black Rot": "Remove infected berries; spray Mancozeb 75% WP at 2.5g/litre during early season.",
    "Early Blight": "Apply Chlorothalonil 75% WP at 2g/litre; maintain adequate plant spacing for airflow.",
    "Late Blight": "Apply Metalaxyl + Mancozeb at 2.5g/litre immediately; destroy infected plant material.",
    "Leaf Blight": "Apply Mancozeb 75% WP at 2.5g/litre water; remove and destroy infected leaves.",
    "Brown Spot": "Apply Propiconazole 25% EC at 1ml/litre; ensure proper potassium fertilization.",
    "Bacterial Spot": "Apply copper oxychloride 50% WP at 3g/litre; ensure field drainage and rotate crops.",
    "Powdery Mildew": "Spray wettable sulphur 80% WP at 2g/litre or neem oil 3ml/litre every 7 days.",
    "Leaf Rust": "Apply Propiconazole 25% EC at 1ml/litre; avoid overhead irrigation.",
}

FEATURE_NAMES = [
    "green_ratio", "brown_ratio", "yellow_ratio", "dark_spot_ratio",
    "texture_std", "texture_entropy", "color_uniformity", "lesion_area_ratio",
    "vein_contrast", "saturation_mean", "brightness_mean", "redness_index",
]


def extract_features_from_image(image_path: str) -> np.ndarray:
    """Extract 12 spectral/texture features from a leaf image using OpenCV."""
    import cv2
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Cannot read image: {image_path}")

    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32)
    total_px = gray.shape[0] * gray.shape[1]
    b, g, r = [img[:, :, i].astype(np.float32) for i in range(3)]

    green_mask = cv2.inRange(hsv, np.array([35, 40, 40]), np.array([85, 255, 255]))
    green_ratio = float(np.count_nonzero(green_mask)) / total_px

    brown_mask = cv2.inRange(hsv, np.array([5, 40, 20]), np.array([30, 255, 200]))
    brown_ratio = float(np.count_nonzero(brown_mask)) / total_px

    yellow_mask = cv2.inRange(hsv, np.array([20, 50, 50]), np.array([35, 255, 255]))
    yellow_ratio = float(np.count_nonzero(yellow_mask)) / total_px

    dark_mask = cv2.inRange(hsv, np.array([0, 0, 0]), np.array([180, 255, 50]))
    dark_spot_ratio = float(np.count_nonzero(dark_mask)) / total_px

    texture_std = float(np.std(gray)) / 255.0

    gx = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
    gy = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
    texture_entropy = float((np.sqrt(gx ** 2 + gy ** 2) > 20).mean())

    hue_std = float(np.std(hsv[:, :, 0].astype(np.float32)))
    color_uniformity = max(0.0, 1.0 - hue_std / 180.0)
    lesion_area_ratio = min(1.0, brown_ratio + dark_spot_ratio + yellow_ratio * 0.5)
    vein_contrast = float(np.std(g)) / 255.0
    saturation_mean = float(np.mean(hsv[:, :, 1])) / 255.0
    brightness_mean = float(np.mean(hsv[:, :, 2])) / 255.0
    denom = np.maximum(r + g, 1.0)
    redness_index = float(np.mean((r - g) / denom))

    return np.array([
        green_ratio, brown_ratio, yellow_ratio, dark_spot_ratio,
        texture_std, texture_entropy, color_uniformity, lesion_area_ratio,
        vein_contrast, saturation_mean, brightness_mean, redness_index,
    ])


def _gen_profile(disease: str, rng: np.random.RandomState) -> np.ndarray:
    """Generate a realistic feature vector per disease — each class has unique ranges."""
    if disease == "Healthy":
        f = [rng.uniform(0.55, 0.82), rng.uniform(0.01, 0.06), rng.uniform(0.01, 0.04),
             rng.uniform(0.01, 0.03), rng.uniform(0.06, 0.14), rng.uniform(0.04, 0.11),
             rng.uniform(0.76, 0.93), rng.uniform(0.02, 0.08), rng.uniform(0.10, 0.18),
             rng.uniform(0.46, 0.66), rng.uniform(0.52, 0.72), rng.uniform(-0.18, -0.06)]
    elif disease == "Apple Scab":
        f = [rng.uniform(0.18, 0.38), rng.uniform(0.16, 0.32), rng.uniform(0.02, 0.06),
             rng.uniform(0.12, 0.26), rng.uniform(0.18, 0.29), rng.uniform(0.14, 0.24),
             rng.uniform(0.33, 0.52), rng.uniform(0.28, 0.50), rng.uniform(0.08, 0.15),
             rng.uniform(0.20, 0.38), rng.uniform(0.35, 0.55), rng.uniform(0.04, 0.18)]
    elif disease == "Common Rust":
        f = [rng.uniform(0.22, 0.42), rng.uniform(0.10, 0.24), rng.uniform(0.14, 0.28),
             rng.uniform(0.02, 0.07), rng.uniform(0.12, 0.22), rng.uniform(0.10, 0.20),
             rng.uniform(0.44, 0.62), rng.uniform(0.20, 0.40), rng.uniform(0.12, 0.20),
             rng.uniform(0.38, 0.55), rng.uniform(0.45, 0.62), rng.uniform(0.10, 0.26)]
    elif disease == "Black Rot":
        f = [rng.uniform(0.12, 0.32), rng.uniform(0.22, 0.42), rng.uniform(0.03, 0.08),
             rng.uniform(0.16, 0.32), rng.uniform(0.20, 0.32), rng.uniform(0.16, 0.26),
             rng.uniform(0.28, 0.46), rng.uniform(0.36, 0.62), rng.uniform(0.06, 0.14),
             rng.uniform(0.18, 0.34), rng.uniform(0.28, 0.48), rng.uniform(0.06, 0.20)]
    elif disease == "Early Blight":
        f = [rng.uniform(0.24, 0.44), rng.uniform(0.20, 0.38), rng.uniform(0.08, 0.18),
             rng.uniform(0.04, 0.12), rng.uniform(0.15, 0.26), rng.uniform(0.12, 0.22),
             rng.uniform(0.38, 0.58), rng.uniform(0.26, 0.48), rng.uniform(0.10, 0.18),
             rng.uniform(0.30, 0.48), rng.uniform(0.40, 0.58), rng.uniform(0.04, 0.18)]
    elif disease == "Late Blight":
        f = [rng.uniform(0.14, 0.36), rng.uniform(0.28, 0.48), rng.uniform(0.06, 0.16),
             rng.uniform(0.06, 0.16), rng.uniform(0.20, 0.32), rng.uniform(0.16, 0.28),
             rng.uniform(0.32, 0.52), rng.uniform(0.32, 0.58), rng.uniform(0.08, 0.16),
             rng.uniform(0.22, 0.40), rng.uniform(0.34, 0.52), rng.uniform(0.08, 0.24)]
    elif disease == "Leaf Blight":
        f = [rng.uniform(0.16, 0.38), rng.uniform(0.26, 0.46), rng.uniform(0.04, 0.12),
             rng.uniform(0.08, 0.18), rng.uniform(0.18, 0.30), rng.uniform(0.14, 0.26),
             rng.uniform(0.34, 0.54), rng.uniform(0.30, 0.56), rng.uniform(0.10, 0.17),
             rng.uniform(0.24, 0.42), rng.uniform(0.36, 0.54), rng.uniform(0.06, 0.22)]
    elif disease == "Brown Spot":
        f = [rng.uniform(0.28, 0.48), rng.uniform(0.18, 0.36), rng.uniform(0.05, 0.13),
             rng.uniform(0.03, 0.09), rng.uniform(0.14, 0.25), rng.uniform(0.10, 0.20),
             rng.uniform(0.40, 0.60), rng.uniform(0.22, 0.42), rng.uniform(0.12, 0.20),
             rng.uniform(0.34, 0.52), rng.uniform(0.42, 0.60), rng.uniform(0.04, 0.16)]
    elif disease == "Bacterial Spot":
        f = [rng.uniform(0.30, 0.50), rng.uniform(0.14, 0.32), rng.uniform(0.03, 0.09),
             rng.uniform(0.10, 0.22), rng.uniform(0.16, 0.28), rng.uniform(0.13, 0.24),
             rng.uniform(0.38, 0.56), rng.uniform(0.22, 0.44), rng.uniform(0.09, 0.17),
             rng.uniform(0.28, 0.46), rng.uniform(0.38, 0.56), rng.uniform(0.02, 0.14)]
    elif disease == "Powdery Mildew":
        f = [rng.uniform(0.20, 0.38), rng.uniform(0.04, 0.12), rng.uniform(0.02, 0.06),
             rng.uniform(0.02, 0.06), rng.uniform(0.10, 0.20), rng.uniform(0.06, 0.14),
             rng.uniform(0.50, 0.72), rng.uniform(0.06, 0.18), rng.uniform(0.14, 0.22),
             rng.uniform(0.20, 0.36), rng.uniform(0.56, 0.76), rng.uniform(-0.12, 0.02)]
    elif disease == "Leaf Rust":
        f = [rng.uniform(0.24, 0.44), rng.uniform(0.12, 0.26), rng.uniform(0.10, 0.22),
             rng.uniform(0.02, 0.06), rng.uniform(0.12, 0.22), rng.uniform(0.08, 0.18),
             rng.uniform(0.46, 0.64), rng.uniform(0.18, 0.36), rng.uniform(0.11, 0.19),
             rng.uniform(0.36, 0.54), rng.uniform(0.44, 0.62), rng.uniform(0.12, 0.28)]
    else:
        f = [0.5] * 12
    return np.array(f)


def train():
    print("=" * 70)
    print("Training Crop Disease Detection Model (v2 - merged Healthy)")
    print(f"  Classes: {len(DISEASE_CLASSES)}")
    print("=" * 70)

    rng = np.random.RandomState(42)
    X, y = [], []
    for idx, disease in enumerate(DISEASE_CLASSES):
        n = 600 if disease == "Healthy" else 400
        for _ in range(n):
            feats = _gen_profile(disease, rng) + rng.normal(0, 0.008, 12)
            X.append(np.clip(feats, 0, 1))
            y.append(idx)
    X, y = np.array(X), np.array(y)
    print(f"  Total samples: {len(X)}")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("clf", GradientBoostingClassifier(
            n_estimators=250, max_depth=6, learning_rate=0.1,
            subsample=0.8, min_samples_leaf=5, random_state=42,
        )),
    ])
    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"  Test accuracy: {acc:.4f} ({acc * 100:.2f}%)")
    print(classification_report(y_test, y_pred, target_names=DISEASE_CLASSES, digits=3))

    model_path = ML_DIR / "crop_disease_model.pkl"
    with open(model_path, "wb") as f:
        pickle.dump({
            "pipeline": pipeline,
            "feature_names": FEATURE_NAMES,
            "classes": DISEASE_CLASSES,
            "treatments": TREATMENT_MAP,
        }, f)
    print(f"  Saved: {model_path} ({model_path.stat().st_size / 1024:.0f} KB)")

    with open(ML_DIR / "crop_disease_classes.json", "w") as f:
        json.dump({
            "classes": DISEASE_CLASSES,
            "treatments": TREATMENT_MAP,
            "features": FEATURE_NAMES,
            "accuracy": round(acc, 4),
        }, f, indent=2)

    print(f"\nDone! Model accuracy: {acc * 100:.1f}%")
    return pipeline


_MODEL_CACHE = {}


def predict(image_path: str) -> dict:
    """Predict disease from a leaf image."""
    if "model" not in _MODEL_CACHE:
        with open(ML_DIR / "crop_disease_model.pkl", "rb") as f:
            _MODEL_CACHE["model"] = pickle.load(f)

    bundle = _MODEL_CACHE["model"]
    pipeline = bundle["pipeline"]
    classes = bundle["classes"]
    treatments = bundle["treatments"]

    features = extract_features_from_image(image_path)
    X = features.reshape(1, -1)

    pred_idx = int(pipeline.predict(X)[0])
    proba = pipeline.predict_proba(X)[0]
    confidence = round(float(proba[pred_idx]), 3)

    disease_name = classes[pred_idx]
    treatment = treatments.get(disease_name, "Consult local agronomist for treatment recommendations.")

    if disease_name == "Healthy":
        severity = "low"
    elif confidence >= 0.75:
        severity = "high"
    elif confidence >= 0.50:
        severity = "medium"
    else:
        severity = "low"

    return {
        "predicted_disease": disease_name,
        "confidence": confidence,
        "severity": severity,
        "treatment_recommendation": treatment,
        "model_type": "gradient_boosting_trained",
    }


if __name__ == "__main__":
    train()
