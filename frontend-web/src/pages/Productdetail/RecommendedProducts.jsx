import React, { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { productApi } from "../../api/axios";
import { useStore } from "../../context/StoreContext";
import { useCart } from "../../context/CartContext";

// Component khung mờ chờ tải dữ liệu (Skeleton)
const SkeletonCard = () => (
  <div className="flex-shrink-0 w-[45vw] sm:w-[30vw] lg:w-[calc(20%-13px)] bg-white rounded-3xl p-3 border border-slate-100 shadow-sm animate-pulse">
    <div className="aspect-square w-full bg-slate-200 rounded-2xl mb-3"></div>
    <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
  </div>
);

export default function RecommendedProducts({ currentProduct }) {
  const { country } = useParams();
  const { formatPrice } = useStore();
  const { addToCart } = useCart();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  // Gọi API lấy dữ liệu sản phẩm cùng danh mục
  useEffect(() => {
    if (currentProduct?.ma_dm_con) {
      setLoading(true);
      productApi
        .get(
          `/products/${currentProduct.ma_san_pham}/related?category=${currentProduct.ma_dm_con}&limit=15`,
        )
        .then((res) => {
          setProducts(res.data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Lỗi tải đề xuất:", err);
          setLoading(false);
        });
    }
  }, [currentProduct?.ma_san_pham]);

  // Xử lý Thêm vào giỏ hàng + Hiệu ứng hạt bay + Bảng thông báo (Toast)
  const handleAddToCart = (e, prod) => {
    e.preventDefault();
    e.stopPropagation();

    // 1. Lưu vào Context Giỏ Hàng
    addToCart({
      variantId: prod.ma_bien_the || "default",
      name: prod.ten_san_pham,
      price: prod.gia_ban_thap_nhat,
      quantity: 1,
      image: prod.hinh_anh_chinh,
      id: prod.ma_san_pham,
      categorySlug: prod.slug_danh_muc,
      countryCode: country,
    });

    // 2. Hiệu ứng hạt bay (Flying Dot)
    const startX = e.clientX;
    const startY = e.clientY;
    const cartIcon = document.getElementById("cart-icon");
    let endX = window.innerWidth - 100;
    let endY = 50;

    if (cartIcon) {
      const cartRect = cartIcon.getBoundingClientRect();
      endX = cartRect.left + cartRect.width / 2;
      endY = cartRect.top + cartRect.height / 2;
    }

    const dot = document.createElement("div");
    dot.className = "flying-dot";
    dot.style.left = `${startX}px`;
    dot.style.top = `${startY}px`;
    document.body.appendChild(dot);

    setTimeout(() => {
      dot.style.left = `${endX}px`;
      dot.style.top = `${endY}px`;
      dot.style.transform = "scale(0.2)";
    }, 10);

    setTimeout(() => {
      dot.remove();
    }, 800);

    // 3. Hiện bảng thông báo (Toast) góc trên bên phải
    const toast = document.createElement("div");
    toast.className = "custom-toast";
    toast.innerHTML = `
      <img src="${prod.hinh_anh_chinh || "https://placehold.co/300x300?text=Demi"}" style="width: 45px; height: 45px; border-radius: 8px; object-fit: cover; border: 1px solid #e2e8f0;">
      <div>
        <h4 style="margin: 0; color: #006c49; font-size: 15px; font-weight: 900; letter-spacing: -0.5px;">Thêm thành công!</h4>
        <p style="margin: 4px 0 0 0; color: #64748b; font-size: 12px;">Cảm ơn khách hàng đã mua <b style="color: #334155;">${prod.ten_san_pham}</b></p>
      </div>
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  };

  // Hàm trượt ngang khi bấm nút mũi tên
  const slide = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -400 : 400;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <section className="mt-12 pt-8 border-t border-slate-100 w-full">
      <h2 className="text-2xl font-semibold text-slate-800 mb-6">
        Đề xuất cho bạn
      </h2>

      <div className="relative group">
        {/* Nút mũi tên trái */}
        {!loading && products.length > 5 && (
          <button
            onClick={() => slide("left")}
            className="absolute -left-4 top-[40%] -translate-y-1/2 z-10 w-10 h-10 bg-white border border-slate-200 rounded-full shadow-lg flex items-center justify-center text-slate-600 hover:text-[#006c49] hover:border-[#006c49] transition-all opacity-0 group-hover:opacity-100 hidden md:flex"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {/* Container cuộn ngang với CSS Scroll Snap */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-4 -mb-4 scroll-smooth hide-scrollbar"
          style={{
            scrollSnapType: "x mandatory",
            msOverflowStyle: "none",
            scrollbarWidth: "none",
          }}
        >
          {/* CSS nội tuyến để giấu thanh cuộn trên các trình duyệt Webkit (Chrome/Safari) */}
          <style>{`
            .hide-scrollbar::-webkit-scrollbar { display: none; }
          `}</style>

          {loading ? (
            [...Array(5)].map((_, i) => <SkeletonCard key={i} />)
          ) : products.length > 0 ? (
            products.map((prod) => (
              <div
                key={prod.ma_san_pham}
                className="flex-shrink-0 w-[45vw] sm:w-[30vw] lg:w-[calc(20%-13px)] flex flex-col bg-white rounded-3xl p-3 border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 relative group/card"
                style={{ scrollSnapAlign: "start" }}
              >
                <Link
                  to={`/${country}/product/${prod.slug_danh_muc || "product"}/${prod.ma_san_pham}`}
                  className="aspect-square w-full bg-slate-50 rounded-2xl overflow-hidden relative mb-3 block"
                >
                  <img
                    src={
                      prod.hinh_anh_chinh ||
                      "https://placehold.co/300x300?text=Demi"
                    }
                    className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300"
                    alt={prod.ten_san_pham}
                  />
                  <button
                    onClick={(e) => handleAddToCart(e, prod)}
                    className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-white border border-blue-100 text-blue-600 flex items-center justify-center hover:bg-blue-50 transition-all shadow-md z-10"
                  >
                    <Plus size={18} strokeWidth={2.5} />
                  </button>
                </Link>

                <div className="px-1 flex flex-col flex-1">
                  <span className="text-xl font-bold text-red-600">
                    {formatPrice(prod.gia_ban_thap_nhat)}
                  </span>
                  <Link
                    to={`/${country}/product/${prod.slug_danh_muc || "product"}/${prod.ma_san_pham}`}
                    className="text-sm font-medium text-slate-800 hover:text-[#006c49] line-clamp-2 mt-1 leading-snug min-h-[40px]"
                  >
                    {prod.ten_san_pham}
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="text-slate-400 py-10 italic w-full text-center">
              Hiện chưa có sản phẩm đề xuất khác trong danh mục này.
            </div>
          )}
        </div>

        {/* Nút mũi tên phải */}
        {!loading && products.length > 5 && (
          <button
            onClick={() => slide("right")}
            className="absolute -right-4 top-[40%] -translate-y-1/2 z-10 w-10 h-10 bg-white border border-slate-200 rounded-full shadow-lg flex items-center justify-center text-slate-600 hover:text-[#006c49] hover:border-[#006c49] transition-all opacity-0 group-hover:opacity-100 hidden md:flex"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>
    </section>
  );
}
