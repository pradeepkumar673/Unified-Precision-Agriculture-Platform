# Model Provenance

Audited 2026-09-16. “Artifact present” means the local file exists; it does
not establish a production-quality or real-world dataset. Synthetic origin is
recorded deliberately so no endpoint can present it as farmer-grounded data.

| Model / artifact | Training script | Dataset provenance | Recorded metric | Endpoint / status |
|---|---|---|---|---|
| `crop_disease_model.pt` | `train_crop_disease_cnn.py` | PlantVillage local copy (54,305 files) | No checked evaluation report in artifact metadata | disease-detect; integration needs unseen-image test |
| `crop_planner.pkl` | `train_crop_planner.py` | Synthetic agronomy rows | artifact present | crop-plan; synthetic |
| `irrigation_correction.pkl` | `train_irrigation.py` | Synthetic correction data | artifact present | irrigation; synthetic correction |
| `mandi_price_models.pkl` | `train_mandi_price.py` | Synthetic 2-year price series | in-sample MAE in `mandi_price_meta.json` | price-forecast; not real mandi data |
| `yield_q10/q50/q90.pkl` | `train_yield_forecast.py` | Synthetic yield data | metadata exists | yield-forecast; synthetic |
| `soil_gpr_kernels.pkl` | `train_soil_gpr.py` | Synthetic sparse readings | metadata exists | runtime endpoint fits GPR from submitted readings |
| `variety_als_model.pkl` | `train_variety_recommender.py` | Synthetic farmer/variety interactions | metadata exists | variety recommendation; synthetic |
| `rl_rotation_ppo.zip` | `train_rl_rotation.py` | Synthetic Gym environment | reward metadata | rotation plan; synthetic simulator |
| `pest_village_graph.pkl` | `pest_outbreak_sim.py` | Synthetic village graph | metadata exists | pest risk; simulation |
| `fl_global_model.pkl` | `federated_learning_demo.py` | Synthetic embeddings | final accuracy 0.4825 in stored metadata | FL demo; runtime rerun reached 0.7033 on synthetic partitions |
| `causal_regression.pkl` | `causal_whatif_sim.py` | Synthetic causal data | metadata compares against known synthetic effect | what-if; simulation |
| `anomaly_iforest.pkl` | `train_anomaly_detection.py` | Synthetic transactions | AUC 0.7217 | fraud check; synthetic |
| `credit_xgb.pkl` | `train_credit_scoring.py` | Synthetic credit records | test AUC 0.8309, accuracy 0.8317 | loan apply; synthetic |
| `product_ranker_lgbm.pkl` | `train_product_ranker.py` | Not documented as a public dataset | metadata exists | product ranking; provenance incomplete |
| `buyer_match_xgb.pkl` | `train_phase2_models.py` | Not documented as a public dataset | metadata exists | buyer matching; provenance incomplete |
| `satellite_stress_lgbm.pkl` | `train_phase2_models.py` | Synthetic/weather-derived feature data | accuracy 0.9575 | stress-check; not satellite imagery |
| `drone_counter_lgbm.pkl` | `train_phase2_models.py` | Synthetic image statistics | MAE 7,300; R² 0.9912 | not called by primary endpoint; expected YOLO file missing |
| `grain_quality_model.pkl` | `train_grain_quality_weed.py` | Local GrainSet copy (14,092 files) | no verified held-out report | grain-quality; output metrics currently fabricated from grade |
| `weed_classifier.pkl` | `train_grain_quality_weed.py` | Local weed data (35,019 files) | no verified held-out report | weed-detect; fallback remains |
| `livestock_health_xgb.pkl` | `train_phase2_models.py` | Synthetic vital-sign proxies | metadata exists | livestock health; image proxy inputs are invalid clinical evidence |
| `climate_risk_lgbm.pkl` | `train_phase2_models.py` | Synthetic climate data | MAE 0.0432, R² 0.7482 | climate risk; field source missing |

Missing artifacts / dependencies: a plant-trained YOLO checkpoint (the local
`ml_models/yolov8n_plants.pt` loads as generic 80-class COCO YOLOv8n), real
mandi source snapshots, Sentinel acquisition records, real farm outcome data,
and a versioned dataset manifest/checksum for every local dataset.
