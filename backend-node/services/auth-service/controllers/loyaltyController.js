import db from '../configs/database.js';

// 1. [GET] Lấy số dư Xu
export const getPointBalance = async (req, res) => {
    try {
        const userId = req.user?.id; 
        const query = `SELECT available_points, total_earned FROM public.point_balances WHERE user_id = $1`;
        const result = db.query ? await db.query(query, [userId]) : await db.execute(query, [userId]);
        
        let balance = result.rows ? result.rows[0] : result[0];
        
        // Nếu chưa có ví, trả về 0
        if (!balance) {
            balance = { available_points: 0, total_earned: 0 };
        }

        // Map lại tên biến cho Frontend dễ đọc (giữ nguyên cấu trúc cũ)
        res.status(200).json({ 
            success: true, 
            data: { availablePoints: balance.available_points, totalEarned: balance.total_earned } 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. [POST] API Cộng Điểm / Hoàn Xu (Cho Order Service gọi)
export const earnPoints = async (req, res) => {
    try {
        const { userId, points, source, referenceId, description } = req.body;

        // Ghi lịch sử giao dịch
        const insertTxQuery = `
            INSERT INTO public.point_transactions (user_id, transaction_type, source, points, reference_id, description)
            VALUES ($1, 'EARN', $2, $3, $4, $5)
        `;
        const txParams = [userId, source, points, referenceId, description];
        if (db.query) await db.query(insertTxQuery, txParams);
        else await db.execute(insertTxQuery, txParams);

        // Cập nhật hoặc Tạo mới ví điểm (Upsert trong Postgres)
        const upsertBalanceQuery = `
            INSERT INTO public.point_balances (user_id, available_points, total_earned)
            VALUES ($1, $2, $2)
            ON CONFLICT (user_id) 
            DO UPDATE SET 
                available_points = point_balances.available_points + EXCLUDED.available_points,
                total_earned = point_balances.total_earned + EXCLUDED.total_earned,
                updated_at = NOW()
        `;
        if (db.query) await db.query(upsertBalanceQuery, [userId, points]);
        else await db.execute(upsertBalanceQuery, [userId, points]);

        res.status(200).json({ success: true, message: "Cộng Xu thành công!" });
    } catch (error) {
        console.error("Lỗi cộng xu:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. [POST] Logic Điểm danh hàng ngày
export const dailyCheckIn = async (req, res) => {
    try {
        const userId = req.user?.id;
        
        // Kiểm tra xem hôm nay đã điểm danh chưa
        const checkQuery = `
            SELECT id FROM public.point_transactions 
            WHERE user_id = $1 AND source = 'CHECK_IN' AND DATE(created_at) = CURRENT_DATE
        `;
        const checkRes = db.query ? await db.query(checkQuery, [userId]) : await db.execute(checkQuery, [userId]);
        const existingCheckIn = checkRes.rows ? checkRes.rows.length > 0 : checkRes.length > 0;

        if (existingCheckIn) {
            return res.status(400).json({ success: false, message: "Hôm nay bạn đã nhận thưởng rồi, quay lại vào ngày mai nhé! 🎁" });
        }

        const bonusPoints = 100; 

        // Ghi lịch sử
        const insertTxQuery = `
            INSERT INTO public.point_transactions (user_id, transaction_type, source, points, reference_id, description)
            VALUES ($1, 'EARN', 'CHECK_IN', $2, $3, 'Thưởng điểm danh hàng ngày')
        `;
        const refId = `CHECKIN_${Date.now()}`;
        if (db.query) await db.query(insertTxQuery, [userId, bonusPoints, refId]);
        else await db.execute(insertTxQuery, [userId, bonusPoints, refId]);

        // Cập nhật ví
        const upsertBalanceQuery = `
            INSERT INTO public.point_balances (user_id, available_points, total_earned)
            VALUES ($1, $2, $2)
            ON CONFLICT (user_id) 
            DO UPDATE SET 
                available_points = point_balances.available_points + EXCLUDED.available_points,
                total_earned = point_balances.total_earned + EXCLUDED.total_earned,
                updated_at = NOW()
            RETURNING available_points;
        `;
        const balRes = db.query ? await db.query(upsertBalanceQuery, [userId, bonusPoints]) : await db.execute(upsertBalanceQuery, [userId, bonusPoints]);
        const updatedPoints = balRes.rows ? balRes.rows[0].available_points : balRes[0].available_points;

        res.status(200).json({ 
            success: true, 
            message: `Điểm danh thành công! Nhận ngay ${bonusPoints} Xu ⚡`, 
            data: { availablePoints: updatedPoints } 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4. [POST] Trừ Xu khi khách hàng thanh toán đơn hàng
export const spendPoints = async (req, res) => {
    try {
        const { userId, points, referenceId } = req.body;

        if (!userId || !points || points <= 0) {
            return res.status(400).json({ success: false, message: "Số xu không hợp lệ" });
        }

        // 1. Trừ điểm trực tiếp (Sử dụng SQL an toàn để tránh âm tiền - Race Condition)
        const deductQuery = `
            UPDATE public.point_balances 
            SET available_points = available_points - $1,
                updated_at = NOW()
            WHERE user_id = $2 AND available_points >= $1
            RETURNING available_points;
        `;
        const deductRes = db.query ? await db.query(deductQuery, [points, userId]) : await db.execute(deductQuery, [points, userId]);
        
        // Nếu không trả về dòng nào, nghĩa là user_id không tồn tại hoặc available_points < points (Không đủ tiền)
        const updatedRow = deductRes.rows ? deductRes.rows[0] : deductRes[0];
        if (!updatedRow) {
            return res.status(400).json({ success: false, message: "Số dư Xu không đủ để thực hiện giao dịch này!" });
        }

        // 2. Ghi lịch sử giao dịch (SPEND)
        const insertTxQuery = `
            INSERT INTO public.point_transactions (user_id, transaction_type, source, points, reference_id, description)
            VALUES ($1, 'SPEND', 'ORDER', $2, $3, 'Dùng Xu giảm giá thanh toán đơn hàng')
        `;
        if (db.query) await db.query(insertTxQuery, [userId, points, referenceId]);
        else await db.execute(insertTxQuery, [userId, points, referenceId]);

        res.status(200).json({ 
            success: true, 
            message: "Trừ Xu thành công",
            remainingPoints: updatedRow.available_points
        });
    } catch (error) {
        console.error("Lỗi trừ xu:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};