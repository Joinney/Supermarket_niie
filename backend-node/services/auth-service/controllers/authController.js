import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../configs/database.js';

// --- HÀM TẠO TOKEN ---
const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { id: user.user_id, role: user.role },
        process.env.JWT_ACCESS_SECRET || 'vdt_secret_2026',
        { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
        { id: user.user_id },
        process.env.JWT_REFRESH_SECRET || 'vdt_refresh_secret_2026',
        { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
};

// --- 1. ĐĂNG KÝ (SIGNUP) ---
export const signup = async (req, res) => {
    const { 
        username, password, email, full_name, 
        phone, gender, birth_date, address 
    } = req.body;

    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const query = `
            INSERT INTO users (
                username, password_hash, email, full_name, 
                phone_number, address, gender, birthday, role, status, avatar_url
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Buyer', 'active', NULL) 
            RETURNING user_id, username, email, full_name, avatar_url;
        `;
        
        const values = [username, passwordHash, email, full_name, phone, address, gender, birth_date];
        const result = await pool.query(query, values);

        res.status(201).json({ 
            message: "Đăng ký thành công!", 
            user: result.rows[0] 
        });

    } catch (error) {
        console.error("Signup Error:", error);
        res.status(500).json({ error: error.message });
    }
};

// --- 2. ĐĂNG NHẬP (SIGNIN) ---
export const signin = async (req, res) => {
    const { username, password } = req.body;
    try {
        // --- CẬP NHẬT: Đảm bảo lấy trường avatar_url từ Database ---
        const userResult = await pool.query(
            'SELECT user_id, username, password_hash, email, role, full_name, avatar_url FROM users WHERE username = $1 OR email = $1', 
            [username]
        );
        
        if (userResult.rows.length === 0) return res.status(404).json({ message: "Tài khoản không tồn tại!" });

        const user = userResult.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(400).json({ message: "Mật khẩu sai rồi Demi ơi!" });

        const { accessToken, refreshToken } = generateTokens(user);

        // Lưu Refresh Token vào DB
        await pool.query(
            'UPDATE users SET refresh_token = $1, last_login = NOW() WHERE user_id = $2', 
            [refreshToken, user.user_id]
        );

        // Gửi Refresh Token qua Cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', 
            sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 
        });

        // --- CẬP NHẬT: Trả về đầy đủ object user bao gồm avatar_url ---
       res.status(200).json({
            message: "Chào mừng Demi trở lại!",
            token: accessToken,
            refreshToken: refreshToken,
            user: {
                id: user.user_id,
                username: user.username,
                email: user.email,
                role: user.role,
                full_name: user.full_name,
                avatar_url: user.avatar_url // <--- DEMI PHẢI THÊM DÒNG NÀY VÀO ĐÂY
            }
            });
    } catch (error) {
        console.error("Signin Error:", error);
        res.status(500).json({ error: "Lỗi hệ thống, kiểm tra lại biến môi trường!" });
    }
};

// --- 3. LÀM MỚI TOKEN ---
export const refreshToken = async (req, res) => {
    const token = req.cookies.refreshToken || req.body.refreshToken;

    if (!token) return res.status(401).json({ message: "Phiên làm việc hết hạn!" });

    try {
        const userResult = await pool.query('SELECT * FROM users WHERE refresh_token = $1', [token]);
        if (userResult.rows.length === 0) return res.status(403).json({ message: "Phiên không hợp lệ!" });

        const user = userResult.rows[0];

        jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'vdt_refresh_secret_2026', (err, decoded) => {
            if (err) return res.status(403).json({ message: "Token không hợp lệ!" });

            const newAccessToken = jwt.sign(
                { id: user.user_id, role: user.role },
                process.env.JWT_ACCESS_SECRET || 'vdt_secret_2026',
                { expiresIn: '15m' }
            );

            res.json({ token: newAccessToken });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- 4. ĐĂNG XUẤT ---
export const logout = async (req, res) => {
    try {
        const token = req.cookies.refreshToken || req.body.refreshToken;

        if (token) {
            await pool.query('UPDATE users SET refresh_token = NULL WHERE refresh_token = $1', [token]);
        }

        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
        });
        
        res.status(200).json({ message: "Đã đăng xuất thành công. Hẹn gặp lại Demi!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};