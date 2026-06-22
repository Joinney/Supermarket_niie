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
  const { user: authUser, logout } = useContext(AuthContext);
  const { cart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const { country_code } = useParams();

  const [searchKeyword, setSearchKeyword] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const suggestRef = useRef(null);
  const suggestTimer = useRef(null);

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

  // 🛠️ ĐÃ CẬP NHẬT: Luôn đẩy Việt Nam (VN) lên vị trí đầu danh sách Dropdown dịch trang
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

  // =====================================================================
  // 🛠️ ĐÃ SỬA DỨT ĐIỂM: Sửa lỗi map mã ngôn ngữ 'VI' thành mã quốc gia 'VN'
  // =====================================================================
  const handleLanguageAndStoreChange = (langCode) => {
    changeLanguage(langCode);

    // Chuẩn hóa chuẩn xác mã ngôn ngữ sang mã vùng quốc gia quản lý tiền tệ trong DB
    let targetStoreCode = langCode.toUpperCase();
    if (targetStoreCode === "VI") targetStoreCode = "VN";
    if (targetStoreCode === "EN") targetStoreCode = "US";
    if (targetStoreCode === "ZH") targetStoreCode = "CN";

    // Tìm kiếm cấu hình tỷ giá (Bọc toàn bộ toUpperCase để bảo đảm độ khớp)
    if (stores && stores.length > 0) {
      const matchedStore = stores.find(
        (s) => s.code?.toUpperCase() === targetStoreCode.toUpperCase(),
      );
      if (matchedStore) {
        setCurrencyStore(matchedStore); // Cập nhật tỷ giá và biểu tượng tiền ngay lập tức
      }
    }

    // Giữ nguyên vùng cửa hàng hiện tại trên thanh URL, chỉ dịch chữ và đổi tỷ giá tiền
    const activeStoreCode = currentStore?.code?.toLowerCase() || "vn";
    const currentPath = location.pathname;
    const pathSegments = currentPath.split("/");

    if (country_code && pathSegments[1] === country_code) {
      pathSegments[1] = activeStoreCode;
      navigate(pathSegments.join("/"));
    } else {
      navigate(`/${activeStoreCode}${currentPath === "/" ? "" : currentPath}`);
    }

    setIsLangOpen(false);
  };

  const handleSearch = () => {
    if (searchKeyword.trim()) {
      navigate(`/search?keyword=${encodeURIComponent(searchKeyword.trim())}`);
      setSearchKeyword("");
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
    if (cleanUrl.startsWith("http")) {
      return `${cleanUrl}?t=${new Date().getTime()}`;
    }
    const cleanPath = cleanUrl.startsWith("/") ? cleanUrl : `/${cleanUrl}`;
    return `${AUTH_BASE_URL}${cleanPath}?t=${new Date().getTime()}`;
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

  return (
    <header
      ref={headerRef}
      className="fixed top-0 w-full z-[10000] font-sans shadow-sm bg-white/95 backdrop-blur-md transition-all duration-300"
    >
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

      <div className="h-[60px] md:h-[72px] px-3 md:px-10 flex items-center justify-between gap-2 border-b border-slate-50">
        <div className="flex items-center gap-1 md:gap-4 flex-shrink-0 min-w-[130px] md:min-w-[170px]">
          <button
            onClick={onOpenMenu}
            className="lg:hidden p-1.5 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <Menu size={22} />
          </button>
          <Link
            to={country_code ? `/${country_code}` : "/"}
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
        {!isAuthPage && (
          <div className="flex-1 max-w-xl relative group hidden sm:block min-h-[45px]">
            <input
              id="demi-search-bar"
              type="text"
              placeholder={t("search_placeholder")}
              value={searchKeyword}
              onChange={(e) => {
                const v = e.target.value;
                setSearchKeyword(v);
                if (suggestTimer.current) clearTimeout(suggestTimer.current);
                if (v.trim()) {
                  suggestTimer.current = setTimeout(async () => {
                    try {
                      const currentCountryCode = currentStore?.code || "vn";
                      const res = await productApi.get(
                        `/products/search?keyword=${encodeURIComponent(v)}&limit=10&country=${currentCountryCode}`,
                      );
                      setSuggestions(res.data || []);
                      setIsSuggestOpen(true);
                    } catch (err) {
                      setSuggestions([]);
                      setIsSuggestOpen(false);
                    }
                  }, 250);
                } else {
                  setSuggestions([]);
                  setIsSuggestOpen(false);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (isSuggestOpen && suggestions.length > 0) {
                    const p = suggestions[0];
                    const country =
                      p.country_code || currentStore?.code || "vn";
                    const category = p.slug_danh_muc || "san-pham";
                    navigate(
                      `/${country}/product/${category}/${p.ma_san_pham}`,
                    );
                    setSearchKeyword("");
                    setIsSuggestOpen(false);
                  } else {
                    handleSearch();
                  }
                } else if (e.key === "ArrowDown") {
                  const first = suggestRef.current?.querySelector("button");
                  if (first) first.focus();
                }
              }}
              className="w-full bg-[#f3f6f9] border-2 border-transparent py-2 md:py-2.5 pl-5 pr-12 rounded-full outline-none focus:bg-white focus:border-[#006c49] transition-all text-xs md:text-sm font-bold text-slate-700 shadow-inner"
            />
            <button
              onClick={handleSearch}
              className="absolute right-1 top-1 bottom-1 w-10 md:w-12 flex items-center justify-center bg-[#006c49] text-white rounded-full transition-transform active:scale-90"
            >
              <Search size={16} strokeWidth={3} />
            </button>

            {isSuggestOpen && suggestions.length > 0 && (
              <div
                ref={suggestRef}
                className="absolute left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-2 max-h-[320px] overflow-y-auto overscroll-contain scrollbar-hide"
              >
                {suggestions.map((s) => (
                  <button
                    key={s.ma_san_pham}
                    onClick={() => {
                      const country =
                        s.country_code || currentStore?.code || "vn";
                      const category = s.slug_danh_muc || "san-pham";
                      navigate(
                        `/${country}/product/${category}/${s.ma_san_pham}`,
                      );
                      setIsSuggestOpen(false);
                      setSearchKeyword("");
                    }}
                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors text-left border-b border-slate-50 last:border-0"
                  >
                    <img
                      src={s.hinh_anh_chinh || "https://placehold.co/60x60"}
                      className="w-12 h-12 object-contain rounded-lg border border-slate-100"
                      alt={s.ten_san_pham}
                    />
                    <div className="flex-1 overflow-hidden">
                      <div className="font-bold text-sm text-slate-700 truncate">
                        {s.ten_san_pham}
                      </div>
                      <div className="text-xs font-black text-[#006c49]">
                        {formatCurrency(s.gia_ban_thap_nhat || 0)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

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
                  if (langCode === "us") langCode = "en";
                  if (langCode === "cn") langCode = "zh";

                  return (
                    <button
                      key={store.code}
                      onClick={() => handleLanguageAndStoreChange(langCode)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all ${currentLanguage.code === langCode ? "bg-[#e6f0ed] text-[#006c49]" : "text-slate-600 hover:bg-slate-50"}`}
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
                <div className="hidden lg:block text-left overflow-hidden">
                  <p className="text-[11px] font-black text-slate-900 leading-tight truncate max-w-[80px]">
                    {displayUser.full_name}
                  </p>
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

      <div className="h-9 md:h-10 bg-white border-b border-slate-100 px-3 md:px-10 flex items-center justify-between overflow-x-auto scrollbar-hide">
        <nav className="flex items-center gap-5 md:gap-8 whitespace-nowrap min-w-max">
          {["Toàn cầu+", "Mới về", "Bán chạy", "Ưu đãi"].map((item) => (
            <Link
              key={item}
              to={country_code ? `/${country_code}` : "/"}
              className="text-[10px] md:text-[11px] font-black text-slate-500 hover:text-[#006c49] uppercase tracking-widest transition-colors"
            >
              {item}
            </Link>
          ))}
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
