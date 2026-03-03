import express from 'express';
import {
  getLatestSensors,
  getSensorHistory,
  getHourlyAverages,
  createSensorReading,
  getSensorStats
} from '../controllers/sensorController.js';
import { validateSensorReading, validateHistoryQuery } from '../validators/requestValidator.js';
import { readLimiter, sensorPostLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// GET /api/sensors - Get latest sensor readings
router.get('/', readLimiter, getLatestSensors);

// GET /api/sensors/history - Get sensor history
router.get('/history', readLimiter, validateHistoryQuery, getSensorHistory);

// GET /api/sensors/hourly - Get hourly averages
router.get('/hourly', readLimiter, validateHistoryQuery, getHourlyAverages);

// GET /api/sensors/stats - Get sensor statistics
router.get('/stats', readLimiter, validateHistoryQuery, getSensorStats);

// POST /api/sensors - Create new sensor reading (ESP32 endpoint)
router.post('/', sensorPostLimiter, validateSensorReading, createSensorReading);

export default router;
