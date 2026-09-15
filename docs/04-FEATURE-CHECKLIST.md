# FEATURE CHECKLIST — all 56 features
Tier key: **[ML]** real trained model · **[RULE]** rule engine/logic, no ML needed · **[MOCK]** sandbox/mock adapter (payment/gov/bank) · **[HW]** hardware-interface only (see doc 03)
Tick each box as you verify it end-to-end (curl or UI click) during the Day 2 Step 13 smoke test.

## Core Lifecycle
- [x] #1 Digital Farm Profile — [RULE]
- [x] #2 AI Crop Planning — [ML]
- [x] #3 Smart Irrigation — [ML] (ET0 formula + correction)
- [x] #4 Crop Health AI — [ML] (CNN, real PlantVillage data)
- [x] #5 Smart Farm Alerts — [RULE]
- [x] #6 Farm Inputs Marketplace — [RULE]
- [x] #7 Machinery & Services Rental — [RULE]
- [x] #8 Gov & Financial Support Matching — [RULE]
- [x] #9 Harvest & Market — [ML] (uses #16 forecast + matching)
- [x] #10 Farm Intelligence Season Report — [RULE]

## Computer Vision
- [x] #11 Satellite Crop Stress Prediction — [ML] (synthetic NDVI demo)
- [x] #12 Drone/Video Plant Counting — [ML] (YOLOv8, small demo dataset)
- [x] #13 Weed Species Classification — [ML] (or heuristic fallback)
- [x] #14 Grain Quality Scoring — [ML] (or heuristic fallback)

## Forecasting
- [x] #15 Hyperlocal Mandi Price Forecasting — [ML]
- [x] #16 Yield Forecasting with Uncertainty — [ML]
- [x] #17 Water Demand Forecasting — [ML]

## Agronomy ML
- [x] #18 Soil Health Modeling — [ML] (Gaussian Process)
- [x] #19 Variety Recommendation Engine — [ML]
- [x] #20 Pest Outbreak Spread Prediction — [ML] (SIR simulation)

## NLP / Multimodal
- [x] #21 Voice-First AI Assistant — [ML] (Whisper + LLM API — use free Whisper model locally)
- [x] #22 Multimodal Query Understanding — [ML] (basic image+text combined prompt to an LLM API)

## RL / Optimization
- [x] #23 RL Crop Rotation Planner — [ML] — NOVELTY
- [x] #24 Dynamic Equipment/Logistics Routing — [ML] (OR-Tools VRP, real solver)

## Federated / Data Network
- [x] #25 Federated Learning Across Farms — [ML] — NOVELTY
- [x] #26 Learned Buyer-Farmer Matching — [ML]

## Moonshot / Differentiator
- [x] #27 Counterfactual "What-If" Simulator — [ML] — NOVELTY
- [x] #28 Anomaly Detection for Fraud/Quality — [ML]
- [x] #29 Climate Risk Scoring per Field — [ML] (synthetic climate demo)

## IoT / Hardware
- [x] #30 IoT Sensor Network — [HW]
- [x] #31 Precision Hydroponics Control — [HW]
- [x] #32 Remote Facility Dashboard — [HW] (frontend aggregation, no new device)
- [x] #33 Traceability — [HW]

## Community & Access
- [x] #34 Digital Sakhi / Local Support Agent — [RULE] (admin panel + logging, not ML)
- [x] #35 SHG Shared Bookings — [RULE]
- [x] #36 Grower/Farm Score — [RULE] (weighted scoring, lightweight stats)

## CEA
- [x] #37 Hydroponics Automated Control — [HW]
- [x] #38 Aquaponics Balancer — [HW]
- [x] #39 Vertical Farming Optimizer — [HW]
- [x] #48 CEA Energy Optimization — [HW]/[ML] (OR-Tools optimization, real solver, runs against simulated sensor data)

## Precision Farming / GIS
- [x] #40 Variable-Rate Application Engine — [ML] (rule + spatial regression on synthetic zone data)
- [x] #41 GPS Field Mapping & Zone Management — [RULE] (real GPS trace + k-means clustering on synthetic soil/NDVI layers)

## Government Schemes & Compliance
- [x] #42 Government Scheme Matching (auto eligibility v2) — [RULE]
- [x] #43 Document Vault (OCR) — [RULE] (real Tesseract OCR)

## Marketplace & Logistics
- [x] #44 AI-Recommended Inputs & Delivery — [ML] (ranking model)
- [x] #45 Smart Delivery & Logistics Tracking — [RULE]
- [x] #55 Institutional & Retail B2B Sales Channel — [ML] (reuses #26 ranker)

## Payments & Transactions
- [x] #46 Secure Payment Gateway — [MOCK] (Razorpay real test mode)
- [x] #47 Unified Transaction History & Ledger — [RULE]

## Post-Harvest / Storage
- [x] #49 Cold Storage & Warehouse Receipt Financing — [MOCK] (WDRA/NBFC mock adapter)

## Farm Credit & Insurance
- [x] #50 Farm Credit & Alternative-Data Loan Marketplace — [ML]
- [x] #54 Crop Insurance Claims Filing & Settlement Tracker — [RULE] (uses #11, #4 outputs as evidence)

## Livestock & Allied Income
- [x] #51 Livestock & Dairy Health Management — [ML] (or heuristic fallback CV)

## Labor & Cooperative Network
- [x] #52 On-Demand Farm Labor Marketplace — [RULE]
- [x] #53 FPO / Cooperative Collectivization Suite — [RULE]

## Agronomy ML (cont.)
- [x] #56 Community Pest & Disease Surveillance Network — [RULE]/[ML] (extends #20, aggregates #4 reports)
