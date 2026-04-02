import axios from 'axios';
import { 
  isMockEnabled, 
  getMockSensors, 
  getMockAlerts, 
  getMockCropHealth, 
  getMockWeather 
} from '../services/mockDataService';

function normalizeApiBaseUrl(rawValue) {
  const value = String(rawValue || '').trim();
  if (!value) return '/api';
  if (value.startsWith('/')) return value;
  if (/^https?:\/\//i.test(value)) return value;
  if (/^(localhost|127\.0\.0\.1)(:\d+)?(\/.*)?$/i.test(value)) {
    return `http://${value}`;
  }
  return value;
}

const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL || '/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((requestConfig) => {
  const token = localStorage.getItem('ss_access_token');
  if (token) {
    requestConfig.headers.Authorization = `Bearer ${token}`;
  }
  return requestConfig;
});

// ─── MOCK HELPER ─────────────────────────────────────────────────────────────
// Simulates network delay and returns data in the same format Axios does
const mockResponse = (data, delay = 300) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Axios resolves with response.data inside the interceptor phase,
      // but since we are bypassing axios, we return the data directly here 
      // formatted how the rest of the functions expect it before they return `response.data`.
      resolve({ data }); 
    }, delay);
  });
};

// ==========================================
// SENSOR API
// ==========================================
export const sensorAPI = {
  // GET /api/sensors - latest reading (backend uses query.deviceId)
  getLatest: async (deviceId = 'ESP32-SENSOR', options = {}) => {
    if (isMockEnabled()) {
      const mockSensors = getMockSensors();
      const mockPrimary = mockSensors.length > 0 ? mockSensors[0] : null;
      const res = await mockResponse(mockPrimary);
      return res.data;
    }
    const response = await api.get('/sensors', { params: { deviceId }, ...options });
    return response.data;
  },

  // GET /api/sensors/history?deviceId=&start=&end= OR ?hours=
  getHistory: async (startDate, endDate, deviceId = 'ESP32-SENSOR', options = {}) => {
    if (isMockEnabled()) {
      const res = await mockResponse(getMockSensors());
      return res.data;
    }
    let params = { deviceId };
    if (typeof startDate === 'string' && typeof endDate === 'string') {
      params.start = startDate;
      params.end   = endDate;
    } else {
      params.hours = startDate || 24; // fallback to hours window
    }
    const response = await api.get('/sensors/history', { params, ...options });
    return response.data;
  }
};

// ==========================================
// WATERING API
// ==========================================
export const wateringAPI = {
  // POST /api/water/start
  start: async (deviceId = 'ESP32-SENSOR', duration = null, options = {}) => {
    if (isMockEnabled()) {
      const res = await mockResponse({ success: true, message: 'Mock pump started', pumpActive: true });
      return res.data;
    }
    const payload = { deviceId };
    if (duration) payload.duration = duration;
    const response = await api.post('/water/start', payload, options);
    return response.data;
  },

  // POST /api/water/stop
  stop: async (deviceId = 'ESP32-SENSOR', options = {}) => {
    if (isMockEnabled()) {
      const res = await mockResponse({ success: true, message: 'Mock pump stopped', pumpActive: false });
      return res.data;
    }
    const response = await api.post('/water/stop', { deviceId }, options);
    return response.data;
  },

  // GET /api/water/status/:deviceId
  getStatus: async (deviceId = 'ESP32-SENSOR', options = {}) => {
    if (isMockEnabled()) {
      const res = await mockResponse({ pumpActive: false, lastWatered: new Date().toISOString() });
      return res.data;
    }
    const response = await api.get(`/water/status/${deviceId}`, options);
    return response.data;
  },

  // GET /api/water/history
  getLogs: async (limit = 10, deviceId = 'ESP32-SENSOR', options = {}) => {
    if (isMockEnabled()) {
      const res = await mockResponse([]);
      return res.data;
    }
    const response = await api.get('/water/history', {
      params: { limit, deviceId },
      ...options
    });
    return response.data;
  }
};

