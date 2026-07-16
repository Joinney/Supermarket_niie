import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';
import path from 'path';

// 1. Cố gắng đọc file .env từ thư mục gốc của service
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// 🌟 2. CHỐT CHẶN BẢO MẬT (FALLBACK):
// Nếu process.env có dữ liệu thì lấy, nếu Docker lỗi làm mất .env thì dùng key dự phòng.
// Điều này ngắt triệt để lỗi "cloud_name is disabled".
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dm6fqzwhs';
const apiKey = process.env.CLOUDINARY_API_KEY || '975713159799595';
const apiSecret = process.env.CLOUDINARY_API_SECRET || 'xI3ZHkGT_I0wY1SD-66g9LYDMkA';

// 3. Khởi tạo cấu hình Cloudinary
cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret
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