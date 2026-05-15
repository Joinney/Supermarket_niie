import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import db from '../configs/database.js'; // Kiểm tra lại đường dẫn tới file db của Demi nhé

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails[0].value;
        const fullName = profile.displayName;
        const avatarUrl = profile.photos[0].value;

        // 1. Kiểm tra xem email này đã có trong DB chưa
        let userResult = await db.query("SELECT * FROM users WHERE email = $1", [email]);

        if (userResult.rows.length === 0) {
            // 2. Nếu chưa có -> INSERT người dùng mới
            // Demi nhớ kiểm tra các cột trong bảng users của mình có đúng tên không nhé
            userResult = await db.query(
                "INSERT INTO users (full_name, email, avatar_url, role, status) VALUES ($1, $2, $3, $4, $5) RETURNING *",
                [fullName, email, avatarUrl, 'customer', 'active']
            );
        }
        
        // 3. Trả về thông tin user
        return done(null, userResult.rows[0]);
    } catch (err) {
        console.error("Lỗi Passport Google:", err);
        return done(err, null);
    }
  }
));

// Lưu/Lấy user từ session
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

export default passport;