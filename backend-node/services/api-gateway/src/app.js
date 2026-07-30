import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import routes from './routes/index.js';

const app = express();

// Chỉ cấu hình CORS, cho phép Frontend gọi vào Gateway
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));

// Ghi log request để dễ debug
app.use(morgan('dev'));

// Gắn các route proxy (Tuyệt đối không để express.json() phía trên dòng này)
app.use('/', routes);

export default app;