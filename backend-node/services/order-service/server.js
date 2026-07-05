import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import { fileURLToPath } from 'url';
import path from 'path';
import orderRoutes from './routes/orderRoutes.js';
import { connectDB } from './configs/mongo/databasemg.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

// === 🛡️ CẤU HÌNH CORS ĐỒNG BỘ MÔI TRƯỜNG ===
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'https://demimart-fe.onrender.com' // 🌟 Cấp quyền cho tên miền Frontend chạy trên Render của bạn
];

app.use(cors({
  origin: (origin, callback) => {
    // Cho phép các request không có origin (như Postman hoặc các service gọi nội bộ qua mạng của Render)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS blocked: Origin không được phép truy cập hệ thống!'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // 🌟 Bổ sung PATCH và OPTIONS phòng khi có Preflight Request nâng cao
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 🚀 PHÒNG THỦ CHẮC CHẮN: Đánh chặn và phản hồi trạng thái 200 OK ngay lập tức cho các request OPTIONS 
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// === 📝 CẤU HÌNH SWAGGER ĐỊNH NGHĨA TRỰC TIẾP ===
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
      '/api/orders/shipping-fee': {
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
      '/api/orders/place-order': {
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

// === 🚀 ĐĂNG KÝ CÁC LUỒNG ĐỊNH TUYẾN ===
app.use('/api/orders', orderRoutes);

app.get('/', (req, res) => {
  res.status(200).send(`
    <div style="text-align: center; margin-top: 50px; font-family: sans-serif; background-color: #f8fafc; padding: 40px; border-radius: 20px; max-width: 600px; margin-left: auto; margin-right: auto; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);">
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

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5005;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n=========================================`);
    console.log(`✅ Order Service Live: http://localhost:${PORT}`);
    console.log(`📝 Swagger Docs:       http://localhost:${PORT}/api-docs`);
    console.log(`=========================================\n`);
  });
});