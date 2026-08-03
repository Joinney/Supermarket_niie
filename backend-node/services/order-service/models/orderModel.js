import db from '../configs/database.js';

/**
 * Hàm tạo đơn hàng với Transaction đảm bảo tính toàn vẹn dữ liệu
 * Đã tích hợp cột address_id, mã đối soát giao dịch PayPal và xử lý ép kiểu an toàn
 */
export const create = async (userId, data) => {
  const { 
    address_id,                 // 👈 Bổ sung nhận address_id từ data
    thong_tin_giao_hang, 
    danh_sach_san_pham, 
    tong_tien_hang, 
    phi_van_chuyen, 
    so_tien_giam_gia, 
    tong_thanh_toan, 
    phuong_thuc_thanh_toan,
    paypal_transaction_id,
    paypal_order_id,
    to_district_id, 
    to_ward_code,
    to_lat, to_lng, 
    tong_khoang_cach_km, 
    thoi_gian_du_kien_phut,
    trang_thai_don_hang 
  } = data;

  // 1. Khởi tạo mã đơn hàng dựa trên thời gian thực địa (Unique timestamp)
  const ma_don_hang = 'DM' + Date.now() + Math.floor(Math.random() * 1000);
  
  // 2. Khai báo biến client trước khối try để phạm vi biến (scope) bao quát được finally
  let client; 

  try {
    // Lấy client từ pool để chạy Transaction độc lập
    client = await db.connect(); 
    
    await client.query('BEGIN');

    // 3. Chèn dữ liệu vào bảng 'orders' (Đã bổ sung cột address_id và thêm $3)
    const orderQuery = `
      INSERT INTO orders (
        ma_don_hang, 
        user_id,             
        address_id,          -- 👈 Đã thêm cột address_id
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
        paypal_order_id,
        to_lat, 
        to_lng, 
        tong_khoang_cach_km, 
        thoi_gian_du_kien_phut
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING id, ma_don_hang;
    `;

    // Xác định trạng thái thanh toán linh hoạt dựa trên cổng tích hợp
    let trangThaiThanhToan = 'pending';
    if (phuong_thuc_thanh_toan === 'PayPal' || phuong_thuc_thanh_toan === 'VNPay_Success') {
      trangThaiThanhToan = 'completed';
    }

    // Kiểm tra định dạng thong_tin_giao_hang (Luôn chuyển sang chuỗi JSON nếu frontend gửi dạng object)
    const normalizedShippingInfo = typeof thong_tin_giao_hang === 'object' 
      ? JSON.stringify(thong_tin_giao_hang) 
      : String(thong_tin_giao_hang || '{}');

    // Khởi tạo mảng danh sách sản phẩm an toàn định dạng mảng cho Postgres xử lý vòng lặp
    const normalizedProductList = Array.isArray(danh_sach_san_pham) ? danh_sach_san_pham : [];

    const orderValues = [
      String(ma_don_hang),                                        // $1: ma_don_hang
      userId,                                                     // $2: user_id
      address_id ? Number(address_id) : null,                     // $3: address_id (Đã bổ sung ép kiểu số an toàn)
      Number(to_district_id || 2194),                             // $4: to_district_id
      String(to_ward_code || "220713"),                           // $5: to_ward_code
      Number(tong_tien_hang || 0),                                // $6: tong_tien_hang
      Number(phi_van_chuyen || 0),                                // $7: phi_van_chuyen
      Number(so_tien_giam_gia || 0),                              // $8: so_tien_giam_gia
      Number(tong_thanh_toan || 0),                               // $9: tong_thanh_toan
      String(phuong_thuc_thanh_toan || 'COD'),                    // $10: phuong_thuc_thanh_toan
      trangThaiThanhToan,                                         // $11: trang_thai_thanh_toan
      String(trang_thai_don_hang || 'Chờ xác nhận'),              // $12: trang_thai_don_hang
      paypal_transaction_id ? String(paypal_transaction_id) : null, // $13: paypal_transaction_id
      paypal_order_id ? String(paypal_order_id) : null,           // $14: paypal_order_id
      to_lat ? parseFloat(to_lat) : null,                         // $15: to_lat
      to_lng ? parseFloat(to_lng) : null,                         // $16: to_lng
      Number(tong_khoang_cach_km || 0),                           // $17: tong_khoang_cach_km
      Number(thoi_gian_du_kien_phut || 0)                         // $18: thoi_gian_du_kien_phut
    ];

    const orderRes = await client.query(orderQuery, orderValues);
    const newOrderUuid = orderRes.rows[0].id;

    // 4. Chèn chi tiết từng sản phẩm vào bảng liên kết phụ 'order_items' với đầy đủ thông tin Snapshot
    if (normalizedProductList.length > 0) {
      const itemQuery = `
        INSERT INTO order_items (order_id, variant_id, quantity, price, product_name, variant_name, image_url, ma_san_pham, sku) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
      `;

      for (const item of normalizedProductList) {
        const variantId = item.variant_id || item.variantId;
        if (variantId) {
          await client.query(itemQuery, [
            newOrderUuid, 
            String(variantId), 
            Number(item.quantity || 1), 
            Number(item.price || 0),
            item.product_name ? String(item.product_name) : null,
            item.variant_name ? String(item.variant_name) : null,
            item.image_url ? String(item.image_url) : null,
            item.ma_san_pham ? String(item.ma_san_pham) : null,
            item.sku ? String(item.sku) : null
          ]);
        }
      }
    }

    // 5. Xác nhận lưu dữ liệu thành công hoàn toàn
    await client.query('COMMIT');
    return orderRes.rows[0]; 

  } catch (error) {
    // 6. Hoàn tác dữ liệu (Rollback) lập tức nếu có bất kỳ lỗi xung đột nào xảy ra ngầm
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error("❌ Lỗi Database chi tiết khi thực thi Transaction:", {
      message: error.message,
      detail: error.detail,
      hint: error.hint
    });
    throw error;
  } finally {
    // Chỉ giải phóng khi kết nối client thực sự tồn tại, chống lỗi sập app lãng phí
    if (client) {
      client.release();
    }
  }
};

/**
 * Lấy toàn bộ danh sách đơn hàng của 1 User kèm chi tiết từng món hàng bên trong
 */
export const getByUserId = async (userId) => {
  // 1. Lấy danh sách các đơn hàng gốc
  const query = `SELECT * FROM orders WHERE user_id = $1 ORDER BY id DESC;`;
  const res = await db.query(query, [userId]);
  const orders = res.rows;

  // 2. Lặp nhanh qua từng đơn để bốc các sản phẩm (order_items) nhét vào mảng items
  for (let order of orders) {
    const itemRes = await db.query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
    order.items = itemRes.rows;
  }
  
  return orders;
};