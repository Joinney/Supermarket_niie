import React, { useState, useEffect } from "react";
import { Package, HeartOff, ExternalLink, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { productApi } from "../../../api/axios"; 
import { useStore } from "../../../context/StoreContext";

export default function Tabdathich() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { currentStore, formatPrice } = useStore();
  const country = String(currentStore?.code || "vn").toLowerCase();

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      // Gọi lên API mới vừa viết ở Backend
      const res = await productApi.get('/products/favorites/me'); 
      if (res.data?.success) {
        setFavorites(res.data.data);
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách yêu thích:", error);
    } finally {
      setLoading(false);
    }
  };

  // Nút bỏ yêu thích
  const handleUnlike = async (ma_san_pham) => {
    // 1. Optimistic Update (Xoá ngay khỏi màn hình để UI phản hồi siêu nhanh)
    const previousFavorites = [...favorites];
    setFavorites(favorites.filter(item => item.ma_san_pham !== ma_san_pham));

    try {
      // 2. Gửi request huỷ thích xuống backend (Tái sử dụng API Toggle bạn đã làm)
      const res = await productApi.post(`/products/${ma_san_pham}/likes`, { trang_thai: false });
      if (!res.data?.success) {
        setFavorites(previousFavorites); // Hoàn tác nếu API lỗi
      }
    } catch (error) {
      console.error("Lỗi khi bỏ thích:", error);
      setFavorites(previousFavorites); 
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-[#006c49] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[#006c49] font-black uppercase tracking-widest text-[10px] animate-pulse">Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-400 bg-white border border-slate-100 rounded-3xl shadow-sm">
        <div className="bg-slate-50 p-6 rounded-full text-slate-300">
          <HeartOff size={48} strokeWidth={1.5} />
        </div>
        <p className="text-sm font-bold uppercase tracking-widest text-center mt-2 text-slate-500">
          Bạn chưa yêu thích sản phẩm nào
        </p>
        <Link 
          to={`/${country}`} 
          className="mt-2 flex items-center gap-2 bg-[#006c49] text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-[#005a3c] transition-colors shadow-lg active:scale-95"
        >
          <ShoppingBag size={14} /> Bắt đầu mua sắm
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between border-b border-slate-100 pb-4">
        <h2 className="text-lg lg:text-xl font-black text-[#1a1a1a] uppercase tracking-wider italic">
          Sản phẩm yêu thích
        </h2>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-full">
          {favorites.length} Mục
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
        {favorites.map((item) => (
          <div 
            key={item.ma_san_pham} 
            className="bg-white border border-slate-100 rounded-[20px] p-3 flex gap-4 hover:shadow-xl hover:border-slate-200 transition-all group"
          >
            {/* Ảnh sản phẩm */}
            <Link 
              to={`/${country}/product/${item.slug_danh_muc || 'san-pham'}/${item.ma_san_pham}`} 
              className="w-24 h-24 lg:w-28 lg:h-28 flex-shrink-0 bg-[#f9f9f9] rounded-xl overflow-hidden relative flex items-center justify-center border border-slate-50"
            >
              <img 
                src={item.hinh_anh_chinh || "https://placehold.co/300x300?text=Demi+Mart"} 
                alt={item.ten_san_pham} 
                className="w-[85%] h-[85%] object-cover mix-blend-multiply transition-transform duration-500 group-hover:scale-110" 
              />
            </Link>
            
            {/* Thông tin sản phẩm */}
            <div className="flex flex-col flex-1 justify-between py-1 pr-1">
              <Link to={`/${country}/product/${item.slug_danh_muc || 'san-pham'}/${item.ma_san_pham}`}>
                <h3 className="font-bold text-slate-800 text-[13px] leading-tight line-clamp-2 hover:text-[#006c49] transition-colors uppercase">
                  {item.ten_san_pham}
                </h3>
                <p className="text-[#006c49] font-black text-lg mt-1 tracking-tighter">
                  {formatPrice(Number(item.gia_ban_thap_nhat || 0))}
                </p>
              </Link>
              
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-50">
                <Link 
                  to={`/${country}/product/${item.slug_danh_muc || 'san-pham'}/${item.ma_san_pham}`} 
                  className="text-[9px] font-black text-slate-400 hover:text-[#006c49] flex items-center gap-1.5 uppercase tracking-widest transition-colors"
                >
                  <ExternalLink size={12} strokeWidth={2.5} /> Xem chi tiết
                </Link>

                <button 
                  onClick={() => handleUnlike(item.ma_san_pham)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-90"
                  title="Xoá khỏi danh sách"
                >
                  <HeartOff size={14} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}