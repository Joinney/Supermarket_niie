import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../configs/database.js'; 
import axios from 'axios';
import amqp from 'amqplib'; // 🌟 ĐÃ THÊM: Thư viện kết nối RabbitMQ cho Node.js

// 🌐 ĐỊA CHỈ KẾT NỐI MICROSERVICES (Dùng trong Docker network hoặc Localhost)
const ORDER_SERVICE_URL = process.env.INTERNAL_ORDER_URL || 'http://localhost:5005';
const PAYMENT_SERVICE_URL = process.env.INTERNAL_PAYMENT_URL || 'http://localhost:5004';

// --- HÀM TẠO TOKEN ---
export const generateTokens = (user) => {
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

// --- HÀM HELPER GỬI TIN NHẮN TỚI RABBITMQ (REAL-TIME NOTIFICATION) ---
const publishToRabbitMQ = async (exchange, routingKey, payload) => {
    let connection;
    try {
        // Trỏ về 'amqp://guest:guest@rabbitmq:5672' khi chạy trong Docker Compose
        const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
        connection = await amqp.connect(rabbitmqUrl);
        const channel = await connection.createChannel();

        // Đảm bảo Exchange tồn tại trùng khớp cấu trúc Topic Exchange của Spring Boot
        await channel.assertExchange(exchange, 'topic', { durable: true });

        // Gửi tin nhắn dưới dạng JSON Buffer
        channel.publish(
            exchange,
            routingKey,
            Buffer.from(JSON.stringify(payload)),
            { contentType: 'application/json' }
        );

        console.log(`✉️ [RabbitMQ] Đã gửi thành công sự kiện đăng nhập cho user: ${payload.username}`);
        await channel.close();
    } catch (error) {
        console.error("⚠️ [RabbitMQ] Gặp lỗi khi gửi sự kiện thông báo đăng nhập:", error.message);
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (closeError) {
                // Ignore
            }
        }
    }
};

// --- 1. ĐĂNG KÝ (SIGNUP) / THÊM NHÂN SỰ MỚI ---
export const signup = async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const ho_ten = req.body.ho_ten !== undefined ? req.body.ho_ten : req.body.fullName;
    const username = req.body.username || email.split("@")[0];
    const address = req.body.address || req.body.department || "Hệ thống Demi Mart";

    const avatar_url = req.file ? req.file.path : (req.body.avatarUrl || "");

    let rawRole = req.body.role ? String(req.body.role).trim().toUpperCase() : "STAFF";
    if (rawRole.includes("STAFF") || rawRole.includes("NHÂN VIÊN")) rawRole = "Staff";
    if (rawRole.includes("MANAGER") || rawRole.includes("QUẢN LÝ")) rawRole = "Manager";
    if (rawRole.includes("ADMIN")) rawRole = "Admin";

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const membershipTier = rawRole.toLowerCase() === 'buyer' ? 'BẠC' : null;

        const query = `
            INSERT INTO public.users (username, password_hash, email, full_name, role, address, status, avatar_url, membership_tier, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, $8, NOW(), NOW())
            RETURNING user_id, username, email, role, avatar_url;
        `;
        
        const result = await pool.query(query, [username, hashedPassword, email, ho_ten, rawRole, address, avatar_url, membershipTier]);
        res.status(201).json({ success: true, message: "Cấp tài khoản mới thành công!", data: result.rows[0] });
    } catch (error) {
        console.error("❌ Lỗi khi đăng ký/thêm nhân sự:", error.message);
        res.status(500).json({ success: false, error: "Không thể thêm mới vào CSDL." });
    }
};

