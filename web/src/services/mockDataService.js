// ─── SPROUTSENSE MOCK DATA SERVICE ───────────────────────────────────────────
// Central in-memory store. No localStorage. Default: OFF.

const listeners = [];

export function subscribeToMockUpdates(callback) {
  listeners.push(callback);
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx > -1) listeners.splice(idx, 1);
  };
}

function notifyUpdate() {
  listeners.forEach(cb => cb());
}

export const mockDataStore = {
  enabled: false,
  scenario: 'normal',

  sensors: [
    { id: 'S001', name: 'Field A - Zone 1', moisture: 62, temperature: 28.4, humidity: 71, status: 'active', lastUpdate: '2 min ago' },
    { id: 'S002', name: 'Field A - Zone 2', moisture: 45, temperature: 31.2, humidity: 65, status: 'active', lastUpdate: '1 min ago' },
    { id: 'S003', name: 'Field B - Zone 1', moisture: 78, temperature: 26.8, humidity: 80, status: 'active', lastUpdate: '3 min ago' },
    { id: 'S004', name: 'Field B - Zone 2', moisture: 33, temperature: 29.1, humidity: 68, status: 'warning', lastUpdate: '5 min ago' },
  ],

  alerts: [
    { id: 'A001', type: 'moisture', severity: 'high',   message: 'Soil moisture critically low in Field B Zone 2', timestamp: '10:32 AM', enabled: true },
    { id: 'A002', type: 'temperature', severity: 'medium', message: 'High temperature detected in Field A Zone 2', timestamp: '09:15 AM', enabled: true },
    { id: 'A003', type: 'system', severity: 'low',     message: 'Sensor S003 battery at 18%', timestamp: '08:00 AM', enabled: false },
  ],

  cropHealth: {
    overallScore: 74,
    growthStage: 'Vegetative',
    diseaseProbability: 12,
    waterStress: 8,
    nutrientLevel: 81,
    lastAnalysis: '2026-03-29 08:00',
  },

  weather: {
    temperature: 29,
    humidity: 68,
    rainfall: 0,
    windSpeed: 12,
    uvIndex: 7,
    forecast: 'Partly Cloudy',
    nextRainIn: '3 days',
  },

  users: [
    { id: 'U001', name: 'Arjun Verma',   email: 'arjun@sproutsense.io', role: 'admin',   active: true },
    { id: 'U002', name: 'Priya Nayak',   email: 'priya@sproutsense.io', role: 'viewer',  active: true },
    { id: 'U003', name: 'Demo User',     email: 'demo@sproutsense.io',  role: 'viewer',  active: false },
  ],
};

// ─── Scenario Presets ─────────────────────────────────────────────────────────
const SCENARIOS = {
  normal: {
    sensors: mockDataStore.sensors,
    alerts: mockDataStore.alerts,
    cropHealth: mockDataStore.cropHealth,
    weather: mockDataStore.weather,
  },
  empty: {
    sensors: [],
    alerts: [],
    cropHealth: { overallScore: 0, growthStage: '—', diseaseProbability: 0, waterStress: 0, nutrientLevel: 0, lastAnalysis: '—' },
    weather: { temperature: 0, humidity: 0, rainfall: 0, windSpeed: 0, uvIndex: 0, forecast: '—', nextRainIn: '—' },
  },
  error: {
    sensors: null,
    alerts: null,
    cropHealth: null,
    weather: null,
    _forceError: true,
  },
  highLoad: {
    sensors: Array.from({ length: 20 }, (_, i) => ({
      id: `S${String(i + 1).padStart(3, '0')}`,
      name: `Field ${String.fromCharCode(65 + Math.floor(i / 4))} - Zone ${(i % 4) + 1}`,
      moisture: Math.floor(Math.random() * 80 + 20),
      temperature: +(24 + Math.random() * 10).toFixed(1),
      humidity: Math.floor(Math.random() * 40 + 50),
      status: ['active', 'active', 'active', 'warning'][Math.floor(Math.random() * 4)],
      lastUpdate: `${Math.floor(Math.random() * 9) + 1} min ago`,
    })),
    alerts: mockDataStore.alerts,
    cropHealth: mockDataStore.cropHealth,
    weather: mockDataStore.weather,
  },
  demo: {
    sensors: mockDataStore.sensors,
    alerts: mockDataStore.alerts,
    cropHealth: { ...mockDataStore.cropHealth, overallScore: 92 },
    weather: { ...mockDataStore.weather, forecast: 'Sunny', rainfall: 0 },
  },
};

