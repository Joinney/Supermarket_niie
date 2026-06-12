import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import pool from '../configs/database.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Google Auth
 *     description: Đăng nhập bằng tài khoản Google (OAuth2)
 */

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Kích hoạt luồng đăng nhập Google
 *     tags: [Google Auth]
 */
// SỬA: Route con chỉ để '/google'
router.get('/google', passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account' 
}));

// ✅ Hàm lấy cookie options (tái sử dụng từ authController)
const getCookieOptions = (req) => {
    const isProduction = process.env.NODE_ENV === 'production';
    const isLocalhost = req.hostname === 'localhost' || req.hostname === '127.0.0.1';
    
    return {
        httpOnly: true,
        secure: isProduction && !isLocalhost, 
        sameSite: (isProduction && !isLocalhost) ? 'None' : 'Lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 
    };
};

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Tiếp nhận dữ liệu từ Google và điều hướng về Frontend
 *     tags: [Google Auth]
 */
router.get('/google/callback', 
    // SỬA: session: false vì Demi đang dùng JWT
    passport.authenticate('google', { failureRedirect: '/login', session: false }),
    async (req, res) => {
        try {
            const user = req.user;

            // ✅ 1. Tạo Access Token (15 phút)
            const accessToken = jwt.sign(
                { id: user.user_id, email: user.email, role: user.role },
                process.env.JWT_ACCESS_SECRET || 'vdt_secret_2026', 
                { expiresIn: '15m' }
            );

            // ✅ 2. Tạo Refresh Token (7 ngày)
            const refreshToken = jwt.sign(
                { id: user.user_id },
                process.env.JWT_REFRESH_SECRET || 'vdt_refresh_secret_2026',
                { expiresIn: '7d' }
            );

            // ✅ 3. Lưu Refresh Token vào Database
            await pool.query(
                'UPDATE users SET refresh_token = $1, last_login = NOW() WHERE user_id = $2',
                [refreshToken, user.user_id]
            );

            // ✅ 4. Gửi cookie refreshToken
            res.cookie('refreshToken', refreshToken, getCookieOptions(req));

            // 5. Chuẩn bị thông tin User
            const userData = {
                user_id: user.user_id,
                full_name: user.full_name || user.username,
                avatar_url: user.avatar_url,
                role: user.role
            };

            // 6. XỬ LÝ REDIRECT THÔNG MINH
            const rawUrls = process.env.FRONTEND_URL || 'http://localhost:5173';
            const allowedOrigins = rawUrls.split(',').map(url => url.trim());

            const isLocalhost = req.get('host').includes('localhost');
            let frontendUrl = isLocalhost 
                ? (allowedOrigins.find(url => url.includes('localhost')) || allowedOrigins[0])
                : allowedOrigins[0];

            frontendUrl = frontendUrl.replace(/\/$/, "");

            // Tạo chuỗi Redirect kèm token và user info (✅ THÊM refreshToken)
            const queryParams = `token=${accessToken}&user=${encodeURIComponent(JSON.stringify(userData))}&refreshToken=${refreshToken}`; 
            const redirectUrl = `${frontendUrl}/login-success?${queryParams}`; 
            
            console.log(`[Google Auth] [${isLocalhost ? 'LOCAL' : 'RENDER'}] Redirecting to:`, redirectUrl);
            
            res.redirect(redirectUrl);

        } catch (error) {
            console.error("❌ Lỗi Redirect sau Google Login:", error);
            const rawUrls = process.env.FRONTEND_URL || 'http://localhost:5173';
            const fallbackUrl = rawUrls.split(',')[0].trim().replace(/\/$/, "");
            res.redirect(`${fallbackUrl}/login?error=auth_failed`);
        }
    }
);

export default router;