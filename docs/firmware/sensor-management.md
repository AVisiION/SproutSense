# Sensor Management

## Table of Contents

- [Supported Sensors](#supported-sensors)
- [Calibration Workflow](#calibration-workflow)
- [Admin Configuration Controls](#admin-configuration-controls)
- [Sensor Data Flow](#sensor-data-flow)
- [Operational Troubleshooting](#operational-troubleshooting)

## Supported Sensors

Current platform support includes:
- soil moisture
- temperature
- humidity
- light
- flow-rate and flow-volume context

The final supported set depends on hardware configuration and firmware build.

## Calibration Workflow

1. Verify wiring and baseline readings in serial output.
2. Collect baseline values under known conditions.
3. Apply calibration constants in firmware where required.
4. Validate API payload values and dashboard rendering.

## Admin Configuration Controls

Admin functions should support:
- threshold tuning
- auto-watering behavior controls
- optional retention settings
- status and diagnostics visibility

Keep threshold changes versioned in admin logs when available.

## Sensor Data Flow

Telemetry flow:
- firmware sensor read
- API ingestion and validation
- MongoDB persistence
- dashboard polling or websocket update
- analytics and AI consumption

## Operational Troubleshooting

- Outlier values:
  - re-check calibration and sensor wiring
- Missing updates:
  - verify heartbeat and API endpoint reachability
- Drift over time:
  - recalibrate and review environmental interference

## Quick Reference

- [Firmware Guide](firmware-guide.md)
- [Backend Guide](../backend/backend-guide.md)
- [Analytics System](../frontend/analytics-system.md)
- [Admin Panel](../frontend/admin-panel.md)
