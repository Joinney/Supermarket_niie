import React, { useState, useEffect, useContext, useRef } from "react";
import { useNavigate, Link, useLocation, useParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import Logo from "../assets/Demi Mart.png";
import { productApi } from "../api/axios";
import { useLanguage } from "../context/LanguageContext";
import { useStore } from "../context/StoreContext";
import {
  Globe,
  ChevronDown,
  Check,
  Search,
  LogOut,
  MapPin,
  ShoppingCart,
  Calendar,
  User,
  Gift,
  Menu,
  X,
} from "lucide-react";

const isLocalhost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";
const AUTH_BASE_URL = isLocalhost
  ? "http://localhost:5001"
  : "https://authservice-sz4p.onrender.com";

export default function Header({ onOpenMenu }) {
  // 🌟 CẬP NHẬT: Lấy thêm getMembershipTier từ AuthContext
  const { user: authUser, logout, getMembershipTier } = useContext(AuthContext);
  const { cart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const { country_code } = useParams();

  // State cho Tìm kiếm
  const [searchKeyword, setSearchKeyword] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [categorySuggestions, setCategorySuggestions] = useState([]);
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const suggestRef = useRef(null);
  const suggestTimer = useRef(null);

  // Dữ liệu Tìm kiếm phổ biến
  const popularSearches = [
    { text: "nước mắm", hot: true },
    { text: "rau", hot: true },
    { text: "bánh tráng", hot: true },
    { text: "cá", hot: false },
    { text: "danh sách mua sắm", hot: false },
    { text: "bún", hot: false },
    { text: "tôm", hot: false },
    { text: "gà", hot: false },
    { text: "giá", hot: false },
    { text: "gạo", hot: false },
  ];

  const { currentLanguage, changeLanguage, t } = useLanguage();
  const { currentStore, setCurrencyStore, stores, formatPrice } = useStore();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langRef = useRef(null);
  const [currentDate, setCurrentDate] = useState("Đang tải...");

  const formatCurrency = (amountVND) => {
    return formatPrice
      ? formatPrice(amountVND)
      : `${amountVND.toLocaleString()}đ`;
  };

  const sortedStores =
    stores && stores.length > 0
      ? [...stores].sort((a, b) =>
          a.code?.toUpperCase() === "VN"
            ? -1
            : b.code?.toUpperCase() === "VN"
              ? 1
              : 0,
        )
      : [];

  const handleLanguageChange = (langCode, countryCode) => {
    changeLanguage(langCode);

    if (langCode === "vi") {
      setCurrencyStore({
        code: "VN",
        currency: "VND",
        symbol: "₫",
        locale: "vi-VN",
        rate: 1,
      });
    } else if (langCode === "en") {
      setCurrencyStore({
        code: "US",
        currency: "USD",
        symbol: "$",
        locale: "en-US",
        rate: 0.00004,
      });
    } else if (langCode === "zh") {
      setCurrencyStore({
        code: "CN",
        currency: "CNY",
        symbol: "¥",
        locale: "zh-CN",
        rate: 0.00029,
      });
    }

    const targetCode = (countryCode || "vn").toLowerCase();
    window.location.href = `/${targetCode}`;
    setIsLangOpen(false);
  };

  const handlePopularSearchClick = (keyword) => {
    setSearchKeyword(keyword);
    setIsSuggestOpen(false);
    navigate(`/search?keyword=${encodeURIComponent(keyword)}`);
  };

  const handleSearch = () => {
    if (searchKeyword.trim()) {
      navigate(`/search?keyword=${encodeURIComponent(searchKeyword.trim())}`);
      setSearchKeyword("");
      setIsSuggestOpen(false);
    }
  };

  const [showBanner, setShowBanner] = useState(true);
  const [timeLeft, setTimeLeft] = useState(11 * 3600 + 59 * 60 + 23);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (num) => String(num).padStart(2, "0");
    return {
      h: pad(hours).split(""),
      m: pad(minutes).split(""),
      s: pad(seconds).split(""),
    };
  };

  const timeChunks = formatTime(timeLeft);
  const headerRef = useRef(null);

  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        const height = headerRef.current.offsetHeight;
        document.documentElement.style.setProperty(
          "--header-height",
          `${height}px`,
        );
      }
    };
    updateHeaderHeight();
    window.addEventListener("resize", updateHeaderHeight);
    return () => window.removeEventListener("resize", updateHeaderHeight);
  }, [showBanner]);

  const [displayUser, setDisplayUser] = useState(() => {
    const saved = localStorage.getItem("user");
    try {
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setDisplayUser(null);
      return;
    }
    if (authUser) setDisplayUser(authUser);
    else setDisplayUser(null);
  }, [authUser]);

  useEffect(() => {
    const options = { weekday: "long", day: "numeric", month: "numeric" };
    const dateStr = new Date().toLocaleDateString("vi-VN", options);
    setCurrentDate(dateStr);

    function handleClickOutside(event) {
      if (langRef.current && !langRef.current.contains(event.target))
        setIsLangOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function onDocClick(e) {
      if (suggestRef.current && !suggestRef.current.contains(e.target)) {
        const input = document.getElementById("demi-search-bar");
        if (input && input.contains(e.target)) return;
        setIsSuggestOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const getAvatarSrc = (userObj) => {
    if (!userObj)
      return `https://ui-avatars.com/api/?name=User&background=006c49&color=fff`;
    
    const url = userObj.avatar_url || userObj.avatar;
    const name = userObj.full_name || "User";

    if (!url || url === "" || url.includes("unsplash.com")) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=006c49&color=fff`;
    }
    
    const cleanUrl = url.split("?")[0];
    if (cleanUrl.startsWith("http")) return cleanUrl;

    const cleanPath = cleanUrl.startsWith("/") ? cleanUrl : `/${cleanUrl}`;
    return `${AUTH_BASE_URL}${cleanPath}`;
  };

  const handleLogout = async () => {
    try {
      await logout();
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/");
    } catch (error) {
      navigate("/");
    }
  };

  const isAuthPage = ["/login", "/signup", "/forgot-password"].includes(
    location.pathname,
  );

  // 🌟 THÊM: HÀM RENDER HUY HIỆU VIP TRÊN HEADER
  const renderHeaderTierBadge = () => {
    const tier = getMembershipTier();
    if (!tier) return null;

    const name = String(tier).toUpperCase();
    if (name === "KIM CƯƠNG") {
      return (
        <span className="bg-indigo-50 text-indigo-600 border border-indigo-200 text-[8px] font-black px-1.5 py-[1px] rounded-full uppercase tracking-wider shadow-sm flex items-center gap-0.5 mt-0.5 w-max leading-none">
          💎 {name}
        </span>
      );
    }
    if (name === "VÀNG") {
      return (
        <span className="bg-amber-50 text-amber-600 border border-amber-200 text-[8px] font-black px-1.5 py-[1px] rounded-full uppercase tracking-wider shadow-sm flex items-center gap-0.5 mt-0.5 w-max leading-none">
          👑 {name}
        </span>
      );
    }
    return (
      <span className="bg-slate-50 text-slate-500 border border-slate-200 text-[8px] font-black px-1.5 py-[1px] rounded-full uppercase tracking-wider shadow-sm flex items-center gap-0.5 mt-0.5 w-max leading-none">
        🥈 BẠC
      </span>
    );
  };

  return (
    <header
      ref={headerRef}
      className="fixed top-0 w-full z-[10000] font-sans shadow-sm bg-white/95 backdrop-blur-md transition-all duration-300"
    >
      {/* Banner Khuyến Mãi */}
      {showBanner && (
        <div className="w-full bg-[#fea619] text-slate-900 h-10 md:h-11 flex items-center justify-between px-4 relative overflow-hidden text-xs md:text-sm font-bold tracking-wide shadow-sm">
          <button
            onClick={() => setShowBanner(false)}
            className="text-slate-800 hover:text-black transition-colors p-1 z-10"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-3 whitespace-nowrap">
            <span>Giao hàng miễn phí cho 5 đơn hàng đầu tiên của bạn</span>
            <div className="flex items-center gap-1 font-black text-white text-[11px] md:text-xs">
              <span className="w-5 h-5 bg-slate-900 rounded flex items-center justify-center shadow-sm tabular-nums">
                {timeChunks.h[0]}
              </span>
              <span className="w-5 h-5 bg-slate-900 rounded flex items-center justify-center shadow-sm tabular-nums">
                {timeChunks.h[1]}
              </span>
              <span className="text-slate-900 font-black -mt-0.5 mx-0.5">
                :
              </span>
              <span className="w-5 h-5 bg-slate-900 rounded flex items-center justify-center shadow-sm tabular-nums">
                {timeChunks.m[0]}
              </span>
              <span className="w-5 h-5 bg-slate-900 rounded flex items-center justify-center shadow-sm tabular-nums">
                {timeChunks.m[1]}
              </span>
              <span className="text-slate-900 font-black -mt-0.5 mx-0.5">
                :
              </span>
              <span className="w-5 h-5 bg-slate-900 rounded flex items-center justify-center shadow-sm tabular-nums">
                {timeChunks.s[0]}
              </span>
              <span className="w-5 h-5 bg-slate-900 rounded flex items-center justify-center shadow-sm tabular-nums">
                {timeChunks.s[1]}
              </span>
            </div>
          </div>
          <div className="w-5 opacity-0 pointer-events-none"></div>
        </div>
      )}

      {/* Thanh Header Chính */}
      <div className="h-[60px] md:h-[72px] px-3 md:px-10 flex items-center justify-between gap-2 border-b border-slate-50">
        <div className="flex items-center gap-1 md:gap-4 flex-shrink-0 min-w-[130px] md:min-w-[170px]">
          <button
            onClick={onOpenMenu}
            className="lg:hidden p-1.5 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <Menu size={22} />
          </button>
          <Link
            to={country_code ? `/${country_code.toLowerCase()}` : "/vn"}
            className="transition-transform active:scale-95 flex-shrink-0 block"
            onClick={() => window.scrollTo(0, 0)}
          >
            <img
              src={Logo}
              alt="Demi Mart"
              width="130"
              className="h-6 md:h-8 w-auto object-contain drop-shadow-sm"
            />
          </Link>
        </div>

        {/* Ô Tìm Kiếm - Trung Tâm */}
        {!isAuthPage && (
          <div className="flex-1 max-w-xl relative group hidden sm:block min-h-[45px]">
            <input
              id="demi-search-bar"
              type="text"
              placeholder={t("search_placeholder")}
              value={searchKeyword}
              onFocus={() => setIsSuggestOpen(true)}
              onChange={(e) => {
                const v = e.target.value;
                setSearchKeyword(v);
                setIsSuggestOpen(true);

                if (suggestTimer.current) clearTimeout(suggestTimer.current);

                if (v.trim().length === 0) {
                  setSuggestions([]);
                  setCategorySuggestions([]);
                  return;
                }

                suggestTimer.current = setTimeout(async () => {
                  const currentCountryCode = currentStore?.code || "vn";
                  try {
                    if (v.trim().length > 0 && v.trim().length < 3) {
                      const res = await productApi.get(
                        `/products/categories/search?keyword=${encodeURIComponent(v)}&country=${currentCountryCode}`,
                      );
                      setCategorySuggestions(res.data || []);
                      setSuggestions([]);
                    } else if (v.trim().length >= 3) {
                      const res = await productApi.get(
                        `/products/search?keyword=${encodeURIComponent(v)}&limit=10&country=${currentCountryCode}`,
                      );
                      setSuggestions(res.data || []);
                      setCategorySuggestions([]);
                    }
                  } catch (err) {
                    setSuggestions([]);
                    setCategorySuggestions([]);
                  }
                }, 250);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              className="w-full bg-[#f3f6f9] border-2 border-transparent py-2 md:py-2.5 pl-5 pr-12 rounded-full outline-none focus:bg-white focus:border-[#006c49] transition-all text-xs md:text-sm font-bold text-slate-700 shadow-inner"
            />
            <button
              onClick={handleSearch}
              className="absolute right-1 top-1 bottom-1 w-10 md:w-12 flex items-center justify-center bg-[#006c49] text-white rounded-full transition-transform active:scale-90 z-10"
            >
              <Search size={16} strokeWidth={3} />
            </button>

            {/* Bảng Gợi Ý Tìm Kiếm (3 Trạng thái) */}
            {isSuggestOpen && (
              <div
                ref={suggestRef}
                className="absolute left-0 right-0 mt-3 bg-white border border-slate-100 rounded-3xl shadow-xl z-50 p-4 max-h-[450px] overflow-y-auto overscroll-contain scrollbar-hide"
              >
                {/* 1. KHI CHƯA GÕ GÌ -> Hiển thị Tìm kiếm phổ biến */}
                {searchKeyword.trim().length === 0 && (
                  <div className="animate-fadeIn">
                    <h4 className="text-[13px] font-bold text-slate-800 mb-3 ml-1">
                      Những tìm kiếm phổ biến
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {popularSearches.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => handlePopularSearchClick(item.text)}
                          className="px-3.5 py-1.5 border border-slate-200 rounded-full text-xs font-semibold text-slate-600 hover:border-[#006c49] hover:text-[#006c49] transition-all flex items-center gap-1 active:scale-95 bg-white hover:bg-[#f3f6f9]"
                        >
                          {item.hot && (
                            <span className="text-red-500 text-sm leading-none">
                              🔥
                            </span>
                          )}
                          {item.text}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. GÕ TỪ 1 ĐẾN 2 KÝ TỰ -> Hiển thị Danh mục */}
                {searchKeyword.trim().length > 0 &&
                  searchKeyword.trim().length < 3 && (
                    <div className="animate-fadeIn">
                      {categorySuggestions.length > 0 ? (
                        <div className="grid grid-cols-4 md:grid-cols-5 gap-y-4 gap-x-2">
                          {categorySuggestions.map((cat) => (
                            <button
                              key={`${cat.loai_danh_muc}-${cat.ma_danh_muc}`}
                              onClick={() => {
                                const currentCountryCode = String(
                                  currentStore?.code || "vn",
                                ).toLowerCase();
                                navigate(
                                  `/${currentCountryCode}/category/${cat.slug}`,
                                );
                                setIsSuggestOpen(false);
                                setSearchKeyword("");
                              }}
                              className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity group"
                            >
                              <div className="w-16 h-16 bg-[#f8fafc] rounded-2xl flex items-center justify-center p-2 group-hover:shadow-md transition-shadow border border-slate-50">
                                <img
                                  src={
                                    cat.hinh_anh || "https://placehold.co/60x60"
                                  }
                                  alt={cat.ten_danh_muc}
                                  className="w-full h-full object-contain mix-blend-multiply"
                                />
                              </div>
                              <span className="text-[11px] font-bold text-slate-700 text-center line-clamp-2 px-1 leading-tight group-hover:text-[#006c49]">
                                {cat.ten_danh_muc}
                              </span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-sm font-semibold text-slate-400 py-6">
                          Không tìm thấy danh mục liên quan.
                        </div>
                      )}
                    </div>
                  )}

                {/* 3. GÕ TỪ 3 KÝ TỰ TRỞ LÊN -> Hiển thị Sản phẩm */}
                {searchKeyword.trim().length >= 3 && (
                  <div className="animate-fadeIn">
                    {suggestions.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {suggestions.map((s) => (
                          <button
                            key={s.ma_san_pham}
                            onClick={() => {
                              const country = String(
                                s.country_code || currentStore?.code || "vn",
                              ).toLowerCase();
                              const category = s.slug_danh_muc || "san-pham";
                              navigate(
                                `/${country}/product/${category}/${s.ma_san_pham}`,
                              );
                              setIsSuggestOpen(false);
                              setSearchKeyword("");
                            }}
                            className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-[#f8fafc] transition-colors text-left border border-transparent hover:border-slate-100"
                          >
                            <img
                              src={
                                s.hinh_anh_chinh || "https://placehold.co/60x60"
                              }
                              className="w-14 h-14 object-contain rounded-xl border border-slate-100 bg-white p-1"
                              alt={s.ten_san_pham}
                            />
                            <div className="flex-1 overflow-hidden">
                              <div className="font-bold text-sm text-slate-800 truncate mb-0.5">
                                {s.ten_san_pham}
                              </div>
                              <div className="text-xs font-black text-[#006c49] bg-[#e6f0ed] inline-block px-2 py-0.5 rounded-md">
                                {formatCurrency(s.gia_ban_thap_nhat || 0)}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-sm font-semibold text-slate-400 py-6">
                        Không tìm thấy sản phẩm nào.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Khối Giao diện Phải (Ngôn ngữ, User, Giỏ hàng) */}
        <div className="flex items-center gap-2 md:gap-6 flex-shrink-0 min-w-[160px] md:min-w-[300px] justify-end">
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-1 text-slate-600 hover:text-[#006c49] transition-colors"
            >
              <Globe size={18} />
              <span className="text-[11px] font-black uppercase hidden md:block">
                {currentLanguage.code}
              </span>
              <ChevronDown
                size={12}
                className={`transition-transform duration-300 ${isLangOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isLangOpen && (
              <div className="absolute right-0 mt-4 w-48 bg-white border border-slate-100 rounded-xl shadow-2xl p-1 animate-fadeIn border-t-4 border-t-[#006c49]">
                {sortedStores.map((store) => {
                  let langCode = store.code.toLowerCase();
                  if (langCode === "vn") langCode = "vi";
                  if (langCode === "us") langCode = "en";
                  if (langCode === "cn") langCode = "zh";

                  return (
                    <button
                      key={store.code}
                      type="button"
                      onClick={() => handleLanguageChange(langCode, store.code)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                        currentLanguage.code === langCode
                          ? "bg-[#e6f0ed] text-[#006c49]"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{store.flag}</span>
                        {store.name}
                      </div>
                      {currentLanguage.code === langCode && (
                        <Check size={14} strokeWidth={3} />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center min-w-[100px] md:min-w-[140px] justify-end">
            {displayUser ? (
              <div className="flex items-center gap-2 md:gap-3 bg-[#f8fafc] p-1 md:p-1.5 rounded-full border border-slate-100 md:pr-3 group transition-all">
                <Link to="/profile" className="flex-shrink-0">
                  <img
                    src={getAvatarSrc(displayUser)}
                    className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
                    alt="AVT"
                    onError={(e) => {
                      const fallbackName = displayUser?.full_name || "User";
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=006c49&color=fff`;
                    }}
                  />
                </Link>
                <div className="hidden lg:flex flex-col justify-center text-left overflow-hidden min-w-[70px]">
                  <p className="text-[11px] font-black text-slate-900 leading-tight truncate max-w-[90px]">
                    {displayUser.full_name}
                  </p>
                  {renderHeaderTierBadge()}
                </div>
                <button
                  onClick={handleLogout}
                  className="text-slate-300 hover:text-red-500 transition-all ml-1 active:scale-90"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-slate-700 font-bold text-[12px] md:text-[14px] whitespace-nowrap">
                <User size={18} className="text-slate-800" />
                <div className="flex items-center">
                  <Link
                    to="/login"
                    className="hover:text-[#006c49] transition-colors"
                  >
                    {t("login")}
                  </Link>
                  <span className="mx-1 text-slate-300 font-light hidden md:inline">
                    /
                  </span>
                  <Link
                    to="/signup"
                    className="hover:text-[#006c49] transition-colors hidden md:inline"
                  >
                    {t("signup")}
                  </Link>
                </div>
              </div>
            )}
          </div>

          <Link
            id="cart-icon"
            to="/cart"
            className="bg-[#006c49] text-white p-2 md:px-5 md:py-2.5 rounded-full md:rounded-2xl flex items-center gap-2 shadow-lg shadow-[#006c49]/20 active:scale-95 transition-all flex-shrink-0 min-w-[44px] md:min-w-[120px] justify-center group"
          >
            <div className="relative">
              <ShoppingCart
                size={18}
                strokeWidth={2.5}
                className="group-hover:rotate-12 transition-transform"
              />
              {cart && cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#fea619] text-[#161b22] text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#006c49] animate-bounce">
                  {cart.length}
                </span>
              )}
            </div>
            <span className="text-[11px] font-black uppercase hidden lg:block tracking-widest">
              {t("cart")}
            </span>
          </Link>
        </div>
      </div>

      {/* Thanh Menu Phụ */}
      <div className="h-9 md:h-10 bg-white border-b border-slate-100 px-3 md:px-10 flex items-center justify-between overflow-x-auto scrollbar-hide">
        <nav className="flex items-center gap-5 md:gap-8 whitespace-nowrap min-w-max">
          {["Toàn cầu+", "Mới về", "Bán chạy", "Ưu đãi"].map((item) => {
            // 🌟 CẬP NHẬT: Định tuyến riêng cho "Toàn cầu+" để khớp với route /global
            const targetPath =
              item === "Toàn cầu+"
                ? "/global"
                : country_code
                  ? `/${country_code.toLowerCase()}`
                  : "/vn";

            return (
              <Link
                key={item}
                to={targetPath}
                className="text-[10px] md:text-[11px] font-black text-slate-500 hover:text-[#006c49] uppercase tracking-widest transition-colors"
              >
                {item}
              </Link>
            );
          })}
          <Link
            to="/"
            className="text-[10px] md:text-[11px] font-black text-[#a855f7] flex items-center gap-2"
          >
            <Gift size={14} /> Giới thiệu nhận ngay $20!
          </Link>
        </nav>

        <div className="hidden md:flex items-center flex-shrink-0 ml-4">
          <div className="flex items-center gap-2 min-w-[140px] justify-end pr-4">
            <MapPin size={16} className="text-[#fea619] flex-shrink-0" />
            <span className="text-[10px] md:text-[11px] font-black text-slate-700 uppercase whitespace-nowrap">
              TP. Hồ Chí Minh
            </span>
          </div>

          <div className="flex items-center gap-2 border-l border-slate-100 pl-5 uppercase min-w-[165px] justify-start">
            <Calendar size={15} className="text-slate-400 flex-shrink-0" />
            <span className="text-[10px] md:text-[11px] font-black text-slate-600 whitespace-nowrap tabular-nums">
              {currentDate}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}