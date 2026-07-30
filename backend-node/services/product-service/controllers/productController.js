import pool from '../configs/database.js';
import { batchGenerateDescriptions, generateDescriptionFromAI } from '../utils/aiDescriptionGenerator.js'; 
import axios from 'axios';
// =========================================================================
// 🛠️ HELPER FUNCTIONS
// =========================================================================
const generateUniqueId = (prefix) => {
    const timeStr = Date.now().toString().slice(-8);
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${timeStr}${randomNum}`;
};

const sanitizePagination = (pageInput, limitInput) => {
    const page = Math.max(1, parseInt(pageInput) || 1);
    const limit = Math.min(2000, Math.max(1, parseInt(limitInput) || 12));
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
            return res.status(400).json({ success: false, message: 'Danh sách mã biến thể không được trống.' });
        }
        const query = `
            SELECT bt.ma_bien_the, bt.ma_san_pham, bt.ten_bien_the, bt.sku, bt.gia_ban_le, bt.so_luong_ton, bt.trang_thai, sp.ten_san_pham,
                COALESCE((SELECT duong_dan_url FROM public.media_san_pham WHERE ma_bien_the = bt.ma_bien_the AND la_anh_chinh = true AND trang_thai = true LIMIT 1),
                         (SELECT duong_dan_url FROM public.media_san_pham WHERE ma_san_pham = bt.ma_san_pham AND la_anh_chinh = true AND trang_thai = true LIMIT 1)) AS hinh_anh_chinh,
                COALESCE((SELECT jsonb_object_agg(dmtt.ten_thuoc_tinh, gttt.gia_tri)
                        FROM public.chi_tiet_bien_the_thuoc_tinh cbtt
                        JOIN public.gia_tri_thuoc_tinh gttt ON cbtt.ma_gia_tri = gttt.ma_gia_tri
                        JOIN public.danh_muc_thuoc_tinh dmtt ON gttt.ma_thuoc_tinh = dmtt.ma_thuoc_tinh
                        WHERE cbtt.ma_bien_the = bt.ma_bien_the), '{}'::jsonb) AS tuy_chon
            FROM public.bien_the_san_pham bt
            JOIN public.san_pham sp ON bt.ma_san_pham = sp.ma_san_pham
            WHERE bt.ma_bien_the = ANY($1::text[]) AND bt.trang_thai = true;
        `;
        const { rows: variants } = await pool.query(query, [variantIds]);
        res.status(200).json({ success: true, data: variants });
    } catch (error) {
        console.error('❌ Lỗi API getInternalVariants:', error.message);
        res.status(500).json({ success: false, message: 'Sự cố máy chủ khi truy xuất dữ liệu biến thể nội bộ.' });
    }
};

// =========================================================================
// 1. LẤY TẤT CẢ SẢN PHẨM (PHÂN TÁCH LOGIC RÕ RÀNG GIỮA CLIENT VÀ ADMIN) 
// =========================================================================
export const getAllProducts = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const { limit, offset } = sanitizePagination(req.query.page, req.query.limit);
        
        const { sort, market, role, type } = req.query; 

        let values = [];
        let valueIndex = 1;

        // =====================================================================
        // NHÁNH 1: DÀNH CHO CLIENT (HIỂN THỊ CHI TIẾT TỪNG BIẾN THỂ / SKU)
        // =====================================================================
        if (role === 'client') {
            let whereClause = `WHERE bt.trang_thai = true AND sp.trang_thai = true`; 

            if (market && market !== 'all') {
                whereClause += ` AND UPPER(sp.ma_quoc_gia) = $${valueIndex}`;
                values.push(market.toUpperCase());
                valueIndex++;
            }

            if (type === 'single') {
                whereClause += ` AND sp.co_bien_the = false`;
            } else if (type === 'group') {
                whereClause += ` AND sp.co_bien_the = true`;
            }

            const countQuery = `
                SELECT COUNT(*) as total 
                FROM public.bien_the_san_pham bt
                JOIN public.san_pham sp ON bt.ma_san_pham = sp.ma_san_pham
                LEFT JOIN public.danh_muc_con dmc ON sp.ma_dm_con = dmc.ma_dm_con
                ${whereClause};
            `;
            const { rows: countResult } = await pool.query(countQuery, values);
            const totalItems = parseInt(countResult[0]?.total || 0);
            const totalPages = Math.ceil(totalItems / limit);

            let orderByClause = `ORDER BY bt.ngay_tao DESC`;
            if (sort === 'oldest') orderByClause = `ORDER BY bt.ngay_tao ASC`;
            if (sort === 'price_desc') orderByClause = `ORDER BY bt.gia_ban_le DESC NULLS LAST`;
            if (sort === 'price_asc') orderByClause = `ORDER BY bt.gia_ban_le ASC NULLS LAST`;

            const query = `
                SELECT 
                    sp.ma_san_pham, 
                    CASE 
                        WHEN sp.co_bien_the = true THEN sp.ten_san_pham || ' - ' || bt.ten_bien_the
                        ELSE sp.ten_san_pham
                    END AS ten_san_pham, 
                    sp.mo_ta, sp.trang_thai, bt.ngay_tao, sp.ngay_cap_nhat,
                    sp.ma_quoc_gia, sp.co_bien_the, 
                    dmc.ten_danh_muc_con, dmc.duong_dan_seo AS slug_danh_muc,
                    dmc_cha.ten_danh_muc_cha,
                    
                    bt.ma_bien_the,
                    bt.sku AS ma_sku,
                    bt.sku,
                    bt.ten_bien_the,
                    
                    bt.so_luong_ton AS tong_ton_kho,
                    bt.gia_ban_le AS gia_ban_thap_nhat,
                    
                    COALESCE(
                        (SELECT duong_dan_url FROM public.media_san_pham WHERE ma_bien_the = bt.ma_bien_the AND la_anh_chinh = true LIMIT 1),
                        (SELECT duong_dan_url FROM public.media_san_pham WHERE ma_san_pham = sp.ma_san_pham AND la_anh_chinh = true LIMIT 1)
                    ) AS hinh_anh_chinh
                    
                FROM public.bien_the_san_pham bt
                JOIN public.san_pham sp ON bt.ma_san_pham = sp.ma_san_pham
                LEFT JOIN public.danh_muc_con dmc ON sp.ma_dm_con = dmc.ma_dm_con
                LEFT JOIN public.danh_muc_cha dmc_cha ON dmc.ma_dm_cha = dmc_cha.ma_dm_cha
                ${whereClause}
                ${orderByClause}
                LIMIT $${valueIndex} OFFSET $${valueIndex + 1};
            `;

            values.push(limit, offset);
            const { rows: products } = await pool.query(query, values);

            return res.status(200).json({ products, totalPages, currentPage: page, totalItems });
        } 
        
        // =====================================================================
        // NHÁNH 2: DÀNH CHO ADMIN (SẢN PHẨM MẸ KÈM MẢNG BIẾN THỂ)
        // =====================================================================
        else {
            let whereClause = `WHERE 1=1`; 

            if (market && market !== 'all') {
                whereClause += ` AND UPPER(sp.ma_quoc_gia) = $${valueIndex}`;
                values.push(market.toUpperCase());
                valueIndex++;
            }

            if (type === 'single') {
                whereClause += ` AND sp.co_bien_the = false`;
            } else if (type === 'group') {
                whereClause += ` AND sp.co_bien_the = true`;
            }

            const countQuery = `
                SELECT COUNT(*) as total 
                FROM public.san_pham sp
                LEFT JOIN public.danh_muc_con dmc ON sp.ma_dm_con = dmc.ma_dm_con
                ${whereClause};
            `;
            const { rows: countResult } = await pool.query(countQuery, values);
            const totalItems = parseInt(countResult[0]?.total || 0);
            const totalPages = Math.ceil(totalItems / limit);

            let orderByClause = `ORDER BY sp.ngay_tao DESC`;
            if (sort === 'oldest') orderByClause = `ORDER BY sp.ngay_tao ASC`;
            if (sort === 'price_desc') orderByClause = `ORDER BY gia_ban_thap_nhat DESC NULLS LAST`;
            if (sort === 'price_asc') orderByClause = `ORDER BY gia_ban_thap_nhat ASC NULLS LAST`;

            const query = `
                SELECT 
                    sp.ma_san_pham, sp.ten_san_pham, sp.mo_ta, sp.trang_thai, sp.ngay_tao, sp.ngay_cap_nhat,
                    sp.ma_quoc_gia, sp.co_bien_the, 
                    dmc.ten_danh_muc_con, dmc.duong_dan_seo AS slug_danh_muc,
                    dmc_cha.ten_danh_muc_cha, 
                    
                    COALESCE((SELECT SUM(so_luong_ton) FROM public.bien_the_san_pham WHERE ma_san_pham = sp.ma_san_pham), 0) AS tong_ton_kho,
                    
                    COALESCE((SELECT MIN(gia_ban_le) FROM public.bien_the_san_pham WHERE ma_san_pham = sp.ma_san_pham AND trang_thai = true), 0) AS gia_ban_thap_nhat,
                    
                    (SELECT duong_dan_url FROM public.media_san_pham WHERE ma_san_pham = sp.ma_san_pham AND la_anh_chinh = true LIMIT 1) AS hinh_anh_chinh,

                    (SELECT ma_bien_the FROM public.bien_the_san_pham WHERE ma_san_pham = sp.ma_san_pham LIMIT 1) AS ma_bien_the_mac_dinh,

                    COALESCE(
                    (SELECT json_agg(
                    json_build_object(
                    'sku', bt.sku, 
                    'ma_bien_the', bt.ma_bien_the,
                    'ten_bien_the', bt.ten_bien_the,
                    'gia_ban_le', bt.gia_ban_le,
                    'so_luong_ton', bt.so_luong_ton
                )
            ) 
            FROM public.bien_the_san_pham bt 
            WHERE bt.ma_san_pham = sp.ma_san_pham), 
            '[]'::json) AS variants
                    
                FROM public.san_pham sp
                LEFT JOIN public.danh_muc_con dmc ON sp.ma_dm_con = dmc.ma_dm_con
                LEFT JOIN public.danh_muc_cha dmc_cha ON dmc.ma_dm_cha = dmc_cha.ma_dm_cha
                ${whereClause}
                ${orderByClause}
                LIMIT $${valueIndex} OFFSET $${valueIndex + 1};
            `;

            values.push(limit, offset);
            const { rows: products } = await pool.query(query, values);

            return res.status(200).json({ products, totalPages, currentPage: page, totalItems });
        }
    } catch (error) {
        console.error("❌ Lỗi API getAllProducts:", error.message);
        res.status(500).json({ error: "Không thể lấy danh sách sản phẩm." });
    }
};

// =========================================================================
// 2. LẤY CHI TIẾT 1 SẢN PHẨM (ĐÃ CẬP NHẬT V1 CHO PROMOTION SERVICE)
// =========================================================================
export const getProductById = async (req, res) => {
    const { id } = req.params; 
    const { role } = req.query;

    try {
        const productQuery = `
            SELECT sp.ma_san_pham, sp.ma_dm_con, sp.ten_san_pham, sp.mo_ta, sp.trang_thai, sp.ngay_tao, sp.ngay_cap_nhat, sp.co_bien_the,
                dmc.ten_danh_muc_con, dmc.duong_dan_seo AS slug_danh_muc, LOWER(sp.ma_quoc_gia) AS country_code,
                COALESCE((SELECT SUM(so_luong_ton) FROM public.bien_the_san_pham WHERE ma_san_pham = sp.ma_san_pham), 0) AS tong_ton_kho,
                COALESCE((SELECT MIN(gia_ban_le) FROM public.bien_the_san_pham WHERE ma_san_pham = sp.ma_san_pham AND trang_thai = true), 0) AS gia_ban_thap_nhat
            FROM public.san_pham sp
            LEFT JOIN public.danh_muc_con dmc ON sp.ma_dm_con = dmc.ma_dm_con
            WHERE sp.ma_san_pham = $1;
        `;
        const productResult = await pool.query(productQuery, [id]);

        if (productResult.rows.length === 0) return res.status(404).json({ message: "Sản phẩm không tồn tại!" });

        const product = productResult.rows[0];
        if (role === 'client' && product.trang_thai === false) return res.status(404).json({ message: "Sản phẩm đã ngừng kinh doanh." });

        const variantsQuery = `
            SELECT bt.ma_bien_the, bt.ten_bien_the, bt.sku, bt.gia_ban_le, bt.trang_thai, bt.so_luong_ton, dm.ten_thuoc_tinh, gt.gia_tri, dv.ten_don_vi 
            FROM public.bien_the_san_pham bt
            LEFT JOIN public.chi_tiet_bien_the_thuoc_tinh ct ON bt.ma_bien_the = ct.ma_bien_the
            LEFT JOIN public.gia_tri_thuoc_tinh gt ON ct.ma_gia_tri = gt.ma_gia_tri
            LEFT JOIN public.danh_muc_thuoc_tinh dm ON gt.ma_thuoc_tinh = dm.ma_thuoc_tinh
            LEFT JOIN public.don_vi_san_pham dv ON bt.don_vi_id = dv.id
            WHERE bt.ma_san_pham = $1;
        `;
        const variantsResult = await pool.query(variantsQuery, [id]);

        const variantsMap = {};
        const attributesRaw = {};

        variantsResult.rows.forEach(row => {
            if (role === 'client' && row.trang_thai === false) return;
            if (!variantsMap[row.ma_bien_the]) {
                variantsMap[row.ma_bien_the] = {
                    ma_bien_the: row.ma_bien_the, ten_bien_the: row.ten_bien_the, sku: row.sku, gia_ban_le: Number(row.gia_ban_le),
                    gia_khuyen_mai: null, is_flash_sale: false, so_luong_ton: row.so_luong_ton || 0, trang_thai: row.trang_thai, 
                    thuoc_tinh: {}, ten_don_vi: row.ten_don_vi || "Gói"
                };
            }
            if (row.ten_thuoc_tinh && row.gia_tri) {
                variantsMap[row.ma_bien_the].thuoc_tinh[row.ten_thuoc_tinh] = row.gia_tri;
                if (!attributesRaw[row.ten_thuoc_tinh]) attributesRaw[row.ten_thuoc_tinh] = new Set();
                attributesRaw[row.ten_thuoc_tinh].add(row.gia_tri);
            }
        });

        let bien_the = Object.values(variantsMap);

        if (role === 'client' && bien_the.length > 0) {
            const PROMOTION_SERVICE_URL = process.env.PROMOTION_SERVICE_URL || 'http://localhost:5007';
            
            const promotionPromises = bien_the.map(async (bt) => {
                try {
                    // 🌟 CẬP NHẬT V1: Đường dẫn gọi chéo lên chuẩn v1
                    const promoRes = await axios.post(`${PROMOTION_SERVICE_URL}/api/v1/promotions/internal/check-variant-promotion`, {
                        ma_bien_the: bt.ma_bien_the
                    });
                    
                    const promoData = promoRes.data;
                    if (promoData.success && promoData.is_flash_sale) {
                        const saleData = promoData.data;
                        bt.gia_goc = bt.gia_ban_le; 
                        bt.gia_ban_le = Number(saleData.gia_khuyen_mai);
                        bt.gia_khuyen_mai = Number(saleData.gia_khuyen_mai);
                        bt.is_flash_sale = true;
                        bt.so_luong_ton = Number(saleData.ton_kho_sale);
                        bt.thong_tin_sale = {
                            gia_khuyen_mai: Number(saleData.gia_khuyen_mai),
                            so_luong_gioi_han: Number(saleData.so_luong_gioi_han),
                            da_ban: Number(saleData.da_ban),
                            ton_kho_sale: Number(saleData.ton_kho_sale)
                        };
                    }
                } catch (err) {
                    console.error(`⚠️ Lỗi check giá Sale biến thể ${bt.ma_bien_the}:`, err.message);
                }
                return bt;
            });

            bien_the = await Promise.all(promotionPromises);
            let lowestPrice = product.gia_ban_thap_nhat;
            bien_the.forEach(bt => {
                if (bt.gia_ban_le < lowestPrice || lowestPrice === 0) lowestPrice = bt.gia_ban_le;
            });
            product.gia_ban_thap_nhat = lowestPrice;
        }

        const attributes = Object.keys(attributesRaw).map((ten, index) => ({
            id_nhom: index + 1, ten_thuoc_tinh: ten, gia_tri_khadung: Array.from(attributesRaw[ten]), selected: Array.from(attributesRaw[ten])[0]
        }));

        const mediaResult = await pool.query(`SELECT duong_dan_url, loai_media, thoi_luong_video, trang_thai FROM public.media_san_pham WHERE ma_san_pham = $1`, [id]);
        
        res.status(200).json({ ...product, attributes, bien_the, media: role === 'client' ? mediaResult.rows.filter(m => m.trang_thai) : mediaResult.rows });
    } catch (error) {
        res.status(500).json({ error: "Lỗi hệ thống.", detail: error.message });
    }
};

// =========================================================================
// 3. LẤY SẢN PHẨM THEO DANH MỤC (Đã cập nhật để tương thích SKU Ẩn)
// =========================================================================
export const getProductsByCategorySlug = async (req, res) => {
    const { slug } = req.params;
    const countryCode = (req.query.country || 'VN').toUpperCase();
    
    const sort = req.query.sort || 'noi-bat';
    const price = req.query.price || 'tat-ca';
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(2000, Math.max(1, parseInt(req.query.limit) || 20)); 
    const offset = (page - 1) * limit;

    try {
        let baseQuery = `
            SELECT 
                sp.ma_san_pham, sp.ten_san_pham, sp.mo_ta, sp.trang_thai, sp.ngay_tao,
                dmc.ten_danh_muc_con, dmc.duong_dan_seo AS slug_danh_muc, LOWER(sp.ma_quoc_gia) AS country_code,
                
                COALESCE((SELECT SUM(so_luong_ton) FROM public.bien_the_san_pham WHERE ma_san_pham = sp.ma_san_pham), 0) AS tong_ton_kho,
                
                COALESCE((SELECT MIN(gia_ban_le) FROM public.bien_the_san_pham WHERE ma_san_pham = sp.ma_san_pham AND trang_thai = true), 0) AS gia_ban_thap_nhat,
                
                (SELECT ma_bien_the FROM public.bien_the_san_pham WHERE ma_san_pham = sp.ma_san_pham LIMIT 1) AS ma_bien_the_mac_dinh,

                (SELECT duong_dan_url FROM public.media_san_pham WHERE ma_san_pham = sp.ma_san_pham AND la_anh_chinh = true AND trang_thai = true LIMIT 1) AS hinh_anh_chinh
            FROM public.san_pham sp
            INNER JOIN public.danh_muc_con dmc ON sp.ma_dm_con = dmc.ma_dm_con
            WHERE sp.trang_thai = true 
              AND dmc.trang_thai = true
              AND UPPER(sp.ma_quoc_gia) = $1
        `;
        
        const countParams = [countryCode];
        let paramIndex = 2; 

        if (slug !== 'tat-ca') {
            baseQuery += ` AND (dmc.duong_dan_seo = $${paramIndex} OR dmc.ma_dm_cha = (SELECT ma_dm_cha FROM public.danh_muc_cha WHERE duong_dan_seo = $${paramIndex} AND trang_thai = true LIMIT 1))`;
            countParams.push(slug);
            paramIndex++;
        }

        let finalQuery = `WITH ProductList AS (${baseQuery}) SELECT * FROM ProductList WHERE 1=1`;

        if (price !== 'tat-ca') {
            if (price === '0-50000') finalQuery += ` AND gia_ban_thap_nhat < 50000`;
            else if (price === '50000-100000') finalQuery += ` AND gia_ban_thap_nhat >= 50000 AND gia_ban_thap_nhat <= 100000`;
            else if (price === '100000-200000') finalQuery += ` AND gia_ban_thap_nhat >= 100000 AND gia_ban_thap_nhat <= 200000`;
            else if (price === '200000-500000') finalQuery += ` AND gia_ban_thap_nhat >= 200000 AND gia_ban_thap_nhat <= 500000`;
            else if (price === '500000-800000') finalQuery += ` AND gia_ban_thap_nhat >= 500000 AND gia_ban_thap_nhat <= 800000`;
            else if (price === '800000-1000000') finalQuery += ` AND gia_ban_thap_nhat >= 800000 AND gia_ban_thap_nhat <= 1000000`;
            else if (price === '1000000-up') finalQuery += ` AND gia_ban_thap_nhat > 1000000`;
        }

        const countQuery = `SELECT COUNT(*) as total FROM (${finalQuery}) as count_table`;
        const { rows: countResult } = await pool.query(countQuery, countParams);
        const totalItems = parseInt(countResult[0].total);
        const totalPages = Math.ceil(totalItems / limit);

        if (sort === 'gia-thap') finalQuery += ` ORDER BY gia_ban_thap_nhat ASC, ngay_tao DESC`;
        else if (sort === 'gia-cao') finalQuery += ` ORDER BY gia_ban_thap_nhat DESC, ngay_tao DESC`;
        else finalQuery += ` ORDER BY ngay_tao DESC`;

        finalQuery += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1};`;
        
        const finalParams = [...countParams, limit, offset];
        const { rows: products } = await pool.query(finalQuery, finalParams);
        
        res.status(200).json({ products, totalPages, currentPage: page, totalItems });
    } catch (error) {
        console.error("❌ Lỗi API getProductsByCategorySlug:", error.message);
        res.status(500).json({ error: "Lỗi khi lấy danh sách sản phẩm theo danh mục." });
    }
};

