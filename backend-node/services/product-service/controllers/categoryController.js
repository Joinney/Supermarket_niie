import pool from '../configs/database.js'; // Nhớ kiểm tra lại đường dẫn import file DB

// =========================================================================
// 1. LẤY CÂY DANH MỤC (TRANG CHỦ / SIDEBAR) - ĐÃ CÓ HÌNH ẢNH & QUỐC GIA
// =========================================================================
export const getAllCategories = async (req, res) => {
    try {
        const countryCode = (req.query.country || 'VN').toUpperCase();

        const queryCha = `
            SELECT ma_dm_cha, ten_danh_muc_cha, duong_dan_seo, bieu_tuong, hinh_anh 
            FROM public.danh_muc_cha 
            WHERE trang_thai = true AND UPPER(ma_quoc_gia) = $1
            ORDER BY ma_dm_cha ASC;
        `;
        
        const queryCon = `
            SELECT dmc.ma_dm_con, dmc.ma_dm_cha, dmc.ten_danh_muc_con, dmc.duong_dan_seo, dmc.la_danh_muc_hot, dmc.hinh_anh 
            FROM public.danh_muc_con dmc
            WHERE dmc.trang_thai = true AND UPPER(dmc.ma_quoc_gia) = $1
            ORDER BY dmc.ma_dm_con ASC;
        `;

        const resCha = await pool.query(queryCha, [countryCode]);
        const resCon = await pool.query(queryCon, [countryCode]);

        const tree = [];
        const categoryMap = {};

        resCha.rows.forEach(row => {
            categoryMap[row.ma_dm_cha] = {
                id: row.ma_dm_cha,
                name: row.ten_danh_muc_cha,
                slug: row.duong_dan_seo,
                i: row.bieu_tuong || "", 
                image: row.hinh_anh || "",
                children: []
            };
            tree.push(categoryMap[row.ma_dm_cha]);
        });

        resCon.rows.forEach(row => {
            const childNode = {
                id: row.ma_dm_con,
                name: row.ten_danh_muc_con,
                slug: row.duong_dan_seo,
                hot: row.la_danh_muc_hot || false,
                image: row.hinh_anh || "",
                parentId: row.ma_dm_cha
            };

            if (categoryMap[row.ma_dm_cha]) {
                categoryMap[row.ma_dm_cha].children.push(childNode);
            }
        });

        const cleanTree = tree.filter(cat => cat.children && cat.children.length > 0);
        res.status(200).json(cleanTree);
    } catch (error) {
        console.error("❌ Lỗi API getAllCategories:", error.message);
        res.status(500).json({ error: "Không thể tải cây danh mục hệ thống." });
    }
};

// =========================================================================
// 2. TÌM KIẾM DANH MỤC (CẢ CHA VÀ CON)
// =========================================================================
export const searchCategories = async (req, res) => {
    const keyword = req.query.keyword || '';
    const countryCode = (req.query.country || 'VN').toUpperCase();

    try {
        const searchTerm = `%${keyword}%`;
        const query = `
            SELECT ma_dm_cha AS ma_danh_muc, ten_danh_muc_cha AS ten_danh_muc, duong_dan_seo AS slug, hinh_anh, 'cha' AS loai_danh_muc
            FROM public.danh_muc_cha
            WHERE trang_thai = true AND UPPER(ma_quoc_gia) = $2 
              AND unaccent(ten_danh_muc_cha) ILIKE unaccent($1)
            
            UNION ALL
            
            SELECT ma_dm_con AS ma_danh_muc, ten_danh_muc_con AS ten_danh_muc, duong_dan_seo AS slug, hinh_anh, 'con' AS loai_danh_muc
            FROM public.danh_muc_con
            WHERE trang_thai = true AND UPPER(ma_quoc_gia) = $2 
              AND unaccent(ten_danh_muc_con) ILIKE unaccent($1)
            
            LIMIT 12;
        `;
        
        const { rows: categories } = await pool.query(query, [searchTerm, countryCode]);
        res.status(200).json(categories);
    } catch (error) {
        console.error("❌ Lỗi API searchCategories:", error.message);
        res.status(500).json({ error: "Lỗi hệ thống khi tìm kiếm danh mục." });
    }
};

// =========================================================================
// 3. LẤY DANH SÁCH QUỐC GIA (DÙNG CHO DROPDOWN BỘ LỌC ADMIN)
// =========================================================================
export const getAllCountries = async (req, res) => {
    try {
        const query = `
            SELECT 
                ma_quoc_gia, 
                ten_quoc_gia, 
                dinh_dang_vung, 
                ma_tien_te, 
                bieu_tuong_tien, 
                ty_gia, 
                bieu_tuong_co
            FROM public.danh_muc_quoc_gia 
            WHERE trang_thai = true 
            ORDER BY ten_quoc_gia ASC;
        `;
        const { rows: countries } = await pool.query(query);
        res.status(200).json(countries);
    } catch (error) {
        console.error("❌ Lỗi API getAllCountries:", error.message);
        res.status(500).json({ error: "Gặp sự cố hệ thống, không thể tải danh sách quốc gia." });
    }
};

