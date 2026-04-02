import './style.css'
import { ESP32API } from './api.js'

const api = new ESP32API('/api'); // Connect to backend via proxy

// UI Elements
const statusEl = document.getElementById('status');
const soilMoistureEl = document.getElementById('soil-moisture');
const temperatureEl = document.getElementById('temperature');
const humidityEl = document.getElementById('humidity');
const lightEl = document.getElementById('light');
const pumpStatusEl = document.getElementById('pump-status');
const aiRecommendationEl = document.getElementById('ai-recommendation');

const waterBtn = document.getElementById('water-btn');
const stopBtn = document.getElementById('stop-btn');
const refreshAIBtn = document.getElementById('refresh-ai');
const saveConfigBtn = document.getElementById('save-config');

// State
let isConnected = false;

// Initialize
async function init() {
  setupEventListeners();
  await fetchData();
  startAutoRefresh();
}

// Setup event listeners
function setupEventListeners() {
  waterBtn.addEventListener('click', async () => {
    try {
      await api.startWatering();
      showNotification('Watering started', 'success');
      await fetchData();
    } catch (error) {
      showNotification('Failed to start watering', 'error');
    }
  });

  stopBtn.addEventListener('click', async () => {
    try {
      await api.stopWatering();
      showNotification('Watering stopped', 'success');
      await fetchData();
    } catch (error) {
      showNotification('Failed to stop watering', 'error');
    }
  });

  refreshAIBtn.addEventListener('click', async () => {
    await fetchAIRecommendation();
  });

  saveConfigBtn.addEventListener('click', async () => {
    const threshold = document.getElementById('threshold').value;
    const autoMode = document.getElementById('auto-mode').checked;
    
    try {
      await api.saveConfig({ threshold, autoMode });
      showNotification('Configuration saved', 'success');
    } catch (error) {
      showNotification('Failed to save configuration', 'error');
    }
  });
}

// Fetch all data
async function fetchData() {
  try {
    const [sensors, status, config] = await Promise.all([
      api.getSensors(),
      api.getStatus(),
      api.getConfig()
    ]);

    updateUI(sensors, status, config);
    updateConnectionStatus(true);
  } catch (error) {
    console.error('Failed to fetch data:', error);
    updateConnectionStatus(false);
  }
}

// Fetch AI recommendation
async function fetchAIRecommendation() {
  try {
    aiRecommendationEl.textContent = 'Loading...';
    const recommendation = await api.getAIRecommendation();
    aiRecommendationEl.textContent = recommendation.message || 'AI analysis complete';
  } catch (error) {
    aiRecommendationEl.textContent = 'Failed to load AI recommendation';
  }
}

// Update UI with data
function updateUI(sensors, status, config) {
  // Update sensor readings
  if (sensors) {
    soilMoistureEl.textContent = `${sensors.soilMoisture || '--'}%`;
    temperatureEl.textContent = `${sensors.temperature || '--'}°C`;
    humidityEl.textContent = `${sensors.humidity || '--'}%`;
    lightEl.textContent = `${sensors.light || '--'} lux`;
  }

  // Update pump status
  if (status) {
    pumpStatusEl.textContent = status.pumpActive ? 'ON' : 'OFF';
    pumpStatusEl.className = status.pumpActive ? 'status-indicator active' : 'status-indicator';
  }

  // Update config
  if (config) {
    document.getElementById('threshold').value = config.threshold || 30;
    document.getElementById('auto-mode').checked = config.autoMode || false;
  }
}

// Update connection status
function updateConnectionStatus(connected) {
  isConnected = connected;
  statusEl.textContent = connected ? '✓ Connected' : '✗ Disconnected';
  statusEl.className = connected ? 'status connected' : 'status disconnected';
}

// Auto refresh every 5 seconds
function startAutoRefresh() {
  setInterval(async () => {
    await fetchData();
    
    // Also refresh AI recommendation every 30 seconds
    if (Math.random() < 0.2) {
      await fetchAIRecommendation();
    }
  }, 5000);
}

// Show notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Listen for WebSocket updates
window.addEventListener('ws-update', (event) => {
  const { type, data } = event.detail;
  
  switch(type) {
    case 'sensor_update':
      // Update sensor display without full refresh
      updateUI({ sensors: data }, null, null);
      break;
    case 'watering_started':
    case 'watering_stopped':
      // Refresh data when watering state changes
      fetchData();
      break;
    case 'config_updated':
      // Update config display
      fetchData();
      break;
  }
});

// Start the app
init();
