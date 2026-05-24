// configs/database.js
import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        console.log("DEBUG: Đang kết nối với URI:", process.env.MONGO_URI); // Thêm dòng này để xem nó lấy gì
        await mongoose.connect(process.env.MONGO_URI, {
            family: 4,
            serverSelectionTimeoutMS: 30000 
        });
        console.log('✅ Cart Service kết nối thành công!');
    } catch (err) {
        console.error('❌ Lỗi kết nối MongoDB:', err.message);
    }
};

export default connectDB;