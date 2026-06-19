import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight, ArrowRight, AlertCircle } from 'lucide-react';
import { productApi } from '../../api/axios';

// Giả định component ProductCard nằm ở đường dẫn tương đối này, bạn hãy điều chỉnh lại cho đúng dự án của mình
import ProductCard from '../../components/Product/ProductCard';

export default function RelatedProducts({ currentProduct }) {
  const { country } = useParams();
  const [apiProducts, setApiProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Nếu chưa có thông tin sản phẩm hiện tại để lấy danh mục tương tự thì dừng lại
    if (!currentProduct?.slug_danh_muc) return;

    setLoading(true);
    setError(null);
    const currentCountry = country || 'vn';

    // Gọi API lấy các sản phẩm cùng danh mục để làm sản phẩm tương tự
    productApi.get(`/products?category=${currentProduct.slug_danh_muc}&country=${currentCountry}`)
      .then(res => {
        const data = res.data || [];
        // Lọc bỏ chính sản phẩm hiện tại đang xem ra khỏi danh sách tương tự
        const filtered = data.filter(p => p.ma_san_pham !== currentProduct.ma_san_pham);
        setApiProducts(filtered.slice(0, 10)); // Lấy tối đa 10 sản phẩm
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching related products:", err);
        setError("Không thể tải danh sách sản phẩm tương tự.");
        setLoading(false);
      });
  }, [currentProduct, country]);

  // Nếu không loading, không lỗi mà cũng không có sản phẩm nào tương tự thì ẩn luôn section
  if (!loading && !error && apiProducts.length === 0) return null;

  return (
    <section className="mt-16 text-left">
      {/* Tiêu đề & Nút Xem Thêm theo cấu trúc mẫu */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-[#006c49] rounded-full"></div>
          <h2 className="text-2xl font-black text-[#161b22] tracking-tight uppercase">
            Sản phẩm tương tự
          </h2>
        </div>
        <Link 
          to={currentProduct?.slug_danh_muc ? `/category/${currentProduct.slug_danh_muc}` : "/category/tat-ca"} 
          className="flex items-center gap-2 text-xs font-black text-[#006c49] bg-[#e6f0ed] px-6 py-2.5 rounded-2xl hover:bg-[#006c49] hover:text-white transition-all shadow-sm active:scale-95 uppercase tracking-widest"
        >
          Xem thêm <ChevronRight size={14} />
        </Link>
      </div>

      {/* Luồng danh sách card sản phẩm dạng slide cuộn ngang giống mã mẫu */}
      <div className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4">
        {loading ? (
          // Trạng thái skeleton loading đồng bộ
          [...Array(6)].map((_, i) => (
            <div key={i} className="min-w-[170px] md:min-w-[210px] space-y-4">
              <div className="aspect-square bg-slate-100 rounded-[32px] animate-pulse"></div>
              <div className="h-4 bg-slate-100 rounded w-3/4 animate-pulse"></div>
              <div className="h-4 bg-slate-100 rounded w-1/2 animate-pulse"></div>
            </div>
          ))
        ) : error ? (
          // Trạng thái báo lỗi đồng bộ
          <div className="w-full py-10 flex flex-col items-center text-slate-400 gap-2">
            <AlertCircle size={40} />
            <p className="font-bold">Ối! {error}</p>
            <button onClick={() => window.location.reload()} className="text-[#006c49] underline text-sm">Thử lại</button>
          </div>
        ) : (
          // Render danh sách sản phẩm bằng ProductCard xịn của hệ thống
          apiProducts.map(p => (
            <div key={p.ma_san_pham} className="min-w-[170px] md:min-w-[210px]">
              <ProductCard p={p} />
            </div>
          ))
        )}
        
        {/* Nút Xem Tất Cả ở cuối danh sách cuộn ngang */}
        {!loading && !error && (
          <Link 
            to={currentProduct?.slug_danh_muc ? `/category/${currentProduct.slug_danh_muc}` : "/category/tat-ca"} 
            className="min-w-[140px] flex items-center justify-center text-[#006c49] font-black text-xs cursor-pointer hover:underline uppercase tracking-widest group px-4"
          >
            Xem Tất Cả <ArrowRight size={16} className="ml-2 group-hover:translate-x-2 transition-transform" />
          </Link>
        )}
      </div>
    </section>
  );
}