"""
grain_quality_heuristic.py
==========================
Grain Quality / Weed Classification — HEURISTIC FALLBACK

# ═══════════════════════════════════════════════════════════════════════════
# PLACEHOLDER TRANSPARENCY NOTE
# ─────────────────────────────────────────────────────────────────────────
# This module provides predict_heuristic() — a rule-based OpenCV
# color/texture analysis that returns plausible grain quality grades and
# weed detection results WITHOUT any trained ML model.
#
# It IS NOT AI-trained. It IS clearly labeled as a placeholder.
# It WILL be replaced by the trained MobileNetV3 model (train_grain_quality_weed.py)
# once ~30 images/class are collected and training is done.
#
# It IS appropriate for:
#   - Keeping the /grain/quality and /weed/classify endpoints live today
#   - Demo purposes (shows realistic-looking output structure)
#   - Development/integration testing of downstream services
#
# It IS NOT appropriate for:
#   - Production use with real farmers
#   - Any accuracy claim (it has no real accuracy — it's a heuristic)
#
# API CONTRACT: predict_heuristic() returns the same dict structure as
# train_grain_quality_weed.predict() so switching models is a one-line change.
# ═══════════════════════════════════════════════════════════════════════════

Grain Quality Heuristics (color + texture)
-------------------------------------------
  Grade A: Bright yellow/golden, low dark-pixel ratio (<10%), high texture uniformity
  Grade B: Slightly dull, moderate dark-pixel ratio (10-25%), medium uniformity
  Grade C: Dark, discolored, or very patchy; high dark-pixel ratio (>25%) or high blur

Weed Detection Heuristics (color + edge density)
-------------------------------------------------
  Parthenium hysterophorus : white flower clusters → high white-pixel ratio in HSV
  Cynodon dactylon (doob)  : fine grass texture → high edge density, narrow leaf hue
  Cyperus rotundus (motha) : triangular stem → medium green, moderate edge density
  Generic green weed       : dominant green HSV range with high edge density
  No weed / healthy crop   : structured crop rows, lower edge-to-area ratio

OpenCV pipeline
---------------
  1. Resize to 224x224
  2. Convert BGR -> HSV + LAB
  3. Extract color histograms (HSV channels)
  4. Compute texture metrics: Laplacian variance (blur), GLCM-proxy (std of gradient)
  5. Apply decision rules → grade/class + confidence estimate
"""

import warnings
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

import cv2
import numpy as np

warnings.filterwarnings("ignore")

# ─────────────────────────────────────────────────────────────────────────────
# 1. Shared image analysis utilities
# ─────────────────────────────────────────────────────────────────────────────
def _load_and_preprocess(image_source) -> np.ndarray:
    """
    Load image from file path, URL, or numpy array.
    Returns BGR uint8 array (224×224×3).
    """
    if isinstance(image_source, np.ndarray):
        img = image_source.copy()
    elif isinstance(image_source, str):
        img = cv2.imread(image_source)
        if img is None:
            raise FileNotFoundError(f"Cannot load image: {image_source}")
    else:
        raise TypeError(f"image_source must be str path or numpy array, got {type(image_source)}")

    return cv2.resize(img, (224, 224))


