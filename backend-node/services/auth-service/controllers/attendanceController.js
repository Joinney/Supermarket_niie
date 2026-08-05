import db from '../configs/database.js';

// 1. [GET] Lấy trạng thái chấm công HÔM NAY của nhân viên
export const getTodayAttendance = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const query = `
            SELECT * FROM public.attendance_records 
            WHERE user_id = $1 AND work_date = CURRENT_DATE
        `;
        const result = db.query ? await db.query(query, [userId]) : await db.execute(query, [userId]);
        const record = result.rows ? result.rows[0] : result[0];

        if (!record) {
            return res.status(200).json({ success: true, data: { status: 'NOT_CHECKED_IN' } });
        }

        if (record && !record.check_out_time) {
            return res.status(200).json({ success: true, data: { status: 'CHECKED_IN', record } });
        }

        return res.status(200).json({ success: true, data: { status: 'COMPLETED', record } });
    } catch (error) {
        console.error("Lỗi lấy trạng thái chấm công:", error);
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi tải dữ liệu chấm công." });
    }
};

// 2. [POST] Xử lý Nút Bấm: Tự động nhận diện là Check-in hay Check-out
export const handleAttendanceAction = async (req, res) => {
    try {
        const userId = req.user.id;
        // Lấy IP của nhân viên (Hỗ trợ chống gian lận sau này)
        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        // Kiểm tra xem hôm nay đã có record nào chưa
        const checkQuery = `SELECT id, check_in_time, check_out_time FROM public.attendance_records WHERE user_id = $1 AND work_date = CURRENT_DATE`;
        const checkRes = db.query ? await db.query(checkQuery, [userId]) : await db.execute(checkQuery, [userId]);
        const record = checkRes.rows ? checkRes.rows[0] : checkRes[0];

        // TRƯỜNG HỢP 1: CHƯA CHECK-IN -> THỰC HIỆN CHECK-IN
        if (!record) {
            // Giả sử quy định 08:30 AM là trễ (Bạn có thể tùy chỉnh lại logic này sau)
            const insertQuery = `
                INSERT INTO public.attendance_records (user_id, work_date, check_in_time, check_in_ip, status)
                VALUES ($1, CURRENT_DATE, NOW(), $2, 
                    CASE 
                        WHEN CURRENT_TIME > '08:30:00'::time THEN 'LATE'
                        ELSE 'ON_TIME'
                    END
                ) RETURNING *;
            `;
            const insertRes = db.query ? await db.query(insertQuery, [userId, clientIp]) : await db.execute(insertQuery, [userId, clientIp]);
            const newRecord = insertRes.rows ? insertRes.rows[0] : insertRes[0];

            return res.status(200).json({ success: true, message: "Check-in thành công! Chúc bạn ngày mới làm việc hiệu quả.", data: newRecord, type: 'CHECK_IN' });
        }

        // TRƯỜNG HỢP 2: ĐÃ CHECK-IN NHƯNG CHƯA CHECK-OUT -> THỰC HIỆN CHECK-OUT
        if (record && !record.check_out_time) {
            const updateQuery = `
                UPDATE public.attendance_records 
                SET check_out_time = NOW(), 
                    check_out_ip = $1,
                    -- Công thức tính tổng số giờ làm (Khoảng cách giữa check_out và check_in chia cho 3600 giây)
                    work_hours = ROUND((EXTRACT(EPOCH FROM (NOW() - check_in_time))/3600)::numeric, 2),
                    updated_at = NOW()
                WHERE id = $2 RETURNING *;
            `;
            const updateRes = db.query ? await db.query(updateQuery, [clientIp, record.id]) : await db.execute(updateQuery, [clientIp, record.id]);
            const updatedRecord = updateRes.rows ? updateRes.rows[0] : updateRes[0];

            return res.status(200).json({ success: true, message: `Check-out thành công! Bạn đã làm việc ${updatedRecord.work_hours} giờ hôm nay.`, data: updatedRecord, type: 'CHECK_OUT' });
        }

        // TRƯỜNG HỢP 3: ĐÃ CHECK-OUT RỒI -> BÁO LỖI KHÔNG CHO BẤM NỮA
        return res.status(400).json({ success: false, message: "Bạn đã hoàn thành ca làm việc hôm nay rồi!" });

    } catch (error) {
        console.error("Lỗi xử lý Check-in/Check-out:", error);
        res.status(500).json({ success: false, message: "Sự cố hệ thống khi ghi nhận chấm công." });
    }
};

// 3. [GET] Lấy lịch sử chấm công của CHÍNH NHÂN VIÊN ĐÓ (Dành cho trang Cá nhân)
export const getMyAttendanceHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const query = `
            SELECT work_date, check_in_time, check_out_time, status, work_hours, note
            FROM public.attendance_records 
            WHERE user_id = $1
            ORDER BY work_date DESC
            LIMIT 30; -- Lấy 30 ngày gần nhất
        `;
        const result = db.query ? await db.query(query, [userId]) : await db.execute(query, [userId]);
        const records = result.rows || result;

        res.status(200).json({ success: true, data: records });
    } catch (error) {
        console.error("Lỗi lấy lịch sử cá nhân:", error);
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi tải lịch sử chấm công." });
    }
};

// 4. [GET] Lấy danh sách chấm công TOÀN CÔNG TY (Dành cho Admin/Manager)
export const getAllAttendances = async (req, res) => {
    try {
        // BẢO MẬT: Chỉ cho phép ADMIN hoặc MANAGER xem danh sách tổng
        const userRole = req.user.role ? req.user.role.toUpperCase() : '';
        if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
            return res.status(403).json({ success: false, message: "Bạn không có quyền truy cập dữ liệu này!" });
        }

        // Lấy ngày cần lọc từ Query (Mặc định là ngày hôm nay nếu không truyền)
        const dateFilter = req.query.date || new Date().toISOString().split('T')[0];

        // Dùng JOIN để ghép bảng chấm công với bảng user để lấy Tên và Email
        const query = `
            SELECT 
                a.id, a.work_date, a.check_in_time, a.check_out_time, 
                a.status, a.work_hours, a.note,
                u.user_id, u.full_name, u.username, u.email, u.role, u.avatar_url
            FROM public.attendance_records a
            JOIN public.users u ON a.user_id = u.user_id
            WHERE a.work_date = $1
            ORDER BY a.check_in_time DESC;
        `;
        
        // Hỗ trợ cả 2 cú pháp db.query (pg) hoặc db.execute
        const result = db.query ? await db.query(query, [dateFilter]) : await db.execute(query, [dateFilter]);
        const records = result.rows ? result.rows : result;

        // Tính toán thống kê nhanh gửi về cho Frontend
        const stats = {
            total_checked_in: records.length,
            on_time: records.filter(r => r.status === 'ON_TIME').length,
            late: records.filter(r => r.status === 'LATE').length,
            completed: records.filter(r => r.check_out_time !== null).length
        };

        res.status(200).json({ success: true, data: records, stats });
    } catch (error) {
        console.error("Lỗi lấy danh sách tổng chấm công:", error);
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi tải danh sách chấm công." });
    }
};