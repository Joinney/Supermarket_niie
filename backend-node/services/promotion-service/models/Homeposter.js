import mongoose from 'mongoose';

const HomeposterSchema = new mongoose.Schema(
  {
    heroBanner: {
      titleMain: { type: String, default: 'Chợ Việt Nam & Châu Á' },
      titleHighlight: { type: String, default: 'trực tuyến lớn nhất Mỹ' },
      offerBadge: { type: String, default: '🚚 Giao hàng miễn phí cho 5 đơn đầu tiên' },
      offerSub: { type: String, default: '*Giá trị tối thiểu $35, thay đổi theo từng khu vực' },
      giftBadgeValue: { type: String, default: '$25' },
      giftBadgeText: { type: String, default: 'Trị giá*' },
      truckImage: { type: String, default: 'https://res.cloudinary.com/dm6fqzwhs/image/upload/v1781632779/Screenshot_2026-06-17_005741_zlraht.png' },
      // 🌟 ĐÃ BỔ SUNG TRƯỜNG qrImage ĐỂ LƯU VÀO DATABASE MONGO
      qrImage: { type: String, default: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://demimart.com/app' },
      qrText: { type: String, default: 'Quét mã để tải app' },
      appReviewCount: { type: String, default: 'Hơn 1 triệu lượt review' }
    },

    categoryBanners: [
      {
        id: { type: Number },
        tag: String,
        title: String,
        subtitle: String,
        image: String,
        gradient: String,
        btnColor: String,
        imageOnly: { type: Boolean, default: false },
        showButton: { type: Boolean, default: true }
      }
    ],

    ebtList: [
      {
        id: { type: Number },
        useBannerImage: { type: Boolean, default: false },
        bannerImageUrl: String,
        title: String,
        subtitle: String,
        note: String
      }
    ],

    catInterval: { type: Number, default: 4 },
    catAutoPlay: { type: Boolean, default: true },
    ebtInterval: { type: Number, default: 5 },
    ebtAutoPlay: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model('Homeposter', HomeposterSchema);