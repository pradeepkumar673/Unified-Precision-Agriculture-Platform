# BUILD SEQUENCE — 2 Days, exact prompts, copy-paste each block as-is

## How to use this file
Every block below marked **PASTE THIS →** is a complete, ready-to-send message. Before the FIRST prompt in any new chat/account, paste `00-MASTER-SPEC.md` in full as your first message, wait for it to acknowledge, then send the numbered prompt. Never send a prompt without the Master Spec having been pasted first in that chat.

After every prompt that generates code, the prompt itself asks the AI for curl test commands. Run every single one. If a curl command errors, paste the exact error back into the SAME chat and get it fixed before sending the next numbered prompt. Do not skip ahead with broken code.

---

# DAY 1

### STEP 1 — Scaffold (Antigravity)
**PASTE THIS →**
```
Using the MASTER-SPEC.md I pasted above, do the following, in order, and confirm each before moving to the next:
1. Create the exact repo tree from MASTER-SPEC section 1.
2. Create backend/requirements.txt with: fastapi, uvicorn[standard], sqlalchemy>=2.0, pydantic>=2.0, alembic, python-jose[cryptography], passlib[bcrypt], python-multipart, psycopg2-binary, scikit-learn, xgboost, lightgbm, torch, torchvision, opencv-python, prophet, stable-baselines3, gymnasium, dowhy, flwr, pytesseract, Pillow, razorpay, ortools, openai-whisper, python-dotenv
3. Create a Python virtualenv in backend/, activate it, install requirements.txt. Show me any install errors and fix them (common ones: torch needs the CUDA index URL for GPU — use `pip install torch --index-url https://download.pytorch.org/whl/cu121`).
4. Create backend/app/main.py with a FastAPI app exposing GET /health returning {"status":"ok"}.
5. Set up PostgreSQL locally (or SQLite fallback at backend/app.db if Postgres setup fails) and wire backend/app/core/db.py with a SQLAlchemy engine + session dependency.
6. Initialize Alembic pointed at that database.
7. Initialize git and commit.
8. Run the server and give me the exact curl command to hit /health. Run it yourself first and confirm it returns 200 before telling me it's done.
```

---

### STEP 2 — Group 1: farm (backend, DeepSeek or Antigravity)
**PASTE THIS →**
```
Implement group "farm" for the FastAPI project described in MASTER-SPEC.md (paste it above this if not already in this chat).

Create these EXACT SQLAlchemy 2.0 models in app/models/farm.py — no extra fields, no missing fields, no renaming:

Table farms: id (uuid pk), user_id (fk to users.id), name (str), land_size_acres (float), soil_type (enum: clay, loam, sandy, silt, black, red), water_source (enum: borewell, canal, rainfed, pond), latitude (float), longitude (float), equipment_owned (JSON list of strings), annual_income_range (enum: under_1L, 1L_5L, 5L_10L, above_10L), crop_history (JSON list of objects with season, year, crop), created_at, updated_at.

Table field_boundaries: id (uuid pk), farm_id (fk), boundary_points (JSON list of {lat, lng} objects), zones (JSON list of {zone_id, polygon_points, soil_score, ndvi_score} objects), created_at.

Then create app/schemas/farm.py with matching Pydantic v2 schemas (Create/Read/Update variants).

Then create app/api/v1/farm.py with EXACTLY these endpoints:
- POST /api/v1/farm/profile — body: name, land_size_acres, soil_type, water_source, latitude, longitude, equipment_owned, annual_income_range, crop_history → creates and returns the farm with its id, 201 status
- GET /api/v1/farm/profile/{farm_id} → returns the farm or 404
- PUT /api/v1/farm/profile/{farm_id} → partial update, returns updated farm
- POST /api/v1/farm/{farm_id}/boundary — body: gps_points (list of {lat,lng}) → compute the polygon area using the shoelace formula, generate 3-5 zones by running k-means (scikit-learn) on synthetic per-point soil_score and ndvi_score values you generate with numpy, save and return {boundary_points, zones}
- GET /api/v1/farm/{farm_id}/zones → returns the zones list from the latest boundary record