// ─── API ──────────────────────────────────────────────────────────────────────
export function isMockEnabled()       { return mockDataStore.enabled; }

export function setMockEnabled(val) { 
  mockDataStore.enabled = !!val; 
  notifyUpdate(); 
}

export function applyScenario(name) {
  const preset = SCENARIOS[name];
  if (!preset) return;
  Object.assign(mockDataStore, preset);
  mockDataStore.scenario = name;
  notifyUpdate();
}

export function getMockSensors()      { return mockDataStore.sensors ?? []; }
export function getMockAlerts()       { return mockDataStore.alerts ?? []; }
export function getMockCropHealth()   { return mockDataStore.cropHealth; }
export function getMockWeather()      { return mockDataStore.weather; }
export function getMockUsers()        { return mockDataStore.users; }

// ─── Sensor CRUD ──────────────────────────────────────────────────────────────
export function addSensor(sensor) {
  const newSensor = { id: `S${Date.now()}`, status: 'active', lastUpdate: 'just now', ...sensor };
  mockDataStore.sensors = [...(mockDataStore.sensors || []), newSensor];
  notifyUpdate();
  return newSensor;
}
export function updateSensor(id, fields) {
  mockDataStore.sensors = (mockDataStore.sensors || []).map(s => s.id === id ? { ...s, ...fields } : s);
  notifyUpdate();
}
export function deleteSensor(id) {
  mockDataStore.sensors = (mockDataStore.sensors || []).filter(s => s.id !== id);
  notifyUpdate();
}

// ─── Alert CRUD ───────────────────────────────────────────────────────────────
export function addAlert(alert) {
  const newAlert = { id: `A${Date.now()}`, enabled: true, timestamp: new Date().toLocaleTimeString(), ...alert };
  mockDataStore.alerts = [...(mockDataStore.alerts || []), newAlert];
  notifyUpdate();
  return newAlert;
}
export function updateAlert(id, fields) {
  mockDataStore.alerts = (mockDataStore.alerts || []).map(a => a.id === id ? { ...a, ...fields } : a);
  notifyUpdate();
}
export function deleteAlert(id) {
  mockDataStore.alerts = (mockDataStore.alerts || []).filter(a => a.id !== id);
  notifyUpdate();
}

// ─── Crop Health update ───────────────────────────────────────────────────────
export function updateCropHealth(fields) {
  mockDataStore.cropHealth = { ...mockDataStore.cropHealth, ...fields };
  notifyUpdate();
}

// ─── Weather update ───────────────────────────────────────────────────────────
export function updateWeather(fields) {
  mockDataStore.weather = { ...mockDataStore.weather, ...fields };
  notifyUpdate();
}

// ─── User CRUD ────────────────────────────────────────────────────────────────
export function addUser(user) {
  const newUser = { id: `U${Date.now()}`, active: true, ...user };
  mockDataStore.users = [...mockDataStore.users, newUser];
  notifyUpdate();
  return newUser;
}
export function updateUser(id, fields) {
  mockDataStore.users = mockDataStore.users.map(u => u.id === id ? { ...u, ...fields } : u);
  notifyUpdate();
}
export function deleteUser(id) {
  mockDataStore.users = mockDataStore.users.filter(u => u.id !== id);
  notifyUpdate();
}

// ─── Reset ────────────────────────────────────────────────────────────────────
export function resetToDefaults() {
  const preset = SCENARIOS['normal'];
  Object.assign(mockDataStore, preset);
  mockDataStore.scenario = 'normal';
  notifyUpdate();
}

export function exportMockData() {
  return JSON.stringify({
    sensors: mockDataStore.sensors,
    alerts: mockDataStore.alerts,
    cropHealth: mockDataStore.cropHealth,
    weather: mockDataStore.weather,
    users: mockDataStore.users,
  }, null, 2);
}

export function importMockData(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    if (data.sensors)    mockDataStore.sensors    = data.sensors;
    if (data.alerts)     mockDataStore.alerts     = data.alerts;
    if (data.cropHealth) mockDataStore.cropHealth = data.cropHealth;
    if (data.weather)    mockDataStore.weather    = data.weather;
    if (data.users)      mockDataStore.users      = data.users;
    notifyUpdate();
    return { success: true };
  } catch {
    return { success: false, error: 'Invalid JSON format' };
  }
}