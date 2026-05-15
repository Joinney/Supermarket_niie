import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import pool from '../database.js';

// Cấu hình Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    // FIX: Linh động giữa Local và Render. Nếu không có biến môi trường thì dùng localhost
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback",
    // CỰC KỲ QUAN TRỌNG: Phải có proxy: true để chạy được trên Render (HTTPS)
    proxy: true 
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails[0].value;
        const displayName = profile.displayName;
        const avatar = profile.photos[0]?.value || null;

        // 1. Tìm user theo email
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        let user = userResult.rows[0];
        
        if (!user) {
            // 2. Nếu chưa có -> Tạo mới 
            console.log("==> [Google Auth] Tạo mới user:", email);
            const newUser = await pool.query(
                'INSERT INTO users (email, username, avatar_url, role, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [email, displayName, avatar, 'Buyer', 'active']
            );
            user = newUser.rows[0];
        }

        // 3. KIỂM TRA TRẠNG THÁI (STATUS)
        // Demi có thể vào DB đổi status thành 'inactive' hoặc 'banned' để test chặn login
        if (user.status !== 'active') {
            console.warn(`⚠️ [Google Auth] Tài khoản ${email} bị từ chối do status: ${user.status}`);
            return done(null, false, { message: 'Tài khoản của bạn đã bị ngừng hoạt động.' });
        }

        // 4. CẬP NHẬT NGÀY ĐĂNG NHẬP GẦN NHẤT (last_login)
        await pool.query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1',
            [user.user_id]
        );

        console.log(`==> ✅ [Google Auth] ${email} login thành công.`);
        return done(null, user);

    } catch (err) {
        console.error('❌ Lỗi tại Google Strategy:', err.message);
        return done(err, null);
    }
}));

/**
 * PHẦN XỬ LÝ SESSION - ĐÃ FIX THEO CỘT user_id
 */

// 1. Serialize: Lưu user_id vào session
passport.serializeUser((user, done) => {
    const idToStore = user.user_id; 

    if (!idToStore) {
        console.error("❌ LỖI: Object User không có user_id!", user);
        return done(new Error("Failed to serialize: user_id not found"), null);
    }

    done(null, idToStore);
});

// 2. Deserialize: Tìm user dựa trên user_id từ session
passport.deserializeUser(async (id, done) => {
    try {
        const result = await pool.query('SELECT * FROM users WHERE user_id = $1', [id]);
        
        if (result.rows.length === 0) {
            return done(null, false);
        }
        
        done(null, result.rows[0]);
    } catch (err) {
        console.error("❌ Lỗi DeserializeUser:", err);
        done(err, null);
    }
});

export default passport;