Wire the router into main.py. Then give me one working curl command for each of the 4 endpoints above, using realistic example values (e.g. a 5-point polygon for the boundary one). Run them yourself and show me the actual response before telling me you're done.
```

---

### STEP 3 — Group 2: planning (backend)
**PASTE THIS →**
```
Implement group "planning" for the same FastAPI project (MASTER-SPEC.md pasted above).

Create these EXACT SQLAlchemy models in app/models/planning.py:

Table crop_plans: id (uuid pk), farm_id (fk), season (enum: kharif, rabi, zaid), year (int), recommended_crop (str), recommended_variety (str), sowing_date (date), expected_investment (float), status (enum: planned, active, harvested), created_at.

Table rotation_plans: id (uuid pk), farm_id (fk), season_sequence (JSON list of {season, crop}), rl_confidence (float), soil_impact_score (float), created_at.

Table variety_recommendations: id (uuid pk), farm_id (fk), crop (str), recommended_varieties (JSON list of {name, score}), created_at.

Table prescription_maps: id (uuid pk), farm_id (fk), crop (str), zone_prescriptions (JSON list of {zone_id, seed_rate_kg, fertilizer_kg, pesticide_ml}), export_format (str), created_at.

Then matching Pydantic schemas in app/schemas/planning.py.

Then app/api/v1/planning.py with EXACTLY:
- POST /api/v1/planning/crop-plan — body: farm_id, season, year → for now (before the ML model exists) use a rule-based lookup: pick a crop based on the farm's soil_type and season using a hardcoded agronomy rules dict you write covering all 6 soil types x 3 seasons combinations with realistic Indian crops (e.g. black soil + kharif → cotton). Return {recommended_crop, recommended_variety, sowing_date, expected_investment, reasoning}. Add a TODO comment marking exactly where this gets swapped for the ML model later.
- GET /api/v1/planning/crop-plan/{farm_id} → list of past plans
- POST /api/v1/planning/rotation-plan — body: farm_id, soil_nitrogen, soil_organic_carbon, last_3_crops → same pattern, rule-based placeholder returning a legume if last_3_crops has no legume in it, else the highest-value non-repeating crop from a hardcoded list, marked with a TODO for the RL model swap. Return {next_crop, projected_profit, projected_soil_impact}
- POST /api/v1/planning/variety-recommendation — body: farm_id, crop → return 2-3 varieties from a hardcoded per-crop variety dict you write, with scores. Return {recommended_varieties: [{name, score}]}
- POST /api/v1/planning/variable-rate — body: farm_id, crop, zones (list of zone objects with soil_score/ndvi_score) → compute a seed_rate/fertilizer_kg/pesticide_ml per zone using simple linear rules scaled by soil_score, return {zone_prescriptions, export_format: "geojson"}
- GET /api/v1/planning/variable-rate/{id}/export → returns the zone_prescriptions as a downloadable .geojson file

Wire into main.py. Give me one curl command per endpoint with realistic values, run them, show me the real responses.
```

---

### STEP 4 — Group 3: health (backend)
**PASTE THIS →**
```
Implement group "health" for the same FastAPI project (MASTER-SPEC.md pasted above).

Create these EXACT SQLAlchemy models in app/models/health.py:

Table disease_reports: id (uuid pk), farm_id (fk), image_path (str), crop (str), predicted_disease (str), confidence (float), severity (enum: low, medium, high), treatment_recommendation (text), language (str, default 'en'), is_public_surveillance (bool, default true), created_at.

Table weed_reports: id (uuid pk), farm_id (fk), image_path (str), predicted_species (str), confidence (float), recommended_herbicide (str), dosage_ml_per_acre (float), created_at.

Table pest_risk_scores: id (uuid pk), village_name (str), district (str), risk_score (float), week_of (date), contributing_reports_count (int).

Table livestock: id (uuid pk), farm_id (fk), animal_type (enum: cow, buffalo, goat, poultry), tag_id (str), vaccination_schedule (JSON), breeding_cycle (JSON), milk_yield_log (JSON list of {date, liters}).

