import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useStore } from '../context/StoreContext'; 
import { Search, Tag, Flame, X, MapPin, Check } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { productApi } from "../api/axios";

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate(); 
  const { t } = useLanguage();
  
  const { currentStore, setCurrentStore, stores } = useStore(); 
  const [isStoreOpen, setIsStoreOpen] = useState(false);

  const [activeCategory, setActiveCategory] = useState('search');
  const [activeSubCategory, setActiveSubCategory] = useState(''); 
  const [openDropdown, setOpenDropdown] = useState(null);          

  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef(null);

  // 1. STATE LƯU TRỮ DỮ LIỆU TỪ API
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

    // 2. GỌI API LẤY DANH MỤC THÔNG QUA AXIOS INSTANCE ĐÃ ĐỒNG BỘ MIỀN
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await productApi.get('/products/categories');
        const data = response.data; 
        
        if (data && data.length > 0) {
          setCategories(data);
        }
      } catch (error) {
        console.error("Lỗi khi tải danh sách danh mục:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleScroll = () => {
    setIsScrolling(true);
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 1000);
  };

  const mainMenus = [
    { slug: 'search', key: 'sidebar.main.search', i: <Search size={20} /> },
    { slug: 'promotion', key: 'sidebar.main.promotion', i: <Tag size={20} /> },
    { slug: 'bestseller', key: 'sidebar.main.bestseller', i: <Flame size={20} /> },
  ];

  const footerLinks = [
    'sidebar.footerLinks.0','sidebar.footerLinks.1','sidebar.footerLinks.2','sidebar.footerLinks.3','sidebar.footerLinks.4','sidebar.footerLinks.5','sidebar.footerLinks.6'
  ];

  const handleMainMenuClick = (menuSlug) => {
    setActiveCategory(menuSlug);
    if (menuSlug === 'search') {
      if(window.innerWidth < 1024) onClose();
      const searchInput = document.getElementById('demi-search-bar');
      if (searchInput) {
        searchInput.focus();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleCategoryClick = (category) => {
    setActiveCategory(category.slug);
    navigate(`/category/${category.slug}`); 
    
    if (category.children) {
      setOpenDropdown(openDropdown === category.slug ? null : category.slug);
    } else {
      setOpenDropdown(null);
      setActiveSubCategory(''); 
    }

    if(window.innerWidth < 1024) onClose();
  };

  return (
    <>
      {/* 1. OVERLAY */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[10001] lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* 2. SIDEBAR MAIN */}
      <aside 
        onScroll={handleScroll}
        className={`fixed lg:sticky z-[10002] lg:z-[99] top-0 lg:top-[112px] h-full lg:h-[calc(100vh-112px)] bg-[#F8FAF9] border-r border-slate-100 overflow-y-auto py-6 px-4 font-sans transition-all duration-300 ease-in-out w-[280px] sm:w-[300px] lg:w-[260px] ${isOpen ? 'left-0' : '-left-[300px] lg:left-0'} ${isScrolling ? 'demi-scroll-active' : 'demi-scroll-idle'}`}
      >
        {/* NÚT ĐÓNG */}
        <button onClick={onClose} className="lg:hidden absolute right-4 top-4 p-2 bg-white rounded-full shadow-sm text-slate-500 active:scale-90 transition-all">
          <X size={20} strokeWidth={3} />
        </button>

        {/* --- CHỌN CỬA HÀNG --- */}
        <div className="mb-4 mt-8 lg:mt-0 relative">
          <div 
            onClick={() => setIsStoreOpen(!isStoreOpen)}
            className={`bg-white border ${isStoreOpen ? 'border-[#006c49]' : 'border-slate-100'} rounded-2xl p-4 cursor-pointer hover:shadow-md transition-all active:scale-[0.98] group shadow-sm`}
          >
            <p className="text-[10px] font-black text-slate-400 uppercase text-center mb-1 tracking-[2px]">{t('sidebar.current_store')}</p>
            <div className="flex items-center justify-center gap-2">
              <MapPin size={16} className="text-[#006c49]" />
              <span className="text-[14px] font-black text-[#161b22] tracking-tight group-hover:text-[#006c49] transition-colors line-clamp-1">
                {currentStore?.name}
              </span>
              <span className={`text-[10px] text-slate-400 transition-transform duration-300 ${isStoreOpen ? 'rotate-180' : ''}`}>▼</span>
            </div>
          </div>

          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isStoreOpen ? 'max-h-[200px] mt-2 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-2 flex flex-col gap-1">
              {stores?.map(store => (
                <div 
                  key={store.code}
                  onClick={() => {
                    setCurrentStore(store);
                    setIsStoreOpen(false);
                  }}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-[13px] font-bold transition-all
                    ${currentStore?.code === store.code ? 'bg-[#e6f0ed] text-[#006c49]' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                  `}
                >
                  {store.name}
                  {currentStore?.code === store.code && <Check size={16} />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MENU CHÍNH */}
        <nav className="space-y-1 mb-4 pb-4 border-b border-slate-200/60 shrink-0">
          {mainMenus.map(m => (
            <div 
              key={m.slug} 
              onClick={() => handleMainMenuClick(m.slug)}
              className={`flex items-center gap-4 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300
                ${activeCategory === m.slug 
                  ? 'bg-[#006c49] shadow-lg shadow-[#006c49]/20 text-white' 
                  : 'text-slate-900 hover:bg-[#e6f0ed] hover:text-[#006c49]'}`}
            >
              <span className={`transition-transform ${activeCategory === m.slug ? 'scale-110 text-white' : 'text-black'}`}>
                {m.i}
              </span>
              <span className="text-[14px] font-black tracking-tight uppercase">{t(m.key)}</span>
            </div>
          ))}
        </nav>

        {/* 3. DANH MỤC SẢN PHẨM TỪ API */}
        <div className="space-y-1 flex-1 pb-6">
          <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-3 ml-1">{t('sidebar.product_catalog')}</p>
          
          {isLoading ? (
            <div className="flex flex-col gap-3 px-3 py-4">
              <div className="h-10 bg-slate-100 rounded-2xl animate-pulse"></div>
              <div className="h-10 bg-slate-100 rounded-2xl animate-pulse"></div>
              <div className="h-10 bg-slate-100 rounded-2xl animate-pulse"></div>
              <div className="h-10 bg-slate-100 rounded-2xl animate-pulse"></div>
            </div>
          ) : (
            categories.map(c => {
              const isDropdownOpen = openDropdown === c.slug;
              const isParentActive = activeCategory === c.slug;

              return (
                <div key={c.slug} className="flex flex-col">
                  <div 
                    onClick={() => handleCategoryClick(c)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl cursor-pointer transition-all relative group
                      ${isParentActive ? 'bg-[#006c49] text-white shadow-md shadow-[#006c49]/15' : 'hover:bg-white/60 text-slate-600'}`}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base shadow-sm transition-all duration-300 border
                      ${isParentActive 
                        ? 'bg-white text-[#006c49] border-transparent scale-105' 
                        : 'bg-white border-slate-100 group-hover:bg-[#e6f0ed] text-black'}`}>
                      {c.i}
                    </div>
                    <span className={`text-[14.5px] flex-1 transition-colors ${isParentActive ? 'font-black text-white' : 'font-bold text-slate-600 group-hover:text-slate-800'}`}>
                      {t(`sidebar.categories.${c.slug}`)}
                    </span>
                    {c.hot && (
                      <span className="bg-[#fea619] text-[8px] text-[#684000] px-2 py-0.5 rounded-lg font-black uppercase tracking-tighter shadow-sm">{t('sidebar.hot')}</span>
                    )}
                  </div>

                  {/* KHỐI KẾT XUẤT DANH MỤC CON */}
                  {c.children && isDropdownOpen && (
                    <div className="flex flex-col gap-1 mt-1.5 mb-2 pl-4 pr-1 animate-fadeIn select-none">
                      {c.children.map(sub => {
                        const isSubActive = activeSubCategory === sub.slug;
                        return (
                          <button
                            key={sub.slug}
                            type="button"
                            onClick={() => {
                              setActiveSubCategory(sub.slug);
                              navigate(`/category/${c.slug}/${sub.slug}`);
                              if(window.innerWidth < 1024) onClose();
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-[14px] transition-all duration-200 outline-none
                              ${isSubActive 
                                ? 'bg-[#e6f0ed] text-[#006c49] font-bold shadow-sm' 
                                : 'text-slate-500 hover:text-slate-800 hover:bg-gray-50/80 font-medium'}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors
                              ${isSubActive ? 'bg-[#006c49]' : 'bg-slate-300'}`}
                            />
                            <span>{sub.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* 4. LIÊN KẾT PHỤ */}
        <div className="pt-6 border-t border-slate-200/60 space-y-3 px-3 shrink-0">
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {footerLinks.map((linkKey) => (
              <a key={linkKey} href="#" className="text-[10px] text-slate-400 font-black uppercase tracking-widest hover:text-[#006c49] transition-colors leading-tight">
                {t(linkKey)}
              </a>
            ))}
          </div>
          <p className="text-[9px] text-slate-300 font-black mt-4 uppercase tracking-[3px]">© 2026 DEMI MART</p>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          aside::-webkit-scrollbar { width: 6px; }
          aside::-webkit-scrollbar-track { background: transparent; }
          aside::-webkit-scrollbar-thumb {
            background-color: transparent;
            border-radius: 20px;
            background-clip: padding-box;
            transition: background-color 0.3s ease;
          }
          .demi-scroll-active::-webkit-scrollbar-thumb {
            background-color: #006c49 !important;
          }
        `}} />
      </aside>
    </>
  );
}