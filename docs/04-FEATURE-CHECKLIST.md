# FEATURE CHECKLIST — all 56 features
Tier key: **[ML]** real trained model · **[RULE]** rule engine/logic, no ML needed · **[MOCK]** sandbox/mock adapter (payment/gov/bank) · **[HW]** hardware-interface only (see doc 03)
Tick each box as you verify it end-to-end (curl or UI click) during the Day 2 Step 13 smoke test.

## Core Lifecycle
- [ ] #1 Digital Farm Profile — [RULE]
- [ ] #2 AI Crop Planning — [ML]
- [ ] #3 Smart Irrigation — [ML] (ET0 formula + correction)
- [ ] #4 Crop Health AI — [ML] (CNN, real PlantVillage data)
- [ ] #5 Smart Farm Alerts — [RULE]
- [ ] #6 Farm Inputs Marketplace — [RULE]
- [ ] #7 Machinery & Services Rental — [RULE]
- [ ] #8 Gov & Financial Support Matching — [RULE]
- [ ] #9 Harvest & Market — [ML] (uses #16 forecast + matching)
- [ ] #10 Farm Intelligence Season Report — [RULE]

## Computer Vision
- [ ] #11 Satellite Crop Stress Prediction — [ML] (synthetic NDVI demo)
- [ ] #12 Drone/Video Plant Counting — [ML] (YOLOv8, small demo dataset)
- [ ] #13 Weed Species Classification — [ML] (or heuristic fallback)
- [ ] #14 Grain Quality Scoring — [ML] (or heuristic fallback)

## Forecasting
- [ ] #15 Hyperlocal Mandi Price Forecasting — [ML]
- [ ] #16 Yield Forecasting with Uncertainty — [ML]
- [ ] #17 Water Demand Forecasting — [ML]

## Agronomy ML
- [ ] #18 Soil Health Modeling — [ML] (Gaussian Process)
- [ ] #19 Variety Recommendation Engine — [ML]
- [ ] #20 Pest Outbreak Spread Prediction — [ML] (SIR simulation)

## NLP / Multimodal
- [ ] #21 Voice-First AI Assistant — [ML] (Whisper + LLM API — use free Whisper model locally)
- [ ] #22 Multimodal Query Understanding — [ML] (basic image+text combined prompt to an LLM API)

## RL / Optimization
- [ ] #23 RL Crop Rotation Planner — [ML] — NOVELTY
- [ ] #24 Dynamic Equipment/Logistics Routing — [ML] (OR-Tools VRP, real solver)

## Federated / Data Network
- [ ] #25 Federated Learning Across Farms — [ML] — NOVELTY
- [ ] #26 Learned Buyer-Farmer Matching — [ML]

## Moonshot / Differentiator
- [ ] #27 Counterfactual "What-If" Simulator — [ML] — NOVELTY
- [ ] #28 Anomaly Detection for Fraud/Quality — [ML]
- [ ] #29 Climate Risk Scoring per Field — [ML] (synthetic climate demo)

## IoT / Hardware
- [ ] #30 IoT Sensor Network — [HW]
- [ ] #31 Precision Hydroponics Control — [HW]
- [ ] #32 Remote Facility Dashboard — [HW] (frontend aggregation, no new device)
- [ ] #33 Traceability — [HW]

## Community & Access
- [ ] #34 Digital Sakhi / Local Support Agent — [RULE] (admin panel + logging, not ML)
- [ ] #35 SHG Shared Bookings — [RULE]
- [ ] #36 Grower/Farm Score — [RULE] (weighted scoring, lightweight stats)

## CEA
- [ ] #37 Hydroponics Automated Control — [HW]
- [ ] #38 Aquaponics Balancer — [HW]
- [ ] #39 Vertical Farming Optimizer — [HW]
- [ ] #48 CEA Energy Optimization — [HW]/[ML] (OR-Tools optimization, real solver, runs against simulated sensor data)

## Precision Farming / GIS
- [ ] #40 Variable-Rate Application Engine — [ML] (rule + spatial regression on synthetic zone data)
- [ ] #41 GPS Field Mapping & Zone Management — [RULE] (real GPS trace + k-means clustering on synthetic soil/NDVI layers)

## Government Schemes & Compliance
- [ ] #42 Government Scheme Matching (auto eligibility v2) — [RULE]
- [ ] #43 Document Vault (OCR) — [RULE] (real Tesseract OCR)

## Marketplace & Logistics
- [ ] #44 AI-Recommended Inputs & Delivery — [ML] (ranking model)
- [ ] #45 Smart Delivery & Logistics Tracking — [RULE]
- [ ] #55 Institutional & Retail B2B Sales Channel — [ML] (reuses #26 ranker)

## Payments & Transactions
- [ ] #46 Secure Payment Gateway — [MOCK] (Razorpay real test mode)
- [ ] #47 Unified Transaction History & Ledger — [RULE]

## Post-Harvest / Storage
- [ ] #49 Cold Storage & Warehouse Receipt Financing — [MOCK] (WDRA/NBFC mock adapter)

## Farm Credit & Insurance
- [ ] #50 Farm Credit & Alternative-Data Loan Marketplace — [ML]
- [ ] #54 Crop Insurance Claims Filing & Settlement Tracker — [RULE] (uses #11, #4 outputs as evidence)

## Livestock & Allied Income
- [ ] #51 Livestock & Dairy Health Management — [ML] (or heuristic fallback CV)

## Labor & Cooperative Network
- [ ] #52 On-Demand Farm Labor Marketplace — [RULE]
- [ ] #53 FPO / Cooperative Collectivization Suite — [RULE]

## Agronomy ML (cont.)
- [ ] #56 Community Pest & Disease Surveillance Network — [RULE]/[ML] (extends #20, aggregates #4 reports)
