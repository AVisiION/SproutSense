# Render Deployment Guide (Backend)

This folder contains a backup of the Render Blueprint configuration (`render.yaml`). The Render Blueprint is the fastest way to get your Node.js Express backend and WebSocket system live on Render.

## Automated Deployment (Blueprint)

Because Render supports "Infrastructure as Code" (Blueprints), setting up the backend is almost completely automated if you deploy from GitHub.

1. Push your code to your GitHub repository.
2. Sign in to your [Render Dashboard](https://dashboard.render.com).
3. Click **"New +"**, and select **"Blueprint"** (instead of a single Web Service).
4. Select your connected `SproutSense` GitHub repository.
5. Render will automatically detect the `render.yaml` file in the root of your project.
6. **Important:** The `render.yaml` explicitly tells Render not to sync sensitive credentials. It will prompt you right on the deployment screen to fill out your environment variables.

## Required Environment Variables

When prompted, make sure to provide valid values for these backend environment variables:

- `MONGODB_URI`: Your MongoDB Atlas connection string (make sure it includes the database name and correct user/password).
- `CORS_ORIGIN`: Your deployed frontend's URL from Netlify (e.g., `https://sproutsense-frontend.netlify.app`). This is critical for websockets and frontend data access.
- `GEMINI_API_KEY`: Your Google Gemini API key if you are using the AI chat functionality.
- `NODE_ENV`: Set this to `production`.

Render will automatically handle:
- Directory: `apps/api`
- Install Command: `npm install`
- Run Command: `npm start`
- Node.js Version: `v20.0.0+` (Matches `package.json`)

## Health Checks

Your backend configuration has an automated health check path `/api`. Render will poll this endpoint occasionally. If the endpoint responds successfully, Render knows the server hasn't crashed and manages uptime and traffic routing properly.