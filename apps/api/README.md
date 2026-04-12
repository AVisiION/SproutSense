# API App

Node.js and Express backend for SproutSense.

## Commands

- npm run dev: start development server with nodemon
- npm start: start production server
- npm run smoke:auth-rbac: run auth and RBAC smoke test

## Key Paths

- src/app.js: express app setup
- src/server.js: runtime entry point and websocket bootstrap
- src/routes: API route modules
- src/models: mongoose models
- src/controllers: business logic

## Device Config and Status Routes

- Device-auth config fetch: GET /api/config/device or GET /api/config/device/:deviceId
- Device-auth status update: POST /api/config/status/device
- Config responses are returned as success and config.
- Firmware should parse nested config fields, including config.wifiConfiguration.ssid and config.wifiConfiguration.password.

## Device Authentication Requirement

- Device routes require x-device-id and x-device-token or x-device-secret headers.
- Requests without device credentials are rejected by device-auth middleware.

## Environment

Create apps/api/.env with at least:

- MONGODB_URI
- PORT
- NODE_ENV
- CORS_ORIGIN

Optional MQTT (future scope, disabled for current release):

- MQTT_ENABLED=false
- MQTT_BROKER_URL=
- MQTT_PORT=1883
- MQTT_USE_TLS=false
- MQTT_USERNAME=
- MQTT_PASSWORD=
- MQTT_COMMAND_TOPIC_PREFIX=sproutsense/cmd
- MQTT_ACK_TOPIC_PREFIX=sproutsense/ack

For email delivery, also set:

- FRONTEND_URL
- SMTP_HOST
- SMTP_PORT
- SMTP_SECURE
- SMTP_USER
- SMTP_PASS
- EMAIL_FROM

## MQTT Rollout Notes

- Current release remains HTTP-first for device communication.
- MQTT setup in this repo is for future rollout and canary testing only.
- Existing HTTP device polling remains active and backward compatible.
- MQTT command publish is only attempted when MQTT_ENABLED=true and broker connection is healthy.
- Health endpoint includes mqtt status block under GET /api/config/health.

Use apps/api/.env.example as a baseline.
