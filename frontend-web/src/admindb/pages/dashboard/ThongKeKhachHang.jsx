import React from "react";
import { motion } from "framer-motion"; // 🌟 Thêm hiệu ứng trượt nội dung mượt mà

export default function ThongKeKhachHang() {
  // 1. Mảng dữ liệu cho 4 thẻ thông số tổng quan
  const customerCards = [
    { id: 1, title: "Tổng Khách Hàng", value: "3,120", subText: "Tài khoản active:", subValue: "2,840", bgColor: "bg-[#eaf9f3] text-[#2ac38a]" },
    { id: 2, title: "Khách Hàng Mới", value: "+148", subText: "Trong tuần này:", subValue: "34 user", bgColor: "bg-[#eff2f9] text-[#4d73db]" },
    { id: 3, title: "Tỷ Lệ Quay Lại", value: "68.2%", subText: "Chu kỳ mua sắm:", subValue: "30 ngày", bgColor: "bg-[#e8f6fc] text-[#29b0ed]" },
    { id: 4, title: "Phản Hồi Tích Cực", value: "4.8 ★", subText: "Đánh giá dịch vụ:", subValue: "92%", bgColor: "bg-[#eff2f9] text-amber-500" },
  ];

  // 2. Mảng dữ liệu cho danh sách bảng khách hàng thân thiết
  const topCustomers = [
    { id: 1, name: "Phạm Minh Hùng", ordersCount: 28, totalSpent: "14,500,000 đ", label: "Kim cương", labelStyle: "bg-indigo-50 text-indigo-600" },
    { id: 2, name: "Nguyễn Ánh Tuyết", ordersCount: 19, totalSpent: "9,800,000 đ", label: "Vàng", labelStyle: "bg-amber-50 text-amber-600" },
    { id: 3, name: "Đỗ Bảo Long", ordersCount: 15, totalSpent: "7,200,000 đ", label: "Vàng", labelStyle: "bg-amber-50 text-amber-600" },
    { id: 4, name: "Vũ Phương Thảo", ordersCount: 12, totalSpent: "4,900,000 đ", label: "Bạc", labelStyle: "bg-slate-50 text-slate-500" },
  ];

  return (
    // 🌟 ĐÃ SỬA: Chuyển thành <motion.main> để đồng bộ hiệu ứng chuyển tag siêu tốc và mượt mà
    <motion.main 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="flex-1 overflow-y-auto p-6 text-left custom-scrollbar"
    >
      
      {/* TIÊU ĐỀ TRANG */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-800 tracking-tight">Thống kê khách hàng</h1>
        <p className="text-xs font-semibold text-gray-400 mt-1">Phân tích hành vi, phân hạng và chăm sóc tệp người dùng</p>
      </div>

      {/* KHỐI 1: CARDS SỐ LIỆU TỔNG QUAN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {customerCards.map((card) => (
          <div key={card.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-400 block">{card.title}</span>
              <span className="text-2xl font-black text-gray-800 block tracking-tight">{card.value}</span>
              <span className="text-[11px] font-semibold text-gray-400 block">
                {card.subText} <span className="text-gray-600 font-bold">{card.subValue}</span>
              </span>
            </div>
            <div className={`w-11 h-11 ${card.bgColor} rounded-2xl flex items-center justify-center text-lg shadow-sm`}>
              👥
            </div>
          </div>
        ))}
      </div>

      {/* KHỐI 2: BẢNG TOP KHÁCH HÀNG THÂN THIẾT */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">Top khách hàng thân thiết</h3>
          <button className="text-gray-400 hover:text-gray-600 font-bold text-sm">•••</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-gray-400 text-[10px] font-bold uppercase tracking-wider border-b border-gray-50 pb-2">
                <th className="pb-3 w-12">Rank</th>
                <th className="pb-3">Tên người dùng</th>
                <th className="pb-3 text-center">Số đơn đã đặt</th>
                <th className="pb-3 text-right">Tổng chi tiêu</th>
                <th className="pb-3 text-center">Hạng thành viên</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs font-bold text-gray-700">
              {topCustomers.map((user, idx) => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition">
                  <td className="py-4 text-gray-400 font-semibold">#{idx + 1}</td>
                  <td className="py-4 font-semibold text-gray-800">{user.name}</td>
                  <td className="py-4 text-center text-gray-500 font-medium">{user.ordersCount}</td>
                  <td className="py-4 text-right text-emerald-600 font-extrabold">{user.totalSpent}</td>
                  <td className="py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black inline-block ${user.labelStyle}`}>
                      {user.label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </motion.main>
  );
}