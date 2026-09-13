"""End-to-end test suite for Step 8 — advanced_ai endpoints.

Tests:
  1. POST /api/v1/advanced_ai/multimodal-query  (text-only, no image)
  2. POST /api/v1/advanced_ai/multimodal-query  (with JPEG image)
  3. POST /api/v1/advanced_ai/federated/trigger-round  (real FedAvg)
  4. POST /api/v1/advanced_ai/whatif-simulate   (irrigation change via DoWhy)
  5. POST /api/v1/advanced_ai/whatif-simulate   (sowing week change)
  6. POST /api/v1/advanced_ai/voice-query       (minimal WAV file — whisper transcription)
"""
import sys
import uuid
import wave
import struct

sys.stdout.reconfigure(encoding="utf-8")

from fastapi.testclient import TestClient

from app.main import app
from app.core.db import SessionLocal
from app.models.farm import Farm, User, UserRole, SoilType, WaterSource, AnnualIncomeRange

client = TestClient(app)


def make_minimal_wav(path: str, frequency: int = 440, duration_sec: float = 1.0) -> None:
    """Write a real 1-second 440 Hz sine wave WAV file (Whisper can parse this)."""
    import math
    sample_rate = 16000
    n_samples = int(sample_rate * duration_sec)
    with wave.open(path, "w") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        for i in range(n_samples):
            value = int(16000 * math.sin(2 * math.pi * frequency * i / sample_rate))
            wf.writeframes(struct.pack("<h", value))


