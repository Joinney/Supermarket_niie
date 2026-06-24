import express from 'express';
import { signup, signin, logout, refreshToken, getAllInternalUsers, getUserDetail } from '../controllers/authController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Hệ thống xác thực và quản lý tài khoản (Demi Mart)
 */

// --- FIX LỖI CANNOT GET /api/auth ---
/**
 * @swagger
 * /api/auth/:
 *   get:
 *     summary: Kiểm tra trạng thái Auth Service
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Service đang hoạt động rực rờng
 */
router.get('/', (req, res) => {
    res.json({ message: "Chào Demi, Auth Service đang hoạt động rực rỡ! 🚀" });
});

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Đăng ký tài khoản mới
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - ho_ten
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: "123456"
 *               ho_ten:
 *                 type: string
 *                 example: "Võ Duy Toàn"
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 */
// CHỈ ĐỂ '/signup' vì tiền tố /api/auth đã khai báo ở server.js
router.post('/signup', signup);

/**
 * @swagger
 * /api/auth/signin:
 *   post:
 *     summary: Đăng nhập vào hệ thống
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 */
router.post('/signin', signin);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Đăng xuất khỏi hệ thống
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Đăng xuất thành công
 */
router.post('/logout', logout);

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Làm mới Access Token
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Cấp Access Token mới thành công
 */
router.post('/refresh-token', refreshToken);
router.get('/internal/users', getAllInternalUsers);
router.get('/internal/users/:id', getUserDetail);
export default router;