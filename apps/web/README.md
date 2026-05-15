# Web (apps/web)

React + Vite frontend. See `docs/frontend/frontend-guide.md` for development and contribution details.

Quick commands:

```bash
cd apps/web
npm install
npm run dev     # development server (Vite)
npm run build   # production build
npm run preview # preview production build
```

Environment variables: `VITE_API_BASE_URL`, `VITE_WS_URL` (see `apps/web/.env.example`).

The frontend includes Wi‑Fi provisioning flows that integrate with the backend configuration API; see firmware docs for device expectations.
