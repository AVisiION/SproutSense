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
