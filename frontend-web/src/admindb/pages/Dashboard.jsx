import React from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

export default function Dashboard() {
  // Dữ liệu mẫu các vai trò theo ảnh chụp màn hình của bạn
  const roles = [
    {
      id: 1,
      title: "Admin (Quản trị viên)",
      code: "SYSTEM_ADMIN",
      desc: "Toàn quyền kiểm soát và cấu hình hệ thống ETECHS. Có khả năng xóa dữ liệu và phân quyền cho người khác.",
      accounts: 1,
      badgeColor: "bg-red-50 text-red-500",
      icon: "🛡️"
    },
    {
      id: 2,
      title: "Quản lý (Manager)",
      code: "SYSTEM_MANAGER",
      desc: "Cấp quản lý cấp trung, điều phối hàng hóa, nông trại. Không có quyền xóa dữ liệu kế toán và cấu hình hệ thống lỗi.",
      accounts: 2,
      badgeColor: "bg-blue-50 text-blue-500",
      icon: "💼"
    },
    {
      id: 3,
      title: "User (Nhân viên)",
      code: "SYSTEM_USER",
      desc: "Tài khoản nhân viên vận hành bình thường. Tùy thuộc vào phòng ban sẽ được xem hoặc thao tác tạo đơn.",
      accounts: 2,
      badgeColor: "bg-green-50 text-green-500",
      icon: "✅"
    }
  ];

  return (
    <div className="flex h-screen w-screen bg-[#fafafa] overflow-hidden">
      {/* 1. THANH SIDEBAR BÊN TRÁI */}
      <Sidebar />

      {/* KHU VỰC CHỨA CẢ HEADER VÀ NỘI DUNG CHÍNH */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* 2. THANH HEADER LÊN TOP */}
        <Header />

        {/* 3. VÙNG HIỂN THỊ NỘI DUNG CHÍNH (MAIN SCREEN CONTENT) */}
        <main className="flex-1 overflow-y-auto p-6 text-left">
          {/* Chỉ dẫn Breadcrumb */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-black text-gray-800 tracking-tight">Danh sách vai trò</h1>
              <p className="text-xs font-semibold text-gray-400 mt-1">
                Dashboard <span className="mx-1 text-[10px]">❯</span> <span className="text-gray-600">Danh sách vai trò</span>
              </p>
            </div>
            
            <div className="flex gap-2">
              <button className="px-4 py-2 border bg-white rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition shadow-sm">
                📥 Xuất danh sách
              </button>
              <button className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition shadow-sm">
                + Tạo Phiếu nhập
              </button>
            </div>
          </div>

          {/* Hộp bộ lọc (Filters Bar) */}
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <select className="border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 outline-none bg-white">
                <option>Tất cả Vai trò</option>
              </select>
              <select className="border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 outline-none bg-white">
                <option>Trạng thái</option>
              </select>
            </div>
            <div className="w-full md:w-72">
              <input 
                type="text" 
                placeholder="Tìm theo tên, email..." 
                className="w-full border border-gray-200 px-3 py-1.5 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Lưới hiển thị các thẻ Vai trò (Roles Grid) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map((role) => (
              <div key={role.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition duration-200 relative">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className={`w-10 h-10 ${role.badgeColor} rounded-xl flex items-center justify-center text-lg font-bold`}>
                      {role.icon}
                    </div>
                    <div className="flex gap-2 text-gray-400">
                      <button className="hover:text-gray-600 text-sm">✏️</button>
                      <button className="hover:text-red-500 text-sm">🗑️</button>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-gray-800">{role.title}</h3>
                  <span className="inline-block text-[10px] font-black tracking-wider text-blue-600 uppercase mt-0.5">{role.code}</span>
                  
                  <p className="text-xs text-gray-500 mt-3 leading-relaxed font-medium min-h-[60px]">
                    {role.desc}
                  </p>
                </div>

                <div className="border-t border-gray-50 pt-4 mt-6 flex justify-between items-center text-xs font-bold">
                  <span className="text-gray-400">👥 {role.accounts} TÀI KHOẢN</span>
                  <button className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition">
                    Cấu hình quyền <span>➔</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}