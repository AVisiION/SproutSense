# Firmware

Embedded modules for hardware devices.

- firmware/ESP32-SENSOR: sensor acquisition, pump and relay control
- firmware/ESP32_CAM_AI: image capture and disease inference pipeline
- firmware/shared: shared constants and protocol helpers
- firmware/simulator: optional test or simulation assets

Document pinouts and flash procedures in docs/firmware and docs/firmware/wiring-guide.md.

Operational notes:

- Wi-Fi credentials can be provisioned from the web app and synced to both device types.
- Both modules use device-authenticated API calls and require valid device tokens.
- ESP32-CAM applies disease-label normalization before submitting detection payloads.
- Current hardware profile:
	- ESP32-SENSOR runs on ESP32-WROOM-32 DevKit.
	- ESP32-CAM uses OV3660 camera sensor.
	- Active sensors: DHT22, capacitive soil sensor, LDR, YFS401 (YF-S401).
	- Active controls: push button, relay, and pump motor.
	- Not used: pH sensor and on-device display.
