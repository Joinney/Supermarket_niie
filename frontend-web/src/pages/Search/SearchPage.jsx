import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ChevronRight, Home, AlertCircle, Plus, Search } from 'lucide-react';
import { productApi } from '../../api/axios';
import ProductCard from '../../components/ProductCard';
import { useLanguage } from '../../context/LanguageContext';
import { useStore } from '../../context/StoreContext';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const keyword = searchParams.get("keyword") || "";
  
  const { t } = useLanguage(); 
  const { currentStore } = useStore();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchSearchResults = async () => {
      if (!keyword.trim()) {
        setProducts([]);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        
        // 3. Lấy mã quốc gia từ Cửa hàng đang chọn (ví dụ: 'vn', 'us', 'cn')
        const currentCountry = currentStore?.code || 'vn';

        // 4. Truyền biến country xuống Backend API
        const response = await productApi.get(`/products/search?keyword=${encodeURIComponent(keyword)}&country=${currentCountry}`);
        let results = response.data || [];
        
        // Fallback: Nếu không có kết quả từ DB, tìm kiếm thủ công
        if ((!results || results.length === 0) && keyword.trim()) {
          try {
            // Truyền country vào cả API dự phòng
            const allResp = await productApi.get(`/products?limit=200&country=${currentCountry}`);
            const all = allResp.data || [];
            const q = keyword.trim().toLowerCase();
            results = all.filter(p => {
              const name = (p.ten_san_pham || '').toLowerCase();
              const cat = (p.ten_danh_muc || '').toLowerCase();
              return name.includes(q) || cat.includes(q);
            });
          } catch (e) {
            // bỏ qua lỗi fallback
          }
        }
        setProducts(results);
        setError(null);
      } catch (err) {
        console.error("Lỗi tìm kiếm:", err);
        setError("Không thể lấy kết quả tìm kiếm lúc này.");
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [keyword, currentStore.code]); // 5. THEO DÕI SỰ THAY ĐỔI CỦA CỬA HÀNG

  return (
    <div className="p-6 md:p-10 font-sans bg-white h-fit pb-12 min-h-screen">
      {/* 1. BREADCRUMBS */}
      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-6 uppercase tracking-widest">
        <Link to="/" className="hover:text-[#006c49] flex items-center gap-1 transition-colors">
          <Home size={14} /> Trang chủ
        </Link>
        <ChevronRight size={14} />
        <span className="text-[#006c49]">Tìm kiếm</span>
      </div>

      {/* 2. TIÊU ĐỀ */}
      <div className="flex items-baseline justify-between mb-8 border-b border-slate-100 pb-4">
        <h1 className="text-2xl md:text-3xl font-black text-[#161b22] tracking-tight">
          Kết quả cho: <span className="text-[#006c49]">"{keyword}"</span>
        </h1>
        <span className="text-sm font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full">
          {products.length} kết quả
        </span>
      </div>

      {/* 3. LƯỚI SẢN PHẨM */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 items-start auto-rows-max">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-4">
              <div className="aspect-square bg-slate-100 rounded-[32px] animate-pulse"></div>
              <div className="h-4 bg-slate-100 rounded w-3/4 animate-pulse"></div>
              <div className="h-4 bg-slate-100 rounded w-1/2 animate-pulse"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="w-full py-20 flex flex-col items-center text-slate-400 gap-3">
          <AlertCircle size={48} className="text-red-400" />
          <p className="font-bold text-lg text-slate-600">Ối! {error}</p>
        </div>
      ) : products.length === 0 ? (
        <div className="w-full py-20 flex flex-col items-center text-slate-400 gap-3 bg-slate-50 rounded-3xl mx-auto max-w-2xl border border-dashed border-slate-200">
          <Search size={64} className="text-slate-300 mb-2" />
          <p className="font-bold text-lg text-slate-500">{t('search.no_results', 'Hiện tại không có sản phẩm nào khớp với tìm kiếm của bạn.')}</p>
          
          {/* Cụm nút hành động chuyên nghiệp */}
          <div className="flex gap-3 mt-4">
            <Link to="/" className="bg-[#006c49] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#005539] transition-all shadow-lg shadow-[#006c49]/20">
              Khám phá gian hàng
            </Link>
            <button 
              onClick={() => window.history.back()} 
              className="bg-white border border-slate-200 text-slate-600 px-6 py-2.5 rounded-xl font-bold hover:bg-slate-100 transition-all"
            >
              Tìm kiếm khác
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 items-start auto-rows-max">
          {products.map(p => (
            <ProductCard key={p.ma_san_pham} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}