def _color_stats(bgr: np.ndarray) -> dict:
    """Extract HSV and LAB color statistics."""
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV).astype(np.float32)
    lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2Lab).astype(np.float32)

    H, S, V = hsv[:, :, 0], hsv[:, :, 1], hsv[:, :, 2]
    L, A, B = lab[:, :, 0], lab[:, :, 1], lab[:, :, 2]

    # Hue histogram (36 bins × 5°)
    h_hist = cv2.calcHist([hsv.astype(np.uint8)], [0], None, [36], [0, 180]).flatten()
    h_hist = h_hist / (h_hist.sum() + 1e-6)

    # Dominant hue range fractions
    green_frac  = h_hist[5:15].sum()    # hue 25°-75° = green range
    yellow_frac = h_hist[3:7].sum()     # hue 15°-35° = yellow-green
    golden_frac = h_hist[1:5].sum()     # hue 5°-25°  = golden/amber
    white_frac  = ((S < 30) & (V > 200)).mean()   # low saturation, high value = white
    dark_frac   = (V < 60).mean()                 # very dark pixels

    return {
        "h_hist":       h_hist,
        "mean_H":       float(H.mean()),
        "mean_S":       float(S.mean()),
        "mean_V":       float(V.mean()),
        "mean_L":       float(L.mean()),
        "mean_A":       float(A.mean()),
        "std_V":        float(V.std()),
        "green_frac":   float(green_frac),
        "yellow_frac":  float(yellow_frac),
        "golden_frac":  float(golden_frac),
        "white_frac":   float(white_frac),
        "dark_frac":    float(dark_frac),
    }


def _texture_stats(bgr: np.ndarray) -> dict:
    """Extract texture metrics using Laplacian variance and gradient magnitude."""
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY).astype(np.float32)

    # Laplacian variance — measures sharpness / texture detail
    lap   = cv2.Laplacian(gray, cv2.CV_32F)
    lap_var = float(lap.var())

    # Sobel gradient magnitude — measures edge density
    gx     = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
    gy     = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
    grad   = np.sqrt(gx ** 2 + gy ** 2)
    edge_density    = float((grad > 20).mean())   # fraction of edge pixels
    grad_mean       = float(grad.mean())
    grad_std        = float(grad.std())

    # Local standard deviation (proxy for grain uniformity)
    kernel  = np.ones((7, 7), np.float32) / 49
    local_mean = cv2.filter2D(gray, -1, kernel)
    local_sq   = cv2.filter2D(gray ** 2, -1, kernel)
    local_var  = (local_sq - local_mean ** 2).clip(0)
    mean_lvar  = float(local_var.mean())

    return {
        "laplacian_var":    lap_var,
        "edge_density":     edge_density,
        "grad_mean":        grad_mean,
        "grad_std":         grad_std,
        "mean_local_var":   mean_lvar,
    }


def _soft_confidence(score: float, lo: float, hi: float) -> float:
    """Map a raw score to [0.45, 0.90] confidence range."""
    score_n = (score - lo) / max(hi - lo, 1e-6)
    score_n = float(np.clip(score_n, 0.0, 1.0))
    return round(0.45 + 0.45 * score_n, 3)


# ─────────────────────────────────────────────────────────────────────────────
# 2. Grain quality heuristic
# ─────────────────────────────────────────────────────────────────────────────
GRAIN_ADVICE = {
    "A": "Premium grade (heuristic). Eligible for export or highest mandi rate. "
         "Confirm with trained model once photos are collected.",
    "B": "Standard grade (heuristic). Suitable for domestic market. "
         "Confirm with trained model once photos are collected.",
    "C": "Below standard (heuristic). Consider processing or milling. "
         "Confirm with trained model once photos are collected.",
}


