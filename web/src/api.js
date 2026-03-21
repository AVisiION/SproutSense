import axios from 'axios';

export class ESP32API {
  constructor(baseURL) {
    // Uses the provided baseURL, Vite env variable, or defaults to '/api'
    const apiBase = baseURL || import.meta.env.VITE_API_BASE_URL || '/api';
    
    this.client = axios.create({
      baseURL: apiBase,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Setup WebSocket connection for real-time updates
    this.setupWebSocket();
  }

  setupWebSocket() {
    // Use Vite env variable if available, otherwise fallback to host origin
    let wsUrl = import.meta.env.VITE_WS_URL;
    if (!wsUrl) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${protocol}//${window.location.host}/ws`;
    }
    
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = () => {
      console.log('✅ WebSocket connected');
    };
    
    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleWebSocketMessage(data);
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };
    
    this.ws.onclose = () => {
      console.log('❌ WebSocket disconnected. Reconnecting...');
      setTimeout(() => this.setupWebSocket(), 3000);
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  handleWebSocketMessage(data) {
    // Dispatch custom events for real-time updates
    const event = new CustomEvent('ws-update', { detail: data });
    window.dispatchEvent(event);
  }

  // ==========================================
  // SENSOR ENDPOINTS
  // ==========================================
  
  async getSensors() {
    try {
      const response = await this.client.get('/sensors/latest'); // FIXED
      return response.data;
    } catch (error) {
      console.error('Error fetching sensors:', error);
      throw error;
    }
  }

  async getSensorHistory({ page = 1, limit = 20, deviceId = 'ESP32-SENSOR' } = {}) {
    try {
      const response = await this.client.get(`/sensors/history?page=${page}&limit=${limit}&deviceId=${deviceId}`);
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
      const response = await this.client.get('/config/status'); // FIXED
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

  // FIXED: Replaced /ai/disease/all with the correct /ai/diseasehistory endpoint
  async getDiseaseHistory({ page = 1, limit = 5, deviceId = 'ESP32-CAM' } = {}) {
    try {
      const response = await this.client.get(`/ai/diseasehistory?page=${page}&limit=${limit}&deviceId=${deviceId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching disease history:', error);
      throw error;
    }
  }
}

// Export a default instance to be used across the React app
const api = new ESP32API();
export default api;
