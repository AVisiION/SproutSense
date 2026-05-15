# Firmware

Firmware and hardware-related code for ESP32 devices. See `docs/firmware/firmware-guide.md` and `docs/firmware/wiring-guide.md` for pinouts, flashing, and operational notes.

Primary folders:

- `firmware/ESP32-SENSOR` — sensor acquisition and irrigation control
- `firmware/ESP32_CAM_AI` — camera capture and disease-inference workflows
- `firmware/shared` — shared helpers and constants

Do not store large binaries in this folder; document hardware changes in `docs/firmware`.
