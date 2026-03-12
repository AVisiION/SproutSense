/**
 * Comprehensive Sensor Thresholds & Alert Conditions
 * Configured for optimal plant health and hardware safety
 */

export const SENSOR_THRESHOLDS = {
  // Soil Moisture (0-100%)
  SOIL_MOISTURE: {
    VALID_RANGE: { MIN: 0, MAX: 100 },
    ACTION_THRESHOLD: 30, // Triggers auto-watering when below
    TARGET_LEVEL: 70, // Target moisture after watering
    ALERT_CONDITIONS: {
      CRITICALLY_DRY: 10,      // <10% - Critically dry
      SATURATED: 90            // >90% - Saturated soil
    },
    RECOMMENDATIONS: {
      VERY_LOW: { threshold: 10, action: 'URGENT_WATER', message: 'Soil critically dry!' },
      LOW: { threshold: 30, action: 'WATER_NOW', message: 'Soil moisture low - watering triggered' },
      OPTIMAL: { threshold: 70, action: 'MONITOR', message: 'Soil moisture optimal' },
      HIGH: { threshold: 90, action: 'REDUCE_WATERING', message: 'Soil saturated - risk of root rot' }
    }
  },

  // Temperature (-40 to 85°C)
  TEMPERATURE: {
    VALID_RANGE: { MIN: -40, MAX: 85 },
    COMFORT_RANGE: { MIN: 18, MAX: 28 }, // Optimal plant growth
    ACTION_THRESHOLD: 35, // Heat stress alert above
    ALERT_CONDITIONS: {
      FREEZING_RISK: 5,        // <5°C - Freezing risk
      EXTREME_HEAT: 45         // >45°C - Extreme heat damage
    },
    RECOMMENDATIONS: {
      FREEZING: { threshold: 5, action: 'FREEZE_ALERT', message: 'Risk of frost damage!' },
      COLD: { threshold: 15, action: 'MONITOR_GROWTH', message: 'Temperature low - reduced growth rate' },
      OPTIMAL: { threshold: 25, action: 'IDEAL', message: 'Temperature optimal for growth' },
      HEAT_STRESS: { threshold: 35, action: 'INCREASE_HUMIDITY', message: 'High temperature - increase watering' },
      EXTREME_HEAT: { threshold: 45, action: 'EMERGENCY', message: 'Extreme temperature alert!' }
    }
  },

  // Humidity (0-100%)
  HUMIDITY: {
    VALID_RANGE: { MIN: 0, MAX: 100 },
    COMFORT_RANGE: { MIN: 40, MAX: 75 }, // Optimal humidity range
    ACTION_THRESHOLD: 40, // Suggest misting below
    ALERT_CONDITIONS: {
      TOO_DRY: 20,             // <20% - Too dry (fungal risk reduced but plant stress)
      MOLD_RISK: 90            // >90% - Mold/fungal risk
    },
    RECOMMENDATIONS: {
      VERY_DRY: { threshold: 20, action: 'INCREASE_HUMIDITY', message: 'Air very dry - suggest misting' },
      DRY: { threshold: 40, action: 'SUGGEST_MISTING', message: 'Humidity low - consider misting leaves' },
      OPTIMAL: { threshold: 60, action: 'IDEAL', message: 'Humidity optimal for most plants' },
      HIGH: { threshold: 75, action: 'MONITOR', message: 'Humidity high - improve air circulation' },
      VERY_HIGH: { threshold: 90, action: 'INCREASE_VENTILATION', message: 'Critical humidity - mold/fungal risk!' }
    }
  },

  // pH Level (0-14)
  PH: {
    VALID_RANGE: { MIN: 0, MAX: 14 },
    OPTIMAL_RANGE: { MIN: 5.5, MAX: 7.0 },
    ALERT_CONDITIONS: {
      ACIDIC: 5.5,             // <5.5 - Acidic soil
      ALKALINE: 7.5            // >7.5 - Alkaline soil
    },
    RECOMMENDATIONS: {
      VERY_ACIDIC: { threshold: 5, action: 'ADD_LIME', message: 'Soil too acidic - add lime/calcium' },
      ACIDIC: { threshold: 5.5, action: 'MONITOR_NUTRIENT', message: 'Soil acidic - monitor iron availability' },
      OPTIMAL: { threshold: 6.5, action: 'IDEAL', message: 'Soil pH optimal for nutrient absorption' },
      ALKALINE: { threshold: 7.5, action: 'ADD_SULFUR', message: 'Soil alkaline - consider sulfur amendment' },
      VERY_ALKALINE: { threshold: 8, action: 'URGENT_AMENDMENT', message: 'Soil strongly alkaline - nutrient lockup risk!' }
    }
  },

  // Light Intensity (0-100,000 lux)
  LIGHT: {
    VALID_RANGE: { MIN: 0, MAX: 100000 },
    OPTIMAL_RANGE: { MIN: 5000, MAX: 20000 }, // Typical indoor grow light range
    ACTION_THRESHOLD: 1000, // Low light alert below
    ALERT_CONDITIONS: {
      INSUFFICIENT: 500,       // <500 - Insufficient light
      INTENSE_SCORCHING: 50000 // >50,000 - Intense/Scorching light
    },
    RECOMMENDATIONS: {
      VERY_LOW: { threshold: 500, action: 'ADD_GROWLIGHT', message: 'Critical light shortage - add grow lights' },
      LOW: { threshold: 1000, action: 'INCREASE_LIGHT', message: 'Low light - plant may stretch/etiolate' },
      SUBOPTIMAL: { threshold: 5000, action: 'MONITOR_GROWTH', message: 'Light below optimal - slower growth' },
      OPTIMAL: { threshold: 15000, action: 'IDEAL', message: 'Light level optimal for photosynthesis' },
      INTENSE: { threshold: 50000, action: 'REDUCE_LIGHT', message: 'Very intense light - risk of photobleaching' },
      SCORCHING: { threshold: 75000, action: 'EMERGENCY_SHADE', message: 'Extreme light intensity - scorching risk!' }
    }
  },

  // Flow Rate (0-30 L/min)
  FLOW_RATE: {
    VALID_RANGE: { MIN: 0, MAX: 30 },
    NORMAL_OPERATION: { MIN: 1, MAX: 30 }, // Normal pump operation range
    ACTION_THRESHOLD: 1, // Normal pump operation above
    ALERT_CONDITIONS: {
      ZERO_DURING_WATERING: 0   // 0 L/min during watering = blockage or pump failure
    },
    RECOMMENDATIONS: {
      ZERO_FLOW: { threshold: 0, action: 'PUMP_FAILURE_ALERT', message: 'Watering failed - zero flow detected!' },
      NORMAL: { threshold: 1, action: 'NORMAL_OPERATION', message: 'Water pump operating normally' },
      LOW_FLOW: { threshold: 0.5, action: 'CHECK_LINES', message: 'Low water flow - check for blockages' },
      EXCESSIVE: { threshold: 25, action: 'CALIBRATE', message: 'Excessive flow rate - check valve settings' }
    }
  }
};

