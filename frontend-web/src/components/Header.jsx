import React, { useState, useEffect, useContext, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext"; 
import { AuthContext } from "../context/AuthContext";
import Logo from "../assets/Demi Mart.png";
import { 
  Globe, ChevronDown, Check, Search, LogOut, MapPin, 
  ShoppingCart, Calendar, User, Gift, Menu 
} from "lucide-react";

const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const AUTH_BASE_URL = isLocalhost ? 'http://localhost:5001' : 'https://authservice-sz4p.onrender.com';

// Dùng hàm này thay thế cho mọi chỗ hiển thị ảnh
const getCleanImage = (url) => {
  if (!url) return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200';
  
  // Xóa mọi tham số cũ sau dấu '?' để tránh lỗi "?t=...?t=..."
  let cleanUrl = url.split('?')[0];
  
  // Nếu là link Cloudinary, thêm tham số timestamp duy nhất một lần
  if (cleanUrl.includes('cloudinary.com')) {
    return `${cleanUrl}?t=${Date.now()}`;
  }
  return cleanUrl;
};
export default function Header({ onOpenMenu }) {
  const { user: authUser, logout } = useContext(AuthContext);
  const { cart } = useCart(); 
  const navigate = useNavigate();
  const location = useLocation();

  const [isLangOpen, setIsLangOpen] = useState(false);
  const langRef = useRef(null);
  const [currentDate, setCurrentDate] = useState("Đang tải...");

  // --- 1. ĐỒNG BỘ USER & AVATAR TỨC THÌ ---
  const [displayUser, setDisplayUser] = useState(() => {
    const saved = localStorage.getItem('user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch (e) { return null; }
  });

  useEffect(() => {
    if (authUser) setDisplayUser(authUser);
    else setDisplayUser(null);
  }, [authUser]);

  // --- 2. LOGIC NGÀY THÁNG & ĐÓNG DROPDOWN OUTSIDE ---
  useEffect(() => {
    const options = { weekday: 'long', day: 'numeric', month: 'numeric' };
    const dateStr = new Date().toLocaleDateString('vi-VN', options);
    setCurrentDate(dateStr);

    function handleClickOutside(event) {
      if (langRef.current && !langRef.current.contains(event.target)) setIsLangOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const languages = [
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
  ];

  const [currentLang, setCurrentLang] = useState(() => {
    const saved = localStorage.getItem('demi_mart_lang');
    return languages.find(l => l.code === saved) || languages[0];
  });

  // --- 3. HÀM XỬ LÝ AVATAR ĐỘNG CHUẨN ĐƯỜNG TRUYỀN ---
  const getAvatarSrc = (userObj) => {
    if (!userObj) return `https://ui-avatars.com/api/?name=User&background=006c49&color=fff`;

    const url = userObj.avatar_url || userObj.avatar;
    const name = userObj.full_name || 'User';

    if (!url || url === "" || url.includes('unsplash.com')) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=006c49&color=fff`;
    }

    // Tách bỏ cấu trúc chuỗi truy vấn cũ một cách an toàn
    const cleanUrl = url.split('?')[0];

    if (cleanUrl.startsWith('http')) {
      // Giữ nguyên chuỗi CDN tuyệt đối và chỉ đính kèm duy nhất một dấu hỏi chống cache
      return `${cleanUrl}?t=${new Date().getTime()}`;
    }

    // Nếu là ảnh lưu cục bộ trong thư mục /uploads của Backend
    const cleanPath = cleanUrl.startsWith('/') ? cleanUrl : `/${cleanUrl}`;
    return `${AUTH_BASE_URL}${cleanPath}?t=${new Date().getTime()}`;
  };

  const handleLogout = async () => {
    try {
      await logout(); 
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate("/");
    } catch (error) { navigate("/"); }
  };

  const isAuthPage = ["/login", "/signup", "/forgot-password"].includes(location.pathname);

  return (
    <header className="fixed top-0 w-full z-[10000] font-sans shadow-sm bg-white/95 backdrop-blur-md min-h-[96px] md:min-h-[112px]">
      
      {/* --- TẦNG 1: LOGO, SEARCH BAR, USER ACTIONS --- */}
      <div className="h-[60px] md:h-[72px] px-3 md:px-10 flex items-center justify-between gap-2 border-b border-slate-50">
        
        <div className="flex items-center gap-1 md:gap-4 flex-shrink-0 min-w-[130px] md:min-w-[170px]">
          <button onClick={onOpenMenu} className="lg:hidden p-1.5 text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <Menu size={22} />
          </button>
          <Link to="/" className="transition-transform active:scale-95 flex-shrink-0 block">
            <img src={Logo} alt="Demi Mart" width="130" className="h-6 md:h-8 w-auto object-contain drop-shadow-sm" />
          </Link>
        </div>

        {!isAuthPage && (
          <div className="flex-1 max-w-xl relative group hidden sm:block min-h-[45px]">
            <input type="text" placeholder="Tìm sản phẩm trên siêu thị Demi Mart..." className="w-full bg-[#f3f6f9] border-2 border-transparent py-2 md:py-2.5 pl-5 pr-12 rounded-full outline-none focus:bg-white focus:border-[#006c49] transition-all text-xs md:text-sm font-bold text-slate-700 shadow-inner" />
            <button className="absolute right-1 top-1 bottom-1 w-10 md:w-12 flex items-center justify-center bg-[#006c49] text-white rounded-full transition-transform active:scale-90">
              <Search size={16} strokeWidth={3} />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 md:gap-6 flex-shrink-0 min-w-[160px] md:min-w-[300px] justify-end">
          
          {/* Bộ chọn ngôn ngữ */}
          <div className="relative" ref={langRef}>
            <button onClick={() => setIsLangOpen(!isLangOpen)} className="flex items-center gap-1 text-slate-600 hover:text-[#006c49] transition-colors">
              <Globe size={18} />
              <span className="text-[11px] font-black uppercase hidden md:block">{currentLang.code}</span>
              <ChevronDown size={12} className={`transition-transform duration-300 ${isLangOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isLangOpen && (
              <div className="absolute right-0 mt-4 w-48 bg-white border border-slate-100 rounded-xl shadow-2xl p-1 animate-fadeIn border-t-4 border-t-[#006c49]">
                {languages.map((l) => (
                  <button 
                    key={l.code} 
                    onClick={() => { setCurrentLang(l); setIsLangOpen(false); localStorage.setItem('demi_mart_lang', l.code); }} 
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all ${currentLang.code === l.code ? 'bg-[#e6f0ed] text-[#006c49]' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-2"><span>{l.flag}</span>{l.name}</div>
                    {currentLang.code === l.code && <Check size={14} strokeWidth={3} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Khối tài khoản thành viên */}
          <div className="flex items-center min-w-[100px] md:min-w-[140px] justify-end">
            {displayUser ? (
              <div className="flex items-center gap-2 md:gap-3 bg-[#f8fafc] p-1 md:p-1.5 rounded-full border border-slate-100 md:pr-3 group transition-all">
                <Link to="/profile" className="flex-shrink-0">
                  <img 
                    src={getAvatarSrc(displayUser)} 
                    className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm" 
                    alt="AVT" 
                    onError={(e) => { 
                      const fallbackName = displayUser?.full_name || 'User';
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=006c49&color=fff`; 
                    }}
                  />
                </Link>
                <div className="hidden lg:block text-left overflow-hidden">
                  <p className="text-[11px] font-black text-slate-900 leading-tight truncate max-w-[80px]">{displayUser.full_name}</p>
                </div>
                <button onClick={handleLogout} className="text-slate-300 hover:text-red-500 transition-all ml-1 active:scale-90"><LogOut size={16}/></button>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-slate-700 font-bold text-[12px] md:text-[14px] whitespace-nowrap">
                <User size={18} className="text-slate-800" />
                <div className="flex items-center">
                  <Link to="/login" className="hover:text-[#006c49] transition-colors">Đăng nhập</Link>
                  <span className="mx-1 text-slate-300 font-light hidden md:inline">/</span>
                  <Link to="/signup" className="hover:text-[#006c49] transition-colors hidden md:inline">Đăng ký</Link>
                </div>
              </div>
            )}
          </div>

          {/* Cụm nút Giỏ Hàng thông minh */}
          <Link to="/cart" className="bg-[#006c49] text-white p-2 md:px-5 md:py-2.5 rounded-full md:rounded-2xl flex items-center gap-2 shadow-lg shadow-[#006c49]/20 active:scale-95 transition-all flex-shrink-0 min-w-[44px] md:min-w-[120px] justify-center group">
            <div className="relative">
              <ShoppingCart size={18} strokeWidth={2.5} className="group-hover:rotate-12 transition-transform" />
              {cart && cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#fea619] text-[#161b22] text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#006c49] animate-bounce">
                  {cart.length}
                </span>
              )}
            </div>
            <span className="text-[11px] font-black uppercase hidden lg:block tracking-widest">Giỏ hàng</span>
          </Link>
        </div>
      </div>

      {/* --- TẦNG 2: DANH MỤC NAV, VỊ TRÍ, NGÀY THÁNG ĐỘNG --- */}
      <div className="h-9 md:h-10 bg-white border-b border-slate-100 px-3 md:px-10 flex items-center justify-between overflow-x-auto scrollbar-hide">
        <nav className="flex items-center gap-5 md:gap-8 whitespace-nowrap min-w-max">
          {["Toàn cầu+", "Mới về", "Bán chạy", "Ưu đãi"].map((item) => (
            <Link key={item} to="/" className="text-[10px] md:text-[11px] font-black text-slate-500 hover:text-[#006c49] uppercase tracking-widest transition-colors">{item}</Link>
          ))}
          <Link to="/" className="text-[10px] md:text-[11px] font-black text-[#a855f7] flex items-center gap-2">
            <Gift size={14} /> Giới thiệu nhận ngay $20!
          </Link>
        </nav>

        <div className="hidden md:flex items-center flex-shrink-0 ml-4">
          <div className="flex items-center gap-2 min-w-[140px] justify-end pr-4">
            <MapPin size={16} className="text-[#fea619] flex-shrink-0" />
            <span className="text-[10px] md:text-[11px] font-black text-slate-700 uppercase whitespace-nowrap">TP. Hồ Chí Minh</span>
          </div>
          
          <div className="flex items-center gap-2 border-l border-slate-100 pl-5 uppercase min-w-[165px] justify-start">
            <Calendar size={15} className="text-slate-400 flex-shrink-0" />
            <span className="text-[10px] md:text-[11px] font-black text-slate-600 whitespace-nowrap tabular-nums">
              {currentDate}
            </span>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; }
      `}} />
    </header>
  );
}
