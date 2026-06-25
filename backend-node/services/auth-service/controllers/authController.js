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

// --- 1. ĐĂNG KÝ (SIGNUP) / THÊM NHÂN SỰ MỚI ---
export const signup = async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const ho_ten = req.body.ho_ten !== undefined ? req.body.ho_ten : req.body.fullName;
    const username = req.body.username || email.split("@")[0];
    const address = req.body.address || req.body.department || "Hệ thống Demi Mart";

    // 🎯 FIX LỖI ENUM "" TRỐNG: Kiểm tra và bọc lót chuỗi nghiêm ngặt
    let rawRole = req.body.role ? String(req.body.role).trim().toUpperCase() : "STAFF";
    if (rawRole.includes("STAFF") || rawRole.includes("NHÂN VIÊN")) rawRole = "STAFF";
    if (rawRole.includes("MANAGER") || rawRole.includes("QUẢN LÝ")) rawRole = "MANAGER";
    if (rawRole.includes("ADMIN")) rawRole = "ADMIN";

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const query = `
            INSERT INTO public.users (username, email, password_hash, full_name, role, address, status)
            VALUES ($1, $2, $3, $4, $5, $6, 'active')
            RETURNING user_id, username, email, role;
        `;
        
        const result = await pool.query(query, [username, email, hashedPassword, ho_ten, rawRole, address]);
        res.status(201).json({ success: true, message: "Cấp tài khoản nhân sự mới thành công!", data: result.rows[0] });
    } catch (error) {
        console.error("❌ Lỗi khi thêm nhân sự:", error.message);
        res.status(500).json({ success: false, error: "Không thể thêm nhân sự mới vào CSDL." });
    }
};

// --- 2. ĐĂNG NHẬP (SIGNIN) ---
export const signin = async (req, res) => {
    const { username, password } = req.body;
    try {
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
                avatar_url: user.avatar_url 
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

// --- 5. LẤY TOÀN BỘ DANH SÁCH NHÂN SỰ NỘI BỘ ---
export const getAllInternalUsers = async (req, res) => {
    try {
        const query = `
            SELECT user_id, username, email, full_name, phone_number, address, gender, birthday, role, status, avatar_url 
            FROM public.users 
            WHERE LOWER(role) <> 'buyer'
            ORDER BY user_id ASC;
        `;
        const { rows } = await pool.query(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error("❌ Lỗi CSDL tại getAllInternalUsers:", error.message);
        res.status(500).json({ success: false, error: "Lỗi kết nối CSDL khi lấy danh sách" });
    }
};

// --- 6. LẤY CHI TIẾT 1 NHÂN SỰ ---
export const getUserDetail = async (req, res) => {
    const { id } = req.params;
    try {
        const query = `SELECT user_id, username, email, full_name, phone_number, address, gender, birthday, role, status, avatar_url FROM public.users WHERE user_id = $1;`;
        const { rows } = await pool.query(query, [id]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: "Không tìm thấy user" });
        res.status(200).json(rows[0]);
    } catch (error) {
        res.status(500).json({ success: false, error: "Lỗi lấy chi tiết nhân sự" });
    }
};

// --- 7. LẤY DANH SÁCH ĐỒNG NGHIỆP CÙNG NHÓM QUYỀN ---
export const getUserRoleGroup = async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT user_id, username, email, full_name, address, role, avatar_url 
            FROM public.users 
            WHERE role = (SELECT role FROM public.users WHERE user_id = $1)
              AND user_id <> $1;
        `;
        const { rows } = await pool.query(query, [id]);
        res.status(200).json(rows);
    } catch (error) {
        console.error("❌ Lỗi tại getUserRoleGroup:", error.message);
        res.status(500).json({ success: false, error: "Lỗi lấy danh sách nhóm quyền" });
    }
};

// --- 8. CẬP NHẬT THÔNG TIN VÀ MA TRẬN PHÂN QUYỀN ---
export const updateUserDetail = async (req, res) => {
    const { id } = req.params;
    
    if (!id || id === "undefined") {
        return res.status(400).json({ success: false, message: "ID nhân sự không hợp lệ!" });
    }

    const fullName = req.body.full_name !== undefined ? req.body.full_name : req.body.fullName;
    const phoneNumber = req.body.phone_number !== undefined ? req.body.phone_number : req.body.phoneNumber;
    const address = req.body.address;
    const gender = req.body.gender;
    const birthday = req.body.birthday;
    const status = req.body.status || 'active';
    const avatarUrl = req.body.avatar_url !== undefined ? req.body.avatar_url : req.body.avatarUrl;
    
    // 🎯 ĐỌC DỮ LIỆU JSON QUYỀN GỬI TỪ FRONTEND
    const customPermissions = req.body.custom_permissions !== undefined ? req.body.custom_permissions : req.body.customPermissions;

    let rawRole = req.body.role ? String(req.body.role).trim().toUpperCase() : "STAFF";
    if (rawRole.includes("STAFF")) rawRole = "Staff";
    if (rawRole.includes("MANAGER")) rawRole = "Manager";
    if (rawRole.includes("ADMIN")) rawRole = "Admin";

    try {
        // 🎯 KÍCH HOẠT LẠI CỘT custom_permissions TRONG SQL
        const query = `
            UPDATE public.users
            SET 
                full_name = $1,
                phone_number = $2,
                address = $3,
                gender = $4,
                birthday = $5,
                role = $6,
                status = $7,
                avatar_url = $8,
                custom_permissions = $9 -- Lưu mảng JSON vào cột JSONB thật
            WHERE user_id = $10
            RETURNING user_id, username, email, full_name, role, status, custom_permissions;
        `;
        
        const { rows } = await pool.query(query, [
            fullName,
            phoneNumber,
            address,
            gender,
            birthday && birthday !== "" ? birthday : null,
            rawRole,
            status,
            avatarUrl,
            customPermissions ? JSON.stringify(customPermissions) : null, // Ép chuỗi JSON hợp lệ gửi xuống Postgres
            id
        ]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Không tìm thấy nhân sự để cập nhật!" });
        }

        res.status(200).json({ success: true, message: "Cập nhật PostgreSQL thành công!", data: rows[0] });
    } catch (error) {
        console.error("❌ Lỗi tại updateUserDetail:", error.message);
        res.status(500).json({ success: false, error: "Lỗi hệ thống khi cập nhật CSDL." });
    }
};