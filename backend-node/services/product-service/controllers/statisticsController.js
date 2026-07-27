// File: backend/services/product-service/controllers/statisticsController.js
import pool from '../configs/database.js';

export const getProductStatistics = async (req, res) => {
    try {
        // 1. Tổng sản phẩm gốc & sản phẩm đang hoạt động
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
                SUM(COALESCE(bt.so_luong_ton, 0) * COALESCE(bt.gia_ban_le, 0)) as total_inventory_value,
                SUM(bt.so_luong_ton) as total_stock
            FROM public.bien_the_san_pham bt
            JOIN public.san_pham sp ON bt.ma_san_pham = sp.ma_san_pham
        `;

        const [prodRes, skuRes] = await Promise.all([
            pool.query(totalProdQuery),
            pool.query(skuStatsQuery)
        ]);

        const prodRows = prodRes.rows || prodRes;
        const skuRows = skuRes.rows || skuRes;

        return res.status(200).json({
            success: true,
            data: {
                total_products: Number(prodRows[0]?.total || 0),
                active_products: Number(prodRows[0]?.active_total || 0),
                total_inventory_value: Number(skuRows[0]?.total_inventory_value || 0),
                total_stock_count: Number(skuRows[0]?.total_stock || 0),
                out_of_stock_skus: Number(skuRows[0]?.out_of_stock || 0),
                in_stock_skus: Number(skuRows[0]?.in_stock || 0), 
                total_skus: Number(skuRows[0]?.total_sku || 0),
                active_skus: Number(skuRows[0]?.active_sku || 0)
            }
        });
    } catch (error) {
        console.error("🔥 Lỗi getProductStatistics:", error.message);
        return res.status(500).json({ success: false, message: "Lỗi hệ thống khi trích xuất dữ liệu sản phẩm!" });
    }
};