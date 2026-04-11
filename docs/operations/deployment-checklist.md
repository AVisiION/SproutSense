# SproutSense Deployment Checklist (Current)

Use this before demo or production deploy.

## A) Backend

- [ ] apps/api dependencies installed
- [ ] .env configured (MONGODB_URI, PORT, CORS_ORIGIN, NODE_ENV)
- [ ] backend starts without errors from apps/api
- [ ] MongoDB connection successful
- [ ] /api endpoints reachable

## B) Frontend

- [ ] apps/web dependencies installed
- [ ] VITE_API_BASE_URL configured
- [ ] frontend starts and shows live dashboard
- [ ] no blocking console errors

## C) ESP32 Sensor Controller

- [ ] firmware flashed: firmware/esp32-sensor/ESP32-SENSOR.ino
- [ ] WiFi connects successfully
- [ ] sensor readings visible on serial
- [ ] backend POST to /api/sensors works
- [ ] auto-watering logic tested
- [ ] relay and pump tested safely
- [ ] optional buzzer behavior verified (if wired)

## D) ESP32-CAM AI Module

- [ ] firmware flashed: firmware/esp32-cam/ESP32_CAM_AI.ino
- [ ] camera initializes
- [ ] disease event/API path works

## E) Integration

- [ ] dashboard receives sensor updates
- [ ] watering logs saved
- [ ] config updates apply correctly
- [ ] alerts appear when thresholds crossed

## F) Wiring and Safety

- [ ] common ground across ESP32, relay PSU, sensors
- [ ] pump powered by external 5V source
- [ ] ADC sensors on GPIO 35/39

## G) Current Scope Validation

- [ ] no Blynk dependency in workflow
- [ ] no Google Assistant dependency in workflow

When all boxes are checked, setup is ready.