// =========================================================================
// 4. TÌM KIẾM SẢN PHẨM THEO TỪ KHÓA
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
                (SELECT duong_dan_url FROM public.media_san_pham WHERE ma_san_pham = sp.ma_san_pham AND la_anh_chinh = true AND trang_thai = true LIMIT 1) AS hinh_anh_chinh,
                
                -- 🌟 THÊM 2 DÒNG NÀY ĐỂ TRUYỀN SỐ LƯỢNG TỒN KHO XUỐNG FRONTEND
                COALESCE((SELECT SUM(so_luong_ton)::int FROM public.bien_the_san_pham WHERE ma_san_pham = sp.ma_san_pham), 0) AS tong_ton_kho,
                COALESCE((SELECT SUM(so_luong_ton)::int FROM public.bien_the_san_pham WHERE ma_san_pham = sp.ma_san_pham), 0) AS stock

            FROM public.san_pham sp
            INNER JOIN public.danh_muc_con dmc ON sp.ma_dm_con = dmc.ma_dm_con
            WHERE sp.trang_thai = true 
              AND dmc.trang_thai = true
              AND UPPER(sp.ma_quoc_gia) = $2
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
// 8. TẠO SẢN PHẨM MỚI (Mã thông minh + Tự động tiếp nối + AI đúng chuẩn)
// =========================================================================
export const createProduct = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // 🌟 FIX: Bỏ gia_ban khỏi việc lưu vào bảng san_pham, nhưng vẫn nhận nó để lưu cho SKU ẩn
        // Bổ sung thêm nhận sku và so_luong_ton từ FE
        const { 
            ten_san_pham, ma_dm_con, mo_ta, ma_quoc_gia = 'VN', 
            co_bien_the = false, hinh_anh_chinh,
            sku = '', gia_ban = 0, so_luong_ton = 0 // Dành cho SKU ẩn
        } = req.body;
        
        const countryCode = ma_quoc_gia.toUpperCase();

        if (!ten_san_pham || !ma_dm_con) {
            return res.status(400).json({ success: false, message: 'Thiếu trường dữ liệu bắt buộc.' });
        }

        // 1. Lấy mã định danh (ma_dinh_danh_sp) từ DB
        const countryRes = await client.query(
            'SELECT ma_dinh_danh_sp FROM public.danh_muc_quoc_gia WHERE ma_quoc_gia = $1', 
            [countryCode]
        );
        const maDinhDanh = countryRes.rows[0]?.ma_dinh_danh_sp || '000';
        
        // 2. Định dạng ngày ddmmyy (Ví dụ: 290626)
        const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '');

        // 3. Tìm mã sản phẩm lớn nhất của ngày hôm nay để tạo Sequence tiếp nối
        const prefix = `MSP${maDinhDanh}${dateStr}`;
        const maxIdRes = await client.query(
            `SELECT ma_san_pham FROM public.san_pham WHERE ma_san_pham LIKE $1 ORDER BY ma_san_pham DESC LIMIT 1`,
            [`${prefix}%`]
        );

        let nextSequence = 1;
        if (maxIdRes.rows.length > 0) {
            const lastId = maxIdRes.rows[0].ma_san_pham;
            const lastSeqStr = lastId.slice(-3); 
            nextSequence = parseInt(lastSeqStr) + 1;
        }
        
        // Tạo mã hoàn chỉnh: VD: MSP893290626001
        const ma_san_pham = `${prefix}${String(nextSequence).padStart(3, '0')}`;

        // 4. Lưu sản phẩm gốc (🌟 Đã bỏ cột gia_ban khỏi bảng san_pham)
        const insertQuery = `
            INSERT INTO public.san_pham (ma_san_pham, ten_san_pham, ma_dm_con, mo_ta, ma_quoc_gia, co_bien_the, trang_thai, ngay_tao)
            VALUES ($1, $2, $3, $4, $5, $6, true, NOW()) RETURNING *;
        `;
        const productRes = await client.query(insertQuery, [ma_san_pham, ten_san_pham.trim(), ma_dm_con, mo_ta || null, countryCode, co_bien_the]);
        
        // ==============================================================
        // 🌟 BƯỚC MỚI: TỰ ĐỘNG TẠO "SKU ẨN" NẾU LÀ SẢN PHẨM ĐƠN
        // ==============================================================
        if (co_bien_the === false) {
            const shortProdId = ma_san_pham.length > 9 ? ma_san_pham.slice(-9) : ma_san_pham;
            const ma_bien_the_moi = `MBT_${countryCode}_${shortProdId}_1`; // 1 vì là biến thể đầu tiên và duy nhất

            // Tính toán mã SKU tự động nếu FE không gửi lên
            let finalSku = sku ? sku.trim().toUpperCase() : `${countryCode}-${shortProdId}-001`;
            let skuCounter = 1;
            while (true) {
                const skuCheck = await client.query('SELECT ma_bien_the FROM public.bien_the_san_pham WHERE sku = $1', [finalSku]);
                if (skuCheck.rows.length === 0) break;
                finalSku = `${sku ? sku.trim().toUpperCase() : `${countryCode}-${shortProdId}`}-${String(skuCounter).padStart(3, '0')}`;
                skuCounter++;
            }

            const insertVariantQuery = `
                INSERT INTO public.bien_the_san_pham 
                (ma_bien_the, ma_san_pham, ten_bien_the, sku, gia_ban_le, so_luong_ton, trang_thai, ngay_tao, ngay_cap_nhat)
                VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW());
            `;
            await client.query(insertVariantQuery, [
                ma_bien_the_moi, 
                ma_san_pham, 
                "Mặc định", // Tên hiển thị chuẩn cho sản phẩm đơn
                finalSku, 
                gia_ban || 0, 
                so_luong_ton || 0
            ]);
        }

        if (hinh_anh_chinh) {
            const ma_media = generateUniqueId('MED'); 
            await client.query(`
                INSERT INTO public.media_san_pham (ma_media, ma_san_pham, duong_dan_url, la_anh_chinh, loai_media)
                VALUES ($1, $2, $3, true, 'image')
            `, [ma_media, ma_san_pham, hinh_anh_chinh]);
        }

        await client.query('COMMIT');

        // 5. Chạy ngầm AI tạo mô tả
        if (!mo_ta || mo_ta.trim() === '') {
            const categoryRes = await pool.query(
                'SELECT ten_danh_muc_con FROM public.danh_muc_con WHERE ma_dm_con = $1', 
                [ma_dm_con]
            );
            const categoryName = categoryRes.rows[0]?.ten_danh_muc_con || 'Sản phẩm tiêu dùng';

            generateDescriptionFromAI(ten_san_pham, categoryName, true)
                .then(async (desc) => {
                    if (desc) {
                        await pool.query('UPDATE public.san_pham SET mo_ta = $1 WHERE ma_san_pham = $2', [desc, ma_san_pham]);
                    }
                }).catch((err) => console.error("Lỗi AI ngầm:", err));
        }

        res.status(201).json({ success: true, data: productRes.rows[0], message: 'Khởi tạo sản phẩm thành công!' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Lỗi:', error.message);
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi tạo sản phẩm." });
    } finally {
        client.release();
    }
};

