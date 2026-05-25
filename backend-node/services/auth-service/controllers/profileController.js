import pool from '../configs/database.js';

// 1. Lấy thông tin chi tiết hồ sơ
export const getHoso = async (req, res) => {
    try {
        const userId = req.user.id; 
        
        const query = `
            SELECT user_id, username, email, full_name, phone_number, gender, birthday, avatar_url 
            FROM users 
            WHERE user_id = $1
        `;
        const result = await pool.query(query, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "User không tồn tại" });
        }

        res.status(200).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error("Lỗi getHoso:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};

// 2. Cập nhật thông tin hồ sơ
export const updateHoso = async (req, res) => {
    try {
        const userId = req.user.id;
        const { full_name, phone_number, gender, birthday } = req.body;

        const query = `
            UPDATE users 
            SET full_name = $1, phone_number = $2, gender = $3, birthday = $4
            WHERE user_id = $5 
            RETURNING user_id, username, email, full_name, avatar_url
        `;
        const result = await pool.query(query, [full_name, phone_number, gender, birthday, userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Cập nhật thất bại, user không tồn tại" });
        }

        res.status(200).json({ 
            success: true, 
            message: "Cập nhật hồ sơ Demi Mart thành công!", 
            data: result.rows[0] 
        });
    } catch (error) {
        console.error("Lỗi updateHoso:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};

// 3. Cập nhật ảnh đại diện - Phiên bản kiểm tra lỗi chi tiết
export const uploadAvatar = async (req, res) => {
    try {
        // Kiểm tra xem file có được đẩy vào req không
        if (!req.file) {
            console.error("DEBUG: Không có file trong req.file");
            return res.status(400).json({ 
                success: false, 
                message: "Không tìm thấy file ảnh! Kiểm tra lại key trong form-data (phải là 'avatar')" 
            });
        }

        const userId = req.user?.id; // Kiểm tra an toàn user.id
        if (!userId) {
            return res.status(401).json({ success: false, message: "Người dùng chưa đăng nhập!" });
        }
        
        // Đường dẫn URL tuyệt đối từ Cloudinary (do multer-storage-cloudinary cung cấp)
        const avatarUrl = req.file.path; 

        // Lưu URL vào Database
        const result = await pool.query(
            'UPDATE users SET avatar_url = $1 WHERE user_id = $2 RETURNING avatar_url', 
            [avatarUrl, userId]
        );

        res.status(200).json({ 
            success: true, 
            message: "Cập nhật ảnh đại diện thành công", 
            avatarUrl: result.rows[0].avatar_url 
        });
    } catch (error) {
        // Ghi log chi tiết lỗi ra terminal để biết nguyên nhân (Sai API Key? Lỗi kết nối Cloudinary?)
        console.error("🔥 LỖI CHI TIẾT TẠI UPLOAD:", error.message);
        res.status(500).json({ 
            success: false, 
            message: "Lỗi hệ thống khi tải ảnh lên Cloudinary",
            error: error.message 
        });
    }
};