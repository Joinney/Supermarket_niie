import pool from '../configs/database.js';

// =========================================================================
// 1. LẤY TẤT CẢ QUỐC GIA (CÓ THỂ LỌC THEO TRẠNG THÁI)
// =========================================================================
export const getAllNations = async (req, res) => {
    try {
        const { activeOnly } = req.query;
        let query = `
            SELECT ma_quoc_gia, ten_quoc_gia, dinh_dang_vung, ma_tien_te, bieu_tuong_tien, ty_gia, bieu_tuong_co, trang_thai 
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
        const { ma_quoc_gia, ten_quoc_gia, dinh_dang_vung, ma_tien_te, bieu_tuong_tien, ty_gia, bieu_tuong_co } = req.body;

        if (!ma_quoc_gia || !ten_quoc_gia) {
            return res.status(400).json({ success: false, message: "Mã và Tên quốc gia là bắt buộc." });
        }

        const query = `
            INSERT INTO public.danh_muc_quoc_gia 
            (ma_quoc_gia, ten_quoc_gia, dinh_dang_vung, ma_tien_te, bieu_tuong_tien, ty_gia, bieu_tuong_co, trang_thai) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, true) 
            RETURNING *;
        `;
        const values = [ma_quoc_gia.toUpperCase(), ten_quoc_gia, dinh_dang_vung, ma_tien_te, bieu_tuong_tien, ty_gia || 1, bieu_tuong_co];
        
        const { rows } = await pool.query(query, values);
        res.status(201).json({ success: true, message: "Thêm quốc gia thành công!", data: rows[0] });
    } catch (error) {
        if (error.code === '23505') { // Mã lỗi trùng lặp Primary Key trong PostgreSQL
            return res.status(400).json({ success: false, message: "Mã quốc gia này đã tồn tại!" });
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
        const { ten_quoc_gia, dinh_dang_vung, ma_tien_te, bieu_tuong_tien, ty_gia, bieu_tuong_co } = req.body;

        const query = `
            UPDATE public.danh_muc_quoc_gia 
            SET ten_quoc_gia = $1, dinh_dang_vung = $2, ma_tien_te = $3, bieu_tuong_tien = $4, ty_gia = $5, bieu_tuong_co = $6
            WHERE ma_quoc_gia = $7 
            RETURNING *;
        `;
        const values = [ten_quoc_gia, dinh_dang_vung, ma_tien_te, bieu_tuong_tien, ty_gia, bieu_tuong_co, id.toUpperCase()];

        const { rows } = await pool.query(query, values);
        if (rows.length === 0) return res.status(404).json({ success: false, message: "Không tìm thấy quốc gia." });
        
        res.status(200).json({ success: true, message: "Cập nhật thành công!", data: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi cập nhật quốc gia." });
    }
};

// =========================================================================
// 5. BẬT/TẮT TRẠNG THÁI QUỐC GIA (SOFT DELETE)
// =========================================================================
export const toggleNationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            UPDATE public.danh_muc_quoc_gia 
            SET trang_thai = NOT trang_thai 
            WHERE ma_quoc_gia = $1 
            RETURNING trang_thai;
        `;
        const { rows } = await pool.query(query, [id.toUpperCase()]);
        
        if (rows.length === 0) return res.status(404).json({ success: false, message: "Không tìm thấy quốc gia." });
        
        res.status(200).json({ 
            success: true, 
            message: rows[0].trang_thai ? "Đã bật hoạt động quốc gia." : "Đã tạm khóa quốc gia." 
        });
    } catch (error) {
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