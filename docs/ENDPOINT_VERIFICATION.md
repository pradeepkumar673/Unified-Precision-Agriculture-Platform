# Endpoint Verification

Audited 2026-09-16 using `backend/venv/Scripts/python.exe`.

| Command | Result |
|---|---|
| `python -m compileall -q app` | PASS |
| `venv\\Scripts\\python.exe -c "from app.main import app; print(len(app.openapi()['paths']))"` | PASS: 75 routes |
| `venv\\Scripts\\python.exe test_step6.py` | PASS: 17 marketplace/finance flows. Payment configuration is correctly reported as a 503 blocked dependency. |
| `venv\\Scripts\\python.exe test_step7.py` | PASS: 12 government/community flows. |
| `venv\\Scripts\\python.exe test_step8.py` | PASS: advanced-ai test flows. CPU Whisper loads successfully after the device fix; current test audio is a tone and transcribes to an empty string, so spoken-query validation remains required. |
| `npm run build` | PASS after adding `frontend/src/services/api.js`; bundle warning only. |

Known failed/degraded checks:

- `frontend/src/pages/cea_iot/TraceabilityPage.jsx`: build originally failed because `../../services/api` did not exist. Fixed by adding the shared axios client.
- `backend/test_step6.py`: expected the wrong HTTP status for a deliberately unconfigured Razorpay service. Updated from 502 to 503.
- `backend/app/services/advanced_ai.py`: CPU model loading was fixed. A real spoken agriculture recording is still required to validate transcription quality.
- `backend/app/services/vision_forecast.py`: `ml_models/yolov8n_plants.pt` loads as generic COCO YOLOv8n rather than a plant-trained checkpoint; plant counting remains unvalidated and can return fixed fallback values.

The test scripts do not cover every one of the 75 API paths. No browser E2E
suite or route-by-route frontend test exists yet; therefore no whole-product
completion percentage may be inferred from these checks.
