import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, Home, AlertCircle, Plus } from 'lucide-react';
import { productApi } from '../../api/axios';
import ProductCard from '../../components/Product/ProductCard';
import { useStore } from '../../context/StoreContext'; 

/**
 * --- TRANG DANH MỤC CHÍNH ---
 */
export default function CategoryPage() {
  const { slug } = useParams();
  const { currentStore } = useStore();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryName, setCategoryName] = useState("");

  // Format tên tạm thời trong lúc chờ API
  const formatSlugName = (s) => s === 'tat-ca' ? 'Tất cả sản phẩm' : s.replace(/-/g, ' ');

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchCategoryProducts = async () => {
      try {
        setLoading(true);
        
        // 3. Lấy mã quốc gia hiện tại từ cửa hàng đang chọn (ví dụ: 'vn', 'us', 'cn')
        const currentCountry = currentStore?.code || 'vn';
        
        // 4. Gọi API truyền kèm tham số country
        const response = await productApi.get(`/products/category/${slug}?country=${currentCountry}`);
        setProducts(response.data);
        
        // Cập nhật tên danh mục chuẩn từ database
        if (response.data.length > 0 && slug !== 'tat-ca') {
          setCategoryName(response.data[0].ten_danh_muc);
        } else {
          setCategoryName(formatSlugName(slug));
        }
        setError(null);
      } catch (err) {
        console.error("Lỗi tải danh mục:", err);
        setError("Không thể tải danh sách sản phẩm lúc này.");
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryProducts();
  }, [slug, currentStore.code]); // 5. RE-RENDER KHI ĐỔI CỬA HÀNG

  return (
    <div className="p-6 md:p-10 font-sans bg-white h-fit pb-12">
      
      {/* 1. BREADCRUMBS */}
      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-6 uppercase tracking-widest">
        <Link to="/" className="hover:text-[#006c49] flex items-center gap-1 transition-colors">
          <Home size={14} /> Trang chủ
        </Link>
        <ChevronRight size={14} />
        <span>Danh mục</span>
        <ChevronRight size={14} />
        <span className="text-[#006c49]">{categoryName || formatSlugName(slug)}</span>
      </div>

      {/* 2. TIÊU ĐỀ DANH MỤC */}
      <div className="flex items-baseline justify-between mb-8 border-b border-slate-100 pb-4">
        <h1 className="text-3xl md:text-4xl font-black text-[#161b22] tracking-tight capitalize">
          {categoryName || formatSlugName(slug)}
        </h1>
        <span className="text-sm font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full">
          {products.length} sản phẩm
        </span>
      </div>

      {/* 3. LƯỚI SẢN PHẨM */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 items-start auto-rows-max">
          {[...Array(10)].map((_, i) => (
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
          <button onClick={() => window.location.reload()} className="text-[#006c49] underline font-bold mt-2">Thử lại</button>
        </div>
      ) : products.length === 0 ? (
        <div className="w-full py-20 flex flex-col items-center text-slate-400 gap-3 bg-slate-50 rounded-3xl">
          <img src="https://cdn-icons-png.flaticon.com/512/2748/2748614.png" alt="Empty" className="w-24 h-24 opacity-50 grayscale" />
          <p className="font-bold text-lg text-slate-500 mt-4">Chưa có sản phẩm nào trong danh mục này.</p>
          <Link to="/" className="mt-4 bg-[#006c49] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#005539] transition-colors">
            Quay lại mua sắm
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {products.map(p => (
            <ProductCard key={p.ma_san_pham} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}