import express from 'express';
import {
  getConfig,
  updateConfig,
  getStatus,
  updateStatus,
  getHealth
} from '../controllers/configController.js';
import { validateConfigUpdate, validateDeviceStatus } from '../validators/requestValidator.js';
import { readLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// GET /api/config - Get system configuration
router.get('/', readLimiter, getConfig);
router.get('/:deviceId', readLimiter, getConfig);

// POST /api/config - Update system configuration
router.post('/', validateConfigUpdate, updateConfig);
router.patch('/:deviceId', validateConfigUpdate, updateConfig);

// GET /api/status - Get device status
router.get('/status', readLimiter, getStatus);

// POST /api/status - Update device status (ESP32 endpoint)
router.post('/status', validateDeviceStatus, updateStatus);

// GET /api/health - Get system health
router.get('/health', readLimiter, getHealth);

export default router;
