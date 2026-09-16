import time
import requests
import random
import json
from datetime import datetime

API_URL = "http://localhost:8000/api/v1/cea_iot/ingest"
FARM_ID = "simulated_cea_facility_1"

def generate_sensor_data():
    return {
        "temperature": round(random.uniform(22.0, 26.0), 1),
        "humidity": round(random.uniform(55.0, 75.0), 1),
        "co2": random.randint(400, 1000),
        "ph": round(random.uniform(5.5, 6.5), 1),
        "ec": round(random.uniform(1.2, 2.0), 2),
        "light_intensity": random.randint(200, 600),
    }

def main():
    print(f"Starting hardware simulation loop for farm: {FARM_ID}")
    print(f"Targeting API endpoint: {API_URL}")
    while True:
        try:
            data = generate_sensor_data()
            payload = {
                "farm_id": FARM_ID,
                "data": data
            }
            
            response = requests.post(API_URL, json=payload, timeout=5)
            if response.status_code == 200:
                print(f"[{datetime.now().isoformat()}] Sent successfully: {json.dumps(data)}")
            else:
                print(f"[{datetime.now().isoformat()}] Failed to send data: {response.status_code} - {response.text}")
                
        except requests.exceptions.RequestException as e:
            print(f"[{datetime.now().isoformat()}] Connection error: {e}")
            
        time.sleep(5)

if __name__ == "__main__":
    main()
