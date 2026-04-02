# Setup Guide

## Table of Contents

- [Prerequisites](#prerequisites)
- [Clone and Install](#clone-and-install)
- [Configure Environment](#configure-environment)
- [First Run](#first-run)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- MongoDB instance local or cloud
- PowerShell on Windows for repository scripts

## Clone and Install

1. Clone repository

powershell
- git clone https://github.com/AV-iot-ai/SproutSense.git
- cd SproutSense

2. Install backend dependencies

powershell
- cd apps/api
- npm install

3. Install frontend dependencies

powershell
- cd ../web
- npm install

## Configure Environment

Backend apps/api/.env required keys:
- MONGODB_URI
- PORT
- NODE_ENV
- CORS_ORIGIN

Frontend apps/web/.env required keys:
- VITE_API_BASE_URL
- VITE_WS_URL

## First Run

1. Launch both services from repo root

powershell
- powershell -ExecutionPolicy ByPass -File .\start.ps1

2. Validate backend health endpoint

powershell
- curl http://localhost:5000/api/config/health

3. Open frontend app in browser
- http://localhost:5173

## Troubleshooting

- Backend fails to connect DB:
  - Check MONGODB_URI includes database name
- Frontend cannot reach API:
  - Validate VITE_API_BASE_URL protocol and host
- WebSocket disconnect loops:
  - Confirm VITE_WS_URL is set and backend is running
- Permission errors in admin flows:
  - Run auth and RBAC smoke script to verify seed state

## Quick Reference

- [Architecture Overview](architecture.md)
- [Backend Guide](backend.md)
- [Frontend Guide](frontend.md)
- [Contributor Guide](contributor-guide.md)
