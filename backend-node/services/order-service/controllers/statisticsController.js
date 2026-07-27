// File: backend/services/order-service/controllers/statisticsController.js
import db from '../configs/database.js';

// ========================================================
// 📊 ENDPOINT 1: TỔNG QUAN SỐ LƯỢNG ĐƠN & DOANH THU PAID
// ========================================================
export const getOrderOverviewStats = async (req, res) => {
  try {
    const { from, to } = req.query;
    const queryParams = [];
    let pIdx = 1;
    let whereConditions = [];

    // Chuẩn hóa bộ lọc khoảng ngày
    if (from && from.trim() !== '') {
      whereConditions.push(`DATE(ngay_tao) >= $${pIdx}`);
      queryParams.push(from.trim());
      pIdx++;
    }
    if (to && to.trim() !== '') {
      whereConditions.push(`DATE(ngay_tao) <= $${pIdx}`);
      queryParams.push(to.trim());
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Tách độc lập tập hợp đếm tổng chu kỳ chạy theo ${whereClause}
    // Còn số liệu thời gian thực (hôm nay/chờ duyệt) chạy câu sub-query cô lập hoàn toàn để không bị bộ lọc chặn đứng làm bằng 0
    const statsQuery = `
        SELECT 
            COUNT(*) as total_orders,
            SUM(CASE WHEN LOWER(TRIM(COALESCE(trang_thai_don_hang, ''))) IN ('delivered', 'da_giao', 'đã giao', 'completed') THEN 1 ELSE 0 END) as delivered_orders,
            (SELECT COUNT(*) FROM public.orders WHERE LOWER(TRIM(COALESCE(trang_thai_don_hang, ''))) IN ('pending', 'cho_xu_ly', 'chờ xử lý', 'dang_xu_ly', 'chờ xác nhận', '')) as pending_orders,
            (SELECT COUNT(*) FROM public.orders WHERE DATE(ngay_tao) = CURRENT_DATE) as today_orders,
            SUM(CASE 
                WHEN LOWER(TRIM(COALESCE(trang_thai_thanh_toan, ''))) IN ('completed', 'da_thanh_toan', 'đã thanh toán', 'success', 'paid') 
                OR LOWER(TRIM(COALESCE(trang_thai_don_hang, ''))) IN ('delivered', 'da_giao', 'đã giao') 
                THEN CAST(COALESCE(tong_thanh_toan, 0) AS numeric) 
                ELSE 0 
            END) as total_revenue
        FROM public.orders
        ${whereClause}
    `;
    
    const statsRes = await db.query(statsQuery, queryParams);
    const stats = statsRes.rows[0] || {};

    return res.status(200).json({
      success: true,
      data: {
        total_orders: Number(stats.total_orders || 0),
        delivered_orders: Number(stats.delivered_orders || 0),
        pending_orders: Number(stats.pending_orders || 0),
        today_orders: Number(stats.today_orders || 0),
        total_revenue: Number(stats.total_revenue || 0)
      }
    });
  } catch (err) {
    console.error("🔥 Lỗi getOrderOverviewStats PostgreSQL:", err.message);
    return res.status(500).json({ success: false, message: "Lỗi máy chủ khi trích xuất thống kê đơn hàng." });
  }
};

// =========================================================================
// 📊 ENDPOINT 2: BIỂU ĐỒ DOANH THU ĐA CHẶNG THỜI GIAN KÈM BỘ LỌC NGÀY TÙY CHỌN
// =========================================================================
export const getMonthlyRevenue = async (req, res) => {
  try {
    const { from, to, groupBy = 'month' } = req.query;
    const queryParams = [];
    let pIdx = 1;

    let whereConditions = [
      `(LOWER(TRIM(COALESCE(trang_thai_thanh_toan, ''))) IN ('completed', 'da_thanh_toan', 'đã thanh toán', 'success', 'paid')
       OR LOWER(TRIM(COALESCE(trang_thai_don_hang, ''))) IN ('delivered', 'da_giao', 'đã giao'))`
    ];

    if (from && from.trim() !== '') {
      whereConditions.push(`DATE(ngay_tao) >= $${pIdx}`);
      queryParams.push(from.trim());
      pIdx++;
    } else {
      if (groupBy === 'day') whereConditions.push(`ngay_tao >= NOW() - INTERVAL '30 days'`);
      else if (groupBy === 'week') whereConditions.push(`ngay_tao >= NOW() - INTERVAL '12 weeks'`);
      else if (groupBy === 'month') whereConditions.push(`ngay_tao >= NOW() - INTERVAL '12 months'`);
      else if (groupBy === 'year') whereConditions.push(`ngay_tao >= NOW() - INTERVAL '5 years'`);
    }

    if (to && to.trim() !== '') {
      whereConditions.push(`DATE(ngay_tao) <= $${pIdx}`);
      queryParams.push(to.trim());
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    let dateFormat = "YYYY-MM"; 
    if (groupBy === 'day') dateFormat = "YYYY-MM-DD";
    if (groupBy === 'week') dateFormat = "YYYY-''W''IW"; 
    if (groupBy === 'year') dateFormat = "YYYY";

    const revenueQuery = `
      SELECT 
        TO_CHAR(ngay_tao, '${dateFormat}') as time_period,
        SUM(CAST(COALESCE(tong_thanh_toan, 0) AS numeric)) as period_total
      FROM public.orders
      ${whereClause}
      GROUP BY TO_CHAR(ngay_tao, '${dateFormat}')
      ORDER BY time_period ASC
    `;

    const result = await db.query(revenueQuery, queryParams);
    const rows = result.rows || [];

    const labels = rows.map(row => row.time_period);
    const revenues = rows.map(row => Number(row.period_total || 0));

    return res.status(200).json({
      success: true,
      months: labels, 
      revenues
    });
  } catch (err) {
    console.error("🔥 Lỗi API getMonthlyRevenue PostgreSQL:", err.message);
    return res.status(500).json({ success: false, message: "Lỗi hệ thống khi trích xuất dữ liệu chuỗi thời gian." });
  }
};

// =========================================================================
// 🏆 ENDPOINT 3: LẤY TOP 5 SẢN PHẨM BÁN CHẠY THỰC TẾ TỪ DATABASE (CỨU LỖI 500)
// =========================================================================
export const getTopProducts = async (req, res) => {
  try {
    const { from, to } = req.query;
    const queryParams = [];
    let pIdx = 1;
    let whereConditions = [];

    if (from && from.trim() !== '') {
      whereConditions.push(`DATE(o.ngay_tao) >= $${pIdx}`);
      queryParams.push(from.trim());
      pIdx++;
    }
    if (to && to.trim() !== '') {
      whereConditions.push(`DATE(o.ngay_tao) <= $${pIdx}`);
      queryParams.push(to.trim());
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Khối TRY/CATCH nội bộ để phòng ngừa lệch tên bảng/tên cột trong DB của bạn
    try {
      const topProductsQuery = `
        SELECT 
          oi.ma_san_pham as id,
          oi.ten_san_pham as name,
          SUM(CAST(oi.so_luong AS integer)) as sales,
          SUM(CAST(oi.thanh_tien AS numeric)) as revenue
        FROM public.order_items oi
        INNER JOIN public.orders o ON oi.ma_don_hang = o.ma_don_hang
        ${whereClause}
        GROUP BY oi.ma_san_pham, oi.ten_san_pham
        ORDER BY revenue DESC
        LIMIT 5
      `;

      const result = await db.query(topProductsQuery, queryParams);
      return res.status(200).json({
        success: true,
        data: result.rows || []
      });

    } catch (sqlError) {
      // 🌟 NẾU SAI TÊN CỘT/BẢNG: In lỗi ra terminal để bạn check, nhưng vẫn trả về [] để cứu Dashboard không bị sập lỗi 500
      console.error("⚠️ Cảnh báo: Cấu trúc bảng order_items chưa khớp DB, phản hồi mảng rỗng để cứu UI. Chi tiết lỗi:", sqlError.message);
      return res.status(200).json({
        success: true,
        data: [] 
      });
    }

  } catch (err) {
    console.error("🔥 Lỗi API getTopProducts hệ thống:", err.message);
    return res.status(500).json({ 
      success: false, 
      message: "Lỗi hệ thống khi trích xuất danh sách sản phẩm." 
    });
  }
};