// =========================================================================
// 8.1 CẬP NHẬT THÔNG TIN CƠ BẢN SẢN PHẨM (Đã xóa cột gia_ban)
// =========================================================================
export const updateProduct = async (req, res) => {
    const client = await pool.connect(); 
    try {
        await client.query('BEGIN'); 

        const { id } = req.params; 
        const { ten_san_pham, ma_dm_con, mo_ta, ma_quoc_gia, co_bien_the } = req.body; 

        if (!ten_san_pham || !ma_dm_con || !ma_quoc_gia) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, message: "Tên sản phẩm, Danh mục và Quốc gia là bắt buộc." });
        }

        const newCoBienThe = co_bien_the !== undefined ? co_bien_the : false;

        const oldProductRes = await client.query('SELECT co_bien_the FROM public.san_pham WHERE ma_san_pham = $1', [id]);
        if (oldProductRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm để cập nhật." });
        }
        const oldCoBienThe = oldProductRes.rows[0].co_bien_the;

        // 🌟 FIX: Đã xóa gia_ban = $6 khỏi câu lệnh UPDATE
        const updateQuery = `
            UPDATE public.san_pham 
            SET ten_san_pham = $1, 
                ma_dm_con = $2, 
                mo_ta = $3, 
                ma_quoc_gia = $4,
                co_bien_the = $5,
                ngay_cap_nhat = NOW() 
            WHERE ma_san_pham = $6 
            RETURNING *;
        `;
        
        const { rows } = await client.query(updateQuery, [
            ten_san_pham.trim(), 
            ma_dm_con, 
            mo_ta || null, 
            ma_quoc_gia.toUpperCase(), 
            newCoBienThe,
            id
        ]);

        if (oldCoBienThe === true && newCoBienThe === false) {
            await client.query(`
                UPDATE public.bien_the_san_pham 
                SET trang_thai = false, ngay_cap_nhat = NOW() 
                WHERE ma_san_pham = $1
            `, [id]);

            await client.query(`
                UPDATE public.media_san_pham 
                SET ma_bien_the = NULL 
                WHERE ma_san_pham = $1
            `, [id]);
            
            console.log(`🧹 Đã dọn dẹp data biến thể cho sản phẩm [${id}] vì chuyển về SP Đơn.`);
        }

        await client.query('COMMIT');
        res.status(200).json({ success: true, data: rows[0], message: "Cập nhật sản phẩm thành công!" });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("❌ Lỗi API updateProduct:", error.message);
        res.status(500).json({ success: false, message: "Lỗi máy chủ khi cập nhật sản phẩm." });
    } finally {
        client.release(); 
    }
};

