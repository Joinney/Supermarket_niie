import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  // 1. LUÔN ƯU TIÊN DÒNG NÀY (Trên Render hãy dán Internal Connection String vào biến DATABASE_URL)
  connectionString: process.env.DATABASE_URL,

  // 2. Thông số dự phòng (Nếu DATABASE_URL trống)
  user: process.env.DB_USER || 'postgres.aiesurvlmtrrgdiwxtma',
  host: process.env.DB_HOST || 'aws-1-ap-southeast-1.pooler.supabase.com', // Đã sửa đuôi chuẩn
  database: process.env.DB_NAME || 'demi_auth_db',
  password: process.env.DB_PASSWORD || 'demimart@2026',
  port: parseInt(process.env.DB_PORT || '5432'),

  // 3. SSL là bắt buộc khi kết nối tới Render DB từ bên ngoài hoặc chạy production
 // ssl: {
  //  rejectUnauthorized: false
  //}
});

pool.on('connect', () => {
  console.log('✅ [Database]: Đã kết nối thành công tới PostgreSQL!');
});

pool.on('error', (err) => {
  console.error('❌ [Database]: Lỗi kết nối PostgreSQL bất ngờ:', err.message);
});

export default pool;