Table livestock_health_reports: id (uuid pk), livestock_id (fk), image_path (str), predicted_condition (str), confidence (float), vet_booking_requested (bool), created_at.

Then matching Pydantic schemas in app/schemas/health.py.

Then app/api/v1/health.py with EXACTLY:
- POST /api/v1/health/disease-detect — multipart file upload (image) plus form fields crop, farm_id → save uploaded image to disk under a media/ folder, and for now return a placeholder-but-real-logic response using an OpenCV-based heuristic (compute average green/brown pixel ratio in the image and map to one of 5 disease labels with a confidence score derived from the ratio) — mark clearly with a TODO comment that this gets replaced by the trained CNN in ml_models/crop_disease_model.pt later. Insert a disease_reports row. Return {predicted_disease, confidence, severity, treatment_recommendation}.
- GET /api/v1/health/disease-history/{farm_id} → list of past reports
- POST /api/v1/health/weed-detect — same multipart pattern, same kind of OpenCV heuristic placeholder with a TODO, return {species, confidence, herbicide, dosage_ml_per_acre}
- GET /api/v1/health/pest-risk-map?district=X → query pest_risk_scores table, if empty generate synthetic seed data for 5 villages in that district and return it
- GET /api/v1/health/surveillance-map?district=X → aggregate disease_reports count grouped by a village field you add to the query, return counts
- POST /api/v1/health/livestock — body: farm_id, animal_type, tag_id → create and return record
- POST /api/v1/health/livestock/{id}/health-check — multipart image → same OpenCV heuristic placeholder pattern with TODO, return {predicted_condition, confidence, vet_booking_requested}
- GET /api/v1/health/livestock/{id}/schedule → return vaccination_schedule and breeding_cycle

Wire into main.py. Give me one curl command per endpoint (for the multipart ones, show me the -F flag syntax with a sample image path), run them, show me real responses.
```

---

### STEP 5 — Groups 4 & 5: water_soil, vision_forecast (backend)
**PASTE THIS →**
```
Implement groups "water_soil" and "vision_forecast" for the same FastAPI project (MASTER-SPEC.md pasted above).

app/models/water_soil.py:
Table irrigation_schedules: id (uuid pk), farm_id (fk), crop (str), date (date), recommended_liters (float), current_moisture_pct (float), et0_value (float), created_at.
Table soil_health_maps: id (uuid pk), farm_id (fk), grid_data (JSON — a 20x20 array of {n,p,k,ph} objects), generated_at.

app/models/vision_forecast.py:
Table stress_alerts: id (uuid pk), farm_id (fk), date (date), ndvi_value (float), ndwi_value (float), stress_level (enum: none, mild, moderate, severe).
Table plant_counts: id (uuid pk), farm_id (fk), video_path (str), count (int), gaps_detected (int), growth_stage (str), created_at.
Table grain_quality_reports: id (uuid pk), farm_id (fk), image_path (str), moisture_pct (float), broken_pct (float), foreign_matter_pct (float), grade (enum: A, B, C), created_at.
Table price_forecasts: id (uuid pk), crop (str), district (str), forecast_date (date), predicted_price (float), low_ci (float), high_ci (float).
Table yield_forecasts: id (uuid pk), farm_id (fk), crop (str), low_kg (float), median_kg (float), high_kg (float), forecast_date (date).
Table climate_risk_scores: id (uuid pk), farm_id (fk), drought_risk (float), flood_risk (float), heat_risk (float), horizon_years (int).

Matching Pydantic schemas in app/schemas/water_soil.py and app/schemas/vision_forecast.py.

app/api/v1/water_soil.py EXACTLY:
- POST /api/v1/water_soil/irrigation-recommendation — body: farm_id, crop, growth_stage, current_moisture_pct → implement the actual Penman-Monteith ET0 formula (write the real formula, use fixed reasonable weather constants as a stub for now — mark with TODO to swap in a live weather API), then adjust liters based on current_moisture_pct and growth_stage with a simple multiplier table you write, return {recommended_liters_per_day, next_irrigation_date, et0}
- GET /api/v1/water_soil/irrigation-history/{farm_id}
- POST /api/v1/water_soil/soil-map — body: farm_id, sparse_readings (list of {lat,lng,n,p,k,ph}) → use scikit-learn's GaussianProcessRegressor to interpolate a 20x20 grid from the sparse points, return {grid_data}
- GET /api/v1/water_soil/soil-map/{farm_id}

