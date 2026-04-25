import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import compression from 'compression';

dotenv.config();

import config from './config/config.js';
import connectDB from './config/db.js';
import sensorRoutes from './routes/sensors.js';
import wateringRoutes from './routes/watering.js';
import configRoutes from './routes/config.js';
import aiRoutes from './routes/ai.js';
import publicRoutes from './routes/public.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import roleRoutes from './routes/roles.js';
import deviceRoutes from './routes/device.js';
import intelligenceRoutes from './routes/intelligence.routes.js';
import errorHandler from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { requestLogger } from './middleware/commonMiddleware.js';
import { seedRbac } from './utils/seedRbac.js';

// Connect to MongoDB
connectDB();
seedRbac().catch((error) => {
  console.error('[RBAC] Seed failed:', error.message);
});

const app = express();

// Trust proxy in production
if (config.IS_PRODUCTION) {
  app.set('trust proxy', 1);
}

// ==========================================
// ORIGIN SETUP
// ==========================================
const devOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'http://10.55.107.32:3000'
];

const allowedOrigins = config.IS_PRODUCTION
  ? [...config.CORS_ORIGINS]
  : [...devOrigins, ...config.CORS_ORIGINS].filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  return allowedOrigins.includes(origin);
};

const frontendOrigin = config.CORS_ORIGIN || 'http://localhost:3000';
const frontendHost = frontendOrigin.replace(/^https?:\/\//, '');

// ==========================================
// SECURITY HEADERS
// ==========================================
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", 'https:', 'data:'],
      connectSrc: config.IS_PRODUCTION
        ? ["'self'", frontendOrigin, `wss://${frontendHost}`]
        : ["'self'", 'http:', 'https:', 'ws:', 'wss:'],
      upgradeInsecureRequests: config.IS_PRODUCTION ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  referrerPolicy: { policy: 'no-referrer' },
}));

// ==========================================
// CORS
// ==========================================
app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ==========================================
// GENERAL MIDDLEWARE
// ==========================================
app.use(morgan(config.IS_PRODUCTION ? 'combined' : 'dev'));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);
app.use('/api', apiLimiter);

// ==========================================
// HEALTH CHECKS
// ==========================================
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'SproutSense API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/healthz', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    environment: config.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'SproutSense API',
    version: '1.0.0',
    environment: config.NODE_ENV,
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      roles: '/api/roles',
      public: '/api/public',
      sensors: '/api/sensors',
      watering: '/api/water',
      config: '/api/config',
      ai: '/api/ai',
    },
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// API ROUTES
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/device', deviceRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api/water', wateringRoutes);
app.use('/api/config', configRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/intelligence', intelligenceRoutes);

// ==========================================
// 404
// ==========================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Not Found - ${req.originalUrl}`,
  });
});

// ==========================================
// ERROR HANDLER
// ==========================================
app.use(errorHandler);

export default app;