# MERN Stack Architecture - Smart Watering System

## Complete Technology Stack

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                              │
│                                                                     │
│   ┌──────────────┐                                                 │
│   │    Vite      │  React/Vanilla JS                               │
│   │   (Dev Server)│  Modern build tool                             │
│   │  Port 3000   │  Hot module replacement                         │
│   └──────┬───────┘                                                 │
│          │                                                          │
└──────────┼──────────────────────────────────────────────────────────┘
           │
           │ HTTP REST API + WebSocket
           │
┌──────────▼──────────────────────────────────────────────────────────┐
│                        BACKEND LAYER (Node.js)                      │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐ │
│   │             Express.js Server (Port 5000)                   │ │
│   │                                                             │ │
│   │  ┌──────────────────────────────────────────────────────┐  │ │
│   │  │           MIDDLEWARE CHAIN                           │  │ │
│   │  │  • Helmet (Security Headers)                         │  │ │
│   │  │  • CORS (Cross-Origin)                               │  │ │
│   │  │  • Morgan (Logging)                                  │  │ │
│   │  │  • express-rate-limit (Rate Limiting)                │  │ │
│   │  │  • express-validator (Input Validation)              │  │ │
│   │  └──────────────────────────────────────────────────────┘  │ │
│   │                                                             │ │
│   │  ┌──────────────────────────────────────────────────────┐  │ │
│   │  │              ROUTES (API Endpoints)                  │  │ │
│   │  │  • /api/sensors    - Sensor data                     │  │ │
│   │  │  • /api/water      - Watering control                │  │ │
│   │  │  • /api/config     - System configuration            │  │ │
│   │  │  • /api/ai         - AI recommendations              │  │ │
│   │  └──────────────────────────────────────────────────────┘  │ │
│   │                                                             │ │
│   │  ┌──────────────────────────────────────────────────────┐  │ │
│   │  │           CONTROLLERS (Business Logic)               │  │ │
│   │  │  • sensorController    - Sensor operations           │  │ │
│   │  │  • wateringController  - Watering logic              │  │ │
│   │  │  • configController    - Config management           │  │ │
│   │  │  • aiController        - AI engine                   │  │ │
│   │  └──────────────────────────────────────────────────────┘  │ │
│   │                                                             │ │
│   │  ┌──────────────────────────────────────────────────────┐  │ │
│   │  │            UTILITIES & SERVICES                      │  │ │
│   │  │  • websocketService - Real-time broadcast            │  │ │
│   │  │  • helpers          - Common functions               │  │ │
│   │  └──────────────────────────────────────────────────────┘  │ │
│   │                                                             │ │
│   └─────────────────────────────────────────────────────────────┘ │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐ │
│   │          WebSocket Server (ws://localhost:5000/ws)          │ │
│   │  • Real-time sensor updates                                 │ │
│   │  • Watering event notifications                             │ │
│   │  • Config change broadcasts                                 │ │
│   └─────────────────────────────────────────────────────────────┘ │
│                                                                     │
└──────────┬──────────────────────────────────┬───────────────────────┘
           │                                  │
           │ Mongoose ODM                     │ HTTP/MQTT
           │                                  │
┌──────────▼──────────────────────┐  ┌────────▼──────────────────────┐
│    DATABASE LAYER (MongoDB)     │  │      IOT DEVICE LAYER         │
│                                 │  │                               │
│  ┌───────────────────────────┐  │  │  ┌─────────────────────────┐ │
│  │  Collections:             │  │  │  │     ESP32-CAM           │ │
│  │                           │  │  │  │                         │ │
│  │  • sensor_readings        │  │  │  │  ┌──────────────────┐  │ │
│  │    - soilMoisture         │  │  │  │  │  • Sensors       │  │ │
│  │    - temperature          │  │  │  │  │  • Water Pump    │  │ │
│  │    - humidity             │  │  │  │  │  • Flow Sensor   │  │ │
│  │    - light                │  │  │  │  └──────────────────┘  │ │
│  │    - pH                   │  │  │  │                         │ │
│  │    - timestamp            │  │  │  │  WiFi: 192.168.1.100   │ │
│  │                           │  │  │  └─────────────────────────┘ │
│  │  • watering_logs          │  │  │                               │
│  │    - startTime            │  │  └───────────────────────────────┘
│  │    - endTime              │  │
│  │    - volumeML             │  │
│  │    - triggerType          │  │
│  │                           │  │
│  │  • system_configs         │  │
│  │    - moistureThreshold    │  │
│  │    - autoMode             │  │
│  │    - schedule             │  │
│  │                           │  │
│  │  • device_statuses        │  │
│  │    - online               │  │
│  │    - pumpActive           │  │
│  │    - currentState         │  │
│  │                           │  │
│  └───────────────────────────┘  │
│                                 │
│  Port: 27017                    │
│  Database: smart-watering       │
└─────────────────────────────────┘
```

## Request Flow

### 1. Sensor Data Submission (ESP32 → Backend → DB)

```
ESP32 Device
    │
    │ POST /api/sensors
    │ { soilMoisture: 45, temperature: 25, ... }
    ▼
┌─────────────────────────────────────┐
│  Express Middleware Chain           │
│  1. Helmet (security)               │
│  2. CORS check                      │
│  3. Rate limiter (5 req/5sec)       │
│  4. express-validator               │
│     - Check ranges                  │
│     - Validate types                │
│     - Sanitize input                │
└──────────────┬──────────────────────┘
               │ (if valid)
               ▼
┌─────────────────────────────────────┐
│  sensorController.createSensorReading│
│  1. Parse request body              │
│  2. Create document                 │
│  3. Save to MongoDB                 │
│  4. Update device status            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  MongoDB (Mongoose)                 │
│  sensor_readings.insertOne({...})   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  WebSocket Broadcast                │
│  wsService.broadcastSensorUpdate()  │
│  → All connected clients notified   │
└─────────────────────────────────────┘
```

### 2. Frontend API Call (User → Backend → DB)

```
User clicks "Water Now" button
    │
    ▼
Frontend (axios.post('/api/water/start'))
    │
    ▼
┌─────────────────────────────────────┐
│  Express Middleware                 │
│  1. Rate limiter (10 req/min)       │
│  2. Validator (check deviceId)      │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  wateringController.startWatering   │
│  1. Get current sensor reading      │
│  2. Create watering log             │
│  3. Send HTTP to ESP32              │
│  4. Update device status            │
└──────────────┬──────────────────────┘
               │
               ├──────────────┐
               │              │
               ▼              ▼
    ┌──────────────┐  ┌─────────────┐
    │   MongoDB    │  │   ESP32     │
    │  Save log    │  │ Activate pump│
    └──────────────┘  └─────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  WebSocket Broadcast                │
│  → "watering_started" event         │
│  → Dashboard updates instantly      │
└─────────────────────────────────────┘
```

### 3. AI Recommendation Flow

```
Frontend requests AI recommendation
    │
    ▼
GET /api/ai/recommend
    │
    ▼
┌─────────────────────────────────────┐
│  Rate Limiter (30 req/min)          │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  aiController.getAIRecommendation   │
│                                     │
│  1. Query MongoDB                   │
│     - Latest sensor reading         │
│     - Today's watering count        │
│     - System configuration          │
│                                     │
│  2. Run AI algorithm                │
│     - Analyze soil moisture         │
│     - Consider temperature/humidity │
│     - Check watering limits         │
│     - Calculate confidence score    │
│                                     │
│  3. Generate recommendation         │
│     - Action: water_now/monitor/wait│
│     - Priority: high/medium/low     │
│     - Reasons & suggestions         │
└──────────────┬──────────────────────┘
               │
               ▼
Response: { action, priority, confidence, message }
```

## Technology Choices

### Backend (Express.js)

**Why Express?**
- ✅ Minimal and flexible
- ✅ Large ecosystem of middleware
- ✅ Easy integration with MongoDB
- ✅ Excellent WebSocket support
- ✅ Perfect for REST APIs

### Database (MongoDB)

**Why MongoDB?**
- ✅ Schema flexibility (sensor data varies)
- ✅ Time-series data support
- ✅ Easy aggregation pipelines
- ✅ Horizontal scalability
- ✅ JSON-like documents (JavaScript native)

### Validation (express-validator)

**Why express-validator?**
- ✅ Express integration
- ✅ Sanitization built-in
- ✅ Async validation support
- ✅ Custom validators
- ✅ Clear error messages

### Rate Limiting (express-rate-limit)

**Why rate limiting?**
- ✅ Prevent API abuse
- ✅ Protect from DoS attacks
- ✅ ESP32 malfunction protection
- ✅ Resource management
- ✅ Per-endpoint granularity

### WebSocket (ws library)

**Why WebSocket?**
- ✅ Real-time bidirectional communication
- ✅ No polling overhead
- ✅ Instant updates to dashboard
- ✅ Efficient for IoT
- ✅ Auto-reconnect support

## Scalability Considerations

### Current Capacity
- **Devices**: 1-10 ESP32 devices
- **Users**: 100+ concurrent dashboard users
- **Requests**: 100 req/15min per IP
- **Data**: Millions of sensor readings
- **WebSocket**: 100+ concurrent connections

### Scaling Strategies

**Horizontal Scaling:**
```
                Load Balancer
                     |
        ┌────────────┼────────────┐
        │            │            │
    Backend 1    Backend 2    Backend 3
        │            │            │
        └────────────┼────────────┘
                     |
              MongoDB Cluster
              (Replica Set)
```

**Vertical Scaling:**
- Increase MongoDB indexes
- Implement Redis caching
- Use MongoDB Atlas (managed)
- CDN for frontend assets
- Compress responses (gzip)

## Security Layers

```
Request → Rate Limiter → Helmet → CORS → Validator → Controller → DB
  │          │             │       │        │           │         │
  │          └─ Limit      │       │        │           │         │
  │            requests    │       │        │           │         │
  │                        └─ Security     │           │         │
  │                          headers       │           │         │
  │                                        └─ Origin   │         │
  │                                          check     │         │
  │                                                    └─ Input  │
  │                                                      validation
  │                                                               │
  └───────────────────────────────────────────────────────────────┘
              All layers protect the database
```

## Performance Optimizations

1. **MongoDB Indexes**: `timestamp`, `deviceId` fields indexed
2. **Aggregation Pipelines**: Efficient data processing
3. **WebSocket**: No polling, instant updates
4. **Rate Limiting**: Prevent resource exhaustion
5. **Input Validation**: Early rejection of bad requests
6. **Mongoose Lean**: Faster queries when needed
7. **Connection Pooling**: Reuse DB connections

## Monitoring Points

```
┌──────────────────────────────────────┐
│  Application Metrics                 │
├──────────────────────────────────────┤
│  • API response times                │
│  • Request count per endpoint        │
│  • Rate limit hits                   │
│  • WebSocket connection count        │
│  • Active watering cycles            │
│  • Database query performance        │
│  • Error rates by type               │
│  • ESP32 online/offline status       │
└──────────────────────────────────────┘
```

## Development vs Production

| Aspect | Development | Production |
|--------|-------------|------------|
| **Logging** | Verbose (dev mode) | Minimal (combined) |
| **CORS** | localhost allowed | Specific origin |
| **Rate Limits** | Lower for testing | Standard limits |
| **Error Details** | Full stack traces | Sanitized messages |
| **Database** | Local MongoDB | MongoDB Atlas |
| **HTTPS** | HTTP (local) | HTTPS required |
| **WebSocket** | ws:// | wss:// (secure) |
| **Secrets** | .env file | Environment vars |
