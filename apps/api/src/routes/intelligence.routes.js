import express from 'express';
import { getAdvancedAnalysis, getTrendChart } from '../controllers/intelligence.controller.js';
import authenticate from '../middleware/authenticate.js';

const router = express.Router();

// Apply protection to all intelligence routes
router.use(authenticate);

router.get('/analysis', getAdvancedAnalysis);
router.get('/trends', getTrendChart);

export default router;
