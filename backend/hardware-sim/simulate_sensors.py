"""Hardware sensor simulator for the CEA/IoT feature group.

Sends correctly-shaped payloads to POST /api/v1/cea_iot/ingest including:
  - X-Device-Key authentication header
  - Valid farm_id UUID (from CEA_FARM_ID env var or seeded default)
  - device_id and device_type fields
  - readings dict with all sensor values
  - ISO 8601 timestamp

Run this script to populate the IoT dashboard with live sensor data.

Usage:
    python hardware-sim/simulate_sensors.py

Environment variables:
    CEA_FARM_ID      - UUID of the farm to ingest data for (required)
    CEA_DEVICE_KEY   - API key for authentication (default: test_device_key_123)
    API_BASE_URL     - Backend base URL (default: http://localhost:8000)
"""
import os
import time
import random
import json
import math
from datetime import datetime, timezone
from uuid import UUID

try:
    import requests
except ImportError:
    raise SystemExit("Please install requests: pip install requests")

# ─── Configuration ────────────────────────────────────────────────────────────
API_BASE = os.getenv("API_BASE_URL", "http://localhost:8000")
INGEST_URL = f"{API_BASE}/api/v1/cea_iot/ingest"
SETPOINT_URL = f"{API_BASE}/api/v1/cea_iot/setpoints"

# This UUID must match a farm that exists in the database.
# The seed.py script creates a farm with this ID and prints it.
# Override with env var CEA_FARM_ID.
FARM_ID = os.getenv("CEA_FARM_ID", "a0000000-0000-4000-8000-000000000001")
DEVICE_KEY = os.getenv("CEA_DEVICE_KEY", "test_device_key_123")

POLL_INTERVAL_SEC = 5  # seconds between readings

HEADERS = {
    "Content-Type": "application/json",
    "X-Device-Key": DEVICE_KEY,
}

# Validate farm_id is a valid UUID
try:
    UUID(FARM_ID)
except ValueError:
    raise SystemExit(f"CEA_FARM_ID '{FARM_ID}' is not a valid UUID. Set it via environment variable.")


def _ts() -> str:
    return datetime.now(timezone.utc).isoformat()


def _jitter(base: float, pct: float = 0.05) -> float:
    """Add ±pct% random jitter to a base value."""
    return round(base * (1 + random.uniform(-pct, pct)), 2)


# ─── Device profiles ──────────────────────────────────────────────────────────

def make_main_sensor_payload(tick: int) -> dict:
    """Main hydroponics/CEA sensor — temperature, humidity, CO2, pH, EC, light, power."""
    # Simulate diurnal light cycle
    hour = datetime.now().hour
    light_cycle = max(0, math.sin(math.pi * (hour - 6) / 12)) if 6 <= hour <= 18 else 0.0

    return {
        "farm_id": FARM_ID,
        "device_id": "cea-main-sensor-01",
        "device_type": "hydroponic_main",
        "timestamp": _ts(),
        "readings": {
            "temperature": _jitter(24.5),
            "humidity": _jitter(68.0),
            "co2": int(_jitter(620, 0.15)),
            "ph": round(random.uniform(5.8, 6.4), 2),
            "ec": round(random.uniform(1.4, 2.0), 2),
            "light_intensity": int(400 * light_cycle + random.randint(50, 100)),
            "power_kw": round(random.uniform(2.2, 3.8), 2),
            "water_level_pct": _jitter(75.0, 0.08),
            "do_mg_l": round(random.uniform(6.5, 8.5), 2),  # dissolved oxygen
        }
    }


def make_vertical_shelf_payload(shelf: str, tick: int) -> dict:
    """Vertical farming shelf sensor — per-layer light and temperature."""
    shelf_temps = {"A": 22.5, "B": 24.0, "C": 25.8}
    shelf_lights = {"A": 380, "B": 420, "C": 350}
    return {
        "farm_id": FARM_ID,
        "device_id": f"vertical-shelf-{shelf.lower()}-sensor",
        "device_type": f"vertical_shelf_{shelf}",
        "timestamp": _ts(),
        "readings": {
            "air_temp_c": _jitter(shelf_temps[shelf]),
            "light_intensity_lux": int(_jitter(shelf_lights[shelf], 0.1)),
            "humidity_pct": _jitter(65.0),
            "co2_ppm": int(_jitter(550, 0.12)),
        }
    }


def make_aquaponics_payload(tick: int) -> dict:
    """Aquaponics tank sensor — pH, EC, dissolved oxygen."""
    return {
        "farm_id": FARM_ID,
        "device_id": "aquaponics-tank-01",
        "device_type": "aquaponics_tank",
        "timestamp": _ts(),
        "readings": {
            "ph": round(random.uniform(6.8, 7.4), 2),
            "ec": round(random.uniform(0.8, 1.4), 2),
            "water_temp_c": _jitter(26.0),
            "do_mg_l": round(random.uniform(5.5, 7.5), 2),
            "ammonia_ppm": round(random.uniform(0.0, 0.5), 3),
            "nitrate_ppm": round(random.uniform(10, 40), 1),
        }
    }


def _post_setpoints():
    """Configure default setpoints for hydroponics once at startup."""
    payload = {
        "farm_id": FARM_ID,
        "values": {
            "ph": 6.2,
            "ec": 1.8,
            "temperature": 24.0,
            "humidity": 65.0,
            "co2": 600,
            "light_intensity": 400,
            "power_kw_budget": 4.0,
        }
    }
    try:
        resp = requests.post(SETPOINT_URL, json=payload, headers=HEADERS, timeout=5)
        if resp.status_code in (200, 201):
            print(f"[INIT] ✓ Setpoints configured: pH=6.2, EC=1.8")
        else:
            print(f"[INIT] ✗ Setpoints failed: {resp.status_code} — {resp.text[:80]}")
    except Exception as e:
        print(f"[INIT] Could not configure setpoints: {e}")


def _send(payload: dict, label: str):
    try:
        resp = requests.post(INGEST_URL, json=payload, headers=HEADERS, timeout=5)
        ts = datetime.now().strftime("%H:%M:%S")
        if resp.status_code == 201:
            data_summary = ", ".join(
                f"{k}={v}" for k, v in list(payload["readings"].items())[:3]
            )
            print(f"[{ts}] ✓ {label}: {data_summary} ...")
        else:
            print(f"[{ts}] ✗ {label}: HTTP {resp.status_code} — {resp.text[:120]}")
    except requests.exceptions.ConnectionError:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Connection refused. Is the backend running?")
    except Exception as e:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Error sending {label}: {e}")


def main():
    print("=" * 60)
    print("  CEA / IoT Hardware Simulator")
    print(f"  Farm ID  : {FARM_ID}")
    print(f"  Endpoint : {INGEST_URL}")
    print(f"  Interval : {POLL_INTERVAL_SEC}s")
    print("=" * 60)
    print("Configuring setpoints on startup...")
    _post_setpoints()
    print("Starting sensor simulation loop. Press Ctrl+C to stop.\n")

    tick = 0
    while True:
        # Main CEA sensors
        _send(make_main_sensor_payload(tick), "Main CEA Sensor")

        # Vertical shelves (every 3 ticks to reduce noise)
        if tick % 3 == 0:
            for shelf in ["A", "B", "C"]:
                _send(make_vertical_shelf_payload(shelf, tick), f"Vertical Shelf {shelf}")

        # Aquaponics (every 2 ticks)
        if tick % 2 == 0:
            _send(make_aquaponics_payload(tick), "Aquaponics Tank")

        tick += 1
        time.sleep(POLL_INTERVAL_SEC)


if __name__ == "__main__":
    main()
