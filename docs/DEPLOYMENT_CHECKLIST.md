# SproutSense Deployment Checklist (Current)

Use this before demo or production deploy.

## A) Backend

- [ ] backend dependencies installed
- [ ] .env configured (MONGODB_URI, PORT, CORS_ORIGIN, NODE_ENV)
- [ ] backend starts without errors
- [ ] MongoDB connection successful
- [ ] /api endpoints reachable

## B) Frontend

- [ ] web dependencies installed
- [ ] VITE_API_BASE_URL configured
- [ ] frontend starts and shows live dashboard
- [ ] no blocking console errors

## C) ESP32 Sensor Controller

- [ ] firmware flashed: SproutSense_ESP32-001.ino
- [ ] WiFi connects successfully
- [ ] sensor readings visible on serial
- [ ] backend POST to /api/sensors works
- [ ] auto-watering logic tested
- [ ] relay and pump tested safely
- [ ] TFT display rotates pages and shows live values

## D) ESP32-CAM AI Module

- [ ] firmware flashed: ESP32_CAM_AI.ino
- [ ] camera initializes
- [ ] disease event/API path works

## E) Integration

- [ ] dashboard receives sensor updates
- [ ] watering logs saved
- [ ] config updates apply correctly
- [ ] alerts appear when thresholds crossed

## F) Wiring and Safety

- [ ] common ground across ESP32, relay PSU, sensors, TFT
- [ ] pump powered by external 5V source
- [ ] TFT powered with 3.3V logic
- [ ] ADC sensors on GPIO 34/35/39

## G) Current Scope Validation

- [ ] no Blynk dependency in workflow
- [ ] no Google Assistant dependency in workflow

When all boxes are checked, setup is ready.


