import express from 'express';
import { getHoso, updateHoso } from '../controllers/profileController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Profile
 *     description: Quản lý thông tin cá nhân người dùng Demi Mart
 */

/**
 * @swagger
 * /api/profile/hoso:
 *   get:
 *     summary: Lấy thông tin hồ sơ chi tiết
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về dữ liệu hồ sơ thành công
 *       401:
 *         description: Chưa đăng nhập
 *   put:
 *     summary: Cập nhật thông tin hồ sơ
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *               phone_number:
 *                 type: string
 *               gender:
 *                 type: string
 *               birthday:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       500:
 *         description: Lỗi server
 */
router.get('/hoso', authenticateToken, getHoso);
router.put('/hoso', authenticateToken, updateHoso);

export default router;