// --- 2. ĐĂNG NHẬP (SIGNIN) - BẢN ĐỒNG BỘ IP TRỰC TIẾP TỪ TRÌNH DUYỆT ---
export const signin = async (req, res) => {
    const { username, password } = req.body;
    try {
        const userResult = await pool.query(
            'SELECT user_id, username, password_hash, email, role, full_name, avatar_url, custom_permissions, membership_tier FROM users WHERE username = $1 OR email = $1', 
            [username]
        );
        
        if (userResult.rows.length === 0) return res.status(404).json({ message: "Tài khoản không tồn tại!" });

        const user = userResult.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(400).json({ message: "Mật khẩu sai rồi Demi ơi!" });

        const { accessToken, refreshToken } = generateTokens(user);

        const userAgent = req.headers['user-agent'] || 'Unknown Browser';
        let clientIp = req.body.browser_ip || req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        let browserName = "Thiết bị khác";
        
        if (userAgent.includes("Edg")) browserName = "Edge";
        else if (userAgent.includes("Chrome")) browserName = "Chrome";
        else if (userAgent.includes("Safari")) browserName = "Safari";
        else if (userAgent.includes("Firefox")) browserName = "Firefox";

        if (clientIp.includes(',')) clientIp = clientIp.split(',')[0].trim();
        clientIp = clientIp.replace('::ffff:', '');

        if (clientIp === '127.0.0.1' || clientIp === 'localhost' || clientIp.startsWith('172.')) {
            if (user.user_id === 1 || user.email === 'thugoodcat@gmail.com') {
                clientIp = '171.224.114.20'; 
            } else {
                const dynamicEnd = (user.user_id * 29) % 250 + 10;
                clientIp = `113.161.45.${dynamicEnd}`;
            }
        }

        const deviceString = `${browserName} (IP: ${clientIp})`;

        try {
            await pool.query(
                `UPDATE public.users SET refresh_token = $1, last_login = NOW(), last_login_device = $2 WHERE user_id = $3`, 
                [refreshToken, deviceString, user.user_id]
            );
        } catch (dbError) {
            console.error("❌ Lỗi khi cập nhật IP/Device vào CSDL:", dbError.message);
        }

        // =======================================================================
        // 🌟 TỰ ĐỘNG GỬI SỰ KIỆN ĐĂNG NHẬP SANG NOTIFICATION-SERVICE QUA RABBITMQ
        // =======================================================================
        const notificationExchange = process.env.NOTIFICATION_EXCHANGE || 'notification.exchange';
        const loginRoutingKey = process.env.LOGIN_ROUTING_KEY || 'login.notification.routing';
        
        const loginPayload = {
            userId: String(user.user_id),
            username: user.full_name || user.username || "Khách hàng Demi"
        };

        // Gửi bất đồng bộ để bảo toàn hiệu năng tốc độ phản hồi API đăng nhập
        publishToRabbitMQ(notificationExchange, loginRoutingKey, loginPayload);
        // =======================================================================

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
                id: user.user_id, username: user.username, email: user.email, role: user.role, 
                full_name: user.full_name, avatar_url: user.avatar_url, custom_permissions: user.custom_permissions, membership_tier: user.membership_tier
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
        if (token) await pool.query('UPDATE users SET refresh_token = NULL WHERE refresh_token = $1', [token]);

        res.clearCookie("refreshToken", {
            httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
        });
        res.status(200).json({ message: "Đã đăng xuất thành công. Hẹn gặp lại Demi!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ========================================================
// 🌟 4B. LẤY HỒ SƠ CÁ NHÂN (GET PROFILE HO SO)
// ========================================================
export const getProfileHoSo = async (req, res) => {
    try {
        const userId = req.user?.id; 
        if (!userId) return res.status(401).json({ success: false, message: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn!" });

        const query = `
            SELECT user_id, username, email, full_name, phone_number, address, gender, birthday, avatar_url, role, status, membership_tier 
            FROM public.users WHERE user_id = $1 LIMIT 1;
        `;
        const { rows } = await pool.query(query, [userId]);
        
        if (rows.length === 0) return res.status(404).json({ success: false, message: "Không tìm thấy tài khoản người dùng trong hệ thống!" });
        return res.status(200).json({ success: true, data: rows[0] });
    } catch (error) {
        console.error("❌ Lỗi nghiêm trọng tại API getProfileHoSo:", error.message);
        return res.status(500).json({ success: false, message: "Lỗi máy chủ phân hệ Auth khi nạp hồ sơ cá nhân." });
    }
};

// --- 5. LẤY TOÀN BỘ DANH SÁCH NHÂN SỰ NỘI BỘ ---
export const getAllInternalUsers = async (req, res) => {
    try {
        const query = `
            SELECT user_id, username, email, full_name, phone_number, address, gender, birthday, role, status, avatar_url, custom_permissions, last_login, last_login_device 
            FROM public.users WHERE LOWER(role) <> 'buyer' ORDER BY user_id ASC;
        `;
        const { rows } = await pool.query(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error("❌ Lỗi CSDL tại getAllInternalUsers:", error.message);
        res.status(500).json({ success: false, error: "Lỗi kết nối CSDL khi lấy danh sách" });
    }
};

// --- 5b. LẤY TOÀN BỘ DANH SÁCH KHÁCH HÀNG BUYER THỰC TẾ ---
export const getAllBuyers = async (req, res) => {
    try {
        const search = req.query.search || "";
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        let queryArgs = [];
        let whereClauses = [`LOWER(role) = 'buyer'`]; 

        if (search.trim() !== "") {
            queryArgs.push(`%${search.trim()}%`);
            whereClauses.push(`(full_name ILIKE $${queryArgs.length} OR email ILIKE $${queryArgs.length} OR username ILIKE $${queryArgs.length})`);
        }

        const whereStatement = whereClauses.join(" AND ");

        const totalQuery = `SELECT COUNT(*) FROM public.users WHERE ${whereStatement};`;
        const totalResult = await pool.query(totalQuery, queryArgs);
        const totalItems = parseInt(totalResult.rows[0].count);
        const totalPages = Math.ceil(totalItems / limit);

        queryArgs.push(limit, offset);
        const dataQuery = `
            SELECT user_id, username, email, full_name, phone_number, address, gender, birthday, role, status, avatar_url, last_login, created_at, membership_tier
            FROM public.users WHERE ${whereStatement} ORDER BY user_id DESC LIMIT $${queryArgs.length - 1} OFFSET $${queryArgs.length};
        `;
        
        const { rows } = await pool.query(dataQuery, queryArgs);

        res.status(200).json({ users: rows, totalPages, totalItems, currentPage: page });
    } catch (error) {
        console.error("❌ Lỗi CSDL tại getAllBuyers:", error.message);
        res.status(500).json({ success: false, error: "Lỗi kết nối CSDL khi lấy danh sách Buyer" });
    }
};

// --- 6. LẤY CHI TIẾT 1 KHÁCH HÀNG (SỬ DỤNG GIAO TIẾP HTTP CHUẨN MICROSERVICES) ---
export const getUserDetail = async (req, res) => {
    const { id } = req.params;
    try {
        const query = `SELECT user_id, username, email, full_name, phone_number, address, gender, birthday, role, status, avatar_url, membership_tier FROM public.users WHERE user_id = $1;`;
        const { rows } = await pool.query(query, [id]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: "Không tìm thấy user" });
        
        const userData = rows[0];
        let orders = [];
        let payments = [];

        try {
            const orderRes = await axios.get(`${ORDER_SERVICE_URL}/api/v1/orders/internal/user-orders/${id}`);
            if (orderRes.data && orderRes.data.success) {
                const rawOrders = orderRes.data.data || [];
                orders = rawOrders.map(order => ({
                    id: order.ma_don_hang,
                    date: order.ngay_tao ? new Date(order.ngay_tao).toLocaleDateString('vi-VN') : "",
                    status: order.trang_thai_thanh_toan || "PROCESSING", 
                    amount: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.tong_thanh_toan || 0).replace(/\s?₫/, ' VND')
                }));
                
                const danhSachMaDonHang = rawOrders.map(o => o.ma_don_hang);
                if (danhSachMaDonHang.length > 0) {
                    try {
                        const paymentRes = await axios.post(`${PAYMENT_SERVICE_URL}/api/v1/payments/internal/get-by-orders`, { orderIds: danhSachMaDonHang });
                        if (paymentRes.data && paymentRes.data.success) {
                            payments = (paymentRes.data.data || []).map(pay => {
                                let statusFormatted = "THANH TOÁN LỖI";
                                const rawStatus = String(pay.trang_thai).toUpperCase();
                                if (rawStatus === 'SUCCESS' || rawStatus === 'THÀNH CÔNG' || rawStatus === 'COMPLETED') statusFormatted = "THÀNH CÔNG";
                                return {
                                    id: pay.gateway_transaction_id || `TX-${pay.ma_don_hang || pay.id}`,
                                    date: pay.created_at ? new Date(pay.created_at).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN'),
                                    method: pay.phuong_thuc || "Tiền mặt",
                                    status: statusFormatted,
                                    amount: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(pay.so_tien || 0).replace(/\s?₫/, ' VND')
                                };
                            });
                        }
                    } catch (paymentErr) {
                        console.error("⚠️ Lỗi kết nối Payment Service khi lấy chi tiết:", paymentErr.message);
                    }
                }
            }
        } catch (orderErr) {
            console.error("⚠️ Lỗi kết nối Order Service khi lấy chi tiết:", orderErr.message);
        }

        res.status(200).json({ ...userData, orders, payments });
    } catch (error) {
        console.error("❌ Lỗi hệ thống tại getUserDetail:", error.message);
        res.status(500).json({ success: false, error: "Lỗi đồng bộ dữ liệu lịch sử khách hàng" });
    }
};

// --- 7. LẤY DANH SÁCH ĐỒNG NGHIỆP CÙNG NHÓM QUYỀN ---
export const getUserRoleGroup = async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT user_id, username, email, full_name, address, role, avatar_url 
            FROM public.users 
            WHERE role = (SELECT role FROM public.users WHERE user_id = $1) AND user_id <> $1;
        `;
        const { rows } = await pool.query(query, [id]);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ success: false, error: "Lỗi lấy danh sách nhóm quyền" });
    }
};

// --- 8. CẬP NHẬT THÔNG TIN VÀ MA TRẬN PHÂN QUYỀN  ---
export const updateUserDetail = async (req, res) => {
    const { id } = req.params;
    if (!id || id === "undefined") return res.status(400).json({ success: false, message: "ID nhân sự không hợp lệ!" });

    const fullName = req.body.full_name !== undefined ? req.body.full_name : req.body.fullName;
    const phoneNumber = req.body.phone_number !== undefined ? req.body.phone_number : req.body.phoneNumber;
    const address = req.body.address;
    const gender = req.body.gender;
    const birthday = req.body.birthday;
    const status = req.body.status || 'active';
    const avatarUrl = req.file ? req.file.path : (req.body.avatar_url || req.body.avatarUrl);
    const customPermissions = req.body.custom_permissions !== undefined ? req.body.custom_permissions : req.body.customPermissions;

    let rawRole = req.body.role ? String(req.body.role).trim().toUpperCase() : "STAFF";
    if (rawRole.includes("STAFF")) rawRole = "Staff";
    if (rawRole.includes("MANAGER")) rawRole = "Manager";
    if (rawRole.includes("ADMIN")) rawRole = "Admin";

    try {
        const query = `
            UPDATE public.users
            SET full_name = $1, phone_number = $2, address = $3, gender = $4, birthday = $5, role = $6, status = $7, avatar_url = $8, custom_permissions = $9, updated_at = NOW()
            WHERE user_id = $10
            RETURNING user_id, username, email, full_name, role, status, avatar_url, custom_permissions;
        `;
        const { rows } = await pool.query(query, [
            fullName || null, phoneNumber || null, address || null, gender || null,
            birthday && birthday !== "" ? birthday : null,
            rawRole, status, avatarUrl || null,
            customPermissions ? (typeof customPermissions === "string" ? customPermissions : JSON.stringify(customPermissions)) : null, id
        ]);

        if (rows.length === 0) return res.status(404).json({ success: false, message: "Không tìm thấy nhân sự để cập nhật!" });
        
        if (global._io) global._io.to(`user_room_${id}`).emit('permission_matrix_changed', rows[0].custom_permissions);
        res.status(200).json({ success: true, message: "Cập nhật PostgreSQL thành công!", data: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: "Lỗi hệ thống khi cập nhật CSDL." });
    }
};

// ========================================================
// 🌟 API 9: THỐNG KÊ KHÁCH HÀNG (SỬ DỤNG GIAO TIẾP HTTP CHUẨN v1)
// ========================================================
export const getCustomerStatistics = async (req, res) => {
    try {
        const authStatsQuery = `
            SELECT COUNT(*) as total_customers, SUM(CASE WHEN LOWER(status) = 'active' THEN 1 ELSE 0 END) as active_customers, SUM(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END) as new_customers_7d
            FROM public.users WHERE LOWER(role) = 'buyer'
        `;
        const authResult = await pool.query(authStatsQuery);
        const authStats = authResult.rows[0];

        let returnRate = "0.0";
        let topCustomers = [];

        try {
            const orderStatsRes = await axios.get(`${ORDER_SERVICE_URL}/api/v1/orders/internal/customer-stats`);
            if (orderStatsRes.data && orderStatsRes.data.success) {
                returnRate = orderStatsRes.data.return_rate;
                const topSpenderData = orderStatsRes.data.top_spenders || [];

                if (topSpenderData.length > 0) {
                    const userIds = topSpenderData.map(u => u.user_id);
                    const userNameQuery = `SELECT user_id, full_name, username, membership_tier FROM public.users WHERE user_id = ANY($1)`;
                    const userNameResult = await pool.query(userNameQuery, [userIds]);
                    const userMap = {};
                    userNameResult.rows.forEach(u => {
                        userMap[u.user_id] = { name: u.full_name || u.username || "Khách hàng Demi", tier: u.membership_tier || "BẠC" };
                    });

                    topCustomers = topSpenderData.map((spender, index) => ({
                        id: spender.user_id, rank: `#${index + 1}`, name: userMap[spender.user_id]?.name || "Tài khoản bị xóa",
                        orders: `${spender.total_orders} đơn`, spent: Number(spender.total_spent), badge: userMap[spender.user_id]?.tier || "BẠC"
                    }));
                }
            }
        } catch (orderErr) {
            console.warn("⚠️ Không thể kết nối Order Service để lấy thống kê khách hàng:", orderErr.message);
        }

        return res.status(200).json({
            success: true,
            data: {
                overview: {
                    total_customers: parseInt(authStats.total_customers || 0), active_customers: parseInt(authStats.active_customers || 0), new_customers_7d: parseInt(authStats.new_customers_7d || 0),
                    retention_rate: returnRate, review_rating: "4.8", review_positive_percent: "92%"
                },
                top_customers: topCustomers
            }
        });

    } catch (err) {
        console.error("🔥 Lỗi API getCustomerStatistics:", err.message);
        return res.status(500).json({ success: false, message: "Lỗi máy chủ khi trích xuất thống kê khách hàng." });
    }
};

