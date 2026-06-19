import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Plus } from 'lucide-react';

// 🛠️ MOCK DATA: Dữ liệu giả lập chuẩn giao diện theo ảnh mẫu của bạn
const MOCK_RECOMMENDED_PRODUCTS = [
  {
    id: "prod-001",
    ten_san_pham: "Rau Răm 1 bó",
    gia_ban: 15000,
    don_vi_tinh: "bó",
    hinh_anh: "https://images.unsplash.com/photo-1621460245598-a32057d394b9?auto=format&fit=crop&w=400&q=80", // Rau răm giả lập
    ton_kho: 44,
    da_ban: "1K+"
  },
  {
    id: "prod-002",
    ten_san_pham: "Khổ Qua 1-1.3 lb",
    gia_ban: 35000,
    don_vi_tinh: "lb",
    hinh_anh: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=400&q=80", // Khổ qua giả lập
    ton_kho: 12,
    da_ban: "1K+"
  },
  {
    id: "prod-003",
    ten_san_pham: "Giá 12 oz",
    gia_ban: 12000,
    don_vi_tinh: "oz",
    hinh_anh: "https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?auto=format&fit=crop&w=400&q=80", // Giá đỗ giả lập
    ton_kho: 85,
    da_ban: "1K+"
  },
  {
    id: "prod-004",
    ten_san_pham: "Khoai Lang Nhật, Củ Nhỏ 3 lb",
    gia_ban: 79000,
    don_vi_tinh: "lb",
    hinh_anh: "https://images.unsplash.com/photo-1596003906949-67221c37965c?auto=format&fit=crop&w=400&q=80", // Khoai lang giả lập
    ton_kho: 5,
    da_ban: "1K+"
  },
  {
    id: "prod-005",
    ten_san_pham: "Bắp Sú 1 cái",
    gia_ban: 25000,
    don_vi_tinh: "cái",
    hinh_anh: "https://images.unsplash.com/photo-1581074817932-8429dd8b8e8f?auto=format&fit=crop&w=400&q=80", // Bắp cải giả lập
    ton_kho: 0,
    da_ban: "1K+"
  }
];

export default function RecommendedProducts({ currentProduct }) {
  const { country } = useParams();
  const [apiProducts, setApiProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Giả lập độ trễ mạng nhẹ (500ms) để test hiệu ứng skeleton/loading nếu cần
    const timer = setTimeout(() => {
      // Lọc bỏ chính sản phẩm hiện tại đang xem ra khỏi danh sách dữ liệu giả
      const currentId = currentProduct?.ma_san_pham || currentProduct?.id || currentProduct?._id;
      const filtered = MOCK_RECOMMENDED_PRODUCTS.filter(p => p.id !== currentId);
      
      setApiProducts(filtered);
      setLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [currentProduct]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-400 gap-2 text-sm w-full">
        <div className="w-5 h-5 border-2 border-[#006c49] border-t-transparent rounded-full animate-spin"></div>
        <span>Đang tải đề xuất cho bạn...</span>
      </div>
    );
  }

  if (apiProducts.length === 0) return null;

  const currentCountry = country || 'vn';

  return (
    <section className="text-left mt-12 pt-8 border-t border-slate-100 w-full">
      {/* TIÊU ĐỀ KHỐI ĐỀ XUẤT */}
      <h2 className="text-2xl font-semibold text-slate-800 mb-6">
        Đề xuất cho bạn
      </h2>

      {/* LƯỚI GRID Ô VUÔNG LỚN TRẢI NGANG DƯỚI TRANG */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
        {apiProducts.map((prod) => {
          const price = prod.gia_ban || 0;
          const thumbMedia = prod.hinh_anh;
          const productId = prod.id;
          const productName = prod.ten_san_pham;
          const cSlug = "product-recommend"; // Slug mặc định cho sản phẩm giả lập
          const unit = prod.don_vi_tinh;

          return (
            <div key={productId} className="flex flex-col bg-white rounded-3xl p-3 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative group">
              
              {/* Box chứa ảnh vuông lớn */}
              <Link 
                to={`/${currentCountry}/product/${cSlug}/${productId}`}
                className="aspect-square w-full bg-slate-50 rounded-2xl overflow-hidden flex items-center justify-center relative mb-3"
              >
                <img 
                  src={thumbMedia} 
                  alt={productName} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/300x300?text=Demi'; }}
                />
                
                {/* Nút cộng tròn thêm nhanh neo ở góc dưới bên phải ảnh */}
                <Link
                  to={`/${currentCountry}/product/${cSlug}/${productId}`}
                  className="absolute bottom-2 right-2 w-9 h-9 rounded-full border border-blue-100 flex items-center justify-center text-blue-600 bg-white hover:bg-blue-50 transition-all shadow-md z-10"
                >
                  <Plus size={18} strokeWidth={2.5} />
                </Link>
              </Link>

              {/* Phần text thông tin ở dưới ảnh */}
              <div className="flex-1 flex flex-col justify-between space-y-1 px-1">
                <div>
                  {/* Hiển thị giá tiền Việt chuẩn lấy từ Mock Data */}
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-red-600">
                      {price > 0 ? `${price.toLocaleString('vi-VN')}đ` : 'Liên hệ'}
                    </span>
                  </div>
                  
                  {/* Đơn vị tính kèm giá tương đương */}
                  {unit && price > 0 && (
                    <div className="text-xs text-slate-400 font-medium">
                      {price.toLocaleString('vi-VN')}đ/{unit}
                    </div>
                  )}

                  {/* Tên hàng hóa */}
                  <Link 
                    to={`/${currentCountry}/product/${cSlug}/${productId}`}
                    className="block text-sm font-medium text-slate-800 hover:text-[#006c49] line-clamp-2 mt-1 leading-snug min-h-[40px]"
                  >
                    {productName}
                  </Link>
                </div>

                {/* Dòng thông tin phụ: Đã bán / Còn lại */}
                <div className="text-[11px] text-slate-400 pt-1 flex flex-wrap gap-x-2 border-t border-slate-50 mt-1 justify-between">
                  <span>Đã bán {prod.da_ban}</span>
                  {prod.ton_kho > 0 ? (
                    <span className="text-slate-400">Còn lại {prod.ton_kho}</span>
                  ) : (
                    <span className="text-red-500 font-medium">Hết hàng</span>
                  )}
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </section>
  );
}