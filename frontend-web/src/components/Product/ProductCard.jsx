import React from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { useCart } from "../../context/CartContext";

const ProductCard = ({ p }) => {
  // 1. GỌI CONTEXT STORE ĐỂ LẤY QUỐC GIA VÀ HÀM ĐỔI TIỀN TỰ ĐỘNG
  const { currentStore, formatPrice } = useStore();

  // Lấy hàm addToCart từ CartContext
  const { addToCart } = useCart();

  const defaultImage =
    "https://media.istockphoto.com/id/2209753844/vi/anh/mua-s%E1%BA%AFm-d%E1%BB%8Dc-theo-k%E1%BB%87-h%C3%A0ng-%E1%BB%9F-l%E1%BB%91i-%C4%91i-si%C3%AAu-th%E1%BB%8B-hi%E1%BB%87n-%C4%91%E1%BA%A1i.jpg?s=612x612&w=0&k=20&c=lw3Ya3lz386J1OTWV_vsl4F9cl-YbGg6h1_PleW_0ZI=";
  const mainImage = p.hinh_anh_chinh || defaultImage;
  const currentPrice = Number(p.gia_ban_thap_nhat) || 0;

  // 2. Ưu tiên đường dẫn link chạy theo store người dùng đang chọn
  const rawCountryCode = currentStore?.code || p.country_code || "vn";
  const country = String(rawCountryCode).toLowerCase();
  const category = p.slug_danh_muc || "san-pham";
  const stockCount = p.tong_ton_kho || 0;

  // 3. Hàm xử lý thêm nhanh vào giỏ hàng và tạo hiệu ứng Animation
  const handleQuickAddCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const itemToCart = {
      variantId: p.ma_san_pham,
      name: p.ten_san_pham,
      price: currentPrice,
      quantity: 1,
      image: mainImage,
      id: p.ma_san_pham,
      categorySlug: category,
      countryCode: country,
      variantName: "Mặc định",
    };

    addToCart(itemToCart);

    // ==========================================
    // HIỆU ỨNG 1: VỆT SÁNG BAY VÀO GIỎ HÀNG
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
    // HIỆU ỨNG 2: THÔNG BÁO XUẤT HIỆN Ở GIỮA MÀN HÌNH
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
      className="flex-shrink-0"
    >
      <div className="w-full group cursor-pointer font-sans bg-white p-2 rounded-[32px] hover:shadow-2xl hover:shadow-slate-100 transition-all duration-500 border border-transparent hover:border-slate-50">
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
          <button
            className="absolute bottom-3 right-3 w-9 h-9 bg-white border border-slate-100 rounded-xl flex items-center justify-center shadow-lg text-[#006c49] hover:bg-[#006c49] hover:text-white transition-all transform active:scale-90 z-20"
            onClick={handleQuickAddCart}
          >
            <Plus size={20} strokeWidth={3} />
          </button>
        </div>
        <div className="space-y-1 px-1">
          <div className="flex items-baseline gap-2">
            {/* Bọc hàm biến đổi giá động tự động tính toán theo tỉ giá quốc gia */}
            <span className="text-[#ff4d4f] font-black text-lg leading-none">
              {formatPrice
                ? formatPrice(currentPrice)
                : `${currentPrice.toLocaleString()}đ`}
            </span>
          </div>
          <p className="text-[13px] text-[#161b22] leading-tight line-clamp-2 h-8 font-bold group-hover:text-[#006c49] transition-colors">
            {p.ten_san_pham}
          </p>
          <div className="flex gap-1 items-center pt-0.5">
            <span className="bg-[#e6f0ed] text-[#006c49] text-[8px] font-black px-1.5 py-0.5 rounded uppercase">
              {p.ten_danh_muc_con || p.ten_danh_muc || "Siêu thị"}
            </span>
          </div>
          <p className="text-[9px] text-slate-400 font-black mt-1 uppercase tracking-widest">
            SỐ LƯỢNG: {stockCount}
          </p>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