// =========================================================================
// 8.5 BẬT / TẮT TRẠNG THÁI SẢN PHẨM (TOGGLE STATUS & REAL-TIME SOCKET)
// =========================================================================
export const toggleProductStatus = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Cập nhật trạng thái lật ngược (true thành false, false thành true)
        const result = await pool.query(`
            UPDATE public.san_pham 
            SET trang_thai = NOT trang_thai, ngay_cap_nhat = NOW() 
            WHERE ma_san_pham = $1 
            RETURNING ma_san_pham, trang_thai;
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm." });
        }

        // Tùy chọn: Đồng bộ tắt luôn các biến thể bên trong nếu sản phẩm cha bị tắt
        const newStatus = result.rows[0].trang_thai;
        await pool.query(`UPDATE public.bien_the_san_pham SET trang_thai = $1 WHERE ma_san_pham = $2`, [newStatus, id]);

        // 🌟 NÂNG CẤP REAL-TIME: Phát tín hiệu Socket cho Client
        const io = req.app.get('io');
        if (io) {
            io.emit('product_status_changed', {
                ma_san_pham: id,
                trang_thai: newStatus
            });
            console.log(`📡 Socket Emit: Đã báo cho Client trạng thái SP [${id}] -> ${newStatus}`);
        }

        res.status(200).json({ 
            success: true, 
            message: newStatus ? "Đã MỞ BÁN sản phẩm!" : "Đã TẠM NGƯNG sản phẩm!",
            newStatus 
        });
    } catch (error) {
        console.error('❌ Lỗi API toggleProductStatus:', error.message);
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi đổi trạng thái." });
    }
};

// =========================================================================
// 8.6 DELETE PRODUCT (HARD DELETE - TỰ ĐỘNG DỌN DẸP SKU ẨN & CASCADE)
// =========================================================================
export const deleteProduct = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        await client.query('BEGIN');

        // 1. DỌN DẸP DỮ LIỆU PHỤ THUỘC (CASCADE DELETE)
        // 1.1 Xóa chi tiết thuộc tính EAV của tất cả biến thể thuộc sản phẩm này
        await client.query(`
            DELETE FROM public.chi_tiet_bien_the_thuoc_tinh 
            WHERE ma_bien_the IN (SELECT ma_bien_the FROM public.bien_the_san_pham WHERE ma_san_pham = $1)
        `, [id]);

        // 1.2 Xóa toàn bộ ảnh/media của sản phẩm và biến thể
        await client.query('DELETE FROM public.media_san_pham WHERE ma_san_pham = $1', [id]);

        // 1.3 Xóa danh sách yêu thích liên quan đến sản phẩm
        await client.query('DELETE FROM public.san_pham_yeu_thich WHERE ma_san_pham = $1', [id]);

        // 1.4 Xóa toàn bộ các biến thể (Bao gồm cả SKU ẩn của Sản phẩm Đơn)
        await client.query('DELETE FROM public.bien_the_san_pham WHERE ma_san_pham = $1', [id]);

        // 2. XÓA SẢN PHẨM GỐC
        const result = await client.query('DELETE FROM public.san_pham WHERE ma_san_pham = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm!" });
        }

        await client.query('COMMIT');

        // 3. 🌟 NÂNG CẤP REAL-TIME: Báo cho Client văng trang vì SP đã bị xóa vĩnh viễn
        const io = req.app.get('io');
        if (io) {
            io.emit('product_status_changed', {
                ma_san_pham: id,
                trang_thai: false // Truyền false để Client tự động văng về trang chủ
            });
            console.log(`📡 Socket Emit: Đã báo Client SP [${id}] bị xóa vĩnh viễn`);
        }

        res.status(200).json({ success: true, message: "Đã xóa vĩnh viễn sản phẩm và dọn sạch các SKU ẩn!" });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Lỗi API deleteProduct:', error.message);
        // Lỗi 500 xảy ra khi Database từ chối xóa do dính Foreign Key (ví dụ: SP đã từng có người mua, dính vào bảng Order_Items)
        res.status(500).json({ success: false, message: "Xóa thất bại! Sản phẩm này đã phát sinh lịch sử đơn hàng trong hệ thống." });
    } finally {
        client.release();
    }
};

// =========================================================================
// 9. PERIODIC TASK: GENERATE DESCRIPTIONS (AUTO SCHEDULER)
// =========================================================================
export const schedulePeriodicDescriptionGeneration = () => {
    const checkInterval = 6 * 60 * 60 * 1000;

    const runScheduler = async () => {
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
        } finally {
            setTimeout(runScheduler, checkInterval);
        }
    };

    setTimeout(runScheduler, checkInterval);
};


// =========================================================================
// 12. LẤY SẢN PHẨM LIÊN QUAN (CÙNG DANH MỤC CON)
// =========================================================================
export const getRelatedProducts = async (req, res) => {
    const { id } = req.params;
    const { category, limit = 5 } = req.query;

    if (!category) return res.status(400).json({ error: "Thiếu thông tin danh mục con." });

    try {
        const query = `
            SELECT 
                sp.ma_san_pham, sp.ten_san_pham,
                COALESCE((SELECT MIN(gia_ban_le) FROM public.bien_the_san_pham WHERE ma_san_pham = sp.ma_san_pham AND trang_thai = true), 0) AS gia_ban_thap_nhat,
                (SELECT duong_dan_url FROM public.media_san_pham WHERE ma_san_pham = sp.ma_san_pham AND la_anh_chinh = true LIMIT 1) AS hinh_anh_chinh
            FROM public.san_pham sp
            WHERE sp.ma_dm_con = $1 AND sp.ma_san_pham != $2 AND sp.trang_thai = true
            ORDER BY RANDOM()
            LIMIT $3;
        `;
        const { rows: products } = await pool.query(query, [category, id, limit]);
        res.status(200).json(products);
    } catch (error) {
        console.error("❌ Lỗi API getRelatedProducts:", error.message);
        res.status(500).json({ error: "Lỗi lấy sản phẩm liên quan." });
    }
};

// =========================================================================
// 13. LẤY THÔNG TIN CHI TIẾT MỘT BIẾN THỂ (CHO TRANG QUẢN TRỊ ADMIN - DYNAMIC REAL DATA)
// =========================================================================
export const getVariantById = async (req, res) => {
    try {
        const { variantId } = req.params;

        if (!variantId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Mã ID biến thể không được trống.' 
            });
        }

        const query = `
            SELECT 
                bt.ma_bien_the, 
                bt.ma_san_pham, 
                bt.ten_bien_the, 
                bt.sku, 
                bt.gia_ban_le, 
                bt.so_luong_ton,
                bt.trang_thai,
                bt.ngay_tao,
                bt.ngay_cap_nhat,
                sp.ten_san_pham
            FROM public.bien_the_san_pham bt
            LEFT JOIN public.san_pham sp ON bt.ma_san_pham = sp.ma_san_pham
            WHERE bt.ma_bien_the = $1;
        `;

        const { rows } = await pool.query(query, [variantId]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy biến thể sản phẩm yêu cầu.' });
        }

        const variantData = rows[0];
        variantData.thuoc_tinh_hop_nhat = [];
        variantData.duong_dan_url = "";
        
        // 🌟 Chuyển null thành 0 để bảo vệ dữ liệu nếu cột chưa có số
        variantData.so_luong_ton = variantData.so_luong_ton || 0; 

        // Tải thông tin hình ảnh thực tế từ bảng media_san_pham
        try {
            const mediaRes = await pool.query(
                `SELECT duong_dan_url FROM public.media_san_pham WHERE ma_bien_the = $1 AND trang_thai = true LIMIT 1`,
                [variantId]
            );
            if (mediaRes.rows.length > 0) {
                variantData.duong_dan_url = mediaRes.rows[0].duong_dan_url;
            }
            variantData.hinh_anh_url = variantData.duong_dan_url;
        } catch (mediaError) {
            console.warn("⚠️ Cảnh báo: Lỗi truy xuất media_san_pham thực tế.");
        }

        // Tải ma trận liên kết thực tế qua kiến trúc bảng EAV
        try {
            const attrQuery = `
                SELECT dmtt.ten_thuoc_tinh, gttt.gia_tri
                FROM public.chi_tiet_bien_the_thuoc_tinh cbtt
                JOIN public.gia_tri_thuoc_tinh gttt ON cbtt.ma_gia_tri = gttt.ma_gia_tri
                JOIN public.danh_muc_thuoc_tinh dmtt ON gttt.ma_thuoc_tinh = dmtt.ma_thuoc_tinh
                WHERE cbtt.ma_bien_the = $1;
            `;
            const attrResult = await pool.query(attrQuery, [variantId]);
            variantData.thuoc_tinh_hop_nhat = attrResult.rows || [];
        } catch (attrError) {
            console.warn("⚠️ Cảnh báo: Lỗi cấu trúc bảng EAV liên kết thuộc tính.");
        }

        // Vẫn giữ lại đơn vị mặc định nếu bạn cần thiết lập này
        variantData.ten_don_vi = "Gói"; 

        return res.status(200).json(variantData);

    } catch (error) {
        console.error('❌ Lỗi cốt lõi tại API getVariantById:', error.message);
        return res.status(500).json({ 
            success: false, 
            message: 'Sự cố máy chủ khi truy xuất thông tin chi tiết biến thể.',
            error_detail: error.message 
        });
    }
};

// =========================================================================
// 14. TẠO BIẾN THỂ MỚI 
// =========================================================================
export const createVariant = async (req, res) => {
    const client = await pool.connect(); 
    try {
        const { id } = req.params; 
        // 🌟 FIX 3: Nhận so_luong_ton từ req.body
        const { ten_bien_the, sku, gia_ban_le, so_luong_ton, thuoc_tinh, hinh_anh_url, ten_don_vi } = req.body;

        if (!sku || gia_ban_le === undefined || gia_ban_le === null) {
        return res.status(400).json({ success: false, message: "Mã SKU và Giá bán lẻ không được để trống." });
        }

        await client.query('BEGIN');

        // 1. Lấy mã quốc gia từ bảng san_pham
        const prodInfo = await client.query('SELECT ma_quoc_gia FROM public.san_pham WHERE ma_san_pham = $1', [id]);
        const countryCode = prodInfo.rows.length > 0 ? (prodInfo.rows[0].ma_quoc_gia || 'VN').toUpperCase() : 'VN';

        const shortProdId = id.length > 9 ? id.slice(-9) : id;

        const existingMbts = await client.query('SELECT ma_bien_the FROM public.bien_the_san_pham WHERE ma_san_pham = $1', [id]);
        let maxIndex = 0;
        
        existingMbts.rows.forEach(row => {
            const parts = row.ma_bien_the.split('_');
            const lastPart = parts[parts.length - 1];
            const num = parseInt(lastPart);
            if (!isNaN(num) && num > maxIndex) {
                maxIndex = num;
            }
        });
        const nextIndex = maxIndex + 1;
        
        const ma_bien_the_moi = `MBT_${countryCode}_${shortProdId}_${nextIndex}`;

        let finalSku = sku ? sku.trim().toUpperCase() : `${countryCode}-${shortProdId}`;
        let skuCounter = 1;
        while (true) {
            const skuCheck = await client.query('SELECT ma_bien_the FROM public.bien_the_san_pham WHERE sku = $1', [finalSku]);
            if (skuCheck.rows.length === 0) break;
            finalSku = `${sku ? sku.trim().toUpperCase() : `${countryCode}-${shortProdId}`}-${skuCounter}`;
            skuCounter++;
        }

        let don_vi_id = null;
        if (ten_don_vi) {
            const unitRes = await client.query('SELECT id FROM public.don_vi_san_pham WHERE ten_don_vi = $1 LIMIT 1', [ten_don_vi.trim()]);
            if (unitRes.rows.length > 0) don_vi_id = unitRes.rows[0].id;
        }

        const insertVariantQuery = `
            INSERT INTO public.bien_the_san_pham (ma_bien_the, ma_san_pham, don_vi_id, ten_bien_the, sku, gia_ban_le, so_luong_ton, trang_thai, ngay_tao, ngay_cap_nhat)
            VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW()) RETURNING *;
        `;
        const variantResult = await client.query(insertVariantQuery, [
            ma_bien_the_moi, id, don_vi_id, ten_bien_the || `Phiên bản mới ${finalSku}`, finalSku, gia_ban_le, so_luong_ton || 0
        ]);

        if (hinh_anh_url && hinh_anh_url.trim() !== '') {
            const ma_media_moi = generateUniqueId('MED');
            await client.query(`
                INSERT INTO public.media_san_pham (ma_media, ma_san_pham, ma_bien_the, duong_dan_url, la_anh_chinh, loai_media, trang_thai, ngay_tao)
                VALUES ($1, $2, $3, $4, false, 'image', true, NOW());
            `, [ma_media_moi, id, ma_bien_the_moi, hinh_anh_url]);
        }

        if (thuoc_tinh && typeof thuoc_tinh === 'object') {
            for (const [ten_thuoc_tinh, gia_tri] of Object.entries(thuoc_tinh)) {
                if (!gia_tri) continue;
                let attrRes = await client.query(`SELECT ma_thuoc_tinh FROM public.danh_muc_thuoc_tinh WHERE LOWER(ten_thuoc_tinh) = LOWER($1)`, [ten_thuoc_tinh.trim()]);
                let ma_thuoc_tinh;
                if (attrRes.rows.length === 0) {
                    ma_thuoc_tinh = generateUniqueId('ATT');
                    await client.query(`INSERT INTO public.danh_muc_thuoc_tinh (ma_thuoc_tinh, ten_thuoc_tinh) VALUES ($1, $2)`, [ma_thuoc_tinh, ten_thuoc_tinh.trim()]);
                } else {
                    ma_thuoc_tinh = attrRes.rows[0].ma_thuoc_tinh;
                }
                let valueRes = await client.query(`SELECT ma_gia_tri FROM public.gia_tri_thuoc_tinh WHERE ma_thuoc_tinh = $1 AND LOWER(gia_tri) = LOWER($2)`, [ma_thuoc_tinh, gia_tri.trim()]);
                let ma_gia_tri;
                if (valueRes.rows.length === 0) {
                    ma_gia_tri = generateUniqueId('VAL');
                    await client.query(`INSERT INTO public.gia_tri_thuoc_tinh (ma_gia_tri, ma_thuoc_tinh, gia_tri) VALUES ($1, $2, $3)`, [ma_gia_tri, ma_thuoc_tinh, gia_tri.trim()]);
                } else {
                    ma_gia_tri = valueRes.rows[0].ma_gia_tri;
                }
                await client.query(`INSERT INTO public.chi_tiet_bien_the_thuoc_tinh (ma_bien_the, ma_gia_tri) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [ma_bien_the_moi, ma_gia_tri]);
            }
        }

        await client.query('COMMIT');
        return res.status(201).json({ success: true, message: "Khởi tạo biến thể thành công!", data: variantResult.rows[0] });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Lỗi createVariant:', error.message);
        return res.status(500).json({ success: false, message: "Không thể lưu biến thể do lỗi cấu trúc." });
    } finally {
        client.release(); 
    }
};

// =========================================================================
// 14.1 TẠO BIẾN THỂ ĐƠN (SIMPLE VARIANT - KHÔNG THUỘC TÍNH)
// =========================================================================
export const createSimpleVariant = async (req, res) => {
    const client = await pool.connect();
    try {
        // 🌟 FIX 5: Nhận so_luong_ton từ req.body
        const { ma_san_pham, ten_bien_the, sku, gia_ban_le, so_luong_ton, ten_don_vi } = req.body;

        if (!ma_san_pham || !sku || gia_ban_le === undefined || gia_ban_le === null) {
            return res.status(400).json({ success: false, message: "Lỗi: Mã sản phẩm, SKU và Giá không được để trống." });
        }

        await client.query('BEGIN');

        const prodInfo = await client.query('SELECT ma_quoc_gia FROM public.san_pham WHERE ma_san_pham = $1', [ma_san_pham]);
        const countryCode = prodInfo.rows.length > 0 ? (prodInfo.rows[0].ma_quoc_gia || 'VN').toUpperCase() : 'VN';

        const shortProdId = ma_san_pham.length > 9 ? ma_san_pham.slice(-9) : ma_san_pham;

        const existingMbts = await client.query('SELECT ma_bien_the FROM public.bien_the_san_pham WHERE ma_san_pham = $1', [ma_san_pham]);
        let maxIndex = 0;
        
        existingMbts.rows.forEach(row => {
            const parts = row.ma_bien_the.split('_');
            const num = parseInt(parts[parts.length - 1]);
            if (!isNaN(num) && num > maxIndex) {
                maxIndex = num;
            }
        });
        const nextIndex = maxIndex + 1;

        const ma_bien_the_moi = `MBT_${countryCode}_${shortProdId}_${nextIndex}`;

        let finalSku = sku ? sku.trim().toUpperCase() : `${countryCode}-${shortProdId}-001`;
        let skuCounter = 1;
        while (true) {
            const skuCheck = await client.query('SELECT ma_bien_the FROM public.bien_the_san_pham WHERE sku = $1', [finalSku]);
            if (skuCheck.rows.length === 0) break;
            finalSku = `${sku ? sku.trim().toUpperCase() : `${countryCode}-${shortProdId}`}-${String(skuCounter).padStart(3, '0')}`;
            skuCounter++;
        }

        let don_vi_id = null;
        if (ten_don_vi) {
            const unitRes = await client.query('SELECT id FROM public.don_vi_san_pham WHERE ten_don_vi = $1 LIMIT 1', [ten_don_vi.trim()]);
            if (unitRes.rows.length > 0) don_vi_id = unitRes.rows[0].id;
        }

        // 🌟 FIX 6: Thêm so_luong_ton vào lệnh INSERT
        const query = `
            INSERT INTO public.bien_the_san_pham 
            (ma_bien_the, ma_san_pham, don_vi_id, ten_bien_the, sku, gia_ban_le, so_luong_ton, trang_thai, ngay_tao, ngay_cap_nhat)
            VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW()) 
            RETURNING *;
        `;
        const result = await client.query(query, [
            ma_bien_the_moi, ma_san_pham, don_vi_id, ten_bien_the || finalSku, finalSku, gia_ban_le, so_luong_ton || 0
        ]);

        await client.query('COMMIT');
        res.status(201).json({ success: true, message: "Đã thêm biến thể đơn thành công!", data: result.rows[0] });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Lỗi createSimpleVariant:', error.message);
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi tạo biến thể đơn." });
    } finally {
        client.release();
    }
};

