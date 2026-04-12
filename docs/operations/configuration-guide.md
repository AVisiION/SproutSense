# SproutSense Configuration Guide (Current)

Use this as the single configuration reference.

## 1) Sensor Controller Firmware

File:
- firmware/esp32-sensor/ESP32-SENSOR.ino

Set:
- WiFi SSID and password
- BACKEND_SENSOR_POST_URL
- BACKEND_DEVICE_ID
- Timezone string

## 2) Pin Configuration (must match wiring)

Sensors:
- Moisture AO -> GPIO 35
- LDR AO -> GPIO 39
- DHT22 DATA -> GPIO 13
- Flow pulse -> GPIO 26

Relay:
- IN1 -> GPIO 14

## 3) Core Thresholds

- Soil moisture trigger: 30%
- Soil moisture target: 70%
- Temperature comfort: 18C - 28C
- Humidity comfort: 40% - 75%

## 4) Backend Environment

Backend .env minimum:
- MONGODB_URI
- PORT
- CORS_ORIGIN
- NODE_ENV

Optional MQTT command transport (future scope, not required for current deployment):
- MQTT_ENABLED (set true to enable)
- MQTT_BROKER_URL
- MQTT_PORT (1883 or 8883)
- MQTT_USE_TLS (true for 8883)
- MQTT_USERNAME
- MQTT_PASSWORD
- MQTT_COMMAND_TOPIC_PREFIX (default: sproutsense/cmd)
- MQTT_ACK_TOPIC_PREFIX (default: sproutsense/ack)
- MQTT_RECONNECT_PERIOD_MS

Optional AI/weather keys can be set if used by backend.

Verification:
- GET /api/config/health includes a mqtt object with enabled/configured/connected fields.
- For current production update, keep MQTT disabled unless explicitly running a canary.

## 5) Frontend Environment

apps/web .env minimum:
- VITE_API_BASE_URL

## 6) Required Arduino Libraries

- DHT sensor library

## 7) Current Non-Goals


- Google Assistant is not used

If something does not work, verify docs/firmware/wiring-guide.md first.


