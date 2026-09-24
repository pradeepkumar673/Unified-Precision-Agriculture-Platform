# KhetSaathi — Unified Precision Agriculture Platform

**Team:** 99xEngineers | **Hackathon:** Smart India Hackathon (SIH) 2024 PS-1

> Empowering India's 140 million farmers with AI-first, offline-capable precision agriculture — from seed to sale.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Overview](#2-architecture-overview)
3. [Technology Stack](#3-technology-stack)
4. [Prerequisites](#4-prerequisites)
5. [Installation and Setup](#5-installation-and-setup)
6. [Running the Application](#6-running-the-application)
7. [User Flow — End-to-End Journey](#7-user-flow--end-to-end-journey)
8. [Feature Deep-Dives — All 57 Modules](#8-feature-deep-dives--all-57-modules)
9. [AI/ML Models — Full Inventory](#9-aiml-models--full-inventory)
10. [Backend API Reference](#10-backend-api-reference)
11. [Environment Variables](#11-environment-variables)
12. [Database Schema Overview](#12-database-schema-overview)
13. [IoT Hardware Simulator](#13-iot-hardware-simulator)
14. [Project Directory Structure](#14-project-directory-structure)
15. [Team — 99xEngineers](#15-team--99xengineers)

---

## 1. Project Overview

**KhetSaathi** (Friend of the Farmer) is a full-stack, mobile-first Progressive Web App designed for Indian farmers across all literacy levels. It integrates 57 specialized modules under a single unified platform, powered by real machine learning models, live IoT sensor data, satellite imagery processing, and a conversational AI assistant.

### Problem Statement (SIH PS-1)

India's farming ecosystem is deeply fragmented. A farmer needs to consult 8–12 different apps, government portals, and middlemen for crop advisory, market prices, loan applications, and weather advisories. KhetSaathi unifies all of these into a single, offline-capable, voice-first platform.

### Key Differentiators

- **57 integrated modules** — the most comprehensive agritech platform in India
- **24+ trained ML models** — all custom-trained, not just API wrappers
- **Real IoT pipeline** — CEA sensor simulator → REST API → live dashboard
- **Voice-first UX** — Whisper-based speech recognition in Hindi/Marathi/Punjabi/English
- **Offline-first** — service worker caching ensures the app works in fields with no signal
- **Role-aware UI** — the interface dynamically changes for Farmer, FPO Leader, Buyer, Agronomist
- **Explainable AI** — SHAP explainers ensure every prediction is interpretable, not a black box

---

## 2. Architecture Overview

```
+------------------------------------------------------------------+
|                    USER (Mobile Browser / PWA)                   |
|                 React 18 + Vite + Tailwind CSS                   |
|                        Port: 5173 (dev)                          |
+---------------------------+--------------------------------------+
                            | HTTP/REST (Axios)
                            | VITE_API_URL = http://localhost:8000/api/v1
+---------------------------v--------------------------------------+
|                    FastAPI Backend Server                        |
|               Uvicorn ASGI + SQLAlchemy ORM                     |
|                        Port: 8000                                |
|                                                                  |
|  Routers: /auth  /farm  /health  /marketplace  /vision_forecast  |
|           /planning  /water_soil  /finance  /gov_compliance      |
|           /community  /cea_iot  /advanced_ai                     |
|                                                                  |
|   ML Model Layer (24+ pkl/pt models):                            |
|   scikit-learn | XGBoost | LightGBM | PyTorch | Prophet          |
|   Stable-Baselines3 (RL) | DoWhy | Flower (FL)                  |
|                                                                  |
|   SQLite / PostgreSQL (app.db) + Alembic Migrations              |
|   External APIs: OpenWeather | Razorpay | Groq LLM | Whisper     |
+---------------------------+--------------------------------------+
                            | REST POST /api/v1/cea_iot/ingest
+---------------------------v--------------------------------------+
|              CEA/IoT Hardware Simulator (Python)                |
|          hardware-sim/simulate_sensors.py                        |
|    Emits: soil_moisture, temperature, humidity, pH, EC, CO2, PPFD|
+------------------------------------------------------------------+
```

---

## 3. Technology Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 18.3.1 | UI component framework |
| Vite | 5.3.4 | Build tool and dev server |
| Tailwind CSS | 3.4.4 | Utility-first CSS with Material Design 3 token system |
| React Router DOM | 6.24.0 | Client-side routing (Hash router for PWA) |
| Axios | 1.7.0 | HTTP client for all API calls |
| Recharts | 2.12.7 | Interactive charts and graphs |
| React Leaflet | 4.2.1 | GPS field boundary and disease outbreak mapping |
| Turf.js | 7.4.0 | Geospatial area calculation (acres/hectares) |
| Zustand | 4.5.4 | Lightweight global state management |
| jsPDF + html2canvas | 4.2.1 | Client-side PDF report generation |
| i18next | 26.4.2 | Multi-language (EN, Hindi, Marathi, Punjabi) |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| FastAPI | Latest | ASGI web framework with Swagger auto-docs |
| Uvicorn | Latest | Production-grade ASGI server |
| SQLAlchemy | 2.0+ | ORM with async support |
| Alembic | Latest | Database migration management |
| Pydantic | 2.0+ | Data validation and serialization |
| python-jose | Latest | JWT-based authentication |
| passlib bcrypt | Latest | Secure password hashing |

### Machine Learning

| Library | Purpose |
|---|---|
| scikit-learn | Crop disease classifier, soil GPR, anomaly detection |
| XGBoost | Credit scoring, buyer-farmer matching |
| LightGBM | Mandi price, yield, satellite stress, climate risk, drone counter |
| PyTorch + Torchvision | MobileNetV3 CNN for grain quality and disease images |
| Ultralytics YOLOv8 | Plant object detection from drone imagery |
| Prophet | 30-day yield and water demand time-series forecasting |
| Stable-Baselines3 | PPO Reinforcement Learning for crop rotation optimization |
| DoWhy | Causal inference for the counterfactual What-If simulator |
| Flower (flwr) | Federated learning privacy demonstration |
| OpenCV | Image preprocessing and grain quality analysis |
| Whisper | Offline speech-to-text (ASR) runs locally on server |
| Groq API | Sub-second LLM inference for farm advisory and chatbot |
| Razorpay | UPI/Card/NetBanking payment gateway integration |
| ReportLab | Server-side PDF ledger generation |

---

## 4. Prerequisites

| Requirement | Minimum Version | Check Command |
|---|---|---|
| Python | 3.10+ | `python --version` |
| Node.js | 18.0+ | `node --version` |
| npm | 9.0+ | `npm --version` |
| Git | 2.0+ | `git --version` |
| PowerShell | 5.1+ | Built-in on Windows 10/11 |

### Optional (needed for full AI features)

- **Groq API Key** — console.groq.com/keys (free tier available)
- **OpenWeather API Key** — openweathermap.org/api (free: 1,000 calls/day)
- **Razorpay Test Keys** — dashboard.razorpay.com (free test mode)

---

## 5. Installation and Setup

### Step 1 — Clone the Repository

```bash
git clone https://github.com/99xengineers/unified-precision-agriculture.git
cd "Unified Precision Agriculture Platform"
```

### Step 2 — Backend Setup

```bash
cd backend

# Create Python virtual environment
python -m venv venv

# Activate — Windows
.\venv\Scripts\Activate.ps1

# Activate — macOS/Linux
source venv/bin/activate

# Install all backend dependencies
pip install -r requirements.txt
```

### Step 3 — Configure Backend Environment Variables

```bash
cp backend/.env.example backend/.env
# Edit .env and add your API keys
```

Your `backend/.env` file should contain:

```env
PROJECT_NAME="Unified Precision Agriculture Platform"
API_V1_STR="/api/v1"
SECRET_KEY="your-strong-random-secret-32-chars"
ACCESS_TOKEN_EXPIRE_MINUTES=1440
DATABASE_URL="sqlite:///./app.db"
BACKEND_CORS_ORIGINS=["*"]

# Payment Gateway (use test keys initially)
RAZORPAY_KEY_ID="rzp_test_XXXXXXXXXX"
RAZORPAY_KEY_SECRET="XXXXXXXXXX"

# LLM for voice assistant and chatbot
GROQ_API_KEY="gsk_XXXXXXXXXX"

# IoT sensor device authentication
CEA_DEVICE_API_KEY="any-random-secret-value"
```

### Step 4 — Seed the Database

```bash
# From backend/ directory with venv active
python seed.py
```

This creates:
- A demo farm with UUID (printed to console)
- Sample crop plans, sensor readings, transactions, alerts
- Demo login credentials: `demo@agri.test` / `demo1234`

### Step 5 — Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
```

Edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_OPENWEATHER_KEY=your_openweather_api_key_here
```

---

## 6. Running the Application

### Option A — One-Click Start (Windows — Recommended)

From the project root directory:

```powershell
powershell -ExecutionPolicy Bypass -File start.ps1
```

This single script automatically:
1. Creates Python venv if it does not exist
2. Installs all backend pip dependencies
3. Seeds the database with realistic demo data
4. Starts FastAPI backend on http://localhost:8000
5. Installs frontend npm packages if missing
6. Starts Vite dev server on http://localhost:5173
7. Starts the IoT hardware simulator
8. Opens your default browser automatically

Optional flags:
```powershell
# Skip DB seeding if data already populated
.\start.ps1 -SkipSeed

# Skip IoT simulator
.\start.ps1 -SkipSim

# Run on custom ports
.\start.ps1 -BackendPort 8080 -FrontendPort 3000
```

### Option B — Manual Start (All Platforms)

**Terminal 1 — Backend API:**
```bash
cd backend
source venv/bin/activate  # or .\venv\Scripts\Activate.ps1 on Windows
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 3 — IoT Simulator (optional):**
```bash
cd backend
python hardware-sim/simulate_sensors.py
```

### Access Points

| Service | URL |
|---|---|
| Frontend App | http://localhost:5173 |
| Backend Swagger Docs | http://localhost:8000/docs |
| Backend ReDoc | http://localhost:8000/redoc |
| Health Check | http://localhost:8000/health |

**Demo Credentials:** `demo@agri.test` / `demo1234`

---

## 7. User Flow — End-to-End Journey

### New Farmer Onboarding (First Launch)

```
1. SPLASH SCREEN (/splash)
   Animated KhetSaathi branding in 4 languages
   "Get Started" button navigates to Role Selection

2. ROLE SELECTION (/role-selection)
   Choose: Farmer | FPO Leader | Buyer | Agronomist
   Role saved to localStorage, customizes entire UI context

3. PHONE NUMBER LOGIN (/login)
   Enter 10-digit Indian mobile number
   OTP simulation: any 6 digits work in demo mode
   JWT token stored in localStorage on success

4. FARM SETUP WIZARD (/farm/setup/1)
   Step 1: Farm name, state, district, village name
   Step 2: Primary crops, soil type, irrigation source
   Step 3: Land holding size in acres or hectares
   Creates farm record, farmId saved to localStorage

5. HOME DASHBOARD (/)
   Live weather widget (OpenWeather API using GPS coordinates)
   Today's task list pulled from the active crop plan
   Alert feed for pest warnings and canal release schedules
   Quick access cards for top 5 most-used features

6. FEATURE HUB (/more)
   Grid showing all 57 modules in filterable categories
   Filter by: Planning, Health, Market, Finance, AI, etc.
   Tap any card to navigate instantly to that module
```

### Daily Farmer Workflow

```
Morning:
  Check Home Dashboard for today's tasks and live weather
  Irrigation Recommendation for ML-precise watering schedule
  Farm Alerts Feed for any pest outbreak in the village

In the Field:
  Leaf Disease Scanner: point camera at sick plant, get AI diagnosis instantly
  GPS Field Mapping: draw field boundary, calculate exact acreage
  Soil Health Heatmap: check NPK and moisture zone-by-zone

At Market Time:
  Mandi Price Forecast: 7-day ML price predictions before deciding when to sell
  Harvest and Sell Produce: list produce for live competitive bidding
  Wallet and Ledger: track all income and expenses in one passbook

Evening:
  FPO Community Forum: share field observations, ask questions
  Government Scheme Matching: AI finds subsidies you are eligible for
```

---

## 8. Feature Deep-Dives — All 57 Modules

---

### Module Group 1 — Farm Planning and Management

#### 1.1 Crop Plan Recommendation

**Frontend Route:** /planning/crop-plan  
**Backend Endpoint:** POST /api/v1/planning/recommend  
**ML Model:** crop_planner.pkl (Random Forest Classifier, 9.2 MB)

How it works:
1. User provides: district, soil type, water availability, land size, budget
2. Backend loads crop_planner.pkl — a multi-label Random Forest trained on historical APMC yield-vs-market data across 250+ Indian crop varieties
3. Returns a ranked list of recommended crops with predicted yield in tons/acre, estimated market value, and a complete sowing/harvest calendar
4. Frontend renders an interactive plan card with a week-by-week task checklist

Data Sources: APMC mandi historical records, IMD weather data, Krishi Vigyan Kendra regional advisories

---

#### 1.2 Season Timeline

**Frontend Route:** /planning/season-timeline  
**Backend Endpoint:** GET /api/v1/planning/season/{farm_id}

How it works:
- Fetches the active crop plan from the database
- Renders an interactive horizontal timeline with daily and weekly task cards
- Tasks automatically check themselves based on current date vs planned schedule
- Color coded: Green (completed), Blue (today), Grey (upcoming), Red (overdue)

---

#### 1.3 Season Performance Report

**Frontend Route:** /planning/season-performance  
**Backend Endpoint:** GET /api/v1/planning/performance/{farm_id}

How it works:
- Aggregates completed season data: actual yield vs ML-predicted yield, actual costs vs budget, water used vs plan
- Renders Recharts bar and line graphs for at-a-glance comparison
- One-click downloadable PDF generated entirely by jsPDF on the client side — no server load

---

#### 1.4 Crop Rotation Suggestion

**Frontend Route:** /planning/rotation  
**Backend Endpoint:** GET /api/v1/planning/rotation/{farm_id}  
**ML Model:** rl_rotation_ppo.zip (Stable-Baselines3 PPO Reinforcement Learning)

How it works:
- The most advanced planning feature. Uses a PPO (Proximal Policy Optimization) Reinforcement Learning agent trained in a custom Gymnasium environment
- The reward function simultaneously maximizes: soil nitrogen replenishment + market value + water efficiency
- State space encodes: current NPK levels, previous 2 crops grown, current month, rainfall forecast
- Returns a 3-season rotation plan with a plain-language explanation of why each crop was selected

---

#### 1.5 Variety Comparison

**Frontend Route:** /planning/variety-comparison  
**Backend Endpoint:** GET /api/v1/planning/varieties  
**ML Model:** variety_als_model.pkl (Alternating Least Squares Collaborative Filtering)

How it works:
- Implements Collaborative Filtering (similar to Netflix recommendations) trained on farmer-variety yield outcome data
- Side-by-side comparison table for up to 4 seed varieties simultaneously
- Covers: germination rate, days-to-harvest, drought tolerance, disease resistance, market premium price

---

#### 1.6 GPS Field Mapping

**Frontend Route:** /farm/boundary  
**Backend Endpoint:** POST /api/v1/farm/boundary

How it works:
- React Leaflet integrates OpenStreetMap satellite tile layers
- Farmer taps field corners on the map to draw a polygon (fully touch-optimized for mobile)
- Turf.js calculates precise area in acres or hectares entirely on the client side (no server round-trip)
- Boundary GeoJSON is saved to the backend and reused for zone-based prescription maps

---

#### 1.7 Farm Profile and Settings

**Frontend Route:** /farm/profile  
**Backend Endpoint:** GET/PUT /api/v1/farm/profile/{farm_id}

How it works:
- Editable profile: farm name, owner name, state, district, village, GPS coordinates, soil type, primary crops, land size, water source
- Changes sync immediately to the backend and persist across sessions
- Profile data is used as context for every ML recommendation in the platform

---

#### 1.8 Farm Setup Wizard

**Frontend Route:** /farm/setup/1, /farm/setup/2, /farm/setup/3

How it works:
- 3-step guided wizard for first-time onboarding
- Step 1 collects basic identity and location
- Step 2 captures crop and soil characteristics
- Step 3 captures land size and creates the farm record in the database
- After completion, the farmId UUID is written to localStorage and used in all subsequent API calls

---

### Module Group 2 — Health, Pest and Disease Detection

#### 2.1 Leaf Disease Scanner

**Frontend Route:** /health/disease-scanner  
**Backend Endpoint:** POST /api/v1/health/scan-disease  
**ML Models:**
- crop_disease_model.pt — PyTorch MobileNetV3 CNN (4.4 MB, 38 disease classes)
- crop_disease_model.pkl — scikit-learn fallback classifier (12.8 MB)

How it works:
1. Frontend accesses the device camera via navigator.mediaDevices.getUserMedia()
2. Farmer points camera at a sick leaf and taps Scan
3. Frame is captured as a canvas blob and sent as multipart/form-data to the backend
4. Backend runs inference through the PyTorch model: predicted disease name, confidence score, top-3 alternatives
5. Auto-navigates to the Diagnosis Result page on success

Diseases detected: Wheat Rust (Yellow/Brown/Stem), Rice Blast, Powdery Mildew, Early and Late Blight, Leaf Spot, Bacterial Blight, and 30+ more

---

#### 2.2 Crop Diagnosis Result

**Frontend Route:** /health/disease-result  
**Backend Endpoint:** GET /api/v1/health/diagnosis/{diagnosis_id}

How it works:
- Shows the full diagnostic report: disease name, confidence percentage, severity level, affected area estimate
- AI-generated treatment protocol (specific fungicide name, dosage per acre, application timing) via Groq LLM (llama3-70b-8192)
- Farmer can add the diagnosis to their health log or share via the FPO community forum

---

#### 2.3 Pest Risk Dashboard

**Frontend Route:** /health/pest-risk  
**Backend Endpoint:** GET /api/v1/health/pest-risk/{farm_id}  
**ML Model:** pest_village_graph.pkl (Graph-based SIR Epidemic Simulation)

How it works:
- Network simulation model where each farm is a node in a village graph
- Uses SIR epidemiology mechanics (Susceptible-Infected-Recovered) to simulate how pests spread
- Inputs: live temperature and humidity from OpenWeather API, wind direction, neighboring farm outbreak reports
- Outputs: Risk level (Low/Medium/High/Critical), days until predicted outbreak, recommended preventive action

---

#### 2.4 Livestock Health

**Frontend Route:** /health/livestock  
**Backend Endpoint:** GET/POST /api/v1/health/livestock/{farm_id}  
**ML Model:** livestock_health_xgb.pkl (XGBoost Classifier)

How it works:
- Farmer logs daily observations: milk yield in liters, feed consumption, behavior (Normal/Lethargic/Aggressive), temperature
- XGBoost model runs inference on each log entry and flags risk of mastitis, FMD, or nutritional deficiency
- Vaccination calendar with automated SMS-style reminder notifications
- Add Animal flow creates complete profiles with breed, age, weight, and full health history

---

### Module Group 3 — Water and Soil Management

#### 3.1 Irrigation Recommendation

**Frontend Route:** /water-soil/irrigation  
**Backend Endpoint:** GET /api/v1/water_soil/irrigation/{farm_id}  
**ML Model:** irrigation_correction.pkl (Gradient Boosting Corrector)

How it works:
1. Calculates ETo (Reference Evapotranspiration) using the FAO Penman-Monteith equation with live OpenWeather data
2. Multiplies by crop coefficient Kc for the current growth stage from the active crop plan
3. irrigation_correction.pkl then corrects the base estimate using soil type and drainage characteristics
4. Output: exact liters per hectare for the next 24 hours broken into optimal time slots

---

#### 3.2 Water Demand Forecast

**Frontend Route:** /water-soil/demand-forecast  
**Backend Endpoint:** GET /api/v1/water_soil/demand_forecast/{farm_id}

How it works:
- Uses Prophet (Facebook time-series forecasting library) to project water demand for the next 30 days
- Accounts for monsoon seasonality and crop growth stage transitions
- Recharts area chart with 10th/50th/90th percentile confidence bands so farmer sees best/expected/worst case

---

#### 3.3 Zone Management

**Frontend Route:** /water-soil/zone-management  
**Backend Endpoint:** GET/PUT /api/v1/water_soil/zones/{farm_id}

How it works:
- Farmer divides their GPS-mapped field into named micro-zones (e.g. "North Slope", "Low-lying Center")
- Each zone gets fully independent irrigation schedules and fertilizer application rates
- Enables Variable Rate Application (VRA) — eliminating input waste by applying exactly what each zone needs

---

#### 3.4 Soil Health Heatmap

**Frontend Route:** /water-soil/soil-health  
**Backend Endpoint:** GET /api/v1/water_soil/soil_health/{farm_id}  
**ML Model:** soil_gpr_kernels.pkl (Gaussian Process Regression, 8.1 MB)

How it works:
- Implements Gaussian Process Regression for spatial interpolation of soil properties
- From just 4–8 geo-tagged soil sample readings, the GPR kernel interpolates a continuous N/P/K/pH surface across the entire field
- Renders as a color-coded heatmap overlay on the Leaflet map
- GPR uniquely provides uncertainty estimates — shown as confidence contours on the map

---

### Module Group 4 — Vision, Drone and Forecasting

#### 4.1 Satellite Crop Stress

**Frontend Route:** /vision/satellite  
**Backend Endpoint:** POST /api/v1/vision_forecast/satellite-stress  
**ML Model:** satellite_stress_lgbm.pkl (LightGBM Classifier)

How it works:
- User uploads satellite image (JPEG/PNG) of the farm
- Backend extracts vegetation index features (simulated NDVI bands) using OpenCV
- LightGBM classifies regions as: Healthy, Mild Stress, Moderate Stress, Severe Stress
- Results displayed as a color-coded map overlay with percentage breakdown per zone

---

#### 4.2 Yield Forecast

**Frontend Route:** /vision/yield-forecast  
**Backend Endpoint:** GET /api/v1/vision_forecast/yield/{farm_id}  
**ML Models:** yield_q10.pkl, yield_q50.pkl, yield_q90.pkl (LightGBM Quantile Regression)

How it works:
- Three separate LightGBM models trained on different quantiles (10th, 50th, 90th percentile)
- This generates a prediction interval — not just a point estimate but a realistic range
- Farmer sees: "Pessimistic: 18 qtl/acre | Expected: 24 qtl/acre | Optimistic: 28 qtl/acre"
- Factors: NDVI estimate, rainfall last 30 days, temperature, crop variety, historical farm yield

---

#### 4.3 Mandi Price Forecast

**Frontend Route:** /vision/price-forecast  
**Backend Endpoint:** GET /api/v1/vision_forecast/mandi-price  
**ML Model:** mandi_price_models.pkl (Dict of per-crop LightGBM regression models)

How it works:
- Separate LightGBM model trained per major crop (Wheat, Rice, Soybean, Cotton, etc.)
- Input features: current APMC price, seasonal index, MSP, harvest calendar pressure, district
- Outputs 7-day and 30-day price forecast with directional trend arrow (up/down/stable)
- mandi_price_meta.json stores MAPE (Mean Absolute Percentage Error) per crop for transparent accuracy disclosure

---

#### 4.4 Drone Plant Counting and Climate Risk

**Frontend Route:** /vision/drone-climate  
**Backend Endpoints:** POST /api/v1/vision_forecast/drone-count and GET /api/v1/vision_forecast/climate-risk  
**ML Models:** yolov8n_plants.pt, drone_counter_lgbm.pkl, climate_risk_lgbm.pkl

How it works:
1. Drone Counting: User uploads drone image → YOLOv8 runs object detection → raw plant count returned → drone_counter_lgbm.pkl refines estimate based on canopy cover density
2. Climate Risk: climate_risk_lgbm.pkl uses 5-day extended forecast to classify: Frost Risk, Hailstorm Risk, Drought Risk, Flood Risk — each with a probability score

---

### Module Group 5 — Marketplace and Logistics

#### 5.1 Inputs Marketplace

**Frontend Route:** /marketplace/inputs  
**Backend Endpoint:** GET /api/v1/marketplace/inputs  
**ML Model:** product_ranker_lgbm.pkl (LightGBM Learning-to-Rank)

How it works:
- Fetches full product catalog (seeds, fertilizers, pesticides, tools, equipment) from database
- product_ranker_lgbm.pkl re-ranks results based on farmer's crop plan, soil type, and purchase history
- Personalized "Best for You" section at top, followed by price-sorted full list
- Flow: Browse → ProductDetail → Add to Cart → PaymentCheckout

---

#### 5.2 Machinery and Labor Rental

**Frontend Route:** /marketplace/rentals  
**Backend Endpoint:** GET /api/v1/marketplace/machinery

How it works:
- Lists available tractors, harvesters, and labor gangs with per-hour or per-acre pricing
- Calendar-based availability picker for selecting date and time slot
- Backend checks for booking conflicts before confirming reservation
- Uber-style flow: Book → Confirm → Track arrival via GPS sharing link

---

#### 5.3 Buyer Exchange

**Frontend Route:** /marketplace/exchange  
**Backend Endpoint:** GET /api/v1/marketplace/buyers  
**ML Model:** buyer_match_xgb.pkl (XGBoost Classifier)

How it works:
- Direct B2B connection platform between farmers and food processing companies
- buyer_match_xgb.pkl predicts deal success probability based on: crop quality, quantity, location, certification type, price tolerance
- Top 5 matched buyers shown ranked by match score percentage

---

#### 5.4 Harvest and Sell Produce

**Frontend Route:** /marketplace/harvest  
**Backend Endpoints:** POST /api/v1/marketplace/listings and GET /api/v1/marketplace/bids

How it works:
- Farmer creates a produce listing: crop type, quantity in quintals, grade, expected price, pickup date
- Buyers compete by placing bids against the listing
- Live bid feed sorted by price shows real-time competitive offers
- Farmer accepts highest bid → Razorpay payment order created automatically

---

#### 5.5 Delivery and Logistics Tracking

**Frontend Route:** /marketplace/delivery  
**Backend Endpoint:** GET /api/v1/marketplace/deliveries/{farm_id}

How it works:
- After sale confirmation, a delivery order is created with estimated pickup and drop times
- Live GPS position of transport vehicle displayed on Leaflet map (polling backend every 30 seconds)
- Status pipeline: Confirmed → Vehicle Assigned → Loading → In Transit → Delivered
- Driver OTP verification on delivery prevents fraudulent claims

---

### Module Group 6 — Finance and Insurance

#### 6.1 Wallet and Transaction Ledger

**Frontend Route:** /finance/wallet  
**Backend Endpoints:** GET /api/v1/finance/ledger/{farm_id}, POST /api/v1/finance/topup, GET /api/v1/finance/export-pdf

How it works:
- Complete digital passbook for all farm financial activity
- Transactions auto-tagged by category: Crop Sale Income, Input Purchase, Loan Repayment, Insurance Premium
- Add Money flow: farmer enters amount → Razorpay payment gateway opens → on success, backend credits wallet
- Bank Transfer flow: farmer withdraws available balance to linked bank account
- Export PDF: ReportLab on the backend generates a complete ledger statement and serves it as a downloadable file

---

#### 6.2 Payment Checkout

**Frontend Route:** /finance/checkout  
**Backend Endpoints:** POST /api/v1/finance/payment/create-order and POST /api/v1/finance/payment/verify

How it works:
1. Frontend sends order details to backend → backend calls Razorpay API to get a signed order ID
2. Razorpay checkout modal opens natively in the browser (UPI / Card / NetBanking options)
3. On successful payment, Razorpay returns a signature → backend verifies it using HMAC-SHA256
4. Verified payment triggers the downstream action (input delivery, booking confirmation, wallet credit)

---

#### 6.3 Credit and Insurance Hub

**Frontend Route:** /finance/credit-insurance  
**Backend Endpoint:** POST /api/v1/finance/credit-score  
**ML Models:** credit_xgb.pkl (XGBoost) and credit_shap_explainer.pkl (SHAP TreeExplainer)

How it works:
- Credit Scoring: XGBoost calculates a creditworthiness score (0–100) based on: land size, crop history, income stability, repayment history, yield forecast
- SHAP Explainer: Generates human-readable explanations ("Your score is high because your yield is consistent and land is owned")
- KCC Loan Application: Pre-fills Kisan Credit Card form with farmer profile and credit score data
- PMFBY Insurance: Calculates Pradhan Mantri Fasal Bima Yojana premium and displays eligibility automatically

---

### Module Group 7 — Government and Compliance

#### 7.1 Government Scheme Matching

**Frontend Route:** /gov/schemes  
**Backend Endpoint:** GET /api/v1/gov_compliance/schemes/{farm_id}

How it works:
- Rule engine covering 50+ central and state government agricultural schemes
- Rules evaluated against farmer profile: state, caste category, land size, crop type, income band
- Returns ONLY the schemes the farmer is actually eligible for, with direct application links
- Groq LLM generates plain-language scheme summaries in the farmer's preferred language

---

#### 7.2 Farmer Document Vault

**Frontend Route:** /gov/documents  
**Backend Endpoint:** POST /api/v1/gov_compliance/upload-document

How it works:
- Secure digital locker for: Land Record (7/12 Utara), Aadhaar, PAN, Bank Passbook, Seed Certificates
- Documents stored in backend/media/ folder with UUID-based filenames for privacy
- Pytesseract OCR auto-extracts key fields (survey number, owner name, area in acres) from uploaded documents for government form auto-fill

---

#### 7.3 Produce Traceability

**Frontend Route:** /gov/traceability  
**Backend Endpoint:** POST /api/v1/gov_compliance/traceability

How it works:
- Generates a tamper-evident QR code linking to a full supply-chain audit trail: farm GPS coordinates, soil test reports, pesticide application log, harvest date, transport vehicle details
- QR code can be scanned by export buyers to verify organic or pesticide-free claims
- Enables compliance with APEDA export regulations and Global G.A.P. standards

---

### Module Group 8 — Community, FPO and Social

#### 8.1 Farm Alerts Feed

**Frontend Route:** /community/alerts  
**Backend Endpoint:** GET /api/v1/community/alerts/{farm_id}

How it works:
- Hyperlocal push notification feed for the farmer's district
- Alert types: Pest Outbreak (from disease map), Canal Release Schedule, Mandi Price Spike, Extreme Weather Warning, Government Advisory
- Alerts prioritized by ML severity scoring and displayed in chronological feed

---

#### 8.2 Grower Score

**Frontend Route:** /community/grower-score  
**Backend Endpoint:** GET /api/v1/community/grower-score/{farm_id}

How it works:
- Gamified sustainability metric (0–100 points)
- Score calculated from: water use efficiency, soil health trend, crop diversity, practice adoption, community contributions (posts, disease reports)
- Village cluster leaderboard shows farmer's rank among neighbors
- Higher scores unlock preferential loan rates and priority buyer matching

---

#### 8.3 FPO Community Forum

**Frontend Route:** /community/fpo  
**Backend Endpoint:** GET/POST /api/v1/community/posts

How it works:
- WhatsApp-style forum for each Farmer Producer Organisation
- Posts support text, images, and audio voice notes
- Groq LLM moderates posts and auto-generates agronomy responses to farming questions
- Forum segmented by crop type: Wheat Forum, Cotton Forum, Rice Forum, etc.

---

#### 8.4 Digital Sakhi Support

**Frontend Route:** /community/digital-sakhi

How it works:
- "Sunita Devi" is a digital extension worker mascot representing the AI knowledge base
- Tapping "Call Expert" opens a simulated video call interface
- In production deployment: connects to a real live agronomist via WebRTC video call

---

#### 8.5 SHG Shared Bookings

**Frontend Route:** /community/shg-bookings  
**Backend Endpoint:** GET/POST /api/v1/community/shg-bookings

How it works:
- Self-Help Group feature for pooled collective purchasing
- One farmer creates a Group Order for an expensive input (e.g. tractor rental for 10 acres)
- Other SHG members join the order and commit their individual share
- When minimum collective quantity is reached, the platform applies the wholesale discount automatically
- Backend splits the final invoice proportionally among all participating members

---

#### 8.6 Community Disease Outbreak Map

**Frontend Route:** /community/disease-map  
**Backend Endpoint:** GET/POST /api/v1/community/disease-reports

How it works:
- Waze-style crowdsourced map of active pest and disease outbreaks in the region
- Any farmer pins a GPS location on the map and reports: "Yellow Rust on Wheat, Plot 4"
- pest_village_graph.pkl uses these crowdsourced reports to update the epidemic simulation in real-time
- Reports cluster into visible hot-zones on the Leaflet map

---

#### 8.7 FPO Cooperative Suite

**Frontend Route:** /community/fpo-cooperative-suite  
**Backend Endpoint:** GET /api/v1/community/fpo/{fpo_id}

How it works:
- Admin dashboard exclusively for FPO leaders (role-gated)
- Shows: total member count, aggregate produce volumes, collective credit score, shared machinery schedule
- FPO leaders can broadcast priority alerts to all members and manage shared financial accounts

---

#### 8.8 Season Report Sharing

**Frontend Route:** /community/season-report

How it works:
- Farmer generates a shareable season summary card (crop grown, yield achieved, income earned, grower score)
- Card is rendered as a canvas element and downloadable as a PNG for sharing on WhatsApp/social media
- Community can react to shared reports to build social accountability

---

### Module Group 9 — Advanced AI and IoT

#### 9.1 Voice Assistant — KhetSaathi Bol

**Frontend Route:** /ai/assistant  
**Backend Endpoint:** POST /api/v1/advanced_ai/voice-query  
**AI Stack:** openai-whisper (local ASR) + Groq llama3-70b-8192 (LLM)

How it works:
1. Farmer holds the mic button → browser records audio via MediaRecorder API
2. Audio blob (WAV or WebM format) is sent to backend via multipart POST
3. Whisper (runs locally on the server) transcribes audio to text, auto-detecting language (EN/HI/MR/PA)
4. Transcribed text + farm context (active crop, location, current alerts) is sent to Groq API
5. Groq returns a response in sub-1-second latency
6. Response is read aloud via browser SpeechSynthesis API in the farmer's language

---

#### 9.2 Multimodal Query

**Frontend Route:** /ai/multimodal-query  
**Backend Endpoint:** POST /api/v1/advanced_ai/multimodal

How it works:
- Farmer can simultaneously upload a photo + type text + record audio — all three modalities at once
- Backend processes each modality (OCR, image description, speech-to-text) and builds a unified prompt
- Combined prompt sent to Groq LLM for a single comprehensive answer
- Example: Upload sick leaf photo + say "What is this and what should I spray?" → unified diagnosis and treatment

---

#### 9.3 Counterfactual What-If Simulator

**Frontend Route:** /ai/causal-lab  
**Backend Endpoint:** POST /api/v1/advanced_ai/whatif  
**ML Model:** causal_regression.pkl + causal_model_meta.json (DoWhy Causal Inference)

How it works:
- Powered by DoWhy (Microsoft's causal inference library)
- Builds a Directed Acyclic Graph (DAG): sowing_date → yield, fertilizer_dose → yield, rainfall → yield
- Farmer inputs a hypothetical: "What if I plant 15 days later than my plan?"
- The causal model computes the counterfactual outcome: "Expected yield would decrease by 18% due to heat stress during grain-filling stage"

---

#### 9.4 Federated Learning Status

**Frontend Route:** /ai/federated-learning  
**Backend Endpoint:** GET /api/v1/advanced_ai/fl-status  
**ML Model:** fl_global_model.pkl, fl_demo_meta.json (Flower Framework FedAvg)

How it works:
- Demonstrates privacy-preserving machine learning concept using the Flower (flwr) framework
- Simulates 5 virtual farms each training a local model on their private, local data
- Only model WEIGHTS (never raw farm data) are aggregated on the central server using FedAvg algorithm
- UI shows a visual animation of the aggregation rounds to make the concept understandable to farmers

---

#### 9.5 Live Sensor Dashboard

**Frontend Route:** /iot/dashboard  
**Backend Endpoint:** GET /api/v1/cea_iot/latest/{farm_id}  
**ML Model:** anomaly_iforest.pkl (Isolation Forest)

How it works:
- Real-time dial gauges for: Soil Moisture %, Air Temperature °C, Humidity %, pH, EC mS/cm, CO₂ ppm, PPFD light intensity
- Auto-refreshes every 10 seconds via polling
- Isolation Forest model runs on each new reading and flags anomalous sensor values with a red alert badge in real-time

---

#### 9.6 Hydroponics Climate Control — CEA

**Frontend Route:** /iot/hydro-climate  
**Backend Endpoint:** POST /api/v1/cea_iot/setpoints

How it works:
- Control panel for Controlled Environment Agriculture: polyhouses, greenhouses, net-houses
- Displays live indoor IoT readings alongside outdoor OpenWeather conditions side-by-side
- Farmer sets target setpoints: Temperature 22–26°C, Humidity 60–70%, EC 2.0 mS/cm
- "PLC Sync" button sends commands to backend which relays to physical PLCs in real deployment
- 24-hour history line graph for each parameter

---

#### 9.7 Vertical Farm Shelf Monitor

**Frontend Route:** /iot/shelves  
**Backend Endpoints:** GET /api/v1/cea_iot/vertical-optimization/{farm_id} and POST /api/v1/cea_iot/setpoints

How it works:
- Monitors individual growing racks in a vertical indoor LED farm
- Each shelf card displays: plant growth stage, PPFD light intensity, temperature, days to harvest estimate
- LED Power Slider: drag to adjust light intensity for each specific shelf (sends real-time setpoint update)
- "Sync All to PLC" button bulk-updates all shelf setpoints in a single API call

---

#### 9.8 IoT Traceability

**Frontend Route:** /iot/traceability  
**Backend Endpoint:** GET /api/v1/cea_iot/traceability/{farm_id}

How it works:
- Generates an immutable audit trail from the complete IoT sensor log history
- Every sensor reading is timestamped and stored with a cryptographic hash (simulating blockchain integrity)
- QR code generated links to the full sensor log for a specific crop batch and grow cycle
- Proves to premium organic buyers that temperature, humidity, and chemical levels were within certified limits throughout cultivation

---

### Module Group 10 — Core App Infrastructure

#### 10.1 Global Search
- Real-time search input filtering all 57 feature cards by title and description simultaneously
- Activated from the Feature Hub (/more) page search icon
- Zero latency — purely client-side filter on the in-memory module list

#### 10.2 Language Localization (i18n)
- Full i18next + react-i18next integration
- Supports: English, Hindi (हिंदी), Marathi (मराठी), Punjabi (ਪੰਜਾਬੀ)
- Language preference persisted in localStorage across sessions

#### 10.3 Offline Sync Engine
- navigator.onLine API monitors real-time connectivity
- Service worker caches critical routes and API responses
- Forms submitted while offline are queued locally and auto-synced when connection is restored

#### 10.4 Push Notification Manager
- Triggers browser native Notification.requestPermission() API
- Delivers alerts for: pest outbreak near farm, irrigation time reminder, mandi price spike in home district

#### 10.5 Dynamic Theming System
- Toggles Tailwind dark class on the root <html> element for full dark mode
- Full Material Design 3 color token system implemented in Tailwind config
- Light mode optimized for outdoor visibility in sunlight; Dark mode for battery saving

#### 10.6 Role-Based Access Control (RBAC)
- User role stored in localStorage after Role Selection onboarding screen
- Every module checks user role and conditionally renders or hides admin controls
- Farmer: standard full feature access
- FPO Leader: additional aggregate dashboards and member management panels
- Buyer: marketplace and produce listing features only
- Agronomist: detailed technical data layers unlocked across all pages

---

## 9. AI/ML Models — Full Inventory

| Model File | Algorithm | Purpose |
|---|---|---|
| crop_planner.pkl | Random Forest | Ranked crop recommendation from 250+ varieties |
| crop_disease_model.pt | PyTorch MobileNetV3 | Leaf disease image classification (38 classes) |
| crop_disease_model.pkl | scikit-learn SVC | Leaf disease fallback classifier |
| mandi_price_models.pkl | LightGBM per-crop models | 7-day and 30-day mandi price forecasting |
| yield_q10.pkl | LightGBM Quantile | Pessimistic yield bound |
| yield_q50.pkl | LightGBM Quantile | Expected (median) yield estimate |
| yield_q90.pkl | LightGBM Quantile | Optimistic yield bound |
| satellite_stress_lgbm.pkl | LightGBM Classifier | Satellite crop stress zone classification |
| climate_risk_lgbm.pkl | LightGBM Classifier | Frost, hail, drought, flood risk prediction |
| drone_counter_lgbm.pkl | LightGBM Regressor | Plant population density counting |
| yolov8n_plants.pt | YOLOv8 Object Detection | Plant detection in drone/aerial images |
| soil_gpr_kernels.pkl | Gaussian Process Regression | Spatial N/P/K/pH surface interpolation |
| irrigation_correction.pkl | Gradient Boosting | Penman-Monteith ETo correction |
| credit_xgb.pkl | XGBoost Classifier | Farmer creditworthiness score (0–100) |
| credit_shap_explainer.pkl | SHAP TreeExplainer | Human-readable credit score explanation |
| livestock_health_xgb.pkl | XGBoost Classifier | Animal disease risk prediction |
| rl_rotation_ppo.zip | PPO (Stable-Baselines3) | Optimal 3-season crop rotation via RL |
| anomaly_iforest.pkl | Isolation Forest | IoT sensor anomaly detection |
| causal_regression.pkl | DoWhy OLS + DAG | Counterfactual yield impact estimation |
| fl_global_model.pkl | FedAvg (Flower) | Federated privacy-preserving ML model |
| grain_quality_model.pkl | Gradient Boosting | Grain grade A/B/C classification |
| weed_classifier.pkl | MobileNetV3 | Weed species identification |
| buyer_match_xgb.pkl | XGBoost Classifier | Farmer-buyer deal success probability |
| product_ranker_lgbm.pkl | LightGBM Learning-to-Rank | Personalized input marketplace ranking |
| variety_als_model.pkl | ALS Collaborative Filtering | Seed variety recommendation |
| pest_village_graph.pkl | SIR Epidemic Simulation | Village-level pest spread and risk forecasting |

---

## 10. Backend API Reference

All endpoints prefixed with `/api/v1`. Full interactive docs: http://localhost:8000/docs

| Router Module | Base Path | Key Endpoints |
|---|---|---|
| Auth | /auth | POST /login, POST /register, GET /me |
| Farm | /farm | GET/POST /profile, GET/POST /boundary, POST /setup |
| Planning | /planning | POST /recommend, GET /season/{id}, GET /rotation/{id}, GET /varieties |
| Health | /health | POST /scan-disease, GET /pest-risk/{id}, GET/POST /livestock/{id} |
| Water Soil | /water_soil | GET /irrigation/{id}, GET /soil-health/{id}, GET /demand-forecast/{id} |
| Vision Forecast | /vision_forecast | POST /satellite-stress, GET /yield/{id}, GET /mandi-price, POST /drone-count |
| Marketplace | /marketplace | GET /inputs, GET /machinery, GET/POST /listings, GET /buyers, GET /bids |
| Finance | /finance | GET /ledger/{id}, POST /topup, POST /payment/create-order, POST /credit-score, GET /export-pdf |
| Gov Compliance | /gov_compliance | GET /schemes/{id}, POST /upload-document, POST /traceability |
| Community | /community | GET/POST /posts, GET /alerts/{id}, GET/POST /disease-reports, GET /fpo/{id} |
| CEA IoT | /cea_iot | POST /ingest, GET /latest/{id}, GET /vertical-optimization/{id}, POST /setpoints |
| Advanced AI | /advanced_ai | POST /voice-query, POST /multimodal, POST /whatif, GET /fl-status |

---

## 11. Environment Variables

### Backend — backend/.env

| Variable | Required | Description |
|---|---|---|
| SECRET_KEY | Yes | JWT signing secret — use a 32+ character random string |
| DATABASE_URL | Yes | SQLite path or PostgreSQL connection URL |
| GROQ_API_KEY | AI features | Voice assistant and chatbot advisory features |
| RAZORPAY_KEY_ID | Payments | Razorpay account key ID |
| RAZORPAY_KEY_SECRET | Payments | Payment signature verification secret |
| CEA_DEVICE_API_KEY | IoT ingestion | Hardware sensor POST authentication |
| ACCESS_TOKEN_EXPIRE_MINUTES | Optional | JWT expiry duration, default 1440 (24 hours) |
| BACKEND_CORS_ORIGINS | Optional | Allowed frontend origins, default wildcard |

### Frontend — frontend/.env

| Variable | Required | Description |
|---|---|---|
| VITE_API_URL | Yes | Backend base URL including /api/v1 |
| VITE_OPENWEATHER_KEY | Yes | OpenWeather API key for all weather features |

---

## 12. Database Schema Overview

SQLAlchemy ORM models managed by Alembic migrations. The active database is `backend/app.db`.

```
farms                  Farm registry (UUID primary key, owner, GPS, size, soil type)
users                  Authentication (phone, email, hashed password, JWT)
crop_plans             Active and historical crop schedules per farm
sensor_readings        IoT time-series telemetry (timestamped, farm-linked)
transactions           Financial ledger entries (income and expense)
marketplace_items      Product catalog and machinery rental listings
bids                   Live competitive auction bids on produce listings
deliveries             Logistics orders with GPS tracking waypoints
livestock              Animal profiles with breed, age, and health log
disease_reports        Crowdsourced pest outbreak GPS pin reports
documents              Farmer document vault metadata (filename, type, upload date)
fpo_members            Farmer-FPO membership mapping table
community_posts        Forum posts with reaction counts and reply threading
grain_quality_reports  Image scan results from grain quality analysis
```

Run all pending migrations:
```bash
cd backend
alembic upgrade head
```

Create a new migration after model changes:
```bash
alembic revision --autogenerate -m "Describe your change here"
```

---

## 13. IoT Hardware Simulator

File: `backend/hardware-sim/simulate_sensors.py`

Simulates a real IoT sensor node, posting readings every 30 seconds to the backend REST API.

Sample payload sent to POST /api/v1/cea_iot/ingest:
```json
{
  "farm_id": "<uuid-printed-by-seed.py>",
  "soil_moisture": 65.3,
  "temperature": 24.1,
  "humidity": 68.5,
  "ph": 6.8,
  "ec": 1.9,
  "co2_ppm": 412,
  "ppfd": 850
}
```

Simulator features:
- Gaussian noise on all values to simulate sensor variance
- Gradual drift to simulate sensor aging and calibration drift
- Random anomaly injection: occasional pH spikes and EC drops to test Isolation Forest detection
- Farm UUID read from CEA_FARM_ID environment variable (set automatically by start.ps1)

---

## 14. Project Directory Structure

```
Unified Precision Agriculture Platform/
|
+-- README.md                    This file — full project documentation
+-- SCREEN_MAP.md                Route-to-file mapping for all 57 screens
+-- ESCALATION_LIST.md           Known issues and future feature roadmap
+-- start.ps1                    One-click Windows startup automation script
|
+-- frontend/                    React + Vite + Tailwind PWA frontend
|   +-- src/
|   |   +-- pages/
|   |   |   +-- farm/            Auth, splash, dashboard, GPS field mapping
|   |   |   +-- planning/        Crop plan, timeline, rotation, variety compare
|   |   |   +-- health/          Disease scanner, livestock, pest risk
|   |   |   +-- water_soil/      Irrigation, soil heatmap, zone management
|   |   |   +-- vision_forecast/ Satellite stress, yield, mandi price, drone
|   |   |   +-- marketplace/     Inputs, machinery, harvest sell, delivery
|   |   |   +-- finance/         Wallet ledger, checkout, credit, insurance
|   |   |   +-- gov_compliance/  Scheme matching, document vault, traceability
|   |   |   +-- community/       Alerts, FPO forum, disease map, SHG, grower score
|   |   |   +-- advanced_ai/     Voice, multimodal, what-if, federated learning
|   |   |   +-- cea_iot/         Live sensors, hydroponics, vertical farm, IoT trace
|   |   +-- api/                 Axios client modules — one file per domain
|   |   +-- components/          Shared reusable UI components
|   |   +-- main.jsx             App entry point and React Router configuration
|   +-- tailwind.config.js       Custom Material Design 3 color token system
|   +-- vite.config.js           Build and dev server configuration
|   +-- package.json             Frontend dependencies
|
+-- backend/                     FastAPI + SQLAlchemy backend
|   +-- app/
|   |   +-- api/v1/              13 API router modules
|   |   +-- services/            Business logic and ML model inference layer
|   |   +-- models/              SQLAlchemy ORM database models
|   |   +-- schemas/             Pydantic request and response schemas
|   |   +-- core/                Config, database session, security utilities
|   +-- ml_models/               47 trained model files (pkl, pt, zip formats)
|   +-- hardware-sim/            IoT sensor data simulator
|   +-- alembic/                 Database schema migration scripts
|   +-- seed.py                  Database seeder with complete demo data
|   +-- train_*.py               ML model training scripts — 20+ training files
|   +-- requirements.txt         Python dependency list
|   +-- .env.example             Environment variable template
|
+-- docs/                        Additional technical documentation
```

---

## 15. Team — 99xEngineers

**Team Name:** 99xEngineers  
**Hackathon:** Smart India Hackathon (SIH) 2024  
**Problem Statement:** PS-1  
**Domain:** Agriculture and Rural Development

### Mission Statement

To give every Indian farmer — regardless of education level, internet connectivity, or financial means — the same quality of agronomic intelligence that was previously available only to large agribusinesses.
Delivered in their own language. Working in their field without internet. Always putting the farmer's dignity and agency first.

### Our Technology Philosophy

**AI-First, Not AI-Only**  
Every ML model has a rule-based fallback. If a model fails to load, the app degrades gracefully to deterministic calculations. No farmer is ever left with a broken screen.

**Offline-First by Architecture**  
Service workers cache all critical routes. Forms submitted offline are stored in IndexedDB and auto-synced when connectivity returns. A field with no signal is not an error — it is the default operating environment.

**Explainable AI Always**  
SHAP explainers and DoWhy causal models ensure every prediction comes with a reason a farmer can understand. We reject black-box AI for high-stakes agricultural decisions.

**Federated by Design**  
Farmer raw data never leaves their device. Only trained model weight deltas travel over the network. Privacy is a technical guarantee, not a policy promise.

**Multilingual by Default**  
Every UI string is an i18n translation key. Adding support for a new Indian language requires only a JSON translation file — no code changes. The system is ready to scale to all 22 scheduled languages.

---

*Made with love for India's farmers by Team 99xEngineers — SIH 2024*
