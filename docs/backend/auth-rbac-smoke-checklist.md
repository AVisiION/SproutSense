# Auth/RBAC Smoke Checklist

Use this checklist after auth or RBAC changes to catch regressions quickly.

## Prerequisites

1. Backend server is running on http://localhost:5000
2. Frontend server is running on http://localhost:3000
3. apps/api/.env contains a valid MONGODB_URI
4. Roles and permissions are seeded at startup

## Automated Smoke Script

Run:

```powershell
cd apps/api
node scripts/auth-rbac-smoke.mjs
```

Expected coverage:

1. Register returns 201 and pending_verification status
2. Pending account login is blocked with 403
3. Activated account login succeeds and returns access + refresh tokens
4. /api/auth/me works with Bearer token
5. /api/auth/refresh rotates session successfully
6. /api/auth/logout succeeds
7. Protected route without token returns 401
8. Protected route with valid token is authorized

## Manual UI Smoke (Frontend)

1. Open http://localhost:3000/login
2. Register a new user and confirm pending-verification UX
3. Verify account using email flow (or admin activation in dev)
4. Log in and confirm role-aware navbar menu
5. Confirm unauthorized navigation redirects to Access Denied
6. Confirm sidebar items are filtered by permission
7. Confirm admin-only pages are blocked for non-admin users

## API Spot Checks

Use a REST client or curl against:

1. POST /api/auth/register
2. POST /api/auth/login
3. POST /api/auth/refresh
4. GET /api/auth/me
5. GET /api/sensors (with and without token)
6. GET /api/config/admin-logs (admin permission required)

## Security Spot Checks

1. Trigger multiple failed logins to validate lockout behavior
2. Confirm auth limiter blocks excessive login attempts
3. Confirm forgot-password endpoint returns generic response for unknown email
4. Confirm suspended/disabled users are blocked even with valid token
5. Confirm refresh token reuse is rejected after logout
