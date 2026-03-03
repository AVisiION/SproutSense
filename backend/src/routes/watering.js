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

const router = express.Router();

// POST /api/water/start - Start watering
router.post('/start', wateringLimiter, validateWateringRequest, startWatering);

// POST /api/water/stop - Stop watering
router.post('/stop', wateringLimiter, validateWateringRequest, stopWatering);

// GET /api/water/status/:deviceId - Get watering status
router.get('/status/:deviceId', readLimiter, getWateringStatus);

// GET /api/water/history - Get watering history
router.get('/history', readLimiter, validateHistoryQuery, getWateringHistory);

// GET /api/water/today - Get today's watering stats
router.get('/today', readLimiter, getTodayStats);

// PATCH /api/water/:id - Update watering log
router.patch('/:id', validateObjectId, updateWateringLog);

export default router;