// =========================================================================
// 14.2 CẬP NHẬT BIẾN THỂ 
// =========================================================================
export const updateVariant = async (req, res) => {
    const client = await pool.connect();
    try {
        const { variantId } = req.params;
        // 🌟 FIX 7: Nhận so_luong_ton từ req.body
        const { ten_bien_the, sku, gia_ban_le, so_luong_ton, thuoc_tinh, hinh_anh_url, ten_don_vi } = req.body;

        if (!sku || !gia_ban_le) return res.status(400).json({ success: false, message: "Mã SKU và Giá bán không được trống." });

        await client.query('BEGIN');

        let don_vi_id = null;
        if (ten_don_vi) {
            const unitRes = await client.query('SELECT id FROM public.don_vi_san_pham WHERE ten_don_vi = $1 LIMIT 1', [ten_don_vi.trim()]);
            if (unitRes.rows.length > 0) {
                don_vi_id = unitRes.rows[0].id;
            }
        }

        // 🌟 FIX 8: Thêm so_luong_ton vào lệnh UPDATE
        const updateVariantQuery = `
            UPDATE public.bien_the_san_pham 
            SET ten_bien_the = $1, sku = $2, gia_ban_le = $3, don_vi_id = $4, so_luong_ton = $5, ngay_cap_nhat = NOW() 
            WHERE ma_bien_the = $6 RETURNING *;
        `;
        const variantResult = await client.query(updateVariantQuery, [ten_bien_the, sku, gia_ban_le, don_vi_id, so_luong_ton || 0, variantId]);

        if (variantResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Không tìm thấy biến thể.' });
        }

        const ma_san_pham = variantResult.rows[0].ma_san_pham;

        if (hinh_anh_url && hinh_anh_url.trim() !== '') {
            const mediaCheck = await client.query(`SELECT ma_media FROM public.media_san_pham WHERE ma_bien_the = $1 AND trang_thai = true LIMIT 1`, [variantId]);
            if (mediaCheck.rows.length > 0) {
                await client.query(`UPDATE public.media_san_pham SET duong_dan_url = $1, ngay_cap_nhat = NOW() WHERE ma_media = $2`, [hinh_anh_url, mediaCheck.rows[0].ma_media]);
            } else {
                const ma_media_moi = generateUniqueId('MED');
                await client.query(`
                    INSERT INTO public.media_san_pham (ma_media, ma_san_pham, ma_bien_the, duong_dan_url, la_anh_chinh, loai_media, trang_thai, ngay_tao)
                    VALUES ($1, $2, $3, $4, false, 'image', true, NOW());
                `, [ma_media_moi, ma_san_pham, variantId, hinh_anh_url]);
            }
        }

        if (thuoc_tinh && typeof thuoc_tinh === 'object') {
            await client.query(`DELETE FROM public.chi_tiet_bien_the_thuoc_tinh WHERE ma_bien_the = $1`, [variantId]);

            for (const [ten_thuoc_tinh, gia_tri] of Object.entries(thuoc_tinh)) {
                if (!gia_tri) continue;

                let attrRes = await client.query(`SELECT ma_thuoc_tinh FROM public.danh_muc_thuoc_tinh WHERE LOWER(ten_thuoc_tinh) = LOWER($1)`, [ten_thuoc_tinh.trim()]);
                let ma_thuoc_tinh;

                if (attrRes.rows.length === 0) {
                    ma_thuoc_tinh = generateUniqueId('ATT');
                    await client.query(`INSERT INTO public.danh_muc_thuoc_tinh (ma_thuoc_tinh, ten_thuoc_tinh) VALUES ($1, $2)`, [ma_thuoc_tinh, ten_thuoc_tinh.trim()]);
                } else {
                    ma_thuoc_tinh = attrRes.rows[0].ma_thuoc_tinh;
                }

                let valueRes = await client.query(`SELECT ma_gia_tri FROM public.gia_tri_thuoc_tinh WHERE ma_thuoc_tinh = $1 AND LOWER(gia_tri) = LOWER($2)`, [ma_thuoc_tinh, gia_tri.trim()]);
                let ma_gia_tri;

                if (valueRes.rows.length === 0) {
                    ma_gia_tri = generateUniqueId('VAL');
                    await client.query(`INSERT INTO public.gia_tri_thuoc_tinh (ma_gia_tri, ma_thuoc_tinh, gia_tri) VALUES ($1, $2, $3)`, [ma_gia_tri, ma_thuoc_tinh, gia_tri.trim()]);
                } else {
                    ma_gia_tri = valueRes.rows[0].ma_gia_tri;
                }

                await client.query(`INSERT INTO public.chi_tiet_bien_the_thuoc_tinh (ma_bien_the, ma_gia_tri) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [variantId, ma_gia_tri]);
            }
        }

        await client.query('COMMIT');
        return res.status(200).json({ success: true, message: "Cập nhật biến thể thành công!", data: variantResult.rows[0] });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Lỗi updateVariant:', error.message);
        return res.status(500).json({ success: false, message: "Không thể cập nhật biến thể." });
    } finally {
        client.release();
    }
};

// =========================================================================
// 14.3 XÓA TỪNG BIẾN THỂ (SOFT DELETE - TÔN TRỌNG LOGIC BẢO TOÀN ĐƠN HÀNG)
// =========================================================================
export const deleteVariant = async (req, res) => {
    try {
        const { variantId } = req.params; 

        if (!variantId) {
            return res.status(400).json({ success: false, message: 'Mã ID biến thể không được trống.' });
        }

        const query = `
            UPDATE public.bien_the_san_pham 
            SET trang_thai = false, ngay_cap_nhat = NOW() 
            WHERE ma_bien_the = $1 
            RETURNING *;
        `;

        const { rows } = await pool.query(query, [variantId]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy biến thể sản phẩm yêu cầu.' });
        }

        return res.status(200).json({
            success: true,
            message: `Xóa biến thể ${variantId} thành công (Đã chuyển trạng thái lưu trữ).`,
            data: rows[0]
        });

    } catch (error) {
        console.error('❌ Lỗi API deleteVariant:', error.message);
        return res.status(500).json({ 
            success: false, 
            message: 'Sự cố máy chủ khi thực thi xóa biến thể sản phẩm.',
            error_detail: error.message 
        });
    }
};

// =========================================================================
// 14.4 XÓA TẤT CẢ BIẾN THỂ (SOFT DELETE - ẨN HÀNG LOẠT BẢO TOÀN DỮ LIỆU)
// =========================================================================
export const deleteAllVariants = async (req, res) => {
    try {
        const { id } = req.params; // Lấy ID của Sản phẩm cha

        // Chuyển toàn bộ biến thể của sản phẩm này sang trạng thái lưu trữ (false)
        const query = `
            UPDATE public.bien_the_san_pham 
            SET trang_thai = false, ngay_cap_nhat = NOW() 
            WHERE ma_san_pham = $1 
            RETURNING ma_bien_the;
        `;
        
        const { rows } = await pool.query(query, [id]);

        return res.status(200).json({ 
            success: true, 
            message: `Đã xóa (lưu trữ) thành công ${rows.length} biến thể để bảo toàn lịch sử đơn hàng!` 
        });
    } catch (error) {
        console.error('❌ Lỗi API deleteAllVariants:', error.message);
        return res.status(500).json({ 
            success: false, 
            message: 'Lỗi dọn dẹp biến thể.',
            error_detail: error.message
        });
    }
};

// =========================================================================
// 14.5 KHÔI PHỤC BIẾN THỂ ĐÃ XÓA MỀM (RESTORE SKU)
// =========================================================================
export const restoreVariant = async (req, res) => {
    try {
        const { variantId } = req.params;

        const query = `
            UPDATE public.bien_the_san_pham 
            SET trang_thai = true, ngay_cap_nhat = NOW() 
            WHERE ma_bien_the = $1 
            RETURNING *;
        `;
        
        const { rows } = await pool.query(query, [variantId]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy biến thể để khôi phục.' });
        }

        return res.status(200).json({ 
            success: true, 
            message: 'Đã khôi phục phiên bản thành công, sẵn sàng mở bán lại!' 
        });
    } catch (error) {
        console.error('❌ Lỗi API restoreVariant:', error.message);
        return res.status(500).json({ success: false, message: 'Sự cố máy chủ khi khôi phục biến thể.' });
    }
};

// =========================================================================
// 14.6 XÓA CỨNG BIẾN THỂ (HARD DELETE - DỌN SẠCH DATABASE)
// =========================================================================
export const hardDeleteVariant = async (req, res) => {
    const client = await pool.connect();
    try {
        const { variantId } = req.params;
        await client.query('BEGIN');

        // 1. Xóa ảnh liên kết
        await client.query(`DELETE FROM public.media_san_pham WHERE ma_bien_the = $1`, [variantId]);
        
        // 2. Xóa ma trận thuộc tính EAV
        await client.query(`DELETE FROM public.chi_tiet_bien_the_thuoc_tinh WHERE ma_bien_the = $1`, [variantId]);
        
        // 3. Xóa biến thể gốc
        const result = await client.query(`DELETE FROM public.bien_the_san_pham WHERE ma_bien_the = $1 RETURNING *`, [variantId]);

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Không tìm thấy biến thể để xóa.' });
        }

        await client.query('COMMIT');
        return res.status(200).json({ success: true, message: 'Đã xóa cứng biến thể vĩnh viễn!' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Lỗi hardDeleteVariant:', error.message);
        // Lỗi thường xảy ra nếu biến thể đã có đơn hàng tham chiếu đến nó (Foreign Key constraint)
        return res.status(500).json({ success: false, message: 'Không thể xóa cứng do biến thể này đã phát sinh đơn hàng!' });
    } finally {
        client.release();
    }
};

// =========================================================================
// 15. LẤY TOÀN BỘ DANH MỤC THUỘC TÍNH VÀ GIÁ TRỊ KHẢ DỤNG (CHO FORM MA TRẬN)
// =========================================================================
export const getAllAvailableAttributes = async (req, res) => {
    try {
        const query = `
            SELECT 
                dmtt.ma_thuoc_tinh AS id,
                dmtt.ten_thuoc_tinh AS name,
                COALESCE(json_agg(gttt.gia_tri) FILTER (WHERE gttt.gia_tri IS NOT NULL), '[]') AS values
            FROM public.danh_muc_thuoc_tinh dmtt
            LEFT JOIN public.gia_tri_thuoc_tinh gttt ON dmtt.ma_thuoc_tinh = gttt.ma_thuoc_tinh
            GROUP BY dmtt.ma_thuoc_tinh, dmtt.ten_thuoc_tinh
            ORDER BY dmtt.ten_thuoc_tinh ASC;
        `;
        
        const { rows } = await pool.query(query);
        
        const formattedAttributes = rows.map(row => ({
            id: row.id,
            name: row.name,
            values: [...new Set(row.values)], 
            selected: row.values[0] || "" 
        }));

        res.status(200).json(formattedAttributes);
    } catch (error) {
        console.error("❌ Lỗi API getAllAvailableAttributes:", error.message);
        res.status(500).json({ success: false, message: "Không thể tải ma trận thuộc tính." });
    }
};

// =========================================================================
// 16. TẠO THUỘC TÍNH MỚI (LƯU TÊN NHÓM THUỘC TÍNH MỚI KHI CLICK TẠO TRỰC TIẾP)
// =========================================================================
export const createAttribute = async (req, res) => {
    try {
        const { ten_thuoc_tinh } = req.body;
        if (!ten_thuoc_tinh || ten_thuoc_tinh.trim() === '') {
            return res.status(400).json({ success: false, message: 'Tên thuộc tính không được trống.' });
        }

        const name = ten_thuoc_tinh.trim();

        // 1. Kiểm tra xem tên đã tồn tại chưa
        const checkQuery = `SELECT ma_thuoc_tinh, ten_thuoc_tinh FROM public.danh_muc_thuoc_tinh WHERE LOWER(ten_thuoc_tinh) = LOWER($1);`;
        const checkRes = await pool.query(checkQuery, [name]);

        if (checkRes.rows.length > 0) {
            return res.status(200).json(checkRes.rows[0]);
        }

        // 2. TÌM MÃ ID LỚN NHẤT THỰC TẾ (Lọc bỏ các mã ngoại lai như MDMTT)
        const allAttRes = await pool.query(`
            SELECT ma_thuoc_tinh 
            FROM public.danh_muc_thuoc_tinh 
            WHERE ma_thuoc_tinh LIKE 'ATT%'
        `);

        let maxIdNum = 0;
        allAttRes.rows.forEach(row => {
            // Tách chỉ lấy số, ví dụ ATT017 -> 17
            const num = parseInt(row.ma_thuoc_tinh.replace(/\D/g, '')) || 0;
            if (num > maxIdNum) {
                maxIdNum = num;
            }
        });
        
        // Cộng 1 vào số lớn nhất tìm được
        const nextIdNum = maxIdNum + 1;
        const ma_thuoc_tinh_moi = `ATT${String(nextIdNum).padStart(3, '0')}`;

        const insertQuery = `
            INSERT INTO public.danh_muc_thuoc_tinh (ma_thuoc_tinh, ten_thuoc_tinh)
            VALUES ($1, $2)
            RETURNING ma_thuoc_tinh, ten_thuoc_tinh;
        `;
        const result = await pool.query(`INSERT INTO public.danh_muc_thuoc_tinh (ma_thuoc_tinh, ten_thuoc_tinh) VALUES ($1, $2) RETURNING *;`, [ma_thuoc_tinh_moi, name]);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('❌ Lỗi API createAttribute:', error.message);
        res.status(500).json({ success: false, message: 'Sự cố máy chủ khi tạo nhóm thuộc tính mới.' });
    }
};

// =========================================================================
// 17. TẢI FILE MINH HỌA LÊN CLOUDINARY (TRẢ VỀ SECURE URL CHO MÁY KHÁCH)
// =========================================================================
export const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Chưa chọn file hoặc tải tệp tin thất bại!' });
        }
        return res.status(200).json({ success: true, url: req.file.path });
    } catch (error) {
        console.error('❌ Lỗi tiến trình tải file lên máy chủ Cloudinary:', error.message);
        return res.status(500).json({ success: false, message: 'Gặp sự cố hệ thống khi tải ảnh.' });
    }
};

// =========================================================================
// 17.1 UPLOAD VÀ CẬP NHẬT ẢNH NHANH CHO BIẾN THỂ (DÙNG TẠI TRANG CHI TIẾT)
// =========================================================================
export const uploadVariantImage = async (req, res) => {
    try {
        const { variantId } = req.params;
        const { ma_san_pham } = req.body;

        if (!req.file) {
            return res.status(400).json({ success: false, message: "Không nhận được file ảnh." });
        }

        const imageUrl = req.file.path; 

        const checkResult = await pool.query(
            `SELECT ma_media FROM public.media_san_pham WHERE ma_bien_the = $1 AND loai_media = 'image' LIMIT 1;`, 
            [variantId]
        );

        if (checkResult.rows.length > 0) {
            await pool.query(
                `UPDATE public.media_san_pham SET duong_dan_url = $1, trang_thai = true WHERE ma_bien_the = $2 AND loai_media = 'image';`,
                [imageUrl, variantId]
            );
        } else {
            const newMediaId = `MED_${Date.now().toString().slice(-10)}`; 
            await pool.query(
                `INSERT INTO public.media_san_pham (ma_media, ma_san_pham, ma_bien_the, duong_dan_url, la_anh_chinh, loai_media, trang_thai)
                 VALUES ($1, $2, $3, $4, true, 'image', true);`,
                [newMediaId, ma_san_pham || null, variantId, imageUrl]
            );
        }

        return res.status(200).json({
            success: true,
            message: "Đã cập nhật ảnh đại diện biến thể!",
            duong_dan_url: imageUrl
        });

    } catch (error) {
        console.error("❌ Lỗi uploadVariantImage:", error.message);
        return res.status(500).json({ success: false, message: "Lỗi đồng bộ ảnh." });
    }
};

// =========================================================================
// 🛠️ MIGRATION TOOL: ĐỒNG BỘ DỮ LIỆU JSON CŨ SANG MA TRẬN EAV MỚI
// =========================================================================
export const migrateLegacyAttributes = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { rows: legacyVariants } = await client.query(`
            SELECT ma_bien_the, thuoc_tinh 
            FROM public.bien_the_san_pham 
            WHERE thuoc_tinh IS NOT NULL AND thuoc_tinh::text != '{}'
        `);

        let migratedCount = 0;

        for (const variant of legacyVariants) {
            let parsedAttributes;
            try {
                parsedAttributes = typeof variant.thuoc_tinh === 'string' 
                    ? JSON.parse(variant.thuoc_tinh) 
                    : variant.thuoc_tinh;
            } catch (e) {
                continue; 
            }

            for (const [ten_thuoc_tinh, gia_tri] of Object.entries(parsedAttributes)) {
                
                let attrRes = await client.query(
                    `SELECT ma_thuoc_tinh FROM public.danh_muc_thuoc_tinh WHERE ten_thuoc_tinh = $1`,
                    [ten_thuoc_tinh]
                );
                
                let ma_thuoc_tinh;
                if (attrRes.rows.length === 0) {
                    const attrCount = await client.query('SELECT COUNT(*) FROM public.danh_muc_thuoc_tinh');
                    ma_thuoc_tinh = `ATT${String(parseInt(attrCount.rows[0].count) + 1).padStart(3, '0')}`;
                    await client.query(
                        `INSERT INTO public.danh_muc_thuoc_tinh (ma_thuoc_tinh, ten_thuoc_tinh) VALUES ($1, $2)`,
                        [ma_thuoc_tinh, ten_thuoc_tinh]
                    );
                } else {
                    ma_thuoc_tinh = attrRes.rows[0].ma_thuoc_tinh;
                }

                let valRes = await client.query(
                    `SELECT ma_gia_tri FROM public.gia_tri_thuoc_tinh WHERE ma_thuoc_tinh = $1 AND gia_tri = $2`,
                    [ma_thuoc_tinh, gia_tri]
                );

                let ma_gia_tri;
                if (valRes.rows.length === 0) {
                    const valCount = await client.query('SELECT COUNT(*) FROM public.gia_tri_thuoc_tinh');
                    ma_gia_tri = `VAL${String(parseInt(valCount.rows[0].count) + 1).padStart(3, '0')}`;
                    await client.query(
                        `INSERT INTO public.gia_tri_thuoc_tinh (ma_gia_tri, ma_thuoc_tinh, gia_tri) VALUES ($1, $2, $3)`,
                        [ma_gia_tri, ma_thuoc_tinh, gia_tri]
                    );
                } else {
                    ma_gia_tri = valRes.rows[0].ma_gia_tri;
                }

                await client.query(
                    `INSERT INTO public.chi_tiet_bien_the_thuoc_tinh (ma_bien_the, ma_gia_tri) 
                     VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                    [variant.ma_bien_the, ma_gia_tri]
                );
            }
            migratedCount++;
        }

        await client.query('COMMIT');
        
        return res.status(200).json({
            success: true,
            message: `Hoàn tất đồng bộ! Đã phân tách thành công ${migratedCount} biến thể cũ sang chuẩn EAV.`,
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('🔥 Lỗi Migration Tool:', error);
        return res.status(500).json({ success: false, message: "Lỗi chạy đồng bộ." });
    } finally {
        client.release();
    }
};

// =========================================================================
// 19. ĐẶT ẢNH LÀM ẢNH CHÍNH CỦA SẢN PHẨM (MAIN IMAGE)
// =========================================================================
export const setMainProductImage = async (req, res) => {
    const client = await pool.connect();
    try {
        const { ma_san_pham, ma_media } = req.body;

        if (!ma_san_pham || !ma_media) {
            return res.status(400).json({ success: false, message: "Thiếu thông tin mã sản phẩm hoặc mã media." });
        }

        await client.query('BEGIN');

        // 1. Tắt tất cả các ảnh của sản phẩm này về la_anh_chinh = false
        await client.query(
            `UPDATE public.media_san_pham SET la_anh_chinh = false WHERE ma_san_pham = $1`,
            [ma_san_pham]
        );

        // 2. Bật duy nhất tấm ảnh được chọn thành true
        await client.query(
            `UPDATE public.media_san_pham SET la_anh_chinh = true WHERE ma_media = $1`,
            [ma_media]
        );

        await client.query('COMMIT');

        return res.status(200).json({ success: true, message: "Đã thiết lập ảnh chính thành công!" });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Lỗi setMainProductImage:', error.message);
        return res.status(500).json({ success: false, message: "Lỗi hệ thống khi thiết lập ảnh chính." });
    } finally {
        client.release();
    }
};

// =========================================================================
// THÊM ẢNH MỚI VÀO SẢN PHẨM (TỪ TAB CHI TIẾT SẢN PHẨM)
// =========================================================================
export const addProductMedia = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params; // ma_san_pham
        const { duong_dan_url } = req.body;

        if (!duong_dan_url) return res.status(400).json({ success: false, message: "Thiếu URL ảnh." });

        // Kiểm tra xem sản phẩm đã có ảnh nào chưa, nếu chưa thì tự động đặt làm ảnh chính
        const checkRes = await client.query(`SELECT COUNT(*) FROM public.media_san_pham WHERE ma_san_pham = $1`, [id]);
        const isMain = parseInt(checkRes.rows[0].count) === 0;

        const ma_media = generateUniqueId('MED'); // Hàm bạn đã có ở đầu file
        const query = `
            INSERT INTO public.media_san_pham (ma_media, ma_san_pham, duong_dan_url, la_anh_chinh, loai_media, trang_thai, ngay_tao)
            VALUES ($1, $2, $3, $4, 'image', true, NOW()) RETURNING *;
        `;
        const { rows } = await client.query(query, [ma_media, id, duong_dan_url, isMain]);

        res.status(201).json({ success: true, message: "Đã thêm ảnh vào sản phẩm!", data: rows[0] });
    } catch (error) {
        console.error("❌ Lỗi addProductMedia:", error.message);
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi thêm ảnh." });
    } finally {
        client.release();
    }
};

