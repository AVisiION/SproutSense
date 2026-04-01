import mongoose from 'mongoose';

const DEFAULT_DATA_RETENTION = {
  sensorReadingsDays: 90,
  wateringLogsDays: 365,
  diseaseDetectionDays: 180,
};

const DEFAULT_DATA_CLEANUP = {
  autoCleanupEnabled: true,
  lastCleanupDate: null,
  cleanupSchedule: 'weekly',
};

const systemConfigSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true,
    default: 'ESP32-SENSOR'
  },
  
  // ===== SENSOR THRESHOLDS & ALERT CONDITIONS =====
  sensorThresholds: {
    soilMoisture: {
      triggerThreshold: { type: Number, default: 30, min: 0, max: 100 },
      targetLevel: { type: Number, default: 70, min: 0, max: 100 },
      criticallyDry: { type: Number, default: 10, min: 0, max: 100 },
      saturated: { type: Number, default: 90, min: 0, max: 100 }
    },
    temperature: {
      comfortMin: { type: Number, default: 18 },
      comfortMax: { type: Number, default: 28 },
      heatStressAlert: { type: Number, default: 35 },
      freezingRisk: { type: Number, default: 5 },
      extremeHeat: { type: Number, default: 45 }
    },
    humidity: {
      comfortMin: { type: Number, default: 40 },
      comfortMax: { type: Number, default: 75 },
      mistingSuggestion: { type: Number, default: 40 },
      tooDry: { type: Number, default: 20 },
      moldRisk: { type: Number, default: 90 }
    },
    pH: {
      optimalMin: { type: Number, default: 5.5 },
      optimalMax: { type: Number, default: 7.0 },
      acidic: { type: Number, default: 5.5 },
      alkaline: { type: Number, default: 7.5 }
    },
    light: {
      lowLightAlert: { type: Number, default: 1000 },
      insufficient: { type: Number, default: 500 },
      intenseScorching: { type: Number, default: 50000 }
    },
    flowRate: {
      normalOperation: { type: Number, default: 1 },
      zeroFlowAlert: { type: Boolean, default: true }
    }
  },

  // ===== CORE CONFIGURATION =====
  moistureThreshold: {
    type: Number,
    default: 30,
    min: 0,
    max: 100
  },
  autoMode: {
    type: Boolean,
    default: false
  },
  espIp: {
    type: String,
    default: ''
  },
  
  // ===== WATERING SYSTEM SETTINGS =====
  wateringSystem: {
    triggerMoisture: { type: Number, default: 30 },
    targetMoisture: { type: Number, default: 70 },
    cooldownMinutes: { type: Number, default: 5 },
    maxCyclesPerHour: { type: Number, default: 4 },
    maxCyclesPerDay: { type: Number, default: 6 },
    flowCheckInterval: { type: Number, default: 5000 },
    pumpFailureThreshold: { type: Number, default: 3 }
  },
  
  wateringDurationMs: {
    type: Number,
    default: 5000 // 5 seconds default
  },
  maxWateringCyclesPerDay: {
    type: Number,
    default: 3
  },
  sensorReadInterval: {
    type: Number,
    default: 10000 // 10 seconds per specification
  },
  statusHeartbeat: {
    type: Number,
    default: 30000 // 30 seconds per specification
  },
  pumpFlowRate: {
    type: Number,
    default: 20 // mL per second
  },
  
  // ===== WEATHER INTEGRATION =====
  weather: {
    enabled: { type: Boolean, default: true },
    updateInterval: { type: Number, default: 600000 }, // 10 minutes
    location: { type: String, default: 'auto' },
    latitude: { type: Number },
    longitude: { type: Number },
    provider: { type: String, default: 'openweathermap' },
    lastUpdate: { type: Date }
  },
  
  // ===== AI & TIPS CONFIGURATION =====
  aiConfig: {
    enabled: { type: Boolean, default: true },
    tipsMode: { type: String, enum: ['auto', 'manual'], default: 'auto' },
    updateInterval: { type: Number, default: 300000 }, // 5 minutes
    provider: { type: String, default: 'gemini' },
    dailyAnalysisLimit: { type: Number, default: 2, min: 1, max: 100 },
    diseaseDetectionEnabled: { type: Boolean, default: true },
    contextualAdvice: { type: Boolean, default: true },
    lastTipsRefresh: { type: Date }
  },
  
  // ===== DISEASE DETECTION & RECOMMENDATIONS =====
  diseaseDetection: {
    enabled: { type: Boolean, default: true },
    alertThreshold: { type: Number, default: 0.7 },
    criticalThreshold: { type: Number, default: 0.85 },
    aiRecommendationsEnabled: { type: Boolean, default: true },
    lastAnalysis: { type: Date }
  },
  
  // ===== DATA MANAGEMENT & HISTORY =====
  dataRetention: {
    sensorReadingsDays: { type: Number, default: 90 },
    wateringLogsDays: { type: Number, default: 365 },
    diseaseDetectionDays: { type: Number, default: 180 }
  },
  
  dataCleanup: {
    autoCleanupEnabled: { type: Boolean, default: true },
    lastCleanupDate: { type: Date },
    cleanupSchedule: { type: String, default: 'weekly' } // weekly, monthly
  },
  
  notifications: {
    email: {
      enabled: { type: Boolean, default: false },
      address: String
    },
    push: {
      enabled: { type: Boolean, default: false }
    },
    criticalAlertsOnly: { type: Boolean, default: false }
  },
  
  calibration: {
    moistureDry: { type: Number, default: 2800 },
    moistureWet: { type: Number, default: 1200 },
    phOffset: { type: Number, default: 0 }
  },
  
  schedule: {
    enabled: { type: Boolean, default: false },
    times: [String] // e.g., ['08:00', '18:00']
  },
  
  plantGrowth: {
    enabled: {
      type: Boolean,
      default: true
    },
    stage: {
      type: String,
      enum: ['seedling', 'vegetative', 'flowering', 'fruiting'],
      default: 'vegetative'
    }
  },
  
  // Renamed from aiInsightsMode to aiTipsMode
  aiTipsMode: {
    type: String,
    enum: ['live_feed', 'snapshots'],
    default: 'snapshots'
  }
}, {
  timestamps: true
});

