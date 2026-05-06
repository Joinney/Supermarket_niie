import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import os from 'os';
import path from 'path';
import session from 'express-session';
import passport from 'passport';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';

// 1. IMPORT SWAGGER LIBRARIES
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

dotenv.config();

// --- IMPORT ROUTES ---
import './configs/Auth/passport.js'; 
import authRoutes from "./routes/Auth/authRoutes.js"; 
import forgotRoutes from "./routes/Auth/ForgotRoutes.js";
import googleRoutes from './routes/GoogleRoutes.js';
import profileRoutes from "./routes/User/profileRoutes.js"; 
import addressRoutes from './routes/User/addressRoutes.js';
import productRoutes from './routes/Product/productRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000; 

// --- 2. CẤU HÌNH SWAGGER OPTIONS ---
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Demi Mart API Documentation',
            version: '1.0.0',
            description: 'Tài liệu API chính thức cho dự án Ecommerce Supermarket - Demi Mart',
            contact: {
                name: 'Demi',
            },
        },
        servers: [
            {
                // Tự động nhận diện URL backend từ .env hoặc dùng localhost
                url: process.env.BACKEND_URL || `http://localhost:${PORT}`,
                description: process.env.NODE_ENV === 'production' ? 'Production Server' : 'Local Server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    },
    // Đường dẫn để Swagger quét các chú thích @swagger trong thư mục routes
    apis: ['./routes/**/*.js', './server.js'], 
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

// --- TỰ ĐỘNG TẠO THƯ MỤC UPLOADS ---
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 1. CẤU HÌNH CORS
const rawFrontendUrl = process.env.FRONTEND_URL || '';
const allowedOrigins = rawFrontendUrl.split(',').map(url => url.trim());

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || !process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            callback(new Error('Chính sách CORS không cho phép truy cập từ nguồn này.'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 2. MIDDLEWARE CƠ BẢN
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 
app.use(cookieParser()); 

// 3. CẤU HÌNH SESSION
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: { 
        secure: process.env.NODE_ENV === 'production', 
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000 
    }
}));

// 4. KHỞI TẠO PASSPORT
app.use(passport.initialize());
app.use(passport.session());

// --- 3. ĐĂNG KÝ ROUTE SWAGGER UI ---
// Truy cập: http://localhost:5000/api-docs để xem tài liệu
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// 5. LOGGING DEBUG
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} -> ${req.url}`);
    next();
});

// 6. CẤU HÌNH FILE TĨNH
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// --- 7. ĐĂNG KÝ CÁC ROUTE API ---
app.use('/api/profile', profileRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/auth', forgotRoutes);
app.use('/api/auth', googleRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/products', productRoutes);

// 8. XỬ LÝ SPA & 404 API
app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
        return res.status(404).json({ message: "API endpoint không tồn tại!" });
    }
    // Bỏ qua nếu là yêu cầu đến swagger
    if (req.url.startsWith('/api-docs')) return next();
    
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 9. KHỞI CHẠY SERVER
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server đang rực rỡ tại port: ${PORT}`);
    console.log(`📝 Swagger UI: http://localhost:${PORT}/api-docs`);
    if (process.env.NODE_ENV !== 'production') {
        const ip = getLocalIp();
        console.log(`📱 Local IP Swagger: http://${ip}:${PORT}/api-docs`);
    }
});

function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) return iface.address;
        }
    }
    return 'localhost';
}