app/api/v1/vision_forecast.py EXACTLY:
- POST /api/v1/vision_forecast/stress-check — body: farm_id → generate a synthetic but plausible NDVI/NDWI time series for demo purposes (mark TODO for real Sentinel-2 API), classify stress_level from thresholds, return {ndvi_value, ndwi_value, stress_level}
- POST /api/v1/vision_forecast/plant-count — multipart video → use OpenCV to sample frames and count contour blobs above a size threshold as a placeholder plant-counting heuristic (mark TODO for YOLOv8), return {count, gaps_detected, growth_stage}
- POST /api/v1/vision_forecast/grain-quality — multipart image → OpenCV color/texture heuristic placeholder (mark TODO for trained CNN), return {moisture_pct, broken_pct, foreign_matter_pct, grade}
- GET /api/v1/vision_forecast/price-forecast?crop=X&district=Y&weeks_ahead=4 → generate synthetic historical price series with seasonality and fit it live with statsmodels or a simple moving-average + trend model (mark TODO for the trained Prophet model), return {predicted_price, low_ci, high_ci}
- POST /api/v1/vision_forecast/yield-forecast — body: farm_id, crop → rule-based estimate using a hardcoded average-yield-per-acre table times farm's land_size_acres, +/-15% band (mark TODO for LightGBM quantile model), return {low_kg, median_kg, high_kg}
- GET /api/v1/vision_forecast/climate-risk/{farm_id} → synthetic risk scores based on a hardcoded district-risk lookup table, return {drought_risk, flood_risk, heat_risk}

Wire both routers into main.py. Give me one curl command per endpoint, run them, show me real responses.
```

---

### STEP 6 — Groups 6 & 7: marketplace, finance (backend)
**PASTE THIS →**
```
Implement groups "marketplace" and "finance" for the same FastAPI project (MASTER-SPEC.md pasted above).

app/models/marketplace.py:
Table products: id (uuid pk), name (str), category (enum: seed, fertilizer, pesticide), price (float), vendor_id (str), stock (int).
Table orders: id (uuid pk), farm_id (fk), product_id (fk), qty (int), status (enum: placed, shipped, delivered, delayed), delivery_eta (datetime), critical_window_end (datetime, nullable).
Table equipment_listings: id (uuid pk), owner_id (str), equipment_type (str), latitude (float), longitude (float), daily_rate (float), available (bool).
Table equipment_bookings: id (uuid pk), listing_id (fk), farm_id (fk), start_date (date), end_date (date), status (str), assigned_route_eta (datetime, nullable).
Table labor_listings: id (uuid pk), gang_id (str), skill (str), daily_wage (float), latitude (float), longitude (float), availability_calendar (JSON).
Table labor_bookings: id (uuid pk), listing_id (fk), farm_id (fk), task_type (str), date (date), status (str).
Table buyer_requirements: id (uuid pk), buyer_id (str), crop (str), qty_needed_kg (float), quality_grade (str), price_offered (float).
Table exchange_matches: id (uuid pk), buyer_requirement_id (fk), farm_ids (JSON list), aggregated_qty_kg (float), match_score (float), status (str).
Table b2b_standing_orders: id (uuid pk), buyer_id (str), buyer_type (enum: retail, horeca, processor), crop (str), recurring_qty_kg (float), fulfilment_status (str).

app/models/finance.py:
Table transactions: id (uuid pk), user_id (fk), type (enum: marketplace, rental, scheme_dbt, exchange_sale, loan_disbursement), amount (float), status (enum: pending, escrow_held, released, refunded), related_entity_id (str), tag (str), created_at.
Table warehouse_bookings: id (uuid pk), farm_id (fk), facility_id (str), qty_kg (float), quality_grade (str), e_nwr_id (str, nullable), loan_eligible (bool).
Table loans: id (uuid pk), farm_id (fk), amount (float), credit_score (int), status (enum: applied, approved, disbursed, repaid), lender (str), top_factors (JSON).
Table insurance_claims: id (uuid pk), farm_id (fk), policy_id (str), loss_event_date (date), evidence (JSON), status (enum: filed, under_review, approved, settled), settlement_amount (float, nullable).
Table fraud_flags: id (uuid pk), transaction_id (fk), anomaly_score (float), flagged (bool).

