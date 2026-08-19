import mongoose from 'mongoose';
import crypto from 'crypto';
import dotenv from 'dotenv';

// 🌟 Ép gán crypto vào global scope để khắc phục triệt để lỗi môi trường Node.js cũ trong Docker
if (!global.crypto) {
  global.crypto = crypto;
}

dotenv.config();

export const connectDB = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI;

    if (!MONGO_URI) {
      throw new Error("Biến môi trường MONGO_URI chưa được định nghĩa trong file .env!");
    }

    await mongoose.connect(MONGO_URI);
    console.log("🍃 [POSTER-SERVICE] Kết nối thành công cơ sở dữ liệu MongoDB Atlas (Trụ sở)!");
  } catch (error) {
    console.error("❌ Lỗi kết nối MongoDB:", error.message);
    process.exit(1); // Dừng hệ thống nếu kết nối DB thất bại
  }
};