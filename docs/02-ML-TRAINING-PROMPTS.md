# ML TRAINING PROMPTS
Each of these is a standalone prompt for Claude (best for getting correct, runnable training code in one shot). Paste MASTER-SPEC.md section 4 first each time. Run all training scripts locally on your RTX 5050 (`pip install torch --index-url https://download.pytorch.org/whl/cu121` for GPU build). Every model saves to `backend/ml_models/<name>.pkl` or `.pt` and the prompt also asks for a small `predict()` wrapper function the FastAPI service will import.

**Honesty note for your own README**: several of these use synthetic data because no public regional dataset exists in a 2-day window. That is completely normal for a demo/personal project — the training pipeline, model, and inference are all real and working; only the training data is synthetic where stated. Say so plainly in your demo notes instead of implying it's trained on real farmer data.

---
### 1. Crop Disease Detection CNN (#4) — REAL public dataset
Prompt: *"Write a PyTorch transfer-learning training script using MobileNetV3-Small pretrained on ImageNet, fine-tuned on the PlantVillage dataset (give me the exact Kaggle/GitHub download command). Train on a 15-20 class subset to keep it under 40 minutes on an RTX 5050 (batch size tuned for ~6GB VRAM budget). Include: train/val split, data augmentation, early stopping, saving best checkpoint as `crop_disease_model.pt`, saving the class-index mapping as JSON, and a `predict(image_path)` function returning disease name + confidence + a static treatment-recommendation lookup dict."*

### 2. AI Crop Planning recommender (#2)
Prompt: *"Generate a synthetic dataset generator (Python, numpy/pandas) producing 5000 rows of (soil_type, rainfall_mm, temperature, past_crop, market_price_trend) → recommended_crop, using realistic Indian agronomy rules I'll paste in [paste rule-of-thumb crop-soil-climate facts]. Then train an XGBoost multiclass classifier on it, save as `crop_planner.pkl`, and give me a `predict(features_dict)` function."*

### 3. Smart Irrigation / Water Demand (#3, #17)
Prompt: *"Implement the Penman-Monteith ET0 formula in Python (real agronomic formula, not ML) as the base calculation, then add a small scikit-learn regression correction layer trained on a synthetic dataset of (ET0, soil_moisture_pct, crop_stage) → adjusted_liters_per_day. Save model + give `predict()` function."*

### 4. Hyperlocal Mandi Price Forecasting (#15)
Prompt: *"Generate a synthetic but realistic daily mandi price time series (2 years, 5 crops, 3 districts) with seasonality and festival-demand spikes. Train a Prophet model per crop-district pair. Save all models in one file via pickle dict keyed by (crop, district). Give a `predict(crop, district, weeks_ahead)` function returning forecasted price + confidence interval."*

### 5. Yield Forecasting with Uncertainty (#16)
Prompt: *"Train a LightGBM quantile regression model (0.1, 0.5, 0.9 quantiles) on a synthetic dataset of (crop, soil_score, rainfall, ndvi_avg, days_since_sowing) → yield_kg_per_acre. Save 3 models, give `predict()` returning low/median/high yield band."*

### 6. Soil Health Modeling (#18) — simplified kriging substitute
Prompt: *"Use scikit-learn's GaussianProcessRegressor to interpolate N-P-K and pH values across a field grid from ~10 synthetic sparse sensor points to a 20x20 grid. Give a `predict_grid(sparse_points)` function returning the full interpolated grid as JSON for the frontend heatmap."*

### 7. Variety Recommendation Engine (#19)
Prompt: *"Build a simple hybrid recommender: collaborative filtering (use the `implicit` library ALS) on a synthetic farmer x variety 'success outcome' interaction matrix (500 farmers, 30 varieties), combined with a content-based cosine-similarity fallback on variety-soil-climate feature vectors for cold start. Save both, give `recommend(farmer_id_or_features)` function."*

