import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import connectDB from './configs/database.js';
import cartRoutes from './routes/cartRoutes.js';

dotenv.config();
connectDB();

const app = express();

// 1. Cấu hình CORS linh hoạt
const allowedOrigins = [
  'http://localhost:5173', 
  'https://demimart-fr.onrender.com' // Domain của Frontend trên Render
];

app.use(cors({
    origin: function (origin, callback) {
        // Cho phép request không có origin (như từ Postman, curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 2. Cấu hình Swagger linh hoạt cho cả Local và Production
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
    apis: ['./routes/*.js'], 
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 3. Routes
app.use('/api/cart', cartRoutes);

app.get('/', (req, res) => {
    res.send('<h1>Demi Mart Cart Service is running!</h1>');
});

// 4. Khởi chạy Server
const PORT = process.env.PORT || 5003;
app.listen(PORT, () => {
    console.log(`🛒 Cart Service running on port ${PORT}`);
    console.log(`📚 Swagger Docs available at http://localhost:${PORT}/api-docs`);
});