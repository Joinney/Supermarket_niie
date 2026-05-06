import express from 'express';
import { signup, signin, logout, refreshToken  } from '../../controllers/Auth/authController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Hệ thống xác thực và quản lý tài khoản (Demi Mart)
 */

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
 *       400:
 *         description: Email đã tồn tại hoặc dữ liệu không hợp lệ
 */
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
 *         description: Đăng nhập thành công, trả về Token
 *       401:
 *         description: Sai tài khoản hoặc mật khẩu
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
 *     summary: Làm mới Access Token khi hết hạn
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Cấp Access Token mới thành công
 *       403:
 *         description: Refresh Token không hợp lệ
 */
router.post('/refresh-token', refreshToken);

export default router;