Matching Pydantic schemas for both groups.

app/api/v1/marketplace.py EXACTLY:
- GET /api/v1/marketplace/products?farm_id=X → return all products, sorted by a simple placeholder ranking score (price ascending for now, mark TODO for the learning-to-rank model), include predicted_yield_impact_score field set to a random-but-stable value per product for now
- POST /api/v1/marketplace/order — body: farm_id, product_id, qty → create order, set delivery_eta to now+3days
- POST /api/v1/marketplace/equipment/book — body: listing_id, farm_id, start_date, end_date → check availability, create booking, compute assigned_route_eta using simple haversine distance / average speed (mark TODO for OR-Tools optimization)
- POST /api/v1/marketplace/labor/book — body: listing_id, farm_id, task_type, date → create booking if listing available that date
- POST /api/v1/marketplace/buyer-requirement — body: buyer_id, crop, qty_needed_kg, quality_grade, price_offered → create record
- POST /api/v1/marketplace/exchange-match — body: buyer_requirement_id → find farms with matching crop in their crop_plans (join query), aggregate until qty_needed_kg is met (mark TODO for real ranking model), create and return exchange_match
- GET /api/v1/marketplace/delivery-status/{order_id} → return order with a computed "delayed" boolean (true if now > critical_window_end)
- POST /api/v1/marketplace/b2b/standing-order — body: buyer_id, buyer_type, crop, recurring_qty_kg → create record

