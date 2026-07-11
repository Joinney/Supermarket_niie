import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import { fileURLToPath } from 'url';
import path from 'path';
import http from 'http'; // 🌟 THÊM MỚI
import { Server } from 'socket.io'; // 🌟 THÊM MỚI
import orderRoutes from './routes/orderRoutes.js';
import { connectDB } from './configs/mongo/databasemg.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const server = http.createServer(app); // 🌟 THÊM MỚI: Tạo HTTP Server bọc Express

// === 🔌 CẤU HÌNH SOCKET.IO SERVER REALTIME HUB ===
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  // Client (User hoặc Admin) tham gia vào phòng riêng của mã đơn hàng
  socket.on('join_order_room', (ma_don_hang) => {
    socket.join(ma_don_hang);
  });

  // Admin liên tục phát dữ liệu di chuyển thực địa chặng xe
  socket.on('send_truck_location', (data) => {
    const { ma_don_hang, coordinates, isArrived, isFullyDelivered, currentStationIndex } = data;
    // Phát quảng bá đồng bộ ngay cho User nằm trong Room đó
    socket.to(ma_don_hang).emit('receive_truck_location', {
      coordinates,
      isArrived,
      isFullyDelivered,
      currentStationIndex,
      updatedAt: new Date()
    });
  });

  socket.on('disconnect', () => {});
});

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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// === 📝 CẤU HÌNH SWAGGER ĐỊNH NGHĨA TRỰC TIẾP (CẬP NHẬT CHUẨN v1) ===
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

// === 🌟 ĐĂNG KÝ MODULE ROUTE THEO CHUẨN VERSIONING (v1) ===
const v1Router = express.Router();
v1Router.use('/', orderRoutes);

app.use('/api/v1', v1Router);
app.use('/api/v1/orders', orderRoutes);

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

// === 🚨 XỬ LÝ LỖI 404 & 500 TẬP TRUNG ===
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

connectDB().then(() => {
  // Thay app.listen thành server.listen để kích hoạt Websocket Hub
  server.listen(PORT, '0.0.0.0', () => { 
    console.log(`\n=========================================`);
    console.log(`✅ Order Service Live + Socket.io Active: http://localhost:${PORT}`);
    console.log(`🔗 API V1 URL:       http://localhost:${PORT}/api/v1`);
    console.log(`📝 Swagger Docs:     http://localhost:${PORT}/api-docs`);
    console.log(`=========================================\n`);
  });
});