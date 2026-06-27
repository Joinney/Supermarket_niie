import pool from '../configs/database.js';

// =========================================================================
// 1. LẤY DANH SÁCH ĐƠN VỊ SẢN PHẨM
// =========================================================================
export const getAllUnits = async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM public.don_vi_san_pham ORDER BY id ASC');
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: "Lỗi tải danh sách đơn vị." });
    }
};

// =========================================================================
// 2. THÊM ĐƠN VỊ MỚI
// =========================================================================
export const createUnit = async (req, res) => {
    try {
        const { ten_don_vi, mo_ta } = req.body;
        if (!ten_don_vi) return res.status(400).json({ message: "Thiếu tên đơn vị." });

        const query = `
            INSERT INTO public.don_vi_san_pham (ten_don_vi, mo_ta, trang_thai, ngay_tao, ngay_cap_nhat) 
            VALUES ($1, $2, true, NOW(), NOW()) 
            RETURNING *;
        `;
        const { rows } = await pool.query(query, [ten_don_vi, mo_ta || ""]);
        res.status(201).json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: "Lỗi thêm đơn vị mới." });
    }
};

// =========================================================================
// 3. CẬP NHẬT ĐƠN VỊ
// =========================================================================
export const updateUnit = async (req, res) => {
    try {
        const { id } = req.params;
        const { ten_don_vi, mo_ta } = req.body;
        const query = `
            UPDATE public.don_vi_san_pham 
            SET ten_don_vi = $1, mo_ta = $2, ngay_cap_nhat = NOW() 
            WHERE id = $3 RETURNING *;
        `;
        const { rows } = await pool.query(query, [ten_don_vi, mo_ta, id]);
        if (rows.length === 0) return res.status(404).json({ message: "Không tìm thấy đơn vị." });
        res.status(200).json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: "Lỗi cập nhật đơn vị." });
    }
};

// =========================================================================
// 4. XÓA ĐƠN VỊ (SOFT DELETE)
// =========================================================================
export const softDeleteUnit = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('UPDATE public.don_vi_san_pham SET trang_thai = false, ngay_cap_nhat = NOW() WHERE id = $1', [id]);
        res.status(200).json({ message: "Đã đưa vào lưu trữ." });
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi lưu trữ." });
    }
};

// =========================================================================
// 5. KHÔI PHỤC ĐƠN VỊ
// =========================================================================
export const restoreUnit = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('UPDATE public.don_vi_san_pham SET trang_thai = true, ngay_cap_nhat = NOW() WHERE id = $1', [id]);
        res.status(200).json({ message: "Đã khôi phục thành công." });
    } catch (error) {
        res.status(500).json({ error: "Lỗi khôi phục." });
    }
};

// =========================================================================
// 6. XÓA VĨNH VIỄN ĐƠN VỊ
// =========================================================================
export const hardDeleteUnit = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM public.don_vi_san_pham WHERE id = $1', [id]);
        res.status(200).json({ message: "Đã xóa vĩnh viễn." });
    } catch (error) {
        res.status(500).json({ error: "Lỗi xóa vĩnh viễn (có thể do đã có sản phẩm dùng đơn vị này)." });
    }
};