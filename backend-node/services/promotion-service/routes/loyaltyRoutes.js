import express from 'express';
// 👉 ĐÃ BỔ SUNG: Thêm hàm dailyCheckIn vào danh sách import
import { getPointBalance, getPointHistory, earnPoints, dailyCheckIn } from '../controllers/loyaltyController.js';

// Đã import đúng tên 'protect' từ middleware
import { protect } from '../middlewares/authMiddleware.js'; 

const router = express.Router();

router.get('/balance', protect, getPointBalance);
router.get('/history', protect, getPointHistory);

// API cộng điểm (Nội bộ gọi khi hoàn tất đơn hoặc đánh giá)
router.post('/earn', earnPoints);

// Yêu cầu phải có token (protect) để biết ai đang điểm danh
router.post('/checkin', protect, dailyCheckIn);

export default router;