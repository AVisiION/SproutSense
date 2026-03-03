# System Architecture

## Complete System Overview

```
┌───────────────────────────────────────────────────────────────────┐
│                        USER INTERFACES                            │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│   ┌──────────────────┐          ┌─────────────────┐             │
│   │  Web Dashboard   │          │  Mobile App     │             │
│   │  (Vite/React)    │          │  (Blynk)        │             │
│   │  Port 3000       │          │                 │             │
│   └────────┬─────────┘          └────────┬────────┘             │
│            │                              │                       │
└────────────┼──────────────────────────────┼───────────────────────┘
             │                              │
             │ HTTP/WebSocket               │ Internet
             ↓                              ↓
┌───────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                            │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│   ┌──────────────────────────────────────────────────┐           │
│   │  Backend API Server (Node.js/Express)           │           │
│   │  Port 5000                                       │           │
│   │                                                  │           │
│   │  ┌────────────┐  ┌────────────┐  ┌───────────┐ │           │
│   │  │  Sensors   │  │  Watering  │  │     AI    │ │           │
│   │  │    API     │  │    API     │  │  Engine   │ │           │
│   │  └────────────┘  └────────────┘  └───────────┘ │           │
│   │                                                  │           │
│   │  ┌────────────────────────────────────────────┐ │           │
│   │  │  WebSocket Server (Real-time Updates)     │ │           │
│   │  └────────────────────────────────────────────┘ │           │
│   └──────────────┬──────────────────────┬───────────┘           │
│                  │                      │                         │
└──────────────────┼──────────────────────┼─────────────────────────┘
                   │                      │
                   │ Mongoose             │ HTTP/MQTT
                   ↓                      ↓
┌───────────────────────────────────────────────────────────────────┐
│                      DATA & DEVICE LAYER                          │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│   ┌────────────────────┐          ┌────────────────────────┐     │
│   │   MongoDB          │          │   ESP32-CAM Device     │     │
│   │                    │          │                        │     │
│   │  ┌──────────────┐  │          │  ┌──────────────────┐ │     │
│   │  │SensorReading │  │          │  │  Sensors Module  │ │     │
│   │  ├──────────────┤  │          │  │  - Soil Moisture │ │     │
│   │  │WateringLog   │  │◄─────────┼──┤  - Temperature   │ │     │
│   │  ├──────────────┤  │          │  │  - Humidity      │ │     │
│   │  │SystemConfig  │  │          │  │  - Light         │ │     │
│   │  ├──────────────┤  │          │  │  - pH            │ │     │
│   │  │DeviceStatus  │  │          │  └──────────────────┘ │     │
│   │  └──────────────┘  │          │                        │     │
│   │                    │          │  ┌──────────────────┐ │     │
│   │  Port 27017        │          │  │ Watering Module  │ │     │
│   └────────────────────┘          │  │  - Water Pump    │ │     │
│                                   │  │  - Flow Sensor   │ │     │
│                                   │  └──────────────────┘ │     │
│                                   │                        │     │
│                                   │  WiFi Connected        │     │
│                                   └────────────────────────┘     │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Sensor Data Collection

```
ESP32 Sensors → ESP32 WiFi → Backend API → MongoDB
                                 ↓
                            WebSocket Broadcast
                                 ↓
                          Web Dashboard
```

### 2. Manual Watering Control

```
User (Web Dashboard) → Backend API → HTTP Request → ESP32
                           ↓
                       MongoDB Log
                           ↓
                    WebSocket Update
                           ↓
                      All Clients
```

### 3. AI Recommendation Flow

```
MongoDB Historical Data → AI Engine (Backend)
                              ↓
                         Analysis Algorithm
                              ↓
                    Calculate Recommendation
                              ↓
                      Return to Frontend
