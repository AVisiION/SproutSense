# Netlify deployment (frontend)

This folder contains the `netlify.toml` backup and notes for deploying the frontend to Netlify.

Recommended: connect the GitHub repository to Netlify and use the `netlify.toml` build settings. Set the `VITE_API_BASE_URL` and `VITE_WS_URL` environment variables in the Netlify site settings.

Manual upload: build `apps/web` and upload the `dist` folder via Netlify Drop if needed.

Build commands:

```bash
cd apps/web
npm install
npm run build
```