def _grade_grain(color: dict, texture: dict) -> Tuple[str, float, dict]:
    """
    Rule-based grain quality grading from color + texture features.

    Decision logic (heuristic, NOT ML-trained):
      Grade A: golden/yellow dominant, low dark fraction, high sharpness, high uniformity
      Grade B: moderate color, some dark/damaged grains, medium uniformity
      Grade C: high dark fraction OR blurry (wet/damaged) OR very dull (low value)
    """
    dark_f   = color["dark_frac"]
    mean_V   = color["mean_V"]
    golden_f = color["golden_frac"] + color["yellow_frac"]
    lap_var  = texture["laplacian_var"]
    lvar     = texture["mean_local_var"]

    reasons = []

    # Grade C triggers
    c_score = 0.0
    if dark_f > 0.25:
        c_score += 0.5
        reasons.append(f"high dark-pixel ratio ({dark_f*100:.0f}%)")
    if mean_V < 100:
        c_score += 0.3
        reasons.append(f"dull brightness (mean_V={mean_V:.0f})")
    if lap_var < 80:
        c_score += 0.2
        reasons.append(f"blurry/wet texture (laplacian_var={lap_var:.0f})")

    # Grade A triggers
    a_score = 0.0
    if dark_f < 0.08:
        a_score += 0.4
    if golden_f > 0.30:
        a_score += 0.3
    if mean_V > 160:
        a_score += 0.2
    if lvar > 200:
        a_score += 0.1   # good texture uniformity

    if c_score >= 0.5:
        grade = "C"
        conf  = _soft_confidence(c_score, 0.5, 1.0)
    elif a_score >= 0.6:
        grade = "A"
        conf  = _soft_confidence(a_score, 0.6, 1.0)
    else:
        grade = "B"
        conf  = 0.55    # medium confidence for the middle class
        reasons.append("mixed color/texture signals")

    debug = {
        "dark_frac":     round(dark_f, 3),
        "golden_frac":   round(golden_f, 3),
        "mean_V":        round(mean_V, 1),
        "laplacian_var": round(lap_var, 1),
        "a_score":       round(a_score, 3),
        "c_score":       round(c_score, 3),
        "reasons":       reasons,
    }
    return grade, conf, debug


# ─────────────────────────────────────────────────────────────────────────────
# 3. Weed detection heuristic
# ─────────────────────────────────────────────────────────────────────────────
WEED_ADVICE = {
    "Parthenium":   "Parthenium hysterophorus detected (heuristic). "
                    "Highly invasive — remove immediately before seeding. "
                    "DO NOT compost; burn or bury at depth.",
    "Cynodon":      "Cynodon dactylon (doob grass) detected (heuristic). "
                    "Persistent weed; use targeted post-emergence herbicide.",
    "Cyperus":      "Cyperus rotundus (motha / purple nutsedge) detected (heuristic). "
                    "Difficult to control; consider systemic herbicide.",
    "green_weed":   "Unidentified green weed detected (heuristic). "
                    "Confirm species with agronomist before applying herbicide.",
    "no_weed":      "No obvious weed detected (heuristic). "
                    "Field appears clean. Re-inspect in 7-10 days.",
}


def _classify_weed(color: dict, texture: dict) -> Tuple[str, float, dict]:
    """
    Rule-based weed species classification from color + texture features.

    Decision logic (heuristic, NOT ML-trained):
      Parthenium: high white fraction (white flower heads) + green + high edge density
      Cynodon   : strong green + high edge density + narrow gradient (fine grass texture)
      Cyperus   : medium green + medium edge density + moderate laplacian (triangular stems)
      green_weed: green dominant + moderate edges
      no_weed   : low green fraction, low edge density
    """
    green_f  = color["green_frac"]
    white_f  = color["white_frac"]
    edge_d   = texture["edge_density"]
    lap_var  = texture["laplacian_var"]
    grad_std = texture["grad_std"]

    reasons = []

    # No weed: low greenness + low edges
    if green_f < 0.10 and edge_d < 0.10:
        return "no_weed", _soft_confidence(1 - green_f - edge_d, 0.0, 0.8), \
               {"green_frac": round(green_f, 3), "edge_density": round(edge_d, 3)}

    # Parthenium: white flower clusters + green base
    if white_f > 0.12 and green_f > 0.10:
        reasons.append(f"white flower clusters ({white_f*100:.0f}%)")
        reasons.append(f"green base ({green_f*100:.0f}%)")
        return "Parthenium", _soft_confidence(white_f + green_f, 0.22, 0.8), \
               {"white_frac": round(white_f, 3), "green_frac": round(green_f, 3),
                "reasons": reasons}

    # Cynodon: fine grass — high edge density + high gradient std (fine texture)
    if green_f > 0.15 and edge_d > 0.25 and grad_std > 15:
        reasons.append(f"fine grass texture (edge={edge_d*100:.0f}%, grad_std={grad_std:.0f})")
        return "Cynodon", _soft_confidence(edge_d + grad_std / 100, 0.40, 1.0), \
               {"green_frac": round(green_f, 3), "edge_density": round(edge_d, 3),
                "grad_std": round(grad_std, 1), "reasons": reasons}

    # Cyperus: moderate green, moderate edges, some laplacian variation
    if green_f > 0.12 and 0.08 < edge_d < 0.25 and lap_var > 50:
        reasons.append(f"moderate green + structured stems (edge={edge_d*100:.0f}%)")
        return "Cyperus", _soft_confidence(green_f + lap_var / 1000, 0.15, 0.6), \
               {"green_frac": round(green_f, 3), "edge_density": round(edge_d, 3),
                "laplacian_var": round(lap_var, 1), "reasons": reasons}

    # Generic green weed fallback
    if green_f > 0.10:
        return "green_weed", _soft_confidence(green_f, 0.10, 0.50), \
               {"green_frac": round(green_f, 3)}

    return "no_weed", 0.50, {"note": "ambiguous — low greenness and low edges"}


