import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import Logo from "../../assets/Demi Mart.png"; 

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminRole");
    navigate("/admin/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-100 flex flex-col justify-between shrink-0 font-sans text-left selection:bg-emerald-100 sticky top-0">
      
      {/* 1. PHẦN TRÊN: LOGO, SEARCH & MAIN MENU (Chiếm không gian trên) */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        
        {/* LOGO AREA */}
        <div className="h-20 flex items-center px-6 justify-between gap-3 shrink-0">
          <Link to="/" className="transition-transform active:scale-95 flex-shrink-0 block">
            <img src={Logo} alt="Demi Mart" width="130" className="h-6 md:h-8 w-auto object-contain drop-shadow-sm" />
          </Link>
          <button className="w-5 h-5 border border-gray-100 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-400 text-[10px] hover:text-gray-600 transition">
            ❮
          </button>
        </div>

        {/* SEARCH INTERNAL */}
        <div className="px-4 mb-6 shrink-0">
          <div className="relative group">
            <span className="absolute left-3.5 top-2.5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 bg-[#f8f9fa] border border-transparent rounded-xl text-sm text-gray-700 placeholder-gray-400 outline-none focus:bg-white focus:border-gray-200 focus:ring-2 focus:ring-emerald-500/5 transition-all font-medium"
            />
          </div>
        </div>

        {/* MAIN MENU LIST */}
        <nav className="px-3">
          <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Main Menu</p>
          <div className="space-y-1">
            
            {/* Dashboard */}
            <button 
              onClick={() => navigate("/admin/dashboard")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition duration-150 group ${
                isActive("/admin/dashboard") && !isSettingsOpen ? "text-[#0d3b4c] font-semibold bg-gray-50" : "text-gray-600 hover:text-slate-900 hover:bg-gray-50/70"
              }`}
            >
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 text-gray-500 group-hover:text-slate-800 transition-colors">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
                <span>Dashboard</span>
              </div>
            </button>

            {/* Danh sách sản phẩm */}
            <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-slate-900 hover:bg-gray-50/70 transition group">
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 text-gray-500 group-hover:text-slate-800 transition-colors">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                </svg>
                <span>Danh sách sản phẩm</span>
              </div>
              <span className="text-gray-400 text-[10px]">❯</span>
            </button>

            {/* Nông trại / Sản xuất */}
            <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-slate-900 hover:bg-gray-50/70 transition group">
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 text-gray-500 group-hover:text-slate-800 transition-colors">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m-1.5-7.75l-4.5 1.636M17.25 3.545V10.75M4.5 7.364V21m4.5-15.273L13.5 4.09" />
                </svg>
                <span>Nông trại / Sản xuất</span>
              </div>
              <span className="text-gray-400 text-[10px]">❯</span>
            </button>

            {/* Đơn Hàng */}
            <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-slate-900 hover:bg-gray-50/70 transition group">
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 text-gray-500 group-hover:text-slate-800 transition-colors">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <span>Đơn Hàng</span>
              </div>
              <span className="text-gray-400 text-[10px]">❯</span>
            </button>

            {/* Kho Hàng */}
            <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-slate-900 hover:bg-gray-50/70 transition group">
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 text-gray-500 group-hover:text-slate-800 transition-colors">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
                <span>Kho Hàng</span>
              </div>
              <span className="text-gray-400 text-[10px]">❯</span>
            </button>

            {/* Khách Hàng */}
            <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-slate-900 hover:bg-gray-50/70 transition group">
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 text-gray-500 group-hover:text-slate-800 transition-colors">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-2.533-4.65l-1.448-.394A9.142 9.142 0 0112 17c-1.39 0-2.717-.309-3.915-.865l-1.448-.394a4.125 4.125 0 00-2.533 4.65 9.366 9.366 0 004.12 1.951M12 13.5a4.5 4.5 0 100-9 4.5 4.5 0 000 9zm0 0c1.012 0 1.98-.306 2.794-.833M12 13.5c-.815 0-1.783-.306-2.794-.833M18.75 10.5a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm0 0c.961 0 1.885-.312 2.642-.84M10.5 10.5a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm0 0c-.961 0-1.885-.312-2.642-.84" />
                </svg>
                <span>Khách Hàng</span>
              </div>
              <span className="text-gray-400 text-[10px]">❯</span>
            </button>
          </div>
        </nav>
      </div>

      {/* 2. PHẦN DƯỚI: TOÀN BỘ CỤM SETTINGS & LOGOUT (Luôn cố định sát đáy) */}
      <div className="bg-white pt-4 pb-2 border-t border-gray-50 shrink-0">
        <div className="px-3 space-y-4">
          <div>
            <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Settings</p>
            <div className="space-y-1">
              
              {/* Thanh tiêu đề cha: Tài khoản & Phân quyền */}
              <button 
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-[#bbf294] text-[#1e3d06] rounded-xl text-sm font-bold shadow-sm transition duration-150"
              >
                <div className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-[#305c0f]">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751A11.956 11.956 0 0112 2.714z" />
                  </svg>
                  <span>Tài khoản & Phân quyền</span>
                </div>
                <span className={`text-xs text-[#305c0f] font-bold transition-transform duration-200 ${isSettingsOpen ? "rotate-90" : ""}`}>
                  ❯
                </span>
              </button>

              {/* Các menu con Dropdown */}
              {isSettingsOpen && (
                <div className="mt-1 space-y-1 animate-fadeIn">
                  <button className="w-full flex items-center gap-3 pl-6 pr-4 py-2.5 rounded-xl text-sm font-semibold text-[#5c6f75] hover:bg-gray-50/80 transition text-left">
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                    <span>Danh sách quản lý nội bộ</span>
                  </button>

                  <button className="w-full flex items-center gap-3 pl-6 pr-4 py-2.5 bg-[#e9f7df] rounded-xl text-sm font-bold text-[#2a4e15] text-left transition">
                    <span className="w-1.5 h-1.5 bg-[#2a4e15] rounded-full"></span>
                    <span>Danh sách vai trò</span>
                  </button>
                </div>
              )}

              {/* Settings tổng quát */}
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-slate-900 hover:bg-gray-50/70 transition group mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 text-gray-500 group-hover:text-slate-800 transition-colors">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.767c-.29.222-.434.59-.374.953.003.018.006.035.006.053v.068c0 .018-.003.035-.006.053-.06.363.084.731.374.953l1.004.767a1.125 1.125 0 01.26 1.43l-1.297 2.247a1.125 1.125 0 01-1.37.49l-1.216-.456c-.356-.133-.751-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.767c.29-.222.434-.59.374-.953a.53.53 0 01-.006-.053v-.068c0-.018.003-.035.006-.053.06-.363-.084-.731-.374-.953l-1.004-.767a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.49l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>

        {/* Nút Log out (Nằm cuối cùng của khối dưới) */}
        <div className="px-3 mt-4">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-[#f06565] hover:bg-red-50/60 transition-all duration-150 group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-[#f06565]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            <span>Log out</span>
          </button>
        </div>
      </div>

    </aside>
  );
}