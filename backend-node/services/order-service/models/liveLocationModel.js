import mongoose from 'mongoose';

const LiveLocationSchema = new mongoose.Schema({
  ma_don_hang: { type: String, required: true, unique: true },
  order_id: { type: String, required: true }, 
  current_location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    // 🌟 CHÚ THÍCH CHUẨN: MongoDB GeoJSON bắt buộc phải lưu dạng [Kinh độ lng, Vĩ độ lat]
    coordinates: { type: [Number], required: true } 
  },
  current_station_index: { type: Number, default: 0 },
  // 🌟 THÊM MỚI: Lưu trữ chỉ số tiến trình trục đường OSRM phục vụ chống reset khi load lại trang (F5)
  current_coord_index: { type: Number, default: 0 }, 
  status_text: { type: String, default: "Đang di chuyển" },
  is_truck: { type: Boolean, default: true },
  last_updated: { type: Date, default: Date.now }
});

// Khởi tạo chỉ mục không gian hỗ trợ truy vấn bản đồ địa lý hệ thống Atlas
LiveLocationSchema.index({ current_location: "2dsphere" });

export const LiveLocation = mongoose.model('LiveLocation', LiveLocationSchema, 'live_locations');