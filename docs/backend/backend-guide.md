# Backend Guide

## Table of Contents

- [Backend Structure](#backend-structure)
- [API Routes](#api-routes)
- [Middleware and Auth](#middleware-and-auth)
- [Database Model](#database-model)
- [Deployment Notes](#deployment-notes)

## Backend Structure

Canonical backend path is apps/api.

Key folders:
- src/routes for endpoint declarations
- src/controllers for request business logic
- src/models for mongoose schemas
- src/middleware for auth, guards, limits, and error handling
- src/config for environment and thresholds

## API Routes

Primary route groups:
- /api/auth
- /api/users
- /api/roles
- /api/device
- /api/public
- /api/sensors
- /api/water
- /api/config
- /api/ai

The config area also exposes operational subroutes for status, health, retention policies, admin logs, and test mode.

Use controller-level validation and consistent success and error responses.

## Middleware and Auth

Core middleware responsibilities:
- authentication token parsing and verification
- account-state guard checks
- permission enforcement
- request validation
- centralized error mapping

RBAC behavior is documented in [authentication-rbac.md](authentication-rbac.md).

## Database Model

MongoDB stores domain entities such as:
- user and role entities
- sensor readings and watering logs
- system configuration and device status
- disease detections and AI usage quota

Use indexed fields for high-frequency telemetry queries.

## Deployment Notes

Render deployment references:
- rootDir should target apps/api
- start command should use npm start in apps/api

Detailed deployment and verification:
- [../onboarding/setup.md](../onboarding/setup.md)
- [../operations/render-deployment.md](../operations/render-deployment.md)

## Quick Reference

- [Architecture Overview](../architecture/overview.md)
- [Setup Guide](../onboarding/setup.md)
- [Authentication and RBAC](authentication-rbac.md)
- [MQTT Command Contract (Canary)](mqtt-command-contract.md)
- [Analytics System](../frontend/analytics-system.md)
