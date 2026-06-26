import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: true, 
    index: true 
  },
  items: [{
    variantId: { type: String, required: true },
    productId: { type: String, default: '' }, 
    name: { type: String, required: true },
    variantName: { type: String, default: '' }, 
    image: { type: String, default: '' },
    price: { type: Number, required: true, default: 0 },
    quantity: { type: Number, required: true, default: 1 },
    categorySlug: { type: String, default: 'san-pham' },
    countryCode: { type: String, default: 'vn' },

    // 🚀 BỔ SUNG CẤU TRÚC ĐỂ LƯU VÀO DATABASE MONGODB
    ten_don_vi: { type: String, default: 'Gói' },
    thuoc_tinh_hop_nhat: [{
      ten_thuoc_tinh: { type: String },
      gia_tri: { type: String }
    }]
  }]
}, {
  timestamps: true 
});

export default mongoose.model('Cart', cartSchema);