import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { createServer } from 'http';
import { Server } from 'socket.io';

// 🍃 1. IMPORT KẾT NỐI MONGODB ATLAS
import { connectDB } from './configs/mongo/databasemg.js';

// 🌟 2. IMPORT CÁC ROUTE 
import promotionRoutes from './routes/promotionRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import HomeposterRoutes from './routes/HomeposterRoutes.js';
import loyaltyRoutes from './routes/loyaltyRoutes.js'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 3. Cấu hình biến môi trường
const envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: envPath });

// 🍃 KHỞI TẠO KẾT NỐI DATABASE MONGODB ATLAS
connectDB();

const app = express();
app.set('trust proxy', true);

// Tạo HTTP Server và gắn Socket.IO
const httpServer = createServer(app);

// Khởi tạo port
const PORT = process.env.PORT || 5007; 

// =========================================================================
// 🌟 4. CẤU HÌNH CORS ĐỒNG BỘ MÔI TRƯỜNG & CHẶN PREFLIGHT
// =========================================================================
const allowedOrigins = [
    process.env.FRONTEND_URL, 
    'http://localhost:5173', 
    'http://127.0.0.1:5173',
    'https://demimart-fe.onrender.com',  
    'http://127.0.0.1:5174',
    'http://localhost:3000',
    'http://localhost:5000' // Cho phép Gateway kết nối
].filter(Boolean);

app.use(cors({ 
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            callback(new Error(`CORS blocked: Origin ${origin} not allowed`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 🚀 PHÒNG THỦ CHẮC CHẮN: Đánh chặn và phản hồi trạng thái 200 OK ngay cho request OPTIONS
app.options('*', cors());

// =========================================================================
// ⚡ 4.1 CẤU HÌNH REALTIME SOCKET.IO SERVER
// =========================================================================
const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        credentials: true
    }
});

// Lưu trữ đối tượng io vào app để truy cập trong các Controller/Route bằng req.app.get('socketio')
app.set('socketio', io);

io.on('connection', (socket) => {
    console.log(`🔌 Client đã kết nối Socket tới Promotion Service: ${socket.id}`);
    socket.on('disconnect', () => {
        console.log(`❌ Client đã ngắt kết nối Socket: ${socket.id}`);
    });
});

// 5. Bảo mật & Xử lý dữ liệu
app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 6. Swagger - Tài liệu API
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: { 
            title: 'Demi Mart - Promotion & Homeposter Service API (v1)', 
            version: '1.0.0',
            description: 'API Khuyến mãi, Mã giảm giá, Thưởng Tích Lũy và Quản lý Banner/Poster Quảng cáo' 
        },
        servers: [{ url: `http://localhost:${PORT}` }]
    },
    apis: ['./routes/*.js'], 
};
const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// =========================================================================
// 🌟 7. ĐĂNG KÝ MODULE ROUTE THEO CHUẨN VERSIONING (v1)
// =========================================================================
const v1Router = express.Router();

v1Router.use('/promotions', promotionRoutes);
v1Router.use('/coupons', couponRoutes);

v1Router.use('/loyalty', loyaltyRoutes);

// 🖼️ ROUTE QUẢNG CÁO: Khai báo cả 2 tiền tố để tương thích 100% với gọi trực tiếp lẫn qua Gateway
v1Router.use('/homeposters', HomeposterRoutes);
v1Router.use('/promotions/homeposters', HomeposterRoutes);

// Bọc toàn bộ các endpoint vào tiền tố /api/v1
app.use('/api/v1', v1Router);

// 8. Health Check
app.get('/', (req, res) => {
    res.status(200).send(`
        <div style="text-align: center; margin-top: 50px; font-family: 'Plus Jakarta Sans', sans-serif; background-color: #f8fafc; padding: 40px; border-radius: 20px;">
            <h1 style="color: #006c49; font-size: 2.5rem;">Demi Mart Promotion & Homeposter Service (v1)</h1>
            <p style="color: #64748b; font-size: 1.2rem;">Hệ thống Khuyến mãi, Coupon, Tích điểm và Poster Quảng cáo đang hoạt động xanh mướt! 🚀</p>
            <div style="margin-top: 20px;">
                <a href="/api-docs" style="background-color: #006c49; color: white; padding: 12px 24px; border-radius: 10px; font-weight: bold; text-decoration: none; box-shadow: 0 4px 6px -1px rgba(0, 108, 73, 0.2);">Vào Swagger xem API →</a>
            </div>
        </div>
    `);
});

// =========================================================================
// 🚨 9. XỬ LÝ LỖI 404 & 500 TẬP TRUNG
// =========================================================================
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        message: `Route '${req.originalUrl}' không tồn tại trên Demi Promotion Service (v1)!` 
    });
});

app.use((err, req, res, next) => {
    console.error(`🔥 LỖI HỆ THỐNG TẠI ROUTE '${req.originalUrl}':`, err);
    res.status(500).json({ 
        success: false, 
        message: "Lỗi server Promotion Service!",
        error: err.message || "Lỗi hệ thống không xác định"
    });
});

// 10. Khởi chạy Server (sử dụng httpServer thay cho app.listen để chạy cả Socket.io)
httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`\n=========================================`);
    console.log(`✅ Promotion Service Live:       http://localhost:${PORT}`);
    console.log(`🔗 API Homeposter URL:          http://localhost:${PORT}/api/v1/homeposters`);
    console.log(`🔗 API Gateway Homeposter URL:  http://localhost:${PORT}/api/v1/promotions/homeposters`);
    console.log(`🔗 API Promotions URL:          http://localhost:${PORT}/api/v1/promotions`);
    console.log(`🔗 API Coupons URL:             http://localhost:${PORT}/api/v1/coupons`);
    console.log(`🔗 API Loyalty (Điểm Thưởng):   http://localhost:${PORT}/api/v1/loyalty`); // Xác nhận log
    console.log(`📝 Swagger Docs:                http://localhost:${PORT}/api-docs`);
    console.log(`=========================================\n`);
});