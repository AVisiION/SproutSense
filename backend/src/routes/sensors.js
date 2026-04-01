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
import { PERMISSIONS } from '../config/rbac.js';
import authenticate from '../middleware/authenticate.js';
import requireAccountState from '../middleware/requireAccountState.js';
import requirePermissions from '../middleware/requirePermissions.js';

const router = express.Router();

router.use(authenticate, requireAccountState());

// GET /api/sensors - Get latest sensor readings
router.get('/', readLimiter, requirePermissions([PERMISSIONS.SENSORS_READ]), getLatestSensors);

// GET /api/sensors/history - Get sensor history
router.get('/history', readLimiter, requirePermissions([PERMISSIONS.SENSORS_READ]), validateHistoryQuery, getSensorHistory);

// GET /api/sensors/hourly - Get hourly averages
router.get('/hourly', readLimiter, requirePermissions([PERMISSIONS.SENSORS_READ]), validateHistoryQuery, getHourlyAverages);

// GET /api/sensors/stats - Get sensor statistics
router.get('/stats', readLimiter, requirePermissions([PERMISSIONS.SENSORS_READ]), validateHistoryQuery, getSensorStats);

// POST /api/sensors - Create new sensor reading (ESP32 endpoint)
router.post('/', sensorPostLimiter, requirePermissions([PERMISSIONS.SENSORS_CONTROL]), validateSensorReading, createSensorReading);

export default router;