const ensureDataManagementDefaults = (config) => {
  let hasChanges = false;

  if (!config.dataRetention) {
    config.dataRetention = { ...DEFAULT_DATA_RETENTION };
    hasChanges = true;
  } else {
    for (const [key, value] of Object.entries(DEFAULT_DATA_RETENTION)) {
      if (config.dataRetention[key] === undefined) {
        config.dataRetention[key] = value;
        hasChanges = true;
      }
    }
  }

  if (!config.dataCleanup) {
    config.dataCleanup = { ...DEFAULT_DATA_CLEANUP };
    hasChanges = true;
  } else {
    if (config.dataCleanup.autoCleanupEnabled === undefined) {
      config.dataCleanup.autoCleanupEnabled = DEFAULT_DATA_CLEANUP.autoCleanupEnabled;
      hasChanges = true;
    }
    if (config.dataCleanup.cleanupSchedule === undefined) {
      config.dataCleanup.cleanupSchedule = DEFAULT_DATA_CLEANUP.cleanupSchedule;
      hasChanges = true;
    }
    if (config.dataCleanup.lastCleanupDate === undefined) {
      config.dataCleanup.lastCleanupDate = DEFAULT_DATA_CLEANUP.lastCleanupDate;
      hasChanges = true;
    }
  }

  return hasChanges;
};

// Static method to get or create default config
systemConfigSchema.statics.getConfig = async function(deviceId = 'ESP32-SENSOR') {
  let config = await this.findOne({ deviceId });
  
  if (!config) {
    config = await this.create({ deviceId });
  }

  if (ensureDataManagementDefaults(config)) {
    await config.save();
  }
  
  return config;
};

// Static method to clear sensor data history
systemConfigSchema.statics.clearSensorHistory = async function(deviceId = 'ESP32-SENSOR', days = 90) {
  const config = await this.getConfig(deviceId);
  
  // Update retention days
  config.dataRetention.sensorReadingsDays = days;
  config.dataCleanup.lastCleanupDate = new Date();
  
  await config.save();
  return config;
};

