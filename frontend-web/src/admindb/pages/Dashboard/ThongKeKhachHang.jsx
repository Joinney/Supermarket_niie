import React from "react";
import { motion } from "framer-motion";

export default function ThongKeKhachHang() {
  // 1. Mảng dữ liệu cho 4 thẻ thông số tổng quan
  const customerCards = [
    { id: 1, title: "Tổng Khách Hàng", value: "3,120", subText: "Tài khoản active:", subValue: "2,840", bgColor: "bg-emerald-50 text-emerald-700 border border-emerald-100" },
    { id: 2, title: "Khách Hàng Mới", value: "+148", subText: "Trong tuần này:", subValue: "34 user", bgColor: "bg-blue-50 text-blue-600 border border-blue-100" },
    { id: 3, title: "Tỷ Lệ Quay Lại", value: "68.2%", subText: "Chu kỳ mua sắm:", subValue: "30 ngày", bgColor: "bg-purple-50 text-purple-600 border border-purple-100" },
    { id: 4, title: "Phản Hồi Tích Cực", value: "4.8 ★", subText: "Đánh giá dịch vụ:", subValue: "92%", bgColor: "bg-amber-50 text-amber-600 border border-amber-100" },
  ];

  // 2. Mảng dữ liệu cho danh sách bảng khách hàng thân thiết
  const topCustomers = [
    { id: 1, name: "Phạm Minh Hùng", ordersCount: 28, totalSpent: "14,500,000 đ", label: "Kim cương", labelStyle: "bg-indigo-50 text-indigo-600 border border-indigo-100" },
    { id: 2, name: "Nguyễn Ánh Tuyết", ordersCount: 19, totalSpent: "9,800,000 đ", label: "Vàng", labelStyle: "bg-amber-50 text-amber-600 border border-amber-100" },
    { id: 3, name: "Đỗ Bảo Long", ordersCount: 15, totalSpent: "7,200,000 đ", label: "Vàng", labelStyle: "bg-amber-50 text-amber-600 border border-amber-100" },
    { id: 4, name: "Vũ Phương Thảo", ordersCount: 12, totalSpent: "4,900,000 đ", label: "Bạc", labelStyle: "bg-slate-50 text-slate-500 border border-slate-200" },
  ];

  return (
    <motion.main 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      /* 🌟 ĐÃ ĐỒNG BỘ: p-1 bung sát biên 2 bên mép màn hình, màu nền #fafafa */
      className="w-full min-h-screen bg-[#fafafa] font-sans text-left text-slate-700 selection:bg-emerald-100 p-1 antialiased overflow-y-auto"
    >
      <div className="w-full">
        
        {/* TIÊU ĐỀ TRANG */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Thống kê khách hàng</h1>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mt-1">
            <span>Tổng hành dinh</span>
            <span>❯</span>
            <span className="text-emerald-700 font-bold">Thống kê khách hàng</span>
          </div>
        </div>

        {/* KHỐI 1: CARDS SỐ LIỆU TỔNG QUAN (BUNG FULL WIDTH) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {customerCards.map((card) => (
            <div key={card.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center justify-between hover:border-slate-200 transition-all">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">{card.title}</span>
                <span className="text-2xl font-black text-slate-900 block tracking-tight">{card.value}</span>
                <span className="text-[11px] font-bold text-slate-400 block">
                  {card.subText} <span className="text-slate-700 font-extrabold">{card.subValue}</span>
                </span>
              </div>
              <div className={`w-10 h-10 ${card.bgColor} rounded-xl flex items-center justify-center text-sm shrink-0`}>
                👥
              </div>
            </div>
          ))}
        </div>

        {/* KHỐI 2: BẢNG TOP KHÁCH HÀNG THÂN THIẾT (BUNG FULL WIDTH) */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 md:p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Top khách hàng thân thiết</h3>
            <button className="text-slate-400 hover:text-slate-600 font-bold text-xs cursor-pointer">•••</button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left border-collapse table-auto min-w-[700px]">
              <thead>
                <tr className="bg-slate-50/70 text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-100">
                  <th className="py-3.5 px-4 w-24 text-center">Rank</th>
                  <th className="py-3.5 px-4">Tên người dùng</th>
                  <th className="py-3.5 px-4 text-center w-44">Số đơn đã đặt</th>
                  <th className="py-3.5 px-4 text-right w-44">Tổng chi tiêu</th>
                  <th className="py-3.5 px-4 text-center w-40 pr-6">Hạng thành viên</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-700">
                {topCustomers.map((user, idx) => (
                  <tr key={user.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 text-center text-slate-400 font-mono">
                      #{idx + 1}
                    </td>
                    <td className="py-3.5 px-4 text-slate-900 font-bold">
                      {user.name}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-500">
                      {user.ordersCount} đơn
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-700 text-sm">
                      {user.totalSpent}
                    </td>
                    <td className="py-3.5 px-4 text-center pr-6">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-black inline-block border uppercase tracking-wide ${user.labelStyle}`}>
                        {user.label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </motion.main>
  );
}