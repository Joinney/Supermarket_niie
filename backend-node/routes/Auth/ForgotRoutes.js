// routes/Auth/ForgotRoutes.js
import express from "express";
import { forgotPassword, verifyOTP, resetPassword } from "../../controllers/Auth/forgotController.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Forgot Password
 *   description: Quy trình khôi phục mật khẩu qua Email và OTP (Demi Mart)
 */

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Yêu cầu gửi mã OTP khôi phục mật khẩu
 *     tags: [Forgot Password]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: "duytoan@example.com"
 *     responses:
 *       200:
 *         description: Đã gửi mã OTP vào Email thành công
 *       404:
 *         description: Email không tồn tại trong hệ thống
 */
router.post("/forgot-password", forgotPassword);

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Xác thực mã OTP người dùng nhập vào
 *     tags: [Forgot Password]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Mã OTP hợp lệ
 *       400:
 *         description: Mã OTP sai hoặc đã hết hạn
 */
router.post("/verify-otp", verifyOTP);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Đặt lại mật khẩu mới sau khi xác thực OTP thành công
 *     tags: [Forgot Password]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 example: "NewPassword123!"
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công
 *       500:
 *         description: Lỗi hệ thống khi cập nhật mật khẩu
 */
router.post("/reset-password", resetPassword);

export default router;