def test_advanced_ai():
    db = SessionLocal()

    # --- setup: one farm ---
    user = User(
        email=f"ai_user_{uuid.uuid4().hex[:6]}@example.com",
        hashed_password="hashed",
        full_name="AI Tester",
        role=UserRole.farmer,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    farm = Farm(
        user_id=user.id,
        name="AI Test Farm",
        land_size_acres=3.5,
        soil_type=SoilType.sandy,
        water_source=WaterSource.borewell,
        latitude=13.08,
        longitude=77.65,
        equipment_owned=[],
        annual_income_range=AnnualIncomeRange.under_1L,
        crop_history=[{"crop": "tomato", "season": "kharif", "year": 2025}],
    )
    db.add(farm)
    db.commit()
    db.refresh(farm)
    farm_id = str(farm.id)
    db.close()

    # -------------------------------------------------------------------
    # 1. Multimodal query — text only
    # -------------------------------------------------------------------
    print("\n--- 1. POST /api/v1/advanced_ai/multimodal-query (text only) ---")
    resp = client.post(
        "/api/v1/advanced_ai/multimodal-query",
        data={"farm_id": farm_id, "input_text": "I want to know about irrigation water usage"},
    )
    assert resp.status_code == 201, resp.text
    mq = resp.json()
    print("query_id:", mq["query_id"])
    print("combined_response:", mq["combined_response"])
    assert "irrigation" in mq["combined_response"].lower() or "water" in mq["combined_response"].lower()

    # -------------------------------------------------------------------
    # 2. Multimodal query — with image (sample_leaf.jpg)
    # -------------------------------------------------------------------
    print("\n--- 2. POST /api/v1/advanced_ai/multimodal-query (with image) ---")
    with open("sample_leaf.jpg", "rb") as imgf:
        resp = client.post(
            "/api/v1/advanced_ai/multimodal-query",
            data={"farm_id": farm_id, "input_text": "Is there a disease on this leaf?"},
            files={"image_file": ("sample_leaf.jpg", imgf, "image/jpeg")},
        )
    assert resp.status_code == 201, resp.text
    mq2 = resp.json()
    print("combined_response:", mq2["combined_response"])
    assert "[Image Analysis]" in mq2["combined_response"]
    assert mq2["image_path"] is not None

    # -------------------------------------------------------------------
    # 3. Federated Learning — trigger-round (REAL FedAvg, 5 rounds)
    # -------------------------------------------------------------------
    print("\n--- 3. POST /api/v1/advanced_ai/federated/trigger-round ---")
    resp = client.post("/api/v1/advanced_ai/federated/trigger-round")
    assert resp.status_code == 200, resp.text
    fl = resp.json()
    print("run_id:", fl["run_id"])
    print("rounds_completed:", fl["rounds_completed"])
    print("participating_farm_count:", fl["participating_farm_count"])
    print("round_accuracies:", fl["round_accuracies"])
    print(f"==> aggregate_accuracy: {fl['aggregate_accuracy']:.4f} ({fl['aggregate_accuracy']*100:.2f}%)")
    assert fl["rounds_completed"] == 5
    assert fl["participating_farm_count"] == 4
    assert len(fl["round_accuracies"]) == 5
    assert 0.50 <= fl["aggregate_accuracy"] <= 1.00, "Accuracy must be between 50-100%"

    # -------------------------------------------------------------------
    # 4. What-If Simulation — irrigation change (flood → drip)
    # -------------------------------------------------------------------
    print("\n--- 4. POST /api/v1/advanced_ai/whatif-simulate (flood -> drip) ---")
    resp = client.post("/api/v1/advanced_ai/whatif-simulate", json={
        "farm_id": farm_id,
        "current_decision": {"irrigation_method": 0, "sowing_week_offset": 0},
        "proposed_change": {"irrigation_method": 1, "sowing_week_offset": 0},
    })
    assert resp.status_code == 201, resp.text
    sim = resp.json()
    print("simulation_id:", sim["simulation_id"])
    print(f"==> projected_yield_delta_kg_ha: {sim['projected_yield_delta_kg_ha']:.2f} kg/ha")
    print(f"==> projected_profit_delta_inr_ha: {sim['projected_profit_delta_inr_ha']:+.2f} INR/ha")
    print("explanation:", sim["explanation"][:200])
    assert sim["projected_yield_delta_kg_ha"] != 0.0, "Expected non-zero yield delta"

    # -------------------------------------------------------------------
    # 5. What-If Simulation — sowing week offset change (-3 → 0)
    # -------------------------------------------------------------------
    print("\n--- 5. POST /api/v1/advanced_ai/whatif-simulate (sowing_week_offset -3 -> 0) ---")
    resp = client.post("/api/v1/advanced_ai/whatif-simulate", json={
        "farm_id": farm_id,
        "current_decision": {"irrigation_method": 1, "sowing_week_offset": -3},
        "proposed_change": {"irrigation_method": 1, "sowing_week_offset": 0},
    })
    assert resp.status_code == 201, resp.text
    sim2 = resp.json()
    print(f"==> projected_yield_delta_kg_ha: {sim2['projected_yield_delta_kg_ha']:.2f} kg/ha")
    print(f"==> projected_profit_delta_inr_ha: {sim2['projected_profit_delta_inr_ha']:+.2f} INR/ha")
    print("explanation:", sim2["explanation"][:200])

    # -------------------------------------------------------------------
    # 6. Voice Query — minimal real WAV file (Whisper transcription)
    # -------------------------------------------------------------------
    print("\n--- 6. POST /api/v1/advanced_ai/voice-query (minimal WAV) ---")
    wav_path = "test_audio.wav"
    make_minimal_wav(wav_path, frequency=440, duration_sec=1.5)
    with open(wav_path, "rb") as wf:
        resp = client.post(
            "/api/v1/advanced_ai/voice-query",
            data={"farm_id": farm_id},
            files={"audio_file": ("test_audio.wav", wf, "audio/wav")},
        )
    assert resp.status_code == 201, resp.text
    vq = resp.json()
    print("query_id:", vq["query_id"])
    print("language:", vq["language"])
    print("transcribed_text:", repr(vq["transcribed_text"]))
    print("response_text:", vq["response_text"][:120])
    assert "response_text" in vq
    assert len(vq["response_text"]) > 20

    import os
    if os.path.exists(wav_path):
        os.remove(wav_path)

    print("\n=== ALL 6 STEP 8 ADVANCED AI TESTS PASSED ===")
    print()
    print("REAL NUMBERS SUMMARY:")
    print(f"  Federated Learning  => aggregate_accuracy = {fl['aggregate_accuracy']*100:.2f}%  (5 rounds, 4 clients)")
    print(f"  Causal Sim (flood->drip) => yield_delta = {sim['projected_yield_delta_kg_ha']:.2f} kg/ha, "
          f"profit_delta = Rs {sim['projected_profit_delta_inr_ha']:+.2f}/ha")
    print(f"  Causal Sim (sow offset) => yield_delta = {sim2['projected_yield_delta_kg_ha']:.2f} kg/ha, "
          f"profit_delta = Rs {sim2['projected_profit_delta_inr_ha']:+.2f}/ha")


if __name__ == "__main__":
    test_advanced_ai()
