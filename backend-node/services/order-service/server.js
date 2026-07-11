import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import { fileURLToPath } from 'url';
import path from 'path';
import { createServer } from 'http'; // 🌟 THÊM MỚI: Dùng module http gốc để bọc Express app
import { Server } from 'socket.io'; // 🌟 THÊM MỚI: Thư viện Socket.io Server
import orderRoutes from './routes/orderRoutes.js';
import liveLocationRoutes from './routes/liveLocationRoutes.js'; 
import { connectDB } from './configs/mongo/databasemg.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const httpServer = createServer(app); // 🌟 THÊM MỚI: Tạo Http Server bao Express phục vụ tích hợp Socket.io

// === 🛡️ CẤU HÌNH CORS ĐỒNG BỘ MÔI TRƯỜNG ===
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'https://demimart-fe.onrender.com' 
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS blocked: Origin không được phép truy cập hệ thống!'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// === 🌟 THÊM MỚI: CẤU HÌNH SOCKET.IO ĐỒNG BỘ REALTIME PHÒNG ĐƠN HÀNG LOGISTICS ===
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

io.on('connection', (socket) => {
  // 1. Nhận sự kiện gia nhập phòng theo mã vận đơn khi thiết bị kết nối
  socket.on('join_order_room', (ma_don_hang) => {
    const roomStr = String(ma_don_hang).trim();
    socket.join(roomStr);
    console.log(`📦 [Socket] Thiết bị đã gia nhập phòng đơn hàng: ${roomStr}`);
  });

  // 2. Hứng tọa độ tịnh tiến từ Admin và đồng bộ phát ngay lập tức về phòng đơn hàng cho User nhận
  socket.on('send_truck_location', (data) => {
    if (!data || !data.ma_don_hang) return;
    const roomStr = String(data.ma_don_hang).trim();
    
    // Broadcast dữ liệu cho mọi thiết bị đang mở bản đồ trong cùng room
    io.to(roomStr).emit('send_truck_location', data);
  });

  socket.on('disconnect', () => {
    console.log('🔌 [Socket] Thiết bị ngắt kết nối thực địa.');
  });
});
// =========================================================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// === 📝 CẤU HÌNH SWAGGER ĐỊNH NGHĨA TRỰC TIẾP ===
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Demi Mart - Order Service API (v1)',
      version: '1.0.0',
      description: 'Hệ thống Microservice xử lý tính cước vận chuyển GHN và quản lý trạng thái Đơn hàng.',
    },
    servers: [
      {
        url: 'http://localhost:5005',
        description: 'Kết nối trực tiếp đến Order Service (Cổng 5005)',
      }
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
    paths: {
      '/api/v1/orders/shipping-fee': {
        post: {
          summary: 'Tính cước phí vận chuyển qua GHN',
          description: 'Tiếp nhận thông tin địa chỉ để tính toán phí ship từ hệ thống Giao Hàng Nhanh.',
          tags: ['Orders'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['to_district_id', 'to_ward_code'],
                  properties: {
                    to_district_id: { type: 'integer', example: 1441 },
                    to_ward_code: { type: 'string', example: '21211' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Tính phí vận chuyển thành công' },
            401: { description: 'Không có quyền truy cập' }
          }
        }
      },
      '/api/v1/orders/place-order': {
        post: {
          summary: 'Khởi tạo đặt hàng (Place Order)',
          description: 'Tạo một đơn hàng mới trong trạng thái chờ xử lý, lưu thông tin vận chuyển và các mặt hàng chọn mua.',
          tags: ['Orders'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['to_district_id', 'to_ward_code', 'items'],
                  properties: {
                    to_district_id: { type: 'integer', example: 1441 },
                    to_ward_code: { type: 'string', example: '21211' },
                    items: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          variant_id: { type: 'integer', example: 5 },
                          quantity: { type: 'integer', example: 2 },
                          price: { type: 'number', example: 120000 }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          responses: {
            201: { description: 'Đặt đơn hàng thành công' }
          }
        }
      }
    }
  },
  apis: [], 
};

const swaggerDocs = swaggerJSDoc(swaggerOptions);

const swaggerUiOptions = {
  customCss: '.swagger-ui .topbar { background-color: #006c49; }'
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs, swaggerUiOptions));

// =========================================================================
// 🌟 ĐĂNG KÝ MODULE ROUTE THEO CHUẨN VERSIONING (v1)
// =========================================================================
const v1Router = express.Router();

v1Router.use('/', orderRoutes);
v1Router.use('/shipping', liveLocationRoutes);

app.use('/api/v1', v1Router);
app.use('/api/v1/orders', orderRoutes);
app.use('/orders', liveLocationRoutes); 

app.get('/', (req, res) => {
  res.status(200).send(`
    <div style="text-align: center; margin-top: 50px; font-family: sans-serif; background-color: #f8fafc; padding: 40px; border-radius: 20px; max-width: 600px; margin-left: auto; margin-right: auto; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);">
        <h1 style="color: #006c49; font-size: 2.5rem; margin-bottom: 10px;">Demi Mart Order Service (v1)</h1>
        <p style="color: #64748b; font-size: 1.2rem; margin-bottom: 30px;">Hệ thống Đơn hàng đang hoạt động xanh mướt! 🚀📦</p>
        <div style="margin-top: 20px;">
            <a href="/api-docs" style="background-color: #006c49; color: white; padding: 14px 28px; border-radius: 12px; font-weight: bold; text-decoration: none; box-shadow: 0 4px 14px rgba(0, 108, 73, 0.3); display: inline-block;">Vào Swagger xem API Đơn Hàng →</a>
        </div>
    </div>
  `);
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Order Service is running smoothly on v1' });
});

// =========================================================================
// 🚨 XỬ LÝ LỖI 404 & 500 TẬP TRUNG
// =========================================================================
app.use((req, res) => {
  res.status(404).json({ 
      success: false, 
      message: `Route '${req.originalUrl}' không tồn tại trên Demi Order Service (v1)!` 
  });
});

app.use((err, req, res, next) => {
  console.error(`🔥 LỖI HỆ THỐNG TẠI ROUTE '${req.originalUrl}':`, err);
  res.status(err.status || 500).json({ 
    success: false, 
    message: err.message || 'Internal server error' 
  });
});

const PORT = process.env.PORT || 5005;

// Đảm bảo cài đặt thư viện socket.io cho backend: npm install socket.io
connectDB().then(() => {
  // 🌟 SỬA TẠI ĐÂY: Lắng nghe qua httpServer đã nhúng Socket thay vì dùng app gốc
  httpServer.listen(PORT, '0.0.0.0', () => { 
    console.log(`\n=========================================`);
    console.log(`✅ Order Service Live: http://localhost:${PORT}`);
    console.log(`🔗 API V1 URL:       http://localhost:${PORT}/api/v1`);
    console.log(`📝 Swagger Docs:     http://localhost:${PORT}/api-docs`);
    console.log(`=========================================\n`);
  });
});