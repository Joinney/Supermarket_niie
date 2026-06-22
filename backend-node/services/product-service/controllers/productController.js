import pool from '../configs/database.js';
import { batchGenerateDescriptions, generateDescriptionFromAI } from '../utils/aiDescriptionGenerator.js'; 

// =========================================================================
// HÀM UTILS HỖ TRỢ CHUẨN HÓA DỮ LIỆU ĐẦU VÀO
// =========================================================================
const sanitizePagination = (pageInput, limitInput) => {
    const page = Math.max(1, parseInt(pageInput) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(limitInput) || 12)); 
    const offset = (page - 1) * limit;
    return { limit, offset };
};

// =========================================================================
// 0. API NỘI BỘ: LẤY THÔNG TIN CHI TIẾT BIẾN THỂ CHO CÁC SERVICE KHÁC
// =========================================================================
export const getInternalVariants = async (req, res) => {
    try {
        const { variantIds } = req.body;

        if (!variantIds || !Array.isArray(variantIds) || variantIds.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Danh sách mã biến thể (variantIds) không được trống.' 
            });
        }

        const query = `
            SELECT ma_bien_the, ma_san_pham, ten_bien_the, sku, gia_ban_le, gia_khuyen_mai, ton_kho, trang_thai
            FROM public.bien_the_san_pham
            WHERE ma_bien_the = ANY($1::text[]) 
              AND trang_thai = true;
        `;

        const { rows: variants } = await pool.query(query, [variantIds]);
        
        res.status(200).json(variants);
    } catch (error) {
        console.error('❌ Lỗi API getInternalVariants:', error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Sự cố máy chủ khi truy xuất dữ liệu biến thể nội bộ.' 
        });
    }
};

// =========================================================================
// 1. LẤY TẤT CẢ SẢN PHẨM (TRANG HOME) - Lọc chuẩn theo quốc gia trực tiếp
// =========================================================================
export const getAllProducts = async (req, res) => {
    try {
        const { limit, offset } = sanitizePagination(req.query.page, req.query.limit);
        const countryCode = (req.query.country || 'VN').toUpperCase(); 

        const query = `
            SELECT 
                sp.ma_san_pham, sp.ten_san_pham, sp.mo_ta, sp.trang_thai, sp.ngay_tao, sp.ngay_cap_nhat,
                dmc.ten_danh_muc_con, dmc.duong_dan_seo AS slug_danh_muc, LOWER(sp.ma_quoc_gia) AS country_code,
                COALESCE((SELECT MIN(gia_ban_le) FROM public.bien_the_san_pham WHERE ma_san_pham = sp.ma_san_pham AND trang_thai = true), 0) AS gia_ban_thap_nhat,
                (SELECT duong_dan_url FROM public.media_san_pham WHERE ma_san_pham = sp.ma_san_pham AND la_anh_chinh = true AND trang_thai = true LIMIT 1) AS hinh_anh_chinh
            FROM public.san_pham sp
            INNER JOIN public.danh_muc_con dmc ON sp.ma_dm_con = dmc.ma_dm_con
            WHERE sp.trang_thai = true 
              AND dmc.trang_thai = true
              AND sp.ma_quoc_gia = $1
            ORDER BY sp.ngay_tao DESC
            LIMIT $2 OFFSET $3;
        `;

        console.log("=== ĐANG CHẠY CODE MỚI NHẤT ===");
        console.log("💡 CÂU QUERY THỰC TẾ:", query);
        console.log("💡 PARAMS:", [countryCode, limit, offset]);

        const { rows: products } = await pool.query(query, [countryCode, limit, offset]);
        res.status(200).json(products);
    } catch (error) {
        console.error("❌ Lỗi API getAllProducts:", error.message);
        res.status(500).json({ error: "Không thể lấy danh sách sản phẩm trang chủ." });
    }
};

