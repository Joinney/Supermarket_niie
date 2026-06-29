import pool from '../configs/database.js';

// =========================================================================
// 1. LẤY TẤT CẢ QUỐC GIA (CÓ THỂ LỌC THEO TRẠNG THÁI)
// =========================================================================
export const getAllNations = async (req, res) => {
    try {
        const { activeOnly } = req.query;
        // 🌟 Đã bổ sung ma_dinh_danh_sp vào SELECT
        let query = `
            SELECT ma_quoc_gia, ten_quoc_gia, ma_dinh_danh_sp, dinh_dang_vung, ma_tien_te, bieu_tuong_tien, ty_gia, bieu_tuong_co, trang_thai 
            FROM public.danh_muc_quoc_gia
        `;
        
        if (activeOnly === 'true') {
            query += ` WHERE trang_thai = true`;
        }
        
        query += ` ORDER BY ten_quoc_gia ASC;`;

        const { rows } = await pool.query(query);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("❌ Lỗi API getAllNations:", error.message);
        res.status(500).json({ success: false, message: "Lỗi tải danh sách quốc gia." });
    }
};

// =========================================================================
// 2. LẤY CHI TIẾT 1 QUỐC GIA
// =========================================================================
export const getNationById = async (req, res) => {
    try {
        const { id } = req.params; // ma_quoc_gia (VD: VN, US, CN)
        const query = `SELECT * FROM public.danh_muc_quoc_gia WHERE ma_quoc_gia = $1`;
        const { rows } = await pool.query(query, [id.toUpperCase()]);

        if (rows.length === 0) return res.status(404).json({ success: false, message: "Không tìm thấy quốc gia." });
        res.status(200).json({ success: true, data: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi tải chi tiết quốc gia." });
    }
};

// =========================================================================
// 3. THÊM MỚI QUỐC GIA
// =========================================================================
export const createNation = async (req, res) => {
    try {
        // 🌟 Lấy thêm ma_dinh_danh_sp từ Frontend gửi lên
        const { ma_quoc_gia, ten_quoc_gia, ma_dinh_danh_sp, dinh_dang_vung, ma_tien_te, bieu_tuong_tien, ty_gia, bieu_tuong_co } = req.body;

        // 🌟 Bắt buộc phải có mã định danh SP
        if (!ma_quoc_gia || !ten_quoc_gia || !ma_dinh_danh_sp) {
            return res.status(400).json({ success: false, message: "Mã, Tên quốc gia và Mã định danh SP là bắt buộc." });
        }

        // 🌟 Thêm ma_dinh_danh_sp vào câu query
        const query = `
            INSERT INTO public.danh_muc_quoc_gia 
            (ma_quoc_gia, ten_quoc_gia, ma_dinh_danh_sp, dinh_dang_vung, ma_tien_te, bieu_tuong_tien, ty_gia, bieu_tuong_co, trang_thai) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true) 
            RETURNING *;
        `;
        
        // 🌟 Bổ sung biến thứ 3
        const values = [
            ma_quoc_gia.toUpperCase(), 
            ten_quoc_gia, 
            ma_dinh_danh_sp.trim(), 
            dinh_dang_vung, 
            ma_tien_te, 
            bieu_tuong_tien, 
            ty_gia || 1, 
            bieu_tuong_co
        ];
        
        const { rows } = await pool.query(query, values);
        res.status(201).json({ success: true, message: "Thêm quốc gia thành công!", data: rows[0] });
    } catch (error) {
        if (error.code === '23505') { 
            return res.status(400).json({ success: false, message: "Mã quốc gia hoặc mã định danh này đã tồn tại!" });
        }
        res.status(500).json({ success: false, message: "Lỗi khi thêm quốc gia." });
    }
};

// =========================================================================
// 4. CẬP NHẬT QUỐC GIA
// =========================================================================
export const updateNation = async (req, res) => {
    try {
        const { id } = req.params;
        // 🌟 Lấy thêm ma_dinh_danh_sp
        const { ten_quoc_gia, ma_dinh_danh_sp, dinh_dang_vung, ma_tien_te, bieu_tuong_tien, ty_gia, bieu_tuong_co } = req.body;

        // 🌟 Cập nhật thêm cột ma_dinh_danh_sp
        const query = `
            UPDATE public.danh_muc_quoc_gia 
            SET ten_quoc_gia = $1, ma_dinh_danh_sp = $2, dinh_dang_vung = $3, ma_tien_te = $4, bieu_tuong_tien = $5, ty_gia = $6, bieu_tuong_co = $7
            WHERE ma_quoc_gia = $8 
            RETURNING *;
        `;
        
        // 🌟 Chỉnh lại tham số (id.toUpperCase() bị đẩy xuống vị trí số 8)
        const values = [
            ten_quoc_gia, 
            ma_dinh_danh_sp.trim(), 
            dinh_dang_vung, 
            ma_tien_te, 
            bieu_tuong_tien, 
            ty_gia, 
            bieu_tuong_co, 
            id.toUpperCase()
        ];

        const { rows } = await pool.query(query, values);
        if (rows.length === 0) return res.status(404).json({ success: false, message: "Không tìm thấy quốc gia." });
        
        res.status(200).json({ success: true, message: "Cập nhật thành công!", data: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi cập nhật quốc gia." });
    }
};

// =========================================================================
// 5. BẬT/TẮT TRẠNG THÁI QUỐC GIA (Có Socket.io)
// =========================================================================
export const toggleNationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            UPDATE public.danh_muc_quoc_gia 
            SET trang_thai = NOT trang_thai 
            WHERE ma_quoc_gia = $1 
            RETURNING ma_quoc_gia, trang_thai;
        `;
        const { rows } = await pool.query(query, [id.toUpperCase()]);
        
        if (rows.length === 0) return res.status(404).json({ success: false, message: "Không tìm thấy quốc gia." });
        
        if (req.io) {
            req.io.emit("store_status_changed", { 
                ma_quoc_gia: rows[0].ma_quoc_gia, 
                trang_thai: rows[0].trang_thai 
            });
        }
        
        res.status(200).json({ 
            success: true, 
            message: rows[0].trang_thai ? "Đã bật hoạt động quốc gia." : "Đã tạm khóa quốc gia." 
        });
    } catch (error) {
        console.error("Lỗi toggleNationStatus:", error);
        res.status(500).json({ success: false, message: "Lỗi thay đổi trạng thái." });
    }
};

// =========================================================================
// 6. XÓA VĨNH VIỄN QUỐC GIA (HARD DELETE - KÈM BẢO VỆ DỮ LIỆU)
// =========================================================================
export const deleteNation = async (req, res) => {
    try {
        const { id } = req.params;
        const countryCode = id.toUpperCase();

        // LỚP BẢO VỆ 1: Kiểm tra xem có Sản phẩm nào đang thuộc quốc gia này không
        const checkProduct = await pool.query(
            `SELECT COUNT(*) FROM public.san_pham WHERE UPPER(ma_quoc_gia) = $1`, 
            [countryCode]
        );
        if (parseInt(checkProduct.rows[0].count) > 0) {
            return res.status(400).json({ 
                success: false, 
                message: `Từ chối xóa! Đang có ${checkProduct.rows[0].count} sản phẩm thuộc quốc gia này.` 
            });
        }

        // LỚP BẢO VỆ 2: Kiểm tra xem có Danh mục Cha/Con nào đang dùng quốc gia này không
        const checkCategory = await pool.query(
            `SELECT COUNT(*) FROM public.danh_muc_cha WHERE UPPER(ma_quoc_gia) = $1`, 
            [countryCode]
        );
        if (parseInt(checkCategory.rows[0].count) > 0) {
            return res.status(400).json({ 
                success: false, 
                message: `Từ chối xóa! Quốc gia này đang được dùng bởi ${checkCategory.rows[0].count} danh mục cha. Hãy xóa danh mục trước.` 
            });
        }

        // ĐỦ ĐIỀU KIỆN AN TOÀN -> THỰC HIỆN XÓA CỨNG
        const query = `DELETE FROM public.danh_muc_quoc_gia WHERE ma_quoc_gia = $1 RETURNING *;`;
        const { rows } = await pool.query(query, [countryCode]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Không tìm thấy quốc gia để xóa." });
        }

        res.status(200).json({ 
            success: true, 
            message: "Đã xóa vĩnh viễn cửa hàng quốc gia khỏi hệ thống!" 
        });

    } catch (error) {
        console.error("❌ Lỗi API deleteNation:", error.message);
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi xóa vĩnh viễn quốc gia." });
    }
};
