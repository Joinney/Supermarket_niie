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
// 🔥 2. ĐẶP TAN LỖI TYPER.TEST BẰNG CUSTOM TYPE FILTER (VÁ LỖI VĨNH VIỄN)
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
// 4. LOG DEBUG REQUEST VÀ ĐIỀU HƯỚNG SUB-ROUTES API (CHUẨN v1)
// =========================================================================
const v1Router = express.Router();

v1Router.use('/cart', (req, res, next) => {
    console.log(`🚀 [Cart Request]: ${req.method} ${req.originalUrl}`);
    console.log(`📂 Content-Type Header:`, req.headers['content-type'] || 'none');
    next();
}, cartRoutes);

// 🌟 Gắn toàn bộ nhóm API Cart vào tiền tố /api/v1
app.use('/api/v1', v1Router);

// Health Check
app.get('/', (req, res) => {
    res.status(200).send(`
        <div style="text-align: center; margin-top: 50px; font-family: sans-serif; background-color: #f8fafc; padding: 40px; border-radius: 20px;">
            <h1 style="color: #006c49;">Demi Mart Cart Service</h1>
            <p style="color: #64748b;">Hệ thống giỏ hàng đang hoạt động xanh mướt! 🛒🚀</p>
            <div style="margin-top: 20px;">
                <a href="/api-docs" style="background-color: #006c49; color: white; padding: 12px 24px; border-radius: 10px; font-weight: bold; text-decoration: none;">Vào Swagger xem API →</a>
            </div>
        </div>
    `);
});

// =========================================================================
// 5. XỬ LÝ LỖI 404 & 500 (NÂNG CẤP BẮT ORIGINAL URL)
// =========================================================================
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        message: `Route '${req.originalUrl}' không tồn tại trên Demi Cart Service (v1)!` 
    });
});

app.use((err, req, res, next) => {
    console.error(`🔥 LỖI HỆ THỐNG TẠI ROUTE '${req.originalUrl}':`, err);
    res.status(500).json({ 
        success: false, 
        message: "Server giỏ hàng gặp sự cố nhỏ, check log nhé!",
        error: err.message || "Lỗi hệ thống không xác định"
    });
});

// =========================================================================
// 6. KHỞI CHẠY SERVER DỊCH VỤ
// =========================================================================
const PORT = process.env.PORT || 5003;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n=========================================`);
    console.log(`🛒 Cart Service Live: http://localhost:${PORT}`);
    console.log(`📝 Swagger Docs:      http://localhost:${PORT}/api-docs`);
    console.log(`=========================================\n`);
});