// =========================================================================
// API NỘI BỘ: ĐỒNG BỘ VÀ CỘNG DỒN TỒN KHO TỪ PHIẾU NHẬP CỦA WAREHOUSE-SERVICE
// =========================================================================
export const updateInternalStock = async (req, res) => {
    const client = await pool.connect();
    try {
        const { items } = req.body; // Mảng chứa các object: { sku, quantity }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Dữ liệu danh sách đồng bộ trống.' });
        }

        await client.query('BEGIN');

        for (const item of items) {
            const targetId = item.sku;
            const addedQty = parseInt(item.quantity) || 0;

            // Kiểm tra xem targetId có phải là một số nguyên hay không để tránh lỗi ép kiểu của Postgres
            const isNumeric = /^\d+$/.test(targetId);

            // Sửa logic câu lệnh SQL bằng cách ép kiểu an toàn hoặc chỉ check theo SKU
            let checkVariant;
            if (isNumeric) {
                checkVariant = await client.query(
                    `SELECT ma_bien_the FROM public.bien_the_san_pham WHERE sku = $1 OR ma_bien_the = $2`, 
                    [targetId, parseInt(targetId)]
                );
            } else {
                checkVariant = await client.query(
                    `SELECT ma_bien_the FROM public.bien_the_san_pham WHERE sku = $1`, 
                    [targetId]
                );
            }

            if (checkVariant.rows.length > 0) {
                // Nếu tìm thấy biến thể, thực hiện cộng dồn số lượng tồn kho
                if (isNumeric) {
                    await client.query(
                        `UPDATE public.bien_the_san_pham 
                         SET so_luong_ton = COALESCE(so_luong_ton, 0) + $1, ngay_cap_nhat = NOW() 
                         WHERE sku = $2 OR ma_bien_the = $3`,
                        [addedQty, targetId, parseInt(targetId)]
                    );
                } else {
                    await client.query(
                        `UPDATE public.bien_the_san_pham 
                         SET so_luong_ton = COALESCE(so_luong_ton, 0) + $1, ngay_cap_nhat = NOW() 
                         WHERE sku = $2`,
                        [addedQty, targetId]
                    );
                }
            } else {
                // Trường hợp là sản phẩm đơn độc lập (Không biến thể)
                // Cột ma_san_pham của public.san_pham có thể là dạng Số hoặc dạng Chuỗi, áp dụng check tương tự
                if (isNumeric) {
                    await client.query(
                        `UPDATE public.san_pham 
                         SET ngay_cap_nhat = NOW() 
                         WHERE ma_san_pham::text = $1 OR ma_san_pham = $2`,
                        [targetId, parseInt(targetId)]
                    );

                    await client.query(
                        `UPDATE public.bien_the_san_pham 
                         SET so_luong_ton = COALESCE(so_luong_ton, 0) + $1, ngay_cap_nhat = NOW() 
                         WHERE ma_san_pham::text = $2 OR ma_san_pham = $3`,
                        [addedQty, targetId, parseInt(targetId)]
                    );
                } else {
                    await client.query(
                        `UPDATE public.san_pham 
                         SET ngay_cap_nhat = NOW() 
                         WHERE ma_san_pham::text = $1`,
                        [targetId]
                    );

                    await client.query(
                        `UPDATE public.bien_the_san_pham 
                         SET so_luong_ton = COALESCE(so_luong_ton, 0) + $1, ngay_cap_nhat = NOW() 
                         WHERE ma_san_pham::text = $2`,
                        [addedQty, targetId]
                    );
                }
            }
        }

        await client.query('COMMIT');
        
        const io = req.app.get('io');
        if (io) {
            io.emit('stock_quantity_updated', { updated: true });
        }

        return res.status(200).json({ success: true, message: 'Cập nhật số lượng tồn kho thành công.' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Lỗi API updateInternalStock:', error.message);
        return res.status(500).json({ success: false, message: `Lỗi xử lý đồng bộ cơ sở dữ liệu: ${error.message}` });
    } finally {
        client.release();
    }
};

// =========================================================================
// API NỘI BỘ: TRỪ KHO AN TOÀN (ANTI RACE-CONDITION) KHI CÓ ĐƠN ĐẶT HÀNG
// ĐƯỢC GỌI TỪ ORDER-SERVICE
// =========================================================================
export const deductStockInternal = async (req, res) => {
    const { items } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: "Không có sản phẩm để trừ kho." });
    }

    let client;
    try {
        client = await pool.connect();
        await client.query('BEGIN');

        // 1. Gom nhóm lại để phòng trường hợp Order gửi mảng có 2 dòng cùng 1 variant_id
        const aggregatedItems = {};
        for (const item of items) {
            const vId = item.variant_id;
            if (!aggregatedItems[vId]) {
                aggregatedItems[vId] = { ...item, quantity: Number(item.quantity) };
            } else {
                aggregatedItems[vId].quantity += Number(item.quantity);
            }
        }

        // 2. Sắp xếp mã variant_id để khóa (Lock) theo đúng một chiều, triệt tiêu Deadlock (Nút thắt cổ chai)
        const sortedVariantIds = Object.keys(aggregatedItems).sort();

        // 3. Tiến hành khóa, kiểm tra và trừ kho
        for (const vId of sortedVariantIds) {
            const item = aggregatedItems[vId];
            const qtyToBuy = item.quantity;

            // 3.1 Khóa (Lock) dòng dữ liệu này lại. Bất cứ khách nào đang định mua SP này sẽ phải đứng chờ.
            const lockQuery = `
                SELECT s.trang_thai, s.da_xoa, b.ten_bien_the, b.so_luong_ton 
                FROM public.bien_the_san_pham b
                JOIN public.san_pham s ON b.ma_san_pham = s.ma_san_pham
                WHERE b.ma_bien_the = $1 
                FOR UPDATE OF b; 
            `;
            const lockRes = await client.query(lockQuery, [vId]);

            // Nếu biến thể không tồn tại
            if (lockRes.rows.length === 0) {
                throw new Error(`Sản phẩm mã ${vId} không còn tồn tại.`);
            }

            const row = lockRes.rows[0];
            const isProductActive = row.trang_thai === true;
            const isProductDeleted = row.da_xoa === true;    
            const currentStock = Number(row.so_luong_ton);
            const variantName = row.ten_bien_the || vId;

            // 🌟 Kiểm tra trạng thái cha theo đúng Schema thực tế
            if (isProductDeleted) {
                throw new Error(`Sản phẩm "${variantName}" đã bị xóa.`);
            }
            if (!isProductActive) {
                throw new Error(`Sản phẩm "${variantName}" hiện đã bị khóa bán.`);
            }

            // 3.2 Kiểm tra khắt khe tồn kho thực tế (Tránh Frontend gửi láo)
            if (currentStock < qtyToBuy) {
                throw new Error(`Rất tiếc! "${variantName}" chỉ còn ${currentStock} sản phẩm. Bạn vui lòng giảm số lượng.`);
            }

            // 3.3 Trừ kho an toàn
            const updateStockQuery = `
                UPDATE public.bien_the_san_pham 
                SET so_luong_ton = so_luong_ton - $1, ngay_cap_nhat = NOW()
                WHERE ma_bien_the = $2;
            `;
            await client.query(updateStockQuery, [qtyToBuy, vId]);
        }

        // 4. Mọi thứ thành công, chốt Transaction và nhả khóa.
        await client.query('COMMIT');

        // Bắn Socket báo hiệu để Dashboard hoặc Client có thể update số lượng hiển thị (Tuỳ chọn)
        const io = req.app.get('io');
        if (io) {
            io.emit('stock_quantity_updated', { updated: true });
        }

        return res.status(200).json({ success: true, message: "Trừ kho thành công!" });

    } catch (error) {
        if (client) {
            await client.query('ROLLBACK');
        }
        console.error("❌ Lỗi deductStockInternal (Product-Service):", error.message);
        
        // Trả lỗi 400 về để Order Service biết và thông báo cho người dùng
        return res.status(400).json({ success: false, message: error.message });
    } finally {
        if (client) {
            client.release();
        }
    }
};

