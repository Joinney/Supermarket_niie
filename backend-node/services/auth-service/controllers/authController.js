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

    // 🎯 ĐỌC URL ẢNH TỪ CLOUDINARY: Nếu có upload file thì lấy URL Cloudinary, nếu không thì lấy avatarUrl text (nếu có)
    const avatar_url = req.file ? req.file.path : (req.body.avatarUrl || "");

    let rawRole = req.body.role ? String(req.body.role).trim().toUpperCase() : "STAFF";
    if (rawRole.includes("STAFF") || rawRole.includes("NHÂN VIÊN")) rawRole = "Staff";
    if (rawRole.includes("MANAGER") || rawRole.includes("QUẢN LÝ")) rawRole = "Manager";
    if (rawRole.includes("ADMIN")) rawRole = "Admin";

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const query = `
            INSERT INTO public.users (username, password_hash, email, full_name, role, address, status, avatar_url, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, NOW(), NOW())
            RETURNING user_id, username, email, role, avatar_url;
        `;
        
        const result = await pool.query(query, [username, hashedPassword, email, ho_ten, rawRole, address, avatar_url]);
        res.status(201).json({ success: true, message: "Cấp tài khoản nhân sự mới thành công!", data: result.rows[0] });
    } catch (error) {
        console.error("❌ Lỗi khi thêm nhân sự:", error.message);
        res.status(500).json({ success: false, error: "Không thể thêm nhân sự mới vào CSDL." });
    }
};


// --- 2. ĐĂNG NHẬP (SIGNIN) - BẢN CẬP NHẬT LƯU THIẾT BỊ VÀ IP ĐỘNG HOÀN CHỈNH ---
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

        // 🎯 GOM KHỐI ĐỌC THÔNG TIN TRÌNH DUYỆT VÀ IP CHUẨN HOÁ
        const userAgent = req.headers['user-agent'] || 'Unknown Browser';
        
        // Bốc IP ưu tiên qua các lớp proxy của Docker
        let clientIp = req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress || '127.0.0.1';

        let browserName = "Thiết bị khác";
        if (userAgent.includes("Edg")) browserName = "Edge";
        else if (userAgent.includes("Chrome")) browserName = "Chrome";
        else if (userAgent.includes("Safari")) browserName = "Safari";
        else if (userAgent.includes("Firefox")) browserName = "Firefox";

        // Nếu IP chứa dấu phẩy do đi qua nhiều tầng proxy, lấy địa chỉ IP đầu tiên (IP gốc của Client)
        if (clientIp.includes(',')) {
            clientIp = clientIp.split(',')[0].trim();
        }

        // Làm sạch ký tự tiền tố IPv6
        clientIp = clientIp.replace('::ffff:', '');

        // 🎯 XỬ LÝ ĐỘNG XUYÊN DOCKER LOCAL:
        // 1. Nếu chính máy của Thuận đăng nhập (qua localhost/127.0.0.1/::1) -> Ánh xạ về IP Wi-Fi máy bạn để demo chuẩn
        if (clientIp === '::1' || clientIp === '127.0.0.1') {
            clientIp = '10.234.128.1'; 
        } 
        // 2. Nếu đi qua cầu Docker và nhận IP ảo Gateway (172.x)
        else if (clientIp.startsWith('172.')) {
            // Kiểm tra xem header có chứa IP thật của máy khác trong mạng LAN không
            const realIp = req.headers['x-real-ip'] || req.headers['x-forwarded-for'];
            if (realIp) {
                clientIp = realIp.replace('::ffff:', '').split(',')[0].trim();
            } else {
                // Nếu Docker nuốt mất IP nguồn khi gọi nội bộ từ chính máy chủ, gán dải máy bạn làm chuẩn
                // Nhưng nếu là thiết bị khác gọi tới, hệ thống vẫn ưu tiên giữ hoặc nhận diện theo mạng LAN
                clientIp = '10.234.128.1';
            }
        }

        const deviceString = `${browserName} (IP: ${clientIp})`;

        // 🎯 LƯU TRỰC TIẾP VÀO CƠ SỞ DỮ LIỆU POSTGRESQL
        try {
            await pool.query(
                `UPDATE public.users 
                 SET refresh_token = $1, 
                     last_login = NOW(), 
                     last_login_device = $2 
                 WHERE user_id = $3`, 
                [refreshToken, deviceString, user.user_id]
            );
        } catch (dbError) {
            console.error("❌ Lỗi khi cập nhật IP/Device vào CSDL:", dbError.message);
        }

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

// --- 5. LẤY TOÀN BỘ DANH SÁCH NHÂN SỰ NỘI BỘ (BẢN FIX LỖI F5 BỊ RESET) ---
export const getAllInternalUsers = async (req, res) => {
    try {
        const query = `
            SELECT 
                user_id, 
                username, 
                email, 
                full_name, 
                phone_number, 
                address, 
                gender, 
                birthday, 
                role, 
                status, 
                avatar_url,
                custom_permissions,-- 🎯 QUAN TRỌNG: Thêm cột này vào đây để khi F5 trang danh sách bốc được dữ liệu live!
                last_login,
                last_login_device 
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

// --- 8. CẬP NHẬT THÔNG TIN VÀ MA TRẬN PHÂN QUYỀN  ---
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
    
    // 🎯 ĐỌC URL ẢNH TỪ CLOUDINARY KHI UPDATE: Ưu tiên file mới tải lên
    const avatarUrl = req.file ? req.file.path : (req.body.avatar_url || req.body.avatarUrl);
    
    const customPermissions = req.body.custom_permissions !== undefined ? req.body.custom_permissions : req.body.customPermissions;

    let rawRole = req.body.role ? String(req.body.role).trim().toUpperCase() : "STAFF";
    if (rawRole.includes("STAFF")) rawRole = "Staff";
    if (rawRole.includes("MANAGER")) rawRole = "Manager";
    if (rawRole.includes("ADMIN")) rawRole = "Admin";

    try {
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
                custom_permissions = $9,
                updated_at = NOW()
            WHERE user_id = $10
            RETURNING user_id, username, email, full_name, role, status, avatar_url, custom_permissions;
        `;
        
        const { rows } = await pool.query(query, [
            fullName || null,
            phoneNumber || null,
            address || null,
            gender || null,
            birthday && birthday !== "" ? birthday : null,
            rawRole,
            status,
            avatarUrl || null,
            customPermissions ? (typeof customPermissions === "string" ? customPermissions : JSON.stringify(customPermissions)) : null,
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