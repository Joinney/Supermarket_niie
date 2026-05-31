import db from '../configs/database.js';

/**
 * Hàm tạo đơn hàng với Transaction đảm bảo tính toàn vẹn dữ liệu
 * Đã tích hợp lưu mã đối soát giao dịch PayPal
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
    // 🚀 BỐC THÊM 2 TRƯỜNG NÀY TỪ FRONT-END TRUYỀN XUỐNG VIA CONTROLLER
    paypal_transaction_id,
    paypal_order_id
  } = data;

  // 1. Khởi tạo mã đơn hàng dựa trên thời gian
  const ma_don_hang = 'DM' + Date.now();
  
  // 2. Lấy client từ pool để chạy Transaction
  const client = await db.connect(); 

  try {
    await client.query('BEGIN');

    // 3. Chèn dữ liệu vào 'orders'
    // 🚀 ĐÃ THÊM 2 CỘT: paypal_transaction_id, paypal_order_id (Tổng cộng 13 tham số)
    const orderQuery = `
      INSERT INTO orders (
        ma_don_hang, nguoi_dung_id, thong_tin_giao_hang, 
        danh_sach_san_pham, 
        tong_tien_hang, phi_van_chuyen, so_tien_giam_gia, 
        tong_thanh_toan, phuong_thuc_thanh_toan, trang_thai_thanh_toan, trang_thai_don_hang,
        paypal_transaction_id, paypal_order_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id, ma_don_hang;
    `;

    // 💡 Xác định trạng thái thanh toán dựa trên phương thức
    // Nếu là PayPal thì chuyển thẳng sang trạng thái hoàn tất thành công, ngược lại (COD) là pending
    const trangThaiThanhToan = phuong_thuc_thanh_toan === 'PayPal' ? 'completed' : 'pending';

    const orderValues = [
      String(ma_don_hang),
      String(userId),
      typeof thong_tin_giao_hang === 'string' ? thong_tin_giao_hang : JSON.stringify(thong_tin_giao_hang),
      JSON.stringify(danh_sach_san_pham),
      Number(tong_tien_hang),
      Number(phi_van_chuyen),
      Number(so_tien_giam_gia),
      Number(tong_thanh_toan),
      String(phuong_thuc_thanh_toan),
      trangThaiThanhToan, // 👈 Trạng thái linh động theo cổng thanh toán
      'pending',          // Trạng thái đơn hàng tổng (mới tạo) luôn là pending chờ giao
      paypal_transaction_id ? String(paypal_transaction_id) : null, // 👈 Tham số $12
      paypal_order_id ? String(paypal_order_id) : null              // 👈 Tham số $13
    ];

    const orderRes = await client.query(orderQuery, orderValues);
    const newOrderUuid = orderRes.rows[0].id;

    // 4. Chèn chi tiết sản phẩm vào 'order_items'
    const items = Array.isArray(danh_sach_san_pham) ? danh_sach_san_pham : [];

    const itemQuery = `
      INSERT INTO order_items (order_id, variant_id, quantity, price) 
      VALUES ($1, $2, $3, $4);
    `;

    for (const item of items) {
      await client.query(itemQuery, [
        newOrderUuid, 
        String(item.variant_id || item.variantId), 
        Number(item.quantity), 
        Number(item.price)
      ]);
    }

    await client.query('COMMIT');
    return orderRes.rows[0]; 

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("❌ Lỗi Database khi tạo đơn hàng kèm mã PayPal:", error.message);
    throw error;
  } finally {
    client.release();
  }
};