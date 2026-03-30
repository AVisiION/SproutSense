import dns from 'dns';
dns.setServers(['1.1.1.1', '8.8.8.8']);

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
import { initTestMode } from './utils/testModeManager.js';

const PORT = config.PORT;

// Create HTTP server
const server = http.createServer(app);

// Setup WebSocket server for real-time updates
const wss = new WebSocketServer({ 
  server, 
  path: config.WEBSOCKET.PATH 
});

wss.on('connection', (ws) => {
  console.log('[OK] WebSocket client connected');
  console.log(`[INFO] Total clients: ${wss.clients.size}`);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

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
    console.log('[INFO] WebSocket client disconnected');
    console.log(`[INFO] Total clients: ${wss.clients.size}`);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

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

// Scheduled 5x/day sensor snapshots
cron.schedule('0 6,10,14,18,22 * * *', async () => {
  try {
    const latest = await SensorReading.findOne({ deviceId: 'ESP32-SENSOR' }).sort({ timestamp: -1 });
    if (latest) {
      const snapshot = new SensorReading({
        deviceId: latest.deviceId,
        soilMoisture: latest.soilMoisture,
        temperature: latest.temperature,
        humidity: latest.humidity,
        light: latest.light,
        pH: latest.pH,
        flowRate: latest.flowRate,
        flowVolume: latest.flowVolume,
        waterLevel: latest.waterLevel,
        isAutoWatering: latest.isAutoWatering,
        timestamp: new Date()
      });
      await snapshot.save();
      console.log(`[CRON] Sensor snapshot saved at ${new Date().toISOString()}`);
    } else {
      console.log('[CRON] No sensor data available to snapshot');
    }
  } catch (err) {
    console.error('[CRON] Snapshot error:', err.message);
  }
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`
[START] Smart Watering System Backend
Server:     http://localhost:${PORT}
WebSocket:  ws://localhost:${PORT}${config.WEBSOCKET.PATH}
Database:   MongoDB
Environment: ${config.NODE_ENV}
Rate Limit: ${config.RATE_LIMIT.MAX_REQUESTS} req/${config.RATE_LIMIT.WINDOW_MS / 1000 / 60}min
  `);

  // Disable test sensor simulation in production
  if (config.IS_DEVELOPMENT) {
    initTestMode(false);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('[ERROR] Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});