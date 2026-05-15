# SproutSense

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-green)

## Table of Contents

- [What is SproutSense?](#what-is-sproutsense)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Quick Start](#quick-start)
- [Development Setup](#development-setup)
- [Environment Variables](#environment-variables)
- [Run the Project](#run-the-project)
- [Key Modules](#key-modules)
- [Contribution Guide](#contribution-guide)
- [Common Commands](#common-commands)
- [License](#license)

## What is SproutSense?

SproutSense is an IoT plant monitoring and automated irrigation platform built with a dual ESP32 hardware model, a web dashboard, and AI-assisted recommendations. The system collects live environmental and soil data, streams it to a backend API, and provides operators with real-time telemetry, watering controls, and diagnostics.

The project combines edge devices, web application workflows, and role-aware administration to support both technical monitoring and day-to-day plant care operations. It includes public-facing pages, authenticated dashboards, analytics, and AI features for practical decision support.

## Key Features

- Dual ESP32 architecture for sensing and camera-based disease workflows
- Website-driven Wi-Fi provisioning for both ESP32-SENSOR and ESP32-CAM
- React frontend with public pages and protected dashboard views
- Node.js and Express backend with modular routes and controllers
- Authentication and RBAC for admin, user, and viewer capabilities
- Sensor telemetry ingestion and historical analytics
- Watering control endpoints with safety-oriented flow logic
- AI chat and recommendation endpoints integrated into dashboard workflows
- Admin tooling for configuration, roles, and operational visibility
- Deployment-ready layout for Render and Netlify

## Current Hardware Profile

- Sensor controller: ESP32-WROOM-32 DevKit (ESP32-SENSOR)
- Camera controller: ESP32-CAM (AI Thinker) with OV3660 sensor
- Active sensors: DHT22, capacitive soil moisture sensor, LDR, YFS401 (YF-S401) flow sensor
- Active controls: physical button, relay, and water pump motor
- Not used in current build: pH sensor modules and on-device display modules

## Tech Stack

| Layer | Technology |
|------|------|
| Frontend | React, Vite, JavaScript, CSS |
| Backend | Node.js, Express |
| Database | MongoDB with Mongoose |
| Auth | JWT access flow and RBAC role model |
| Realtime | WebSocket updates |
| Firmware | ESP32 sensor firmware and ESP32-CAM module |
| AI | AI recommendation and chat integration endpoints |
| Deployment | Render for API, Netlify for frontend |

## Repository Structure

apps
- api: backend service source
- web: frontend application source

firmware
- ESP32-SENSOR: telemetry and irrigation control module
- ESP32_CAM_AI: camera and disease event module

docs
- setup, architecture, module guides, and contributor docs

legacy compatibility wrappers
- backend: forwards legacy backend commands to apps/api
- web: forwards legacy frontend commands to apps/web
- esp32-upload: points to firmware modules for backward references

## Quick Start

1. Clone and enter the repository

```bash
git clone https://github.com/AVisiION/SproutSense.git
cd SproutSense
```

2. Install dependencies

```bash
cd apps/api && npm install
cd ../web && npm install
```

3. Run local development

```powershell
powershell -ExecutionPolicy ByPass -File .\start.ps1
```

## Development Setup

1. Backend environment

Create apps/api/.env and define core values:
- MONGODB_URI
- PORT
- NODE_ENV
- CORS_ORIGIN

2. Frontend environment

Create apps/web/.env and define:
- VITE_API_BASE_URL
- VITE_WS_URL

3. Validate backend startup

powershell
- cd apps/api
- npm run dev

4. Validate frontend startup

powershell
- cd apps/web
- npm run dev

5. Optional auth and RBAC smoke validation

powershell
- cd apps/api
- node scripts/auth-rbac-smoke.mjs

## Environment Variables

| Variable | Scope | Required | Description | Example |
|------|------|------|------|------|
| MONGODB_URI | apps/api | Yes | MongoDB connection string including database name | mongodb+srv://user:pass@cluster.mongodb.net/sproutsense?retryWrites=true&w=majority |
| PORT | apps/api | Yes | API port | 5000 |
| NODE_ENV | apps/api | Yes | Runtime mode | development |
| CORS_ORIGIN | apps/api | Yes | Allowed frontend origin | http://localhost:5173 |
| JWT_SECRET | apps/api | Recommended | JWT signing secret | replace-with-strong-secret |
| GEMINI_API_KEY | apps/api | Optional | AI provider key for chat and recommendations | your-key |
| VITE_API_BASE_URL | apps/web | Yes | Base API URL used by frontend | http://localhost:5000/api |
| VITE_WS_URL | apps/web | Yes | WebSocket URL used by frontend | ws://localhost:5000 |

## Run the Project

From repository root:

powershell
- powershell -ExecutionPolicy ByPass -File .\start.ps1

Manual mode:

powershell
- cd apps/api; npm run dev
- cd apps/web; npm run dev

Production-style helpers:

powershell
- powershell -ExecutionPolicy ByPass -File .\start-production.ps1

## Key Modules

- [Setup Guide](docs/onboarding/setup.md)
- [Architecture Overview](docs/architecture/overview.md)
- [Frontend Guide](docs/frontend/frontend-guide.md)
- [Backend Guide](docs/backend/backend-guide.md)
- [ESP32 Firmware Guide](docs/firmware/firmware-guide.md)
- [Authentication and RBAC](docs/backend/authentication-rbac.md)
- [Analytics System](docs/frontend/analytics-system.md)
- [Sensor Management](docs/firmware/sensor-management.md)
- [Admin Panel](docs/frontend/admin-panel.md)
- [Public Website](docs/frontend/public-pages.md)
- [AI Features](docs/backend/ai-features.md)
*Removed: `Project Dossier Scaffold` (no `docs/details.md` found)

## Firmware and Device Config Notes

- The web settings page provisions Wi-Fi credentials for both ESP32-SENSOR and ESP32-CAM through the configuration API.
- Device configuration responses are wrapped as success and config. Firmware must parse nested config values.
- ESP32-CAM disease labels are normalized before upload to match backend enum values.
- Device-authenticated endpoints require valid device credentials through headers. Ensure each firmware has a valid device token.

## Contribution Guide

See [Contributor Guide](docs/onboarding/contributor-guide.md) for workflow, pull request expectations, style guidance, and testing requirements.

## Common Commands

| Task | Command |
|------|------|
| Start backend dev | cd apps/api; npm run dev |
| Start frontend dev | cd apps/web; npm run dev |
| Build frontend | cd apps/web; npm run build |
| Run backend production mode | cd apps/api; npm start |
| Run auth and RBAC smoke test | cd apps/api; node scripts/auth-rbac-smoke.mjs |
| Start both apps from root | powershell -ExecutionPolicy ByPass -File .\start.ps1 |

## License

This project is licensed under the MIT License.
