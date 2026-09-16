"""
Train Crop Disease Detection model (#4) — Phase 1 Real CNN
Train MobileNetV3-Small on PlantVillage dataset.
"""
import os
import json
import torch
import torch.nn as nn
from torchvision import datasets, transforms
from torchvision.models import mobilenet_v3_small, MobileNet_V3_Small_Weights
from torch.utils.data import DataLoader, Subset
import numpy as np
from pathlib import Path
from PIL import Image

ML_DIR = Path(__file__).parent / "ml_models"
ML_DIR.mkdir(exist_ok=True)
DATA_DIR = Path(__file__).parent / "data" / "plantvillage" / "color"

TARGET_CLASSES = [
    "Apple___Apple_scab", "Apple___Black_rot", "Apple___healthy",
    "Corn_(maize)___Common_rust_", "Corn_(maize)___healthy",
    "Grape___Black_rot", "Potato___Early_blight", "Potato___Late_blight", "Potato___healthy",
    "Tomato___Bacterial_spot", "Tomato___Early_blight", "Tomato___Late_blight",
    "Tomato___Leaf_Mold", "Tomato___Septoria_leaf_spot", "Tomato___healthy",
    "Pepper,_bell___Bacterial_spot", "Pepper,_bell___healthy"
]

TREATMENT_MAP = {
    c: "No treatment needed." if "healthy" in c.lower() else "Consult local agronomist for targeted fungicide."
    for c in TARGET_CLASSES
}
TREATMENT_MAP["Apple___Apple_scab"] = "Apply Mancozeb 75% WP; remove fallen leaves."
TREATMENT_MAP["Corn_(maize)___Common_rust_"] = "Apply Propiconazole 25% EC."
TREATMENT_MAP["Potato___Early_blight"] = "Apply Chlorothalonil 75% WP."
TREATMENT_MAP["Tomato___Bacterial_spot"] = "Apply copper oxychloride 50% WP."