/**
 * Watering System Performance Standards
 */
export const WATERING_SYSTEM = {
  // Sampling and control frequencies
  SAMPLING_FREQUENCY: {
    ALL_SENSORS: 10000,        // All sensors read every 10 seconds
    STATUS_HEARTBEAT: 30000    // Status heartbeat every 30 seconds
  },

  // Auto-watering logic
  AUTO_WATERING: {
    TRIGGER_MOISTURE: 30,      // Trigger watering at <30%
    TARGET_MOISTURE: 70,       // Water until moisture reaches 70%
    COOLDOWN_MINUTES: 5,       // 5-minute cooldown between cycles
    MAX_CYCLES_PER_HOUR: 4,    // Maximum 4 watering cycles per hour
    MAX_CYCLES_PER_DAY: 6      // Maximum 6 watering cycles per day
  },

  // Safety constraints
  SAFETY: {
    MAX_PUMP_RUNTIME_MS: 300000, // 5 minutes max continuous runtime
    FLOW_CHECK_INTERVAL: 5000,   // Check flow every 5 seconds
    FLOW_VERIFICATION_TIME: 3000, // Allow 3 seconds for flow to stabilize
    PUMP_FAILURE_THRESHOLD: 3    // Alert after 3 failed watering attempts
  },

  // Water volume tracking
  VOLUME_TRACKING: {
    MEASURE_INTERVAL: 1000,    // Measure flow every 1 second
    ALERT_ON_ZERO_FLOW: true,  // Alert if no flow during watering
    LOG_EVERY_CYCLE: true      // Log every watering cycle
  }
};

