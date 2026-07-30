import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import pool from '../database.js'; // Điều chỉnh path tùy theo cấu trúc dự án của bạn

// =========================================================================
// 1. CẤU HÌNH GOOGLE OAUTH STRATEGY
// =========================================================================
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/v1/auth/google/callback",
    proxy: true 
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails[0].value;
        const displayName = profile.displayName;
        const avatar = profile.photos[0]?.value || null;
        
        const username = email.split('@')[0];

        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        let user = userResult.rows[0];
        
        if (!user) {
            console.log("==> [Google Auth] Tạo mới user:", email);
            
            const newUser = await pool.query(
                `INSERT INTO users (full_name, username, email, avatar_url, role, status, password_hash, created_at, updated_at) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING *`,
                [displayName, username, email, avatar, 'buyer', 'active', 'GOOGLE_OAUTH_NO_PASSWORD']
            );
            user = newUser.rows[0];
        }

        if (user.status !== 'active') {
            console.warn(`⚠️ [Google Auth] Tài khoản ${email} bị từ chối do status: ${user.status}`);
            return done(null, false, { message: 'Tài khoản của bạn đã bị ngừng hoạt động.' });
        }

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

// =========================================================================
// 2. CẤU HÌNH FACEBOOK OAUTH STRATEGY
// =========================================================================
passport.use(new FacebookStrategy({
    // Sử dụng chính xác 100% tên biến trong file .env của bạn
    clientID: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    callbackURL: process.env.FACEBOOK_CALLBACK_URL,
    profileFields: ['id', 'displayName', 'photos', 'email'],
    proxy: true 
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Xử lý trường hợp người dùng tạo account FB bằng SĐT (không có email)
        const email = (profile.emails && profile.emails.length > 0) 
            ? profile.emails[0].value 
            : `${profile.id}@facebook.com`; 
            
        const displayName = profile.displayName || "Facebook User";
        const avatar = (profile.photos && profile.photos.length > 0) ? profile.photos[0].value : null;
        
        const username = email.split('@')[0];

        // Tìm user trong database
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        let user = userResult.rows[0];
        
        if (!user) {
            console.log("==> [Facebook Auth] Tạo mới user:", email);
            
            const newUser = await pool.query(
                `INSERT INTO users (full_name, username, email, avatar_url, role, status, password_hash, created_at, updated_at) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING *`,
                [displayName, username, email, avatar, 'buyer', 'active', 'FACEBOOK_OAUTH_NO_PASSWORD']
            );
            user = newUser.rows[0];
        }

        // Kiểm tra trạng thái tài khoản
        if (user.status !== 'active') {
            console.warn(`⚠️ [Facebook Auth] Tài khoản ${email} bị từ chối do status: ${user.status}`);
            return done(null, false, { message: 'Tài khoản của bạn đã bị ngừng hoạt động.' });
        }

        // Cập nhật last_login
        await pool.query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1',
            [user.user_id]
        );

        console.log(`==> ✅ [Facebook Auth] ${email} login thành công.`);
        return done(null, user);

    } catch (err) {
        console.error('❌ Lỗi tại Facebook Strategy:', err.message);
        return done(err, null);
    }
}));

// =========================================================================
// 3. PHẦN XỬ LÝ SERIALIZE / DESERIALIZE
// =========================================================================

passport.serializeUser((user, done) => {
    const idToStore = user.user_id; 

    if (!idToStore) {
        console.error("❌ LỖI: Object User không có user_id!", user);
        return done(new Error("Failed to serialize: user_id not found"), null);
    }

    done(null, idToStore);
});

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