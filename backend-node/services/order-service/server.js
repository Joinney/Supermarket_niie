import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import { fileURLToPath } from 'url';
import path from 'path';
import orderRoutes from './routes/orderRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

// === 🛡️ CẤU HÌNH CORS ĐÃ ĐƯỢC SỬA ĐỔI DỨT ĐIỂM ===
const allowedOrigins = [
  'http://localhost:5173', // Domain Frontend React (Vite) của bạn
  'http://127.0.0.1:5173',
  'http://localhost:5174'
];

app.use(cors({
  origin: (origin, callback) => {
    // Cho phép các request không có origin (như Postman hoặc Mobile app) 
    // hoặc các origin nằm trong danh sách được định nghĩa
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS blocked: Origin không được phép truy cập hệ thống!'));
    }
  },
  credentials: true, // Chấp nhận gửi kèm Cookie / Token với withCredentials: true ở Frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Xử lý dữ liệu đầu vào
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// === 📝 CẤU HÌNH SWAGGER JSDOC ===
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Demi Mart - Order Service API',
      version: '1.0.0',
      description: 'Hệ thống Microservice xử lý tính cước vận chuyển GHN và quản lý trạng thái Đơn hàng.',
    },
    servers: [
      {
        url: 'http://localhost:5005/api',
        description: 'Kết nối thông qua API Gateway / Cổng 5005',
      }
    ],
  },
  apis: [
    path.resolve(__dirname, './routes/**/*.js'),
    path.resolve(__dirname, './routes/*.js'),
    './routes/*.js',
    './src/routes/*.js'
  ],
};

const swaggerDocs = swaggerJSDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Routes
app.use('/api/orders', orderRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).send(`
    <div style="text-align: center; margin-top: 50px; font-family: sans-serif; background-color: #f8fafc; padding: 40px; border-radius: 20px; max-w: 600px; margin-left: auto; margin-right: auto; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);">
        <h1 style="color: #006c49; font-size: 2.5rem; margin-bottom: 10px;">Demi Mart Order Service</h1>
        <p style="color: #64748b; font-size: 1.2rem; margin-bottom: 30px;">Hệ thống Đơn hàng đang hoạt động xanh mướt! 🚀📦</p>
        <div style="margin-top: 20px;">
            <a href="/api-docs" style="background-color: #006c49; color: white; padding: 14px 28px; border-radius: 12px; font-weight: bold; text-decoration: none; box-shadow: 0 4px 14px rgba(0, 108, 73, 0.3); display: inline-block;">Vào Swagger xem API Đơn Hàng →</a>
        </div>
    </div>
  `);
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Order Service is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// Start server
const PORT = process.env.PORT || 5005;
const server = app.listen(PORT, () => {
  console.log(`\n=========================================`);
  console.log(`✅ Order Service Live: http://localhost:${PORT}`);
  console.log(`📝 Swagger Docs:       http://localhost:${PORT}/api-docs`);
  console.log(`=========================================\n`);
});