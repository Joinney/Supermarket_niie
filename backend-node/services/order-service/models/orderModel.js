import db from '../configs/database.js';

/**
 * Hàm tạo đơn hàng với Transaction đảm bảo tính toàn vẹn dữ liệu
 * Đã tích hợp lưu mã đối soát giao dịch PayPal và xử lý ép kiểu an toàn
 */
export const create = async (userId, data) => {
  const { 
    thong_tin_giao_hang, 
    danh_sach_san_pham, 
    tong_tien_hang, 
    phi_van_chuyen, 
    so_tien_giam_gia, 
    tong_thanh_toan, 
    phuong_thuc_thanh_toan,
    paypal_transaction_id,
    paypal_order_id,
    to_district_id, // Bóc tách trực tiếp để tái sử dụng an toàn
    to_ward_code
  } = data;

  // 1. Khởi tạo mã đơn hàng dựa trên thời gian
  const ma_don_hang = 'DM' + Date.now();
  
  // 2. Lấy client từ pool để chạy Transaction độc lập
  const client = await db.connect(); 

  try {
    await client.query('BEGIN');

    // 3. Chèn dữ liệu vào bảng 'orders'
    const orderQuery = `
      INSERT INTO orders (
        ma_don_hang, 
        user_id,             
        to_district_id, 
        to_ward_code,
        tong_tien_hang, 
        phi_van_chuyen, 
        so_tien_giam_gia, 
        tong_thanh_toan, 
        phuong_thuc_thanh_toan, 
        trang_thai_thanh_toan, 
        trang_thai_don_hang,
        paypal_transaction_id, 
        paypal_order_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id, ma_don_hang;
    `;

    // Xác định trạng thái thanh toán linh hoạt
    let trangThaiThanhToan = 'pending';
    if (phuong_thuc_thanh_toan === 'PayPal' || phuong_thuc_thanh_toan === 'VNPay_Success') {
      trangThaiThanhToan = 'completed';
    }

    // Kiểm tra định dạng thong_tin_giao_hang (Luôn chuyển sang chuỗi JSON nếu frontend gửi dạng object)
    const normalizedShippingInfo = typeof thong_tin_giao_hang === 'object' 
      ? JSON.stringify(thong_tin_giao_hang) 
      : String(thong_tin_giao_hang || '{}');

    // Khởi tạo mảng danh sách sản phẩm an toàn định dạng JSON cho Postgres
    const normalizedProductList = Array.isArray(danh_sach_san_pham) ? danh_sach_san_pham : [];

    // ✅ ĐÃ XOÁ CHỮ "JavaScript" THỪA GÂY LỖI REFERENCEERROR
    const orderValues = [
      String(ma_don_hang),
      userId,                                      // Đảm bảo map trúng vào cột $2 (user_id)
      Number(to_district_id || 2194),              // Đã fix lỗi đọc biến trực tiếp
      String(to_ward_code || "220713"), 
      Number(tong_tien_hang || 0),
      Number(phi_van_chuyen || 0),
      Number(so_tien_giam_gia || 0),
      Number(tong_thanh_toan || 0),
      String(phuong_thuc_thanh_toan || 'COD'),
      trangThaiThanhToan,
      'pending',
      paypal_transaction_id ? String(paypal_transaction_id) : null,
      paypal_order_id ? String(paypal_order_id) : null
    ];

    const orderRes = await client.query(orderQuery, orderValues);
    const newOrderUuid = orderRes.rows[0].id;

    // 4. Chèn chi tiết từng sản phẩm vào bảng liên kết phụ 'order_items'
    if (normalizedProductList.length > 0) {
      const itemQuery = `
        INSERT INTO order_items (order_id, variant_id, quantity, price) 
        VALUES ($1, $2, $3, $4);
      `;

      for (const item of normalizedProductList) {
        const variantId = item.variant_id || item.variantId;
        if (variantId) {
          await client.query(itemQuery, [
            newOrderUuid, 
            String(variantId), 
            Number(item.quantity || 1), 
            Number(item.price || 0)
          ]);
        }
      }
    }

    // 5. Xác nhận lưu dữ liệu thành công hoàn toàn
    await client.query('COMMIT');
    return orderRes.rows[0]; 

  } catch (error) {
    // 6. Hoàn tác dữ liệu (Rollback) lập tức nếu có bất kỳ lỗi xung đột nào xảy ra ngầm
    await client.query('ROLLBACK');
    console.error("❌ Lỗi Database chi tiết khi thực thi Transaction:", {
      message: error.message,
      detail: error.detail,
      hint: error.hint
    });
    throw error;
  } finally {
    // 🔴 LUÔN LUÔN GIẢI PHÓNG KẾT NỐI
    client.release();
  }
};