app/api/v1/finance.py EXACTLY:
- POST /api/v1/finance/payment/initiate — body: related_entity_id, amount, type → create a REAL Razorpay TEST MODE order using the razorpay python SDK (use Razorpay's published test key_id/key_secret from their docs), return {razorpay_order_id, checkout_url}. Also insert a transactions row with status=pending.
- POST /api/v1/finance/payment/webhook — accept Razorpay's webhook payload shape, update matching transaction to escrow_held or released based on event type
- GET /api/v1/finance/ledger/{farm_id} → return transactions for that user, tagged
- GET /api/v1/finance/ledger/{farm_id}/export → generate and return a PDF of the ledger using weasyprint or reportlab
- POST /api/v1/finance/warehouse/book — body: farm_id, facility_id, qty_kg → create booking
- POST /api/v1/finance/warehouse/{booking_id}/generate-enwr → generate a fake but realistic-looking e_nwr_id string (mock WDRA adapter, mark clearly as mock in a code comment and in the response with a field "is_mock": true), set loan_eligible true
- POST /api/v1/finance/loan/apply — body: farm_id, amount → rule-based credit score placeholder: start at 600, +50 if farm has >2 completed crop_plans, +30 if no fraud_flags, -100 if land_size_acres < 1 (mark TODO for XGBoost model), return {credit_score, approved: credit_score>650, top_factors, terms}
- POST /api/v1/finance/insurance/claim — body: farm_id, policy_id, loss_event_date, photo_paths → pull any stress_alerts and disease_reports near that date for that farm as evidence, create claim with status=filed
- GET /api/v1/finance/insurance/claim/{claim_id}
- POST /api/v1/finance/fraud-check — body: transaction_id → rule-based placeholder: flag if amount > 3x the farm's average transaction (mark TODO for Isolation Forest model), return {anomaly_score, flagged}

Wire both routers into main.py. For the Razorpay integration, use their actual documented test-mode flow — look this up, don't guess at the SDK usage. Give me one curl command per endpoint, run them, show me real responses (for the Razorpay one, confirm you get a real test-mode order id back).
```

---

### STEP 7 — Groups 8 & 9: gov_compliance, community (backend)
**PASTE THIS →**
```
Implement groups "gov_compliance" and "community" for the same FastAPI project (MASTER-SPEC.md pasted above).

app/models/gov_compliance.py:
Table schemes: id (uuid pk), name (str), criteria (JSON, e.g. {max_land_acres, min_income, crop_types, state}), benefit_amount (float), deadline (date), level (enum: central, state).
Table eligibility_matches: id (uuid pk), farm_id (fk), scheme_id (fk), eligible (bool), computed_at.
Table documents: id (uuid pk), farm_id (fk), doc_type (enum: aadhaar, land_record, bank_passbook, insurance), file_path (str), ocr_extracted (JSON), verified (bool).

app/models/community.py:
Table alerts: id (uuid pk), farm_id (fk), type (enum: weather, irrigation, pest, spray_window), message (text), created_at, read (bool).
Table season_reports: id (uuid pk), farm_id (fk), season (str), year (int), investment (float), income (float), profit (float), roi_pct (float), suggestions (JSON), generated_at.
Table support_tickets: id (uuid pk), farm_id (fk), agent_id (str, nullable), issue (text), status (enum: open, in_progress, closed), notes (text).
Table shg_groups: id (uuid pk), name (str), member_farm_ids (JSON list).
Table shg_bookings: id (uuid pk), shg_id (fk), equipment_booking_id (fk), split_amounts (JSON).
Table grower_scores: id (uuid pk), farm_id (fk), score (int), district_percentile (int), computed_at.
Table fpo_groups: id (uuid pk), name (str), member_farm_ids (JSON list), pooled_purchases (JSON), pooled_sales (JSON), scheme_compliance (JSON).

Matching Pydantic schemas for both.

app/api/v1/gov_compliance.py EXACTLY:
- GET /api/v1/gov/schemes/match/{farm_id} → seed the schemes table (if empty) with real criteria for PM-KISAN, PMFBY, KCC, PM-KUSUM, and 2 realistic state subsidy examples — look up real eligibility criteria for these, don't invent numbers — then evaluate this farm's profile against each scheme's criteria JSON and return the ones it qualifies for
- POST /api/v1/gov/documents/upload — multipart file + form fields doc_type, farm_id → run pytesseract OCR on the image, store extracted text in ocr_extracted, return {ocr_extracted, document_id}
- POST /api/v1/gov/documents/{doc_id}/autofill/{scheme_id} → return a dict of form field names to values pulled from ocr_extracted and the farm profile

app/api/v1/community.py EXACTLY:
- GET /api/v1/community/alerts/{farm_id} → return alerts, if none exist generate 2-3 synthetic ones from current stress_alerts/pest_risk data for that farm
- GET /api/v1/community/season-report/{farm_id}?season=X&year=Y → aggregate transactions, crop_plans, and yield_forecasts for that farm/season into investment/income/profit/roi_pct, generate 2-3 suggestion strings from simple rule comparisons (e.g. if roi_pct < peer average)
- POST /api/v1/community/support-ticket — body: farm_id, issue → create ticket
- POST /api/v1/community/shg/create — body: name, member_farm_ids → create group
- POST /api/v1/community/shg/{id}/book — body: equipment_booking_id, split_amounts → create shg_booking
- GET /api/v1/community/grower-score/{farm_id} → compute a weighted score from season_reports (roi_pct weighted 40%, on-time-payment history 30%, adoption of recommended practices 30% — use whatever proxy data exists), compute percentile against other farms in same district
- POST /api/v1/community/fpo/create — body: name, member_farm_ids
- POST /api/v1/community/fpo/{id}/pool-purchase and /pool-sale — body: item details → append to pooled_purchases/pooled_sales JSON

Wire both routers into main.py. Give me one curl command per endpoint, run them, show me real responses.
```

---

### STEP 8 — Group 10: advanced_ai (backend, do this last on Day 1 or first on Day 2 — it's the novelty group)
**PASTE THIS →**
```
Implement group "advanced_ai" for the same FastAPI project (MASTER-SPEC.md pasted above).

app/models/advanced_ai.py:
Table voice_queries: id (uuid pk), farm_id (fk), audio_path (str), transcribed_text (text), language (str), response_text (text), created_at.
Table multimodal_queries: id (uuid pk), farm_id (fk), image_path (str, nullable), input_text (text, nullable), combined_response (text), created_at.
Table fl_training_runs: id (uuid pk), round_number (int), participating_farms (JSON), aggregate_accuracy (float), completed_at.
Table causal_simulations: id (uuid pk), farm_id (fk), current_decision (JSON), proposed_change (JSON), projected_delta (JSON), explanation (text), created_at.

Matching Pydantic schemas.

app/api/v1/advanced_ai.py EXACTLY:
- POST /api/v1/advanced_ai/voice-query — multipart audio file + farm_id → transcribe using the `openai-whisper` "base" model (pip install openai-whisper, this runs locally, no API key needed) → transcribed_text, then look up a canned agri-domain response from a small keyword-matched dict you write covering common queries (irrigation, disease, price) → return {transcribed_text, response_text}
- POST /api/v1/advanced_ai/multimodal-query — multipart image (optional) + text/audio (optional) → if image present, reuse the disease-detect heuristic from the health group; combine with any text into one response string
- POST /api/v1/advanced_ai/federated/trigger-round → this one is real, not a placeholder — actually run a Flower (flwr) simulation with 4 simulated farm clients training a small sklearn/torch classifier on locally-partitioned synthetic feature data, aggregate via FedAvg for 5 rounds using flwr.simulation.start_simulation, save the fl_training_runs row with the real resulting aggregate_accuracy, return it
- POST /api/v1/advanced_ai/whatif-simulate — body: farm_id, current_decision, proposed_change → this one is real too — use the `dowhy` library with a small causal graph (irrigation_method and sowing_week_offset affect yield; yield affects profit) fit on a synthetic dataset you generate, estimate the causal effect of the proposed change via backdoor adjustment, return {projected_yield_delta, projected_profit_delta, explanation}

These last two endpoints matter most for the demo — actually run them yourself and paste me the real accuracy/effect numbers you get, don't just tell me the code compiles.

Wire the router into main.py. Give me curl commands for all 4 endpoints, run them, show me the real output including the federated learning accuracy number and the causal simulation numbers.
```

---

# DAY 2

### STEP 9 — RL Crop Rotation model (Claude — replaces the Step 3 placeholder)
**PASTE THIS →**
```
Write a complete, runnable Python training script for a crop-rotation RL agent:
- Build a custom Gymnasium environment: state = [soil_nitrogen (0-100), soil_organic_carbon (0-100), one-hot of last_3_crops from a 6-crop set]. Actions = choose 1 of 6 crops to plant next. Reward = profit_estimate(crop) - soil_degradation_penalty(if same crop repeated 2+ times in a row) + soil_recovery_bonus(if a legume follows a non-legume). Episode = 5 seasons.
- Train a PPO agent using stable-baselines3 for 50,000 timesteps.
- Save the trained model to backend/ml_models/rl_rotation_model.zip
- Write a predict(soil_nitrogen, soil_organic_carbon, last_3_crops) function in backend/app/services/ml_rotation.py that loads the model and returns {next_crop, projected_profit, projected_soil_impact}
- Give me the exact terminal command to run the training script, and tell me roughly how long it should take on a CPU (this doesn't need GPU).
Then show me how to wire this predict() function into the existing POST /api/v1/planning/rotation-plan endpoint, replacing the rule-based placeholder, keeping the exact same request/response shape.
```

### STEP 10 — Federated Learning verification (Claude, if Step 8's version needs hardening)
**PASTE THIS →**
```
Review this Flower federated learning code [paste your current advanced_ai.py federated section]. Make sure: 4 clients each get a distinct, non-overlapping slice of the synthetic training data (not the same data copied 4 times — that would defeat the point of demonstrating federated learning), FedAvg aggregation actually runs across 5 rounds, and accuracy genuinely improves round over round (print per-round accuracy so I can see it's not flat). Fix anything that's faked or simplified in a way that would make this not a real demonstration of federated learning. Then re-run it and show me the real per-round accuracy numbers.
```

### STEP 11 — Causal simulator verification (Claude, if Step 8's version needs hardening)
**PASTE THIS →**
```
Review this DoWhy causal simulation code [paste your current advanced_ai.py whatif section]. Confirm: the causal graph is explicitly defined (not just a correlation calculation mislabeled as causal), the effect estimate uses a real DoWhy identification + estimation method (backdoor.linear_regression or similar), and the synthetic dataset has a genuine confounding structure so the demo would show a real difference between the naive correlation and the causal estimate if I asked for both. Add a second field to the response, "naive_correlation_estimate", alongside "causal_estimate", so the demo can visibly show why doing this with real causal inference matters. Re-run and show me both numbers.
```

### STEP 12 — Remaining ML models (Claude, use `02-ML-TRAINING-PROMPTS.md`'s prompts 1-8, 12-15 one at a time)
Go through `02-ML-TRAINING-PROMPTS.md` top to bottom. Each numbered prompt in that file is a complete, standalone paste-ready message — send it to Claude, run the resulting script locally, confirm the saved model file exists in backend/ml_models/, then move to the next.

### STEP 13 — Wire trained models into existing endpoints (Antigravity)
**PASTE THIS →**
```
Here is the list of endpoints currently using rule-based/heuristic placeholders, and the trained model files that now exist to replace them:
[paste your actual list, matching the TODO comments you left in steps 2-8, against the model files produced in step 12]
For each one: import the model in the relevant services/ file, replace the placeholder logic with a real model.predict() call, keep the exact same request/response shape so the frontend doesn't break, and remove the TODO comment. After each swap, re-run the same curl command from the original step and confirm the response now comes from the real model (values should look different/more varied than the old rule-based ones).
```

### STEP 14 — Frontend (DeepSeek, one message per group — repeat for all 10 groups)
**PASTE THIS →** (fill in <GROUP> and its endpoint list from steps 2-8 above)
```
Generate React (Vite + Tailwind) pages for the "<GROUP>" feature group of the agri-platform project (MASTER-SPEC.md pasted above). Here are the exact endpoints to call:
[paste the exact endpoint list for that group from steps 2-8 above, method + path + body + response fields]

For each POST endpoint, build a form matching its body fields exactly, submit via axios to the real path, and render the real response (no mock data anywhere). For each GET endpoint, build a list/table/card view that fetches and renders the real data on mount. Any response with a numeric score, forecast range, or time series should use a Recharts chart, not just raw numbers. Put these under src/pages/<group>/. After the code, tell me the exact <Route> entries to add to App.jsx.
```

### STEP 15 — Wire frontend shell (Antigravity)
**PASTE THIS →**
```
Wire all the page routes generated so far into a single App.jsx with react-router, add a login/signup flow using the JWT auth endpoints, add a sidebar layout with a link to each of the 10 feature groups, and a landing dashboard page summarizing key numbers (active crop plans, recent alerts, pending orders, wallet balance) pulled from real endpoints. Run frontend and backend together and click through every single page yourself first — list me anything that errors before I look at it.
```

### STEP 16 — Final smoke test (Antigravity, final 2 hours)
**PASTE THIS →**
```
Open 04-FEATURE-CHECKLIST.md. Go through it feature by feature. For each one, hit its real endpoint (or click its real page) and tell me pass/fail with the actual response you got. For anything still using a placeholder/heuristic instead of a trained model, tell me explicitly so I know what's genuinely ML-driven versus rule-based in the final demo. Also run seed data so every page has realistic-looking content instead of empty states — create 5 demo farmers, 3 buyers, and enough historical transactions/reports that season reports and grower scores have real numbers to show.
```

## When you hit a token limit mid-step
1. Save whatever code exists to disk, even incomplete.
2. New account → paste `00-MASTER-SPEC.md`, then this filled-in template:
```
DONE SO FAR: <list completed steps by number>
CURRENT FILE TREE: <paste output of: find agri-platform -type f | grep -v node_modules | grep -v .git>
THIS FILE IS INCOMPLETE, finish it exactly matching existing style: <paste the cut-off file's current content>
NEXT TASK AFTER THIS: <the next step number and its PASTE THIS block from this document>
```
