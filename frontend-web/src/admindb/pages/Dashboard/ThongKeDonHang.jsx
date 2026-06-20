import React from "react";
import { motion } from "framer-motion"; // 🌟 Thêm hiệu ứng trượt mượt mà

export default function ThongKeDonHang() {
  // 1. Mảng dữ liệu cho 4 thẻ thông số đơn hàng
  const orderCards = [
    { 
      id: 1, 
      title: "Tổng Đơn Hàng", 
      value: "1,840", 
      subText: "Đã giao thành công:", 
      subValue: "1,620", 
      bgColor: "bg-[#eff2f9] text-[#4d73db]" 
    },
    { 
      id: 2, 
      title: "Đơn Chờ Xử Lý", 
      value: "45", 
      subText: "Đơn mới trong ngày:", 
      subValue: "12", 
      bgColor: "bg-[#fdf0f0] text-[#f25959]" 
    },
    { 
      id: 3, 
      title: "Doanh Thu Tháng", 
      value: "348M Đ", 
      subText: "Tăng trưởng:", 
      subValue: "+12.5%", 
      bgColor: "bg-[#eaf9f3] text-[#2ac38a]" 
    },
    { 
      id: 4, 
      title: "Giá Trị Trung Bình", 
      value: "190K Đ", 
      subText: "Mục tiêu định biên:", 
      subValue: "200K Đ", 
      bgColor: "bg-[#e8f6fc] text-[#29b0ed]" 
    },
  ];

  // 2. Mảng dữ liệu cho bảng danh sách đơn hàng mới nhất
  const recentOrders = [
    { id: "DH-001", customer: "Trần Văn Hoàng", date: "20/06/2026", total: "450,000 đ", status: "Đã giao", statusColor: "text-emerald-600 bg-emerald-50" },
    { id: "DH-002", customer: "Lê Thị Mai", date: "20/06/2026", total: "1,200,000 đ", status: "Chờ xử lý", statusColor: "text-amber-600 bg-amber-50" },
    { id: "DH-003", customer: "Phạm Minh Tuấn", date: "19/06/2026", total: "310,000 đ", status: "Đang giao", statusColor: "text-blue-600 bg-blue-50" },
    { id: "DH-004", customer: "Nguyễn Thùy Linh", date: "19/06/2026", total: "890,000 đ", status: "Đã hủy", statusColor: "text-red-600 bg-red-50" },
  ];

  return (
    // 🌟 ĐÃ SỬA: Thay đổi thành <motion.main> nhận diện hoạt ảnh chuyển trang siêu mượt
    <motion.main 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="flex-1 overflow-y-auto p-6 text-left custom-scrollbar"
    >
      
      {/* TIÊU ĐỀ TRANG */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-800 tracking-tight">Thống kê đơn hàng</h1>
        <p className="text-xs font-semibold text-gray-400 mt-1">Quản lý hiệu suất bán hàng và trạng thái vận đơn</p>
      </div>

      {/* KHỐI 1: CARDS SỐ LIỆU TỔNG QUAN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {orderCards.map((card) => (
          <div key={card.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-400 block">{card.title}</span>
              <span className="text-2xl font-black text-gray-800 block tracking-tight">{card.value}</span>
              <span className="text-[11px] font-semibold text-gray-400 block">
                {card.subText} <span className="text-gray-600 font-bold">{card.subValue}</span>
              </span>
            </div>
            <div className={`w-11 h-11 ${card.bgColor} rounded-2xl flex items-center justify-center text-lg font-bold shadow-sm`}>
              📊
            </div>
          </div>
        ))}
      </div>

      {/* KHỐI 2: BẢNG ĐƠN HÀNG GẦN ĐÂY */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">Đơn hàng mới nhất</h3>
          <button className="text-gray-400 hover:text-gray-600 font-bold text-sm">•••</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-gray-400 text-[10px] font-bold uppercase tracking-wider border-b border-gray-50 pb-2">
                <th className="pb-3">Mã đơn</th>
                <th className="pb-3">Khách hàng</th>
                <th className="pb-3">Ngày đặt</th>
                <th className="pb-3 text-right">Tổng tiền</th>
                <th className="pb-3 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs font-bold text-gray-700">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50/50 transition">
                  <td className="py-4 text-[#006c49] font-black">{order.id}</td>
                  <td className="py-4 text-gray-800 font-semibold">{order.customer}</td>
                  <td className="py-4 text-gray-400 font-medium">{order.date}</td>
                  <td className="py-4 text-right text-gray-900 font-extrabold">{order.total}</td>
                  <td className="py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black inline-block ${order.statusColor}`}>
                      {order.status}
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