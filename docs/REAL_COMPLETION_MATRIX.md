# Real Completion Matrix

Audited: 2026-09-16. A checked item in `04-FEATURE-CHECKLIST.md` is not proof
of completion. `PASS` below means executable evidence exists in this checkout;
`BLOCKED` means an external dependency is required; `REWORK` means the current
implementation has a placeholder, synthetic business output, or an untested
model path.

| # | Feature | Route group | UI | Status | Evidence / remaining risk |
|---:|---|---|---|---|---|
| 1 | Digital Farm Profile | farm | FarmProfilePage | REWORK | CRUD works, but profile routes create a demo user and do not enforce ownership. |
| 2 | AI Crop Planning | planning | CropPlanningPage | REWORK | XGBoost artifact exists; training data is synthetic and fallback rules remain. |
| 3 | Smart Irrigation | water_soil | IrrigationPage | REWORK | ET0 is real; Open-Meteo and correction model fall back silently. |
| 4 | Crop Health AI | health | DiseaseDiagnosisPage | REWORK | PlantVillage artifact exists; OpenCV fallback remains and crop/treatment mapping needs validation. |
| 5 | Smart Farm Alerts | community | Dashboard | REWORK | Generates synthetic alerts when records are absent. |
| 6 | Inputs Marketplace | marketplace | InputsMarketplacePage | PASS* | Product/order flow exercised in `test_step6.py`; production inventory data is not sourced. |
| 7 | Machinery Rental | marketplace | MachineryLaborPage | PASS* | Booking conflict flow exercised; routing needs multi-stop solver evidence. |
| 8 | Government Support | gov | SchemeDiscoveryPage | REWORK | Criteria are local values, without official source metadata. |
| 9 | Harvest and Market | marketplace | BuyerExchangePage | REWORK | Matching has SQL fallback and synthetic ML provenance. |
| 10 | Season Report | community | SeasonReportPage | REWORK | Works for seeded records but suggestions/peer data are not validated for real histories. |
| 11 | Satellite Stress | vision_forecast | SatelliteVisionPage | BLOCKED | No Sentinel/remote-sensing acquisition pipeline; weather-derived indices are not satellite observations. |
| 12 | Drone Plant Counting | vision_forecast | SatelliteVisionPage | BLOCKED | `yolov8n_plants.pt` loads as generic COCO YOLOv8n (80 classes, not plant-trained); current path still returns fixed fallback values on inference failure. |
| 13 | Weed Classification | health | DiseaseDiagnosisPage | REWORK | Dataset/model artifact exist; silent OpenCV fallback remains. |
| 14 | Grain Quality | vision_forecast | SatelliteVisionPage | REWORK | Grade artifact exists but percentages are grade constants, not predictions. |
| 15 | Mandi Price | vision_forecast | PriceForecastPage | REWORK | Prophet artifacts were trained from synthetic price series. |
| 16 | Yield Forecast | vision_forecast | YieldClimatePage | REWORK | Quantile artifacts exist but are synthetic-data models. |
| 17 | Water Demand | water_soil | IrrigationPage | REWORK | Same missing live-data/error contract as #3. |
| 18 | Soil Health | water_soil | SoilHealthPage | PASS* | GPR uses submitted readings and returns a 20x20 grid; held-out validation is missing. |
| 19 | Variety Recommendation | planning | CropPlanningPage | REWORK | ALS/content artifacts use synthetic interactions; rule fallback remains. |
| 20 | Pest Spread | health | PestRiskPage | REWORK | SIR simulation exists, but seed reports/village data are synthetic when empty. |
| 21 | Voice Assistant | advanced_ai | VoiceAssistantPage | REWORK | CPU Whisper load now succeeds; only a silent-tone test exists and the response engine is keyword text. |
| 22 | Multimodal Query | advanced_ai | VoiceAssistantPage | REWORK | Combines image result with keyword matching, not documented multimodal reasoning. |
| 23 | RL Rotation | planning | RotationPage | REWORK | PPO artifact exists but synthetic environment and heuristic fallback remain. |
| 24 | Logistics Routing | marketplace | MachineryLaborPage | REWORK | Single-booking ETA is tested; real multi-stop/time-window optimization is unverified. |
| 25 | Federated Learning | advanced_ai | FederatedLearningPage | REWORK | Five rounds execute, but local client datasets are synthetic and direct FedAvg replaces Flower simulation. |
| 26 | Buyer Matching | marketplace | BuyerExchangePage | REWORK | Artifact exists but SQL quantity aggregation remains a primary fallback. |
| 27 | What-If Simulator | advanced_ai | CausalSimulatorPage | REWORK | Synthetic causal data; DoWhy reports a singular-matrix warning. |
| 28 | Fraud Detection | finance | LedgerPage | REWORK | Isolation Forest artifact is synthetic-data trained; endpoint test not independently executed. |
| 29 | Climate Risk | vision_forecast | YieldClimatePage | REWORK | Model inputs use lookup/default climate values rather than documented field data. |
| 30 | IoT Sensor Network | cea_iot | FacilityDashboardPage | BLOCKED | In-memory demo store; no persisted/device-authenticated readings. |
| 31 | Precision Hydroponics | cea_iot | FacilityDashboardPage | BLOCKED | No persisted controls, actuator protocol, or audit log. |
| 32 | Facility Dashboard | cea_iot | FacilityDashboardPage | REWORK | Frontend now builds; backend supplies in-memory demo readings only. |
| 33 | Traceability | cea_iot | TraceabilityPage | BLOCKED | Endpoint returns hardcoded lettuce/batch history, not database provenance. |
| 34 | Digital Sakhi | community | FPOCommunityPage | REWORK | Ticket creation tested; assignment/reply/audit workflow is absent. |
| 35 | SHG Bookings | community | FPOCommunityPage | REWORK | Happy path tested; membership validation and duplicate settlement tests are missing. |
| 36 | Grower Score | community | GrowerScorePage | REWORK | Score persists, but percentile/weights need valid peer-group evidence. |
| 37 | Hydroponics Control | cea_iot | FacilityDashboardPage | BLOCKED | Requires persisted sensor/actuator integration. |
| 38 | Aquaponics Balancer | cea_iot | FacilityDashboardPage | BLOCKED | Uses default pH/EC values if no reading exists. |
| 39 | Vertical Farming | cea_iot | FacilityDashboardPage | BLOCKED | Returns hardcoded layers. |
| 40 | Variable Rate | planning | VariableRatePage | REWORK | Prescriptions use synthetic zone scores; GeoJSON geometry must be verified. |
| 41 | GPS Mapping | farm | FieldBoundaryPage | REWORK | Area/KMeans work, but zone soil/NDVI inputs are synthetic. |
| 42 | Scheme Matching | gov | SchemeDiscoveryPage | REWORK | No official source/retrieval metadata. |
| 43 | Document OCR | gov | DocumentVaultPage | PASS* | Tesseract installed and upload/autofill test passed; confidence/verification state absent. |
| 44 | Input Ranking | marketplace | InputsMarketplacePage | REWORK | Artifact exists, but training provenance is synthetic and fallback ranking remains. |
| 45 | Delivery Tracking | marketplace | InputsMarketplacePage | REWORK | Basic status test passes; no real route/delivery event stream. |
| 46 | Payment Gateway | finance | LedgerPage | BLOCKED | Only mock Razorpay credentials configured; API correctly responds 503. |
| 47 | Transaction Ledger | finance | LedgerPage | PASS* | PDF/ledger flow is covered by Step 6 once its corrected test runs. |
| 48 | CEA Energy | cea_iot | FacilityDashboardPage | BLOCKED | Fixed consumption recommendation, no optimization/persisted readings. |
| 49 | Warehouse/e-NWR | finance | InsuranceWarehousePage | BLOCKED | Explicit WDRA mock adapter; no official integration credentials. |
| 50 | Credit Scoring | finance | CreditLoanPage | REWORK | XGBoost/SHAP artifacts are synthetic-data trained; record-feature provenance incomplete. |
| 51 | Livestock Health | health | LivestockPage | REWORK | XGBoost uses image-brightness-derived fake vital proxies. |
| 52 | Labor Marketplace | marketplace | MachineryLaborPage | PASS* | Booking/conflict tests pass; availability calendar coverage is incomplete. |
| 53 | FPO Suite | community | FPOCommunityPage | REWORK | Basic create/pool tests pass; membership validation and settlements are incomplete. |
| 54 | Insurance Claims | finance | InsuranceWarehousePage | REWORK | Evidence assembly is not grounded in verified satellite/weather records. |
| 55 | B2B Sales | marketplace | BuyerExchangePage | REWORK | Standing-order creation tested; partial/recurring fulfillment is not. |
| 56 | Community Surveillance | health | PestRiskPage | REWORK | Aggregates reports but creates synthetic risk records for empty districts. |

`PASS*` is executable partial coverage, not production certification.
