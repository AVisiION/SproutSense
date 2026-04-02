# API App

Node.js and Express backend for SproutSense.

## Commands

- npm run dev: start development server with nodemon
- npm start: start production server
- npm run smoke:auth-rbac: run auth and RBAC smoke test

## Key Paths

- src/app.js: express app setup
- src/server.js: runtime entry point and websocket bootstrap
- src/routes: API route modules
- src/models: mongoose models
- src/controllers: business logic

## Environment

Create apps/api/.env with at least:

- MONGODB_URI
- PORT
- NODE_ENV
- CORS_ORIGIN

For email delivery, also set:

- FRONTEND_URL
- SMTP_HOST
- SMTP_PORT
- SMTP_SECURE
- SMTP_USER
- SMTP_PASS
- EMAIL_FROM

Use apps/api/.env.example as a baseline.
