# Smart Watering System - Backend API

Node.js/Express backend with MongoDB, rate limiting, validation, and WebSocket support.

## Features

- 🗄️ **MongoDB Integration** - Store sensor readings, watering logs, and configuration
- 🚀 **REST API** - Complete API with MERN stack best practices
- 📡 **WebSocket Support** - Real-time updates to connected clients
- 🤖 **AI Recommendations** - Smart watering suggestions based on sensor data
- 📊 **Data Analytics** - Historical data analysis and insights
- 🔒 **Security** - Helmet.js, CORS, rate limiting, input validation
- ✅ **Validation** - Express-validator for request validation
- 🛡️ **Rate Limiting** - Multiple rate limiters for different endpoints
- 📝 **Structured Logging** - Morgan for HTTP request logging
- 🎯 **Error Handling** - Centralized error management

## Directory Structure

See [STRUCTURE.md](STRUCTURE.md) for detailed project structure documentation.

```
backend/src/
├── config/         # Configuration & constants
├── models/         # MongoDB schemas
├── controllers/    # Business logic
├── routes/         # API endpoints
├── middleware/     # Express middleware
├── validators/     # Request validation
├── utils/          # Helper functions
└── server.js       # Main entry point
```

## Setup

### Prerequisites

- Node.js 18+ installed
- MongoDB installed locally OR MongoDB Atlas account
- ESP32 device on the same network (optional)

### Installation

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   copy .env.example .env
   ```

4. Edit `.env` file with your settings:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/smart-watering
   ESP32_IP=192.168.1.100
   CORS_ORIGIN=http://localhost:3000
   ```

5. Start MongoDB (if running locally):
   ```bash
   mongod
   ```

6. Start the server:
   ```bash
   # Development with auto-reload
   npm run dev

   # P

## Rate Limiting

The API implements multiple rate limiters:

| Endpoint | Limit | Window | Purpose |
|----------|-------|--------|---------|
| `/api/*` | 100 req | 15 min | General API protection |
| `/api/water/*` | 10 req | 1 min | Prevent watering spam |
| `/api/sensors` (POST) | 5 req | 5 sec | ESP32 data limit |
| `/api/sensors` (GET) | 300 req | 1 min | Allow frequent reads |
| `/api/ai/*` | 30 req | 1 min | Expensive operations |

Rate limit exceeded response:
```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again later",
  "retryAfter": 900
}
```roduction
   npm start
   ```

## API Endpoints

### Sensors

- `GET /api/sensors` - Get latest sensor readings
- `GET /api/sensors/history?hours=24` - Get sensor history
- `GET /api/sensors/hourly?hours=24` - Get hourly averages
- `GET /api/sensors/stats?days=7` - Get sensor statistics
- `POST /api/sensors` - Create new sensor reading (ESP32)

### Watering

- `POST /api/water/start` - Start watering
- `POST /api/water/stop` - Stop watering

## Request Validation

All POST/PATCH requests are validated using `express-validator`:

```javascript
// Sensor reading validation
{
  "soilMoisture": 45,    // Required: 0-100
  "temperature": 25,      // Required: -40 to 85
  "humidity": 60,         // Required: 0-100
  "light": 35000,         // Required: 0-100000
  "pH": 6.8              // Optional: 0-14
}

// Validation errors return 400 with details
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "soilMoisture",
      "message": "Soil moisture must be between 0 and 100",
      "value": 150
    }
  ]
}
```
- `GET /api/water/history?days=7` - Get watering history
- `GET /api/water/today` - Get today's watering stats
- `PATCH /api/water/:id` - Update watering log

### Configuration

- `GET /api/config` - Get system configuration
- `POST /api/config` - Update configuration
- `GET /api/config/status` - Get device status
- `POST /api/config/status` - Update device status (ESP32)
- `GET /api/config/health` - System health check

### AI

- `GET /api/ai/recommend` - Get AI watering recommendation
- `GET /api/ai/insights?days=7` - Get historical insights

### WebSocket

- Connect to `ws://localhost:5000/ws` for real-time updates
- Events: `sensor_update`, `watering_started`, `watering_stopped`, `config_updated`

## Database Schema

### SensorReading
```javascript
{
  soilMoisture: Number (0-100),
  pH: Number (0-14),
  temperature: Number,
  humidity: Number (0-100),
  light: Number,
  timestamp: Date,
  deviceId: String
}
```

### WateringLog
```javascript
{
  startTime: Date,
  endTime: Date,
  duration: Number (seconds),
  volumeML: Number,
  triggerType: 'auto' | 'manual' | 'scheduled' | 'ai',
  soilMoistureBefore: Number,
  soilMoistureAfter: Number,
  success: Boolean,
  deviceId: String
}
```

### SystemConfig
```javascript
{
  deviceId: String,
  moistureThreshold: Number (0-100),
  autoMode: Boolean,
  wateringDurationMs: Number,
  maxWateringCyclesPerDay: Number,
  sensorReadInterval: Number,
  pumpFlowRate: Number (mL/sec),
  calibration: { ... },
  schedule: { ... }
}
```

### DeviceStatus
```javascript
{
  deviceId: String,
  online: Boolean,
  lastSeen: Date,
  pumpActive: Boolean,
  currentState: 'IDLE' | 'WATERING' | 'COOLDOWN' | 'ERROR',
  ipAddress: String,
  firmwareVersion: String,
  uptime: Number
}
```

## ESP32 Integration

The ESP32 should send sensor data to the backend:

```cpp
// Example ESP32 code to send sensor data
HTTPClient http;
http.begin("http://backend-ip:5000/api/sensors");
http.addHeader("Content-Type", "application/json");

String payload = "{";
payload += "\"soilMoisture\":" + String(soilMoisture) + ",";
payload += "\"temperature\":" + String(temperature) + ",";
payload += "\"humidity\":" + String(humidity) + ",";
payload += "\"light\":" + String(light);
payload += "}";

int httpCode = http.POST(payload);
http.end();
```

## Testing

Test endpoints with curl:

```bash
# Get latest sensors
curl http://localhost:5000/api/sensors

# Start watering
curl -X POST http://localhost:5000/api/water/start

# Get AI recommendation
curl http://localhost:5000/api/ai/recommend
```

## Deployment

For production deployment:

1. Set `NODE_ENV=production` in `.env`
2. Use MongoDB Atlas for database
3. Deploy to Heroku, DigitalOcean, AWS, etc.
4. Update CORS_ORIGIN to your frontend domain
5. Consider adding authentication/API keys

## Architecture

```
Client (Web/Mobile)
      ↓
   Backend API (Express)
      ↓
   MongoDB Database
      ↑
   ESP32 Device
```

The backend acts as a central hub, storing data from ESP32 and serving it to clients with analytics and AI recommendations.
