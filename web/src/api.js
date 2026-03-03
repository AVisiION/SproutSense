import axios from 'axios';

export class ESP32API {
  constructor(baseURL) {
    this.client = axios.create({
      baseURL: baseURL || '/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Setup WebSocket connection for real-time updates
    this.setupWebSocket();
  }

  setupWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
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

  // Get sensor data
  async getSensors() {
    try {
      const response = await this.client.get('/sensors');
      return response.data;
    } catch (error) {
      console.error('Error fetching sensors:', error);
      throw error;
    }
  }

  // Get system status
  async getStatus() {
    try {
      const response = await this.client.get('/status');
      return response.data;
    } catch (error) {
      console.error('Error fetching status:', error);
      throw error;
    }
  }

  // Get configuration
  async getConfig() {
    try {
      const response = await this.client.get('/config');
      return response.data;
    } catch (error) {
      console.error('Error fetching config:', error);
      throw error;
    }
  }

  // Get AI recommendation
  async getAIRecommendation() {
    try {
      const response = await this.client.get('/ai/recommend');
      return response.data;
    } catch (error) {
      console.error('Error fetching AI recommendation:', error);
      throw error;
    }
  }

  // Start watering
  async startWatering() {
    try {
      const response = await this.client.post('/water/start');
      return response.data;
    } catch (error) {
      console.error('Error starting watering:', error);
      throw error;
    }
  }

  // Stop watering
  async stopWatering() {
    try {
      const response = await this.client.post('/water/stop');
      return response.data;
    } catch (error) {
      console.error('Error stopping watering:', error);
      throw error;
    }
  }

  // Save configuration
  async saveConfig(config) {
    try {
      const response = await this.client.post('/config', config);
      return response.data;
    } catch (error) {
      console.error('Error saving config:', error);
      throw error;
    }
  }
}
