import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';

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
    (req, res) => {
        try {
            const user = req.user;

            // 1. Tạo Token JWT (SỬA: Dùng đúng tên biến môi trường trong .env của Demi)
            // Đảm bảo JWT_ACCESS_SECRET khớp với các service khác
            const token = jwt.sign(
                { id: user.user_id, email: user.email, role: user.role },
                process.env.JWT_ACCESS_SECRET || 'your_secret_key', 
                { expiresIn: '7d' }
            );

            // 2. Chuẩn bị thông tin User
            const userData = {
                user_id: user.user_id,
                full_name: user.full_name || user.username,
                avatar_url: user.avatar_url,
                role: user.role
            };

            // 3. XỬ LÝ REDIRECT THÔNG MINH
            const rawUrls = process.env.FRONTEND_URL || 'http://localhost:5173';
            const allowedOrigins = rawUrls.split(',').map(url => url.trim());

            const isLocalhost = req.get('host').includes('localhost');
            let frontendUrl = isLocalhost 
                ? (allowedOrigins.find(url => url.includes('localhost')) || allowedOrigins[0])
                : allowedOrigins[0];

            frontendUrl = frontendUrl.replace(/\/$/, "");

            // Tạo chuỗi Redirect kèm token và user info
            const queryParams = `token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}`;
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