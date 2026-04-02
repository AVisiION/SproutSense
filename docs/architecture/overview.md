# Architecture Overview

## Table of Contents

- [System Components](#system-components)
- [Data Flow](#data-flow)
- [Boundaries and Responsibilities](#boundaries-and-responsibilities)
- [Deployment Topology](#deployment-topology)

## System Components

SproutSense consists of four major layers:

- Edge devices
  - ESP32 Sensor module for telemetry and irrigation control
  - ESP32-CAM module for disease event capture
- Backend API
  - Node.js and Express service in apps/api
- Frontend dashboard
  - React and Vite app in apps/web
- Data and integration layer
  - MongoDB persistence, WebSocket updates, AI and weather integrations

## Data Flow

1. Sensor module reads environmental values and posts telemetry to backend endpoints.
2. Backend validates, stores, and broadcasts updates over WebSocket.
3. Frontend consumes REST and WebSocket streams for live UI state.
4. AI endpoints consume current and historical context for recommendations.
5. Admin workflows update settings, permissions, and operational controls.

## Boundaries and Responsibilities

Frontend boundary:
- Presentation, route guards, and client-side state

Backend boundary:
- Business logic, auth and RBAC, persistence, and integration orchestration

Firmware boundary:
- Device-level sensing, control loops, and transport to API

## Deployment Topology

- Backend hosted on Render
- Frontend hosted on Netlify
- MongoDB hosted in Atlas

For deployment procedures, see [setup.md](setup.md), [backend.md](backend.md), and [frontend.md](frontend.md).

## Quick Reference

- [Setup Guide](setup.md)
- [Backend Guide](backend.md)
- [Frontend Guide](frontend.md)
- [ESP32 Firmware Guide](firmware.md)
