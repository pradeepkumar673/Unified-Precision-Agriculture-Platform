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
DONE SO FAR:
- Step 1 complete: Repository tree scaffolded according to MASTER-SPEC Section 1.
- backend/requirements.txt created and all packages installed in backend/venv with PyTorch CUDA 12.1 support.
- backend/app/main.py created with FastAPI app exposing GET /health (returns {"status": "ok"}).
- backend/app/core/db.py wired with SQLAlchemy engine, SessionLocal, Base, and get_db dependency (using SQLite backend/app.db fallback, PostgreSQL compatible).
- backend/app/core/config.py created with Pydantic BaseSettings.
- Alembic initialized in backend/alembic and wired to Base.metadata and DATABASE_URL in env.py.
- Step 2 complete: Group 1 (farm) implemented (#1 Digital Farm Profile, #41 GPS Field Mapping).
  * backend/app/models/farm.py: User (users), Farm (farms), FieldBoundary (field_boundaries).
  * backend/app/schemas/farm.py: FarmCreate, FarmRead, FarmUpdate, BoundaryCreate, BoundaryResponse, Zone.
  * backend/app/api/v1/farm.py: POST /profile, GET /profile/{id}, PUT /profile/{id}, POST /{id}/boundary (shoelace area + KMeans zoning), GET /{id}/zones.
  * Alembic migration 6088d5eb1a27 created & applied. All endpoints tested live.
- Step 3 complete: Group 2 (planning) implemented (#2 AI Crop Planning, #19 Variety Recommendation, #23 RL Crop Rotation, #40 Variable-Rate Application).
  * backend/app/models/planning.py: CropPlan (crop_plans), RotationPlan (rotation_plans), VarietyRecommendation (variety_recommendations), PrescriptionMap (prescription_maps).
  * backend/app/schemas/planning.py: CropPlanRequest/Response/Read, RotationPlanRequest/Response, VarietyRecommendationRequest/Response, VariableRateRequest/Response.
  * backend/app/services/planning.py: Agronomy rules covering 6 soil types x 3 seasons, heuristic rotation rules, variety rules, and linear scaled variable-rate prescriptions with marked TODO(ml-swap) swap points.
  * backend/app/api/v1/planning.py: POST /crop-plan, GET /crop-plan/{farm_id}, POST /rotation-plan, POST /variety-recommendation, POST /variable-rate, GET /variable-rate/{id}/export (GeoJSON).
  * Alembic migration 4bd5c72d8d75 created & applied. All 6 endpoints tested live and confirmed.
- Step 4 complete: Group 3 (health) implemented (#4 Crop Health AI, #13 Weed Classification, #20 Pest Spread, #56 Community Surveillance, #51 Livestock Health).
  * backend/app/models/health.py: DiseaseReport (disease_reports), WeedReport (weed_reports), PestRiskScore (pest_risk_scores), Livestock (livestock), LivestockHealthReport (livestock_health_reports).
  * backend/app/schemas/health.py: DiseaseDetectResponse, DiseaseReportRead, WeedDetectResponse, WeedReportRead, PestRiskEntry, SurveillanceMapEntry, LivestockCreate, LivestockRead, LivestockHealthCheckResponse, LivestockScheduleResponse.
  * backend/app/services/health.py: OpenCV HSV colour heuristics for crop diseases & weed species, synthetic pest risk generator with deterministic village seeding, livestock image variance analysis & default vaccination schedules.
  * backend/app/api/v1/health.py: POST /disease-detect, GET /disease-history/{farm_id}, POST /weed-detect, GET /pest-risk-map, GET /surveillance-map, POST /livestock, POST /livestock/{id}/health-check, GET /livestock/{id}/schedule.
  * Alembic migration 1535432790c1 created & applied. All 8 endpoints tested live with multipart uploads.
- Step 5 complete: Groups 4 & 5 (water_soil, vision_forecast) implemented (#3 Smart Irrigation, #17 Water Demand Forecast, #18 Soil Health, #11 Satellite Stress, #12 Drone Plant Counting, #14 Grain Quality, #15 Mandi Price, #16 Yield, #29 Climate Risk).
  * backend/app/models/water_soil.py: IrrigationSchedule (irrigation_schedules), SoilHealthMap (soil_health_maps).
  * backend/app/models/vision_forecast.py: StressMap (stress_maps), PlantCountReport (plant_count_reports), GrainQualityReport (grain_quality_reports), PriceForecast (price_forecasts), YieldForecast (yield_forecasts), ClimateRiskReport (climate_risk_reports).
  * backend/app/schemas/water_soil.py: IrrigationRecommendationRequest/Response, IrrigationScheduleRead, SoilReadingPoint, SoilMapRequest, SoilGridCell, SoilMapResponse.
  * backend/app/schemas/vision_forecast.py: StressCheckRequest/Response, PlantCountResponse, GrainQualityResponse, PriceForecastResponse, YieldForecastRequest/Response, ClimateRiskResponse.
  * backend/app/services/water_soil.py: FAO-56 Penman-Monteith ET0 + Gaussian Process Regression (GPR RBF) 20x20 soil grid interpolation.
  * backend/app/services/vision_forecast.py: Synthetic NDVI/NDWI satellite stress checks, video contour blob tracking for drone plant counts, grain defect/broken % analysis, mandi price trend/seasonality forecaster, regression-based yield prediction, haversine climate risk scoring.
  * backend/app/api/v1/water_soil.py: POST /irrigation-recommendation, GET /irrigation-history/{farm_id}, POST /soil-map, GET /soil-map/{farm_id}.
  * backend/app/api/v1/vision_forecast.py: POST /stress-check, POST /plant-count, POST /grain-quality, GET /price-forecast, POST /yield-forecast, GET /climate-risk/{farm_id}.
  * Alembic migration 6407017bcef9 created & applied. All 10 endpoints tested live and confirmed.

- Step 6 complete: Groups 6 & 7 (marketplace, finance) implemented (#6 Inputs Marketplace, #7 Machinery Rental, #9 Harvest & Market, #24 Dynamic Routing, #44 AI Input Ranking, #45 Delivery Tracking, #52 Labor Marketplace, #55 B2B Channel, #26 Learned Buyer Matching, #46 Payment Gateway, #47 Transaction Ledger, #49 Cold Storage+Receipt Financing, #50 Credit Marketplace, #54 Insurance Claims, #28 Anomaly Detection).
  * backend/app/models/marketplace.py: Product (products), Order (orders), EquipmentListing (equipment_listings), EquipmentBooking (equipment_bookings), LaborListing (labor_listings), LaborBooking (labor_bookings), BuyerRequirement (buyer_requirements), ExchangeMatch (exchange_matches), B2BStandingOrder (b2b_standing_orders).
  * backend/app/models/finance.py: Transaction (transactions), WarehouseBooking (warehouse_bookings), Loan (loans), InsuranceClaim (insurance_claims), FraudFlag (fraud_flags).
  * backend/app/schemas/marketplace.py & backend/app/schemas/finance.py: Complete Pydantic v2 schemas mirroring all models and API requests/responses.
  * backend/app/services/marketplace.py: Product ranking with predicted yield impact scoring, Haversine route ETA for equipment transit, crop demand exchange aggregator.
  * backend/app/services/finance.py: Razorpay test-mode payment gateway integration & webhook processor, ReportLab PDF ledger statement generator, WDRA mock e-NWR generator, multi-factor rule-based credit scoring engine, insurance claim evidence aggregator, anomaly / fraud detector.
  * backend/app/api/v1/marketplace.py: GET /products, POST /order, POST /equipment/book, POST /labor/book, POST /buyer-requirement, POST /exchange-match, GET /delivery-status/{order_id}, POST /b2b/standing-order.
  * backend/app/api/v1/finance.py: POST /payment/initiate, POST /payment/webhook, GET /ledger/{farm_id}, GET /ledger/{farm_id}/export (PDF), POST /warehouse/book, POST /warehouse/{booking_id}/generate-enwr, POST /loan/apply, POST /insurance/claim, GET /insurance/claim/{claim_id}, POST /fraud-check.
  * Alembic migration d9fcf803d7a5 created & applied. All 16 endpoints + edge cases tested live and confirmed.

CURRENT FILE TREE:
.gitignore
backend/.env.example
backend/alembic.ini
backend/alembic/README
backend/alembic/env.py
backend/alembic/script.py.mako
backend/alembic/versions/1535432790c1_create_disease_reports_weed_reports_.py
backend/alembic/versions/4bd5c72d8d75_create_crop_plans_rotation_plans_.py
backend/alembic/versions/6088d5eb1a27_create_users_farms_and_field_boundaries_.py
backend/alembic/versions/6407017bcef9_create_water_soil_and_vision_forecast_.py
backend/alembic/versions/d9fcf803d7a5_create_marketplace_and_finance_tables.py
backend/app/__init__.py
backend/app/api/__init__.py
backend/app/api/v1/__init__.py
backend/app/api/v1/farm.py
backend/app/api/v1/finance.py
backend/app/api/v1/health.py
backend/app/api/v1/marketplace.py
backend/app/api/v1/planning.py
backend/app/api/v1/vision_forecast.py
backend/app/api/v1/water_soil.py
backend/app/core/__init__.py
backend/app/core/config.py
backend/app/core/db.py
backend/app/main.py
backend/app/ml/__init__.py
backend/app/models/__init__.py
backend/app/models/farm.py
backend/app/models/finance.py
backend/app/models/health.py
backend/app/models/marketplace.py
backend/app/models/planning.py
backend/app/models/vision_forecast.py
backend/app/models/water_soil.py
backend/app/models/gov_compliance.py
backend/app/models/community.py
backend/app/schemas/__init__.py
backend/app/schemas/farm.py
backend/app/schemas/finance.py
backend/app/schemas/health.py
backend/app/schemas/marketplace.py
backend/app/schemas/planning.py
backend/app/schemas/vision_forecast.py
backend/app/schemas/water_soil.py
backend/app/schemas/gov_compliance.py
backend/app/schemas/community.py
backend/app/services/__init__.py
backend/app/services/finance.py
backend/app/services/health.py
backend/app/services/marketplace.py
backend/app/services/planning.py
backend/app/services/vision_forecast.py
backend/app/services/water_soil.py
backend/app/services/gov_compliance.py
backend/app/services/community.py
backend/app/api/v1/gov_compliance.py
backend/app/api/v1/community.py
backend/requirements.txt
backend/sample_cow.jpg
backend/sample_leaf.jpg
backend/sample_weed.jpg
backend/test_step6.py
backend/test_step7.py
docs/00-MASTER-SPEC.md
docs/01-BUILD-SEQUENCE.md
docs/02-ML-TRAINING-PROMPTS.md
docs/03-HARDWARE-INTERFACE-SPECS.md
docs/04-FEATURE-CHECKLIST.md
frontend/package.json
hardware-sim/simulate_sensors.py

LAST WORKING STATE (Step 7 complete):
FastAPI server running on http://127.0.0.1:8000. All 12 Step 7 tests pass live.
Gov Compliance endpoints fully operational:
  GET  /api/v1/gov/schemes/match/{farm_id}   -- 6-scheme seeded DB (PM-KISAN, PMFBY, KCC, PM-KUSUM, TN Uzhavar, Karnataka RytaBandhu). Tamil Nadu farm returns 5 eligible schemes.
  POST /api/v1/gov/documents/upload          -- Multipart upload + graceful pytesseract OCR (returns ocr_extracted dict; structured fields populated when Tesseract installed).
  POST /api/v1/gov/documents/{doc_id}/autofill/{scheme_id} -- 14 form fields auto-populated from OCR + farm profile.
Community endpoints fully operational:
  GET  /api/v1/community/alerts/{farm_id}             -- 3 synthetic rule-based alerts (irrigation, pest, spray_window) generated from StressAlert and farm data.
  GET  /api/v1/community/season-report/{farm_id}      -- Aggregates transactions + CropPlan + YieldForecast. Real ROI 60% for test farm.
  POST /api/v1/community/support-ticket               -- Ticket created with status=open.
  POST /api/v1/community/shg/create                   -- SHG group with member_farm_ids.
  POST /api/v1/community/shg/{id}/book                -- SHG cost-split equipment booking.
  GET  /api/v1/community/grower-score/{farm_id}       -- Score 600/1000, 75th percentile district.
  POST /api/v1/community/fpo/create                   -- FPO group created.
  POST /api/v1/community/fpo/{id}/pool-purchase       -- Pooled purchase appended (Urea, Rs 8500).
  POST /api/v1/community/fpo/{id}/pool-sale           -- Pooled sale appended (Paddy Grade-A, Rs 176000).
Alembic migration 71c57daec0d6 applied (12 new tables: fpo_groups, schemes, shg_groups, alerts, documents, eligibility_matches, grower_scores, season_reports, support_tickets, shg_bookings).
All previous steps (1-6) remain fully functional.

NEXT TASK:
STEP 8 — Groups 10 & 11: IoT / Hardware Ingestion and CEA (Controlled Environment Agriculture).
Implement hardware ingestion endpoints (MQTT topic contracts), sensor DB tables, simulator script updates, and CEA endpoints from docs/01-BUILD-SEQUENCE.md.
Features: #30-33 (IoT sensors), #37-39 (hardware integrations), #48 (equipment telemetry), #44-45 (CEA grow cycles and environment control).

CONSTRAINT: Match existing code style/imports exactly. Do not rename existing tables, routes, or files.
```

