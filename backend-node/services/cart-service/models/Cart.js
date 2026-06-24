import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: true, 
    index: true // Đánh index để truy vấn giỏ hàng theo User tốc độ cao
  },
  items: [{
    // --- 1. Nhóm định danh cơ sở ---
    variantId: { type: String, required: true },
    
    // Đổi required sang default chuỗi rỗng để tránh sập bẫy ValidationError với data cũ kẹt cache
    productId: { type: String, default: '' }, 
    
    // --- 2. Nhóm hiển thị giao diện nhanh ---
    name: { type: String, required: true },
    variantName: { type: String, default: '' }, 
    image: { type: String, default: '' },
    
    // --- 3. Nhóm số liệu tính toán ---
    price: { type: Number, required: true, default: 0 },
    quantity: { type: Number, required: true, default: 1 },
    
    // --- 4. Nhóm định tuyến e-commerce quốc tế ---
    categorySlug: { type: String, default: 'san-pham' },
    countryCode: { type: String, default: 'vn' }
  }]
}, {
  timestamps: true // Quản lý thời gian cập nhật giỏ hàng tự động
});

export default mongoose.model('Cart', cartSchema);