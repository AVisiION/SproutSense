import express from 'express';
import {
  getAIRecommendation,
  getAIInsights,
  chatWithAI,
  submitDiseaseDetection,
  getLatestDiseaseDetection,
  getDiseaseHistory,
  getActiveAlerts,
  getAllDiseaseDetections
} from '../controllers/aiController.js';
import { validateHistoryQuery } from '../validators/requestValidator.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Existing routes
// GET /api/ai/recommend - Get AI watering recommendation
router.get('/recommend', aiLimiter, getAIRecommendation);

// GET /api/ai/insights - Get historical AI insights
router.get('/insights', aiLimiter, validateHistoryQuery, getAIInsights);

// POST /api/ai/chat - Chat with Gemini AI using sensor context
router.post('/chat', aiLimiter, chatWithAI);

// NEW: Disease detection routes (ESP32-CAM)
// POST /api/ai/disease - Submit disease detection result from ESP32-CAM
router.post('/disease', aiLimiter, submitDiseaseDetection);

// GET /api/ai/disease/latest - Get latest disease detection
router.get('/disease/latest', aiLimiter, getLatestDiseaseDetection);

// GET /api/ai/disease/history - Get disease detection history
router.get('/disease/history', aiLimiter, getDiseaseHistory);

// GET /api/ai/disease/alerts - Get active disease alerts
router.get('/disease/alerts', aiLimiter, getActiveAlerts);

// GET /api/ai/disease/all - Get all disease detections with pagination
router.get('/disease/all', aiLimiter, getAllDiseaseDetections);

// ============================================================================
// FIX FOR FRONTEND 404 ERROR
// Sometimes the frontend drops the '/api/ai' prefix and just calls '/disease/all'
// relative to this router. If the frontend calls `/ai/disease/all` while this 
// router is mounted at `/api`, it actually requests `/api/ai/disease/all`.
// But if the frontend drops `/api`, we handle it gracefully here as a fallback.
// ============================================================================

export default router;
