# Plan for Refresh Section (UI & Backend)

---

## Backend

- No dedicated "refresh" API endpoint; refresh/update logic is handled through various update endpoints and static model methods.
- Key refresh-related logic:
  - Watering logs and device status are updated via PATCH endpoints ([../../apps/api/src/routes/watering.js](../../apps/api/src/routes/watering.js)).
  - System config, device status, and data retention are updated via POST/PUT/PATCH endpoints ([../../apps/api/src/routes/config.js](../../apps/api/src/routes/config.js)).
  - The `SystemConfig` model has static methods for refreshing AI tips and weather settings ([../../apps/api/src/models/SystemConfig.js](../../apps/api/src/models/SystemConfig.js)).
  - Device staleness is checked in [../../apps/api/src/models/DeviceStatus.js](../../apps/api/src/models/DeviceStatus.js).
  - WebSocket server is set up for real-time updates ([../../apps/api/src/server.js](../../apps/api/src/server.js)), but details are limited.
- Gaps: No explicit "refresh" endpoint, and terminology between "update" and "refresh" is mixed. Real-time update details are not fully clear.

---

## UI

- Main dashboard ([../../apps/web/src/App.jsx](../../apps/web/src/App.jsx)) auto-refreshes sensor, watering, config, and device status data every 5 seconds - change to 11 seconds; disease detections every 60 seconds. - change to 5 minutes.
- Real-time updates are handled via a WebSocket hook ([../../apps/web/src/hooks/useWebSocket.js](../../apps/web/src/hooks/useWebSocket.js)).
- AI recommendations auto-refresh every 30 seconds and have a manual "Refresh AI Analysis" button ([../../apps/web/src/components/AIRecommendation.jsx](../../apps/web/src/components/AIRecommendation.jsx)).
- The Records page has a manual "Refresh" button ([../../apps/web/src/pages/Records/RecordsPage.jsx](../../apps/web/src/pages/Records/RecordsPage.jsx)).
- The Settings page allows users to set the polling interval, but this is not clearly connected to the main polling logic ([../../apps/web/src/pages/Settings/SettingsPage.jsx](../../apps/web/src/pages/Settings/SettingsPage.jsx)).
- Gaps: No global manual refresh for the dashboard, and polling interval from settings may not be fully integrated.

---

If you want a deeper dive into any specific file or want recommendations for improvement, let me know!
