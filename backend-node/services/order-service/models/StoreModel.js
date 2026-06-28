import mongoose from 'mongoose';

const storeSchema = new mongoose.Schema({
  name: { type: String, required: true },       // Tên chi nhánh siêu thị
  address: { type: String, required: true },    // Địa chỉ dạng chữ
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { 
      type: [Number], 
      required: true  // Định dạng GeoJSON bắt buộc: [Kinh độ Longitude, Vĩ độ Latitude]
    } 
  }
});

// Tạo index không gian để dùng được hàm tìm kiếm $near của MongoDB
storeSchema.index({ location: "2dsphere" });

const Store = mongoose.models.Store || mongoose.model('Store', storeSchema);
export default Store;