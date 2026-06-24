import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";

export default function ThongKeDonHang() {
  const [stats, setStats] = useState({
    overview: {
      total_orders: 0,
      delivered_orders: 0,
      pending_orders: 0,
      today_orders: 0,
      total_revenue: 0,
      avg_order_value: 0
    },
    recent_orders: []
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        // Gọi vào cổng 5003 (Order Service)
        const apiUrl = import.meta.env.VITE_API_ORDER_URL || "http://localhost:5003";
        
        const response = await axios.get(`${apiUrl}/api/orders/admin/statistics`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data?.success) {
          setStats(response.data.data);
        }
      } catch (err) {
        console.error("Lỗi tải thống kê:", err);
        setError("Không thể nạp dữ liệu thống kê từ máy chủ!");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Hàm format tiền tỷ/triệu thu gọn cho Dashboard
  const formatCompactCurrency = (amount) => {
    if (amount >= 1e9) return (amount / 1e9).toFixed(2) + "B Đ";
    if (amount >= 1e6) return (amount / 1e6).toFixed(1) + "M Đ";
    if (amount >= 1e3) return (amount / 1e3).toFixed(0) + "K Đ";
    return amount.toLocaleString("vi-VN") + " Đ";
  };

  // 1. Mảng cấu hình 4 thẻ thông số gán dữ liệu động từ State
  const orderCards = [
    { 
      id: 1, 
      title: "Tổng Đơn Hàng", 
      value: stats.overview.total_orders.toLocaleString("vi-VN"), 
      subText: "Đã giao thành công:", 
      subValue: stats.overview.delivered_orders.toLocaleString("vi-VN"), 
      bgColor: "bg-[#eff2f9] text-[#4d73db]" 
    },
    { 
      id: 2, 
      title: "Đơn Chờ Xử Lý", 
      value: stats.overview.pending_orders.toLocaleString("vi-VN"), 
      subText: "Đơn mới trong ngày:", 
      subValue: stats.overview.today_orders.toLocaleString("vi-VN"), 
      bgColor: "bg-[#fdf0f0] text-[#f25959]" 
    },
    { 
      id: 3, 
      title: "Doanh Thu Tổng", 
      value: formatCompactCurrency(stats.overview.total_revenue), 
      subText: "Trạng thái:", 
      subValue: "Đã ghi nhận", 
      bgColor: "bg-[#eaf9f3] text-[#2ac38a]" 
    },
    { 
      id: 4, 
      title: "Giá Trị Trung Bình", 
      value: formatCompactCurrency(stats.overview.avg_order_value), 
      subText: "Mục tiêu định biên:", 
      subValue: "200K Đ", 
      bgColor: "bg-[#e8f6fc] text-[#29b0ed]" 
    },
  ];

  // Hàm sinh màu tem trạng thái động
  const getStatusBadge = (status) => {
    switch (status) {
      case "Đã giao":
      case "COMPLETED":
        return { color: "text-emerald-600 bg-emerald-50 border-emerald-200", text: "Đã giao" };
      case "Chờ xử lý":
        return { color: "text-amber-600 bg-amber-50 border-amber-200", text: "Chờ xử lý" };
      case "Đang giao":
        return { color: "text-blue-600 bg-blue-50 border-blue-200", text: "Đang giao" };
      case "Đã hủy":
        return { color: "text-red-600 bg-red-50 border-red-200", text: "Đã hủy" };
      default:
        return { color: "text-slate-600 bg-slate-50 border-slate-200", text: status };
    }
  };

  return (
    <motion.main 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="flex-1 overflow-y-auto p-6 text-left custom-scrollbar font-['Plus_Jakarta_Sans',sans-serif]"
    >
      {/* TIÊU ĐỀ TRANG */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Thống kê đơn hàng</h1>
          <p className="text-xs font-semibold text-gray-400 mt-1">Quản lý hiệu suất bán hàng và trạng thái vận đơn trực tiếp</p>
        </div>
        {loading && (
          <div className="flex items-center gap-2 text-xs font-bold text-[#006c49] bg-emerald-50 px-3 py-1.5 rounded-full animate-pulse">
            <span className="w-2 h-2 rounded-full bg-[#006c49]"></span> Đang nạp số liệu trực tiếp...
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold text-center">
          ⚠️ {error}
        </div>
      )}

      {/* KHỐI 1: CARDS SỐ LIỆU TỔNG QUAN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {orderCards.map((card) => (
          <div key={card.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center justify-between hover:border-gray-200 transition-all">
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-400 block">{card.title}</span>
              <span className="text-2xl font-black text-gray-800 block tracking-tight">{card.value}</span>
              <span className="text-[11px] font-semibold text-gray-400 block">
                {card.subText} <span className="text-gray-600 font-bold">{card.subValue}</span>
              </span>
            </div>
            <div className={`w-11 h-11 ${card.bgColor} rounded-2xl flex items-center justify-center text-lg font-bold shadow-sm shrink-0`}>
              📊
            </div>
          </div>
        ))}
      </div>

      {/* KHỐI 2: BẢNG ĐƠN HÀNG GẦN ĐÂY DỮ LIỆU THẬT */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">Đơn hàng mới nhất</h3>
          <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full">Live DB</span>
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
              {stats.recent_orders.length === 0 && !loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-400 font-medium">Chưa có đơn hàng nào trong hệ thống</td>
                </tr>
              ) : (
                stats.recent_orders.map((order, idx) => {
                  const badge = getStatusBadge(order.status);
                  return (
                    <tr key={idx} className="hover:bg-gray-50/50 transition">
                      <td className="py-4 text-[#006c49] font-black">{order.id}</td>
                      <td className="py-4 text-gray-800 font-semibold">{order.customer}</td>
                      <td className="py-4 text-gray-400 font-medium">{order.date}</td>
                      <td className="py-4 text-right text-gray-900 font-extrabold">{order.total}</td>
                      <td className="py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black inline-block border ${badge.color}`}>
                          {badge.text}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.main>
  );
}