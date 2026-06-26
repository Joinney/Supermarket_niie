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
// 🌟 1. XỬ LÝ CORS VÀ PREFLIGHT OPTIONS BẰNG TAY (PHẢI ĐẶT TRÊN CÙNG)
// Đảm bảo đánh chặn request OPTIONS và trả về 200 ngay lập tức, không cho đi tiếp
// =========================================================================
const allowedOrigins = [
    'http://localhost:5173', 
    'https://demimart-fe.onrender.com'
];

app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (!origin || allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin || '*');
    }
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, authorization, content-type, x-requested-with');
    
    // ✅ Nếu là Preflight OPTIONS -> Trả về 200 OK ngay lập tức và kết thúc request tại đây.
    // Việc này ngăn không cho request OPTIONS trống đi xuống bodyParser gây sập Docker.
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Sử dụng thêm cấu hình cors plugin để bọc lót an toàn nâng cao
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(null, false); 
        }
    },
    credentials: true
}));

// =========================================================================
// 🔥 2. ĐẶP TAN LỖI TYPER.TEST BẰNG CUSTOM TYPE FILTER (VÁ LỖI VĨ NH VIỄN)
// Đặt sau CORS để đảm bảo an toàn, chỉ lọc dữ liệu khi request thực sự có Body
// =========================================================================
app.use(bodyParser.json({
    type: (req) => {
        const method = req.method.toUpperCase();
        if (method === 'GET' || method === 'DELETE' || method === 'OPTIONS') {
            return false;
        }
        return true; 
    }
}));

app.use(bodyParser.urlencoded({ extended: true }));

// =========================================================================
// 3. CẤU HÌNH SWAGGER UI DOCS
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
    apis: ['./server.js', './routes/*.js'], 
};

try {
    const specs = swaggerJsdoc(swaggerOptions);
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
} catch (swaggerError) {
    console.error("⚠️ Phớt lờ lỗi Swagger để tránh crash giỏ hàng:", swaggerError.message);
}

// =========================================================================
// 4. LOG DEBUG REQUEST VÀ ĐIỀU HƯỚNG SUB-ROUTES API
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
// 5. KHỞI CHẠY SERVER DỊCH VỤ
// =========================================================================
const PORT = process.env.PORT || 5003;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🛒 Cart Service running on port ${PORT}`);
});