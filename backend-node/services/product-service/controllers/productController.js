import pool from '../configs/database.js';
// Tạm thời comment axios nếu chưa cài hoặc chưa dùng tới để tránh lỗi khởi động server
// import axios from 'axios'; 

// 1. Lấy tất cả sản phẩm (Trang Home)
export const getAllProducts = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 12;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * limit;

        const query = `
            SELECT 
                sp.*, 
                dm.ten_danh_muc,
                dm.duong_dan_seo AS slug_danh_muc,
                LOWER(vm.ma_quoc_gia) AS country_code,
                COALESCE((SELECT MIN(gia_ban_le) FROM bien_the_san_pham WHERE ma_san_pham = sp.ma_san_pham), 0) AS gia_ban_thap_nhat,
                (SELECT duong_dan_url FROM media_san_pham WHERE ma_san_pham = sp.ma_san_pham AND la_anh_chinh = true LIMIT 1) AS hinh_anh_chinh,
                -- Lấy array mã biến thể để sau này map stock
                COALESCE((SELECT array_agg(ma_bien_the) FROM bien_the_san_pham WHERE ma_san_pham = sp.ma_san_pham), '{}') as variant_ids
            FROM san_pham sp
            LEFT JOIN danh_muc dm ON sp.ma_danh_muc = dm.ma_danh_muc
            LEFT JOIN vung_mien vm ON sp.ma_vung = vm.ma_vung
            WHERE sp.trang_thai = true
            ORDER BY sp.ngay_tao DESC
            LIMIT $1 OFFSET $2;
        `;

        const { rows: products } = await pool.query(query, [limit, offset]);

        if (products.length === 0) return res.status(200).json([]);

        // --- TẠM THỜI BỎ QUA GỌI INVENTORY SERVICE ---
        // Gán tồn kho giả để Frontend không bị lỗi undefined
        const finalProducts = products.map(p => {
            delete p.variant_ids; 
            return { ...p, tong_ton_kho: 999 }; // Số ảo để test giao diện
        });

        res.status(200).json(finalProducts);
    } catch (error) {
        console.error("Lỗi API getAllProducts:", error.message);
        res.status(500).json({ error: error.message });
    }
};

// 2. Lấy chi tiết 1 sản phẩm (Trang Chi tiết)
export const getProductById = async (req, res) => {
    const { id } = req.params; 
    try {
        const query = `
            SELECT 
                sp.*, 
                dm.ten_danh_muc,
                dm.duong_dan_seo AS slug_danh_muc,
                LOWER(vm.ma_quoc_gia) AS country_code,
                COALESCE(
                    (SELECT json_agg(bt) FROM bien_the_san_pham bt WHERE bt.ma_san_pham = sp.ma_san_pham), 
                    '[]'
                ) as bien_the,
                COALESCE(
                    (SELECT json_agg(m) FROM media_san_pham m WHERE m.ma_san_pham = sp.ma_san_pham), 
                    '[]'
                ) as media
            FROM san_pham sp
            LEFT JOIN danh_muc dm ON sp.ma_danh_muc = dm.ma_danh_muc
            LEFT JOIN vung_mien vm ON sp.ma_vung = vm.ma_vung
            WHERE sp.ma_san_pham = $1;
        `;
        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Sản phẩm không tồn tại Demi ơi!" });
        }

        const product = result.rows[0];

        // --- TẠM THỜI BỎ QUA GỌI INVENTORY SERVICE ---
        // Gán tồn kho cho từng biến thể để nút chọn biến thể hoạt động
        if (product.bien_the) {
            product.bien_the = product.bien_the.map(bt => ({
                ...bt,
                ton_kho: 100 // Số ảo
            }));
        }

        res.status(200).json(product); 
    } catch (error) {
        console.error("Lỗi API getProductById:", error.message);
        res.status(500).json({ error: error.message });
    }
};