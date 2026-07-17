import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { useCart } from "../../context/CartContext";

const ProductCard = ({ p, categoryName, categorySlug }) => {
  const { currentStore, formatPrice } = useStore();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const defaultImage =
    "https://media.istockphoto.com/id/2209753844/vi/anh/mua-s%E1%BA%AFm-d%E1%BB%8Dc-theo-k%E1%BB%87-h%C3%A0ng-%E1%BB%9F-l%E1%BB%91i-%C4%91i-si%E1%AA%u-th%E1%BB%8B-hi%E1%BB%87n-%C4%91%E1%BA%A1i.jpg?s=612x612&w=0&k=20&c=lw3Ya3lz386J1OTWV_vsl4F9cl-YbGg6h1_PleW_0ZI=";

  const mainImage = p.hinh_anh_chinh || defaultImage;

  // 1. CHUẨN HÓA CÁC BIẾN CẦN THIẾT NGAY TỪ ĐẦU
  const parseNumber = (val) => {
    if (val === null || val === undefined || val === "") return 0;
    if (typeof val === "number") return val;
    const str = String(val).replace(/[^0-9.-]/g, "");
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  };

  // 2. TÍNH TOÁN CÁC THÔNG SỐ (GIÁ, TÊN, KHO)
  const isFlashSale = !!p.thong_tin_sale;
  const flashSaleVariantId = p.chi_tiet_bien_the?.[0]?.ma_bien_the;
  const targetVariantId = flashSaleVariantId || p.ma_bien_the || p.ma_sku;

  const tuyChonObj = p.chi_tiet_bien_the?.[0]?.tuy_chon || p.tuy_chon || {};
  const cleanEAVArray = Object.entries(tuyChonObj).map(([key, val]) => ({
    ten_thuoc_tinh: String(key).trim(),
    gia_tri: String(val).trim(),
  }));

  const targetVariantName =
    cleanEAVArray.length > 0
      ? cleanEAVArray.map((a) => a.gia_tri).join(" - ")
      : p.ten_bien_the || p.chi_tiet_bien_the?.[0]?.ten_bien_the || "";

  const originalPrice =
    parseNumber(p.gia_ban_le) ||
    parseNumber(p.gia_goc) ||
    parseNumber(p.chi_tiet_bien_the?.[0]?.gia_ban_le) ||
    parseNumber(p.gia_ban_thap_nhat) ||
    0;
  const salePrice = isFlashSale
    ? parseNumber(p.thong_tin_sale.gia_khuyen_mai)
    : originalPrice;
  const currentPrice = isFlashSale ? salePrice : originalPrice;

  let discountBadge = null;
  if (isFlashSale && originalPrice > salePrice && salePrice > 0) {
    const percent = Math.round(
      ((originalPrice - salePrice) / originalPrice) * 100,
    );
    discountBadge = `-${percent}%`;
  } else if (isFlashSale) {
    discountBadge = "SALE";
  } else if (p.is_hot || p.hot) {
    discountBadge = "HOT 🔥";
  }

  const rawStock = parseNumber(p.tong_ton_kho ?? p.so_luong_ton ?? p.ton_kho);
  const stockCount = isFlashSale
    ? Math.max(
        0,
        parseNumber(p.thong_tin_sale.so_luong_gioi_han) -
          parseNumber(p.thong_tin_sale.da_ban),
      )
    : rawStock;

  const isOutOfStock = stockCount <= 0;
  const rawCountryCode = currentStore?.code || p.country_code || "vn";
  const country = String(rawCountryCode).toLowerCase();
  const category = categorySlug || p.slug_danh_muc || "san-pham";

  const linkUrl =
    targetVariantId && targetVariantId !== p.ma_san_pham
      ? `/${country}/product/${category}/${p.ma_san_pham}/${targetVariantId}`
      : `/${country}/product/${category}/${p.ma_san_pham}`;

  const handleQuickAddCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // =====================================================================
    //  1. BỘ LỌC CHẶN TRIỆT ĐỂ SẢN PHẨM MẸ (BIẾN THỂ NHÓM)
    // =====================================================================
    const isGroupedProduct =
      p.co_bien_the === true ||
      p.co_bien_the === "true" ||
      Number(p.co_bien_the) === 1 ||
      p.phan_loai_cau_truc === "Sản phẩm nhiều biến thể" ||
      (p.ma_bien_the_mac_dinh && !p.ten_bien_the && !p.chi_tiet_bien_the);

    if (isGroupedProduct && !isFlashSale) {
      navigate(linkUrl, { state: { categoryName, categorySlug } });
      return;
    }

    if (isOutOfStock) {
      alert("Sản phẩm này hiện đang tạm hết hàng!");
      return;
    }

    // =====================================================================
    //  2. LOGIC THÊM VÀO GIỎ (CHỈ CHẠY VỚI SẢN PHẨM ĐƠN - KHÔNG BIẾN THỂ)
    // =====================================================================
    const tuyChonObj = p.chi_tiet_bien_the?.[0]?.tuy_chon || p.tuy_chon || {};
    const cleanEAVArray = Object.entries(tuyChonObj).map(([key, val]) => ({
      ten_thuoc_tinh: String(key).trim(),
      gia_tri: String(val).trim(),
    }));

    let finalVariantName =
      p.ten_bien_the || p.chi_tiet_bien_the?.[0]?.ten_bien_the || "Mặc định";
    if (cleanEAVArray.length > 0) {
      finalVariantName = cleanEAVArray.map((a) => a.gia_tri).join(" - ");
    }

    // Lấy mã biến thể an toàn cho sản phẩm đơn
    let safeVariantId =
      targetVariantId ||
      p.chi_tiet_bien_the?.[0]?.ma_bien_the ||
      p.ma_bien_the_mac_dinh;

    // Chốt chặn cuối cùng kiểm tra tính hợp lệ của biến thể
    if (!safeVariantId || String(safeVariantId).startsWith("MSP")) {
      navigate(linkUrl, { state: { categoryName, categorySlug } });
      return;
    }

    const itemToCart = {
      variantId: safeVariantId,
      name: p.ten_san_pham,
      price: currentPrice,
      quantity: 1,
      stock: stockCount,
      image: mainImage,
      productId: p.ma_san_pham,
      categorySlug: category,
      countryCode: country,
      variantName: finalVariantName,
      thuoc_tinh_hop_nhat: cleanEAVArray,
    };

    addToCart(itemToCart);

    // Hiệu ứng bay vào giỏ hàng
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
    setTimeout(() => dot.remove(), 800);

    const toast = document.createElement("div");
    toast.className = "custom-toast";
    toast.innerHTML = `
      <img src="${mainImage}" style="width: 45px; height: 45px; border-radius: 8px; object-fit: cover; border: 1px solid #e2e8f0;">
      <div>
        <h4 style="margin: 0; color: #006c49; font-size: 15px; font-weight: 900; letter-spacing: -0.5px;">Thêm thành công!</h4>
        <p style="margin: 4px 0 0 0; color: #64748b; font-size: 12px;">Đã chọn mua <b style="color: #334155;">${p.ten_san_pham || ""}</b></p>
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  return (
    <Link
      to={linkUrl}
      state={{ categoryName, categorySlug }}
      className="flex-shrink-0 relative block"
    >
      <div className="w-full group cursor-pointer font-sans bg-white p-2 rounded-[32px] transition-all duration-300 border border-transparent hover:shadow-2xl hover:shadow-slate-100 hover:border-slate-50">
        <div className="relative aspect-square bg-[#f8fafc] rounded-[24px] overflow-hidden mb-3 border border-slate-50 group-hover:border-[#e6f0ed] transition-all">
          {discountBadge && !isOutOfStock && (
            <div className="absolute top-3 left-3 z-30 bg-gradient-to-r from-red-500 to-orange-500 text-white font-black text-[10px] px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm border border-red-400">
              {discountBadge}
            </div>
          )}

          {/* 🌟 ĐÃ FIX: Icon Hết Hàng dán góc trái */}
          {isOutOfStock && (
            <img 
              src="https://res.cloudinary.com/qb6mcdtq/image/upload/v1784226343/icon_hethang_ojzmga.png" 
              alt="Tạm hết hàng"
              className="absolute top-2 left-2 w-14 md:w-16 h-auto z-40 pointer-events-none drop-shadow-md"
            />
          )}

          <img
            src={mainImage}
            loading="lazy"
            onError={(e) => {
              e.target.src = defaultImage;
            }}
            className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition duration-500 p-4"
            alt={p.ten_san_pham || "Sản phẩm"}
          />

          {!isOutOfStock && (
            <button
              className="absolute bottom-3 right-3 w-9 h-9 bg-white border border-slate-100 rounded-xl flex items-center justify-center shadow-lg text-[#006c49] hover:bg-[#006c49] hover:text-white transition-all transform active:scale-90 z-20"
              onClick={handleQuickAddCart}
            >
              <Plus size={20} strokeWidth={3} />
            </button>
          )}
        </div>

        <div className="space-y-1 px-1">
          <div className="flex items-end gap-2">
            {isOutOfStock ? (
              <span className="font-bold text-[13px] text-slate-400 uppercase tracking-wide">
                Hết hàng
              </span>
            ) : (
              <div className="flex flex-col">
                {isFlashSale && originalPrice > salePrice && (
                  <span className="text-[10px] text-slate-400 line-through font-semibold mb-[-2px]">
                    {formatPrice
                      ? formatPrice(originalPrice)
                      : `${originalPrice.toLocaleString()}đ`}
                  </span>
                )}
                <span className="font-black text-lg leading-none text-[#ff4d4f]">
                  {formatPrice
                    ? formatPrice(currentPrice)
                    : `${currentPrice.toLocaleString()}đ`}
                </span>
              </div>
            )}
          </div>

          <p className="text-[13px] text-[#161b22] leading-tight line-clamp-2 h-8 font-bold group-hover:text-[#006c49] transition-colors mt-1">
            {targetVariantName && targetVariantName !== "Mặc định"
              ? targetVariantName
              : p.ten_san_pham}
          </p>

          <div className="flex gap-1 items-center pt-0.5">
            <span className="bg-[#e6f0ed] text-[#006c49] text-[8px] font-black px-1.5 py-0.5 rounded uppercase">
              {categoryName ||
                p.ten_danh_muc_con ||
                p.ten_danh_muc ||
                "Siêu thị"}
            </span>
          </div>

          <p className="text-[9px] text-slate-400 font-black mt-1 uppercase tracking-widest flex items-center justify-between">
            <span>
              {isFlashSale ? "ĐÃ BÁN:" : "SỐ LƯỢNG:"}{" "}
              <span className="text-slate-600">{stockCount}</span>
            </span>
          </p>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;