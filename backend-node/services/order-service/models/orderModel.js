const db = require('../configs/database');
const Order = {
  create: async (userId, data) => {
    const { 
      thong_tin_giao_hang, danh_sach_san_pham, tong_tien_hang, 
      phi_van_chuyen, so_tien_giam_gia, tong_thanh_toan, phuong_thuc_thanh_toan 
    } = data;

    // Chú ý tên bảng là 'don_hang'
    const query = `
      INSERT INTO orders (
        nguoi_dung_id, thong_tin_giao_hang, danh_sach_san_pham, 
        tong_tien_hang, phi_van_chuyen, so_tien_giam_gia, 
        tong_thanh_toan, phuong_thuc_thanh_toan
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING ma_don_hang, id
    `;
    
    const values = [
      userId, 
      JSON.stringify(thong_tin_giao_hang), 
      JSON.stringify(danh_sach_san_pham),
      tong_tien_hang, 
      phi_van_chuyen, 
      so_tien_giam_gia, 
      tong_thanh_toan, 
      phuong_thuc_thanh_toan
    ];

    const res = await db.query(query, values);
    return res.rows[0]; 
  }
};