def train():
    print("=" * 70)
    print("Training Crop Disease Detection Model (MobileNetV3)")
    print("=" * 70)

    device = torch.device("cpu")
    print(f"Using device: {device}")

    # Transforms
    train_tf = transforms.Compose([
        transforms.RandomResizedCrop(224, scale=(0.7, 1.0)),
        transforms.RandomHorizontalFlip(),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    val_tf = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    full_ds = datasets.ImageFolder(str(DATA_DIR), transform=train_tf)
    
    # Filter to TARGET_CLASSES and cap at 400 images/class
    class_to_idx = {c: full_ds.class_to_idx[c] for c in TARGET_CLASSES if c in full_ds.class_to_idx}
    idx_to_class = {v: k for k, v in class_to_idx.items()}
    
    # Create filtered subset
    valid_indices = []
    class_counts = {idx: 0 for idx in class_to_idx.values()}
    
    np.random.seed(42)
    shuffled_indices = np.random.permutation(len(full_ds))
    
    for i in shuffled_indices:
        _, label = full_ds.samples[i]
        if label in class_counts and class_counts[label] < 400:
            valid_indices.append(int(i))
            class_counts[label] += 1
            
    print(f"Selected {len(valid_indices)} images across {len(class_to_idx)} classes.")

    # Split train/val
    np.random.shuffle(valid_indices)
    split = int(0.8 * len(valid_indices))
    train_idx = valid_indices[:split]
    val_idx = valid_indices[split:]

    train_ds = Subset(full_ds, train_idx)
    
    val_ds_base = datasets.ImageFolder(str(DATA_DIR), transform=val_tf)
    val_ds = Subset(val_ds_base, val_idx)

    train_loader = DataLoader(train_ds, batch_size=16, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=16, shuffle=False)

    # Model
    n_classes = len(TARGET_CLASSES)
    model = mobilenet_v3_small(weights=MobileNet_V3_Small_Weights.IMAGENET1K_V1)
    
    # Freeze backbone
    for param in model.parameters():
        param.requires_grad = False
        
    in_features = model.classifier[0].in_features
    model.classifier = nn.Sequential(
        nn.Linear(in_features, 256),
        nn.Hardswish(),
        nn.Dropout(p=0.3),
        nn.Linear(256, n_classes)
    )
    model = model.to(device)
    
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.classifier.parameters(), lr=1e-3)

    n_epochs = 8
    best_acc = 0
    best_state = None

    for epoch in range(n_epochs):
        model.train()
        train_loss, train_correct, total = 0, 0, 0
        
        for X, y in train_loader:
            X, y = X.to(device), y.to(device)
            # Map original dataset indices to 0..16
            y_mapped = torch.tensor([TARGET_CLASSES.index(idx_to_class[val.item()]) for val in y], device=device)
            
            optimizer.zero_grad()
            out = model(X)
            loss = criterion(out, y_mapped)
            loss.backward()
            optimizer.step()
            
            train_loss += loss.item() * X.size(0)
            train_correct += (out.argmax(1) == y_mapped).sum().item()
            total += X.size(0)
            
        train_acc = train_correct / total
        
        model.eval()
        val_correct, val_total = 0, 0
        with torch.no_grad():
            for X, y in val_loader:
                X, y = X.to(device), y.to(device)
                y_mapped = torch.tensor([TARGET_CLASSES.index(idx_to_class[val.item()]) for val in y], device=device)
                
                out = model(X)
                val_correct += (out.argmax(1) == y_mapped).sum().item()
                val_total += X.size(0)
                
        val_acc = val_correct / val_total
        print(f"Epoch {epoch+1}/{n_epochs} | Train Acc: {train_acc:.4f} | Val Acc: {val_acc:.4f}")
        
        if val_acc > best_acc:
            best_acc = val_acc
            best_state = {k: v.clone() for k, v in model.state_dict().items()}

    model.load_state_dict(best_state)
    
    # Save model
    model_path = ML_DIR / "crop_disease_model.pt"
    torch.save({
        "model_state_dict": model.state_dict(),
        "classes": TARGET_CLASSES,
        "treatments": TREATMENT_MAP,
        "n_classes": len(TARGET_CLASSES)
    }, str(model_path))
    
    print(f"Saved: {model_path}")
    
    with open(ML_DIR / "crop_disease_classes.json", "w") as f:
        json.dump({
            "classes": TARGET_CLASSES,
            "treatments": TREATMENT_MAP,
            "accuracy": best_acc
        }, f, indent=2)

    # Test predict on a val image
    test_img_idx = val_idx[0]
    test_img_path, _ = full_ds.samples[test_img_idx]
    print("\nTest predict on:", test_img_path)
    res = predict(test_img_path)
    print(json.dumps(res, indent=2))

_MODEL_CACHE = {}

def predict(image_path: str) -> dict:
    if "model" not in _MODEL_CACHE:
        model_path = ML_DIR / "crop_disease_model.pt"
        checkpoint = torch.load(str(model_path), map_location="cpu", weights_only=False)
        
        n_classes = checkpoint["n_classes"]
        model = mobilenet_v3_small(weights=None)
        in_features = model.classifier[0].in_features
        model.classifier = nn.Sequential(
            nn.Linear(in_features, 256),
            nn.Hardswish(),
            nn.Dropout(p=0.3),
            nn.Linear(256, n_classes)
        )
        model.load_state_dict(checkpoint["model_state_dict"])
        model.eval()
        _MODEL_CACHE["model"] = model
        _MODEL_CACHE["classes"] = checkpoint["classes"]
        _MODEL_CACHE["treatments"] = checkpoint["treatments"]

    model = _MODEL_CACHE["model"]
    classes = _MODEL_CACHE["classes"]
    treatments = _MODEL_CACHE["treatments"]

    tf = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    img = Image.open(image_path).convert("RGB")
    x = tf(img).unsqueeze(0)
    
    with torch.no_grad():
        out = model(x)
        probs = torch.softmax(out[0], dim=0)
        
    pred_idx = probs.argmax().item()
    confidence = probs[pred_idx].item()
    predicted_disease = classes[pred_idx]
    
    severity = "low" if "healthy" in predicted_disease.lower() else ("high" if confidence > 0.75 else "medium")
    
    return {
        "predicted_disease": predicted_disease,
        "confidence": round(confidence, 3),
        "severity": severity,
        "treatment_recommendation": treatments.get(predicted_disease, ""),
        "model_type": "mobilenetv3_plantvillage"
    }

if __name__ == "__main__":
    train()
