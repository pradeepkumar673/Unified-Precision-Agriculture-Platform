# MASTER SPEC — Unified Precision Agriculture Platform


## 0. Ground rules for every AI session
- Single monolith repo: `agri-platform/`. Backend = Python FastAPI. Frontend = React + Vite + Tailwind (web app, not React Native — mobile wrapper is out of scope for 2 days).
- One database: PostgreSQL (use SQLite fallback ONLY if Postgres setup fails — same SQLAlchemy models work for both).
- No microservices. No Docker/K8s. No Redis/Celery. No Firebase. Speed > "enterprise-correctness" for 2 days.
- Every feature gets a real, callable backend endpoint and a DB table — even the ones that are rule-engines or mocked-adapters. Nothing is a hardcoded string returned with no logic behind it.
- ML models are real trained artifacts (`.pkl`/`.pt`/`.joblib` saved to `backend/ml_models/`), loaded and served via FastAPI — not literal fake numbers. Several will be trained on synthetic-but-realistic data because real regional datasets don't exist yet; that's stated openly in the code comments and in `04-FEATURE-CHECKLIST.md`, not hidden.
- Hardware features (#30-33, #37-39, #48) = backend implements the real ingestion endpoint + DB table + an MQTT topic contract, but no physical device runs it. A simulator script fakes sensor pushes so the demo shows live data. Interface docs go to `03-HARDWARE-INTERFACE-SPECS.md` for the hardware builder.
- Gov/bank/payment integrations (#8, #42, #43, #46, #49, #50, #54) use official **sandbox/test modes** (Razorpay test mode is real and free) or a documented **mock adapter** behind the same interface a real one would use — never literally hardcoded happy-path fakes with no adapter boundary.

## 1. Repo structure (create this exact tree first, step 1 of Day 1)
```
agri-platform/
  backend/
    app/
      main.py
      core/          # config, security, db session
      models/        # SQLAlchemy models, one file per domain (farm, crop, market, iot, finance, community, cea, gov)
      schemas/        # Pydantic schemas mirroring models
      api/
        v1/           # one router file per feature-group (see section 3)
      services/       # business logic per feature (rule engines, ML inference wrappers)
      ml/             # training scripts (not imported at runtime — run once, produce artifacts)
    ml_models/        # saved trained model artifacts
    alembic/          # migrations
    requirements.txt
    .env.example
  frontend/
    src/
      pages/          # one folder per feature group
      components/
      api/            # axios client per router
      store/          # zustand or context for auth/session
    package.json
  hardware-sim/
    simulate_sensors.py   # fakes MQTT/REST pushes for demo
  docs/
    (these 5 runbook files live here)
```

## 2. Auth & core conventions
- JWT auth (python-jose + passlib), single `users` table with `role` enum: farmer, agent, admin, buyer, lender.
- All API routes prefixed `/api/v1/<feature-group>`.
- Every table has `id (uuid)`, `created_at`, `updated_at`.
- Every list endpoint paginated (`limit`, `offset`).
- Standard error shape: `{"detail": "..."}`.
- CORS open to `*` for local dev.

## 3. Feature-group → router/table mapping (all 56 features slot into ONE of these 10 groups — never invent a new top-level module)
1. **farm** — #1 Digital Farm Profile, #41 GPS Field Mapping
2. **planning** — #2 AI Crop Planning, #19 Variety Recommendation, #23 RL Crop Rotation, #40 Variable-Rate Application
3. **health** — #4 Crop Health AI, #13 Weed Classification, #20 Pest Spread, #56 Community Surveillance, #51 Livestock Health
4. **water_soil** — #3 Smart Irrigation, #17 Water Demand Forecast, #18 Soil Health Modeling
5. **vision_forecast** — #11 Satellite Stress, #12 Drone Plant Counting, #14 Grain Quality, #15 Mandi Price Forecast, #16 Yield Forecast, #29 Climate Risk
6. **marketplace** — #6 Inputs Marketplace, #7 Machinery Rental, #9 Harvest & Market, #24 Dynamic Routing, #44 AI Input Ranking, #45 Delivery Tracking, #52 Labor Marketplace, #55 B2B Channel, #26 Learned Buyer Matching
7. **finance** — #46 Payment Gateway, #47 Transaction Ledger, #49 Cold Storage+Receipt Financing, #50 Credit Marketplace, #54 Insurance Claims, #28 Anomaly Detection
8. **gov_compliance** — #8 Gov Matching (v1), #42 Auto Eligibility Engine (v2), #43 Document Vault/OCR
9. **community** — #5 Smart Alerts, #10 Season Report, #34 Digital Sakhi, #35 SHG Bookings, #36 Grower Score, #53 FPO Suite
10. **advanced_ai** — #21 Voice Assistant, #22 Multimodal Query, #25 Federated Learning, #27 Causal Simulator
11. **cea_iot** — #30 IoT Sensor Network, #31 Precision Hydroponics, #32 Remote Dashboard, #33 Traceability, #37 Hydroponics Control, #38 Aquaponics Balancer, #39 Vertical Farm Optimizer, #48 CEA Energy Optimization (hardware-interface tier — see doc 03)

## 4. Frozen tech decisions (do not let any AI substitute these)
- Backend: FastAPI, SQLAlchemy 2.0, Pydantic v2, Alembic, python-jose, passlib[bcrypt]
- ML/CV: scikit-learn, xgboost, lightgbm, torch + torchvision (MobileNetV3), opencv-python
- Forecasting: prophet OR statsmodels (pick prophet, simpler API)
- RL: stable-baselines3 + gymnasium
- Causal: dowhy
- Federated: flower (`flwr`)
- OCR: pytesseract + Pillow (needs `apt install tesseract-ocr` once)
- Geospatial: plain lat/lng floats + haversine formula (skip PostGIS/GDAL — too heavy for 2 days)
- Payments: razorpay python SDK, test mode keys
- Frontend: React 18, Vite, TailwindCSS, axios, react-router, zustand, recharts (for dashboards/reports)

## 5. Continuation snapshot (paste this + fill in when starting a NEW account mid-project)
```
PROJECT: Unified Precision Agriculture Platform (see MASTER-SPEC pasted above)
DONE SO FAR: <list files/features completed>
CURRENT FILE TREE: <paste `find agri-platform -type f | grep -v node_modules | grep -v .git`>
LAST WORKING STATE: <what ran successfully last>
NEXT TASK: <the single next step from 01-BUILD-SEQUENCE.md>
CONSTRAINT: Match existing code style/imports exactly. Do not rename existing tables, routes, or files.
```
