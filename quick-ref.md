# Quick Reference

## Canonical Paths

- Backend: apps/api
- Frontend: apps/web
- Firmware Sensor: firmware/esp32-sensor
- Firmware CAM: firmware/esp32-cam

## Common Commands

From repository root:

- Start both apps: powershell -ExecutionPolicy ByPass -File .\start.ps1
- Start production mode helpers: powershell -ExecutionPolicy ByPass -File .\start-production.ps1

Backend only:

- cd apps/api; npm run dev
- cd apps/api; npm start
- cd apps/api; node scripts/auth-rbac-smoke.mjs

Frontend only:

- cd apps/web; npm run dev
- cd apps/web; npm run build
- cd apps/web; npm run preview

## Key Docs

- docs/README.md
- docs/operations/configuration-guide.md
- docs/firmware/wiring-guide.md
- docs/operations/deployment-checklist.md
- docs/operations/render-deployment.md
- docs/backend/auth-rbac-smoke-checklist.md
