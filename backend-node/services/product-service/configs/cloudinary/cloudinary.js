import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

// Kích hoạt dotenv để đọc các biến từ file .env (chỉ cần thiết khi chạy local)
dotenv.config();

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Thiết lập lưu trữ trên Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'demi-mart',
    format: async (req, file) => 'png',
    public_id: (req, file) => `${Date.now()}`,
  },
});

const upload = multer({ storage: storage });

// Sử dụng export default để khớp với cú pháp import trong router
export default upload;
