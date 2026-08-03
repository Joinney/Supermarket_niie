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

// 3. [POST] Logic Điểm danh hàng ngày (Có tính Streak)
export const dailyCheckIn = async (req, res) => {
    try {
        const userId = req.user.id;
        // Sử dụng timezone địa phương để tính đúng ngày
        const now = new Date();
        const today = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        const yesterday = new Date(now.getTime() - 86400000 - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

        // 3.1 Kiểm tra xem user đã có ví Xu chưa
        let balanceQuery = `SELECT * FROM public.point_balances WHERE user_id = $1`;
        let balanceRes = db.query ? await db.query(balanceQuery, [userId]) : await db.execute(balanceQuery, [userId]);
        let balanceInfo = balanceRes.rows ? balanceRes.rows[0] : balanceRes[0];

        if (!balanceInfo) {
            // Cần thêm cột current_streak vào bảng nếu chưa có
            const createWalletQ = `INSERT INTO public.point_balances (user_id, available_points, total_earned) VALUES ($1, 0, 0) RETURNING *`;
            const createdRes = db.query ? await db.query(createWalletQ, [userId]) : await db.execute(createWalletQ, [userId]);
            balanceInfo = createdRes.rows ? createdRes.rows[0] : createdRes[0];
            // Khởi tạo streak
            balanceInfo.current_streak = 0;
        }

        // 3.2 Kiểm tra xem hôm nay đã điểm danh chưa
        const checkTodayQ = `SELECT id FROM public.point_transactions WHERE user_id = $1 AND transaction_type = 'EARN' AND source = 'CHECK_IN' AND DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') = $2`;
        const todayRes = db.query ? await db.query(checkTodayQ, [userId, today]) : await db.execute(checkTodayQ, [userId, today]);
        const hasCheckedInToday = (todayRes.rows ? todayRes.rows.length : todayRes.length) > 0;

        if (hasCheckedInToday) {
            return res.status(400).json({ success: false, message: "Hôm nay bạn đã nhận thưởng rồi, quay lại vào ngày mai nhé! 🎁" });
        }

        // 3.3 Tính toán Chuỗi (Streak)
        const checkYesterdayQ = `SELECT id FROM public.point_transactions WHERE user_id = $1 AND transaction_type = 'EARN' AND source = 'CHECK_IN' AND DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') = $2`;
        const yesterdayRes = db.query ? await db.query(checkYesterdayQ, [userId, yesterday]) : await db.execute(checkYesterdayQ, [userId, yesterday]);
        const didCheckInYesterday = (yesterdayRes.rows ? yesterdayRes.rows.length : yesterdayRes.length) > 0;

        let currentStreak = balanceInfo.current_streak || 0;
        
        if (didCheckInYesterday) {
            currentStreak += 1;
        } else {
            currentStreak = 1;
        }

        // 3.4 Tính tiền thưởng dựa trên Streak
        let baseCoins = 100;
        let bonusPercent = 0;
        
        if (currentStreak === 2) bonusPercent = 0.1;
        else if (currentStreak === 3) bonusPercent = 0.2;
        else if (currentStreak === 4) bonusPercent = 0.3;
        else if (currentStreak === 5) bonusPercent = 0.4;
        else if (currentStreak >= 6) bonusPercent = 0.5;

        const finalCoins = Math.floor(baseCoins * (1 + bonusPercent));

        // 3.5 Cập nhật Database
        // Phải đảm bảo database của bạn có cột current_streak trong bảng point_balances
        const updateWalletQ = `
            UPDATE public.point_balances 
            SET available_points = available_points + $1,
                total_earned = total_earned + $1,
                current_streak = $2,
                updated_at = NOW()
            WHERE user_id = $3
            RETURNING available_points
        `;
        let balRes;
        if(db.query) balRes = await db.query(updateWalletQ, [finalCoins, currentStreak, userId]);
        else balRes = await db.execute(updateWalletQ, [finalCoins, currentStreak, userId]);

        const updatedPoints = balRes.rows ? balRes.rows[0].available_points : balRes[0].available_points;

        const insertTxQ = `
            INSERT INTO public.point_transactions (user_id, transaction_type, source, points, description)
            VALUES ($1, 'EARN', 'CHECK_IN', $2, $3)
        `;
        const desc = `Điểm danh ngày (Chuỗi ${currentStreak} ngày)`;
        if(db.query) await db.query(insertTxQ, [userId, finalCoins, desc]);
        else await db.execute(insertTxQ, [userId, finalCoins, desc]);

        res.status(200).json({
            success: true,
            message: `Điểm danh thành công! Nhận ${finalCoins} Xu (Chuỗi ${currentStreak} ngày)`,
            data: { earnedCoins: finalCoins, currentStreak, availablePoints: updatedPoints }
        });

    } catch (error) {
        console.error("Lỗi điểm danh:", error);
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi điểm danh" });
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

// 5. [GET] Lấy thống kê lịch sử điểm danh
export const getCheckInStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // 1-12
        const todayStr = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

        // Lấy danh sách các ngày ĐÃ điểm danh trong tháng hiện tại
        const getHistoryQ = `
            SELECT DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') as check_date, points 
            FROM public.point_transactions 
            WHERE user_id = $1 AND source = 'CHECK_IN' 
              AND EXTRACT(YEAR FROM created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') = $2 
              AND EXTRACT(MONTH FROM created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') = $3
        `;
        const historyRes = db.query ? await db.query(getHistoryQ, [userId, currentYear, currentMonth]) : await db.execute(getHistoryQ, [userId, currentYear, currentMonth]);
        const records = historyRes.rows || historyRes;

        // Tính toán thông số
        const checkedInDates = records.map(r => {
             // Sửa lỗi timezone khi định dạng ngày từ CSDL trả về
             const d = new Date(r.check_date);
             return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        });
        const monthlyCoins = records.reduce((sum, r) => sum + Number(r.points), 0);
        const hasCheckedInToday = checkedInDates.includes(todayStr);

        // Lấy tổng xu và tổng số lần điểm danh mọi thời đại
        const getTotalQ = `
            SELECT 
               (SELECT available_points FROM public.point_balances WHERE user_id = $1) as total_coins,
               (SELECT current_streak FROM public.point_balances WHERE user_id = $1) as current_streak,
               (SELECT COUNT(*) FROM public.point_transactions WHERE user_id = $1 AND source = 'CHECK_IN') as total_checkins
        `;
        const totalRes = db.query ? await db.query(getTotalQ, [userId]) : await db.execute(getTotalQ, [userId]);
        const totals = totalRes.rows ? totalRes.rows[0] : totalRes[0];

        res.status(200).json({
            success: true,
            data: {
                checkedInDates,
                monthlyCoins,
                hasCheckedInToday,
                totalCoins: totals?.total_coins || 0,
                totalCheckIns: totals?.total_checkins || 0,
                currentStreak: totals?.current_streak || 0
            }
        });

    } catch (error) {
        console.error("Lỗi lấy thống kê điểm danh:", error);
        res.status(500).json({ success: false, message: "Lỗi hệ thống" });
    }
};