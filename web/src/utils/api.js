import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Sensor API
export const sensorAPI = {
  getLatest: async () => {
    const response = await api.get('/sensors');
    return response.data;
  },
  
  getHistory: async (startDate, endDate) => {
    // Support both date strings and hours parameter
    let params = {};
    if (typeof startDate === 'string' && typeof endDate === 'string') {
      params = { start: startDate, end: endDate };
    } else {
      params = { hours: startDate || 24 };
    }
    const response = await api.get('/sensors/history', { params });
    return response.data;
  }
};

// Watering API
export const wateringAPI = {
  start: async (deviceId = 'ESP32-001', duration = null) => {
    const payload = { deviceId };
    if (duration) payload.duration = duration;
    const response = await api.post('/water/start', payload);
    return response.data;
  },
  
  stop: async (deviceId = 'ESP32-001') => {
    const response = await api.post('/water/stop', { deviceId });
    return response.data;
  },
  
  getStatus: async (deviceId = 'ESP32-001') => {
    const response = await api.get(`/water/status/${deviceId}`);
    return response.data;
  },
  
  getLogs: async (limit = 10) => {
    const response = await api.get(`/water/logs?limit=${limit}`);
    return response.data;
  }
};

// Config API
export const configAPI = {
  get: async (deviceId = 'ESP32-001') => {
    const response = await api.get('/config', { params: { deviceId } });
    return response.data;
  },
  
  update: async (deviceId = 'ESP32-001', config) => {
    const response = await api.post('/config', config, { params: { deviceId } });
    return response.data;
  }
};

// AI API
export const aiAPI = {
  getRecommendation: async (deviceId = 'ESP32-001') => {
    const response = await api.get('/ai/recommend', {
      params: { deviceId }
    });
    return response.data;
  },

  chat: async ({ message, sensorContext = '', history = [], apiKey = '' }) => {
    const response = await api.post('/ai/chat', { message, sensorContext, history, apiKey });
    return response.data;
  }
};

export default api;
