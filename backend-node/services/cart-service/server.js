import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import connectDB from './configs/database.js';
import cartRoutes from './routes/cartRoutes.js';

dotenv.config();
connectDB();

const app = express();

// --- 1. Middleware cơ bản ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- 2. Cấu hình CORS chuẩn ---
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

// --- 3. Cấu hình Swagger (ĐÃ FIX LỖI CRASH) ---
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
    // 🚀 SỬA TẠI ĐÂY: Trỏ trực tiếp vào chính file server.js 
    // Không cho phép hệ thống quét tự động vào thư mục routes để triệt tiêu YAMLSemanticError kẹt cache
    apis: ['./server.js'], 
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerJsdoc(swaggerOptions)));

// --- 4. Routes ---
app.use('/api/cart', cartRoutes);

app.get('/', (req, res) => {
    res.send('<h1>Demi Mart Cart Service is running!</h1>');
});

app.use((req, res) => {
    res.status(404).json({ message: "Endpoint not found" });
});

// --- 5. Khởi chạy Server ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🛒 Cart Service running on port ${PORT}`);
});