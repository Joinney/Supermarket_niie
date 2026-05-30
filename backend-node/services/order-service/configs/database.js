import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  // 1. LUÔN ƯU TIÊN DÒNG NÀY (Trên Render hãy dán Internal Connection String vào biến DATABASE_URL)
  connectionString: process.env.DATABASE_URL,

  // 2. Thông số dự phòng (Nếu DATABASE_URL trống)
  user: process.env.DB_USER || 'supermarket_db_exvs_user',
  host: process.env.DB_HOST || 'dpg-d7lkmvjeo5us73dmsfi0-a.singapore-postgres.render.com', // Đã sửa đuôi chuẩn
  database: process.env.DB_NAME || 'demi_order_db',
  password: process.env.DB_PASSWORD || 'u0tGq1rZG5nb84Ek2siWlqzIDb9W8qO7',
  port: parseInt(process.env.DB_PORT || '5432'),

  // 3. SSL là bắt buộc khi kết nối tới Render DB từ bên ngoài hoặc chạy production
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('connect', () => {
  console.log('✅ [Database]: Đã kết nối thành công tới PostgreSQL!');
});

pool.on('error', (err) => {
  console.error('❌ [Database]: Lỗi kết nối PostgreSQL bất ngờ:', err.message);
});

export default pool;