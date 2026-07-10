import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from 'passport';
import { fileURLToPath } from 'url';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Cấu hình biến môi trường (Ưu tiên nạp sớm nhất)
const envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: envPath });

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    dotenv.config({ path: path.resolve(__dirname, '../../.env') });
}
const app = express();
app.set('trust proxy', true);
import './configs/Auth/passport.js'; 
import authRoutes from "./routes/authRoutes.js"; 
import forgotRoutes from "./routes/ForgotRoutes.js";
import googleRoutes from './routes/GoogleRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import addressRoutes from './routes/addressRoutes.js';  

// Import trực tiếp các hàm proxy địa chính từ Controller để xử lý cưỡng chế tại tệp gốc
import { getProvincesProxy, getDistrictsProxy, getWardsProxy } from './controllers/addressController.js';

// Initialize app and port
const PORT = process.env.PORT_AUTH || 5001; 

// 2. Cấu hình CORS - Đồng bộ môi trường Production trên Render
const allowedOrigins = [
    process.env.FRONTEND_URL, 
    'http://localhost:5173', 
    'http://127.0.0.1:5173',
    'http://localhost:5174', 
    'http://127.0.0.1:5174',
    'http://localhost:3000',
    'https://demimart-fe.onrender.com' // 🌟 THÊM MỚI: Cấp quyền cho tên miền Frontend chạy trên Render của bạn
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
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // 🌟 ĐỒNG BỘ: Thêm PATCH và OPTIONS phục vụ an toàn định tuyến chéo
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 🚀 PHÒNG THỦ CHẮC CHẮN: Đánh chặn và phản hồi trạng thái 200 OK ngay lập tức cho các request OPTIONS Preflight
app.options('*', cors());

// 3. Bảo mật & Xử lý dữ liệu
app.use(express.json({ limit: '5mb' })); 
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// Cho phép Frontend truy cập ảnh trong thư mục uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// 4. Swagger - Tài liệu API rực rỡ
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
                url: `http://localhost:${PORT}`, 
                description: 'Development Server (Docker)' 
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

// 5. Health Check cho Hệ thống
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

// 6. Đăng ký các mạch API theo chuẩn Versioning (v1)
const v1Router = express.Router();

v1Router.use('/auth', authRoutes);
v1Router.use('/auth', forgotRoutes);
v1Router.use('/auth/google', googleRoutes);

console.log("Đang đăng ký profileRoutes chuẩn v1...");
v1Router.use('/profile', profileRoutes);

// 🎯 HÀM ĐỊA CHÍNH CÔNG KHAI TUYỆT ĐỐI - ĐÓN ĐẦU TRƯỚC TIỀN TỐ TRUNG GIAN
v1Router.get('/addresses/locations/provinces', getProvincesProxy);
v1Router.get('/addresses/locations/districts', getDistrictsProxy);
v1Router.get('/addresses/locations/wards', getWardsProxy);

// Đăng ký mạch quản lý địa chỉ có Token bảo mật
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

// --- 8 KHỞI CHẠY VÀ CONFIG REALTIME CHUẨN SOCKET.IO ---
import { createServer } from 'http';
import { Server } from 'socket.io';

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins, // Tự động đồng bộ cấp quyền cho domain Render của Frontend tại đây
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        credentials: true
    }
});

// Lưu biến toàn cục để Controller ở file khác có thể gọi bắn tín hiệu
global._io = io;

io.on('connection', (socket) => {
    // Cho phép client join vào phòng riêng biệt theo ID của user_id
    socket.on('join_user_room', (userId) => {
        socket.join(`user_room_${userId}`);
    });
});

const server = httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`\n=========================================`);
    console.log(`✅ Auth & Realtime Service Live: http://localhost:${PORT}`);
    console.log(`📝 Swagger Docs:  http://localhost:${PORT}/api-docs`);
    console.log(`=========================================\n`);
});

process.on('SIGTERM', () => {
    console.log('SIGTERM received: closing server...');
    server.close(() => console.log('Server closed.'));
});