const isDevelopment = process.env.NODE_ENV !== 'production';
const isProduction = process.env.NODE_ENV === 'production';

const rawCorsOrigins = process.env.CORS_ORIGIN || process.env.CLIENT_URL || '';
const parsedCorsOrigins = rawCorsOrigins
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const defaultDevOrigin = 'http://localhost:3000';

export default {
  // Server Configuration
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_DEVELOPMENT: isDevelopment,
  IS_PRODUCTION: isProduction,
  
  // Database Configuration
  MONGODB_URI: process.env.MONGODB_URI,
  
  // CORS Configuration
  CORS_ORIGIN: parsedCorsOrigins[0] || defaultDevOrigin,
  CORS_ORIGINS: parsedCorsOrigins.length > 0 ? parsedCorsOrigins : [defaultDevOrigin],
  
  // Test Mode Configuration
  TEST_MODE: {
    ENABLED: process.env.ENABLE_TEST_MODE === 'true' || isDevelopment,
    DISABLED_IN_PRODUCTION: isProduction
  },
  
  // ESP32 Configuration
  ESP32: {
    IP: process.env.ESP32_IP || '192.168.1.100',
    PORT: process.env.ESP32_PORT || 80,
    TIMEOUT: 5000
  },
  
  // Rate Limiting
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX) || (isProduction ? 100 : 200),
    MESSAGE: 'Too many requests, please try again later'
  },

  // Admin IP Whitelist (comma-separated in ADMIN_IPS env var)
  ADMIN_IPS: (process.env.ADMIN_IPS || 'localhost,127.0.0.1,::1').split(',').map(ip => ip.trim()).filter(Boolean),
  
  // API Configuration
  API: {
    PREFIX: '/api',
    VERSION: 'v1'
  },
  
  // WebSocket Configuration
  WEBSOCKET: {
    PATH: '/ws',
    PING_INTERVAL: 30000 // 30 seconds
  },
  
  // Pagination
  PAGINATION: {
    DEFAULT_LIMIT: 50,
    MAX_LIMIT: 100
  },
  
  // Sensor Configuration - Per Specification
  SENSOR: {
    READ_INTERVAL: 10000, // Read all sensors every 10 seconds (UPDATED)
    HEARTBEAT_INTERVAL: 30000, // Status heartbeat every 30 seconds (NEW)
    RETENTION_DAYS: 90 // Keep data for 90 days (UPDATED)
  },
  
  // Watering Configuration - Per Specification
  WATERING: {
    TRIGGER_THRESHOLD: 30, // Trigger watering at <30% moisture
    TARGET_MOISTURE: 70, // Water until moisture reaches 70%
    COOLDOWN_MINUTES: 5, // 5-minute cooldown between cycles
    MAX_CYCLES_PER_HOUR: 4, // Maximum 4 cycles per hour
    MAX_CYCLES_PER_DAY: 6, // Maximum 6 cycles per day
    FLOW_CHECK_INTERVAL: 5000, // Check flow every 5 seconds
    FLOW_VERIFICATION_TIME: 3000 // Allow 3 seconds for flow to stabilize
  },
  
  // AI Configuration - Multiple Providers with Fallback
  AI: {
    CONFIDENCE_THRESHOLD: 50,
    ENABLED: true,
    UPDATE_INTERVAL: 300000, // Update recommendations every 5 minutes
    
    // Multiple AI Provider Configuration
    PROVIDERS: {
      PRIMARY: process.env.AI_PRIMARY_PROVIDER || 'gemini',
      FALLBACK_ORDER: ['openai', 'grok', 'free-api'], // Fallback order
      RETRY_ATTEMPTS: 3,
      TIMEOUT_MS: 10000
    },
    
    // Disease Detection Integration
    DISEASE_DETECTION: {
      ENABLED: true,
      ALERT_THRESHOLD: 0.7, // Alert when confidence >= 70%
      CRITICAL_THRESHOLD: 0.85, // Critical when >= 85%
      CRITICAL_DISEASES: ['bacterialblight', 'viralmosaic', 'leafmold']
    }
  },
  
  // Weather Integration
  WEATHER: {
    ENABLED: true,
    UPDATE_INTERVAL: 600000, // Update every 10 minutes
    LOCATION: process.env.WEATHER_LOCATION || 'auto',
    
    // Multiple weather provider APIs
    PROVIDERS: {
      PRIMARY: process.env.WEATHER_PRIMARY || 'openweathermap',
      FALLBACK: ['open-meteo', 'weatherapi']
    }
  },
  
  // API Keys for Multiple Providers
  API_KEYS: {
    // Gemini AI
    GEMINI: process.env.GEMINI_API_KEY || '',
    
    // OpenAI
    OPENAI: process.env.OPENAI_API_KEY || '',
    
    // Grok AI
    GROK: process.env.GROK_API_KEY || '',
    
    // Weather APIs
    OPENWEATHER: process.env.OPENWEATHER_API_KEY || '',
    WEATHERAPI: process.env.WEATHERAPI_KEY || '',
    
    // Other free API sources
    FREE_APIS: {
      OPEN_METEO: process.env.OPEN_METEO_KEY || '', // No key required
      WEATHERAPI_FREE: process.env.WEATHERAPI_FREE_KEY || ''
    }
  },
  
  // Data Management
  DATA_MANAGEMENT: {
    // JSON payload posting to MongoDB
    SENSOR_POSTING: {
      ENDPOINT: '/api/sensors',
      INTERVAL: 30000, // Send data every 30 seconds
      BATCH_SIZE: 10
    },
    
    // Data retention policies
    RETENTION: {
      SENSOR_READINGS_DAYS: 90,
      WATERING_LOGS_DAYS: 365,
      DISEASE_DETECTION_DAYS: 180,
      CLEAR_HISTORY_BATCH_SIZE: 1000
    }
  },
  
  // Security
  SECURITY: {
    BCRYPT_ROUNDS: 10,
    JWT_SECRET: process.env.JWT_SECRET || (isProduction ? undefined : 'dev-secret-key'),
    JWT_EXPIRE: '7d',
    REQUIRE_HTTPS: isProduction,
    TRUST_PROXY: isProduction
  },
  
  // Logging
  LOGGING: {
    LEVEL: isProduction ? 'info' : 'debug',
    ENABLE_MORGAN: true,
    ENABLE_CONSOLE: true
  }
};
