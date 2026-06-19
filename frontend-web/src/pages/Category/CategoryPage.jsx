import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Home, AlertCircle, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { productApi } from '../../api/axios';
import ProductCard from '../../components/Product/ProductCard';
import { useStore } from '../../context/StoreContext';

/**
 * --- TRANG DANH MỤC NÂNG CẤP HOÀN CHỈNH ---
 * Tính năng: Khử thanh cuộn ngang, hover hiện nút trượt, lọc giá VNĐ & phân trang nằm trong khối sản phẩm.
 */
export default function CategoryPage() {
  const { slug } = useParams();
  const { currentStore } = useStore();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryName, setCategoryName] = useState("");

  // --- STATE PHÂN TRANG ---
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(5); // Mặc định giả lập 5 trang (API trả về sẽ cập nhật lại)

  // --- STATE CHO DANH MỤC CON & BỘ LỌC ---
  const [subCategories, setSubCategories] = useState([]);
  const [activeSubCategory, setActiveSubCategory] = useState(null);
  
  const [selectedSort, setSelectedSort] = useState("noi-bat");
  const [selectedPrice, setSelectedPrice] = useState("tat-ca"); // Lưu khoảng giá bằng VNĐ
  const [selectedOrigin, setSelectedOrigin] = useState("tat-ca");
  const [shippingMethod, setShippingMethod] = useState({ fresh: false, global: false });

  // Khởi tạo Ref điều khiển hành động cuộn trượt của khối danh mục phụ
  const sliderRef = useRef(null);

  const formatSlugName = (s) => s === 'tat-ca' ? 'Tất cả sản phẩm' : s.replace(/-/g, ' ');

  // Reset về trang 1 khi người dùng đổi bộ lọc hoặc đổi danh mục chính
  useEffect(() => {
    setCurrentPage(1);
  }, [slug, selectedSort, selectedPrice, selectedOrigin, activeSubCategory, shippingMethod]);

  // MOCK DATA DANH MỤC CON KÈM ẢNH THẬT
  useEffect(() => {
    setSubCategories([
      { 
        id: 1, 
        name: 'Rau hữu cơ', 
        images: [
          'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=80&auto=format&fit=crop&q=60', 
          'https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?w=80&auto=format&fit=crop&q=60'
        ] 
      },
      { 
        id: 2, 
        name: 'Các loại rau lá', 
        images: [
          'https://images.unsplash.com/photo-1621460245025-a13180496d8e?w=80&auto=format&fit=crop&q=60', 
          'https://images.unsplash.com/photo-1587334206503-7b76a3e1552e?w=80&auto=format&fit=crop&q=60',
          'https://images.unsplash.com/photo-1543362906-acfc16c67564?w=80&auto=format&fit=crop&q=60'
        ] 
      },
      { 
        id: 3, 
        name: 'Rau củ', 
        images: [
          'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=80&auto=format&fit=crop&q=60', 
          'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=80&auto=format&fit=crop&q=60'
        ] 
      },
      { 
        id: 4, 
        name: 'Hành các loại', 
        images: [
          'https://images.unsplash.com/photo-1618220179428-22790b461013?w=80&auto=format&fit=crop&q=60', 
          'https://images.unsplash.com/photo-1580201092675-a0a6a6cafbb1?w=80&auto=format&fit=crop&q=60'
        ] 
      },
      { 
        id: 5, 
        name: 'Cà chua', 
        images: [
          'https://images.unsplash.com/photo-1595855759920-86582396756a?w=80&auto=format&fit=crop&q=60'
        ] 
      },
      { 
        id: 6, 
        name: 'Nấm', 
        images: [
          'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=80&auto=format&fit=crop&q=60', 
          'https://images.unsplash.com/photo-1570714060423-f308bc210bf8?w=80&auto=format&fit=crop&q=60'
        ] 
      },
      { 
        id: 7, 
        name: 'Gia vị kèm', 
        images: [
          'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=80&auto=format&fit=crop&q=60'
        ] 
      },
    ]);
  }, [slug]);

  // CALL API LẤY DỮ LIỆU SẢN PHẨM & PHÂN TRANG
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Cuộn nhẹ lên đầu khi đổi trang
    const fetchCategoryProducts = async () => {
      try {
        setLoading(true);
        const currentCountry = currentStore?.code || 'vn';
        
        const response = await productApi.get(`/products/category/${slug}`, {
          params: {
            country: currentCountry,
            sort: selectedSort,
            price: selectedPrice, // Truyền chuỗi khoảng giá dạng '0-50000' hoặc '50000-100000' lên API
            origin: selectedOrigin,
            sub_category: activeSubCategory,
            page: currentPage,
            limit: 20
          }
        });
        
        // Hỗ trợ cả 2 cấu trúc dữ liệu trả về (mảng thuần hoặc object chứa tổng số trang)
        setProducts(response.data.products || response.data);
        if (response.data.totalPages) {
          setTotalPages(response.data.totalPages);
        }
        
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
  }, [slug, currentStore?.code, selectedSort, selectedPrice, selectedOrigin, activeSubCategory, currentPage]);

  // Điều khiển các nút dịch chuyển danh mục con qua lại nhịp nhàng
  const handleScroll = (direction) => {
    if (sliderRef.current) {
      const { scrollLeft, clientWidth } = sliderRef.current;
      const offset = direction === 'left' ? -(clientWidth * 0.6) : (clientWidth * 0.6);
      sliderRef.current.scrollTo({
        left: scrollLeft + offset,
        behavior: 'smooth'
      });
    }
  };

  // Thay đổi số trang an toàn
  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-6 font-sans bg-white min-h-screen">
      
      {/* 1. BREADCRUMBS */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-4 uppercase tracking-wider">
        <Link to="/" className="hover:text-[#006c49] flex items-center gap-1 transition-colors">
          <Home size={14} /> Trang chủ
        </Link>
        <ChevronRight size={14} />
        <span>Danh mục</span>
        <ChevronRight size={14} />
        <span className="text-[#006c49] font-semibold">{categoryName || formatSlugName(slug)}</span>
      </div>

      {/* 2. THẺ DANH MỤC CON: CUỘN NGANG KHÔNG LỘ TRACK - HOVER KHU VỰC HIỆN 2 NÚT CHUYỂN */}
      {subCategories.length > 0 && (
        <div className="relative w-full mb-6 group/subnav">
          
          {/* NÚT DI CHUYỂN SANG TRÁI - Hover cụm danh mục hiện lên */}
          <button 
            onClick={() => handleScroll('left')}
            className="absolute left-[-14px] top-1/2 -translate-y-1/2 bg-[#f3f5f9] text-slate-900 border-4 border-white w-12 h-12 rounded-full shadow-[0_3px_10px_rgba(0,0,0,0.14)] flex items-center justify-center z-20 hover:bg-white transition-all duration-200 opacity-0 group-hover/subnav:opacity-100 active:scale-95"
          >
            <ChevronLeft size={20} strokeWidth={3} />
          </button>

          {/* Slider Danh Mục Ngang */}
          <div 
            ref={sliderRef}
            className="flex gap-2.5 overflow-x-auto pb-1 snap-x scroll-smooth"
            style={{
              scrollbarWidth: 'none',          /* Khử track trên Firefox */
              msOverflowStyle: 'none',         /* Khử track trên IE/Edge */
            }}
          >
            {/* Inject CSS để triệt tiêu vĩnh viễn thanh cuộn ngang màu xanh trên Chrome & Safari */}
            <style>{`
              div::-webkit-scrollbar {
                display: none !important;
              }
            `}</style>

            {subCategories.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setActiveSubCategory(activeSubCategory === sub.id ? null : sub.id)}
                className={`flex items-center justify-between pl-4 pr-2 py-2 rounded-xl border min-w-[215px] max-w-[215px] h-[64px] flex-shrink-0 transition-all snap-start text-left
                  ${activeSubCategory === sub.id 
                    ? 'border-[#006c49] bg-emerald-50/40 text-[#006c49] ring-1 ring-[#006c49]' 
                    : 'border-slate-100 bg-[#f4f6fa] hover:bg-slate-200/60'}`}
              >
                {/* Bên trái: Tên danh mục */}
                <span className="text-xs font-bold text-slate-800 line-clamp-2 pr-1">
                  {sub.name}
                </span>

                {/* Bên phải: Lưới nhỏ chứa ảnh */}
                <div className="grid grid-cols-2 gap-0.5 bg-white p-1 rounded-lg border border-slate-200/60 flex-shrink-0 h-11 w-14 items-center justify-center overflow-hidden">
                  {sub.images.map((img, index) => (
                    <img 
                      key={index} 
                      src={img} 
                      alt="" 
                      className={`h-3.5 w-3.5 object-cover rounded-sm mx-auto ${sub.images.length === 1 ? 'col-span-2 w-6 h-6' : ''}`}
                    />
                  ))}
                </div>
              </button>
            ))}
          </div>

          {/* NÚT DI CHUYỂN SANG PHẢI - Hover cụm danh mục hiện lên */}
          <button 
            onClick={() => handleScroll('right')}
            className="absolute right-[-14px] top-1/2 -translate-y-1/2 bg-[#f3f5f9] text-slate-900 border-4 border-white w-12 h-12 rounded-full shadow-[0_3px_10px_rgba(0,0,0,0.14)] flex items-center justify-center z-20 hover:bg-white transition-all duration-200 opacity-0 group-hover/subnav:opacity-100 active:scale-95"
          >
            <ChevronRight size={20} strokeWidth={3} />
          </button>

        </div>
      )}

      {/* SỐ LƯỢNG & SẮP XẾP */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div className="text-sm font-semibold text-slate-600">
          {products.length} kết quả
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Sắp xếp:</span>
          <select 
            value={selectedSort} 
            onChange={(e) => setSelectedSort(e.target.value)}
            className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:border-[#006c49]"
          >
            <option value="noi-bat">Nổi bật (mặc định)</option>
            <option value="gia-thap">Giá: Thấp đến Cao</option>
            <option value="gia-cao">Giá: Cao đến Thấp</option>
            <option value="ban-chay">Bán chạy nhất</option>
          </select>
        </div>
      </div>

      {/* 3. BỐ CỤC CHÍNH */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* KHỐI NỘI DUNG SẢN PHẨM PHÍA BÊN TRÁI (Bao gồm cả lưới sản phẩm và khối phân trang lồng bên trong) */}
        <div className="flex-1 w-full order-2 lg:order-1 border border-slate-100 rounded-2xl p-4 bg-white shadow-sm flex flex-col justify-between min-h-[550px]">
          
          {/* Lưới hiển thị sản phẩm */}
          <div>
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="space-y-4">
                    <div className="aspect-square bg-slate-100 rounded-2xl animate-pulse"></div>
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
                <p className="font-bold text-lg text-slate-500">Chưa có sản phẩm nào phù hợp bộ lọc.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {products.map(p => (
                  <ProductCard key={p.ma_san_pham} p={p} />
                ))}
              </div>
            )}
          </div>

          {/* THANH PHÂN TRANG (PAGINATION) - NẰM GỌN BÊN TRONG KHỐI TRẮNG SẢN PHẨM */}
          {!loading && products.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-10 pt-5 border-t border-slate-100 w-full select-none">
              
              {/* Về đầu trang */}
              <button 
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-colors"
              >
                <ChevronsLeft size={16} />
              </button>

              {/* Trang trước */}
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-colors flex items-center gap-1 text-xs font-semibold"
              >
                <ChevronLeft size={16} /> Trước
              </button>

              {/* Các nút số trang */}
              {[...Array(totalPages)].map((_, index) => {
                const pageNum = index + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-9 h-9 rounded-lg border text-xs font-bold transition-all
                      ${currentPage === pageNum 
                        ? 'bg-[#006c49] border-[#006c49] text-white shadow-sm shadow-emerald-700/20' 
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'}`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {/* Trang sau */}
              <button 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-colors flex items-center gap-1 text-xs font-semibold"
              >
                Sau <ChevronRight size={16} />
              </button>

              {/* Đến trang cuối */}
              <button 
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-colors"
              >
                <ChevronsRight size={16} />
              </button>

            </div>
          )}
        </div>

        {/* SIDEBAR BỘ LỌC (TIỀN VNĐ CHUẨN) */}
        <div className="w-full lg:w-64 border border-slate-100 rounded-xl p-4 bg-white shadow-sm order-1 lg:order-2 sticky top-4">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm">Chọn lọc</h3>
            <button 
              onClick={() => { setSelectedPrice("tat-ca"); setSelectedOrigin("tat-ca"); setShippingMethod({fresh:false, global:false})}}
              className="text-xs text-slate-400 hover:text-red-500 transition-colors"
            >
              Đặt lại
            </button>
          </div>

          {/* Phương thức giao hàng */}
          <div className="mb-5">
            <h4 className="text-xs font-bold text-slate-700 mb-2">Phương thức giao hàng</h4>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={shippingMethod.fresh} 
                  onChange={(e) => setShippingMethod({...shippingMethod, fresh: e.target.checked})}
                  className="rounded text-[#006c49] focus:ring-[#006c49] w-3.5 h-3.5" 
                />
                Giao hàng hoả tốc
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={shippingMethod.global} 
                  onChange={(e) => setShippingMethod({...shippingMethod, global: e.target.checked})}
                  className="rounded text-[#006c49] focus:ring-[#006c49] w-3.5 h-3.5" 
                />
                <span className="bg-orange-500 text-white text-[10px] px-1 rounded font-black scale-90">GLOBAL</span>
              </label>
            </div>
          </div>

          {/* Bộ lọc theo giá VNĐ */}
          <div className="mb-5">
            <h4 className="text-xs font-bold text-slate-700 mb-2">Giá bán</h4>
            <div className="space-y-2">
              {[
                { label: 'Tất cả khoảng giá', value: 'tat-ca' },
                { label: 'Dưới 50.000đ', value: '0-50000' },
                { label: '50.000đ - 100.000đ', value: '50000-100000' },
                { label: '100.000đ - 200.000đ', value: '100000-200000' },
                { label: 'Trên 200.000đ', value: '200000-up' }
              ].map((item) => (
                <label key={item.value} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                  <input 
                    type="radio" 
                    name="price-filter" 
                    value={item.value}
                    checked={selectedPrice === item.value}
                    onChange={() => setSelectedPrice(item.value)}
                    className="text-[#006c49] focus:ring-[#006c49] w-3.5 h-3.5"
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </div>

          {/* Lọc theo Xuất xứ */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 mb-2">Xuất Xứ</h4>
            <div className="space-y-2">
              {[
                { label: 'Tất cả', value: 'tat-ca' },
                { label: 'Việt Nam', value: 'vn' },
                { label: 'Nhập Khẩu', value: 'nhap-khau' },
                { label: 'Nhật Bản', value: 'jp' },
                { label: 'Hàn Quốc', value: 'kr' }
              ].map((item) => (
                <label key={item.value} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                  <input 
                    type="radio" 
                    name="origin-filter" 
                    value={item.value} 
                    checked={selectedOrigin === item.value} 
                    onChange={() => setSelectedOrigin(item.value)} 
                    className="text-[#006c49] focus:ring-[#006c49] w-3.5 h-3.5" 
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}