import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const baseConfig = {
  user: process.env.DB_USER || 'postgres.aiesurvlmtrrgdiwxtma',
  host: process.env.DB_HOST || 'aws-1-ap-southeast-1.pooler.supabase.com', 
  password: process.env.DB_PASSWORD || 'demimart@2026',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: { rejectUnauthorized: false },
  max: 5, // Mỗi pool phụ chỉ cần tối đa 5 connection để tiết kiệm cổng Supabase
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000
};

// 1. Connection Pool mặc định cho Auth (demi_auth_db)
const pool = new Pool({
  ...baseConfig,
  connectionString: process.env.DATABASE_URL, // Luôn ưu tiên chuỗi kết nối từ Render nếu có
  database: process.env.DB_NAME || 'demi_auth_db',
  max: 10
});

// 2. 🌟 Connection Pool phụ kết nối sang demi_order_db để lấy đơn hàng
export const orderPool = new Pool({
  ...baseConfig,
  database: 'demi_order_db'
});

// 3. 🌟 Connection Pool phụ kết nối sang demi_payment_db để lấy thanh toán
export const paymentPool = new Pool({
  ...baseConfig,
  database: 'demi_payment_db'
});

pool.on('connect', () => console.log('✅ [Database Auth]: Kết nối thành công tới demi_auth_db!'));
orderPool.on('connect', () => console.log('📦 [Database Order]: Kết nối thành công tới demi_order_db!'));
paymentPool.on('connect', () => console.log('💳 [Database Payment]: Kết nối thành công tới demi_payment_db!'));

export default pool;