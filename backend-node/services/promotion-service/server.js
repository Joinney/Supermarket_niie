import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import promotionRoutes from './routes/promotionRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Cấu hình biến môi trường
const envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: envPath });

const app = express();
app.set('trust proxy', true);

// Khởi tạo port
const PORT = process.env.PORT || 5007; 

// 2. Cấu hình CORS
const allowedOrigins = [
    process.env.FRONTEND_URL, 
    'http://localhost:5173', 
    'http://127.0.0.1:5173',
    'https://demimart-fe.onrender.com', 
    'http://127.0.0.1:5174',
    'http://localhost:3000'
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
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 3. Bảo mật & Xử lý dữ liệu
app.use(express.json({ limit: '5mb' })); 
app.use(express.urlencoded({ extended: true }));

// 4. Swagger - Tài liệu API
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: { 
            title: 'Demi Mart - Promotion Service', 
            version: '1.0.0',
            description: 'API Khuyến mãi' 
        },
        servers: [{ url: `http://localhost:${PORT}` }]
    },
    apis: ['./routes/*.js'], 
};
const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.use('/api/promotions', promotionRoutes);

// 5. Health Check
app.get('/', (req, res) => {
    res.status(200).send(`
        <div style="text-align: center; margin-top: 50px; font-family: 'Plus Jakarta Sans', sans-serif; background-color: #f8fafc; padding: 40px; border-radius: 20px;">
            <h1 style="color: #006c49; font-size: 2.5rem;">Demi Mart Promotion Service</h1>
            <p style="color: #64748b; font-size: 1.2rem;">Hệ thống Khuyến mãi đang hoạt động xanh mướt! 🚀</p>
            <div style="margin-top: 20px;">
                <a href="/api-docs" style="background-color: #006c49; color: white; padding: 12px 24px; border-radius: 10px; font-weight: bold; text-decoration: none; box-shadow: 0 4px 6px -1px rgba(0, 108, 73, 0.2);">Vào Swagger xem API →</a>
            </div>
        </div>
    `);
});

// 6. Xử lý lỗi 404 & 500
app.use((req, res) => {
    res.status(404).json({ success: false, message: "Route không tồn tại trên Promotion Service!" });
});

app.use((err, req, res, next) => {
    console.error('🔥 LỖI HỆ THỐNG:', err);
    res.status(500).json({ success: false, message: "Lỗi server!" });
});

// 7. Khởi chạy Server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n✅ Promotion Service Live: http://localhost:${PORT}`);
    console.log(`📝 Swagger Docs:  http://localhost:${PORT}/api-docs\n`);
});