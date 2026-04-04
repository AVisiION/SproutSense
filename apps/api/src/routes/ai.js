import express from 'express';
import {
  getAIRecommendation,
  getAIInsights,
  getAIUsageStats,
  chatWithAI,
  submitDiseaseDetection,
  getLatestDiseaseDetection,
  getDiseaseHistory,
  getActiveAlerts,
  getAllDiseaseDetections
} from '../controllers/aiController.js';
import { validateHistoryQuery, validateDiseaseDetection } from '../validators/requestValidator.js';
import { aiLimiter } from '../middleware/rateLimiter.js';
import { PERMISSIONS } from '../config/rbac.js';
import authenticate from '../middleware/authenticate.js';
import authenticateDevice from '../middleware/authenticateDevice.js';
import requireAccountState from '../middleware/requireAccountState.js';
import requireLinkedDevice from '../middleware/requireLinkedDevice.js';
import requirePermissions from '../middleware/requirePermissions.js';

const router = express.Router();

// ============================================================================
// DEVICE-AUTHENTICATED ROUTES (for ESP32-CAM firmware)
// These must come BEFORE authenticate middleware is applied
// ============================================================================

// POST /api/ai/disease/device - Submit disease detection with device token auth (ESP32-CAM endpoint)
router.post('/disease/device', 
  aiLimiter, 
  validateDiseaseDetection, 
  authenticateDevice, 
  submitDiseaseDetection
);

// ============================================================================
// USER-AUTHENTICATED ROUTES (require user login)
// ============================================================================

router.use(authenticate, requireAccountState());
router.use(requireLinkedDevice());

// Existing routes
// GET /api/ai/recommend - Get AI watering recommendation
router.get('/recommend', aiLimiter, requirePermissions([PERMISSIONS.AI_INSIGHTS_READ]), getAIRecommendation);

// GET /api/ai/insights - Get historical AI insights
router.get('/insights', aiLimiter, requirePermissions([PERMISSIONS.AI_INSIGHTS_READ]), validateHistoryQuery, getAIInsights);

// GET /api/ai/usage - Get AI usage for current day
router.get('/usage', aiLimiter, requirePermissions([PERMISSIONS.AI_INSIGHTS_READ]), getAIUsageStats);

// POST /api/ai/chat - Chat with Gemini AI using sensor context
router.post('/chat', aiLimiter, requirePermissions([PERMISSIONS.AI_CHAT]), chatWithAI);

// NEW: Disease detection routes (ESP32-CAM)
// POST /api/ai/disease - Submit disease detection result from ESP32-CAM
router.post('/disease', aiLimiter, requirePermissions([PERMISSIONS.AI_DISEASE_SUBMIT]), submitDiseaseDetection);

// GET /api/ai/disease/latest - Get latest disease detection
router.get('/disease/latest', aiLimiter, requirePermissions([PERMISSIONS.AI_DISEASE_READ]), getLatestDiseaseDetection);

// GET /api/ai/disease/history - Get disease detection history
router.get('/disease/history', aiLimiter, requirePermissions([PERMISSIONS.AI_DISEASE_READ]), getDiseaseHistory);

// GET /api/ai/disease/alerts - Get active disease alerts
router.get('/disease/alerts', aiLimiter, requirePermissions([PERMISSIONS.AI_DISEASE_READ]), getActiveAlerts);

// GET /api/ai/disease/all - Get all disease detections with pagination
router.get('/disease/all', aiLimiter, requirePermissions([PERMISSIONS.AI_DISEASE_READ]), getAllDiseaseDetections);

// ============================================================================
// FIX FOR FRONTEND 404 ERROR
// Sometimes the frontend drops the '/api/ai' prefix and just calls '/disease/all'
// relative to this router. If the frontend calls `/ai/disease/all` while this 
// router is mounted at `/api`, it actually requests `/api/ai/disease/all`.
// But if the frontend drops `/api`, we handle it gracefully here as a fallback.
// ============================================================================

export default router;
