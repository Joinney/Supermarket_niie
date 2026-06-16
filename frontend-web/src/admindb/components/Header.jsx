import React from "react";

export default function Header() {
  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 font-sans shrink-0 select-none">
      
      {/* Cụm điều khiển bên trái */}
      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-gray-50 rounded-xl text-gray-500 hover:text-gray-800 transition-colors duration-150 flex items-center justify-center">
          {/* Icon Hamburger Menu hiện đại */}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
      </div>

      {/* Cụm công cụ bên phải (Search, Bell, User Profile) */}
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
          {/* Chấm đỏ thông báo nhỏ gọn tinh tế */}
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full ring-2 ring-white"></span>
        </button>

        {/* Đường vạch chia line-gray ngăn cách */}
        <div className="h-5 w-[1px] bg-gray-200 mx-2"></div>

        {/* Dropdown Profile Người dùng */}
        <div className="flex items-center gap-2.5 cursor-pointer group py-1.5 px-2 rounded-xl hover:bg-gray-50/80 transition-colors duration-150">
          
          {/* Avatar mô phỏng đúng quả địa cầu ADMIN theo ảnh của bạn */}
          <div className="w-8 h-8 rounded-full bg-[#f0f9ff] border border-sky-100 flex items-center justify-center text-sky-600 transition-transform group-hover:scale-105 duration-150 overflow-hidden shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9s2.015-9 4.5-9m0 18c-1.315 0-2.545-.835-3.484-2.32A14.95 14.95 0 013.3 12.373m15.4 0c-.062-.51-.137-1.01-.225-1.5M3.3 12.373A14.95 14.95 0 014.284 6.74M3.3 12.373a14.935 14.935 0 001.484 5.319m14.416-5.319a14.95 14.95 0 00-1.423-5.632m1.423 5.632a14.95 14.95 0 01-1.423 5.632M12 3a9.004 9.004 0 018.716 2.253M12 3a9.004 9.004 0 00-8.716 2.253m0 0A14.95 14.95 0 017.3 11.627m0 0c.346-.017.697-.027 1.055-.027 1.542 0 2.992.176 4.254.492" />
            </svg>
          </div>

          {/* Tên hiển thị và mũi tên mũi xuống nhỏ gọn */}
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900 transition-colors">
              Admin
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 text-gray-400 group-hover:text-gray-600 transition-transform duration-200 group-hover:translate-y-0.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </div>

        </div>

      </div>
    </header>
  );
}