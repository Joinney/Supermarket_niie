import express from 'express';
import { signup, signin, logout, refreshToken, getAllInternalUsers,getAllBuyers, getUserDetail, getUserRoleGroup, updateUserDetail, getCustomerStatistics, syncMembershipTier, getVipSettings, updateVipSettings } from '../controllers/authController.js';
import upload from '../configs/cloudinary/cloudinary.js';
import passport from '../configs/Auth/passport.js';
import { generateTokens } from '../controllers/authController.js';
import { getWalletTransactions, refundToWallet } from '../controllers/walletController.js';
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
    res.json({ message: "Chào Demi, Auth Service đang hoạt động rực rỡ! (v1) 🚀" });
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
router.post('/signup', upload.single('avatar'), signup);

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
router.post('/login', signin);

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

// ==========================================
// CÁC ROUTE NỘI BỘ VÀ ADMIN
// ==========================================
router.get('/internal/users', getAllInternalUsers);
router.get('/buyers', getAllBuyers);
router.get('/internal/users/role-group/:id', getUserRoleGroup);
router.get('/internal/users/:id', getUserDetail);
router.put('/internal/users/:id', upload.single('avatar'), updateUserDetail);
router.get('/admin/statistics/customers', getCustomerStatistics);

// Sync membership tier for a specific user
router.post('/admin/internal/users/:id/sync-tier', syncMembershipTier);
router.get('/settings/vip', getVipSettings);
router.put('/settings/vip', updateVipSettings);

// Ví DemiPay
router.get('/wallet/transactions/:userId', getWalletTransactions);
router.post('/internal/wallet/refund', refundToWallet);

// ==========================================
// 🌟 API ĐĂNG NHẬP GOOGLE OAUTH2
// ==========================================

// 1. API chuyển hướng người dùng sang trang Đăng nhập của Google
router.get('/google', passport.authenticate('google', { 
    scope: ['profile', 'email'] 
}));

// 2. API Callback - Nơi Google trả dữ liệu về sau khi đăng nhập thành công
router.get('/google/callback', 
    passport.authenticate('google', { 
        session: false, 
        failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=google_failed` 
    }),
    (req, res) => {
        try {
            // Lấy thông tin user do Passport trả về (từ DB)
            const user = req.user;
            
            // Cấp Token giống hệt như hàm Signin thông thường
            const { accessToken, refreshToken } = generateTokens(user);

            // Cài đặt Refresh Token vào HTTP-Only Cookie
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
                maxAge: 7 * 24 * 60 * 60 * 1000 
            });

            // Lấy URL Frontend (Cổng 5173 của ReactJS)
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            
            // Chuyển hướng người dùng về Frontend kèm theo Access Token trên thanh URL
            res.redirect(`${frontendUrl}/login?token=${accessToken}`);
        } catch (error) {
            console.error("Lỗi cấp token Google:", error);
            res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=oauth_failed`);
        }
    }
);

// ==========================================
// 🌟 API ĐĂNG NHẬP FACEBOOK
// ==========================================
router.get('/facebook', passport.authenticate('facebook', { scope: ['email', 'public_profile'] }));

router.get('/facebook/callback', 
    passport.authenticate('facebook', { 
        session: false, 
        failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=facebook_failed` 
    }),
    (req, res) => {
        try {
            const user = req.user;
            const { accessToken, refreshToken } = generateTokens(user);

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
                maxAge: 7 * 24 * 60 * 60 * 1000 
            });

            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            res.redirect(`${frontendUrl}/login?token=${accessToken}`);
        } catch (error) {
            console.error("Lỗi cấp token Facebook:", error);
            res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=oauth_failed`);
        }
    }
);

export default router;