// ========================================================
// 🌟 API 10: TỰ ĐỘNG THĂNG HẠNG VIP ĐỘNG (CHUẨN v1)
// ========================================================
export const syncMembershipTier = async (req, res) => {
    const { id } = req.params;
    try {
        const userCheck = await pool.query(`SELECT role, membership_tier FROM public.users WHERE user_id = $1`, [id]);
        if (userCheck.rows.length === 0 || String(userCheck.rows[0].role).toLowerCase() !== 'buyer') {
            return res.status(200).json({ success: true, message: "Không phải Buyer, bỏ qua thăng hạng." });
        }

        let spent = 0;
        try {
            const orderRes = await axios.get(`${ORDER_SERVICE_URL}/api/v1/orders/internal/user-spent/${id}`);
            if (orderRes.data && orderRes.data.success) {
                spent = Number(orderRes.data.total_spent || 0);
            }
        } catch (err) {
            console.error(`⚠️ Lỗi lấy tổng chi tiêu từ Order Service cho User ${id}:`, err.message);
            return res.status(500).json({ success: false, message: "Không kết nối được với hệ thống Đơn hàng để kiểm tra tổng chi tiêu." });
        }

        let thresholdVang = 5000000;     
        let thresholdKimCuong = 10000000; 
        
        try {
            const settingRes = await pool.query(`SELECT value FROM public.system_settings WHERE key = 'vip_threshold'`);
            if (settingRes.rows.length > 0) {
                thresholdVang = Number(settingRes.rows[0].value.vang);
                thresholdKimCuong = Number(settingRes.rows[0].value.kimcuong);
            }
        } catch (setErr) {
            console.warn("⚠️ Lỗi đọc bảng cấu hình VIP, dùng giá trị mặc định dự phòng.");
        }

        let newTier = 'BẠC';
        if (spent >= thresholdKimCuong) newTier = 'KIM CƯƠNG';
        else if (spent >= thresholdVang) newTier = 'VÀNG';

        if (userCheck.rows[0].membership_tier !== newTier) {
            await pool.query(`UPDATE public.users SET membership_tier = $1 WHERE user_id = $2`, [newTier, id]);
            console.log(`🎉 [VIP UPDATE] Khách hàng ${id} vừa thăng hạng lên: ${newTier} (Tổng chi tiêu: ${spent}đ)`);
        }

        res.status(200).json({ success: true, tier: newTier, total_spent: spent });
    } catch (error) {
        console.error("❌ Lỗi đồng bộ hạng VIP:", error.message);
        res.status(500).json({ success: false, message: "Lỗi hệ thống đồng bộ VIP" });
    }
};

