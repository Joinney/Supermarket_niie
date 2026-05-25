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

// 3. Cập nhật ảnh đại diện (ĐÃ HOÀN CHỈNH CHO CLOUDINARY)
export const uploadAvatar = async (req, res) => {
    try {
        // req.file được cung cấp bởi middleware upload.single('avatar')
        if (!req.file) {
            return res.status(400).json({ success: false, message: "Không tìm thấy file ảnh!" });
        }

        const userId = req.user.id;
        
        // CÁCH MỚI: Lấy đường dẫn URL tuyệt đối từ Cloudinary trả về
        const avatarUrl = req.file.path; 

        // Lưu URL này vào Database
        await pool.query('UPDATE users SET avatar_url = $1 WHERE user_id = $2', [avatarUrl, userId]);

        res.status(200).json({ 
            success: true, 
            message: "Cập nhật ảnh đại diện thành công", 
            avatarUrl 
        });
    } catch (error) {
        console.error("Lỗi uploadAvatar:", error.message);
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi tải ảnh lên Cloudinary" });
    }
};