// ==========================================
// CONFIG API
// ==========================================
export const configAPI = {
  // GET /api/config?deviceId=
  get: async (deviceId = 'ESP32-SENSOR') => {
    if (isMockEnabled()) {
      const res = await mockResponse({
        soilMoistureThreshold: 30,
        plantGrowthEnabled: true,
        plantGrowthStage: 'vegetative',
        aiInsightsMode: 'snapshots',
        pumpDurationSeconds: 10
      });
      return res.data;
    }
    const response = await api.get('/config', { params: { deviceId } });
    return response.data;
  },

  // GET /api/config/status?deviceId=
  getStatus: async (deviceId = 'ESP32-SENSOR') => {
    if (isMockEnabled()) {
      const res = await mockResponse({ deviceId, online: true, lastSeen: new Date().toISOString() });
      return res.data;
    }
    const response = await api.get('/config/status', { params: { deviceId } });
    return response.data;
  },

  // GET /api/config/health  (deviceId is ignored by backend health)
  getHealth: async () => {
    if (isMockEnabled()) {
      const res = await mockResponse({ backend: 'healthy', database: 'connected', version: '1.0.0-mock' });
      return res.data;
    }
    const response = await api.get('/config/health');
    return response.data;
  },

  // POST /api/config (body includes deviceId)
  update: async (deviceId = 'ESP32-SENSOR', config) => {
    if (isMockEnabled()) {
      const res = await mockResponse({ success: true, message: 'Mock config updated', data: config });
      return res.data;
    }
    const response = await api.post('/config', { ...config, deviceId });
    return response.data;
  },

  // Data cleanup helpers
  clearSensorHistory: async (deviceId = 'ESP32-SENSOR', retentionDays = 90) => {
    if (isMockEnabled()) return { success: true, message: 'Mock history cleared' };
    const response = await api.post('/config/clear-sensor-history', {
      retentionDays,
      deviceId
    });
    return response.data?.data || response.data;
  },

  clearWateringHistory: async (deviceId = 'ESP32-SENSOR', retentionDays = 365) => {
    if (isMockEnabled()) return { success: true, message: 'Mock history cleared' };
    const response = await api.post('/config/clear-watering-history', {
      retentionDays,
      deviceId
    });
    return response.data?.data || response.data;
  },

  clearDiseaseHistory: async (deviceId = 'ESP32-SENSOR', retentionDays = 180) => {
    if (isMockEnabled()) return { success: true, message: 'Mock history cleared' };
    const response = await api.post('/config/clear-disease-history', {
      retentionDays,
      deviceId
    });
    return response.data?.data || response.data;
  },

  clearAllHistory: async (deviceId = 'ESP32-SENSOR') => {
    if (isMockEnabled()) return { success: true, message: 'Mock history cleared' };
    const response = await api.post('/config/clear-all-history', { deviceId });
    return response.data?.data || response.data;
  },

  getDataRetentionPolicy: async (deviceId = 'ESP32-SENSOR') => {
    if (isMockEnabled()) {
      const res = await mockResponse({ sensorHistoryDays: 90, wateringHistoryDays: 365, diseaseHistoryDays: 180 });
      return res.data;
    }
    const response = await api.get('/config/data-retention', {
      params: { deviceId }
    });
    return response.data;
  },

  updateDataRetentionPolicy: async (deviceId = 'ESP32-SENSOR', policy) => {
    if (isMockEnabled()) {
      const res = await mockResponse({ success: true, data: policy });
      return res.data;
    }
    const response = await api.put('/config/data-retention', policy, {
      params: { deviceId }
    });
    return response.data;
  },

  getAdminLogs: async (limit = 100) => {
    if (isMockEnabled()) {
      const res = await mockResponse([]);
      return res.data;
    }
    const response = await api.get('/config/admin-logs', {
      params: { limit }
    });
    return response.data;
  },

  createAdminLog: async ({ actor = 'admin', action, level = 'info', section = 'admin-panel', details = null } = {}) => {
    if (isMockEnabled()) {
      const res = await mockResponse({ success: true, log: { actor, action, level, section, details } });
      return res.data;
    }
    const response = await api.post('/config/admin-logs', {
      actor,
      action,
      level,
      section,
      details
    });
    return response.data;
  },

  exportAdminLogs: async ({ format = 'json', limit = 500, q = '', level = 'all' } = {}) => {
    if (isMockEnabled()) {
      const payload = format === 'csv'
        ? 'timestamp,actor,level,section,action,details\n'
        : JSON.stringify({ success: true, logs: [] }, null, 2);
      const type = format === 'csv' ? 'text/csv' : 'application/json';
      return new Blob([payload], { type });
    }

    const response = await api.get('/config/admin-logs/export', {
      params: { format, limit, q, level },
      responseType: 'blob'
    });

    return response.data;
  }
};

