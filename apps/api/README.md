# API (apps/api)

Node.js + Express backend for SproutSense. See `docs/backend/backend-guide.md` for API design, deployment, and development guidance.

Quick commands:

```bash
cd apps/api
npm install
npm run dev    # development with nodemon
npm start      # production
```

Required environment variables (examples in `apps/api/.env.example`): `MONGODB_URI`, `PORT`, `NODE_ENV`, `CORS_ORIGIN`.

Device and firmware integration notes are documented in `docs/firmware/firmware-guide.md` and `docs/backend/backend-guide.md`.
