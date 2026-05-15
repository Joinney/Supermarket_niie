// controllers/Auth/ForgotController.js
import db from "../configs/database.js";
import transporter from "../configs/Email/mailer.js";
import bcrypt from "bcrypt";

// 1. Gửi OTP
export const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await db.query("SELECT * FROM users WHERE email = $1", [email]);
        if (user.rows.length === 0) return res.status(404).json({ message: "Email không tồn tại!" });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = new Date(Date.now() + 5 * 60 * 1000); // Có hiệu lực 5 phút

        await db.query("UPDATE users SET otp_code = $1, otp_expiry = $2 WHERE email = $3", [otp, expiry, email]);

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Mã OTP khôi phục mật khẩu - Demi Mart",
            html: `<div style="padding:20px; border:1px solid #ddd; border-radius: 10px; font-family: sans-serif;">
                    <h2 style="color: #006c49;">Mã xác thực của bạn</h2>
                    <p>Mã OTP để đặt lại mật khẩu là: <b style="font-size: 24px; color: #006c49;">${otp}</b></p>
                    <p>Mã này có hiệu lực trong 5 phút. Vui lòng không chia sẻ cho bất kỳ ai.</p>
                   </div>`
        });
        res.json({ success: true, message: "Đã gửi OTP!" });
    } catch (err) { 
        console.error("Lỗi gửi OTP:", err);
        res.status(500).json({ message: "Lỗi Server khi gửi mail!" }); 
    }
};

// 2. Xác thực OTP
export const verifyOTP = async (req, res) => {
    const { email, otp } = req.body;
    try {
        // Kiểm tra OTP và thời gian hết hạn (so sánh với giờ hiện tại của DB)
        const result = await db.query(
            "SELECT * FROM users WHERE email = $1 AND otp_code = $2 AND otp_expiry > CURRENT_TIMESTAMP",
            [email, String(otp).trim()]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ message: "Mã OTP không chính xác hoặc đã hết hạn!" });
        }

        res.json({ success: true, message: "Mã OTP hợp lệ!" });
    } catch (err) {
        console.error("Lỗi verify OTP:", err);
        res.status(500).json({ message: "Lỗi Server khi xác thực!" });
    }
};

// 3. Đặt lại mật khẩu mới
export const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;
    try {
        // Mã hóa mật khẩu mới bằng bcrypt
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // QUAN TRỌNG: Sửa 'password' thành 'password_hash' để khớp với bảng users của Demi
        const result = await db.query(
            "UPDATE users SET password_hash = $1, otp_code = NULL, otp_expiry = NULL WHERE email = $2 AND otp_code = $3",
            [hashedPassword, email, String(otp).trim()]
        );

        if (result.rowCount === 0) {
            return res.status(400).json({ message: "Cập nhật mật khẩu thất bại! Có thể mã OTP đã bị hủy." });
        }

        console.log(`Đổi mật khẩu thành công cho email: ${email}`);
        res.json({ success: true, message: "Đổi mật khẩu thành công!" });
    } catch (err) {
        console.error("Lỗi reset password chi tiết:", err);
        res.status(500).json({ message: "Lỗi Server khi đổi mật khẩu!" });
    }
};
// Dùng khi user nhớ mật khẩu và muốn đổi mật khẩu mới trực tiếp
export const verifyCurrentPassword = async (req, res) => {
    const { password } = req.body;
    const userId = req.user.id; // Lấy từ middleware verifyToken

    try {
        const user = await db.query("SELECT password_hash FROM users WHERE user_id = $1", [userId]);
        
        if (user.rows.length === 0) {
            return res.status(404).json({ message: "Người dùng không tồn tại!" });
        }

        const isMatch = await bcrypt.compare(password, user.rows[0].password_hash);
        
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Mật khẩu hiện tại không chính xác!" });
        }

        res.json({ success: true, message: "Xác thực thành công!" });
    } catch (err) {
        console.error("Lỗi verify password:", err);
        res.status(500).json({ message: "Lỗi hệ thống khi xác thực mật khẩu!" });
    }
};