import express from 'express';
import {
  getAIRecommendation,
  getAIInsights,
  chatWithAI
} from '../controllers/aiController.js';
import { validateHistoryQuery } from '../validators/requestValidator.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// GET /api/ai/recommend - Get AI watering recommendation
router.get('/recommend', aiLimiter, getAIRecommendation);

// GET /api/ai/insights - Get historical AI insights
router.get('/insights', aiLimiter, validateHistoryQuery, getAIInsights);

// POST /api/ai/chat - Chat with Gemini AI using sensor context
router.post('/chat', aiLimiter, chatWithAI);

export default router;