// =========================================================================
// 4. LẤY DANH SÁCH DANH MỤC CHA DÀNH CHO ADMIN (CÓ LỌC QUỐC GIA)
// =========================================================================
export const getParentCategories = async (req, res) => {
    try {
        const { country } = req.query; 
        
        let query = `SELECT * FROM public.danh_muc_cha WHERE 1=1`;
        let values = [];
        let paramIndex = 1;

        // Nếu FE có chọn quốc gia (khác ALL) thì lọc
        if (country && country !== 'ALL') {
            query += ` AND UPPER(ma_quoc_gia) = $${paramIndex}`;
            values.push(country.toUpperCase());
            paramIndex++;
        }

        query += ` ORDER BY ngay_tao DESC`; // Sắp xếp mới nhất lên đầu

        const { rows } = await pool.query(query, values);
        
        // Trả về chuẩn format { success: true, data: [...] } mà Frontend đang đợi
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error('❌ Lỗi API getParentCategories:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ khi lấy danh mục cha.' });
    }
};

// =========================================================================
// 5. XÓA MỀM DANH MỤC CHA (CÓ BẢO VỆ DỮ LIỆU)
// =========================================================================
export const deleteParentCategory = async (req, res) => {
    try {
        const { id } = req.params; // ma_dm_cha

        // Lớp bảo vệ: Kiểm tra xem danh mục cha này có danh mục con nào đang hoạt động không?
        const checkQuery = `SELECT COUNT(*) FROM public.danh_muc_con WHERE ma_dm_cha = $1 AND trang_thai = true`;
        const { rows } = await pool.query(checkQuery, [id]);
        
        const childCount = parseInt(rows[0].count);

        if (childCount > 0) {
            return res.status(400).json({ 
                success: false, 
                message: `Từ chối xóa! Danh mục này đang chứa ${childCount} danh mục con. Vui lòng xóa hoặc di chuyển danh mục con trước.` 
            });
        }

        // Đủ điều kiện -> Tiến hành xóa mềm (Ẩn đi)
        const updateQuery = `
            UPDATE public.danh_muc_cha 
            SET trang_thai = false, ngay_cap_nhat = NOW() 
            WHERE ma_dm_cha = $1 
            RETURNING *;
        `;
        const result = await pool.query(updateQuery, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục.' });
        }

        res.status(200).json({ success: true, message: 'Đã lưu trữ (xóa) danh mục thành công.' });
    } catch (error) {
        console.error('❌ Lỗi API deleteParentCategory:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ khi xóa danh mục.' });
    }
};

// =========================================================================
// 6. KHÔI PHỤC DANH MỤC ĐÃ XÓA MỀM (RESTORE)
// =========================================================================
export const restoreParentCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const query = `UPDATE public.danh_muc_cha SET trang_thai = true, ngay_cap_nhat = NOW() WHERE ma_dm_cha = $1 RETURNING *;`;
        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục.' });
        res.status(200).json({ success: true, message: 'Đã khôi phục danh mục thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi máy chủ khi khôi phục.' });
    }
};

// =========================================================================
// 7. XÓA VĨNH VIỄN DANH MỤC CHA (HARD DELETE - CHỈ CHO PHÉP KHI RỖNG)
// =========================================================================
export const hardDeleteParentCategory = async (req, res) => {
    try {
        const { id } = req.params;

        // BẢO VỆ 2 LỚP: Kiểm tra xem có chứa danh mục con (dù là đang tắt hay bật) không?
        const checkChild = await pool.query(`SELECT COUNT(*) FROM public.danh_muc_con WHERE ma_dm_cha = $1`, [id]);
        if (parseInt(checkChild.rows[0].count) > 0) {
            return res.status(400).json({ success: false, message: 'Không thể xóa vĩnh viễn! Danh mục này vẫn đang chứa danh mục con bên trong.' });
        }

        // Xóa sạch sẽ khỏi DB
        const result = await pool.query(`DELETE FROM public.danh_muc_cha WHERE ma_dm_cha = $1 RETURNING *;`, [id]);
        
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục để xóa.' });
        res.status(200).json({ success: true, message: 'Đã xóa vĩnh viễn danh mục khỏi cơ sở dữ liệu!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi hệ thống khi xóa vĩnh viễn. Có thể do ràng buộc dữ liệu.' });
    }
};