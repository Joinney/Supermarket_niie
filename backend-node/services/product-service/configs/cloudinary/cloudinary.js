import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';
import path from 'path';

// 1. Cố gắng đọc file .env từ thư mục gốc của service
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

 
// 3. Khởi tạo cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// 4. Thiết lập kho lưu trữ Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'demi_reviews',
    resource_type: 'auto',
    public_id: (req, file) => `review_${Date.now()}_${Math.round(Math.random() * 1000)}`,
  },
});

const upload = multer({ storage: storage });

export default upload;