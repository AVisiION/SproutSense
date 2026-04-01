import express from 'express';
import {
  startWatering,
  stopWatering,
  getWateringHistory,
  getTodayStats,
  getWateringStatus,
  updateWateringLog
} from '../controllers/wateringController.js';
import { validateWateringRequest, validateHistoryQuery, validateObjectId } from '../validators/requestValidator.js';
import { wateringLimiter, readLimiter } from '../middleware/rateLimiter.js';
import { PERMISSIONS } from '../config/rbac.js';
import authenticate from '../middleware/authenticate.js';
import requireAccountState from '../middleware/requireAccountState.js';
import requirePermissions from '../middleware/requirePermissions.js';

const router = express.Router();

router.use(authenticate, requireAccountState());

// POST /api/water/start - Start watering
router.post('/start', wateringLimiter, requirePermissions([PERMISSIONS.WATERING_START]), validateWateringRequest, startWatering);

// POST /api/water/stop - Stop watering
router.post('/stop', wateringLimiter, requirePermissions([PERMISSIONS.WATERING_STOP]), validateWateringRequest, stopWatering);

// GET /api/water/status/:deviceId - Get watering status
router.get('/status/:deviceId', readLimiter, requirePermissions([PERMISSIONS.WATERING_READ]), getWateringStatus);

// GET /api/water/history - Get watering history
router.get('/history', readLimiter, requirePermissions([PERMISSIONS.WATERING_READ]), validateHistoryQuery, getWateringHistory);

// GET /api/water/today - Get today's watering stats
router.get('/today', readLimiter, requirePermissions([PERMISSIONS.WATERING_READ]), getTodayStats);

// PATCH /api/water/:id - Update watering log
router.patch('/:id', requirePermissions([PERMISSIONS.WATERING_STOP]), validateObjectId, updateWateringLog);

export default router;
