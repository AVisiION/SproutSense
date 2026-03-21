import axios from 'axios';

export class ESP32API {
  constructor(baseURL) {
    const apiBase = baseURL || import.meta.env.VITE_API_BASE_URL || '/api';

    this.client = axios.create({
      baseURL: apiBase,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.ws = null;           // ← NEW
    this.pingInterval = null; // ← NEW

    this.setupWebSocket();
  }

  // ==========================================
  // WEBSOCKET — PING/PONG KEEPALIVE
  // ==========================================

  setupWebSocket() {
    let wsUrl = import.meta.env.VITE_WS_URL;
    if (!wsUrl) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${protocol}//${window.location.host}/ws`;
    }

    // ← NEW: Clean up old connection before making a new one
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
    }

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('✅ WebSocket connected to Render');

      if (this.pingInterval) clearInterval(this.pingInterval); // ← NEW

      // ← NEW: Ping every 30s — prevents Render killing idle connection
      this.pingInterval = setInterval(() => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
        }
      }, 30000);
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'pong') return; // ← NEW: Ignore keepalive replies
        this.handleWebSocketMessage(data);
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    this.ws.onclose = () => {
      console.warn('❌ WebSocket disconnected. Reconnecting in 5s...');

      // ← NEW: Clean up ping interval
      if (this.pingInterval) {
        clearInterval(this.pingInterval);
        this.pingInterval = null;
      }

      setTimeout(() => this.setupWebSocket(), 5000); // ← CHANGED: 3s → 5s
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      // onclose fires automatically after onerror
    };
  }

  handleWebSocketMessage(data) {
    const event = new CustomEvent('ws-update', { detail: data });
    window.dispatchEvent(event);
  }

  // ==========================================
  // SENSOR ENDPOINTS
  // ==========================================

  async getSensors() {
    try {
      const response = await this.client.get('/sensors/latest');
      return response.data;
    } catch (error) {
      console.error('Error fetching sensors:', error);
      throw error;
    }
  }

  async getSensorHistory({ page = 1, limit = 20, deviceId = 'ESP32-SENSOR', startDate, endDate } = {}) {
    try {
      const params = new URLSearchParams({ page, limit, deviceId }); // ← IMPROVED
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      const response = await this.client.get(`/sensors/history?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching sensor history:', error);
      throw error;
    }
  }

  // ==========================================
  // CONFIG & STATUS ENDPOINTS
  // ==========================================

  async getStatus() {
    try {
      const response = await this.client.get('/config/status');
      return response.data;
    } catch (error) {
      console.error('Error fetching status:', error);
      throw error;
    }
  }

  async getConfig() {
    try {
      const response = await this.client.get('/config');
      return response.data;
    } catch (error) {
      console.error('Error fetching config:', error);
      throw error;
    }
  }

  async saveConfig(config) {
    try {
      const response = await this.client.post('/config', config);
      return response.data;
    } catch (error) {
      console.error('Error saving config:', error);
      throw error;
    }
  }

  // ==========================================
  // WATERING ENDPOINTS
  // ==========================================

  async startWatering() {
    try {
      const response = await this.client.post('/water/start');
      return response.data;
    } catch (error) {
      console.error('Error starting watering:', error);
      throw error;
    }
  }

  async stopWatering() {
    try {
      const response = await this.client.post('/water/stop');
      return response.data;
    } catch (error) {
      console.error('Error stopping watering:', error);
      throw error;
    }
  }

  async getWateringHistory({ page = 1, limit = 20 } = {}) {
    try {
      const response = await this.client.get(`/water/history?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching watering history:', error);
      throw error;
    }
  }

  // ==========================================
  // AI & DISEASE ENDPOINTS
  // ==========================================

  async getAIRecommendation() {
    try {
      const response = await this.client.get('/ai/recommend');
      return response.data;
    } catch (error) {
      console.error('Error fetching AI recommendation:', error);
      throw error;
    }
  }

  async getDiseaseHistory({ page = 1, limit = 5, deviceId = 'ESP32-CAM', startDate, endDate } = {}) {
    try {
      const params = new URLSearchParams({ page, limit, deviceId }); // ← IMPROVED
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      const response = await this.client.get(`/ai/disease/all?${params.toString()}`); // ← FIXED route
      return response.data;
    } catch (error) {
      console.error('Error fetching disease history:', error);
      throw error;
    }
  }

  // Alias for components that call getAllDiseaseDetections directly
  async getAllDiseaseDetections(options = {}) {
    return this.getDiseaseHistory(options);
  }
}

// Singleton instance used across the entire React app
const api = new ESP32API();
export default api;
