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
        const updateBalance = `UPDATE public.users SET wallet_balance = COALESCE(wallet_balance, 0) + $1::numeric WHERE user_id = $2`;
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

// API 3: Trừ tiền khi thanh toán bằng ví DemiPay
export const payWithWallet = async (req, res) => {
    try {
        // Lấy ID user từ token đăng nhập
        const userId = req.user.id; 
        const { amount, orderId } = req.body;
        
        // 1. Trừ tiền trong ví
        const updateBalance = `UPDATE public.users SET wallet_balance = wallet_balance - $1::numeric WHERE user_id = $2`;
        if (db.query) await db.query(updateBalance, [amount, userId]);
        else await db.execute(updateBalance, [amount, userId]);
        
        // 2. Ghi log giao dịch (Số tiền âm để hiển thị chữ màu đỏ trên lịch sử)
        const title = "Thanh toán đơn hàng";
        const desc = `Thanh toán thành công cho đơn hàng #${orderId}`;
        
        // BỎ DẤU TRỪ (-) Ở TRƯỚC $2 ĐI
        const insertLog = `
            INSERT INTO public.wallet_transactions (user_id, type, amount, title, description, created_at) 
            VALUES ($1, 'payment', $2, $3, $4, NOW())
        `;
        
        // XỬ LÝ SỐ ÂM BẰNG JAVASCRIPT ĐỂ ĐẢM BẢO AN TOÀN KIỂU DỮ LIỆU
        const negativeAmount = -Number(amount);
        
        if (db.query) await db.query(insertLog, [userId, negativeAmount, title, desc]);
        else await db.execute(insertLog, [userId, negativeAmount, title, desc]);

        return res.status(200).json({ success: true, message: "Trừ tiền ví thành công!" });
    } catch (error) {
        console.error("Lỗi payWithWallet:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};