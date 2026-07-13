import pool from '../configs/database.js'; 

// =========================================================================
// 1. LẤY CÂY DANH MỤC (TRANG CHỦ / SIDEBAR) - ĐÃ PHÂN LUỒNG ROLE TỐI ƯU
// =========================================================================
export const getAllCategories = async (req, res) => {
    try {
        const countryCode = (req.query.country || 'VN').toUpperCase();
        const role = req.query.role; 

        const statusFilterCha = role === 'client' ? 'AND trang_thai = true' : '';
        const statusFilterCon = role === 'client' ? 'AND dmc.trang_thai = true' : '';

        // 🌟 FIX: Loại bỏ cột bieu_tuong khỏi câu lệnh SELECT
        const queryCha = `
            SELECT ma_dm_cha, ten_danh_muc_cha, duong_dan_seo, hinh_anh, trang_thai 
            FROM public.danh_muc_cha 
            WHERE UPPER(ma_quoc_gia) = $1 ${statusFilterCha}
            ORDER BY ma_dm_cha ASC;
        `;
        
        const queryCon = `
            SELECT dmc.ma_dm_con, dmc.ma_dm_cha, dmc.ten_danh_muc_con, dmc.duong_dan_seo, dmc.la_danh_muc_hot, dmc.hinh_anh, dmc.trang_thai 
            FROM public.danh_muc_con dmc
            WHERE UPPER(dmc.ma_quoc_gia) = $1 ${statusFilterCon}
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
                image: row.hinh_anh || "", // 🌟 Chỉ tập trung dùng hình ảnh URL chuẩn
                trang_thai: row.trang_thai, 
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
                trang_thai: row.trang_thai, 
                parentId: row.ma_dm_cha
            };

            if (categoryMap[row.ma_dm_cha]) {
                categoryMap[row.ma_dm_cha].children.push(childNode);
            }
        });

        let finalTree = tree;
        if (role === 'client') {
            finalTree = tree.filter(cat => cat.children && cat.children.length > 0);
        }

        res.status(200).json(finalTree);
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
// 3. LẤY DANH SÁCH DANH MỤC CHA DÀNH CHO ADMIN (CÓ LỌC QUỐC GIA)
// =========================================================================
export const getParentCategories = async (req, res) => {
    try {
        const { country } = req.query; 
        
        let query = `SELECT ma_dm_cha, ten_danh_muc_cha, duong_dan_seo, hinh_anh, trang_thai, ma_quoc_gia, ngay_tao, ngay_cap_nhat FROM public.danh_muc_cha WHERE 1=1`;
        let values = [];
        let paramIndex = 1;

        if (country && country !== 'ALL') {
            query += ` AND UPPER(ma_quoc_gia) = $${paramIndex}`;
            values.push(country.toUpperCase());
            paramIndex++;
        }

        query += ` ORDER BY ngay_tao DESC`;

        const { rows } = await pool.query(query, values);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error('❌ Lỗi API getParentCategories:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ khi lấy danh mục cha.' });
    }
};

// =========================================================================
// 4. THÊM MỚI DANH MỤC CHA
// =========================================================================
export const createParentCategory = async (req, res) => {
    try {
        // 🌟 FIX: Loại bỏ bieu_tuong khỏi dữ liệu nhận từ Request Body
        const { ma_dm_cha, ten_danh_muc_cha, ma_quoc_gia, hinh_anh, duong_dan_seo } = req.body;

        let finalMaDmCha = "";

        if (ma_dm_cha && ma_dm_cha.trim() !== "") {
            finalMaDmCha = ma_dm_cha.trim().toUpperCase();
        } else {
            const autoSuffix = ten_danh_muc_cha
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '') 
                .replace(/[^a-zA-Z0-9\s]/g, '')  
                .trim()
                .replace(/\s+/g, '_')            
                .toUpperCase()
                .substring(0, 15);               
            
            finalMaDmCha = `MDC_${ma_quoc_gia.toUpperCase()}_${autoSuffix}`;
        }

        let currentCode = finalMaDmCha;
        let counter = 1;
        while (true) {
            const checkRes = await pool.query('SELECT ma_dm_cha FROM public.danh_muc_cha WHERE ma_dm_cha = $1', [currentCode]);
            if (checkRes.rows.length === 0) break; 
            currentCode = `${finalMaDmCha}_${counter}`;
            counter++;
        }
        finalMaDmCha = currentCode;

        const finalSeo = duong_dan_seo || ten_danh_muc_cha
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-');

        // 🌟 FIX: Bỏ cột bieu_tuong và tham số $5 tương ứng
        const query = `
            INSERT INTO public.danh_muc_cha 
            (ma_dm_cha, ten_danh_muc_cha, ma_quoc_gia, hinh_anh, duong_dan_seo, trang_thai) 
            VALUES ($1, $2, $3, $4, $5, true) 
            RETURNING *;
        `;
        
        const values = [
            finalMaDmCha, 
            ten_danh_muc_cha.trim(), 
            ma_quoc_gia, 
            hinh_anh || null, 
            finalSeo
        ];

        const { rows } = await pool.query(query, values);
        res.status(201).json({ success: true, data: rows[0] });
    } catch (error) {
        console.error("❌ Lỗi tạo danh mục cha:", error);
        res.status(500).json({ success: false, message: "Lỗi máy chủ khi tạo danh mục." });
    }
};

// =========================================================================
// 5. XÓA MỀM DANH MỤC CHA (CÓ BẢO VỆ DỮ LIỆU & REAL-TIME SOCKET)
// =========================================================================
export const deleteParentCategory = async (req, res) => {
    try {
        const { id } = req.params; 

        const checkQuery = `SELECT COUNT(*) FROM public.danh_muc_con WHERE ma_dm_cha = $1 AND trang_thai = true`;
        const { rows } = await pool.query(checkQuery, [id]);
        const childCount = parseInt(rows[0].count);

        if (childCount > 0) {
            return res.status(400).json({ 
                success: false, 
                message: `Từ chối xóa! Danh mục này đang chứa ${childCount} danh mục con. Vui lòng xóa hoặc di chuyển danh mục con trước.` 
            });
        }

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

        const io = req.app.get('io');
        if (io) {
            io.emit('category_status_changed', {
                ma_danh_muc: id,
                trang_thai: false,
                loai_danh_muc: 'cha' 
            });
        }

        res.status(200).json({ success: true, message: 'Đã lưu trữ (xóa) danh mục thành công.' });
    } catch (error) {
        console.error('❌ Lỗi API deleteParentCategory:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ khi xóa danh mục.' });
    }
};

// =========================================================================
// 6. KHÔI PHỤC DANH MỤC CHA ĐÃ XÓA MỀM (RESTORE)
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
// 7. CẬP NHẬT DANH MỤC CHA
// =========================================================================
export const updateParentCategory = async (req, res) => {
    try {
        const { id } = req.params; 
        // 🌟 FIX: Loại bỏ bieu_tuong khỏi dữ liệu nhận từ Request Body
        const { ten_danh_muc_cha, ma_quoc_gia, hinh_anh } = req.body;
        
        const duong_dan_seo = ten_danh_muc_cha
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') 
            .replace(/[^a-z0-9\s-]/g, '')    
            .replace(/\s+/g, '-');           

        // 🌟 FIX: Loại bỏ gán bieu_tuong = $4 cũ, dồn các chỉ mục parameter lại chuẩn xác
        const query = `
            UPDATE public.danh_muc_cha 
            SET ten_danh_muc_cha = $1, ma_quoc_gia = $2, hinh_anh = $3, duong_dan_seo = $4 
            WHERE ma_dm_cha = $5 
            RETURNING *;
        `;
        const { rows } = await pool.query(query, [
            ten_danh_muc_cha.trim(), 
            ma_quoc_gia, 
            hinh_anh || null, 
            duong_dan_seo, 
            id
        ]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Không tìm thấy danh mục cha." });
        }

        res.status(200).json({ success: true, data: rows[0] });
    } catch (error) {
        console.error("❌ Lỗi cập nhật danh mục cha:", error);
        res.status(500).json({ success: false, message: "Lỗi server khi cập nhật." });
    }
};

// =========================================================================
// 8. XÓA VĨNH VIỄN DANH MỤC CHA (HARD DELETE)
// =========================================================================
export const hardDeleteParentCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const checkChild = await pool.query(`SELECT COUNT(*) FROM public.danh_muc_con WHERE ma_dm_cha = $1`, [id]);
        if (parseInt(checkChild.rows[0].count) > 0) {
            return res.status(400).json({ success: false, message: 'Không thể xóa vĩnh viễn! Danh mục này vẫn đang chứa danh mục con bên trong.' });
        }

        const result = await pool.query(`DELETE FROM public.danh_muc_cha WHERE ma_dm_cha = $1 RETURNING *;`, [id]);
        
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục để xóa.' });
        res.status(200).json({ success: true, message: 'Đã xóa vĩnh viễn danh mục khỏi cơ sở dữ liệu!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi hệ thống khi xóa vĩnh viễn. Có thể do ràng buộc dữ liệu.' });
    }
};

// =========================================================================
// 9. LẤY DANH SÁCH DANH MỤC CON (CÓ LỌC THEO QUỐC GIA & CHA)
// =========================================================================
export const getChildCategories = async (req, res) => {
    try {
        const { country, parentId } = req.query;
        let query = `SELECT * FROM public.danh_muc_con WHERE 1=1`;
        let values = [];
        let index = 1;

        if (country && country !== 'ALL') {
            query += ` AND UPPER(ma_quoc_gia) = $${index++}`;
            values.push(country.toUpperCase());
        }
        if (parentId) {
            query += ` AND ma_dm_cha = $${index++}`;
            values.push(parentId);
        }

        query += ` ORDER BY ngay_tao DESC`;
        const { rows } = await pool.query(query, values);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi lấy danh mục con' });
    }
};

// =========================================================================
// 10. THÊM MỚI DANH MỤC CON
// =========================================================================
export const createChildCategory = async (req, res) => {
    try {
        const { ma_dm_con, ma_dm_cha, ten_danh_muc_con, ma_quoc_gia, hinh_anh } = req.body;
        
        const countryCode = (ma_quoc_gia || 'VN').toUpperCase();

        let finalMaDmCon = "";

        if (ma_dm_con && ma_dm_con.trim() !== "") {
            finalMaDmCon = ma_dm_con.trim().toUpperCase();
        } else {
            const autoSuffix = ten_danh_muc_con
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-zA-Z0-9\s]/g, '')  
                .trim()
                .replace(/\s+/g, '_')            
                .toUpperCase()
                .substring(0, 15);               
            
            finalMaDmCon = `MDM_${countryCode}_${autoSuffix}`;
        }

        let currentCode = finalMaDmCon;
        let counter = 1;
        while (true) {
            const checkRes = await pool.query('SELECT ma_dm_con FROM public.danh_muc_con WHERE ma_dm_con = $1', [currentCode]);
            if (checkRes.rows.length === 0) break; 
            currentCode = `${finalMaDmCon}_${counter}`;
            counter++;
        }
        finalMaDmCon = currentCode;

        const duong_dan_seo = ten_danh_muc_con
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-');

        const query = `
            INSERT INTO public.danh_muc_con 
            (ma_dm_con, ma_dm_cha, ten_danh_muc_con, duong_dan_seo, ma_quoc_gia, hinh_anh, trang_thai)
            VALUES ($1, $2, $3, $4, $5, $6, true) RETURNING *;
        `;
        const { rows } = await pool.query(query, [
            finalMaDmCon, 
            ma_dm_cha, 
            ten_danh_muc_con.trim(), 
            duong_dan_seo, 
            countryCode, 
            hinh_anh || null
        ]);
        
        res.status(201).json({ success: true, data: rows[0] });
    } catch (error) {
        console.error("❌ Lỗi tạo danh mục con:", error);
        res.status(500).json({ success: false, message: 'Lỗi tạo danh mục con: ' + error.message });
    }
};

// =========================================================================
// 11. XÓA DANH MỤC CON (SOFT DELETE & REAL-TIME SOCKET)
// =========================================================================
export const deleteChildCategory = async (req, res) => {
    try {
        const { id } = req.params; 
        const query = `UPDATE public.danh_muc_con SET trang_thai = false WHERE ma_dm_con = $1 RETURNING *;`;
        const result = await pool.query(query, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục con.' });
        }

        const io = req.app.get('io');
        if (io) {
            io.emit('category_status_changed', {
                ma_danh_muc: id,
                trang_thai: false,
                loai_danh_muc: 'con'
            });
        }

        res.status(200).json({ success: true, message: 'Đã xóa mềm danh mục con.' });
    } catch (error) {
        console.error('❌ Lỗi API deleteChildCategory:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi xóa danh mục con.' });
    }
};

// =========================================================================
// 12. XÓA VĨNH VIỄN DANH MỤC CON (HARD DELETE)
// =========================================================================
export const hardDeleteChildCategory = async (req, res) => {
    try {
        const { id } = req.params; 
        
        const productCheck = await pool.query(
            `SELECT COUNT(*) FROM public.san_pham WHERE ma_dm_con = $1`, 
            [id]
        );

        if (parseInt(productCheck.rows[0].count) > 0) {
            return res.status(400).json({ 
                success: false, 
                message: `⚠️ Không thể xóa vĩnh viễn: Danh mục này đang chứa ${productCheck.rows[0].count} sản phẩm!` 
            });
        }

        await pool.query(`DELETE FROM public.danh_muc_con WHERE ma_dm_con = $1`, [id]);
        res.status(200).json({ success: true, message: 'Đã xóa hoàn toàn!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
    }
};

// =========================================================================
// 13. CẬP NHẬT DANH MỤC CON
// =========================================================================
export const updateChildCategory = async (req, res) => {
    try {
        const { id } = req.params; 
        const { ma_dm_cha, ten_danh_muc_con, ma_quoc_gia, hinh_anh } = req.body;
        
        const duong_dan_seo = ten_danh_muc_con
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-');

        const query = `
            UPDATE public.danh_muc_con 
            SET ma_dm_cha = $1, ten_danh_muc_con = $2, duong_dan_seo = $3, ma_quoc_gia = $4, hinh_anh = $5 
            WHERE ma_dm_con = $6 
            RETURNING *;
        `;
        const { rows } = await pool.query(query, [
            ma_dm_cha, 
            ten_danh_muc_con.trim(), 
            duong_dan_seo, 
            ma_quoc_gia, 
            hinh_anh || null, 
            id
        ]);
        
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục con.' });
        
        res.status(200).json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('❌ Lỗi Sửa danh mục con:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ khi cập nhật.' });
    }
};

// =========================================================================
// 14. KHÔI PHỤC DANH MỤC CON (RESTORE)
// =========================================================================
export const restoreChildCategory = async (req, res) => {
    try {
        const { id } = req.params; 
        const query = `UPDATE public.danh_muc_con SET trang_thai = true WHERE ma_dm_con = $1 RETURNING *;`;
        const result = await pool.query(query, [id]);
        
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục.' });
        res.status(200).json({ success: true, message: 'Đã khôi phục thành công!' });
    } catch (error) {
        console.error('Lỗi Khôi phục:', error);
        res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
    }
};

// =========================================================================
// 15. Bật/Tắt danh mục con là Hot (la_danh_muc_hot)
// =========================================================================
export const toggleHotChildCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { la_danh_muc_hot } = req.body; 

        const query = `
            UPDATE public.danh_muc_con 
            SET la_danh_muc_hot = $1 
            WHERE ma_dm_con = $2 
            RETURNING *;
        `;
        const { rows } = await pool.query(query, [la_danh_muc_hot, id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Không tìm thấy danh mục con." });
        }

        res.status(200).json({ success: true, data: rows[0], message: "Cập nhật thành công!" });
    } catch (error) {
        console.error("Lỗi cập nhật Danh mục Hot:", error);
        res.status(500).json({ success: false, message: "Lỗi server." });
    }
};