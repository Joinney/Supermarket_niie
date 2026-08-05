import express from 'express';
import { authenticateToken } from '../middlewares/authMiddleware.js'; // Nhớ đường dẫn chuẩn của bạn
import { getTodayAttendance, handleAttendanceAction, getMyAttendanceHistory, getAllAttendances } from '../controllers/attendanceController.js';

const router = express.Router();

// Tất cả các route chấm công đều phải yêu cầu đăng nhập (authenticateToken)
router.get('/attendance/today', authenticateToken, getTodayAttendance);
router.post('/attendance/action', authenticateToken, handleAttendanceAction);
router.get('/attendance/my-history', authenticateToken, getMyAttendanceHistory);
router.get('/attendance/all', authenticateToken, getAllAttendances);

export default router;