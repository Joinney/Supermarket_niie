import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { orderApi } from "../../../api/axios";
import { Link } from "react-router-dom";
import {
  BarChart3,
  Clock,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Layers,
  ArrowUpRight,
  ShoppingBag,
} from "lucide-react";

export default function ThongKeDonHang() {
  const [stats, setStats] = useState({
    overview: {
      total_orders: 0,
      delivered_orders: 0,
      pending_orders: 0,
      today_orders: 0,
      total_revenue: 0,
      avg_order_value: 0,
    },
    recent_orders: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await orderApi.get("/admin/statistics");

        if (response.data?.success) {
          setStats(response.data.data);
        }
      } catch (err) {
        console.error("Lỗi tải thống kê:", err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          setError(
            "Phiên đăng nhập hết hạn hoặc bạn không có quyền xem dữ liệu này!"
          );
        } else {
          setError("Không thể nạp dữ liệu thống kê từ máy chủ Order Service!");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatCompactCurrency = (amount) => {
    if (!amount || isNaN(amount)) return "0 đ";
    if (amount >= 1e9) return (amount / 1e9).toFixed(2) + "B đ";
    if (amount >= 1e6) return (amount / 1e6).toFixed(1) + "M đ";
    if (amount >= 1e3) return (amount / 1e3).toFixed(0) + "K đ";
    return amount.toLocaleString("vi-VN") + " đ";
  };

  const formatFullCurrency = (amount) => {
    if (!amount || isNaN(amount)) return "0 đ";
    return amount.toLocaleString("vi-VN") + " đ";
  };

  const orderCards = [
    {
      id: 1,
      title: "TỔNG ĐƠN HÀNG",
      value: stats.overview.total_orders.toLocaleString("vi-VN"),
      subText: "Đã giao thành công:",
      subValue: stats.overview.delivered_orders.toLocaleString("vi-VN"),
      icon: BarChart3,
    },
    {
      id: 2,
      title: "ĐƠN CHỜ XỬ LÝ",
      value: stats.overview.pending_orders.toLocaleString("vi-VN"),
      subText: "Đơn mới hôm nay:",
      subValue: stats.overview.today_orders.toLocaleString("vi-VN"),
      icon: Clock,
    },
    {
      id: 3,
      title: "DOANH THU TỔNG",
      value: formatCompactCurrency(stats.overview.total_revenue),
      subText: "Trạng thái:",
      subValue: "Đã ghi nhận",
      icon: DollarSign,
    },
    {
      id: 4,
      title: "GIÁ TRỊ TRUNG BÌNH",
      value: formatCompactCurrency(stats.overview.avg_order_value),
      subText: "Mục tiêu định biên:",
      subValue: "200K đ",
      icon: TrendingUp,
    },
  ];

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case "ĐÃ GIAO":
      case "COMPLETED":
        return {
          color: "text-[#006c49] bg-[#006c49]/10 border-[#006c49]/20",
          text: "Đã giao",
        };
      case "CHỜ XỬ LÝ":
      case "PENDING":
        return {
          color: "text-amber-600 bg-amber-50 border-amber-200",
          text: "Chờ xử lý",
        };
      case "ĐANG GIAO":
      case "DELIVERING":
        return {
          color: "text-blue-600 bg-blue-50 border-blue-200",
          text: "Đang giao",
        };
      case "ĐÃ HỦY":
      case "CANCELLED":
        return {
          color: "text-rose-600 bg-rose-50 border-rose-200",
          text: "Đã hủy",
        };
      default:
        return {
          color: "text-slate-600 bg-slate-50 border-slate-200",
          text: status || "Không rõ",
        };
    }
  };

  return (
    <motion.main
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="w-full min-h-screen bg-[#f8fafc] font-sans text-left text-slate-800 p-4 md:p-6 antialiased"
    >
      <div className="w-full pb-10">
        {/* TIÊU ĐỀ TRANG & TOOLBAR */}
        <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              Thống kê đơn hàng
            </h1>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mt-1">
              <span>Tổng hành dinh</span>
              <span>❯</span>
              <span className="text-[#006c49] font-bold">
                Thống kê đơn hàng
              </span>
            </div>
          </div>
          {loading && (
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#006c49] bg-[#006c49]/10 px-3 py-1.5 rounded-xl border border-[#006c49]/20 shadow-xs">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#006c49]" />
              <span>ĐỒNG BỘ LIVE...</span>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-xs font-bold text-center">
            {error}
          </div>
        )}

        {/* KHỐI 1: CARDS SỐ LIỆU TỔNG QUAN (ĐỒNG BỘ MÀU TỪ ADMIN DASHBOARD) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {orderCards.map((card) => {
            const CardIcon = card.icon;
            return (
              <div
                key={card.id}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex flex-col justify-between hover:border-slate-200 transition-all"
              >
                <div className="flex items-start justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {card.title}
                  </span>
                  <div className="p-2 rounded-xl bg-[#006c49]/10 text-[#006c49]">
                    <CardIcon className="w-4 h-4 stroke-[2.2]" />
                  </div>
                </div>
                <div className="mt-2">
                  <h2 className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                    {card.value}
                  </h2>
                </div>
                <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-[#006c49]">
                  <span className="text-slate-400 font-normal">
                    {card.subText}{" "}
                    <span className="text-slate-900 font-bold">
                      {card.subValue}
                    </span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* KHỐI 2: BẢNG ĐƠN HÀNG MỚI NHẤT */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#006c49]" />
                Đơn hàng mới nhất
              </h3>
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#006c49] bg-[#006c49]/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono border border-[#006c49]/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#006c49] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#006c49]"></span>
                </span>
                Live DB
              </span>
            </div>

            <Link
              to="/admin/Donhang"
              className="text-xs font-bold text-[#006c49] bg-[#006c49]/10 hover:bg-[#006c49]/20 px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1 uppercase tracking-wider"
            >
              Xem tất cả ❯
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4 rounded-l-xl w-36">Mã đơn</th>
                  <th className="py-3 px-4">Khách hàng</th>
                  <th className="py-3 px-4 w-44">Ngày đặt</th>
                  <th className="py-3 px-4 text-right w-44">Tổng tiền</th>
                  <th className="py-3 px-4 text-center rounded-r-xl w-36">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody className="text-xs font-bold text-slate-700">
                {stats.recent_orders.length === 0 && !loading ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="text-center py-12 text-slate-400 font-medium italic"
                    >
                      Chưa có đơn hàng nào tồn tại trong hệ thống.
                    </td>
                  </tr>
                ) : (
                  stats.recent_orders.map((order, idx) => {
                    const badge = getStatusBadge(order.status);
                    return (
                      <tr
                        key={order.id || idx}
                        className="border-b border-slate-50 last:border-none hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="py-3.5 px-4 text-[#006c49] font-black font-mono">
                          {order.id}
                        </td>
                        <td className="py-3.5 px-4 text-slate-900 font-bold">
                          {order.customer}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono font-normal">
                          {order.date}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 text-sm">
                          {typeof order.total === "number"
                            ? formatFullCurrency(order.total)
                            : order.total}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black inline-block border uppercase tracking-wider ${badge.color}`}
                          >
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