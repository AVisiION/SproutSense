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

Optional (if used):
- AI API keys
- Weather API keys

## 3) Deploy and Verify

- Check Render logs for server start
- Verify /api health/basic endpoint
- Verify sensor post endpoint from ESP32

## 4) Frontend URL Update

Set frontend env VITE_API_BASE_URL to your Render backend URL + /api

## 5) Final Checks

- Sensor data appears in dashboard
- Watering endpoints work
- No Blynk dependency in deployment path
