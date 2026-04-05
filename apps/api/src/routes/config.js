import express from 'express';
import {
  getConfig,
  updateConfig,
  getStatus,
  updateStatus,
  getHealth,
  getTestMode,
  toggleTestMode,
  clearSensorHistory,
  clearWateringHistory,
  clearDiseaseHistory,
  clearAllHistory,
  getDataRetentionPolicy,
  updateDataRetentionPolicy,
  createAdminLog,
  getAdminLogs,
  exportAdminLogs
} from '../controllers/configController.js';
import { getSystemStats } from '../controllers/adminStatsController.js';
import { validateConfigUpdate, validateDeviceStatus } from '../validators/requestValidator.js';
import { readLimiter } from '../middleware/rateLimiter.js';
import config from '../config/config.js';
import { PERMISSIONS } from '../config/rbac.js';
import authenticate from '../middleware/authenticate.js';
import requireAccountState from '../middleware/requireAccountState.js';
import requirePermissions from '../middleware/requirePermissions.js';
import authenticateDevice from '../middleware/authenticateDevice.js';

const router = express.Router();

// POST /api/config/status/device - Update device status with device token auth
router.post('/status/device', validateDeviceStatus, authenticateDevice, updateStatus);

router.use(authenticate, requireAccountState());

// IMPORTANT: Specific routes must come BEFORE dynamic parameter routes
// Otherwise /:deviceId will match everything

// GET /api/config/status - Get device status (with optional ?deviceId= query param)
router.get('/status', readLimiter, requirePermissions([PERMISSIONS.CONFIG_READ]), getStatus);

// GET /api/config/status/:deviceId - Get device status by path param
router.get('/status/:deviceId', readLimiter, requirePermissions([PERMISSIONS.CONFIG_READ]), getStatus);

// POST /api/config/status - Update device status (ESP32 endpoint)
router.post('/status', requirePermissions([PERMISSIONS.CONFIG_UPDATE]), validateDeviceStatus, updateStatus);

// GET /api/config/health - Get system health
router.get('/health', readLimiter, requirePermissions([PERMISSIONS.CONFIG_READ]), getHealth);

// GET /api/config/health/:deviceId - Get health for specific device
router.get('/health/:deviceId', readLimiter, requirePermissions([PERMISSIONS.CONFIG_READ]), getHealth);

// GET /api/config/system-stats - Get system-wide stats
router.get('/system-stats', readLimiter, requirePermissions([PERMISSIONS.CONFIG_READ]), getSystemStats);

// TEST MODE ROUTES - DEVELOPMENT ONLY
if (config.IS_DEVELOPMENT) {
  router.get('/testmode', readLimiter, requirePermissions([PERMISSIONS.CONFIG_READ]), getTestMode);
  router.post('/testmode', requirePermissions([PERMISSIONS.CONFIG_UPDATE]), toggleTestMode);
}

// POST /api/config/clear-sensor-history - Clear sensor readings history
router.post('/clear-sensor-history', requirePermissions([PERMISSIONS.CONFIG_UPDATE]), clearSensorHistory);

// POST /api/config/clear-watering-history - Clear watering logs history
router.post('/clear-watering-history', requirePermissions([PERMISSIONS.CONFIG_UPDATE]), clearWateringHistory);

// POST /api/config/clear-disease-history - Clear disease detection history
router.post('/clear-disease-history', requirePermissions([PERMISSIONS.CONFIG_UPDATE]), clearDiseaseHistory);

// POST /api/config/clear-all-history - Clear all historical data
router.post('/clear-all-history', requirePermissions([PERMISSIONS.CONFIG_UPDATE]), clearAllHistory);

// GET/PUT /api/config/data-retention - Manage retention policy
router.get('/data-retention', readLimiter, requirePermissions([PERMISSIONS.CONFIG_READ]), getDataRetentionPolicy);
router.put('/data-retention', requirePermissions([PERMISSIONS.CONFIG_UPDATE]), updateDataRetentionPolicy);

// Admin action logs
router.get('/admin-logs', readLimiter, requirePermissions([PERMISSIONS.AUDIT_READ]), getAdminLogs);
router.get('/admin-logs/export', readLimiter, requirePermissions([PERMISSIONS.AUDIT_EXPORT]), exportAdminLogs);
router.post('/admin-logs', requirePermissions([PERMISSIONS.AUDIT_READ]), createAdminLog);

// GET /api/config - Get system configuration
router.get('/', readLimiter, requirePermissions([PERMISSIONS.CONFIG_READ]), getConfig);
router.get('/:deviceId', readLimiter, requirePermissions([PERMISSIONS.CONFIG_READ]), getConfig);

// POST /api/config - Update system configuration
router.post('/', requirePermissions([PERMISSIONS.CONFIG_UPDATE]), validateConfigUpdate, updateConfig);
router.patch('/:deviceId', requirePermissions([PERMISSIONS.CONFIG_UPDATE]), validateConfigUpdate, updateConfig);

export default router;