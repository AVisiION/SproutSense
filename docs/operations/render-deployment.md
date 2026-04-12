# Render Deployment Guide (Current)

Use this for backend deployment to Render.

## 1) Create Render Service

- Connect repo AV-iot-ai/SproutSense
- Root directory: apps/api
- Build command: npm install
- Start command: npm start

## 2) Set Environment Variables

Required:
- MONGODB_URI
- PORT
- NODE_ENV=production
- CORS_ORIGIN (frontend URL)

Optional for managed MQTT command transport (future scope / canary only):
- MQTT_ENABLED=true
- MQTT_BROKER_URL (for example broker hostname)
- MQTT_PORT (1883 non-TLS or 8883 TLS)
- MQTT_USE_TLS=true for TLS brokers
- MQTT_USERNAME
- MQTT_PASSWORD
- MQTT_COMMAND_TOPIC_PREFIX=sproutsense/cmd
- MQTT_ACK_TOPIC_PREFIX=sproutsense/ack

For current production update, keep MQTT disabled by leaving MQTT_ENABLED=false.

Optional (if used):
- AI API keys
- Weather API keys

## 3) Deploy and Verify

- Check Render logs for server start
- Verify /api health/basic endpoint
- Verify sensor post endpoint from ESP32
- Verify /api/config/health includes mqtt.connected=true when enabled

## 4) Frontend URL Update

Set frontend env VITE_API_BASE_URL to your Render backend URL + /api

## 5) Final Checks

- Sensor data appears in dashboard
- Watering endpoints work
- No Blynk dependency in deployment path
