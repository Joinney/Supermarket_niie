// 🌟 BẮT BUỘC ĐẶT DÒNG NÀY TRÊN CÙNG ĐỂ LOAD CHUẨN BIẾN MÔI TRƯỜNG TRONG ES MODULES
import 'dotenv/config'; 

import express from 'express';
import cors from 'cors';
import passport from 'passport';
import cookieParser from 'cookie-parser'; 
import { fileURLToPath } from 'url';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', true);

// IMPORT CÁC CONFIG VÀ ROUTES SAU KHI ENV ĐÃ LOAD XONG
import './configs/Auth/passport.js'; 
import authRoutes from "./routes/authRoutes.js"; 
import forgotRoutes from "./routes/ForgotRoutes.js";
import googleRoutes from './routes/GoogleRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import addressRoutes from './routes/addressRoutes.js';  
import loyaltyRoutes from './routes/loyaltyRoutes.js'; // 👈 ĐÃ BỔ SUNG: Import route Điểm thưởng/Ví Xu

// Import trực tiếp các hàm proxy địa chính từ Controller
import { getProvincesProxy, getDistrictsProxy, getWardsProxy } from './controllers/addressController.js';

// Initialize app and port
const PORT = process.env.PORT_AUTH || process.env.PORT || 5001; 
const BASE_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;

// 2. Cấu hình CORS
const allowedOrigins = [
    process.env.FRONTEND_URL, 
    'http://localhost:5173', 
    'http://127.0.0.1:5173',
    'http://localhost:5174', 
    'http://127.0.0.1:5174',
    'http://localhost:3000',
    'https://demimart-fe.onrender.com',
    'https://authservice-sz4p.onrender.com'
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

app.options('*', cors());

// 3. Bảo mật & Xử lý dữ liệu
app.use(express.json({ limit: '5mb' })); 
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); 
app.use(passport.initialize());

// Cho phép Frontend truy cập ảnh trong thư mục uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// 4. Swagger
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: { 
            title: 'Demi Mart - Auth Service API', 
            version: '1.0.0',
            description: 'Tài liệu hướng dẫn sử dụng API xác thực và Địa chính chính thức của Demi Mart' 
        },
        servers: [
            { 
                url: BASE_URL, 
                description: 'Server hiện tại (Render / Local)' 
            },
            { 
                url: 'https://authservice-sz4p.onrender.com', 
                description: 'Production Server (Render)' 
            },
            { 
                url: `http://localhost:${PORT}`, 
                description: 'Development Server (Local)' 
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                }
            }
        }
    },
    apis: ['./routes/*.js', './src/routes/*.js'], 
};
const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// 5. Health Check
app.get('/', (req, res) => {
    res.status(200).send(`
        <div style="text-align: center; margin-top: 50px; font-family: 'Plus Jakarta Sans', sans-serif; background-color: #f8fafc; padding: 40px; border-radius: 20px;">
            <h1 style="color: #006c49; font-size: 2.5rem;">Demi Mart Auth Service</h1>
            <p style="color: #64748b; font-size: 1.2rem;">Hệ thống đang hoạt động xanh mướt! 🚀</p>
            <div style="margin-top: 20px;">
                <a href="/api-docs" style="background-color: #006c49; color: white; padding: 12px 24px; border-radius: 10px; font-weight: bold; text-decoration: none; box-shadow: 0 4px 6px -1px rgba(0, 108, 73, 0.2);">Vào Swagger xem API →</a>
            </div>
        </div>
    `);
});

// 6. Đăng ký các mạch API
const v1Router = express.Router();

v1Router.use('/auth', authRoutes);
v1Router.use('/auth', forgotRoutes);
v1Router.use('/auth/google', googleRoutes);
v1Router.use('/auth', loyaltyRoutes); // 👈 ĐÃ BỔ SUNG: Chèn chung vào nhánh /auth

v1Router.use('/profile', profileRoutes);

// Hàm địa chính công khai
v1Router.get('/addresses/locations/provinces', getProvincesProxy);
v1Router.get('/addresses/locations/districts', getDistrictsProxy);
v1Router.get('/addresses/locations/wards', getWardsProxy);

v1Router.use('/addresses', addressRoutes);
app.use('/api/v1', v1Router);

// 7. Xử lý lỗi 404 & Lỗi hệ thống
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        message: `Route '${req.originalUrl}' không tồn tại trên Demi Auth Service (v1)!` 
    });
});

app.use((err, req, res, next) => {
    console.error(`🔥 LỖI HỆ THỐNG TẠI ROUTE '${req.originalUrl}':`, err);
    res.status(500).json({ 
        success: false, 
        message: "Server gặp sự cố nhỏ, check log nhé!",
        error: err.message || "Lỗi hệ thống không xác định"
    });
});

// 8. Khởi chạy Server & Socket.io
import { createServer } from 'http';
import { Server } from 'socket.io';

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        credentials: true
    }
});

global._io = io;

io.on('connection', (socket) => {
    socket.on('join_user_room', (userId) => {
        socket.join(`user_room_${userId}`);
    });
});

const server = httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`\n=========================================`);
    console.log(`✅ Auth & Realtime Service Live: ${BASE_URL}`);
    console.log(`📝 Swagger Docs: ${BASE_URL}/api-docs`);
    console.log(`=========================================\n`);
});

process.on('SIGTERM', () => {
    console.log('SIGTERM received: closing server...');
    server.close(() => console.log('Server closed.'));
});