import express from 'express';
import { getPointBalance, earnPoints, dailyCheckIn, spendPoints } from '../controllers/loyaltyController.js';

import { authenticateToken } from '../middlewares/authMiddleware.js'; 

const router = express.Router();

router.get('/loyalty/balance', authenticateToken, getPointBalance);
router.post('/loyalty/checkin', authenticateToken, dailyCheckIn);
router.post('/loyalty/earn', authenticateToken, earnPoints);
router.post('/loyalty/spend', spendPoints);

export default router;