```

## Technology Stack

### Frontend (Web Dashboard)
- **Framework**: Vite + Vanilla JavaScript
- **Styling**: CSS3 with CSS Variables
- **HTTP Client**: Axios
- **Real-time**: Native WebSocket API
- **Port**: 3000 (development)

### Backend (API Server)
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database ODM**: Mongoose
- **WebSocket**: ws library
- **Security**: Helmet.js, CORS
- **Logging**: Morgan
- **Port**: 5000

### Database
- **System**: MongoDB
- **Host**: localhost:27017 (or MongoDB Atlas)
- **Collections**:
  - sensor_readings
  - watering_logs
  - system_configs
  - device_statuses

### IoT Device
- **Hardware**: ESP32-CAM
- **Language**: C++ (Arduino)
- **Connectivity**: WiFi 802.11 b/g/n
- **Sensors**: 5 sensors (moisture, pH, temp, humidity, light)
- **Actuators**: Water pump + flow sensor

## Communication Protocols

### HTTP REST API
- **GET** requests: Read data (sensors, config, status)
- **POST** requests: Create/update data, trigger actions
- **PATCH** requests: Partial updates

### WebSocket
- **Connection**: Persistent connection at `/ws`
- **Events**: 
  - `sensor_update` - New sensor reading
  - `watering_started` - Pump activated
  - `watering_stopped` - Pump deactivated
  - `config_updated` - Settings changed

### MQTT (Optional)
- Can be added for ESP32 communication
- More efficient than HTTP polling
- Better for IoT at scale

## Security Considerations

### Current Implementation
- ✅ CORS enabled (configurable origin)
- ✅ Helmet.js security headers
- ✅ Input validation via Mongoose schemas
- ✅ Error handling middleware

### Production Recommendations
- 🔐 Add JWT authentication
- 🔐 API rate limiting
- 🔐 HTTPS/WSS encryption
- 🔐 Environment variable secrets
- 🔐 MongoDB user authentication
- 🔐 ESP32 API key validation

## Scalability

### Current Capacity
- Single ESP32 device
- Single MongoDB instance
- Suitable for: 1-10 plants

### Scaling Options

**Horizontal Scaling (More Devices):**
- Add `deviceId` parameter to all API calls
- Use MongoDB sharding by deviceId
- Deploy multiple ESP32 devices

**Vertical Scaling (More Data):**
- Implement data aggregation/rollup
- Archive old data to cold storage
- Use MongoDB indexes effectively
- Implement caching layer (Redis)

**Geographic Distribution:**
- Deploy backend to multiple regions
- Use MongoDB Atlas global clusters
- CDN for frontend assets

## Deployment Architecture

### Development
```
Local Machine
├── MongoDB (localhost:27017)
├── Backend (localhost:5000)
├── Frontend (localhost:3000)
└── ESP32 (local network)
```

### Production
```
Cloud Infrastructure
├── MongoDB Atlas (cloud.mongodb.com)
├── Backend API (Heroku/DigitalOcean/AWS)
├── Frontend CDN (Netlify/Vercel/Cloudflare)
└── ESP32 Devices (customer locations via internet)
```

## Monitoring & Observability

### Available Metrics
- Sensor readings (stored in MongoDB)
- Watering cycle count/duration
- Device online/offline status
- API request logs (Morgan)
- Database query performance

### Recommended Additions
- Prometheus metrics export
- Grafana dashboards
- Error tracking (Sentry)
- Uptime monitoring (UptimeRobot)
- Log aggregation (ELK stack)

## Backup & Recovery

### Data Backup
- MongoDB automatic backups (Atlas)
- Or manual: `mongodump --db smart-watering`

### Disaster Recovery
1. MongoDB backup restoration
2. Backend redeployment (stateless)
3. Frontend rebuild from source
4. ESP32 firmware reflash

### Recovery Time Objective (RTO)
- Frontend: < 5 minutes (CDN)
- Backend: < 15 minutes (container restart)
- Database: < 30 minutes (restore from backup)
- ESP32: < 10 minutes (device reboot)
