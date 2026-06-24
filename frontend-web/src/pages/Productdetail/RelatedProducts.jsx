import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { productApi } from "../../api/axios";
import { useStore } from "../../context/StoreContext";

export default function RelatedProducts({ currentProduct }) {
  const { country } = useParams();
  const navigate = useNavigate();
  const { formatPrice } = useStore();

  const [apiProducts, setApiProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // GỌI API LẤY SẢN PHẨM LIÊN QUAN TỪ BACKEND
  useEffect(() => {
    if (currentProduct?.ma_san_pham && currentProduct?.ma_dm_con) {
      setLoading(true);
      productApi
        .get(
          `/products/${currentProduct.ma_san_pham}/related?category=${currentProduct.ma_dm_con}&limit=5`,
        )
        .then((res) => {
          setApiProducts(res.data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Lỗi tải sản phẩm liên quan:", err);
          setLoading(false);
        });
    }
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

  const currentCountry = country || "vn";
  const cSlug = currentProduct?.slug_danh_muc || "product";

  return (
    <section className="text-left">
      {/* TIÊU ĐỀ & NÚT XEM THÊM */}
      <div className="flex items-center justify-between mb-4 px-2">
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

      {/* KHỐI GIAO DIỆN HÀNG DỌC MINI */}
      <div className="space-y-1">
        {apiProducts.map((prod) => {
          const price = parseFloat(prod.gia_ban_thap_nhat) || 0;
          const thumbMedia = prod.hinh_anh_chinh;
          const productId = prod.ma_san_pham;
          const productName = prod.ten_san_pham;

          return (
            <div
              key={productId}
              onClick={() =>
                navigate(`/${currentCountry}/product/${cSlug}/${productId}`)
              }
              className="flex items-center gap-4 p-2 rounded-2xl group cursor-pointer hover:bg-slate-50 transition-colors duration-200"
            >
              {/* Thumbnail sản phẩm */}
              <div className="w-20 h-20 bg-white rounded-xl overflow-hidden flex-shrink-0 border border-slate-100 flex items-center justify-center shadow-sm">
                <img
                  src={thumbMedia || "https://placehold.co/150x150?text=Demi"}
                  alt={productName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://placehold.co/150x150?text=Demi";
                  }}
                />
              </div>

              {/* Tên hàng hóa và giá tiền */}
              <div className="flex-1 min-w-0 space-y-1 pr-2">
                <h3 className="block text-base font-normal text-slate-800 group-hover:text-[#006c49] transition-colors line-clamp-2 leading-snug">
                  {productName}
                </h3>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-red-600">
                    {price > 0 ? formatPrice(price) : "Liên hệ"}
                  </span>
                  {price > 0 && (
                    <span className="text-xs text-slate-400">
                      {formatPrice(price)} / Sản phẩm
                    </span>
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
