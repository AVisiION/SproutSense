// API Response status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// Device states
export const DEVICE_STATE = {
  IDLE: 'IDLE',
  WATERING: 'WATERING',
  COOLDOWN: 'COOLDOWN',
  ERROR: 'ERROR',
  OFFLINE: 'OFFLINE'
};

// Watering trigger types
export const TRIGGER_TYPE = {
  AUTO: 'auto',
  MANUAL: 'manual',
  SCHEDULED: 'scheduled',
  AI: 'ai'
};

// AI recommendation actions
export const AI_ACTION = {
  WATER_NOW: 'water_now',
  MONITOR: 'monitor',
  WAIT: 'wait'
};

// AI priority levels
export const AI_PRIORITY = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

// Sensor types
export const SENSOR_TYPE = {
  SOIL_MOISTURE: 'soilMoisture',
  TEMPERATURE: 'temperature',
  HUMIDITY: 'humidity',
  LIGHT: 'light',
  PH: 'pH',
  FLOW_RATE: 'flowRate',
  FLOW_VOLUME: 'flowVolume'
};

// WebSocket event types
export const WS_EVENT = {
  CONNECTED: 'connected',
  SENSOR_UPDATE: 'sensor_update',
  WATERING_STARTED: 'watering_started',
  WATERING_STOPPED: 'watering_stopped',
  CONFIG_UPDATED: 'config_updated',
  DEVICE_STATUS_CHANGED: 'device_status_changed',
  DISEASE_ALERT: 'disease_alert',
  AI_UPDATE: 'ai_update',
  ERROR: 'error',
  PING: 'ping',
  PONG: 'pong'
};

// Error codes
export const ERROR_CODE = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  DEVICE_OFFLINE: 'DEVICE_OFFLINE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
};

// Default device ID
export const DEFAULT_DEVICE_ID = 'ESP32-SENSOR';

// Time constants
export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000
};

// Validation constants
export const VALIDATION = {
  SOIL_MOISTURE: {
    MIN: 0,
    MAX: 100
  },
  PH: {
    MIN: 0,
    MAX: 14
  },
  HUMIDITY: {
    MIN: 0,
    MAX: 100
  },
  TEMPERATURE: {
    MIN: -40,
    MAX: 85
  },
  LIGHT: {
    MIN: 0,
    MAX: 100000
  },
  FLOW_RATE: {
    MIN: 0,
    MAX: 10000
  },
  FLOW_VOLUME: {
    MIN: 0,
    MAX: 1000000
  }
};