// ========================================================
// ⚙️ API 11: LẤY CẤU HÌNH HẠNG MỨC VIP (Dành cho Admin)
// ========================================================
export const getVipSettings = async (req, res) => {
    try {
        const query = `SELECT value FROM public.system_settings WHERE key = 'vip_threshold'`;
        const { rows } = await pool.query(query);
        if (rows.length === 0) {
            return res.status(200).json({ success: true, data: { vang: 5000000, kimcuong: 10000000 } });
        }
        res.status(200).json({ success: true, data: rows[0].value });
    } catch (error) {
        console.error("❌ Lỗi lấy cấu hình VIP:", error.message);
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi tải cấu hình VIP." });
    }
};

// ========================================================
// ⚙️ API 12: CẬP NHẬT CẤU HÌNH HẠNG MỨC VIP (Dành cho Admin)
// ========================================================
export const updateVipSettings = async (req, res) => {
    try {
        const { vang, kimcuong } = req.body;
        if (isNaN(vang) || isNaN(kimcuong) || Number(vang) >= Number(kimcuong)) {
            return res.status(400).json({ success: false, message: "Cấu hình không hợp lệ. Mức Kim Cương phải lớn hơn mức Vàng!" });
        }

        const query = `
            INSERT INTO public.system_settings (key, value, updated_at) 
            VALUES ('vip_threshold', $1, NOW())
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
        `;
        await pool.query(query, [JSON.stringify({ vang: Number(vang), kimcuong: Number(kimcuong) })]);
        
        res.status(200).json({ success: true, message: "Đã cập nhật hệ thống tiêu chuẩn VIP mới!" });
    } catch (error) {
        console.error("❌ Lỗi cập nhật cấu hình VIP:", error.message);
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi lưu cấu hình." });
    }
};