import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER || 'postgres.aiesurvlmtrrgdiwxtma',
  host: process.env.DB_HOST || 'aws-1-ap-southeast-1.pooler.supabase.com',
  database: process.env.DB_NAME || 'demi_promotions_db',
  password: process.env.DB_PASSWORD || 'demimart@2026',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: {
    rejectUnauthorized: false 
  }
});

pool.on('connect', () => {
  console.log('✅ [Database]: Đã kết nối thành công tới SUPABASE (Promotion DB)!');
});

pool.on('error', (err) => {
  console.error('❌ [Database]: Lỗi kết nối SUPABASE (Promotion DB):', err.message);
});

export default pool;