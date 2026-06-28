import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI || "mongodb://phannguyenbaomy0609_db_user:5IhfSgHHPp6asvbF@ac-4tzt1fb-shard-00-00.mfgvpbg.mongodb.net:27017,ac-4tzt1fb-shard-00-01.mfgvpbg.mongodb.net:27017,ac-4tzt1fb-shard-00-02.mfgvpbg.mongodb.net:27017/supermarket_db?replicaSet=atlas-hoo88e-shard-0&ssl=true&authSource=admin";
    
    await mongoose.connect(MONGO_URI);
    console.log("🍃 [ORDER-SERVICE] Kết nối thành công cơ sở dữ liệu MongoDB Atlas (Trụ sở)!");
  } catch (error) {
    console.error("❌ Lỗi kết nối MongoDB:", error.message);
    process.exit(1); // Dừng hệ thống nếu kết nối DB thất bại
  }
};