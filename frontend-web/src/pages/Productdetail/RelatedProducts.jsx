import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Plus } from 'lucide-react';

// 🛠️ MOCK DATA: Dữ liệu sản phẩm liên quan giả lập chuẩn cấu trúc Việt Nam
const MOCK_RELATED_PRODUCTS = [
  {
    ma_san_pham: "prod-101",
    ten_san_pham: "Đậu Hũ Non Hộp",
    gia_ban: 15000,
    don_vi_tinh: "hộp",
    hinh_anh: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80"
  },
  {
    ma_san_pham: "prod-102",
    ten_san_pham: "Mì Chay Lá Bồ Đề",
    gia_ban: 6000,
    don_vi_tinh: "gói",
    hinh_anh: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=400&q=80"
  },
  {
    ma_san_pham: "prod-103",
    ten_san_pham: "Cháo Gấu Đỏ Thịt Gà",
    gia_ban: 5500,
    don_vi_tinh: "gói",
    hinh_anh: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=400&q=80"
  },
  {
    ma_san_pham: "prod-104",
    ten_san_pham: "Chả Lụa Chay",
    gia_ban: 45000,
    don_vi_tinh: "đòn",
    hinh_anh: "https://images.unsplash.com/photo-1608897013039-887f21d8c804?auto=format&fit=crop&w=400&q=80"
  },
  {
    ma_san_pham: "prod-105",
    ten_san_pham: "Ruốc Nấm Hương Chay",
    gia_ban: 38000,
    don_vi_tinh: "hũ",
    hinh_anh: "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=400&q=80"
  }
];

export default function RelatedProducts({ currentProduct }) {
  const { country } = useParams();
  const [apiProducts, setApiProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Tạo hiệu ứng trễ loading nhẹ (300ms) để giao diện mượt mà
    const timer = setTimeout(() => {
      const currentId = currentProduct?.ma_san_pham || currentProduct?.id || currentProduct?._id;
      
      // Lọc bỏ chính sản phẩm hiện tại đang xem ra khỏi mảng dữ liệu giả
      const filtered = MOCK_RELATED_PRODUCTS.filter(p => p.ma_san_pham !== currentId);
      
      setApiProducts(filtered);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [currentProduct]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 text-slate-400 gap-2 text-xs">
        <div className="w-4 h-4 border-2 border-[#006c49] border-t-transparent rounded-full animate-spin"></div>
        <span>Đang tải sản phẩm liên quan...</span>
      </div>
    );
  }

  if (apiProducts.length === 0) return null;

  const currentCountry = country || 'vn';
  const cSlug = currentProduct?.slug_danh_muc || 'product';

  return (
    <section className="text-left">
      {/* 1. TIÊU ĐỀ & NÚT XEM THÊM THEO CHUẨN MẪU */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-medium text-slate-700">
          Sản phẩm liên quan
        </h2>
        <Link 
          to={`/${currentCountry}/category/${cSlug}`} 
          className="text-sm font-medium text-blue-600 bg-blue-50/60 px-4 py-1.5 rounded-full hover:bg-blue-100 transition-colors"
        >
          Xem thêm
        </Link>
      </div>

      {/* 2. KHỐI GIAO DIỆN HÀNG DỌC MINI */}
      <div className="space-y-4">
        {apiProducts.map((prod) => {
          const price = prod.gia_ban || 0;
          const thumbMedia = prod.hinh_anh;
          const productId = prod.ma_san_pham;
          const productName = prod.ten_san_pham;
          const unit = prod.don_vi_tinh;

          return (
            <div key={productId} className="flex items-center gap-4 py-1 group">
              
              {/* Thumbnail sản phẩm */}
              <Link 
                to={`/${currentCountry}/product/${cSlug}/${productId}`}
                className="w-20 h-20 bg-slate-50 rounded-2xl overflow-hidden flex-shrink-0 border border-slate-100 flex items-center justify-center"
              >
                <img 
                  src={thumbMedia} 
                  alt={productName} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => { 
                    e.target.onerror = null; 
                    e.target.src = 'https://placehold.co/150x150?text=Demi'; 
                  }}
                />
              </Link>

              {/* Tên hàng hóa và giá tiền */}
              <div className="flex-1 min-w-0 space-y-1">
                <Link 
                  to={`/${currentCountry}/product/${cSlug}/${productId}`}
                  className="block text-base font-normal text-slate-800 hover:text-[#006c49] line-clamp-2 leading-snug"
                >
                  {productName}
                </Link>
                <div className="flex flex-col">
                  {/* Hiển thị chuẩn giá trị số giả lập dạng tiền Việt */}
                  <span className="text-lg font-bold text-red-600">
                    {price > 0 ? `${price.toLocaleString('vi-VN')}đ` : 'Liên hệ'}
                  </span>
                  
                  {unit && price > 0 && (
                    <span className="text-xs text-slate-400">
                      {price.toLocaleString('vi-VN')}đ/{unit}
                    </span>
                  )}
                </div>
              </div>

              {/* Nút tròn dấu cộng thêm nhanh */}
              <Link
                to={`/${currentCountry}/product/${cSlug}/${productId}`}
                className="w-9 h-9 rounded-full border border-blue-100 flex items-center justify-center text-blue-600 bg-white hover:bg-blue-50 transition-all shadow-sm flex-shrink-0"
              >
                <Plus size={18} strokeWidth={2.5} />
              </Link>

            </div>
          );
        })}
      </div>
    </section>
  );
}