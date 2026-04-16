# Firmware Docs

Use this category for hardware and firmware-specific documentation.

Suggested content:

- flashing and build workflow
- pin mapping and board variants
- telemetry payload contracts
- device fail-safe behavior

Primary source code references:

- firmware/ESP32-SENSOR/ESP32-SENSOR.ino
- firmware/ESP32_CAM_AI/ESP32-CAM.ino

Current implementation notes:

- Both firmwares support remote Wi-Fi credential updates from the configuration service.
- Config payload parsing supports nested response fields under config for compatibility with API responses.
- ESP32-CAM normalizes disease class labels before upload to match backend enums.
- ESP32-CAM includes an i serial command to print saved Wi-Fi details with masked password.
- Sensor controller board: ESP32-WROOM-32 DevKit.
- Camera board/sensor: ESP32-CAM (AI Thinker) with OV3660.
- Active sensors and IO: DHT22, capacitive soil sensor, LDR, YFS401 (YF-S401), button, relay + pump.
- Excluded in current build: pH sensor and any on-device display module.
