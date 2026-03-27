# SproutSense Workspace Instructions

This document provides guidance for AI agents and developers working on the SproutSense project.

---

## 1. Project Overview

SproutSense is an IoT platform for automated plant care using a dual ESP32 and MERN stack.

- **Backend**: Node.js/Express API on Render.
- **Frontend**: React/Vite dashboard on Netlify.
- **Database**: MongoDB Atlas.
- **Hardware**: ESP32 for sensors/actuators and ESP32-CAM for disease detection.

**Key Documentation:**
- [README.md](README.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Deployment Checklist](docs/DEPLOYMENT_CHECKLIST.md)
- [Render Deployment](docs/RENDER_DEPLOYMENT.md)

---

## 2. Build and Run Commands

### Backend (`backend/`)

- **Development**: `npm run dev`
  - Runs the server with `nodemon` for auto-reloading.
- **Production**: `npm start`
  - Runs the server in production mode.
- **All-in-one Dev (PowerShell)**: `.\start.ps1`
  - Starts both backend and frontend in development mode.

### Frontend (`web/`)

- **Development**: `npm run dev`
  - Starts the Vite development server.
- **Production Build**: `npm run build`
  - Creates a production build in `web/dist`.
- **Preview Production Build**: `npm run preview`
  - Serves the production build locally.

---

## 3. Project Structure

- `backend/`: The Node.js API server, handling all business logic, database interactions, and communication with the ESP32 devices.
- `web/`: The React-based frontend application, providing a user interface for monitoring and controlling the system.
- `esp32-upload/`: Firmware for the ESP32 microcontrollers.
- `docs/`: Project documentation.

---

## 4. Key Files

### Backend

- `backend/src/app.js`: Main Express application setup, middleware, and routes.
- `backend/src/server.js`: The entry point of the application, sets up the HTTP and WebSocket servers.
- `backend/src/config/config.js`: Loads all configuration from environment variables.
- `backend/src/config/db.js`: Handles the MongoDB connection.
- `backend/src/config/sensorThresholds.js`: Defines the thresholds for sensor readings that trigger alerts.
- `backend/src/routes/`: Contains all the API route definitions.

### Frontend

- `web/src/App.jsx`: The main React component, which includes routing and global state management.
- `web/src/main.jsx`: The entry point for the React application.
- `web/src/utils/api.js`: A module for making API calls to the backend.
- `web/src/hooks/useWebSocket.js`: A custom hook for managing the WebSocket connection.
- `web/src/components/`: Contains all the reusable React components.

---

## 5. API Endpoints

The backend exposes a RESTful API for managing the system.

- **`/api/sensors`**: For sensor data.
- **`/api/water`**: For controlling the watering system.
- **`/api/config`**: For system configuration and status.
- **`/api/ai`**: For AI-powered recommendations and disease detection.

For a detailed list of endpoints, see the files in `backend/src/routes/`.

---

## 6. Environment Variables

### Backend (`.env` file or Render dashboard)

- `MONGODB_URI`: **Required**. The connection string for your MongoDB Atlas database. **Must include the database name**.
- `PORT`: The port for the server to listen on (defaults to 5000).
- `NODE_ENV`: Set to `production` for production builds.
- `CORS_ORIGIN`: The URL of the frontend application.
- `ENABLE_TEST_MODE`: Set to `true` to enable test data generation.

### Frontend (Netlify dashboard)

- `VITE_API_BASE_URL`: The base URL for the backend API.
- `VITE_WS_URL`: The URL for the WebSocket server.

---

## 7. Deployment

- **Backend**: Deployed on **Render** as a Node.js service. The build command is `npm install` and the start command is `npm start`. See `render.yaml`.
- **Frontend**: Deployed on **Netlify**. The build command is `npm run build` and the publish directory is `web/dist`. See `netlify.toml`.
