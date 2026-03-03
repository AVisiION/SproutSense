export default {
  // Server Configuration
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database Configuration
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-watering',
  
  // CORS Configuration
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  
  // ESP32 Configuration
  ESP32: {
    IP: process.env.ESP32_IP || '192.168.1.100',
    PORT: process.env.ESP32_PORT || 80,
    TIMEOUT: 5000
  },
  
  // Rate Limiting
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100, // Max requests per window
    MESSAGE: 'Too many requests, please try again later'
  },
  
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
  
  // Sensor Configuration
  SENSOR: {
    READ_INTERVAL: 5000, // 5 seconds
    RETENTION_DAYS: 30 // Keep data for 30 days
  },
  
  // Watering Configuration
  WATERING: {
    MAX_CYCLES_PER_DAY: 5,
    MIN_INTERVAL_MS: 3600000, // 1 hour between cycles
    DEFAULT_DURATION_MS: 5000
  },
  
  // AI Configuration
  AI: {
    CONFIDENCE_THRESHOLD: 50,
    ENABLED: true
  },
  
  // API Keys (Optional)
  API_KEYS: {
    GEMINI: process.env.GEMINI_API_KEY || '',
    OPENWEATHER: process.env.OPENWEATHER_API_KEY || ''
  },
  
  // Security
  SECURITY: {
    BCRYPT_ROUNDS: 10,
    JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    JWT_EXPIRE: '7d'
  }
};
