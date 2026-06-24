import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import bodyParser from 'body-parser';

import connectDB from './configs/database.js';
import cartRoutes from './routes/cartRoutes.js';

dotenv.config();
connectDB();

const app = express();

// =========================================================================
// --- 1. Cấu hình CORS kết nối Frontend Demi Mart ---
// =========================================================================
const allowedOrigins = [
    'http://localhost:5173', 
    'https://demimart-fe.onrender.com'
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(null, false); 
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// =========================================================================
// 🔥 2. ĐẬP TAN LỖI TYPER.TEST BẰNG CUSTOM TYPE FILTER (VÁ LỖI VĨNH VIỄN)
// Chặn body-parser tự động quét Header của các request không có body (GET, DELETE)
// =========================================================================
app.use(bodyParser.json({
    type: (req) => {
        const method = req.method.toUpperCase();
        // Nếu là GET hoặc DELETE -> Dứt khoát KHÔNG parse JSON (Tránh chạm vào type-is gây sập)
        if (method === 'GET' || method === 'DELETE') {
            return false;
        }
        // Đối với POST/PUT/PATCH -> Cho phép parse bình thường để nhận diện req.body
        return true; 
    }
}));

app.use(bodyParser.urlencoded({ extended: true }));

// =========================================================================
// --- 3. Cấu hình Swagger Docs ---
// =========================================================================
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Demi Mart - Cart Service API',
            version: '1.0.0',
            description: 'API quản lý giỏ hàng của Demi Mart',
        },
        servers: [
            { url: 'http://localhost:5003', description: 'Development Server' },
            { url: 'https://cartservice-i6s1.onrender.com', description: 'Production Server' }
        ],
    },
    apis: ['./server.js'], 
};

try {
    const specs = swaggerJsdoc(swaggerOptions);
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
} catch (swaggerError) {
    console.error("⚠️ Phớt lờ lỗi Swagger để tránh crash giỏ hàng:", swaggerError.message);
}

// =========================================================================
// --- 4. Log Debug Request trước khi vào Sub-Routes ---
// =========================================================================
app.use('/api/cart', (req, res, next) => {
    console.log(`🚀 [Cart Request]: ${req.method} ${req.originalUrl}`);
    console.log(`📂 Content-Type Header:`, req.headers['content-type'] || 'none');
    next();
}, cartRoutes);

app.get('/', (req, res) => {
    res.send('<h1>Demi Mart Cart Service is running!</h1>');
});

app.use((req, res) => {
    res.status(404).json({ message: "Endpoint not found" });
});

// =========================================================================
// --- 5. Khởi chạy Server dịch vụ ---
// =========================================================================
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🛒 Cart Service running on port ${PORT}`);
});