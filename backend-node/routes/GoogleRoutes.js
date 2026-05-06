import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Google Auth
 *   description: Đăng nhập bằng tài khoản Google (OAuth2)
 */

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Kích hoạt luồng đăng nhập Google
 *     tags: [Google Auth]
 */
router.get('/google', passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account' 
}));

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Tiếp nhận dữ liệu từ Google và điều hướng thông minh về Frontend
 *     tags: [Google Auth]
 */
router.get('/google/callback/', 
    passport.authenticate('google', { failureRedirect: '/login', session: true }),
    (req, res) => {
        try {
            const user = req.user;

            // 1. Tạo Token JWT
            const token = jwt.sign(
                { id: user.user_id, email: user.email, role: user.role },
                process.env.JWT_SECRET || 'your_secret_key',
                { expiresIn: '7d' }
            );

            // 2. Chuẩn bị thông tin User
            const userData = {
                user_id: user.user_id,
                full_name: user.full_name || user.username,
                avatar_url: user.avatar_url,
                role: user.role
            };

            // 3. XỬ LÝ REDIRECT THÔNG MINH (Sửa lỗi NXDOMAIN)
            const rawUrls = process.env.FRONTEND_URL || 'http://localhost:5173';
            
            // Tách các URL cách nhau bởi dấu phẩy thành mảng và xóa khoảng trắng
            const allowedOrigins = rawUrls.split(',').map(url => url.trim());

            /**
             * LOGIC CHỌN URL:
             * - Nếu server đang chạy ở localhost, ưu tiên chọn link localhost từ danh sách.
             * - Nếu không (đang chạy trên Render), chọn link đầu tiên (thường là link Render).
             */
            const isLocalhost = req.get('host').includes('localhost');
            let frontendUrl = isLocalhost 
                ? (allowedOrigins.find(url => url.includes('localhost')) || allowedOrigins[0])
                : allowedOrigins[0];

            // Xử lý chuẩn hóa URL (Xóa dấu / cuối cùng)
            frontendUrl = frontendUrl.replace(/\/$/, "");

            // Tạo chuỗi Redirect chuẩn
            const queryParams = `token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}`;
            const redirectUrl = `${frontendUrl}/?${queryParams}`;
            
            console.log(`[${isLocalhost ? 'LOCAL' : 'RENDER'}] Redirecting to:`, redirectUrl);
            
            res.redirect(redirectUrl);

        } catch (error) {
            console.error("❌ Lỗi Redirect sau Google Login:", error);
            // Fallback an toàn khi có lỗi
            const rawUrls = process.env.FRONTEND_URL || 'http://localhost:5173';
            const fallbackUrl = rawUrls.split(',')[0].trim().replace(/\/$/, "");
            res.redirect(`${fallbackUrl}/login?error=auth_failed`);
        }
    }
);

export default router;