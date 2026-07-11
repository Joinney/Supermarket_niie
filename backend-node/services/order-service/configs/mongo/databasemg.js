import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI || "mongodb://voduyduydlk_db_user:DemiMart2026@ac-kf1htmb-shard-00-00.kozikg3.mongodb.net:27017,ac-kf1htmb-shard-00-01.kozikg3.mongodb.net:27017,ac-kf1htmb-shard-00-02.kozikg3.mongodb.net:27017/shipping-service?ssl=true&replicaSet=atlas-gwlp8o-shard-0&authSource=admin&appName=DemiMartMGDB";
    
    await mongoose.connect(MONGO_URI);
    console.log("🍃 [ORDER-SERVICE] Kết nối thành công cơ sở dữ liệu MongoDB Atlas (Trụ sở)!");
  } catch (error) {
    console.error("❌ Lỗi kết nối MongoDB:", error.message);
    process.exit(1); // Dừng hệ thống nếu kết nối DB thất bại
  }
};