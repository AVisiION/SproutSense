# SproutSense — Deployment Switching Guide

This document explains exactly what to change when switching between
**Local Network Mode** (laptop + local MongoDB) and **Hosted Mode** (Render + MongoDB Atlas + Netlify).

---

## Project Folder Structure

```
SproutSense/
├── apps/api/         ← Node.js Express API
│   └── .env          ← Backend environment variables (NOT committed to Git)
├── apps/web/         ← React + Vite frontend
│   └── .env          ← Frontend environment variables (NOT committed to Git)
└── local/
    └── host.md       ← This file
```

---

## MODE 1 — Local Network (Laptop + Local MongoDB)

Use this mode for development, testing, and project presentations on a local Wi-Fi network.

### Step 1: Find Your Laptop's Local IP Address

1. Open **Command Prompt** (Windows Key → type `cmd` → Enter).
2. Run: `ipconfig`
3. Find **Wireless LAN adapter Wi-Fi → IPv4 Address** (e.g., `192.168.1.15`).

---

### Step 2: Backend `.env` (file location: `apps/api/.env`)

Create this file if it does not exist. Copy and paste the following:

```env
# ── Core ─────────────────────────────────────────────────
NODE_ENV=development
PORT=5000

# ── Database (Local MongoDB) ─────────────────────────────
# Use 127.0.0.1 instead of localhost to avoid IPv6 issues in Node.js
MONGODB_URI=mongodb://127.0.0.1:27017/smart-watering

# ── CORS ─────────────────────────────────────────────────
# Allow your local Vite frontend AND any phone on the same network
CORS_ORIGIN=http://localhost:5173

# ── Test / Rate Limits ───────────────────────────────────
ENABLE_TEST_MODE=true
RATE_LIMIT_MAX=200

# ── ESP32 Hardware ───────────────────────────────────────
ESP32_IP=192.168.1.100
ESP32_PORT=80

# ── AI Provider ─────────────────────────────────────────
AI_PRIMARY_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here

# ── Weather ─────────────────────────────────────────────
WEATHER_PRIMARY=openweathermap
WEATHER_LOCATION=auto
OPENWEATHER_API_KEY=your_openweather_key_here

# ── Security ─────────────────────────────────────────────
JWT_SECRET=local-dev-secret-replace-in-production
```

---

### Step 3: Frontend `.env` (file location: `apps/web/.env`)

Create this file if it does not exist. Replace `192.168.1.X` with your actual laptop IPv4 address:

```env
# ── Backend API URL ───────────────────────────────────────
# Replace 192.168.1.X with your laptop's actual local IPv4 address
# This must match your backend PORT (default 5000)
VITE_API_BASE_URL=http://192.168.1.X:5000/api

# ── Admin Credentials ────────────────────────────────────
VITE_ADMIN_USER=admin
VITE_ADMIN_PASS=sproutsense2025
```

> **Note:** `api.js` reads `VITE_API_BASE_URL`. If this variable is missing, it falls back to `/api` (which only works when frontend and backend run on the same port).

---

### Step 4: Update CORS in Backend

Open `apps/api/src/` and find your CORS configuration. Allow phones on the local network:

```javascript
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // ESP32 hardware + Postman
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Allow any local IP on port 5173 (for phone access)
    if (origin.startsWith('http://192.168.') && origin.endsWith(':5173')) {
      return callback(null, true);
    }
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

---

### Step 5: Update ESP32 Firmware URLs

In both `esp32/SproutSense_ESP32_CAM.ino` and `esp32/SproutSense_ESP32_SENSOR.ino`,
replace the Render cloud URLs with your laptop's IP:

```cpp
// Replace 192.168.1.X with your actual laptop IPv4 address
const char* URL_SENSORS       = "http://192.168.1.X:5000/api/sensors";
const char* URL_STATUS        = "http://192.168.1.X:5000/api/config/status";
const char* URL_WATER_START   = "http://192.168.1.X:5000/api/water/start";
const char* URL_WATER_STOP    = "http://192.168.1.X:5000/api/water/stop";
const char* URL_WATER_STATUS  = "http://192.168.1.X:5000/api/water/status/ESP32-SENSOR";
const char* URL_AI_DISEASE    = "http://192.168.1.X:5000/api/ai/disease";
const char* URL_CONFIG_PATH   = "http://192.168.1.X:5000/api/config/ESP32-CAM";
const char* URL_CONFIG_QUERY  = "http://192.168.1.X:5000/api/config?deviceId=ESP32-CAM";
```

> **Important:** Change `https://` to `http://` and use `WiFiClient` instead of `WiFiClientSecure` for local mode.

