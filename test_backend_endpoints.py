import urllib.request
import json
import time

BASE_URL = "http://localhost:8000/api/v1"
FARM_ID = "11111111-1111-1111-1111-111111111111"

endpoints = [
    f"/farm/dashboard/{FARM_ID}",
    f"/farm/{FARM_ID}/fields",
    f"/farm/profile/{FARM_ID}",
    
    f"/health/disease-history/{FARM_ID}",
    f"/health/pest-risk-map?district=Pune",
    f"/health/surveillance-map?district=Pune",
    f"/health/livestock/records/{FARM_ID}",
    
    f"/water-soil/soil-health/{FARM_ID}",
    f"/water-soil/irrigation/schedule/{FARM_ID}",
    f"/water-soil/zones/{FARM_ID}",
    
    f"/planning/crop-plan/{FARM_ID}",
    f"/planning/rotation/{FARM_ID}",
    
    f"/community/alerts",
    f"/community/grower-score/{FARM_ID}",
    
    f"/vision/yield-forecast/{FARM_ID}",
    
    f"/marketplace/products",
    f"/marketplace/equipment",
    f"/marketplace/labor",
    
    f"/finance/ledger/{FARM_ID}",
    f"/finance/loans/{FARM_ID}",
    f"/finance/insurance/policies/{FARM_ID}",
    
    f"/gov/schemes/{FARM_ID}",
    f"/gov/documents/{FARM_ID}",
]

results = []

for ep in endpoints:
    try:
        req = urllib.request.Request(BASE_URL + ep)
        with urllib.request.urlopen(req) as response:
            results.append(f"{ep}: {response.getcode()}")
    except urllib.error.HTTPError as e:
        results.append(f"{ep}: {e.code}")
    except Exception as e:
        results.append(f"{ep}: ERROR {e}")

with open("backend_test_results.txt", "w") as f:
    f.write("\n".join(results))
print("Finished testing backend endpoints.")