// ==========================================
// AI API
// ==========================================
export const authAPI = {
  register: async ({ fullName, email, password, confirmPassword }, options = {}) => {
    const response = await api.post('/auth/register', { fullName, email, password, confirmPassword }, options);
    return response.data;
  },

  login: async ({ email, password }, options = {}) => {
    const response = await api.post('/auth/login', { email, password }, options);
    return response.data;
  },

  refresh: async ({ refreshToken }, options = {}) => {
    const response = await api.post('/auth/refresh', { refreshToken }, options);
    return response.data;
  },

  logout: async ({ refreshToken }, options = {}) => {
    const response = await api.post('/auth/logout', { refreshToken }, options);
    return response.data;
  },

  me: async (options = {}) => {
    const response = await api.get('/auth/me', options);
    return response.data;
  },

  updateProfile: async ({ preferredPlant }, options = {}) => {
    const response = await api.patch('/auth/me', { preferredPlant }, options);
    return response.data;
  },

  verifyEmail: async ({ token }, options = {}) => {
    const response = await api.post('/auth/verify-email', { token }, options);
    return response.data;
  },

  resendVerification: async ({ email }, options = {}) => {
    const response = await api.post('/auth/resend-verification', { email }, options);
    return response.data;
  },

  forgotPassword: async ({ email }, options = {}) => {
    const response = await api.post('/auth/forgot-password', { email }, options);
    return response.data;
  },

  resetPassword: async ({ token, password, confirmPassword }, options = {}) => {
    const response = await api.post('/auth/reset-password', { token, password, confirmPassword }, options);
    return response.data;
  },

  passwordStrength: async ({ password, fullName, email }, options = {}) => {
    const response = await api.post('/auth/password-strength', { password, fullName, email }, options);
    return response.data;
  },
};

export const usersAPI = {
  list: async (limit = 100, options = {}) => {
    const response = await api.get('/users', {
      params: { limit },
      ...options,
    });
    return response.data;
  },

  create: async ({ fullName, email, password, roleKey, accountStatus, emailVerified }, options = {}) => {
    const response = await api.post('/users', {
      fullName,
      email,
      password,
      roleKey,
      accountStatus,
      emailVerified,
    }, options);
    return response.data;
  },

  updateRole: async (userId, roleKey, options = {}) => {
    const response = await api.patch(`/users/${userId}/role`, { roleKey }, options);
    return response.data;
  },

  updateAccountStatus: async (userId, accountStatus, options = {}) => {
    const response = await api.patch(`/users/${userId}/account-status`, { accountStatus }, options);
    return response.data;
  },

  updateSensorVisibility: async (userId, sensorDataVisible, options = {}) => {
    const response = await api.patch(`/users/${userId}/sensor-visibility`, { sensorDataVisible }, options);
    return response.data;
  },

  delete: async (userId, options = {}) => {
    const response = await api.delete(`/users/${userId}`, options);
    return response.data;
  },
};