---

### Step 6: Open Windows Firewall Port

1. Open **Windows Defender Firewall with Advanced Security**.
2. Click **Inbound Rules → New Rule → Port → TCP**.
3. Type `5000` in Specific local ports. Click Next.
4. Select **Allow the connection**. Keep all profiles checked.
5. Name it `NodeJS Backend Port 5000`. Click Finish.

---

### Step 7: Start the System

Open two terminal windows:

**Terminal 1 — Backend:**
```bash
cd apps/api
npm install
npm start
```

**Terminal 2 — Frontend (exposed to network):**
```bash
cd apps/web
npm install
npm run dev -- --host
```

The terminal will display:
```
➜  Local:   http://localhost:5173/
➜  Network: http://192.168.1.X:5173/
```

Open the **Network** URL on your smartphone to view the dashboard.

---

## MODE 2 — Hosted (Render + MongoDB Atlas + Netlify)

Use this mode for cloud deployment and public access.

### Step 1: Backend `.env` on Render

Set these in the **Render Dashboard → Environment tab** (do NOT commit to Git):

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/smart-watering
CORS_ORIGIN=https://your-app.netlify.app
GEMINI_API_KEY=your_gemini_api_key_here
OPENWEATHER_API_KEY=your_openweather_key_here
JWT_SECRET=strong-random-secret-for-production
ENABLE_TEST_MODE=false
RATE_LIMIT_MAX=100
```

---

### Step 2: Frontend `.env` on Netlify

Set these in the **Netlify Dashboard → Site Settings → Environment Variables**:

```env
VITE_API_BASE_URL=https://sproutsense-backend.onrender.com/api
VITE_ADMIN_USER=admin
VITE_ADMIN_PASS=your_secure_password_here
```

---

### Step 3: Restore ESP32 Firmware URLs

Change firmware URLs back to the Render cloud and use `WiFiClientSecure`:

```cpp
const char* URL_SENSORS       = "https://sproutsense-backend.onrender.com/api/sensors";
const char* URL_STATUS        = "https://sproutsense-backend.onrender.com/api/config/status";
const char* URL_WATER_START   = "https://sproutsense-backend.onrender.com/api/water/start";
const char* URL_WATER_STOP    = "https://sproutsense-backend.onrender.com/api/water/stop";
const char* URL_WATER_STATUS  = "https://sproutsense-backend.onrender.com/api/water/status/ESP32-SENSOR";
const char* URL_AI_DISEASE    = "https://sproutsense-backend.onrender.com/api/ai/disease";
const char* URL_CONFIG_PATH   = "https://sproutsense-backend.onrender.com/api/config/ESP32-CAM";
const char* URL_CONFIG_QUERY  = "https://sproutsense-backend.onrender.com/api/config?deviceId=ESP32-CAM";
```

---

### Step 4: Prevent Render Free Tier Sleep (Recommended)

Set up a free ping service to keep your backend alive:

1. Go to [uptimerobot.com](https://uptimerobot.com) and create a free account.
2. Add a new **HTTP(S) monitor**.
3. Set the URL to: `https://sproutsense-backend.onrender.com/api`
4. Set the interval to **every 14 minutes**.
5. Save. The backend will never sleep during your project presentation.

---

## Quick Reference Checklist

| What to Change            | Local Mode                          | Hosted Mode                                      |
|---------------------------|-------------------------------------|--------------------------------------------------|
| `apps/api/.env MONGODB_URI`| `mongodb://127.0.0.1:27017/...`     | MongoDB Atlas connection string                  |
| `apps/api/.env CORS_ORIGIN`| `http://localhost:5173`             | `https://your-app.netlify.app`                   |
| `apps/web/.env VITE_API_BASE_URL` | `http://192.168.1.X:5000/api`   | `https://sproutsense-backend.onrender.com/api`   |
| ESP32 URL prefix          | `http://192.168.1.X:5000/...`       | `https://sproutsense-backend.onrender.com/...`   |
| ESP32 HTTP library        | `WiFiClient` (plain HTTP)           | `WiFiClientSecure` (HTTPS)                       |
| Frontend start command    | `npm run dev -- --host`             | `npm run build` → deploy to Netlify              |
| Windows Firewall          | Open port 5000 manually             | Not required (Render handles this)               |

---

*Last updated: March 2026 — SproutSense AI-Minor Project*
