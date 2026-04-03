# Netlify Deployment Guide (Frontend)

This folder contains the backup configuration (`netlify.toml`) for deploying the SproutSense React frontend to Netlify.

## Automated Deployment (Recommended)

The easiest way to deploy is by connecting your GitHub repository directly to Netlify. Netlify will automatically detect the `netlify.toml` file in the root folder and configure the build settings for you.

1. Log in to [Netlify](https://app.netlify.com/).
2. Click **"Add new site"** -> **"Import an existing project"**.
3. Select **GitHub** and choose the `SproutSense` repository.
4. Netlify will automatically read the `netlify.toml` from the root directory.
   *(It will automatically fill in `apps/web` as the base directory and `npm run build` as the build command, using Node v20).*
5. Click **"Deploy Site"**.

## Environment Variables

Once the site is created (or before the first build completes), go to **Site Settings** -> **Environment Variables** and add the following:

- `VITE_API_BASE_URL`: The URL of your live Render backend (e.g., `https://sproutsense-backend.onrender.com/api`)
- `VITE_WS_URL`: The WebSocket URL of your live Render backend (e.g., `wss://sproutsense-backend.onrender.com`)

## Manual Deployment (Drag and Drop)

If you don't want to connect your GitHub account, you can manually upload the compiled files:

1. Open your local terminal, navigate to the frontend folder, and build the project:
   ```bash
   cd apps/web
   npm install
   npm run build
   ```
2. This will generate a new folder called `dist` inside `apps/web`.
3. Log in to [Netlify Drop](https://app.netlify.com/drop).
4. Drag and drop the entire `dist` folder into the upload circle.
5. Your site will instantly go live!