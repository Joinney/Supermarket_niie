import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
// 🌟 THÊM: Import các icon vẽ (SVG) từ lucide-react
import { 
  BarChart3, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  RefreshCw, 
  Layers 
} from "lucide-react";

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
        setLoading(true);
        setError(""); 
        const token = localStorage.getItem("adminToken");
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

  const formatCompactCurrency = (amount) => {
    if (!amount || isNaN(amount)) return "0 Đ";
    if (amount >= 1e9) return (amount / 1e9).toFixed(2) + "B Đ";
    if (amount >= 1e6) return (amount / 1e6).toFixed(1) + "M Đ";
    if (amount >= 1e3) return (amount / 1e3).toFixed(0) + "K Đ";
    return amount.toLocaleString("vi-VN") + " Đ";
  };

  const formatFullCurrency = (amount) => {
    if (!amount || isNaN(amount)) return "0 Đ";
    return amount.toLocaleString("vi-VN") + " Đ";
  };

  // 🌟 CẬP NHẬT: Gán trực tiếp component Icon vẽ vào cấu hình mảng thẻ
  const orderCards = [
    { 
      id: 1, 
      title: "Tổng Đơn Hàng", 
      value: stats.overview.total_orders.toLocaleString("vi-VN"), 
      subText: "Đã giao thành công:", 
      subValue: stats.overview.delivered_orders.toLocaleString("vi-VN"), 
      bgColor: "bg-blue-50 text-blue-600 border border-blue-100/70",
      icon: BarChart3 // Icon vẽ tổng quan
    },
    { 
      id: 2, 
      title: "Đơn Chờ Xử Lý", 
      value: stats.overview.pending_orders.toLocaleString("vi-VN"), 
      subText: "Đơn mới trong ngày:", 
      subValue: stats.overview.today_orders.toLocaleString("vi-VN"), 
      bgColor: "bg-rose-50 text-rose-600 border border-red-100/70",
      icon: Clock // Icon vẽ đồng hồ chờ
    },
    { 
      id: 3, 
      title: "Doanh Thu Tổng", 
      value: formatCompactCurrency(stats.overview.total_revenue), 
      subText: "Trạng thái:", 
      subValue: "Đã ghi nhận", 
      bgColor: "bg-emerald-50 text-emerald-700 border border-emerald-100/70",
      icon: DollarSign // Icon vẽ doanh thu
    },
    { 
      id: 4, 
      title: "Giá Trị Trung Bình", 
      value: formatCompactCurrency(stats.overview.avg_order_value), 
      subText: "Mục tiêu định biên:", 
      subValue: "200K Đ", 
      bgColor: "bg-purple-50 text-purple-600 border border-purple-100/70",
      icon: TrendingUp // Icon vẽ xu hướng phát triển
    },
  ];

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case "ĐÃ GIAO":
      case "COMPLETED":
        return { color: "text-emerald-600 bg-emerald-50 border-emerald-200", text: "Đã giao" };
      case "CHỜ XỬ LÝ":
      case "PENDING":
        return { color: "text-amber-600 bg-amber-50 border-amber-200", text: "Chờ xử lý" };
      case "ĐANG GIAO":
      case "DELIVERING":
        return { color: "text-blue-600 bg-blue-50 border-blue-200", text: "Đang giao" };
      case "ĐÃ HỦY":
      case "CANCELLED":
        return { color: "text-red-600 bg-red-50 border-red-200", text: "Đã hủy" };
      default:
        return { color: "text-slate-600 bg-slate-50 border-slate-200", text: status || "Không rõ" };
    }
  };

  return (
    <motion.main 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="w-full min-h-screen bg-[#fafafa] font-sans text-left text-slate-700 selection:bg-emerald-100 p-1 antialiased overflow-y-auto"
    >
      <div className="w-full">
        {/* TIÊU ĐỀ TRANG */}
        <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Thống kê đơn hàng</h1>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mt-1">
              <span>Tổng hành dinh</span>
              <span>❯</span>
              <span className="text-emerald-700 font-bold">Thống kê đơn hàng</span>
            </div>
          </div>
          {loading && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100/50">
              {/* 🌟 THÊM: Icon quay animation cho trạng thái đang đồng bộ */}
              <RefreshCw className="w-3 h-3 animate-spin text-emerald-600" />
              <span>Đang đồng bộ cơ sở dữ liệu...</span>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-bold text-center">
            {error}
          </div>
        )}

        {/* KHỐI 1: CARDS SỐ LIỆU TỔNG QUAN */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {orderCards.map((card) => {
            const CardIcon = card.icon; // Đọc component icon động
            return (
              <div key={card.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center justify-between hover:border-slate-200 hover:shadow-md transition-all duration-200">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">{card.title}</span>
                  <span className="text-2xl font-black text-slate-900 block tracking-tight">{card.value}</span>
                  <span className="text-[11px] font-bold text-slate-400 block">
                    {card.subText} <span className="text-slate-700 font-extrabold">{card.subValue}</span>
                  </span>
                </div>
                {/* 🌟 CẬP NHẬT: Render icon vẽ sắc nét với kích thước stroke phù hợp */}
                <div className={`w-11 h-11 ${card.bgColor} rounded-xl flex items-center justify-center shrink-0 shadow-sm`}>
                  <CardIcon className="w-5 h-5 stroke-[2.2]" />
                </div>
              </div>
            );
          })}
        </div>

        {/* KHỐI 2: BẢNG ĐƠN HÀNG MỚI NHẤT */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 md:p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              {/* 🌟 THÊM: Icon vẽ tinh tế trước chữ Đơn hàng mới nhất */}
              <Layers className="w-3.5 h-3.5 text-slate-400 stroke-[2.5]" />
              Đơn hàng mới nhất
            </h3>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">Live DB</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left border-collapse table-auto min-w-[700px]">
              <thead>
                <tr className="bg-slate-50/70 text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-100">
                  <th className="py-3.5 px-4 w-32">Mã đơn</th>
                  <th className="py-3.5 px-4">Khách hàng</th>
                  <th className="py-3.5 px-4 w-44">Ngày đặt</th>
                  <th className="py-3.5 px-4 text-right w-44">Tổng tiền</th>
                  <th className="py-3.5 px-4 text-center w-36 pr-6">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-700">
                {stats.recent_orders.length === 0 && !loading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-slate-400 font-medium">
                      Chưa có đơn hàng nào tồn tại trong hệ thống.
                    </td>
                  </tr>
                ) : (
                  stats.recent_orders.map((order, idx) => {
                    const badge = getStatusBadge(order.status);
                    return (
                      <tr key={order.id || idx} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-4 text-emerald-700 font-black font-mono">
                          #{order.id}
                        </td>
                        <td className="py-3.5 px-4 text-slate-900 font-bold">
                          {order.customer}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 font-medium">
                          {order.date}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 text-sm">
                          {typeof order.total === "number" ? formatFullCurrency(order.total) : order.total}
                        </td>
                        <td className="py-3.5 px-4 text-center pr-6">
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-black inline-block border uppercase tracking-wide ${badge.color}`}>
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
      </div>
    </motion.main>
  );
}