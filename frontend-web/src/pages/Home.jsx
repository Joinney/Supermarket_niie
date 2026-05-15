import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ArrowRight, Star, QrCode, Plus, Zap, AlertCircle } from 'lucide-react';

/**
 * --- COMPONENT CON: THẺ SẢN PHẨM ---
 */
const ProductCard = ({ p }) => {
  // 1. Logic lấy ảnh: Ưu tiên ảnh chính
  const mainImage = p.media?.find(m => m.la_anh_chinh)?.duong_dan_url 
                 || p.media?.[0]?.duong_dan_url 
                 || "https://via.placeholder.com/300";

  // 2. Lấy thông tin giá từ biến thể đầu tiên
  const variant = p.bien_the?.[0];
  const currentPrice = variant?.gia_khuyen_mai || variant?.gia_ban_le || 0;
  const originalPrice = variant?.gia_khuyen_mai ? variant?.gia_ban_le : null;

  // 3. CHUẨN HÓA DỮ LIỆU URL (Mới)
  // Lấy country_code và slug_danh_muc từ API (đã được JOIN trong SQL)
  // Nếu dữ liệu null, sử dụng giá trị mặc định để tránh lỗi vỡ Link
  const country = p.country_code || 'vn'; 
  const category = p.slug_danh_muc || 'san-pham';

  return (
    // CẬP NHẬT: URL theo cấu trúc /:country/product/:category/:id
    <Link to={`/${country}/product/${category}/${p.ma_san_pham}`} className="flex-shrink-0">
      <div className="w-[170px] md:w-[210px] group cursor-pointer font-sans bg-white p-2 rounded-[32px] hover:shadow-2xl hover:shadow-slate-100 transition-all duration-500 border border-transparent hover:border-slate-50">
        <div className="relative aspect-square bg-[#f8fafc] rounded-[24px] overflow-hidden mb-3 border border-slate-50 group-hover:border-[#e6f0ed] transition-all">
          {variant?.la_ban_chay && (
            <span className="absolute top-0 left-0 bg-[#ff4d4f] text-white text-[9px] font-black px-2 py-1 rounded-br-xl z-10 uppercase tracking-wider shadow-sm">
              HOT
            </span>
          )}
          <img 
            src={mainImage} 
            loading="lazy"
            className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition duration-500 p-4" 
            alt={p.ten_san_pham} 
          />
          <button 
            className="absolute bottom-3 right-3 w-9 h-9 bg-white border border-slate-100 rounded-xl flex items-center justify-center shadow-lg text-[#006c49] hover:bg-[#006c49] hover:text-white transition-all transform active:scale-90 z-20"
            onClick={(e) => {
              e.preventDefault();
              // Logic thêm vào giỏ hàng
            }}
          >
            <Plus size={20} strokeWidth={3} />
          </button>
        </div>
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-[#ff4d4f] font-black text-lg leading-none">
              {Number(currentPrice).toLocaleString()}đ
            </span>
            {originalPrice && (
              <span className="text-slate-400 text-[10px] line-through font-bold">
                {Number(originalPrice).toLocaleString()}đ
              </span>
            )}
          </div>
          <p className="text-[13px] text-[#161b22] leading-tight line-clamp-2 h-8 font-bold group-hover:text-[#006c49] transition-colors">
            {p.ten_san_pham}
          </p>
          <div className="flex gap-1 items-center pt-0.5">
            <span className="bg-red-50 text-[#ff4d4f] text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Giá hời</span>
            <span className="bg-[#e6f0ed] text-[#006c49] text-[8px] font-black px-1.5 py-0.5 rounded uppercase">
              {p.ten_danh_muc || 'Siêu thị'}
            </span>
          </div>
          <p className="text-[9px] text-slate-400 font-black mt-1 uppercase tracking-widest">
            KHO: {variant?.so_luong_kho || 0}
          </p>
        </div>
      </div>
    </Link>
  );
};

/**
 * --- COMPONENT CHÍNH ---
 */
export default function Home() {
  const [apiProducts, setApiProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Sử dụng biến môi trường hoặc mặc định localhost 5000
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';

   const fetchProducts = async () => {
      try {
        setLoading(true);
        // SỬA DÒNG NÀY: Bỏ đoạn "/all-products" đi vì API của Demi chỉ là /api/products
        const response = await fetch(`${API_BASE_URL}/api/products?limit=12`);
        
        if (!response.ok) throw new Error("Không thể kết nối đến máy chủ Demi Mart");
        
        const data = await response.json();
        setApiProducts(data);
        setError(null);
      } catch (err) {
        console.error("Lỗi API:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
}, []);

  return (
    <div className="space-y-12 pb-20 bg-white font-sans pt-[10px]">
      
      {/* 1. HERO SECTION */}
      <div className="px-6 md:px-10 pt-4 flex flex-col md:flex-row items-start justify-between gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 bg-[#e6f0ed] text-[#006c49] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
            <Zap size={14} fill="currentColor" className="text-[#fea619]" /> Online 24/7
          </div>
          <h1 className="text-4xl md:text-[56px] font-black text-[#161b22] tracking-tighter leading-[0.95] text-left">
            Siêu thị trực tuyến <br/> hàng đầu <span className="text-[#006c49] italic">Á Châu</span>
          </h1>
        </div>
        
        <div className="hidden xl:flex items-center gap-5 bg-[#f8fafc] p-5 rounded-[32px] border border-slate-100 shadow-sm transition-all hover:shadow-md cursor-pointer group scale-90">
           <div className="w-14 h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-[#006c49] shadow-inner group-hover:rotate-6 transition-transform">
              <QrCode size={36} strokeWidth={1.5} />
           </div>
           <div className="space-y-0.5 text-left">
              <p className="text-[14px] font-black text-[#161b22] uppercase tracking-tight">Tải App Demi Mart</p>
              <div className="flex gap-0.5 text-[#fea619]">
                {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
              </div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Hơn 1.2 Triệu Review</p>
           </div>
        </div>
      </div>

      {/* 2. KHUYẾN MÃI LỚN */}
      <div className="px-6 md:px-10 flex gap-5 overflow-x-auto scrollbar-hide pb-2">
        <div className="min-w-[340px] flex-1 h-[260px] bg-[#ffecf1] rounded-[40px] p-8 relative overflow-hidden flex flex-col justify-between border border-pink-100 shadow-sm group cursor-pointer transition-all hover:shadow-lg">
            <div className="relative z-10">
              <span className="bg-[#ff4d6d] text-white text-[10px] font-black px-3 py-1 rounded-lg shadow-sm tracking-widest uppercase">Đăng ký ngay</span>
              <h2 className="text-[56px] font-black text-[#161b22] mt-2 leading-none tracking-tighter">Giảm 500k</h2>
              <p className="text-sm font-black text-[#ff4d6d] uppercase tracking-wide">Cho 2 đơn hàng đầu tiên</p>
            </div>
            <div className="bg-[#fea619] p-4 rounded-2xl text-[11px] font-black text-[#684000] border-2 border-dashed border-white shadow-xl relative z-10 transition-transform group-hover:scale-105">
                MIỄN PHÍ VẬN CHUYỂN CHO 5 ĐƠN ĐẦU TIÊN
            </div>
        </div>
        
        <div className="min-w-[340px] flex-1 h-[260px] bg-[#fdfc47] rounded-[40px] p-8 relative overflow-hidden border border-yellow-200 shadow-sm group cursor-pointer hover:shadow-lg">
            <span className="bg-[#161b22] text-white text-[9px] font-black px-3 py-1 rounded-lg uppercase italic tracking-widest">Tuần lễ hương vị Việt</span>
            <h2 className="text-3xl font-black text-[#161b22] mt-3 leading-tight tracking-tight uppercase">Đại tiệc bùng nổ <br/> ưu đãi tới 50%</h2>
            <img src="https://via.placeholder.com/250" className="absolute right-[-20px] bottom-[-20px] w-2/3 object-contain opacity-90 transition-transform group-hover:rotate-12 duration-500" alt="Promo" />
        </div>

        <div className="min-w-[340px] flex-1 h-[260px] bg-[#2b1e16] rounded-[40px] p-8 relative overflow-hidden border border-black/10 shadow-sm group cursor-pointer hover:shadow-lg">
            <span className="bg-[#fea619] text-[#684000] text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-widest">★ NỔI BẬT</span>
            <h2 className="text-3xl font-black text-white mt-3 leading-tight tracking-tight uppercase">Bắp bò hoa <br/> thượng hạng</h2>
            <p className="text-white/60 text-sm font-bold uppercase mt-1 tracking-wide">Thịt mềm, gân giòn</p>
            <div className="absolute right-6 bottom-6 w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white group-hover:bg-[#006c49] transition-all duration-300">
              <ArrowRight size={24} />
            </div>
        </div>
      </div>

      {/* 3. SẢN PHẨM THỊNH HÀNH */}
      <section className="px-6 md:px-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-[#006c49] rounded-full"></div>
            <h2 className="text-2xl font-black text-[#161b22] tracking-tight uppercase">Sản phẩm yêu thích</h2>
          </div>
          <button className="flex items-center gap-2 text-xs font-black text-[#006c49] bg-[#e6f0ed] px-6 py-2.5 rounded-2xl hover:bg-[#006c49] hover:text-white transition-all shadow-sm active:scale-95 uppercase tracking-widest">
            XEM THÊM <ChevronRight size={14} />
          </button>
        </div>

        <div className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4">
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="min-w-[170px] md:min-w-[210px] space-y-4">
                <div className="aspect-square bg-slate-100 rounded-[32px] animate-pulse"></div>
                <div className="h-4 bg-slate-100 rounded w-3/4 animate-pulse"></div>
                <div className="h-4 bg-slate-100 rounded w-1/2 animate-pulse"></div>
              </div>
            ))
          ) : error ? (
            <div className="w-full py-10 flex flex-col items-center text-slate-400 gap-2">
                <AlertCircle size={40} />
                <p className="font-bold">Ối! {error}</p>
                <button onClick={() => window.location.reload()} className="text-[#006c49] underline text-sm">Thử lại</button>
            </div>
          ) : (
            apiProducts.map(p => (
              <ProductCard key={p.ma_san_pham} p={p} />
            ))
          )}
          
          {!loading && !error && (
            <div className="min-w-[120px] flex items-center justify-center text-[#006c49] font-black text-xs cursor-pointer hover:underline uppercase tracking-widest group">
              Xem Tất Cả <ArrowRight size={16} className="ml-2 group-hover:translate-x-2 transition-transform" />
            </div>
          )}
        </div>
      </section>

      {/* 4. BANNER NGANG */}
      <div className="mx-6 md:mx-10 h-28 bg-[#006c49] rounded-[32px] flex items-center justify-between px-6 md:px-12 border border-[#006c49] group cursor-pointer shadow-xl shadow-[#006c49]/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-12 relative z-10">
            <h2 className="text-xl md:text-3xl font-black text-white tracking-tighter uppercase">Tuần lễ Việt Nam Toàn Cầu+</h2>
            <p className="text-xs md:text-sm text-white/70 font-black uppercase tracking-widest hidden md:block">Khám phá hương vị không biên giới!</p>
          </div>
          <button className="w-12 h-12 rounded-2xl bg-white text-[#006c49] flex items-center justify-center group-hover:translate-x-3 transition-all shadow-xl active:scale-90 relative z-10">
            <ArrowRight size={24} strokeWidth={3} />
          </button>
      </div>

    </div>
  );
}