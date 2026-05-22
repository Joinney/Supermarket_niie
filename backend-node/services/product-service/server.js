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

// --- 3. Import Routes (PHẢI CÓ .js VÀ ĐÚNG ĐƯỜNG DẪN) ---
import productRoutes from './routes/productRoutes.js'; 

const app = express();

// --- 4. CẤU HÌNH SWAGGER OPTIONS ---
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Demi Mart - Product Service API',
            version: '1.0.0',
            description: 'Tài liệu API quản lý sản phẩm cho Demi Mart',
        },
        servers: [{ url: `http://localhost:${PORT}` }],
    },
    apis: [path.join(__dirname, './routes/*.js')], 
};
const swaggerDocs = swaggerJsdoc(swaggerOptions);

// --- 5. Cấu hình CORS ---
const allowedOrigins = (process.env.FRONTEND_URL || '').split(',').map(url => url.trim());
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            callback(new Error('CORS không cho phép truy cập Product Service!'));
        }
    },
    credentials: true
}));

// --- 6. Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log check request để Demi dễ debug
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] [Product-Service] ${req.method} -> ${req.url}`);
    next();
});

// --- 7. Đăng ký Swagger UI ---
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// --- 8. Đăng ký Route API ---
app.use('/api/products', productRoutes);

// Bổ sung thêm route này để Uptime Kuma ping không bị 404
app.get('/', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Demi Mart - Product Service API is running rực rỡ!'
    });
});
// --- 9. Xử lý lỗi tập trung (Bắt lỗi để server không sập) ---
app.use((err, req, res, next) => {
    console.error('❌ Lỗi Server:', err.stack);
    res.status(500).send('Có lỗi xảy ra trên Product Service!');
});

// --- 10. Khởi chạy server ---
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('===========================================');
    console.log(`📦 PRODUCT SERVICE IS RUNNING RỰC RỠ`);
    console.log(`📡 Port: ${PORT}`);
    console.log(`🔗 API: http://localhost:${PORT}/api/products`);
    console.log(`📝 Swagger: http://localhost:${PORT}/api-docs`);
    console.log('===========================================');
});

// Bắt lỗi nếu cổng bị chiếm hoặc lỗi hệ thống
server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
        console.error(`❌ Cổng ${PORT} đã bị chiếm dụng!`);
    } else {
        console.error('❌ Lỗi hệ thống:', e);
    }
});