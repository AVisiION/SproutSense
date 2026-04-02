# Backend Project Structure

Canonical backend location: apps/api.

## Active Layout

apps/api/
- src/app.js: express app setup
- src/server.js: server bootstrap and websocket wiring
- src/config: runtime and threshold configuration
- src/controllers: endpoint business logic
- src/routes: route modules
- src/models: mongoose models
- src/middleware: auth, guards, rate limiting, error handling
- src/utils: helper and integration services
- scripts: operational scripts including auth and RBAC smoke test

## API Surface (high level)

- /api/auth
- /api/users
- /api/roles
- /api/public
- /api/sensors
- /api/water
- /api/config
- /api/ai

## Notes

- Legacy folder backend is a compatibility wrapper.
- New documentation should reference apps/api.
