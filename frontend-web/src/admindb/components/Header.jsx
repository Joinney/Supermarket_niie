import React from "react";

export default function Header() {
  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 font-sans shrink-0">
      {/* Cụm điều khiển bên trái */}
      <div className="flex items-center gap-4">
        <button className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-500 transition">
          ☰
        </button>
      </div>

      {/* Cụm công cụ bên phải (Search, Bell, User Profile) */}
      <div className="flex items-center gap-6">
        {/* Nút Tìm kiếm */}
        <button className="text-gray-500 hover:text-gray-700 text-lg p-1 transition">
          🔍
        </button>

        {/* Nút Chuông Thông báo */}
        <button className="relative text-gray-500 hover:text-gray-700 text-lg p-1 transition">
          🔔
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
        </button>

        {/* Dropdown Profile Người dùng */}
        <div className="flex items-center gap-2.5 border-l pl-4 cursor-pointer group">
          {/* Avatar Giả lập tròn */}
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs font-bold ring-2 ring-gray-100 group-hover:ring-emerald-200 transition">
            👑
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-gray-800">Admin</span>
              <span className="text-[10px] text-gray-400">▼</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}