# ─────────────────────────────────────────────────────────────────────────────
# 4. predict_heuristic() — main API (same contract as trained predict())
# ─────────────────────────────────────────────────────────────────────────────
def predict_heuristic(
    image_source,
    task: str = "grain",
    return_debug: bool = False,
) -> dict:
    """
    ⚠️  HEURISTIC PLACEHOLDER — NOT AI-TRAINED
    Replace with train_grain_quality_weed.predict() once model is trained.

    Classifies grain quality (A/B/C) or weed species from an image using
    OpenCV color/texture rules. Returns the same dict structure as the
    trained predict() function for drop-in replacement.

    Parameters
    ----------
    image_source : str (file path) or np.ndarray (BGR, from cv2.imread)
    task         : "grain" | "weed"
    return_debug : bool — include raw feature values in response

    Returns
    -------
    dict:
        predicted_class  : str    — "A"/"B"/"C" or weed species name
        confidence       : float  [0.45, 0.90]  — heuristic confidence
        top_k            : list   — [{class, confidence}, ...]
        advice           : str    — actionable recommendation
        model_type       : str    — "heuristic_placeholder" (NOT ML-trained)
        disclaimer       : str    — transparency note
        debug_features   : dict   — raw feature values (if return_debug=True)
    """
    bgr     = _load_and_preprocess(image_source)
    color   = _color_stats(bgr)
    texture = _texture_stats(bgr)

    if task == "grain":
        pred_class, conf, debug = _grade_grain(color, texture)
        advice_map = GRAIN_ADVICE
        # Synthetic top-k: distribute remaining confidence across other classes
        classes = ["A", "B", "C"]
        other   = [c for c in classes if c != pred_class]
        rem     = 1.0 - conf
        top_k   = [{"class": pred_class, "confidence": conf}] + \
                  [{"class": c, "confidence": round(rem / len(other) * (0.7 if i == 0 else 0.3), 3)}
                   for i, c in enumerate(other)]

    elif task == "weed":
        pred_class, conf, debug = _classify_weed(color, texture)
        advice_map = WEED_ADVICE
        weed_classes = ["Parthenium", "Cynodon", "Cyperus", "green_weed", "no_weed"]
        other = [c for c in weed_classes if c != pred_class][:2]
        rem   = 1.0 - conf
        top_k = [{"class": pred_class, "confidence": conf}] + \
                [{"class": c, "confidence": round(rem / (len(other) + 1), 3)} for c in other]
    else:
        raise ValueError(f"task must be 'grain' or 'weed', got '{task}'")

    advice = advice_map.get(pred_class, "Consult local agronomist.")

    result = {
        "predicted_class": pred_class,
        "confidence":      conf,
        "top_k":           top_k,
        "advice":          advice,
        "model_type":      "heuristic_placeholder",
        "disclaimer":      (
            "WARNING: This result is from a rule-based OpenCV heuristic, NOT an AI-trained model. "
            "Accuracy is limited and unreliable for production use. "
            "Replace with train_grain_quality_weed.predict() once ~30 images/class are collected."
        ),
    }

    if return_debug:
        result["debug_features"] = {
            "color":   {k: round(v, 4) for k, v in color.items() if k != "h_hist"},
            "texture": {k: round(v, 4) for k, v in texture.items()},
            "decision": debug,
        }

    return result


