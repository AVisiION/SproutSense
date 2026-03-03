import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import cron from 'node-cron';
import { WebSocketServer } from 'ws';

import app from './app.js';
import config from './config/config.js';
import { WS_EVENT } from './config/constants.js';
import SensorReading from './models/SensorReading.js';
import wsService from './utils/websocketService.js';

const PORT = config.PORT;

// Create HTTP server
const server = http.createServer(app);

// Setup WebSocket server for real-time updates
const wss = new WebSocketServer({ server, path: config.WEBSOCKET.PATH });

wss.on('connection', (ws, req) => {
  console.log('✅ WebSocket client connected');
  console.log(`📊 Total clients: ${wss.clients.size}`);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      // Handle different message types
      if (data.type === WS_EVENT.PING) {
        ws.send(JSON.stringify({ 
          type: WS_EVENT.PONG, 
          timestamp: Date.now() 
        }));
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
      ws.send(JSON.stringify({
        type: WS_EVENT.ERROR,
        message: 'Invalid message format'
      }));
    }
  });

  ws.on('close', () => {
    console.log('❌ WebSocket client disconnected');
    console.log(`📊 Total clients: ${wss.clients.size}`);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  // Send initial connection success message
  ws.send(JSON.stringify({
    type: WS_EVENT.CONNECTED,
    message: 'WebSocket connection established',
    timestamp: Date.now()
  }));
});

// Initialize WebSocket service
wsService.init(wss);

// Make WebSocket server available to routes (backward compatibility)
app.locals.wss = wss;
app.locals.wsService = wsService;

// ── Scheduled 5×/day sensor snapshots ──────────────────────────────────────
// Times: 06:00, 10:00, 14:00, 18:00, 22:00
cron.schedule('0 6,10,14,18,22 * * *', async () => {
  try {
    const latest = await SensorReading.findOne({ deviceId: 'ESP32-001' }).sort({ timestamp: -1 });
    if (latest) {
      const snapshot = new SensorReading({
        deviceId: latest.deviceId,
        soilMoisture: latest.soilMoisture,
        temperature: latest.temperature,
        humidity: latest.humidity,
        light: latest.light,
        ph: latest.ph,
        waterLevel: latest.waterLevel,
        isAutoWatering: latest.isAutoWatering,
        timestamp: new Date()
      });
      await snapshot.save();
      console.log(`[CRON] 📸 Sensor snapshot saved at ${new Date().toISOString()}`);
    } else {
      console.log('[CRON] ⚠️  No sensor data available to snapshot');
    }
  } catch (err) {
    console.error('[CRON] ❌ Snapshot error:', err.message);
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`
┌─────────────────────────────────────────────────────┐
│  🌱 Smart Watering System Backend                  │
│                                                     │
│  🚀 Server:     http://localhost:${PORT.toString().padEnd(8)}          │
│  📡 WebSocket:  ws://localhost:${PORT}/ws              │
│  🗄️  Database:   MongoDB                             │
│  📝 Environment: ${config.NODE_ENV.padEnd(11)}                    │
│  🛡️  Rate Limit: ${config.RATE_LIMIT.MAX_REQUESTS} req/${config.RATE_LIMIT.WINDOW_MS/1000/60}min               │
└─────────────────────────────────────────────────────┘
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});
