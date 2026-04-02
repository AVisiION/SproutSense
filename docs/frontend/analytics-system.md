# Analytics System

## Table of Contents

- [Data Pipeline](#data-pipeline)
- [Charts and Views](#charts-and-views)
- [Sensor Mapping](#sensor-mapping)
- [AI Integration in Analytics](#ai-integration-in-analytics)
- [Validation and Quality](#validation-and-quality)

## Data Pipeline

1. Sensor telemetry is ingested by backend routes.
2. Backend stores normalized records in MongoDB.
3. Frontend fetches history and trend data by time range.
4. WebSocket events augment live status where needed.

## Charts and Views

Typical analytics views include:
- moisture and temperature trends
- humidity and light distributions
- watering event timelines
- disease and alert overlays

Use clear units and consistent date formatting across cards and charts.

## Sensor Mapping

Maintain explicit mapping between frontend chart keys and backend fields.

Examples:
- soilMoisture
- temperature
- humidity
- light
- pH
- flowRate and flowVolume

When schema changes occur, update both API contracts and chart adapters.

## AI Integration in Analytics

AI analytics features consume:
- current reading context
- historical trend windows
- disease events and confidence values

Return actionable recommendations rather than only descriptive summaries.

## Validation and Quality

- Ensure each chart handles missing data safely.
- Verify date windows and aggregation intervals.
- Validate that role-based access matches analytics data sensitivity.

## Quick Reference

- [Sensors](sensors.md)
- [AI Features](ai-features.md)
- [Frontend Guide](frontend.md)
- [Backend Guide](backend.md)
