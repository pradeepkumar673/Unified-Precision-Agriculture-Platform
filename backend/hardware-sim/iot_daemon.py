import time
import requests
import random
import json
import os
import uuid
from datetime import datetime
from dotenv import load_dotenv

# Load backend environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

API_URL = "http://localhost:8000/api/v1/cea_iot/ingest"

def get_farm_id():
    return "00000000-0000-0000-0000-000000000000"

def generate_sensor_data(state):
    # Simulate a dynamic system that trends towards setpoints or drifts
    state["temperature"] += random.uniform(-0.5, 0.5)
    state["humidity"] += random.uniform(-1.0, 1.0)
    state["co2"] += random.randint(-10, 10)
    state["ph"] += random.uniform(-0.1, 0.1)
    state["ec"] += random.uniform(-0.05, 0.05)
    state["light_intensity_lux"] = random.randint(200, 600)
    state["power_kw"] = round(random.uniform(5.0, 15.0), 1)

    # Keep within realistic bounds
    state["temperature"] = max(18.0, min(30.0, state["temperature"]))
    state["humidity"] = max(40.0, min(90.0, state["humidity"]))
    state["co2"] = max(300, min(1200, state["co2"]))
    state["ph"] = max(4.0, min(8.0, state["ph"]))
    state["ec"] = max(0.5, min(3.0, state["ec"]))

    return {k: round(v, 2) for k, v in state.items()}

def main():
    api_key = os.getenv("CEA_DEVICE_API_KEY", "")
    if not api_key:
        print("CEA_DEVICE_API_KEY is not set in .env! Exiting daemon.")
        return

    print("Starting Hardware-in-the-Loop Simulator Daemon...")
    farm_id = get_farm_id()
    print(f"Targeting API endpoint: {API_URL}")
    print(f"Simulating devices for farm ID: {farm_id}")

    # Internal physical state
    state = {
        "temperature": 24.0,
        "humidity": 65.0,
        "co2": 450,
        "ph": 6.0,
        "ec": 1.5,
        "light_intensity_lux": 400,
        "power_kw": 10.0,
    }

    headers = {
        "X-Device-Key": api_key,
        "Content-Type": "application/json"
    }

    while True:
        try:
            data = generate_sensor_data(state)
            
            payload = {
                "farm_id": farm_id,
                "device_id": "sim_edge_node_01",
                "device_type": "vertical_shelf_1",
                "readings": data,
                "timestamp": datetime.now().isoformat()
            }
            
            response = requests.post(API_URL, json=payload, headers=headers, timeout=5)
            if response.status_code == 201:
                print(f"[{datetime.now().isoformat()}] Sent successfully: {json.dumps(data)}")
            else:
                print(f"[{datetime.now().isoformat()}] Failed to send data: {response.status_code} - {response.text}")
                
        except requests.exceptions.RequestException as e:
            print(f"[{datetime.now().isoformat()}] Connection error (backend might be down): {e}")
            
        # Run loop at a realistic telemetry interval
        time.sleep(5)

if __name__ == "__main__":
    main()
