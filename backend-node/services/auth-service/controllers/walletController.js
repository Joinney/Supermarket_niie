import db from '../configs/database.js';

// API 1: Lấy lịch sử giao dịch để hiển thị lên React
export const getWalletTransactions = async (req, res) => {
    try {
        const { userId } = req.params;
        const query = `SELECT * FROM public.wallet_transactions WHERE user_id = $1 ORDER BY created_at DESC`;
        const result = db.query ? await db.query(query, [userId]) : await db.execute(query, [userId]);
        const transactions = result.rows ? result.rows : result;

        return res.status(200).json({ success: true, data: transactions });
    } catch (error) {
        console.error("Lỗi lấy lịch sử ví:", error);
        return res.status(500).json({ success: false, message: "Lỗi máy chủ" });
    }
};

// API 2: Nhận lệnh hoàn tiền từ Order Service (Docker gọi ngầm)
export const refundToWallet = async (req, res) => {
    try {
        const { userId, amount, orderId, method } = req.body;
        
        // 1. Cộng tiền vào user
        const updateBalance = `UPDATE public.users SET wallet_balance = COALESCE(wallet_balance, 0) + $1 WHERE user_id = $2`;
        if (db.query) await db.query(updateBalance, [amount, userId]);
        else await db.execute(updateBalance, [amount, userId]);
        
        // 2. Ghi log giao dịch
        const title = "Hoàn tiền hủy đơn hàng";
        const desc = `Hủy đơn hàng #${orderId} (Thanh toán qua ${method})`;
        const insertLog = `
            INSERT INTO public.wallet_transactions (user_id, type, amount, title, description, created_at) 
            VALUES ($1, 'refund', $2, $3, $4, NOW())
        `;
        if (db.query) await db.query(insertLog, [userId, amount, title, desc]);
        else await db.execute(insertLog, [userId, amount, title, desc]);

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("Lỗi refundToWallet:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};