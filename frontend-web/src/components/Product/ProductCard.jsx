import React from "react";
import { Link } from "react-router-dom";
import { Plus, X } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { useCart } from "../../context/CartContext";

const ProductCard = ({ p, categoryName, categorySlug }) => {
  const { currentStore, formatPrice } = useStore();
  const { addToCart } = useCart();

  const defaultImage =
    "https://media.istockphoto.com/id/2209753844/vi/anh/mua-s%E1%BA%AFm-d%E1%BB%8Dc-theo-k%E1%BB%87-h%C3%A0ng-%E1%BB%9F-l%E1%BB%91i-%C4%91i-si%C3%AAu-th%E1%BB%8B-hi%E1%BB%87n-%C4%91%E1%BA%A1i.jpg?s=612x612&w=0&k=20&c=lw3Ya3lz386J1OTWV_vsl4F9cl-YbGg6h1_PleW_0ZI=";
  const mainImage = p.hinh_anh_chinh || defaultImage;
  const currentPrice = Number(p.gia_ban_thap_nhat) || 0;

  const rawCountryCode = currentStore?.code || p.country_code || "vn";
  const country = String(rawCountryCode).toLowerCase();

  const category = categorySlug || p.slug_danh_muc || "san-pham";

  const stockCount = p.tong_ton_kho ? Number(p.tong_ton_kho) : 0;
  const isOutOfStock = stockCount <= 0;

  const handleQuickAddCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOutOfStock) {
      alert("Sản phẩm này hiện đang tạm hết hàng!");
      return;
    }

    // 🌟 FIX QUAN TRỌNG: Ưu tiên mã biến thể/SKU cụ thể đang được truyền vào từ API Khuyến mãi/Danh sách
    const targetVariantId =
      p.ma_bien_the || p.ma_sku || p.ma_bien_the_mac_dinh || p.ma_san_pham;

    // Ưu tiên lấy tên của phiên bản/biến thể đó nếu có
    const targetVariantName = p.ten_bien_the || p.ten_phien_ban || "Mặc định";

    const itemToCart = {
      variantId: targetVariantId,
      name: p.ten_san_pham,
      price: currentPrice,
      quantity: 1,
      stock: stockCount,
      image: mainImage,
      productId: p.ma_san_pham,
      categorySlug: category,
      countryCode: country,
      variantName: targetVariantName, // Đã sửa để lấy đúng tên SKU
    };

    addToCart(itemToCart);

    // ==========================================
    // HIỆU ỨNG VỆT SÁNG BAY VÀO GIỎ HÀNG
    // ==========================================
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

    // ==========================================
    // HIỆU ỨNG THÔNG BÁO THÀNH CÔNG
    // ==========================================
    const toast = document.createElement("div");
    toast.className = "custom-toast";
    toast.innerHTML = `
      <img src="${mainImage}" style="width: 45px; height: 45px; border-radius: 8px; object-fit: cover; border: 1px solid #e2e8f0;">
      <div>
        <h4 style="margin: 0; color: #006c49; font-size: 15px; font-weight: 900; letter-spacing: -0.5px;">Thêm thành công!</h4>
        <p style="margin: 4px 0 0 0; color: #64748b; font-size: 12px;">Cảm ơn khách hàng đã mua <b style="color: #334155;">${p.ten_san_pham}</b></p>
      </div>
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  };

  return (
    <Link
      to={`/${country}/product/${category}/${p.ma_san_pham}`}
      state={{
        categoryName: categoryName,
        categorySlug: categorySlug,
      }}
      className="flex-shrink-0 relative block"
    >
      <div className="w-full group cursor-pointer font-sans bg-white p-2 rounded-[32px] transition-all duration-300 border border-transparent hover:shadow-2xl hover:shadow-slate-100 hover:border-slate-50">
        <div className="relative aspect-square bg-[#f8fafc] rounded-[24px] overflow-hidden mb-3 border border-slate-50 group-hover:border-[#e6f0ed] transition-all">
          <img
            src={mainImage}
            loading="lazy"
            onError={(e) => {
              e.target.src = defaultImage;
            }}
            className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition duration-500 p-4"
            alt={p.ten_san_pham}
          />

          {/* 🌟 NHÃN "TẠM HẾT HÀNG" ĐỎ NHẠT, KHÔNG LÀM MỜ CARD */}
          {isOutOfStock && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
              <div className="w-12 h-4 border-t border-r border-l border-slate-300 rounded-t-full mb-[-6px]"></div>
              <div className="bg-red-50 text-red-500 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-red-200">
                Tạm hết hàng
              </div>
            </div>
          )}
        </div>

        <div className="space-y-1 px-1">
          <div className="flex items-baseline gap-2">
            {/* 🌟 HIỂN THỊ "HẾT HÀNG" THAY VÌ GIÁ KHI KHO BẰNG 0 */}
            {isOutOfStock ? (
              <span className="font-bold text-[13px] text-slate-400 uppercase tracking-wide">
                Hết hàng
              </span>
            ) : (
              <span className="font-black text-lg leading-none text-[#ff4d4f]">
                {formatPrice
                  ? formatPrice(currentPrice)
                  : `${currentPrice.toLocaleString()}đ`}
              </span>
            )}
          </div>
          <p className="text-[13px] text-[#161b22] leading-tight line-clamp-2 h-8 font-bold group-hover:text-[#006c49] transition-colors">
            {p.ten_san_pham}
          </p>
          <div className="flex gap-1 items-center pt-0.5">
            <span className="bg-[#e6f0ed] text-[#006c49] text-[8px] font-black px-1.5 py-0.5 rounded uppercase">
              {categoryName ||
                p.ten_danh_muc_con ||
                p.ten_danh_muc ||
                "Siêu thị"}
            </span>
          </div>
          <p className="text-[9px] text-slate-400 font-black mt-1 uppercase tracking-widest">
            TỒN KHO: {stockCount}
          </p>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
