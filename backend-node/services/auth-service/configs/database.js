import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  // 1. LUÔN ƯU TIÊN DÒNG NÀY (Trên Render hãy dán Connection String vào biến DATABASE_URL)
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  // 2. Thông số dự phòng (Nếu DATABASE_URL trống)
  user: process.env.DB_USER || 'postgres.aiesurvlmtrrgdiwxtma',
  host: process.env.DB_HOST || 'aws-1-ap-southeast-1.pooler.supabase.com', 
  database: process.env.DB_NAME || 'demi_auth_db',
  password: process.env.DB_PASSWORD || 'demimart@2026',
  port: parseInt(process.env.DB_PORT || '5432'),

  // 3. SSL là bắt buộc khi kết nối tới Supabase / Render từ bên ngoài
  ssl: {
    rejectUnauthorized: false
  },

  // 🔴 THÊM CÁC THÔNG SỐ CỐT LÕI ĐỂ CHẠY VỚI SUPABASE POOLER TRÊN RENDER:
  max: 10,                        // Giới hạn tối đa 10 connection để tránh làm tràn cổng Supabase Free Tier
  idleTimeoutMillis: 10000,       // Đóng kết nối rỗi sau 10 giây (Rất quan trọng với Supabase Pooler để giải phóng cổng)
  connectionTimeoutMillis: 5000,  // Timeout sau 5 giây nếu mạng lag không kết nối được tới AWS Singapore
  keepAlive: true,                // 🌟 BẮT BUỘC: Giữ kết nối liên tục, tránh bị Supabase ngắt kết nối đột ngột khi đang nhận buffer ảnh
  keepAliveInitialDelayMillis: 10000 // Gửi gói tin ping sau mỗi 10 giây rỗi để duy trì tính thông suốt
});

pool.on('connect', () => {
  console.log('✅ [Database]: Đã kết nối thành công tới Supabase PostgreSQL!');
});

pool.on('error', (err) => {
  console.error('❌ [Database]: Lỗi kết nối PostgreSQL bất ngờ với Supabase:', err.message);
});

export default pool;