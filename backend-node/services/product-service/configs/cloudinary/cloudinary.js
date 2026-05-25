const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'demi-mart', // Bạn có thể đổi thành 'auth' hoặc 'product' để dễ quản lý ảnh
    format: async (req, file) => 'png',
    public_id: (req, file) => `${Date.now()}`,
  },
});

module.exports = multer({ storage: storage });