### 8. Pest Outbreak Spread Prediction (#20)
Prompt: *"Implement a simple SIR-style epidemiological simulation in Python (no ML needed) over a synthetic graph of 50 villages (networkx), where infection probability is modified by wind-direction data (synthetic). Give a `predict_risk(current_infected_villages, wind_vector)` function returning next-week risk score per village. This is a simulation model, not a trained classifier — that's fine and matches feature #20's actual spec."*

### 9. RL-based Crop Rotation Planner (#23) — NOVELTY FEATURE, do early
Prompt: *"Build a custom Gymnasium environment simulating 5-season crop rotation: state = (soil_nitrogen, soil_organic_carbon, last_3_crops), actions = which of 6 crops to plant next, reward = profit - soil_degradation_penalty (degrade nitrogen if same crop repeated, restore if legume rotated in). Train a PPO agent with stable-baselines3 for ~50k timesteps (a few minutes on CPU, no GPU needed). Save the trained policy, give a `recommend_next_crop(current_state)` function calling `model.predict()`."*

### 10. Federated Learning Demo (#25) — NOVELTY FEATURE, do early
Prompt: *"Using the Flower framework (flwr), write a working federated learning demo: 4 simulated 'farm' clients each with a private local slice of a disease-image-feature dataset (use precomputed embeddings, not raw images, to keep it fast), each training a local small classifier, aggregated via FedAvg over 5 rounds, all running in one Python process via Flower's simulation mode (`flwr.simulation.start_simulation`). This should genuinely run end-to-end in under 5 minutes and prove the architecture works — label it clearly in code comments as a simulated multi-client demo (single machine), not a production multi-farmer deployment."*

### 11. Counterfactual "What-If" Simulator (#27) — NOVELTY FEATURE, do early
Prompt: *"Using DoWhy, build a causal model on a synthetic farmer-decisions dataset (irrigation_method, sowing_week_offset, fertilizer_kg) → (yield, profit), with a specified causal graph (irrigation_method and sowing_week_offset both affect yield; yield affects profit). Estimate the causal effect of switching irrigation_method using backdoor adjustment. Give a `simulate(current_decision_dict, proposed_change_dict)` function returning projected yield/profit delta with a plain-English explanation string."*

### 12. Farm/Alternative Credit Scoring (#50)
Prompt: *"Train an XGBoost binary classifier (loan_repaid: yes/no) on a synthetic dataset combining crop-plan adherence score, yield-outcome history, transaction-ledger consistency, repayment history — 3000 synthetic farmer records with realistic correlations. Save model, give `score(farmer_features)` returning a 300-900 style credit score plus top 3 contributing factors via SHAP."*

### 13. Anomaly Detection for Fraud/Quality (#28)
Prompt: *"Train an Isolation Forest (scikit-learn) on synthetic transaction records (amount, buyer_id, farmer_id, quality_grade_reported, time_since_last_txn) to flag anomalous listings. Give a `flag(transaction)` function returning anomaly_score + boolean flag."*

### 14. Grain Quality Scoring from Photo (#14) / Weed Classification (#13)
Prompt (reuse pattern from #1): *"Same MobileNetV3 transfer-learning pattern as the disease model, but for [grain quality grade classes A/B/C from a small labeled sample I'll photograph myself / weed species from a small public weed dataset — I'll provide ~30 images per class]. If I don't have enough real images yet, generate the training script so it's ready, and separately give me a synthetic-image-free fallback: a simple OpenCV color/texture heuristic (`predict_heuristic()`) that returns a plausible-looking result so the endpoint works today, clearly commented as a placeholder to be replaced once real photos are collected."* (This is the one legitimate case for a heuristic fallback — be upfront about it in the demo, don't call it "AI-trained.")

### 15. Livestock health CV (#51), Climate Risk (#29), Buyer-matching ranker (#26), Satellite stress (#11), Drone counting (#12)
For these lower-priority-for-you Vision/Phase2 items, use the same two patterns above depending on data availability: real transfer-learning CNN if you can get ~50 sample images per class in the time you have, otherwise a synthetic-data classical model (XGBoost/LightGBM) that is real and trained, just on generated data — never a bare hardcoded return value.
