# React Architecture (Current)

## Frontend Goal

Provide one clean dashboard for monitoring and control.

## Main Structure

- App shell and navigation
- Sensor/status cards
- Watering controls
- Configuration card
- AI pages/components

## Data Source

- REST API from backend
- Websocket/live updates where enabled

## Current UX Direction

- Keep it simple
- No Blynk-dependent UI assumptions
- Use backend as single source of truth

## Important Frontend Config

- VITE_API_BASE_URL

## Validation Checklist

- API calls succeed
- No hardcoded localhost in production build
- Clear history and export actions work
