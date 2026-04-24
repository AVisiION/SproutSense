import { ACCOUNT_STATUS, ROLE } from '../../../auth/permissions';

export const SECTIONS = [
  { id: 'overview',  label: 'Overview',      icon: 'fa-chart-line' },
  { id: 'devices',   label: 'Connections',   icon: 'fa-microchip' },
  { id: 'device-keys', label: 'Device Keys', icon: 'fa-key' },
  { id: 'ai-keys',   label: 'AI API Keys',   icon: 'fa-robot' },
  { id: 'users',     label: 'Users',         icon: 'fa-users' },
  { id: 'ui',        label: 'UI',            icon: 'fa-palette' },
  { id: 'sensors',   label: 'Plant Sensors', icon: 'fa-seedling' },
  { id: 'config',    label: 'Config',        icon: 'fa-sliders' },
  { id: 'data',      label: 'Raw Data',      icon: 'fa-database' },
  { id: 'logs',      label: 'Logs',          icon: 'fa-terminal' },
  { id: 'mock',      label: 'Mock Data',     icon: 'fa-vial' },
];

export const PLANT_OPTIONS = [
  { key: 'tomato', label: 'Tomato' },
  { key: 'potato', label: 'Potato' },
  { key: 'pepper_bell', label: 'Pepper (Bell)' },
  { key: 'maize', label: 'Maize (Corn)' },
  { key: 'grape', label: 'Grape' },
  { key: 'apple', label: 'Apple' },
  { key: 'peach', label: 'Peach' },
  { key: 'strawberry', label: 'Strawberry' },
];

export const DEVICE_KEY_PRESETS = [
  { deviceId: 'ESP32-SENSOR', displayName: 'Environmental Sensor Node' },
  { deviceId: 'ESP32-CAM', displayName: 'Disease Detection Camera' },
];

export const LOG_TYPES = { info: 'info', success: 'success', warning: 'warning', error: 'error' };

export const DEFAULT_SENSOR_FORM = {
  name: '',
  key: '',
  unit: '',
  dataType: 'number',
  category: 'custom',
  minThreshold: 0,
  maxThreshold: 100,
  warningThreshold: 70,
  criticalThreshold: 85,
  chartType: 'line',
  enabled: true,
  showInDashboard: true,
  showInAnalytics: true,
};

export const DEFAULT_USER_FORM = {
  fullName: '',
  email: '',
  password: '',
  roleKey: ROLE.USER,
  accountStatus: ACCOUNT_STATUS.ACTIVE,
  emailVerified: true,
  sensorDataVisible: true,
};

export const DEFAULT_UI_PREFERENCES = {
  dashboardSections: {
    sensors: true,
    analytics: true,
    alerts: true,
    controls: true,
    ai: true,
    insights: true,
  },
  sidebarVisibility: {
    home: true,
    sensors: true,
    analytics: true,
    alerts: true,
    controls: true,
    ai: true,
    insights: true,
    backend: true,
    esp32: true,
    settings: true,
  },
  sidebarLabels: {
    home: 'Home',
    sensors: 'Sensors',
    analytics: 'Analytics',
    alerts: 'Alerts',
    controls: 'Controls',
    ai: 'AI Intelligence',
    insights: 'Insights',
    backend: 'Backend Config',
    esp32: 'IoT Devices',
    settings: 'Settings',
  },
  sidebarIcons: {
    home: 'fa-house',
    sensors: 'fa-microchip',
    analytics: 'fa-chart-pie',
    alerts: 'fa-bell',
    controls: 'fa-sliders',
    ai: 'fa-brain',
    insights: 'fa-lightbulb',
    backend: 'fa-server',
    esp32: 'fa-rss',
    settings: 'fa-gear',
  },
  dashboardSections: {
    sensors: true,
    analytics: true,
    alerts: true,
    controls: true,
    ai: true,
    insights: true,
  },
  dashboardLabels: {
    sensors: 'Real-time Sensors',
    analytics: 'Data Analytics',
    alerts: 'System Alerts',
    controls: 'Device Controls',
    ai: 'AI Insights',
    insights: 'Expert Tips',
  },
  dashboardIcons: {
    sensors: 'fa-temperature-half',
    analytics: 'fa-chart-line',
    alerts: 'fa-triangle-exclamation',
    controls: 'fa-toggle-on',
    ai: 'fa-robot',
    insights: 'fa-seedling',
  },
  widgets: {
    showAlertBadge: true,
    showStatusDots: true,
    showSystemStatusPanel: true,
  },
  appearance: {
    theme: 'liquid-glass', // dark, light, liquid-glass
    animationsEnabled: true,
    glassIntensity: 'medium', // low, medium, high
    compactMode: false,
  },
  notifications: {
    soundEnabled: true,
    browserNotifications: false,
    toastPosition: 'top-right',
  },
  dataDisplay: {
    autoRefresh: true,
    refreshInterval: 30, // seconds
    defaultTimeRange: '7d', // 24h, 7d, 30d
  },
  accessibility: {
    highContrast: false,
    largeText: false,
  }
};

export const buildSensorThresholdPreset = (sensor) => ({
  minThreshold: Number(sensor?.minThreshold ?? 0),
  maxThreshold: Number(sensor?.maxThreshold ?? 100),
  warningThreshold: Number(sensor?.warningThreshold ?? 70),
  criticalThreshold: Number(sensor?.criticalThreshold ?? 85),
});

export const buildDefaultPlantSensorConfig = (registry) => {
  const bySensor = (Array.isArray(registry) ? registry : []).reduce((acc, sensor) => {
    if (sensor?.key) {
      acc[sensor.key] = buildSensorThresholdPreset(sensor);
    }
    return acc;
  }, {});

  return {
    tomato: bySensor,
  };
};

export const buildDefaultPlantWateringConfig = (cfgRaw) => {
  const cfg = cfgRaw?.config || cfgRaw || {};
  return {
    tomato: {
      moistureThreshold: Number(cfg?.moistureThreshold ?? 30),
      maxWateringCyclesPerDay: Number(cfg?.maxWateringCyclesPerDay ?? 3),
      maxCyclesPerHour: Number(cfg?.wateringSystem?.maxCyclesPerHour ?? 4),
      maxCyclesPerDay: Number(cfg?.wateringSystem?.maxCyclesPerDay ?? 6),
    },
  };
};