// =========================================================================
// 1.5 LẤY TẤT CẢ DANH MỤC (SIDEBAR) - Tối ưu hóa xử lý Fallback vùng miền rỗng
// =========================================================================
export const getAllCategories = async (req, res) => {
    try {
        const countryCode = (req.query.country || 'VN').toUpperCase();

        const queryCha = `
            SELECT ma_dm_cha, ten_danh_muc_cha, duong_dan_seo, bieu_tuong, hinh_anh 
            FROM public.danh_muc_cha 
            WHERE trang_thai = true AND ma_quoc_gia = $1
            ORDER BY ma_dm_cha ASC;
        `;
        
        const queryCon = `
            SELECT dmc.ma_dm_con, dmc.ma_dm_cha, dmc.ten_danh_muc_con, dmc.duong_dan_seo, dmc.la_danh_muc_hot, dmc.hinh_anh 
            FROM public.danh_muc_con dmc
            WHERE dmc.trang_thai = true AND dmc.ma_quoc_gia = $1
            ORDER BY dmc.ma_dm_con ASC;
        `;

        const [resCha, resCon] = await Promise.all([
            pool.query(queryCha, [countryCode]),
            pool.query(queryCon, [countryCode])
        ]);

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
// 2. LẤY CHI TIẾT 1 SẢN PHẨM (TRANG CHI TIẾT) - FIX LỖI 500
// =========================================================================
export const getProductById = async (req, res) => {
    const { id } = req.params; 
    const countryCode = (req.query.country || 'VN').toUpperCase();

    try {
        const query = `
            SELECT 
                sp.ma_san_pham, sp.ma_dm_con, sp.ten_san_pham, sp.mo_ta, sp.trang_thai, sp.ngay_tao, sp.ngay_cap_nhat,
                dmc.ten_danh_muc_con, dmc.duong_dan_seo AS slug_danh_muc, LOWER(sp.ma_quoc_gia) AS country_code,
                COALESCE(
                    (SELECT json_agg(
                        json_build_object(
                            'ma_bien_the', bt.ma_bien_the, 'ten_bien_the', bt.ten_bien_the, 'sku', bt.sku,
                            'gia_ban_le', bt.gia_ban_le, 'thuoc_tinh', bt.thuoc_tinh, 'ten_don_vi', dv.ten_don_vi
                        )
                    ) FROM public.bien_the_san_pham bt 
                      LEFT JOIN public.don_vi_san_pham dv ON bt.don_vi_id = dv.id
                      WHERE bt.ma_san_pham = sp.ma_san_pham AND bt.trang_thai = true
                    ), '[]'
                ) as bien_the,
                COALESCE(
                    (SELECT json_agg(
                        json_build_object(
                            'ma_media', m.ma_media, 
                            'ma_bien_the', m.ma_bien_the, /* 🛠️ CHỈ BỔ SUNG ĐÚNG DÒNG NÀY ĐỂ ĐỔI ẢNH */
                            'duong_dan_url', m.duong_dan_url, 
                            'la_anh_chinh', m.la_anh_chinh,
                            'loai_media', m.loai_media, 
                            'thoi_luong_video', m.thoi_luong_video
                        )
                    ) FROM public.media_san_pham m WHERE m.ma_san_pham = sp.ma_san_pham AND m.trang_thai = true), '[]'
                ) as media
            FROM public.san_pham sp
            INNER JOIN public.danh_muc_con dmc ON sp.ma_dm_con = dmc.ma_dm_con
            WHERE sp.ma_san_pham = $1
              AND sp.ma_quoc_gia = $2;
        `;
        
        const result = await pool.query(query, [id, countryCode]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Sản phẩm không hỗ trợ tại vùng quốc gia này!" });
        }

        res.status(200).json(result.rows[0]); 
    } catch (error) {
        console.error("❌ Lỗi API getProductById:", error.message);
        res.status(500).json({ error: "Lỗi hệ thống khi tìm chi tiết sản phẩm." });
    }
};

// =========================================================================
// 3. LẤY SẢN PHẨM THEO DANH MỤC (SLUG)
// =========================================================================
export const getProductsByCategorySlug = async (req, res) => {
    const { slug } = req.params;
    const countryCode = (req.query.country || 'VN').toUpperCase();

    try {
        let query = `
            SELECT 
                sp.ma_san_pham, sp.ten_san_pham, sp.mo_ta, sp.trang_thai, sp.ngay_tao,
                dmc.ten_danh_muc_con, dmc.duong_dan_seo AS slug_danh_muc, LOWER(sp.ma_quoc_gia) AS country_code,
                COALESCE((SELECT MIN(gia_ban_le) FROM public.bien_the_san_pham WHERE ma_san_pham = sp.ma_san_pham AND trang_thai = true), 0) AS gia_ban_thap_nhat,
                (SELECT duong_dan_url FROM public.media_san_pham WHERE ma_san_pham = sp.ma_san_pham AND la_anh_chinh = true AND trang_thai = true LIMIT 1) AS hinh_anh_chinh
            FROM public.san_pham sp
            INNER JOIN public.danh_muc_con dmc ON sp.ma_dm_con = dmc.ma_dm_con
            WHERE sp.trang_thai = true
              AND dmc.trang_thai = true
              AND sp.ma_quoc_gia = $1
        `;
        
        const params = [countryCode];

        if (slug !== 'tat-ca') {
            query += ` AND (dmc.duong_dan_seo = $2 OR dmc.ma_dm_cha = (SELECT ma_dm_cha FROM public.danh_muc_cha WHERE duong_dan_seo = $2 AND trang_thai = true LIMIT 1))`;
            params.push(slug);
        }

        query += ` ORDER BY sp.ngay_tao DESC;`;

        const { rows: products } = await pool.query(query, params);
        res.status(200).json(products);
    } catch (error) {
        console.error("❌ Lỗi API getProductsByCategorySlug:", error.message);
        res.status(500).json({ error: "Lỗi khi lấy danh sách sản phẩm theo danh mục." });
    }
};

// =========================================================================
// 4. TÌM KIẾM SẢN PHẨM THEO TỪ KHÓA - HỖ TRỢ TÌM KHÔNG DẤU
// =========================================================================
export const searchProducts = async (req, res) => {
    const keyword = req.query.keyword || '';
    const countryCode = (req.query.country || 'VN').toUpperCase();
    
    try {
        const query = `
            SELECT 
                sp.ma_san_pham, sp.ten_san_pham, sp.mo_ta, sp.trang_thai, sp.ngay_tao,
                dmc.ten_danh_muc_con, dmc.duong_dan_seo AS slug_danh_muc, LOWER(sp.ma_quoc_gia) AS country_code,
                COALESCE((SELECT MIN(gia_ban_le) FROM public.bien_the_san_pham WHERE ma_san_pham = sp.ma_san_pham AND trang_thai = true), 0) AS gia_ban_thap_nhat,
                (SELECT duong_dan_url FROM public.media_san_pham WHERE ma_san_pham = sp.ma_san_pham AND la_anh_chinh = true AND trang_thai = true LIMIT 1) AS hinh_anh_chinh
            FROM public.san_pham sp
            INNER JOIN public.danh_muc_con dmc ON sp.ma_dm_con = dmc.ma_dm_con
            WHERE sp.trang_thai = true 
              AND dmc.trang_thai = true
              AND sp.ma_quoc_gia = $2
              AND (unaccent(sp.ten_san_pham) ILIKE unaccent($1) OR unaccent(sp.mo_ta) ILIKE unaccent($1))
            ORDER BY sp.ngay_tao DESC;
        `;
        
        const searchTerm = `%${keyword}%`;
        const { rows: products } = await pool.query(query, [searchTerm, countryCode]);

        res.status(200).json(products);
    } catch (error) {
        console.error("❌ Lỗi API searchProducts:", error.message);
        res.status(500).json({ error: "Lỗi máy chủ trong quá trình tìm kiếm." });
    }
};

// =========================================================================
// 5. BATCH GENERATE DESCRIPTIONS VIA AI
// =========================================================================
export const batchGenerateDescriptionsController = async (req, res) => {
    try {
        const { productIds, useOnlineResearch = true } = req.body;

        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Danh sách productIds không được để trống.' });
        }

        if (productIds.length > 100) {
            return res.status(400).json({ success: false, message: 'Chỉ xử lý tối đa 100 sản phẩm một lượt.' });
        }

        const fetchQuery = `
            SELECT sp.ma_san_pham, sp.ten_san_pham, dmc.ten_danh_muc_con AS ten_danh_muc
            FROM public.san_pham sp
            LEFT JOIN public.danh_muc_con dmc ON sp.ma_dm_con = dmc.ma_dm_con
            WHERE sp.ma_san_pham = ANY($1::text[])
            ORDER BY sp.ngay_tao DESC;
        `;

        const { rows: products } = await pool.query(fetchQuery, [productIds]);

        if (products.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm.' });
        }

        const generatedDescriptions = await batchGenerateDescriptions(products, { useOnlineResearch });
        const successful = generatedDescriptions.filter((d) => d.success);
        const failed = generatedDescriptions.filter((d) => !d.success);

        const updatePromises = successful.map((item) => {
            const updateQuery = `UPDATE public.san_pham SET mo_ta = $1, ngay_cap_nhat = NOW() WHERE ma_san_pham = $2;`;
            return pool.query(updateQuery, [item.description, item.ma_san_pham]);
        });
        await Promise.all(updatePromises);

        res.status(200).json({
            success: true,
            message: `Hoàn tất. Đã cập nhật ${updatePromises.length} sản phẩm.`,
            summary: { total: generatedDescriptions.length, successful: successful.length, failed: failed.length },
            results: {
                successful: successful.map((d) => ({ ma_san_pham: d.ma_san_pham, description: d.description })),
                failed: failed.map((d) => ({ ma_san_pham: d.ma_san_pham, error: d.error })),
            },
        });
    } catch (error) {
        console.error('❌ Lỗi tiến trình xử lý Batch AI:', error.message);
        res.status(500).json({ success: false, message: 'Gặp sự cố khi chạy Batch AI.' });
    }
};

// =========================================================================
// 6. GET PRODUCTS WITHOUT DESCRIPTIONS
// =========================================================================
export const getProductsWithoutDescriptions = async (req, res) => {
    try {
        const { limit, offset } = sanitizePagination(req.query.page, req.query.limit);

        const query = `
            SELECT sp.ma_san_pham, sp.ten_san_pham, dmc.ten_danh_muc_con AS ten_danh_muc, sp.mo_ta, sp.ngay_tao
            FROM public.san_pham sp
            LEFT JOIN public.danh_muc_con dmc ON sp.ma_dm_con = dmc.ma_dm_con
            WHERE sp.trang_thai = true 
              AND (sp.mo_ta IS NULL OR sp.mo_ta = '' OR sp.mo_ta = 'Sản phẩm tuyển chọn từ Demi Mart.')
            ORDER BY sp.ngay_tao DESC
            LIMIT $1 OFFSET $2;
        `;

        const { rows: products } = await pool.query(query, [limit, offset]);
        const countQuery = `SELECT COUNT(*) as total FROM public.san_pham sp WHERE sp.trang_thai = true AND (sp.mo_ta IS NULL OR sp.mo_ta = '' OR sp.mo_ta = 'Sản phẩm tuyển chọn từ Demi Mart.');`;
        const { rows: countResult } = await pool.query(countQuery);
        const totalCount = parseInt(countResult[0].total);

        res.status(200).json({
            success: true,
            data: products,
            pagination: { total: totalCount, limit, offset, hasMore: offset + products.length < totalCount },
        });
    } catch (error) {
        console.error('❌ Lỗi API getProductsWithoutDescriptions:', error.message);
        res.status(500).json({ success: false, error: "Không thể lấy danh sách sản phẩm thiếu mô tả." });
    }
};

// =========================================================================
// 7. REFRESH EMPTY DESCRIPTIONS
// =========================================================================
export const refreshEmptyDescriptions = async (req, res) => {
    try {
        const limit = parseInt(req.body.limit) || 50;
        const useOnlineResearch = req.body.useOnlineResearch !== false;

        const query = `
            SELECT ma_san_pham, ten_san_pham, dmc.ten_danh_muc_con AS ten_danh_muc
            FROM public.san_pham sp
            LEFT JOIN public.danh_muc_con dmc ON sp.ma_dm_con = dmc.ma_dm_con
            WHERE sp.trang_thai = true
              AND (sp.mo_ta IS NULL OR sp.mo_ta = '' OR sp.mo_ta = 'Sản phẩm tuyển chọn từ Demi Mart.')
            ORDER BY sp.ngay_tao DESC
            LIMIT $1;
        `;

        const { rows: products } = await pool.query(query, [limit]);

        if (products.length === 0) {
            return res.status(200).json({ success: true, message: 'Không có dữ liệu cần làm mới.', summary: { total: 0, successful: 0, failed: 0 } });
        }

        const generatedDescriptions = await batchGenerateDescriptions(products, { useOnlineResearch });
        const successful = generatedDescriptions.filter((d) => d.success);
        const failed = generatedDescriptions.filter((d) => !d.success);

        const updatePromises = successful.map((item) => {
            return pool.query(`UPDATE public.san_pham SET mo_ta = $1, ngay_cap_nhat = NOW() WHERE ma_san_pham = $2;`, [item.description, item.ma_san_pham]);
        });
        await Promise.all(updatePromises);

        res.status(200).json({
            success: true,
            message: `Làm mới mô tả thành công.`,
            summary: { total: generatedDescriptions.length, successful: successful.length, failed: failed.length },
            results: {
                successful: successful.map((d) => ({ ma_san_pham: d.ma_san_pham, description: d.description })),
                failed: failed.map((d) => ({ ma_san_pham: d.ma_san_pham, error: d.error })),
            },
        });
    } catch (error) {
        console.error('❌ Lỗi Refresh Empty Descriptions:', error.message);
        res.status(500).json({ success: false, message: 'Gặp lỗi khi làm mới mô tả.' });
    }
};

// =========================================================================
// 8. CREATE PRODUCT WITH AUTO-GENERATED DESCRIPTION
// =========================================================================
export const createProduct = async (req, res) => {
    try {
        const { ten_san_pham, ma_dm_con, mo_ta, ma_quoc_gia = 'VN' } = req.body;
        const countryCode = ma_quoc_gia.toUpperCase();

        if (!ten_san_pham || !ma_dm_con) {
            return res.status(400).json({ success: false, message: 'Thiếu trường dữ liệu bắt buộc.' });
        }

        const categoryRes = await pool.query('SELECT ten_danh_muc_con FROM public.danh_muc_con WHERE ma_dm_con = $1', [ma_dm_con]);
        const categoryName = categoryRes.rows[0]?.ten_danh_muc_con || '';

        const insertQuery = `
            INSERT INTO public.san_pham (ten_san_pham, ma_dm_con, mo_ta, ma_quoc_gia, trang_thai, ngay_tao)
            VALUES ($1, $2, $3, $4, true, NOW()) RETURNING *;
        `;

        const productRes = await pool.query(insertQuery, [ten_san_pham, ma_dm_con, mo_ta || null, countryCode]);
        const newProduct = productRes.rows[0];

        generateDescriptionFromAI(ten_san_pham, categoryName, true)
            .then(async (description) => {
                if (description) {
                    await pool.query('UPDATE public.san_pham SET mo_ta = $1, ngay_cap_nhat = NOW() WHERE ma_san_pham = $2', [description, newProduct.ma_san_pham]);
                }
            })
            .catch((err) => console.error(`⚠️ Thất bại khi sinh mô tả ngầm tự động bằng AI: ${err.message}`));

        res.status(201).json({ success: true, data: newProduct, message: 'Sản phẩm đã được tạo lập thành công.' });
    } catch (error) {
        console.error('❌ Lỗi API createProduct:', error.message);
        res.status(500).json({ success: false, error: "Gặp sự cố khi thêm mới sản phẩm." });
    }
};

// =========================================================================
// 9. PERIODIC TASK: GENERATE DESCRIPTIONS (AUTO SCHEDULER)
// =========================================================================
export const schedulePeriodicDescriptionGeneration = () => {
    const checkInterval = 6 * 60 * 60 * 1000;

    setInterval(async () => {
        try {
            const query = `
                SELECT sp.ma_san_pham, sp.ten_san_pham, dmc.ten_danh_muc_con AS ten_danh_muc
                FROM public.san_pham sp
                LEFT JOIN public.danh_muc_con dmc ON sp.ma_dm_con = dmc.ma_dm_con
                WHERE sp.trang_thai = true
                ORDER BY sp.ngay_cap_nhat NULLS FIRST, sp.ngay_cap_nhat ASC LIMIT 50;
            `;
            const result = await pool.query(query);

            if (result.rows.length > 0) {
                const generated = await batchGenerateDescriptions(result.rows, { useOnlineResearch: true });
                const successfulItems = generated.filter((item) => item.success);

                const updatePromises = successfulItems.map((item) => {
                    return pool.query(`UPDATE public.san_pham SET mo_ta = $1, ngay_cap_nhat = NOW() WHERE ma_san_pham = $2;`, [item.description, item.ma_san_pham]);
                });
                await Promise.all(updatePromises);
            }
        } catch (error) {
            console.error('❌ Lỗi tiến trình quét định kỳ Scheduler:', error.message);
        }
    }, checkInterval);
};

// =========================================================================
// 10. 🛠️ ĐÃ BỔ SUNG: LẤY DANH SÁCH QUỐC GIA KÈM CẤU HÌNH TIỀN TỆ ĐỘNG TỪ DATABASE
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
// 11. BỔ SUNG: TÌM KIẾM DANH MỤC (CẢ CHA VÀ CON) - HỖ TRỢ TÌM KHÔNG DẤU
// =========================================================================
export const searchCategories = async (req, res) => {
    const keyword = req.query.keyword || '';
    const countryCode = (req.query.country || 'VN').toUpperCase();

    try {
        const searchTerm = `%${keyword}%`;
        const query = `
            SELECT ma_dm_cha AS ma_danh_muc, ten_danh_muc_cha AS ten_danh_muc, duong_dan_seo AS slug, hinh_anh, 'cha' AS loai_danh_muc
            FROM public.danh_muc_cha
            WHERE trang_thai = true AND ma_quoc_gia = $2 
              AND unaccent(ten_danh_muc_cha) ILIKE unaccent($1)
            
            UNION ALL
            
            SELECT ma_dm_con AS ma_danh_muc, ten_danh_muc_con AS ten_danh_muc, duong_dan_seo AS slug, hinh_anh, 'con' AS loai_danh_muc
            FROM public.danh_muc_con
            WHERE trang_thai = true AND ma_quoc_gia = $2 
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