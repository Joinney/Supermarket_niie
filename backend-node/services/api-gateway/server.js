import app from './src/app.js';
import dotenv from 'dotenv';
import { EventEmitter } from 'events';
EventEmitter.defaultMaxListeners = 50;
dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🚀 [API GATEWAY] Đang chạy tại cổng ${PORT}`);
    console.log(`🔗 Cổng vào duy nhất: http://localhost:${PORT}`);
    console.log(`=========================================`);
});