# ─────────────────────────────────────────────────────────────────────────────
# 5. Smoke test with synthetic numpy images
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 65)
    print("SMOKE TEST: predict_heuristic() on synthetic images")
    print("(No real images needed — using numpy-generated test patterns)")
    print("=" * 65)

    def _make_synthetic_image(color_bgr: tuple, noise: float = 0.1,
                               texture_strength: float = 0.0) -> np.ndarray:
        """Create a synthetic 224x224 BGR image for testing."""
        rng  = np.random.RandomState(42)
        img  = np.full((224, 224, 3), color_bgr, dtype=np.float32)
        img += rng.randn(224, 224, 3) * noise * 50
        if texture_strength > 0:
            for i in range(0, 224, 10):
                img[i:i+2, :, :] *= (1 - texture_strength * 0.5)
        return np.clip(img, 0, 255).astype(np.uint8)

    # ── Grain quality tests ──
    print("\n-- GRAIN QUALITY HEURISTIC --")
    grain_tests = [
        ("Bright golden grain (expect A)", _make_synthetic_image((30, 180, 210), noise=0.05)),
        ("Medium brown grain (expect B)",  _make_synthetic_image((60, 120, 140), noise=0.12)),
        ("Dark damaged grain (expect C)",  _make_synthetic_image((20, 40,  50),  noise=0.20)),
        ("Bright but dull grain (B/C?)",   _make_synthetic_image((60,  80,  90), noise=0.08)),
    ]

    for label, img in grain_tests:
        result = predict_heuristic(img, task="grain", return_debug=True)
        print(f"\n  [{label}]")
        print(f"  Grade={result['predicted_class']}  conf={result['confidence']:.2f}")
        d = result["debug_features"]["decision"]
        print(f"  dark_frac={d.get('dark_frac',0):.2f}  golden_frac={d.get('golden_frac',0):.2f}  "
              f"mean_V={d.get('mean_V',0):.0f}")
        if d.get("reasons"):
            print(f"  Reasons: {d['reasons']}")

    # ── Weed tests ──
    print("\n\n-- WEED CLASSIFICATION HEURISTIC --")
    weed_tests = [
        ("White flower clusters + green (Parthenium?)",
         _make_synthetic_image((200, 200, 200), noise=0.05)),    # bright / white
        ("Dense fine grass green (Cynodon?)",
         _make_synthetic_image((50, 150, 50), noise=0.20, texture_strength=0.5)),  # green, textured
        ("Medium green structured (Cyperus?)",
         _make_synthetic_image((60, 120, 60), noise=0.12, texture_strength=0.3)),  # medium green
        ("Soil / no weed",
         _make_synthetic_image((50, 80, 100), noise=0.08)),      # brownish
    ]

    for label, img in weed_tests:
        result = predict_heuristic(img, task="weed", return_debug=True)
        print(f"\n  [{label}]")
        print(f"  Class={result['predicted_class']:15s}  conf={result['confidence']:.2f}")
        d = result["debug_features"]
        c = d["color"]
        print(f"  green={c['green_frac']:.2f}  white={c['white_frac']:.2f}  "
              f"edges={d['texture']['edge_density']:.2f}")

    print("\n" + "=" * 65)
    print("REMINDER: This is a PLACEHOLDER. Replace with trained model.")
    print("To train when you have images:")
    print("  python train_grain_quality_weed.py --task grain --data_dir data/grain_quality")
    print("  python train_grain_quality_weed.py --task weed  --data_dir data/weed_species")
    print("=" * 65)
