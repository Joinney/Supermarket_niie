import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import orderRoutes from './routes/orderRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Cấu hình biến môi trường
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 5005;

// 2. Cấu hình CORS
const allowedOrigins = [
    process.env.FRONTEND_URL, 
    'http://localhost:5173', 
    'http://127.0.0.1:5173',
    'http://localhost:5174'
].filter(Boolean);

app.use(cors({ 
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            callback(new Error(`CORS blocked: Origin ${origin} not allowed by Demi`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 3. Bảo mật & Xử lý dữ liệu
app.use(express.json({ limit: '5mb' })); 
app.use(express.urlencoded({ extended: true }));

// 4. Health Check
app.get('/', (req, res) => {
    res.status(200).send(`
        <div style="text-align: center; margin-top: 50px; font-family: sans-serif; background-color: #f8fafc; padding: 40px; border-radius: 20px;">
            <h1 style="color: #006c49; font-size: 2.5rem;">Demi Mart Order Service</h1>
            <p style="color: #64748b; font-size: 1.2rem;">Hệ thống Đơn hàng đã sẵn sàng! 📦</p>
        </div>
    `);
});

// 5. Đăng ký các mạch API
app.use('/api/orders', orderRoutes);

// 6. Xử lý lỗi 404 & Lỗi hệ thống
app.use((req, res) => {
    res.status(404).json({ success: false, message: "Route này không tồn tại trên Order Service!" });
});

app.use((err, req, res, next) => {
    console.error('🔥 LỖI ORDER SERVICE:', err.message);
    res.status(500).json({ 
        success: false, 
        message: "Server Order gặp sự cố, Demi check log nhé!",
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

// 7. Khởi chạy và Graceful Shutdown
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n=========================================`);
    console.log(`✅ Order Service Live: http://localhost:${PORT}`);
    console.log(`=========================================\n`);
});

process.on('SIGTERM', () => {
    console.log('SIGTERM received: closing server...');
    server.close(() => console.log('Server closed.'));
});