import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import {
  ShoppingCart,
  ShieldCheck,
  Truck,
  Minus,
  Plus,
  ChevronRight,
  CreditCard,
} from "lucide-react";
import { io } from "socket.io-client";

import { useLanguage } from "../../context/LanguageContext";
import { useStore } from "../../context/StoreContext";
import { useCart } from "../../context/CartContext";

import { productApi, promotionApi } from "../../api/axios"; // 🌟 ĐÃ THÊM promotionApi
import Feedback from "./Feedback";
import RelatedProducts from "./RelatedProducts";
import RecommendedProducts from "./RecommendedProducts";

const getYouTubeEmbedUrl = (url) => {
  if (!url) return null;
  const regExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/;watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11
    ? `https://www.youtube.com/embed/${match[2]}?autoplay=0`
    : null;
};

export default function ProductDetail() {
  const { country_code, category_slug, id, variantId } = useParams();
  const country = String(country_code || "vn").toLowerCase();
  const category = category_slug;
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();

  const { currentStore, formatPrice } = useStore();
  const { t } = useLanguage();

  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [mainMedia, setMainMedia] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedAttributes, setSelectedAttributes] = useState({});

  // 🌟 STATE CHỨA DỮ LIỆU FLASH SALE TRỰC TIẾP TỪ FRONTEND
  const [activeFlashSales, setActiveFlashSales] = useState([]);

  useEffect(() => {
    const storeCodeLowerCase = String(currentStore?.code || "vn").toLowerCase();
    if (currentStore?.code && storeCodeLowerCase !== country && product) {
      const cSlug = category_slug || product?.slug_danh_muc || "product";
      navigate(`/${storeCodeLowerCase}/product/${cSlug}/${id}`, {
        replace: true,
      });
    }
  }, [currentStore, country, id, category_slug, navigate, product]);

  // Gọi API Flash Sale độc lập để bọc lót cho Backend
  useEffect(() => {
    promotionApi
      .get("/client/flash-sale/active")
      .then((res) => {
        if (res.data?.success && res.data?.data) {
          setActiveFlashSales(res.data.data);
        }
      })
      .catch((err) => console.error("Lỗi lấy Flash Sale bọc lót:", err));
  }, []);

  useEffect(() => {
    if (!id || id === "undefined") {
      setLoading(false);
      return;
    }
    window.scrollTo(0, 0);
    setLoading(true);

    const currentCountry = country || "vn";
    productApi
      .get(`/products/${id}?country=${currentCountry}&role=client`)
      .then((res) => {
        const data = res.data;
        const productData = Array.isArray(data) ? data[0] : data;

        if (productData && productData.ma_san_pham) {
          if (productData.trang_thai === false) {
            window.location.href = "/";
            return;
          }

          const bienTheList =
            productData.bien_the || productData.variants || [];
          productData.bien_the = bienTheList.map((bt) => {
            if (
              Array.isArray(bt.thuoc_tinh_hop_nhat) &&
              (!bt.thuoc_tinh || Object.keys(bt.thuoc_tinh).length === 0)
            ) {
              const flatAttrs = {};
              bt.thuoc_tinh_hop_nhat.forEach((a) => {
                flatAttrs[a.ten_thuoc_tinh] = a.gia_tri;
              });
              bt.thuoc_tinh = flatAttrs;
            }
            return bt;
          });

          setProduct(productData);

          let initialVariant = null;
          if (variantId) {
            initialVariant = productData.bien_the.find(
              (v) => String(v.ma_bien_the) === String(variantId),
            );
          }
          if (!initialVariant) {
            initialVariant =
              productData.bien_the.find((v) => v.la_ban_chay) ||
              productData.bien_the[0];
          }

          if (initialVariant) {
            setSelectedVariant(initialVariant);
            setQuantity(1);
            setSelectedAttributes(initialVariant.thuoc_tinh || {});

            const variantMedia = productData.media?.find(
              (m) =>
                String(m.ma_bien_the) === String(initialVariant.ma_bien_the),
            );
            setMainMedia(
              variantMedia ||
                productData.media?.find((m) => m.la_anh_chinh) ||
                productData.media?.[0],
            );

            if (
              !variantId ||
              String(variantId) !== String(initialVariant.ma_bien_the)
            ) {
              const cSlug = category_slug || productData.slug_danh_muc || "all";
              navigate(
                `/${currentCountry}/product/${cSlug}/${id}/${initialVariant.ma_bien_the}`,
                { replace: true },
              );
            }
          }
        } else {
          setProduct(null);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching product:", error);
        setLoading(false);
      });
  }, [id, country]);

  useEffect(() => {
    if (!product || !variantId) return;
    const targetVariant = product.bien_the?.find(
      (v) => String(v.ma_bien_the) === String(variantId),
    );

    if (
      targetVariant &&
      targetVariant.ma_bien_the !== selectedVariant?.ma_bien_the
    ) {
      setSelectedVariant(targetVariant);
      setQuantity(1);
      setSelectedAttributes(targetVariant.thuoc_tinh || {});
      const variantMedia = product.media?.find(
        (m) => String(m.ma_bien_the) === String(targetVariant.ma_bien_the),
      );
      if (variantMedia) setMainMedia(variantMedia);
    }
  }, [variantId, product]);

  const nhomPhanLoai = useMemo(() => {
    if (!product?.bien_the) return {};
    const groups = {};
    product.bien_the.forEach((bt) => {
      if (bt.thuoc_tinh && Object.keys(bt.thuoc_tinh).length > 0) {
        Object.entries(bt.thuoc_tinh).forEach(([key, value]) => {
          if (!groups[key]) groups[key] = new Set();
          const cleanValue = typeof value === "string" ? value.trim() : value;
          groups[key].add(cleanValue);
        });
      }
    });
    Object.keys(groups).forEach((key) => {
      groups[key] = Array.from(groups[key]);
    });
    return groups;
  }, [product]);

  const isOptionValid = (key, value) => {
    if (!product?.bien_the) return false;
    const cleanValue = typeof value === "string" ? value.trim() : value;
    return product.bien_the.some((bt) => {
      if (!bt.thuoc_tinh) return false;
      const targetVal = bt.thuoc_tinh[key];
      if (!targetVal) return false;
      return (
        String(targetVal).trim().toLowerCase() ===
        String(cleanValue).toLowerCase()
      );
    });
  };

  const handleAttributeSelect = (key, value) => {
    if (!product?.bien_the) return;
    const nextAttributes = { ...selectedAttributes, [key]: value };
    setSelectedAttributes(nextAttributes);

    const matchedVariant = product.bien_the.find((bt) => {
      if (!bt.thuoc_tinh) return false;
      return Object.keys(nhomPhanLoai).every((k) => {
        const val1 = bt.thuoc_tinh[k];
        const val2 = nextAttributes[k];
        if (!val1 || !val2) return false;
        return (
          String(val1).trim().toLowerCase() ===
          String(val2).trim().toLowerCase()
        );
      });
    });

    if (matchedVariant) {
      setSelectedVariant(matchedVariant);
      const vMedia = product.media?.find(
        (m) => String(m.ma_bien_the) === String(matchedVariant.ma_bien_the),
      );
      if (vMedia) setMainMedia(vMedia);
      navigate(
        `/${country}/product/${category_slug}/${id}/${matchedVariant.ma_bien_the}`,
        { replace: true },
      );
    } else {
      setSelectedVariant(null);
    }
  };

  // =======================================================================
  // 🌟 LOGIC "BỌC THÉP": TỰ ĐỘNG ÉP GIÁ FLASH SALE NẾU BACKEND MISS
  // =======================================================================
  const activeSaleItem = useMemo(() => {
    if (!selectedVariant || !activeFlashSales.length) return null;
    for (const promo of activeFlashSales) {
      const match = promo.products?.find(
        (p) =>
          p.chi_tiet_bien_the?.[0]?.ma_bien_the === selectedVariant.ma_bien_the,
      );
      if (match) return match.thong_tin_sale;
    }
    return null;
  }, [selectedVariant, activeFlashSales]);

  const isFlashSale =
    !!activeSaleItem ||
    !!selectedVariant?.thong_tin_sale ||
    !!selectedVariant?.is_flash_sale;

  // Lấy Giá Bán chuẩn xác (Ưu tiên activeSaleItem từ FE, sau đó mới tới BE)
  const currentPrice = isFlashSale
    ? Number(
        activeSaleItem?.gia_khuyen_mai ||
          selectedVariant?.thong_tin_sale?.gia_khuyen_mai ||
          selectedVariant?.gia_khuyen_mai ||
          selectedVariant?.gia_ban_le ||
          0,
      )
    : Number(selectedVariant?.gia_ban_le || product?.gia_ban_thap_nhat || 0);

  const rawOriginalPrice = Number(
    selectedVariant?.gia_goc ||
      selectedVariant?.gia_ban_le ||
      product?.gia_ban_thap_nhat ||
      0,
  );
  const originalPrice =
    isFlashSale && rawOriginalPrice > currentPrice ? rawOriginalPrice : null;

  // Tồn kho cũng ưu tiên Flash Sale
  const stockCount = isFlashSale
    ? Number(
        activeSaleItem?.so_luong_gioi_han - activeSaleItem?.da_ban ||
          selectedVariant?.thong_tin_sale?.ton_kho_sale ||
          selectedVariant?.so_luong_ton ||
          0,
      )
    : Number(selectedVariant?.so_luong_ton || 0);

  const isOutOfStock = !selectedVariant || stockCount <= 0;

  const checkIsLoggedIn = () => {
    const token = localStorage.getItem("token");
    return !!token;
  };

  const handleBuyNow = () => {
    if (!checkIsLoggedIn()) {
      const confirmLogin = window.confirm(
        "Bạn cần đăng nhập để mua sản phẩm. Đi tới trang đăng nhập?",
      );
      if (confirmLogin) navigate("/login");
      return;
    }
    if (!product || !selectedVariant || isOutOfStock) return;
    navigate("/checkout", {
      state: {
        buyNow: true,
        product: { ...product, selectedVariant, quantity, currentPrice },
      },
    });
  };

  const handleAddToCart = (e) => {
    if (!checkIsLoggedIn()) {
      const confirmLogin = window.confirm(
        "Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng. Đi tới trang đăng nhập?",
      );
      if (confirmLogin) navigate("/login");
      return;
    }

    if (!product || !selectedVariant || isOutOfStock) return;

    let cleanEAVArray = [];
    if (
      Array.isArray(selectedVariant.thuoc_tinh_hop_nhat) &&
      selectedVariant.thuoc_tinh_hop_nhat.length > 0
    ) {
      cleanEAVArray = selectedVariant.thuoc_tinh_hop_nhat.map((attr) => ({
        ten_thuoc_tinh: String(attr.ten_thuoc_tinh || "").trim(),
        gia_tri: String(attr.gia_tri || "").trim(),
      }));
    } else if (
      selectedVariant.thuoc_tinh &&
      Object.keys(selectedVariant.thuoc_tinh).length > 0
    ) {
      cleanEAVArray = Object.entries(selectedVariant.thuoc_tinh).map(
        ([key, val]) => ({
          ten_thuoc_tinh: String(key).trim(),
          gia_tri: String(val).trim(),
        }),
      );
    }

    // Tên hiển thị giỏ hàng
    let targetVariantName =
      selectedVariant.ten_bien_the || product.ten_san_pham;
    if (cleanEAVArray.length > 0) {
      targetVariantName = cleanEAVArray.map((a) => a.gia_tri).join(" - ");
    }

    const itemToCart = {
      variantId: selectedVariant.ma_bien_the,
      name: product.ten_san_pham,
      price: currentPrice, // ĐÃ ĐƯỢC ÉP LẤY GIÁ 25K CHUẨN XÁC
      quantity: quantity,
      stock: stockCount,
      image:
        selectedVariant.hinh_anh_url ||
        selectedVariant.duong_dan_url ||
        mainMedia?.duong_dan_url ||
        "",
      productId: product.ma_san_pham,
      categorySlug: product.slug_danh_muc || category_slug,
      countryCode: product.country_code || country,
      variantName: targetVariantName,
      ten_don_vi: selectedVariant.ten_don_vi || product.ten_don_vi || "Gói",
      thuoc_tinh_hop_nhat: cleanEAVArray,
    };

    addToCart(itemToCart);

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
      <img src="${itemToCart.image || "https://placehold.co/300x300?text=Demi+Mart"}" style="width: 45px; height: 45px; border-radius: 8px; object-fit: cover; border: 1px solid #e2e8f0;">
      <div>
        <h4 style="margin: 0; color: #006c49; font-size: 15px; font-weight: 900; letter-spacing: -0.5px;">Thêm thành công!</h4>
        <p style="margin: 4px 0 0 0; color: #64748b; font-size: 12px;">Đã chọn mua <b style="color: #334155;">${product.ten_san_pham}</b></p>
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#006c49] border-t-transparent rounded-full animate-spin"></div>
          <p className="font-black text-[#006c49] animate-pulse uppercase tracking-[0.2em]">
            Demi Mart Loading...
          </p>
        </div>
      </div>
    );

  if (!product)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="font-bold text-slate-400 italic">
          Sản phẩm không hiện hữu hoặc lỗi kết nối.
        </p>
        <Link to="/" className="text-[#006c49] font-black underline uppercase">
          Quay lại cửa hàng
        </Link>
      </div>
    );

  const isMultiTier = Object.keys(nhomPhanLoai).length > 0;
  const displayCategoryName =
    location.state?.categoryName ||
    product?.ten_dm_con ||
    product?.ten_danh_muc;
  const displayCategorySlug =
    location.state?.categorySlug ||
    product?.slug_danh_muc ||
    product?.ma_dm_con;

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-[#006c49] selection:text-white pb-16 text-left">
      <div className="w-full max-w-[1150px] 2xl:max-w-[1400px] mx-auto px-2 sm:px-6 lg:px-10 pt-4 lg:pt-10">
        <nav className="flex items-center gap-2 text-[10px] 2xl:text-[11px] font-bold text-slate-400 mb-3 lg:mb-6 uppercase tracking-wider overflow-hidden px-1">
          <Link
            to={`/${country}`}
            className="hover:text-slate-900 flex-shrink-0 transition-colors"
          >
            Home
          </Link>
          <ChevronRight size={10} className="text-slate-300 flex-shrink-0" />
          {displayCategoryName && (
            <>
              <Link
                to={`/${country}/category/${displayCategorySlug}`}
                className="text-slate-400 hover:text-slate-900 truncate transition-colors"
              >
                {displayCategoryName}
              </Link>
              <ChevronRight
                size={10}
                className="text-slate-300 flex-shrink-0"
              />
            </>
          )}
          <span className="text-[#006c49] truncate font-black italic">
            {product.ten_san_pham}
          </span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 2xl:gap-16 items-start">
          <div className="lg:col-span-6 xl:col-span-7 flex flex-col-reverse sm:flex-row gap-2 lg:gap-4">
            <div className="flex sm:flex-col gap-2 w-full sm:w-16 2xl:w-20 flex-shrink-0 overflow-x-auto sm:overflow-y-auto thumb-scrollbar py-1 sm:max-h-[280px] 2xl:max-h-[350px] pr-1">
              {product.media?.map((m, i) => (
                <button
                  key={i}
                  onClick={() => setMainMedia(m)}
                  className={`aspect-square w-12 sm:w-full rounded-lg border-2 transition-all p-0.5 bg-white flex-shrink-0 ${
                    mainMedia?.ma_media === m.ma_media
                      ? "border-[#006c49] shadow-sm"
                      : "border-slate-100 opacity-60 hover:opacity-100 hover:border-slate-300"
                  }`}
                >
                  {m.loai_media === "video" ? (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-500 rounded-md">
                      VIDEO
                    </div>
                  ) : (
                    <img
                      src={m.duong_dan_url}
                      className="w-full h-full object-cover rounded-md"
                      alt="thumb"
                    />
                  )}
                </button>
              ))}
            </div>

            <div className="flex-1 relative aspect-square sm:aspect-[4/5] max-h-[45vh] lg:max-h-[65vh] rounded-[16px] lg:rounded-[32px] bg-[#f9f9f9] border border-slate-50 overflow-hidden flex items-center justify-center shadow-sm">
              {mainMedia?.loai_media === "video" ? (
                getYouTubeEmbedUrl(mainMedia.duong_dan_url) ? (
                  <iframe
                    src={getYouTubeEmbedUrl(mainMedia.duong_dan_url)}
                    title="YouTube"
                    className="w-full h-full object-cover rounded-[16px] p-2"
                    allowFullScreen
                  ></iframe>
                ) : (
                  <video
                    src={mainMedia.duong_dan_url}
                    controls
                    className="w-full h-full object-contain p-4 bg-black rounded-[16px]"
                  />
                )
              ) : (
                <img
                  src={mainMedia?.duong_dan_url}
                  className="w-full h-full object-contain p-4 transition-transform duration-500 hover:scale-105"
                  alt={product.ten_san_pham}
                  onError={(e) => {
                    e.target.src =
                      "https://placehold.co/600x600?text=Demi+Mart";
                  }}
                />
              )}
            </div>
          </div>

          <div className="lg:col-span-6 xl:col-span-5 text-left space-y-4 lg:space-y-5 lg:sticky lg:top-4 px-1">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-[#006c49] text-white text-[7px] 2xl:text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter italic">
                  Demi Fresh
                </span>
                <p className="text-[9px] 2xl:text-[11px] text-slate-400 font-bold uppercase tracking-widest pt-1">
                  SKU: {selectedVariant?.sku || "N/A"}
                </p>
              </div>
              <h1 className="text-xl lg:text-2xl 2xl:text-4xl font-black text-[#1a1a1a] leading-tight tracking-tight uppercase italic">
                {product.ten_san_pham}
              </h1>
              {isMultiTier &&
                selectedVariant &&
                selectedVariant.ten_bien_the && (
                  <h2 className="text-sm lg:text-base font-bold text-[#006c49] mt-1.5 inline-block bg-[#006c49]/10 px-3 py-1 rounded-md">
                    Phân loại: {selectedVariant.ten_bien_the}
                  </h2>
                )}
            </div>

            <div className="flex items-baseline gap-3 border-b border-slate-100 pb-3 lg:pb-4">
              {selectedVariant ? (
                <div className="flex flex-col">
                  {originalPrice && (
                    <span
                      className="text-xs 2xl:text-sm text-slate-400 line-through font-bold mb-[-4px]"
                      translate="no"
                    >
                      {formatPrice(originalPrice)}
                    </span>
                  )}
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-3xl lg:text-4xl 2xl:text-5xl font-black tracking-tighter ${isFlashSale ? "text-[#ff4d4f]" : "text-[#006c49]"}`}
                      translate="no"
                    >
                      {formatPrice(currentPrice)}
                    </span>
                    {isFlashSale && (
                      <span className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-[10px] px-2 py-1 rounded shadow-sm font-black uppercase tracking-wider">
                        Đang Sale 🔥
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <span className="text-xl lg:text-2xl font-black text-rose-500 uppercase tracking-wide italic">
                  Tạm hết hàng
                </span>
              )}
            </div>

            <div className="space-y-3 lg:space-y-4">
              <p className="text-[10px] lg:text-[11px] 2xl:text-[13px] text-slate-500 leading-relaxed italic border-l-4 border-[#006c49] pl-3">
                "{product.mo_ta || "Sản phẩm tuyển chọn từ Demi Mart."}"
              </p>

              <div className="pt-2 space-y-4">
                {isMultiTier ? (
                  Object.entries(nhomPhanLoai).map(
                    ([tenThuocTinh, danhSachGiaTri]) => (
                      <div key={tenThuocTinh} className="space-y-2">
                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                          {tenThuocTinh}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {danhSachGiaTri.map((giaTri) => {
                            const isSelected =
                              typeof selectedAttributes[tenThuocTinh] ===
                                "string" && typeof giaTri === "string"
                                ? selectedAttributes[tenThuocTinh]
                                    .trim()
                                    .toLowerCase() ===
                                  giaTri.trim().toLowerCase()
                                : selectedAttributes[tenThuocTinh] === giaTri;
                            const isValid = isOptionValid(tenThuocTinh, giaTri);

                            return (
                              <button
                                key={giaTri}
                                onClick={() =>
                                  isValid &&
                                  handleAttributeSelect(tenThuocTinh, giaTri)
                                }
                                disabled={!isValid}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all border-2 ${
                                  isSelected
                                    ? "border-[#006c49] bg-[#006c49]/5 text-[#006c49]"
                                    : isValid
                                      ? "border-slate-200 bg-white text-slate-500 hover:border-[#006c49]/50"
                                      : "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed line-through opacity-50"
                                }`}
                              >
                                {giaTri}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ),
                  )
                ) : product.bien_the?.length > 1 ? (
                  <div className="flex flex-wrap gap-1.5 lg:gap-2">
                    {product.bien_the?.map((v, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setSelectedVariant(v);
                          const vMedia = product.media?.find(
                            (m) =>
                              String(m.ma_bien_the) === String(v.ma_bien_the),
                          );
                          if (vMedia) setMainMedia(vMedia);
                          navigate(
                            `/${country}/product/${category_slug}/${id}/${v.ma_bien_the}`,
                            { replace: true },
                          );
                        }}
                        className={`px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg text-[8px] lg:text-[9px] font-black uppercase tracking-widest transition-all border-2 ${
                          String(selectedVariant?.ma_bien_the) ===
                          String(v.ma_bien_the)
                            ? "border-[#006c49] bg-[#006c49] text-white shadow-md"
                            : "border-slate-100 bg-[#fcfcfc] text-slate-400 hover:border-slate-200"
                        }`}
                      >
                        {v.ten_bien_the}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="bg-[#fcfcfc] p-4 lg:p-6 2xl:p-8 rounded-[20px] lg:rounded-[24px] border border-slate-100 shadow-xl space-y-4 lg:space-y-6 mt-4">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      {isFlashSale ? "SL Mở Bán" : "Số lượng"}
                    </p>
                    <span className="text-[9px] text-[#006c49] font-bold">
                      (Kho: {stockCount})
                    </span>
                  </div>
                  <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 lg:p-1 shadow-sm">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={isOutOfStock}
                      className="w-8 h-8 lg:w-10 flex items-center justify-center hover:bg-slate-50 rounded-lg text-slate-600 disabled:opacity-20"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 lg:w-10 text-center font-bold text-slate-800">
                      {isOutOfStock ? 0 : quantity}
                    </span>
                    <button
                      onClick={() => {
                        if (quantity < stockCount) setQuantity(quantity + 1);
                        else
                          alert(`Kho chỉ còn tối đa ${stockCount} sản phẩm!`);
                      }}
                      disabled={isOutOfStock || quantity >= stockCount}
                      className="w-8 h-8 lg:w-10 flex items-center justify-center hover:bg-slate-50 rounded-lg text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className="text-[9px] font-black text-slate-400 uppercase tracking-widest"
                    translate="no"
                  >
                    Tạm tính
                  </p>
                  <p
                    className="text-xl lg:text-3xl font-black text-[#1a1a1a] tracking-tighter"
                    translate="no"
                  >
                    {!isOutOfStock
                      ? formatPrice(currentPrice * quantity)
                      : formatPrice(0)}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 lg:gap-4">
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className="flex items-center justify-center gap-2 bg-white text-[#006c49] border-2 border-[#006c49] py-3 lg:py-4 rounded-xl font-bold uppercase tracking-wider text-[10px] active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ShoppingCart size={16} strokeWidth={2.5} /> GIỎ HÀNG
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                  className="flex items-center justify-center gap-2 bg-[#ffb800] text-black py-3 lg:py-4 rounded-xl font-black uppercase tracking-wider text-[10px] active:scale-95 shadow-lg transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <CreditCard size={16} strokeWidth={2.5} /> MUA NGAY
                </button>
              </div>
            </div>

            <div className="flex gap-5 lg:gap-6 pt-2 border-t border-slate-50">
              <div className="flex items-center gap-2 text-[#006c49] font-bold text-[9px] uppercase tracking-tighter">
                <Truck size={16} /> Giao nhanh 2h
              </div>
              <div className="flex items-center gap-2 text-[#006c49] font-bold text-[9px] uppercase tracking-tighter">
                <ShieldCheck size={16} /> Bảo hành chính hãng
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 lg:mt-16 pt-8 border-t border-slate-100 grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 items-start">
          <div className="lg:col-span-8">
            <Feedback selectedVariant={selectedVariant} mainMedia={mainMedia} />
          </div>
          <div className="lg:col-span-4 lg:sticky lg:top-6">
            <RelatedProducts currentProduct={product} countryCode={country} />
          </div>
        </div>
        <div className="w-full mt-12">
          <RecommendedProducts currentProduct={product} />
        </div>
      </div>
    </div>
  );
}