export const deviceAPI = {
  pairDevice: async ({ deviceId, deviceSecret, displayName, firmwareVersion }, options = {}) => {
    const response = await api.post('/device/pair', { deviceId, deviceSecret, displayName, firmwareVersion }, options);
    return response.data;
  },

  listMine: async (options = {}) => {
    const response = await api.get('/device/mine', options);
    return response.data;
  },

  rotateToken: async (deviceId, options = {}) => {
    const response = await api.post(`/device/${encodeURIComponent(deviceId)}/rotate-token`, {}, options);
    return response.data;
  },

  unpair: async (deviceId, options = {}) => {
    const response = await api.delete(`/device/${encodeURIComponent(deviceId)}`, options);
    return response.data;
  },

  // Device key management (admin)
  createKey: async ({ deviceId, displayName }, options = {}) => {
    const response = await api.post('/device/keys/create', { deviceId, displayName }, options);
    return response.data;
  },

  listKeys: async (options = {}) => {
    const response = await api.get('/device/keys/list', options);
    return response.data;
  },

  deleteKey: async (deviceId, options = {}) => {
    const response = await api.delete(`/device/keys/${encodeURIComponent(deviceId)}`, options);
    return response.data;
  },

  toggleKeyStatus: async (deviceId, options = {}) => {
    const response = await api.patch(`/device/keys/${encodeURIComponent(deviceId)}/toggle`, {}, options);
    return response.data;
  },
};

export const publicAPI = {
  getOverview: async (options = {}) => {
    const response = await api.get('/public/overview', options);
    return response.data;
  },

  getAnalyticsPreview: async (hours = 24, options = {}) => {
    const response = await api.get('/public/analytics-preview', {
      params: { hours },
      ...options,
    });
    return response.data;
  },

  getReportsPreview: async (options = {}) => {
    const response = await api.get('/public/reports-preview', options);
    return response.data;
  },
};

export const aiAPI = {
  // GET /api/ai/recommend?deviceId=
  getRecommendation: async (deviceId = 'ESP32-SENSOR', options = {}) => {
    if (isMockEnabled()) {
      const cropHealth = getMockCropHealth() || {};
      const res = await mockResponse({ 
        recommendation: `Mock AI Insight: Crop overall score is ${cropHealth.overallScore}%. Growth stage: ${cropHealth.growthStage}.` 
      });
      return res.data;
    }
    const response = await api.get('/ai/recommend', {
      params: { deviceId },
      ...options
    });
    return response.data;
  },

  // GET /api/ai/usage?deviceId=
  getUsageStats: async (deviceId = 'ESP32-SENSOR', options = {}) => {
    if (isMockEnabled()) {
      const res = await mockResponse({
        deviceId,
        dateKey: new Date().toISOString().slice(0, 10),
        usedCount: 0,
        dailyLimit: 2,
        remaining: 2,
        exhausted: false,
        resetAt: new Date(new Date().setUTCHours(24, 0, 0, 0)).toISOString()
      });
      return res.data;
    }

    const response = await api.get('/ai/usage', {
      params: { deviceId },
      ...options
    });
    return response.data;
  },

  // POST /api/ai/chat
  chat: async ({ message, sensorContext = '', history = [], apiKey = '' }, options = {}) => {
    if (isMockEnabled()) {
      const res = await mockResponse({ 
        response: `Mock AI response to: "${message}". The system is currently in Mock Data mode, so real AI processing is disabled.` 
      });
      return res.data;
    }
    const response = await api.post('/ai/chat', {
      message,
      sensorContext,
      history,
      apiKey
    }, options);
    return response.data;
  },

  // GET /api/ai/disease/all?deviceId=&page=&limit=&startDate=&endDate=
  getDiseaseDetections: async ({
    deviceId  = 'ESP32-CAM',
    page      = 1,
    limit     = 200,
    startDate,
    endDate,
  } = {}, options = {}) => {
    if (isMockEnabled()) {
      const mockAlerts = getMockAlerts() || [];
      const diseaseAlerts = mockAlerts.filter(a => a.type === 'disease' || a.source === 'ESP32-CAM');
      
      const detections = diseaseAlerts.map(a => ({
        _id: a.id,
        timestamp: a.time || new Date().toISOString(),
        detectedDisease: a.message.replace('Plant disease detected: ', ''),
        confidence: 0.95,
        deviceId: 'ESP32-CAM'
      }));

      const res = await mockResponse({
        detections,
        total: detections.length,
        page,
        totalPages: 1
      });
      return res.data;
    }

    const params = { deviceId, page, limit };
    if (startDate) params.startDate = startDate;
    if (endDate)   params.endDate   = endDate;
    const response = await api.get('/ai/disease/all', { params, ...options });
    return response.data;
  }
};

export default api;