// Static method to clear watering history
systemConfigSchema.statics.clearWateringHistory = async function(deviceId = 'ESP32-SENSOR', days = 365) {
  const config = await this.getConfig(deviceId);
  
  config.dataRetention.wateringLogsDays = days;
  config.dataCleanup.lastCleanupDate = new Date();
  
  await config.save();
  return config;
};

// Static method to clear disease history
systemConfigSchema.statics.clearDiseaseHistory = async function(deviceId = 'ESP32-SENSOR', days = 180) {
  const config = await this.getConfig(deviceId);

  config.dataRetention.diseaseDetectionDays = days;
  config.dataCleanup.lastCleanupDate = new Date();

  await config.save();
  return config;
};

// Static method to clear all history
systemConfigSchema.statics.clearAllHistory = async function(deviceId = 'ESP32-SENSOR') {
  const config = await this.getConfig(deviceId);
  
  config.dataCleanup.lastCleanupDate = new Date();
  await config.save();

  return config;
};

// Static method to refresh AI tips/recommendations
systemConfigSchema.statics.refreshAITips = async function(deviceId = 'ESP32-SENSOR') {
  const config = await this.findOne({ deviceId });
  if (!config) throw new Error('Config not found');
  
  config.aiConfig.lastTipsRefresh = new Date();
  await config.save();
  
  return config;
};

// Static method to update weather settings
systemConfigSchema.statics.updateWeatherSettings = async function(deviceId = 'ESP32-SENSOR', weatherData) {
  const config = await this.findOne({ deviceId });
  if (!config) throw new Error('Config not found');
  
  if (weatherData.enabled !== undefined) config.weather.enabled = weatherData.enabled;
  if (weatherData.location) config.weather.location = weatherData.location;
  if (weatherData.latitude !== undefined) config.weather.latitude = weatherData.latitude;
  if (weatherData.longitude !== undefined) config.weather.longitude = weatherData.longitude;
  if (weatherData.provider) config.weather.provider = weatherData.provider;
  
  config.weather.lastUpdate = new Date();
  await config.save();
  
  return config;
};

// Static method to enable/disable disease detection
systemConfigSchema.statics.setDiseaseDetection = async function(deviceId = 'ESP32-SENSOR', enabled) {
  const config = await this.findOne({ deviceId });
  if (!config) throw new Error('Config not found');
  
  config.diseaseDetection.enabled = enabled;
  config.diseaseDetection.lastAnalysis = new Date();
  
  await config.save();
  return config;
};

// Instance method to validate thresholds
systemConfigSchema.methods.validateThresholds = function() {
  const errors = [];
  
  const thresholds = this.sensorThresholds;
  
  // Soil moisture validation
  if (thresholds.soilMoisture.triggerThreshold > thresholds.soilMoisture.targetLevel) {
    errors.push('Soil moisture trigger threshold must be less than target level');
  }
  
  // Temperature validation
  if (thresholds.temperature.comfortMin > thresholds.temperature.comfortMax) {
    errors.push('Temperature comfort range invalid');
  }
  
  // Humidity validation
  if (thresholds.humidity.comfortMin > thresholds.humidity.comfortMax) {
    errors.push('Humidity comfort range invalid');
  }
  
  // pH validation
  if (thresholds.pH.optimalMin > thresholds.pH.optimalMax) {
    errors.push('pH optimal range invalid');
  }
  
  return { valid: errors.length === 0, errors };
};

// Instance method to get summary
systemConfigSchema.methods.getSummary = function() {
  return {
    deviceId: this.deviceId,
    autoMode: this.autoMode,
    moistureThreshold: this.moistureThreshold,
    maxWateringCycles: this.maxWateringCyclesPerDay,
    sensorReadInterval: this.sensorReadInterval,
    weatherEnabled: this.weather.enabled,
    aiTipsEnabled: this.aiConfig.enabled,
    aiDailyAnalysisLimit: this.aiConfig.dailyAnalysisLimit,
    diseaseDetectionEnabled: this.diseaseDetection.enabled,
    lastTipsRefresh: this.aiConfig.lastTipsRefresh,
    plantGrowthStage: this.plantGrowth.stage,
    dataRetention: this.dataRetention,
    updatedAt: this.updatedAt
  };
};

const SystemConfig = mongoose.model('SystemConfig', systemConfigSchema);

export default SystemConfig;

