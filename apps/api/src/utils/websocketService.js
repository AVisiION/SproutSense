import { WS_EVENT } from '../config/constants.js';

class WebSocketService {
  constructor() {
    this.wss = null;
  }

  // Initialize WebSocket server
  init(wss) {
    this.wss = wss;
    console.log('✅ WebSocket service initialized');
  }

  // Broadcast message to all connected clients
  broadcast(type, data) {
    if (!this.wss) {
      console.warn('WebSocket server not initialized');
      return;
    }

    const message = JSON.stringify({ type, data, timestamp: Date.now() });

    this.wss.clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        try {
          client.send(message);
        } catch (error) {
          console.error('Error broadcasting to client:', error);
        }
      }
    });
  }

  // Send sensor update
  broadcastSensorUpdate(sensorData) {
    this.broadcast(WS_EVENT.SENSOR_UPDATE, sensorData);
  }

  // Send watering started event
  broadcastWateringStarted(wateringLog) {
    this.broadcast(WS_EVENT.WATERING_STARTED, wateringLog);
  }

  // Send watering stopped event
  broadcastWateringStopped(wateringLog) {
    this.broadcast(WS_EVENT.WATERING_STOPPED, wateringLog);
  }

  // Send config updated event
  broadcastConfigUpdated(config) {
    this.broadcast(WS_EVENT.CONFIG_UPDATED, config);
  }

  // Send device status changed event
  broadcastDeviceStatusChanged(status) {
    this.broadcast(WS_EVENT.DEVICE_STATUS_CHANGED, status);
  }

  // Send error event
  broadcastError(error) {
    this.broadcast(WS_EVENT.ERROR, {
      message: error.message || 'An error occurred'
    });
  }

  // Get connected clients count
  getClientCount() {
    return this.wss ? this.wss.clients.size : 0;
  }
}

// Export singleton instance
export default new WebSocketService();
