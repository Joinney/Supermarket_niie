import db from '../configs/database.js';

/**
 * Hàm tạo đơn hàng với Transaction đảm bảo tính toàn vẹn dữ liệu
 */
export const create = async (userId, data) => {
  const { 
    thong_tin_giao_hang, 
    danh_sach_san_pham, 
    tong_tien_hang, 
    phi_van_chuyen, 
    so_tien_giam_gia, 
    tong_thanh_toan, 
    phuong_thuc_thanh_toan 
  } = data;

  // 1. Khởi tạo mã đơn hàng
  const ma_don_hang = 'DM' + Date.now();
  
  // 2. Lấy client từ pool
  const client = await db.connect(); 

  try {
    await client.query('BEGIN');

    // 3. Chèn dữ liệu vào 'orders'
    // Lưu ý: Nếu cột nguoi_dung_id trong DB là UUID mà bạn truyền vào số 7, 
    // hãy đảm bảo bạn đã sửa cột đó sang VARCHAR hoặc truyền đúng UUID.
    // orderModel.js
const orderQuery = `
  INSERT INTO orders (
    ma_don_hang, nguoi_dung_id, thong_tin_giao_hang, 
    danh_sach_san_pham,  -- <--- PHẢI CÓ CỘT NÀY
    tong_tien_hang, phi_van_chuyen, so_tien_giam_gia, 
    tong_thanh_toan, phuong_thuc_thanh_toan, trang_thai_thanh_toan, trang_thai_don_hang
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) -- <--- CÓ 11 THAM SỐ
  RETURNING id, ma_don_hang;
`;

const orderValues = [
  String(ma_don_hang),
  String(userId),
  typeof thong_tin_giao_hang === 'string' ? thong_tin_giao_hang : JSON.stringify(thong_tin_giao_hang),
  JSON.stringify(danh_sach_san_pham), // <--- PHẢI CÓ DỮ LIỆU NÀY
  Number(tong_tien_hang),
  Number(phi_van_chuyen),
  Number(so_tien_giam_gia),
  Number(tong_thanh_toan),
  String(phuong_thuc_thanh_toan),
  'pending',
  'pending'
];
   const orderRes = await client.query(orderQuery, orderValues);
const newOrderUuid = orderRes.rows[0].id;

    // 4. Chèn chi tiết sản phẩm vào 'order_items'
    // Đảm bảo dữ liệu danh_sach_san_pham là mảng
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
    console.error("❌ Lỗi Database khi tạo đơn hàng:", error.message);
    throw error; // Ném lỗi để controller bắt và trả về 500
  } finally {
    client.release();
  }
};