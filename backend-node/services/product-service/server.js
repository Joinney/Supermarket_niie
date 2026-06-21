import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
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
import productRoutes from './routes/productRoutes.js';
import chatbotRoutes from './routes/chatbotRoutes.js'; 
import { schedulePeriodicDescriptionGeneration } from './controllers/productController.js'; 

const app = express();

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
    apis: ['./server.js', './routes/productRoutes.js', './routes/chatbotRoutes.js'], 
};
const swaggerDocs = swaggerJsdoc(swaggerOptions);

// --- 5. Cấu hình CORS ---
// 🛠️ ĐÃ TỐI ƯU: Thêm trực tiếp địa chỉ local vào mảng fallback phòng hờ file .env chưa nhận diện kịp
const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    ...((process.env.FRONTEND_URL || '').split(',').map(url => url.trim()).filter(Boolean))
];

app.use(cors({
    origin: (origin, callback) => {
        // Chấp nhận request không có origin (như Postman/Mobile app) hoặc nằm trong danh sách được phép
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

// Log check request để dễ debug
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] [Product-Service] ${req.method} -> ${req.url}`);
    next();
});

// --- 7. Đăng ký Swagger UI ---
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// BỔ SUNG: Endpoint phụ để phục vụ kiểm tra JSON thô nếu giao diện UI gặp trục trặc thụt lề JSDoc
app.get('/api-docs-json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(swaggerDocs);
});

// --- 8. Đăng ký Route API ---
app.use('/api/products', productRoutes);
app.use('/api/chatbot', chatbotRoutes); 

// Bổ sung thêm route này để Uptime Kuma ping không bị 404
app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`
        <div style="text-align: center; margin-top: 50px; font-family: 'Plus Jakarta Sans', sans-serif; background-color: #f8fafc; padding: 40px; border-radius: 20px;">
            <h1 style="color: #006c49; font-size: 2.5rem;">Demi Mart Product & AI Service</h1>
            <p style="color: #64748b; font-size: 1.2rem;">Hệ thống đang hoạt động xanh mướt! 🚀</p>
            <div style="margin-top: 20px;">
                <a href="/api-docs" style="background-color: #006c49; color: white; padding: 12px 24px; border-radius: 10px; font-weight: bold; text-decoration: none; box-shadow: 0 4px 6px -1px rgba(0, 108, 73, 0.2);">Vào Swagger xem API →</a>
            </div>
        </div>
    `);
});

// --- 9. Xử lý lỗi tập trung (Bắt lỗi để server không sập) ---
app.use((err, req, res, next) => {
    console.error('❌ Lỗi Server:', err.stack);
    res.status(500).send('Có lỗi xảy ra trên Product Service!');
});

// --- 10. Khởi chạy server ---
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('===========================================');
    console.log(`📦 PRODUCT & CHATBOT SERVICE IS RUNNING`);
    console.log(`📡 Port: ${PORT}`);
    console.log(`🔗 API Products: http://localhost:${PORT}/api/products`);
    console.log(`🔗 API Chatbot:  http://localhost:${PORT}/api/chatbot`);
    console.log(`📝 Swagger:      http://localhost:${PORT}/api-docs`);
    console.log('===========================================');
    
    // Start periodic description generation scheduler
    schedulePeriodicDescriptionGeneration();
});

// Bắt lỗi nếu cổng bị chiếm hoặc lỗi hệ thống
server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
        console.error(`❌ Cổng ${PORT} đã bị chiếm dụng!`);
    } else {
        console.error('❌ Lỗi hệ thống:', e);
    }
});