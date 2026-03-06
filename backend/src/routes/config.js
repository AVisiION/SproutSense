import express from 'express';
import {
  getConfig,
  updateConfig,
  getStatus,
  updateStatus,
  getHealth,
  getTestMode,
  toggleTestMode
} from '../controllers/configController.js';
import { validateConfigUpdate, validateDeviceStatus } from '../validators/requestValidator.js';
import { readLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// IMPORTANT: Specific routes must come BEFORE dynamic parameter routes
// Otherwise /:deviceId will match everything

// GET /api/config/status - Get device status
router.get('/status', readLimiter, getStatus);

// POST /api/config/status - Update device status (ESP32 endpoint)
router.post('/status', validateDeviceStatus, updateStatus);

// GET /api/config/health - Get system health
router.get('/health', readLimiter, getHealth);

// GET /api/config/testmode - Get test mode status
router.get('/testmode', readLimiter, getTestMode);

// POST /api/config/testmode - Toggle test mode
router.post('/testmode', toggleTestMode);

// GET /api/config - Get system configuration
router.get('/', readLimiter, getConfig);
router.get('/:deviceId', readLimiter, getConfig);

// POST /api/config - Update system configuration
router.post('/', validateConfigUpdate, updateConfig);
router.patch('/:deviceId', validateConfigUpdate, updateConfig);

export default router;
