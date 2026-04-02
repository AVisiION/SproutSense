import express from 'express';
import { readLimiter } from '../middleware/rateLimiter.js';
import {
  getPublicAnalyticsPreview,
  getPublicOverview,
  getPublicReportsPreview,
} from '../controllers/publicController.js';

const router = express.Router();

router.get('/overview', readLimiter, getPublicOverview);
router.get('/analytics-preview', readLimiter, getPublicAnalyticsPreview);
router.get('/reports-preview', readLimiter, getPublicReportsPreview);

export default router;