// =========================================================================
// API NỘI BỘ: KIỂM TRA VÀ TẠO MÃ SKU THÔNG MINH, KHÔNG TRÙNG LẶP
// =========================================================================
export const generateSafeSku = async (req, res) => {
    try {
        const { baseSku } = req.body;
        
        if (!baseSku) {
            return res.status(400).json({ success: false, message: "Thiếu baseSku" });
        }

        const baseStr = String(baseSku).trim().toUpperCase();

        // 1. Quét tìm tất cả các SKU trong hệ thống có chứa baseSku này (Dùng LIKE)
        const checkQuery = `
            SELECT sku 
            FROM public.bien_the_san_pham 
            WHERE sku LIKE $1;
        `;
        const { rows } = await pool.query(checkQuery, [`${baseStr}%`]);

        let proposedSku = `${baseStr}-001`;

        // 2. Nếu đã tồn tại các mã giống baseSku, ta sẽ tìm số đuôi lớn nhất
        if (rows.length > 0) {
            let maxSuffix = 0;
            
            rows.forEach(row => {
                if (!row.sku) return;
                // Cắt phần đuôi sau dấu gạch ngang cuối cùng
                const parts = row.sku.split('-');
                const lastPart = parts[parts.length - 1];
                
                // Nếu phần đuôi là số (vd: 001, 002)
                const num = parseInt(lastPart, 10);
                if (!isNaN(num) && num > maxSuffix) {
                    maxSuffix = num;
                }
            });

            // Cộng 1 vào số lớn nhất
            const nextNum = maxSuffix + 1;
            proposedSku = `${baseStr}-${String(nextNum).padStart(3, '0')}`;
        }

        return res.status(200).json({ success: true, safeSku: proposedSku });

    } catch (error) {
        console.error("❌ Lỗi API generateSafeSku:", error.message);
        return res.status(500).json({ success: false, message: "Lỗi tạo SKU tự động" });
    }
};

// =========================================================================
// API NỘI BỘ: HOÀN LẠI KHO (CỘNG DỒN) KHI KHÁCH HỦY ĐƠN HOẶC HOÀN TRẢ
// ĐƯỢC GỌI TỪ ORDER-SERVICE
// =========================================================================
export const restoreStockInternal = async (req, res) => {
    const { items } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: "Không có sản phẩm để hoàn kho." });
    }

    let client;
    try {
        client = await pool.connect();
        await client.query('BEGIN');

        for (const item of items) {
            const vId = item.variant_id || item.variantId;
            const qtyToRestore = Number(item.quantity);

            if (!vId || isNaN(qtyToRestore) || qtyToRestore <= 0) continue;

            // Câu lệnh UPDATE này tự động an toàn (atomic) trong Postgres
            await client.query(`
                UPDATE public.bien_the_san_pham 
                SET so_luong_ton = so_luong_ton + $1, ngay_cap_nhat = NOW()
                WHERE ma_bien_the = $2;
            `, [qtyToRestore, vId]);
        }

        await client.query('COMMIT');

        // Bắn Socket cập nhật giao diện kho
        const io = req.app.get('io');
        if (io) {
            io.emit('stock_quantity_updated', { updated: true });
        }

        return res.status(200).json({ success: true, message: "Hoàn kho thành công!" });

    } catch (error) {
        if (client) await client.query('ROLLBACK');
        console.error("❌ Lỗi restoreStockInternal (Product-Service):", error.message);
        return res.status(500).json({ success: false, message: "Lỗi hệ thống khi cộng lại kho." });
    } finally {
        if (client) client.release();
    }
};

