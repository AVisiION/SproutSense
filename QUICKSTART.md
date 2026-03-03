# SproutSense — Quick Start

This guide gets the full system running in minutes.

## Prerequisites

✅ **Required:**
- Node.js 18+ installed
- MongoDB installed (or MongoDB Atlas account)
- ESP32 device (optional for UI testing — mock data works too)

## Optional: Gemini AI Chat
Go to **Settings → AI API Keys**, paste your `GEMINI_API_KEY`, and SproutSense AI becomes available in the AI Assistant page.  
Or set it server-side: create `backend/.env` with `GEMINI_API_KEY=your_key`.

## Quick Start

### Option 1: Automatic Start (Windows)

Run the start script:
```powershell
.\start.ps1
```

This will:
1. Check if MongoDB is running
2. Start the backend server (port 5000)
3. Start the frontend dashboard (port 3000)
4. Open new terminal windows for each service

### Option 2: Manual Start

**Terminal 1 - MongoDB:**
```bash
mongod
```

**Terminal 2 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 3 - Frontend:**
```bash
cd web
npm run dev
```

### Option 3: MongoDB Atlas (Cloud)

If using MongoDB Atlas instead of local MongoDB:

1. Edit `backend/.env`:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/smart-watering
   ```

2. Start backend and frontend as above (skip MongoDB terminal)

## Access Points

Once running:

- **Frontend Dashboard**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **WebSocket**: ws://localhost:5000/ws

## Testing Without ESP32

You can test the system without an ESP32 device:

1. Use the API to create test data:

```bash
# Create sensor reading
curl -X POST http://localhost:5000/api/sensors \
  -H "Content-Type: application/json" \
  -d '{"soilMoisture":45,"temperature":25,"humidity":60,"light":35000,"pH":6.8}'

# Start watering
curl -X POST http://localhost:5000/api/water/start \
  -H "Content-Type: application/json" \
  -d '{"triggerType":"manual"}'

# Stop watering
curl -X POST http://localhost:5000/api/water/stop \
  -H "Content-Type: application/json" \
  -d '{}'

# Get AI recommendation
curl http://localhost:5000/api/ai/recommend
```

2. View data in the dashboard at http://localhost:3000

## Architecture

```
┌─────────────────────────────────────────────┐
│                                             │
│  Frontend Dashboard (React/Vite)           │
│  http://localhost:3000                     │
│                                             │
└──────────────────┬──────────────────────────┘
                   │ REST API + WebSocket
                   ↓
┌──────────────────────────────────────────────┐
│                                              │
│  Backend Server (Node.js/Express)           │
│  http://localhost:5000                      │
│                                              │
└──────────────────┬───────────────────────────┘
                   │
        ┌──────────┴──────────┐
        ↓                     ↓
┌───────────────┐    ┌──────────────────┐
│   MongoDB     │    │   ESP32 Device   │
│   Database    │    │   (IoT Hardware) │
└───────────────┘    └──────────────────┘
```

## Data Flow

1. **ESP32** reads sensors and sends data to **Backend**
2. **Backend** stores data in **MongoDB** and analyzes it
3. **Frontend** displays data and controls via **Backend API**
4. **WebSocket** provides real-time updates to **Frontend**

## Troubleshooting

### MongoDB Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution**: Start MongoDB with `mongod` command

### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution**: 
- Change port in `backend/.env`: `PORT=5001`
- Or kill the process using the port

### Frontend Can't Connect to Backend

**Solution**: Verify backend is running at http://localhost:5000/api

## Next Steps

1. ✅ Test the dashboard without ESP32
2. ✅ Create some test data using the API
3. ✅ Configure your ESP32 device
4. ✅ Update ESP32 code to send data to backend
5. ✅ Monitor real sensor data in the dashboard

## Production Deployment

For production deployment:

1. **Backend**: Deploy to Heroku, DigitalOcean, AWS, etc.
2. **Frontend**: Build with `npm run build` and deploy to Netlify, Vercel, etc.
3. **Database**: Use MongoDB Atlas (cloud)
4. Update CORS settings in backend `.env`

## Support

- Backend documentation: [backend/README.md](backend/README.md)
- Web documentation: [web/README.md](web/README.md)
- Hardware guide: [docs/WIRING_GUIDE.md](docs/WIRING_GUIDE.md)
