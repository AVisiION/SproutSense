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
- pH AO -> GPIO 34
- LDR AO -> GPIO 39
- DHT22 DATA -> GPIO 13
- Flow pulse -> GPIO 12

Relay:
- IN1 -> GPIO 14
- IN2 -> GPIO 15 (optional)

TFT ST7735R:
- CS -> GPIO 5
- RST -> GPIO 4
- DC -> GPIO 27
- MOSI -> GPIO 23
- SCLK -> GPIO 18

## 3) Core Thresholds

- Soil moisture trigger: 30%
- Soil moisture target: 70%
- pH normal: 5.5 - 7.5
- Temperature comfort: 18C - 28C
- Humidity comfort: 40% - 75%

## 4) Backend Environment

Backend .env minimum:
- MONGODB_URI
- PORT
- CORS_ORIGIN
- NODE_ENV

Optional AI/weather keys can be set if used by backend.

## 5) Frontend Environment

apps/web .env minimum:
- VITE_API_BASE_URL

## 6) Required Arduino Libraries

- Adafruit GFX Library
- Adafruit ST7735 and ST7789 Library
- DHT sensor library

## 7) Current Non-Goals


- Google Assistant is not used

If something does not work, verify docs/firmware/wiring-guide.md first.


