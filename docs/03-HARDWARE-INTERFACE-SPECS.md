# HARDWARE INTERFACE SPECS
Give this file directly to whoever is building the physical hardware. Your software already implements the receiving end (endpoints + DB tables) — they just need to make real devices send data in this shape.

## General contract
All sensor devices push readings either via **MQTT** (preferred, for continuous streams) to a broker your backend subscribes to, or via a **REST POST** (simpler, fine for low-frequency pushes). Both are implemented in `backend/app/api/v1/cea_iot.py`.

- MQTT broker: run Mosquitto locally for demo (`mosquitto` on localhost:1883). Topic pattern: `farm/{farm_id}/{device_type}/{metric}`
- REST fallback: `POST /api/v1/cea_iot/ingest` with body `{ "farm_id": "...", "device_type": "...", "readings": {...}, "timestamp": "ISO8601" }`

## Per-feature device specs

### #30 IoT Sensor Network (soil + micro-weather)
- device_type: `soil_station`
- MQTT topic: `farm/{farm_id}/soil_station/reading`
- Payload: `{ moisture_pct: float, ph: float, n_ppm: float, p_ppm: float, k_ppm: float, temp_c: float, humidity_pct: float }`
- Suggested hardware: ESP32 + capacitive soil moisture sensor + pH probe + NPK sensor module, publishing every 5-15 min.

### #31 Precision Hydroponics Control / #37 Hydroponics automation
- device_type: `hydro_controller`
- Inbound (sensor→server) topic: `farm/{farm_id}/hydro_controller/reading` → `{ ec: float, ph: float, dissolved_o2: float, water_temp_c: float, air_temp_c: float, humidity_pct: float, co2_ppm: float }`
- Outbound (server→device command) topic: `farm/{farm_id}/hydro_controller/command` → `{ dose_nutrient_ml: float, adjust_ph_to: float, set_temp_c: float }` — backend computes this from ML-tuned setpoints and publishes it; device just needs to subscribe and actuate pumps/relays accordingly.

### #38 Aquaponics Balancer
- device_type: `aqua_system`
- Topic: `farm/{farm_id}/aqua_system/reading` → `{ ammonia_ppm: float, nitrite_ppm: float, nitrate_ppm: float, dissolved_o2: float, water_temp_c: float, fish_count_estimate: int }`
- Command topic: `farm/{farm_id}/aqua_system/command` → `{ feed_now: bool, water_cycle_rate_lph: float }`

### #39 Vertical Farming Optimizer
- device_type: `vertical_shelf_{n}` (one per shelf layer)
- Camera images: POST multipart to `/api/v1/cea_iot/shelf_image?farm_id=...&shelf_no=...` (backend runs CV canopy analysis on receipt)
- Sensor topic: `farm/{farm_id}/vertical_shelf_{n}/reading` → `{ light_intensity_lux: float, co2_ppm: float, airflow_ms: float }`
- Command topic → `{ led_intensity_pct: float, led_spectrum: str }`

### #32 Remote Facility Dashboard
No new hardware — this is purely the frontend aggregating all `cea_iot` readings across farms. Already covered by the endpoints above.

### #33 Traceability
No live device — this reads from the same sensor log tables above and timestamps them against a produce-batch record. Device builder doesn't need to do anything extra beyond the sensors already listed.

### #48 CEA Energy Optimization
Consumes existing sensor readings plus a manually-entered tariff schedule (no new hardware needed) — the optimization runs server-side against actuator command topics already defined above.

## Simulator for your demo
`hardware-sim/simulate_sensors.py` publishes plausible fake readings on all the topics above every few seconds so your dashboard looks alive during the demo without any physical device connected. When real hardware exists, just point it at the same broker/topics and turn the simulator off.
