# ESP32 Firmware Guide

## Table of Contents

- [Hardware Modules](#hardware-modules)
- [Sensor Wiring](#sensor-wiring)
- [Firmware Upload Workflow](#firmware-upload-workflow)
- [Communication Protocol](#communication-protocol)
- [Operational Checks](#operational-checks)

## Hardware Modules

SproutSense uses two firmware modules:
- firmware/esp32-sensor
- firmware/esp32-cam

Sensor module handles telemetry and irrigation control.
Camera module handles disease detection events.

## Sensor Wiring

Core mapping is maintained in project wiring documentation:
- [wiring-guide.md](wiring-guide.md)

Always verify power and shared ground before flashing.

## Firmware Upload Workflow

1. Open module firmware in Arduino IDE.
2. Select correct board and port.
3. Configure network and backend endpoint values.
4. Build and upload.
5. Validate serial output and backend ingestion.

## Communication Protocol

Sensor firmware posts JSON payloads to backend API routes for:
- sensor readings
- status heartbeats
- watering actions

Camera firmware posts disease inference payloads with confidence and metadata.

Use stable field names and keep firmware and backend schemas synchronized.

## Operational Checks

- Device can connect to WiFi and backend
- Readings are persisted and visible in dashboard
- Watering actions are reflected in logs and status
- Disease events appear in AI and alert views

## Quick Reference

- [Setup Guide](../onboarding/setup.md)
- [Sensor Management](sensor-management.md)
- [AI Features](../backend/ai-features.md)
- [Architecture Overview](../architecture/overview.md)
