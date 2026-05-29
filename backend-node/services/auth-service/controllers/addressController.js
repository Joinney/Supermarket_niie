import pool from '../configs/database.js';

/**
 * 1. LẤY DANH SÁCH ĐỊA CHỈ
 */
export const getAddresses = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const query = `
            SELECT * FROM user_addresses 
            WHERE user_id = $1 
            ORDER BY is_default DESC, created_at DESC
        `;
        const result = await pool.query(query, [userId]);

        res.status(200).json({ 
            success: true, 
            data: result.rows 
        });
    } catch (error) {
        console.error("Lỗi getAddresses:", error.message);
        res.status(500).json({ success: false, error: "Không thể lấy danh sách địa chỉ" });
    }
};

/**
 * 2. THÊM ĐỊA CHỈ MỚI
 */
export const addAddress = async (req, res) => {
    try {
        const userId = req.user.id;
        const { 
            receiver_name, 
            receiver_phone, 
            province_name, province_id, 
            district_name, district_id, 
            ward_name, ward_id, ward_code,
            detail_address, 
            is_default, 
            address_type 
        } = req.body;

        const isDefaultBool = is_default === 1 || is_default === true;

        if (isDefaultBool) {
            await pool.query('UPDATE user_addresses SET is_default = false WHERE user_id = $1', [userId]);
        }

        const query = `
            INSERT INTO user_addresses (
                user_id, receiver_name, receiver_phone, 
                province_name, province_id, 
                district_name, district_id, 
                ward_name, ward_code, 
                detail_address, is_default, address_type
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
            RETURNING *
        `;

        const values = [
            userId, 
            receiver_name, 
            receiver_phone, 
            province_name, 
            province_id || 1,    
            district_name, 
            district_id || 1,    
            ward_name, 
            ward_code || ward_id || '1', // Đảm bảo không bị null cột ward_code       
            detail_address, 
            isDefaultBool, 
            address_type || 'home'
        ];

        const result = await pool.query(query, values);

        res.status(201).json({ 
            success: true, 
            message: "Đã lưu địa chỉ chuẩn hóa cho vận chuyển!",
            data: result.rows[0] 
        });
    } catch (error) {
        console.error("Lỗi addAddress:", error.message);
        res.status(500).json({ success: false, error: "Lỗi hệ thống khi thêm địa chỉ" });
    }
};

/**
 * 3. CẬP NHẬT ĐỊA CHỈ (ĐÃ SỬA LỖI MẶC ĐỊNH & THAM SỐ)
 */
export const updateAddress = async (req, res) => {
    try {
        const userId = req.user.id;
        // Phòng thủ lấy ID từ cả req.params.id lẫn req.params.address_id cho chuẩn
        const addressId = req.params.id || req.params.address_id;

        const { 
            receiver_name, receiver_phone, 
            province_name, province_id, 
            district_name, district_id, 
            ward_name, ward_id, ward_code, 
            detail_address, is_default, address_type 
        } = req.body;

        const isDefaultBool = is_default === 1 || is_default === true;

        // Nếu FE yêu cầu đặt bản ghi này làm mặc định, gạt toàn bộ bản ghi khác về false trước
        if (isDefaultBool) {
            await pool.query('UPDATE user_addresses SET is_default = false WHERE user_id = $1', [userId]);
        }

        const query = `
            UPDATE user_addresses 
            SET receiver_name = $1, receiver_phone = $2, 
                province_name = $3, province_id = $4, 
                district_name = $5, district_id = $6, 
                ward_name = $7, ward_code = $8, 
                detail_address = $9, is_default = $10, address_type = $11
            WHERE address_id = $12 AND user_id = $13
            RETURNING *
        `;

        const values = [
            receiver_name, 
            receiver_phone, 
            province_name, 
            province_id || 1, 
            district_name, 
            district_id || 1, 
            ward_name, 
            ward_code || ward_id || '1', // Đồng bộ map dữ liệu vào cột ward_code trong db
            detail_address, 
            isDefaultBool, 
            address_type || 'home', 
            addressId, // Truyền chính xác ID địa chỉ vào mệnh đề WHERE ($12)
            userId     // Kiểm tra đúng chủ sở hữu ($13)
        ];

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Không tìm thấy địa chỉ hoặc không có quyền chỉnh sửa" });
        }

        res.status(200).json({ success: true, message: "Đã cập nhật địa chỉ thành công!", data: result.rows[0] });
    } catch (error) {
        console.error("Lỗi updateAddress:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * 4. XÓA ĐỊA CHỈ
 */
export const deleteAddress = async (req, res) => {
    try {
        const addressId = req.params.id || req.params.address_id;
        const userId = req.user.id;

        const result = await pool.query(
            'DELETE FROM user_addresses WHERE address_id = $1 AND user_id = $2 RETURNING *',
            [addressId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Xóa thất bại hoặc không tìm thấy địa chỉ!" });
        }

        res.status(200).json({ success: true, message: "Đã xóa địa chỉ khỏi hệ thống!" });
    } catch (error) {
        console.error("Lỗi deleteAddress:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};