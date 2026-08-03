import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: true, 
    index: true 
  },
  items: [{
    variantId: { type: String, required: true },
    sku: { type: String, default: '' }, 
    productId: { type: String, default: '' }, 
    name: { type: String, required: true },
    variantName: { type: String, default: '' }, 
    image: { type: String, default: '' },
    price: { type: Number, required: true, default: 0 },
    quantity: { type: Number, required: true, default: 1 },
    
    // 🌟 ĐÃ BỔ SUNG: Khai báo trường stock để MongoDB chịu lưu lại tồn kho!
    stock: { type: Number, default: 9999 },

    categorySlug: { type: String, default: 'san-pham' },
    countryCode: { type: String, default: 'vn' },

    // 🚀 BỔ SUNG CẤU TRÚC EAV ĐỂ LƯU VÀO DATABASE MONGODB
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