// ========================================================
// 📊 API THỐNG KÊ SẢN PHẨM CHO ADMIN DASHBOARD
// ========================================================
export const getProductStatistics = async (req, res) => {
    try {
        // 1. Tổng sản phẩm gốc
        const totalProdQuery = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN trang_thai = true THEN 1 ELSE 0 END) as active_total
            FROM public.san_pham
        `;
        
        // 2. Thống kê Biến thể (SKU): Tổng số, Hết hàng, Giá trị tồn kho
        const skuStatsQuery = `
    SELECT 
        COUNT(bt.ma_bien_the) as total_sku,
        SUM(CASE WHEN sp.trang_thai = true THEN 1 ELSE 0 END) as active_sku,
        SUM(CASE WHEN bt.so_luong_ton <= 0 THEN 1 ELSE 0 END) as out_of_stock,
        SUM(CASE WHEN bt.so_luong_ton > 0 THEN 1 ELSE 0 END) as in_stock,
        SUM(bt.so_luong_ton * bt.gia_ban_le) as total_inventory_value,
        SUM(bt.so_luong_ton) as total_stock
    FROM public.bien_the_san_pham bt
    JOIN public.san_pham sp ON bt.ma_san_pham = sp.ma_san_pham
`;

        // 3. Top 4 Sản phẩm có nhiều biến thể (SKU) nhất
        const topProdSkuQuery = `
            SELECT sp.ma_san_pham, sp.ten_san_pham, COUNT(bt.ma_bien_the) as sku_count
            FROM public.san_pham sp
            JOIN public.bien_the_san_pham bt ON sp.ma_san_pham = bt.ma_san_pham
            GROUP BY sp.ma_san_pham, sp.ten_san_pham
            ORDER BY sku_count DESC
            LIMIT 50 
        `;

        // 4. Top 5 SKU có giá trị tồn kho cao nhất
        const topValueSkuQuery = `
            SELECT 
                bt.ma_bien_the as id,
                sp.ten_san_pham || ' - ' || COALESCE(bt.ten_bien_the, 'Mặc định') as name,
                COALESCE(bt.sku, 'Chưa cập nhật') as sku,
                bt.so_luong_ton as stock,
                bt.gia_ban_le as price,
                (bt.so_luong_ton * bt.gia_ban_le) as total_value
            FROM public.bien_the_san_pham bt
            JOIN public.san_pham sp ON bt.ma_san_pham = sp.ma_san_pham
            WHERE bt.so_luong_ton > 0
            ORDER BY total_value DESC
            LIMIT 50
        `;

        const executeSql = async (sql) => {
            const res = await pool.query(sql);
            return res.rows ? res.rows : res;
        };

        const [prodRes, skuRes, topProdRes, topValueRes] = await Promise.all([
            executeSql(totalProdQuery),
            executeSql(skuStatsQuery),
            executeSql(topProdSkuQuery),
            executeSql(topValueSkuQuery)
        ]);

        const totalProducts = Number(prodRes[0]?.total || 0);
        const activeProducts = Number(prodRes[0]?.active_total || 0);
        const skuStats = skuRes[0] || {};
        const topProducts = topProdRes;
        const topSkus = topValueRes;

        return res.status(200).json({
            success: true,
            data: {
                overview: {
                    total_products: totalProducts,
                    active_products: activeProducts,
                    total_inventory_value: Number(skuStats.total_inventory_value || 0),
                    total_stock_count: Number(skuStats.total_stock || 0),
                    out_of_stock_skus: Number(skuStats.out_of_stock || 0),
                    in_stock_skus: Number(skuStats.in_stock || 0), 
                    total_skus: Number(skuStats.total_sku || 0),
                    active_skus: Number(skuStats.active_sku || 0)
                },
                top_products_sku: topProducts,
                top_inventory_skus: topSkus
            }
        });

    } catch (error) {
        console.error("🔥 Lỗi lấy thống kê sản phẩm:", error.message);
        return res.status(500).json({ success: false, message: "Lỗi hệ thống khi trích xuất dữ liệu sản phẩm!" });
    }
};

// =========================================================================
// 20. API NỘI BỘ: ĐỒNG BỘ CHÍNH XÁC SỐ LƯỢNG TỒN KHO TỪ INVENTORY-SERVICE (CÁCH 1)
// API này nhận số lượng TỔNG CHÍNH XÁC từ kho và ghi đè, không cộng dồn.
// =========================================================================
export const syncExactStockInternal = async (req, res) => {
    const client = await pool.connect();
    try {
        const { sku, total_quantity } = req.body;

        if (!sku || total_quantity === undefined) {
            return res.status(400).json({ success: false, message: 'Thiếu mã SKU hoặc số lượng để đồng bộ.' });
        }

        await client.query('BEGIN');

        // Ghi đè tuyệt đối số lượng tồn kho theo số liệu của Inventory Service
        const updateQuery = `
            UPDATE public.bien_the_san_pham 
            SET so_luong_ton = $1, ngay_cap_nhat = NOW() 
            WHERE sku = $2
            RETURNING ma_san_pham;
        `;
        const result = await client.query(updateQuery, [total_quantity, sku]);

        if (result.rows.length > 0) {
            // Cập nhật ngày thay đổi của sản phẩm cha để Web ưu tiên hiển thị hoặc re-cache
            const ma_san_pham = result.rows[0].ma_san_pham;
            await client.query(`UPDATE public.san_pham SET ngay_cap_nhat = NOW() WHERE ma_san_pham = $1`, [ma_san_pham]);
        }

        await client.query('COMMIT');

        // Bắn Socket để trang Web/App của khách tự động cập nhật số lượng (Real-time)
        const io = req.app.get('io');
        if (io) {
            io.emit('stock_quantity_updated', { updated: true, sku: sku, new_quantity: total_quantity });
        }

        return res.status(200).json({ success: true, message: `Đã đồng bộ SKU ${sku} thành ${total_quantity} sản phẩm!` });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Lỗi API syncExactStockInternal:', error.message);
        return res.status(500).json({ success: false, message: 'Lỗi server khi đồng bộ kho.' });
    } finally {
        client.release();
    }
};

// =========================================================================
// 21. API NỘI BỘ: ĐỒNG BỘ HÀNG LOẠT TOÀN BỘ KHO (BULK RECONCILIATION)
// =========================================================================
export const bulkSyncStockInternal = async (req, res) => {
    const client = await pool.connect();
    try {
        const { sync_items } = req.body; // Mảng chứa các object: [{ sku: "SKU01", total_quantity: 50 }, ...]

        if (!sync_items || !Array.isArray(sync_items) || sync_items.length === 0) {
            return res.status(400).json({ success: false, message: 'Danh sách đồng bộ trống.' });
        }

        await client.query('BEGIN');

        // Khởi tạo câu lệnh cập nhật hàng loạt bằng cách sử dụng hứa hẹn (Promise.all)
        const updatePromises = sync_items.map(item => {
            const query = `
                UPDATE public.bien_the_san_pham 
                SET so_luong_ton = $1, ngay_cap_nhat = NOW() 
                WHERE sku = $2;
            `;
            return client.query(query, [item.total_quantity, item.sku]);
        });

        await Promise.all(updatePromises);
        await client.query('COMMIT');

        // Bắn Socket thông báo cho toàn bộ hệ thống cập nhật lại giao diện hiển thị tổng
        const io = req.app.get('io');
        if (io) {
            io.emit('stock_quantity_updated', { bulk_updated: true });
        }

        return res.status(200).json({ 
            success: true, 
            message: `Hệ thống đối soát hoàn tất. Đã đồng bộ khớp lại ${sync_items.length} mã hàng!` 
		});

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Lỗi API bulkSyncStockInternal:', error.message);
        return res.status(500).json({ success: false, message: 'Lỗi hệ thống khi chạy đối soát hàng loạt.' });
    } finally {
        client.release();
    }
};

// =========================================================================
// 22 API: LẤY SỐ LƯỢT YÊU THÍCH & TRẠNG THÁI CỦA USER
// =========================================================================
export const getProductLikes = async (req, res) => {
    try {
        const { id } = req.params; 
        let userId = null;

        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer')) {
            const token = authHeader.split(' ')[1];
            try {
                const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
                userId = payload.id || payload.user_id;
            } catch (e) {}
        }

        const countQuery = `SELECT COUNT(*) FROM public.san_pham_yeu_thich WHERE ma_san_pham = $1 AND trang_thai = true`;
        // Thay db thành pool
        const countResult = pool.query ? await pool.query(countQuery, [id]) : await pool.execute(countQuery, [id]);
        
        const countRow = countResult.rows ? countResult.rows[0] : countResult[0];
        const totalLikes = parseInt(countRow?.count || 0, 10);

        let isLikedByUser = false;
        if (userId) {
            const userQuery = `SELECT trang_thai FROM public.san_pham_yeu_thich WHERE ma_san_pham = $1 AND user_id = $2 LIMIT 1`;
            // Thay db thành pool
            const userResult = pool.query ? await pool.query(userQuery, [id, userId]) : await pool.execute(userQuery, [id, userId]);
            const userRow = userResult.rows ? userResult.rows[0] : userResult[0];
            
            if (userRow) {
                isLikedByUser = userRow.trang_thai;
            }
        }

        return res.status(200).json({
            success: true,
            data: {
                total_likes: totalLikes,
                is_liked_by_user: isLikedByUser
            }
        });

    } catch (error) {
        console.error("🔥 Lỗi getProductLikes:", error.message);
        return res.status(500).json({ success: false, message: "Lỗi máy chủ khi lấy dữ liệu yêu thích." });
    }
};

// =========================================================================
// 23 API: THÊM / BỎ YÊU THÍCH SẢN PHẨM (TOGGLE)
// =========================================================================
export const toggleProductLike = async (req, res) => {
    try {
        const { id } = req.params; 
        const { trang_thai } = req.body; 
        let userId = req.user?.id || req.user?.user_id; 

        if (!userId) {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer')) {
                const token = authHeader.split(' ')[1];
                try {
                    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
                    userId = payload.id || payload.user_id;
                } catch (e) {}
            }
        }

        if (!userId) {
            return res.status(401).json({ success: false, message: "Bạn cần đăng nhập để thực hiện chức năng này!" });
        }

        const checkQuery = `SELECT ma_yeu_thich FROM public.san_pham_yeu_thich WHERE ma_san_pham = $1 AND user_id = $2 LIMIT 1`;
        // Thay db thành pool
        const checkResult = pool.query ? await pool.query(checkQuery, [id, userId]) : await pool.execute(checkQuery, [id, userId]);
        const exists = checkResult.rows ? checkResult.rows.length > 0 : checkResult.length > 0;

        if (exists) {
            const updateQuery = `
                UPDATE public.san_pham_yeu_thich 
                SET trang_thai = $1, ngay_cap_nhat = NOW() 
                WHERE ma_san_pham = $2 AND user_id = $3
            `;
            // Thay db thành pool
            pool.query ? await pool.query(updateQuery, [trang_thai, id, userId]) : await pool.execute(updateQuery, [trang_thai, id, userId]);
        } else {
            const insertQuery = `
                INSERT INTO public.san_pham_yeu_thich (ma_san_pham, user_id, trang_thai, ngay_tao, ngay_cap_nhat) 
                VALUES ($1, $2, $3, NOW(), NOW())
            `;
            // Thay db thành pool
            pool.query ? await pool.query(insertQuery, [id, userId, trang_thai]) : await pool.execute(insertQuery, [id, userId, trang_thai]);
        }

        return res.status(200).json({ 
            success: true, 
            message: trang_thai ? "Đã thêm vào danh sách yêu thích!" : "Đã bỏ yêu thích!" 
        });

    } catch (error) {
        console.error("🔥 Lỗi toggleProductLike:", error.message);
        return res.status(500).json({ success: false, message: "Lỗi hệ thống khi cập nhật trạng thái yêu thích." });
    }
};

// =========================================================================
// 24 API: LẤY DANH SÁCH TOÀN BỘ SẢN PHẨM YÊU THÍCH CỦA 1 USER
// =========================================================================
export const getUserFavorites = async (req, res) => {
    try {
        let userId = req.user?.id || req.user?.user_id;

        // Bóc tách token
        if (!userId) {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer')) {
                const token = authHeader.split(' ')[1];
                try {
                    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
                    userId = payload.id || payload.user_id;
                } catch (e) {}
            }
        }

        if (!userId) {
            return res.status(401).json({ success: false, message: "Bạn cần đăng nhập để xem danh sách này!" });
        }

       // 🌟 Đã sửa so_luong_ton thành so_luong_kho
        const query = `
            SELECT 
                p.ma_san_pham, p.ten_san_pham, p.mo_ta, p.trang_thai, p.ma_quoc_gia, p.co_bien_the,
                f.ngay_cap_nhat as ngay_thich,
                -- 🌟 SỬA Ở ĐÂY: Ép kiểu về số nguyên (::int) và đặt tên là tong_ton_kho để thẻ ProductCard đọc được
                COALESCE((SELECT SUM(so_luong_ton)::int FROM public.bien_the_san_pham WHERE ma_san_pham = p.ma_san_pham), 0) AS tong_ton_kho,
                
                -- 🌟 Dự phòng thêm biến stock (đề phòng ReactJS cũng cần dùng)
                COALESCE((SELECT SUM(so_luong_ton)::int FROM public.bien_the_san_pham WHERE ma_san_pham = p.ma_san_pham), 0) AS stock
                (SELECT ma_bien_the FROM public.bien_the_san_pham WHERE ma_san_pham = p.ma_san_pham LIMIT 1) AS ma_bien_the_mac_dinh,
                (SELECT duong_dan_url FROM public.media_san_pham WHERE ma_san_pham = p.ma_san_pham AND la_anh_chinh = true LIMIT 1) as hinh_anh_chinh
            FROM public.san_pham p
            JOIN public.san_pham_yeu_thich f ON p.ma_san_pham = f.ma_san_pham
            WHERE f.user_id = $1 AND f.trang_thai = true
            ORDER BY f.ngay_cap_nhat DESC
        `;
        
        const result = pool.query ? await pool.query(query, [userId]) : await pool.execute(query, [userId]);
        const favorites = result.rows ? result.rows : result;

        return res.status(200).json({ success: true, data: favorites });
    } catch (error) {
        console.error("🔥 Lỗi getUserFavorites:", error.message);
        return res.status(500).json({ success: false, message: "Lỗi hệ thống khi tải danh sách yêu thích." });
    }
};

// =========================================================================
// 25 API: LẤY TOP SẢN PHẨM ĐƯỢC YÊU THÍCH NHẤT (SẮP XẾP TỪ CAO XUỐNG THẤP)
// =========================================================================
export const getTopFavoriteProducts = async (req, res) => {
    try {
        // Truy vấn đếm số lượt yêu thích, kèm theo ảnh chính và giá bán thấp nhất
        const query = `
            SELECT 
                p.*, 
                COUNT(f.ma_yeu_thich) as total_likes,
                (SELECT duong_dan_url FROM public.media_san_pham WHERE ma_san_pham = p.ma_san_pham AND la_anh_chinh = true LIMIT 1) as hinh_anh_chinh,
                (SELECT MIN(gia_ban_le) FROM public.bien_the_san_pham WHERE ma_san_pham = p.ma_san_pham) as gia_ban_thap_nhat,
                
                -- 🌟 SỬA Ở ĐÂY: Ép kiểu về số nguyên (::int) và đặt tên là tong_ton_kho để thẻ ProductCard đọc được
                COALESCE((SELECT SUM(so_luong_ton)::int FROM public.bien_the_san_pham WHERE ma_san_pham = p.ma_san_pham), 0) AS tong_ton_kho,
                
                -- 🌟 Dự phòng thêm biến stock (đề phòng ReactJS cũng cần dùng)
                COALESCE((SELECT SUM(so_luong_ton)::int FROM public.bien_the_san_pham WHERE ma_san_pham = p.ma_san_pham), 0) AS stock

            FROM public.san_pham p
            JOIN public.san_pham_yeu_thich f ON p.ma_san_pham = f.ma_san_pham
            WHERE f.trang_thai = true
            GROUP BY p.ma_san_pham
            ORDER BY total_likes DESC
            LIMIT 10;
        `;
        
        const result = pool.query ? await pool.query(query) : await pool.execute(query);
        const products = result.rows ? result.rows : result;

        return res.status(200).json({ success: true, data: products });
    } catch (error) {
        console.error("🔥 Lỗi getTopFavoriteProducts:", error.message);
        return res.status(500).json({ success: false, message: "Lỗi hệ thống khi tải top sản phẩm yêu thích." });
    }
};