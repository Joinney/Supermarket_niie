import express from 'express';
import { getPointBalance, earnPoints, dailyCheckIn, spendPoints, getCheckInStats } from '../controllers/loyaltyController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js'; 

const router = express.Router();

router.get('/loyalty/balance', authenticateToken, getPointBalance);
router.post('/loyalty/checkin', authenticateToken, dailyCheckIn);
router.post('/loyalty/earn', authenticateToken, earnPoints);
router.post('/loyalty/spend', authenticateToken, spendPoints);
router.get('/loyalty/checkin-stats', authenticateToken, getCheckInStats);

export default router;