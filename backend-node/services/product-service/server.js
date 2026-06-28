import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http'; // BỔ SUNG: Import http để chạy chung với Socket
import { Server } from 'socket.io'; // BỔ SUNG: Import Socket.io
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
const httpServer = http.createServer(app); // BỔ SUNG: Tạo server HTTP bọc lấy app Express
const io = new Server(httpServer, {       // BỔ SUNG: Khởi tạo Socket.io trên server này
    cors: {
        origin: "*", // Chấp nhận mọi kết nối socket (có thể tinh chỉnh lại bảo mật sau)
        methods: ["GET", "POST"]
    }
});

// --- 4. CẤU HÌNH SWAGGER OPTIONS ---
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Demi Mart - Product & Chatbot Service API',
            version: '1.0.0',
            description: 'Tài liệu API quản lý sản phẩm và trợ lý ảo AI cho Demi Mart',
        },
        servers: [{ url: `http://localhost:${PORT}` }],
    },
    apis: ['./server.js', './routes/productRoutes.js', './routes/chatbotRoutes.js', './routes/categoryRoutes.js', './routes/unitRoutes.js', './routes/nationRoutes.js'], 
};
const swaggerDocs = swaggerJsdoc(swaggerOptions);

// --- 5. Cấu hình CORS ---
const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
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
    credentials: true
}));

// --- 6. Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// BỔ SUNG QUAN TRỌNG: Gắn io vào req để các controller có thể sử dụng (req.io.emit)
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Log check request để dễ debug
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] [Product-Service] ${req.method} -> ${req.url}`);
    next();
});

// --- 7. Đăng ký Swagger UI ---
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.get('/api-docs-json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(swaggerDocs);
});

// --- 8. Đăng ký Route API ---
app.use('/api/nations', nationalRoutes);
app.use('/api/products/units', unitRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/chatbot', chatbotRoutes); 

app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`
        <div style="text-align: center; margin-top: 50px; font-family: 'Plus Jakarta Sans', sans-serif; background-color: #f8fafc; padding: 40px; border-radius: 20px;">
            <h1 style="color: #006c49; font-size: 2.5rem;">Demi Mart Product & AI Service</h1>
            <p style="color: #64748b; font-size: 1.2rem;">Hệ thống đang hoạt động xanh mướt! 🚀</p>
        </div>
    `);
});

// --- 9. Xử lý lỗi tập trung ---
app.use((err, req, res, next) => {
    console.error('❌ Lỗi Server:', err.stack);
    res.status(500).send('Có lỗi xảy ra trên Product Service!');
});

// --- LẮNG NGHE KẾT NỐI SOCKET ---
io.on('connection', (socket) => {
    console.log(`🔗 [Socket] Client đã kết nối: ${socket.id}`);
    
    socket.on('disconnect', () => {
        console.log(`❌ [Socket] Client ngắt kết nối: ${socket.id}`);
    });
});

// --- 10. Khởi chạy server ---
// SỬA ĐỔI QUAN TRỌNG: Phải dùng httpServer.listen thay vì app.listen
httpServer.listen(PORT, '0.0.0.0', () => {
    console.log('===========================================');
    console.log(`📦 PRODUCT, CHATBOT & SOCKET SERVICE IS RUNNING`);
    console.log(`📡 Port: ${PORT}`);
    console.log(`🔗 API Products: http://localhost:${PORT}/api/products`);
    console.log(`🔗 API Nations:  http://localhost:${PORT}/api/nations`);
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