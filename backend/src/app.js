import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import compression from 'compression'; // <--- 1. NEW: Imported compression

dotenv.config();

import config from './config/config.js';
import connectDB from './config/db.js';
import sensorRoutes from './routes/sensors.js';
import wateringRoutes from './routes/watering.js';
import configRoutes from './routes/config.js';
import aiRoutes from './routes/ai.js';
import errorHandler from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { requestLogger, notFound } from './middleware/commonMiddleware.js';

// Connect to MongoDB (safe to call multiple times — Mongoose caches the connection)
connectDB();

const app = express();

// Trust proxy in production (for reverse proxies like nginx, Render, Heroku)
if (config.IS_PRODUCTION) {
  app.set('trust proxy', 1);
}

// ── Security ─────────────────────────────────────────────────────────────────
// Enhanced security headers
app.use(helmet({
  contentSecurityPolicy: config.IS_PRODUCTION,
  crossOriginEmbedderPolicy: config.IS_PRODUCTION,
}));

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:5173',
  'https://sproutsense-iot.netlify.app',
  config.CORS_ORIGIN,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── General middleware ────────────────────────────────────────────────────────
// Use combined format for production, dev format for development
app.use(morgan(config.IS_PRODUCTION ? 'combined' : 'dev'));

app.use(compression()); // <--- 2. NEW: Compresses responses (makes chart data load much faster)

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);
app.use('/api', apiLimiter);

// ── Health checks ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ success: true, message: 'SproutSense API', version: '1.0.0', timestamp: new Date().toISOString() });
});

app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'SproutSense API',
    version: '1.0.0',
    environment: config.NODE_ENV,
    endpoints: {
      sensors: '/api/sensors',
      watering: '/api/water',
      config: '/api/config',
      ai: '/api/ai',
    },
    timestamp: new Date().toISOString(),
  });
});

// ── Routes ────────────────────────────────────────────────────────────────────
// Standard API routes
app.use('/api/sensors', sensorRoutes);
app.use('/api/water', wateringRoutes);
app.use('/api/config', configRoutes);
app.use('/api/ai', aiRoutes);

// ============================================================================
// 🚨 BULLETPROOF FALLBACK FOR MISSING /api PREFIX
// If the frontend accidentally requests /sensors instead of /api/sensors,
// this middleware intercepts it and reroutes it to the correct API router.
// ============================================================================
app.use('/sensors', sensorRoutes);
app.use('/water', wateringRoutes);
app.use('/config', configRoutes);
app.use('/ai', aiRoutes);
// ============================================================================

// ── Error handling ────────────────────────────────────────────────────────────
// If the route STILL isn't found, return a proper 404 JSON response
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Not Found - ${req.originalUrl}`,
    hint: "Did you mean to include /api prefix?"
  });
});

app.use(errorHandler);

export default app;
