# MQTT Command Contract (Future Scope / Canary)

This document defines the planned command-path MQTT contract for future rollout and canary testing.

## Scope

- Current production release remains HTTP-first.
- First-wave scope: command push only.
- Telemetry remains HTTP in this phase.
- HTTP polling fallback remains active when MQTT is unavailable.

## Topic Format

Backend publishes watering commands to:

- `sproutsense/cmd/{ownerId}/{deviceId}/water`

Where:

- `ownerId`: backend user id associated with the authenticated action.
- `deviceId`: uppercase device id (example: `ESP32-SENSOR`).

## Command Payload

JSON payload published by backend:

```json
{
  "deviceId": "ESP32-SENSOR",
  "action": "start",
  "correlationId": "uuid-v4",
  "requestedAt": "2026-04-12T10:22:45.000Z",
  "actor": "user"
}
```

Fields:

- `deviceId`: target device id.
- `action`: `start` or `stop`.
- `correlationId`: unique id for tracing command path.
- `requestedAt`: ISO timestamp from backend.
- `actor`: `user` or `device`.

## Firmware Behavior (ESP32-SENSOR)

- Subscribes to the exact water command topic for its ownerId + deviceId.
- Accepts payloads with either:
  - `action: start|stop`, or
  - `pumpActive: true|false` (compatibility mode).
- Ignores payload when `deviceId` does not match local `DEVICE_ID`.
- Starts pump on `start` (sets manual mode), stops pump on `stop`.
- Falls back to existing HTTP command polling when MQTT is disconnected.

## Acknowledgement Topic

Firmware publishes command acknowledgements to:

- `sproutsense/ack/{ownerId}/{deviceId}/water`

Acknowledgement payload example:

```json
{
  "deviceId": "ESP32-SENSOR",
  "action": "start",
  "status": "applied",
  "correlationId": "uuid-v4",
  "pumpActive": true,
  "manualMode": true,
  "timestampMs": 1234567,
  "detail": "pump started"
}
```

Acknowledgement status values used by firmware canary:

- `received`: command accepted for execution.
- `applied`: command executed and device state changed.
- `ignored`: command valid but no state change required.

## Backend Behavior

- MQTT publish is feature-flagged via `MQTT_ENABLED=true`.
- If MQTT is disabled or disconnected, command still works through existing HTTP polling workflow.
- Device status fields are updated for diagnostics:
  - `transportMode`
  - `lastCommandTransport`
  - `lastMqttCommandAt`

## Required Config (Backend)

- `MQTT_ENABLED`
- `MQTT_BROKER_URL`
- `MQTT_PORT`
- `MQTT_USE_TLS`
- `MQTT_USERNAME`
- `MQTT_PASSWORD`
- `MQTT_COMMAND_TOPIC_PREFIX`
- `MQTT_ACK_TOPIC_PREFIX`

## Required Config (Firmware Canary)

In `firmware/ESP32-SENSOR/ESP32-SENSOR.ino`:

- Set `ENABLE_MQTT_COMMANDS` to `1`.
- Set `MQTT_BROKER_HOST` and `MQTT_BROKER_PORT`.
- Set `MQTT_OWNER_ID` to the paired backend user id.
- Optional: set broker auth values (`MQTT_USERNAME`/`MQTT_PASSWORD`).
- Optional: set `MQTT_ACK_PREFIX` (default: `sproutsense/ack`).

## Security Notes

- Use broker TLS in production (`MQTT_USE_TLS=true`, secure port).
- Enforce per-device topic ACLs so devices can subscribe only to their own command topic.
- Rotate credentials when provisioning changes or compromise is suspected.
