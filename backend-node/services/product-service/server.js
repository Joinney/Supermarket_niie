import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { Server } from 'socket.io';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

// --- 1. Cấu hình ES Module ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 2. Nạp biến môi trường ---
dotenv.config(); 
dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true });

const PORT = process.env.PORT_PRODUCT || 5002;

// --- 3. Import Routes ---
import nationalRoutes from './routes/nationalRoutes.js';
import unitRoutes from './routes/unitRoutes.js';
import productRoutes from './routes/productRoutes.js';
import chatbotRoutes from './routes/chatbotRoutes.js'; 
import categoryRoutes from './routes/categoryRoutes.js';
import { schedulePeriodicDescriptionGeneration } from './controllers/productController.js'; 

// --- KHỞI TẠO APP & SERVER SOCKET ---
const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Chấp nhận mọi kết nối socket (có thể tinh chỉnh lại bảo mật sau)
        methods: ["GET", "POST"]
    }
});

// --- 4. CẤU HÌNH SWAGGER OPTIONS (CẬP NHẬT v1) ---
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Demi Mart - Product & Chatbot Service API (v1)',
            version: '1.0.0',
            description: 'Tài liệu API quản lý sản phẩm và trợ lý ảo AI cho Demi Mart',
        },
        servers: [{ url: `http://localhost:${PORT}` }],
    },
    apis: ['./server.js', './routes/productRoutes.js', './routes/chatbotRoutes.js', './routes/categoryRoutes.js', './routes/unitRoutes.js', './routes/nationRoutes.js'], 
};
const swaggerDocs = swaggerJsdoc(swaggerOptions);

// --- 5. Cấu hình CORS Đồng bộ hệ thống ---
const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://demimart-fe.onrender.com', // Cấp quyền cho domain render
    ...((process.env.FRONTEND_URL || '').split(',').map(url => url.trim()).filter(Boolean))
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || !process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            console.error(`[CORS Blocked] Origin từ chối: ${origin}`);
            callback(new Error('CORS không cho phép truy cập Product Service!'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // 🌟 ĐỒNG BỘ BẢO MẬT
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));


// --- 6. Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Gắn io vào req để các controller có thể sử dụng (req.io.emit)
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Log check request (Nâng cấp thêm originalUrl để dễ debug với v1)
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] [Product-Service] ${req.method} -> ${req.originalUrl}`);
    next();
});

// --- 7. Đăng ký Swagger UI ---
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.get('/api-docs-json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(swaggerDocs);
});

// =========================================================================
// 🌟 8. ĐĂNG KÝ MODULE ROUTE THEO CHUẨN VERSIONING (v1)
// =========================================================================
const v1Router = express.Router();

v1Router.use('/nations', nationalRoutes);
v1Router.use('/products/units', unitRoutes);
v1Router.use('/products', productRoutes);
v1Router.use('/categories', categoryRoutes);
v1Router.use('/chatbot', chatbotRoutes);

// Bọc toàn bộ vào /api/v1
app.use('/api/v1', v1Router);

app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`
        <div style="text-align: center; margin-top: 50px; font-family: sans-serif; background-color: #f8fafc; padding: 40px; border-radius: 20px;">
            <h1 style="color: #006c49; font-size: 2.5rem;">Demi Mart Product & AI Service (v1)</h1>
            <p style="color: #64748b; font-size: 1.2rem;">Hệ thống đang hoạt động xanh mướt! 🚀</p>
            <div style="margin-top: 20px;">
                <a href="/api-docs" style="background-color: #006c49; color: white; padding: 12px 24px; border-radius: 10px; font-weight: bold; text-decoration: none;">Vào Swagger xem API →</a>
            </div>
        </div>
    `);
});

// =========================================================================
// 🚨 9. XỬ LÝ LỖI 404 & 500 TẬP TRUNG (Nâng cấp)
// =========================================================================
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        message: `Route '${req.originalUrl}' không tồn tại trên Demi Product Service (v1)!` 
    });
});

app.use((err, req, res, next) => {
    console.error(`❌ Lỗi Server tại Route '${req.originalUrl}':`, err.stack);
    res.status(500).json({ 
        success: false, 
        message: "Server Sản phẩm gặp sự cố nhỏ, check log nhé!",
        error: err.message || "Lỗi hệ thống không xác định"
    });
});

// --- LẮNG NGHE KẾT NỐI SOCKET ---
io.on('connection', (socket) => {
    console.log(`🔗 [Socket] Client đã kết nối: ${socket.id}`);
    
    socket.on('disconnect', () => {
        console.log(`❌ [Socket] Client ngắt kết nối: ${socket.id}`);
    });
});

// --- 10. Khởi chạy server ---
httpServer.listen(PORT, '0.0.0.0', () => {
    console.log('===========================================');
    console.log(`📦 PRODUCT, CHATBOT & SOCKET SERVICE IS RUNNING`);
    console.log(`📡 Port: ${PORT}`);
    console.log(`🔗 API Products: http://localhost:${PORT}/api/v1/products`);
    console.log(`🔗 API Nations:  http://localhost:${PORT}/api/v1/nations`);
    console.log('===========================================');
    
    schedulePeriodicDescriptionGeneration();
});

// Bắt lỗi nếu cổng bị chiếm
httpServer.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
        console.error(`❌ Cổng ${PORT} đã bị chiếm dụng!`);
    } else {
        console.error('❌ Lỗi hệ thống:', e);
    }
});