# Web App

React and Vite frontend for SproutSense.

## Commands

- npm run dev: start Vite dev server
- npm run build: create production build
- npm run preview: preview production build locally

## Key Paths

- src/App.jsx: routing and shell composition
- src/components: shared UI modules
- src/pages: route-level screens
- src/hooks: reusable hooks including websocket behavior

## Device Provisioning Notes

- Wi-Fi provisioning UI writes credentials for both ESP32-SENSOR and ESP32-CAM.
- Settings and provisioning flows call configuration endpoints that persist nested wifiConfiguration values.
- Firmware consumes those values through device-authenticated config routes.

## Environment

Create apps/web/.env with:

- VITE_API_BASE_URL
- VITE_WS_URL
