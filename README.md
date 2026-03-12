# SproutSense

Simple IoT plant care project with dual ESP32 devices.

## Keep This Simple

Use these files first:
- README.md (this file)
- docs/WIRING_GUIDE.md
- PRESENTATION_10MIN_GUIDE.txt
- AI_PROJECT_CONTEXT.txt

## What This Project Does

- Reads live sensors: soil moisture, pH, temperature, humidity, light
- Controls watering pump with safety limits
- Sends data to backend and web dashboard
- Uses ESP32-CAM for disease detection
- Shows live data on TFT display (ST7735R)

## Device Layout

1. ESP32 Sensor Controller
- Sensors + relay + pump
- Firmware: esp32-upload/ESP32 - Controller/SproutSense_ESP32-001.ino

2. ESP32-CAM AI
- Leaf image + disease inference
- Firmware: esp32-upload/ESP32_CAM_AI/ESP32_CAM_AI.ino

## Quick Run (Local)

1. Backend
- cd backend
- npm install
- npm run dev

2. Frontend
- cd web
- npm install
- npm run dev

3. ESP32
- Open Arduino IDE
- Flash sensor controller file
- Flash ESP32-CAM file

## TFT Display (ST7735R)

Current controller firmware supports 4 rotating pages:
- Overview
- Soil + Water
- Climate
- Alerts + Watering history

Pins used:
- CS: GPIO 5
- RST: GPIO 4
- DC: GPIO 27
- MOSI: GPIO 23
- SCLK: GPIO 18

Install Arduino libraries:
- Adafruit GFX Library
- Adafruit ST7735 and ST7789 Library

## Important Notes

- Blynk is dropped
- Google Assistant is dropped
- Focus is backend + web dashboard + TFT + ESP32-CAM AI

## If You Are Presenting

Open PRESENTATION_10MIN_GUIDE.txt and follow it slide-by-slide.

## If You Need Full Hardware Connection

Open docs/WIRING_GUIDE.md.


