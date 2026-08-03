import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../../context/SocketContext";

export default function Header() {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const socket = useSocket();
  
  // Trạng thái lưu trữ dữ liệu Live của tài khoản
  const [adminData, setAdminData] = useState({
    full_name: "Quản trị viên",
    username: "admin",
    email: "admin@demimart.com",
    avatar_url: null,
    status: "Đang hoạt động",
    role: "Admin" 
  });

  // 🎯 1. NẠP DỮ LIỆU BAN ĐẦU TỪ LOCALSTORAGE
  useEffect(() => {
    const info = localStorage.getItem("adminInfo");
    if (info) {
      try {
        const parsed = JSON.parse(info);
        const currentStatus = parsed.status === "inactive" ? "Tạm ngưng" : "Đang hoạt động";
        setAdminData({
          ...parsed,
          status: currentStatus,
          role: parsed.role || "Admin"
        });
      } catch (e) {
        console.error("Lỗi đọc thông tin Admin trên Header:", e);
      }
    }
  }, []);

  // 🎯 2. REAL-TIME LISTENERS: CẬP NHẬT ẢNH VÀ THÔNG TIN LIVE KHI ADMIN SỬA TRÊN HỆ THỐNG
  useEffect(() => {
    const info = localStorage.getItem("adminInfo");
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (!info && !storedUser) return;
    
    if (!socket) return; // 🌟 Chờ sóng socket sẵn sàng

    try {
      const parsedInfo = info ? JSON.parse(info) : {};
      const currentUserId = parsedInfo.id || parsedInfo.user_id || storedUser.id || storedUser.user_id;
      
      if (!currentUserId) return;

      socket.emit('join_user_room', currentUserId);

      // Tách hàm callback ra
      const handleMatrixChanged = () => {
        const updatedInfo = localStorage.getItem("adminInfo");
        if (updatedInfo) {
          const parsed = JSON.parse(updatedInfo);
          setAdminData(prev => ({
            ...prev,
            ...parsed,
            status: parsed.status === "inactive" ? "Tạm ngưng" : "Đang hoạt động"
          }));
        }
      };

      socket.on('permission_matrix_changed', handleMatrixChanged);

      return () => {
        // 🌟 KHÔNG NGẮT MẠNG, CHỈ TẮT LẮNG NGHE
        socket.off('permission_matrix_changed', handleMatrixChanged);
      };
    } catch (err) {
      console.error("Lỗi đồng bộ socket trên Header:", err);
    }
  }, [socket]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminRefreshToken");
    localStorage.removeItem("adminRole");
    localStorage.removeItem("adminInfo");
    navigate("/admin/login", { replace: true });
  };

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 font-sans shrink-0 select-none relative z-30">
      
      {/* Cụm điều khiển bên trái */}
      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-gray-50 rounded-xl text-gray-500 hover:text-gray-800 transition-colors duration-150 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
      </div>

      {/* Cụm công cụ bên phải */}
      <div className="flex items-center gap-3">
        
        {/* Nút Tìm kiếm */}
        <button className="p-2 hover:bg-gray-50 rounded-xl text-gray-500 hover:text-gray-800 transition-colors duration-150 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </button>

        {/* Nút Chuông Thông báo */}
        <button className="relative p-2 hover:bg-gray-50 rounded-xl text-gray-500 hover:text-gray-800 transition-colors duration-150 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full ring-2 ring-white"></span>
        </button>

        <div className="h-5 w-[1px] bg-gray-200 mx-1"></div>

        {/* ================= KHU VỰC DROPDOWN PROFILE ================= */}
        <div className="relative">
          
          <div 
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2.5 cursor-pointer py-1 px-2 rounded-xl hover:bg-gray-50 transition-all duration-150 border border-transparent hover:border-gray-100"
          >
            {/* ĐỒNG BỘ ẢNH ĐẠI DIỆN LIVE TỪ CLOUDINARY HOẶC TRẢ VỀ CHỮ CÁI NẾU NULL */}
            {adminData.avatar_url ? (
              <img 
                src={adminData.avatar_url} 
                alt="avatar" 
                className="w-8 h-8 rounded-full object-cover ring-2 ring-[#006c49]/20 shadow-sm"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#006c49] text-white font-black flex items-center justify-center text-xs shadow-inner shrink-0">
                {(adminData.full_name || adminData.username || "A").charAt(0).toUpperCase()}
              </div>
            )}

            {/* HIỂN THỊ STATUS Ở BÊN NGOÀI */}
            <div className="flex flex-col text-left">
              <span className="text-xs font-black text-gray-800 max-w-[120px] truncate leading-tight">
                {adminData.full_name || adminData.username}
              </span>
              <span className="text-[10px] font-bold text-emerald-600 tracking-wider flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                {adminData.status}
              </span>
            </div>

            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              strokeWidth={2.5} 
              stroke="currentColor" 
              className={`w-3 h-3 text-gray-400 transition-transform duration-200 ml-0.5 shrink-0 ${showDropdown ? 'rotate-180' : ''}`}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </div>

          {showDropdown && (
            <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)}></div>
          )}

          {/* BẢNG MENU DROPDOWN */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2.5 px-2 z-50 animate-fadeIn">
              
              <div className="px-2.5 py-1.5 border-b border-gray-50 mb-1 text-left">
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Signed in as</p>
                <p className="text-xs font-black text-gray-900 truncate mt-0.5">{adminData.email || `${adminData.username}@demimart.com`}</p>
                
                <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-100 max-w-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0"></span>
                  <span className="truncate">Role: {adminData.role}</span>
                </div>
              </div>

              {/* Nhóm chức năng */}
              <div className="space-y-0.5 pt-1 text-left">
                
                {/* 1. NÚT HỒ SƠ CÁ NHÂN */}
                <button 
                  onClick={() => { setShowDropdown(false); navigate('/admin/profile'); }} 
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors text-left"
                >
                  <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="truncate">Hồ sơ cá nhân</span>
                </button>

                {/* 2. NÚT CÀI ĐẶT QUẢN TRỊ */}
                {adminData.role === "Admin" && (
                  <button 
                    onClick={() => { setShowDropdown(false); navigate('/admin/authz/danhsachvaitro'); }} 
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors text-left"
                  >
                    <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="truncate">Cài đặt quản trị</span>
                  </button>
                )}

              </div>

              <div className="h-[1px] bg-gray-100 my-1 mx-1"></div>

              {/* ĐĂNG XUẤT */}
              <button 
                onClick={handleLogout} 
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-black text-red-600 hover:bg-red-50 rounded-xl transition-all text-left"
              >
                <svg className="w-3.5 h-3.5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="truncate">Đăng xuất</span>
              </button>

            </div>
          )}

        </div>

      </div>
    </header>
  );
}