/**
 * AI & Disease Detection Integration
 */
export const AI_INTEGRATION = {
  // Disease detection confidence thresholds
  DISEASE_DETECTION: {
    ALERT_THRESHOLD: 0.7,      // Alert when confidence >= 70%
    CRITICAL_THRESHOLD: 0.85,  // Critical alert when >= 85%
    CRITICAL_DISEASES: ['bacterialblight', 'viralmosaic', 'leafmold']
  },

  // AI recommendations based on sensor data
  RECOMMENDATIONS: {
    ENABLED: true,
    UPDATE_INTERVAL: 300000,   // Update recommendations every 5 minutes
    CONTEXTUAL_ADVICE: true    // Provide context-aware suggestions
  },

  // Multiple AI provider configuration
  PROVIDERS: {
    PRIMARY: 'gemini',         // Primary AI provider
    FALLBACK: ['openai', 'grok', 'free-api'],
    RETRY_ATTEMPTS: 3,
    TIMEOUT_MS: 10000
  }
};

/**
 * Data Persistence & Weather Integration
 */
export const DATA_MANAGEMENT = {
  // JSON payload format for MongoDB
  SENSOR_POSTING: {
    ENDPOINT: '/api/sensors',
    METHOD: 'POST',
    INTERVAL: 30000,            // Send data every 30 seconds
    BATCH_SIZE: 10,             // Batch readings before sending
    RETRY_ON_FAILURE: true
  },

  // Weather API integration
  WEATHER: {
    ENABLED: true,
    UPDATE_INTERVAL: 600000,    // Update weather every 10 minutes
    LOCATION: 'auto',           // Auto-detect from GPS or manual config
    PARAMETERS: [
      'temperature',
      'humidity',
      'pressure',
      'precipitation',
      'uv_index',
      'wind_speed'
    ]
  },

  // Data retention policies
  RETENTION: {
    SENSOR_READINGS_DAYS: 90,   // Keep sensor data for 90 days
    WATERING_LOGS_DAYS: 365,    // Keep watering logs for 1 year
    DISEASE_DETECTION_DAYS: 180, // Keep disease detection records for 6 months
    CLEAR_HISTORY_BATCH_SIZE: 1000 // Delete in batches of 1000 records
  }
};

/**
 * Critical Thresholds Summary
 * These should trigger immediate alerts
 */
export const CRITICAL_ALERTS = [
  { sensor: 'SOIL_MOISTURE', condition: 'value < 10', action: 'CRITICAL_DRY_ALERT' },
  { sensor: 'SOIL_MOISTURE', condition: 'value > 90', action: 'CRITICAL_WET_ALERT' },
  { sensor: 'TEMPERATURE', condition: 'value < 5', action: 'FREEZE_RISK_ALERT' },
  { sensor: 'TEMPERATURE', condition: 'value > 45', action: 'EXTREME_HEAT_ALERT' },
  { sensor: 'HUMIDITY', condition: 'value > 90', action: 'MOLD_RISK_ALERT' },
  { sensor: 'PH', condition: 'value < 5.5 OR value > 7.5', action: 'NUTRIENT_LOCKUP_ALERT' },
  { sensor: 'LIGHT', condition: 'value < 500', action: 'INSUFFICIENT_LIGHT_ALERT' },
  { sensor: 'FLOW_RATE', condition: 'value = 0 during watering', action: 'PUMP_FAILURE_ALERT' },
  { sensor: 'DISEASE', condition: 'confidence >= 0.85', action: 'CRITICAL_DISEASE_ALERT' }
];

export default {
  SENSOR_THRESHOLDS,
  WATERING_SYSTEM,
  AI_INTEGRATION,
  DATA_MANAGEMENT,
  CRITICAL_ALERTS
};
