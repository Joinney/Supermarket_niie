import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import {
  Users,
  UserPlus,
  RotateCcw,
  Star,
  MoreHorizontal,
  Award,
  RefreshCw,
} from "lucide-react";

export default function ThongKeKhachHang() {
  // 🌟 STATE: Lưu trữ dữ liệu thống kê từ Backend
  const [stats, setStats] = useState({
    overview: {
      total_customers: 0,
      active_customers: 0,
      new_customers_7d: 0,
      retention_rate: "0.0",
      review_rating: "0.0",
      review_positive_percent: "0%",
    },
    top_customers: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 🌟 GỌI API KHI COMPONENT MOUNT
  useEffect(() => {
    const fetchCustomerStats = async () => {
      try {
        setLoading(true);
        setError("");
        const token = localStorage.getItem("adminToken");

        // 🎯 Gọi API từ Auth Service (Cổng 5001)
        const apiUrl =
          import.meta.env.VITE_API_AUTH_URL || "http://localhost:5001";

        const response = await axios.get(
          `${apiUrl}/api/auth/admin/statistics/customers`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (response.data?.success) {
          setStats(response.data.data);
        }
      } catch (err) {
        console.error("Lỗi tải thống kê khách hàng:", err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          setError(
            "Phiên đăng nhập hết hạn hoặc bạn không có quyền truy cập dữ liệu (401/403).",
          );
        } else {
          setError("Không thể kết nối đến máy chủ Auth Service (5001).");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerStats();
  }, []);

  // Hàm format tiền tệ (Ví dụ: 14.500.000 đ)
  const formatFullCurrency = (amount) => {
    if (!amount || isNaN(amount)) return "0 đ";
    return Number(amount).toLocaleString("vi-VN") + " đ";
  };

  // 1. Mảng dữ liệu cho 4 thẻ thông số tổng quan (Tự động map dữ liệu từ State)
  const customerCards = [
    {
      id: 1,
      title: "Tổng Khách Hàng",
      value: stats.overview.total_customers.toLocaleString("vi-VN"),
      subText: "Tài khoản active:",
      subValue: stats.overview.active_customers.toLocaleString("vi-VN"),
      bgColor: "bg-emerald-50 text-emerald-700 border border-emerald-100/70",
      icon: Users,
    },
    {
      id: 2,
      title: "Khách Hàng Mới",
      value: `+${stats.overview.new_customers_7d}`,
      subText: "Trong tuần này:",
      subValue: `${stats.overview.new_customers_7d} user`,
      bgColor: "bg-blue-50 text-blue-600 border border-blue-100/70",
      icon: UserPlus,
    },
    {
      id: 3,
      title: "Tỷ Lệ Quay Lại",
      value: `${stats.overview.retention_rate}%`,
      subText: "Chu kỳ mua sắm:",
      subValue: "30 ngày",
      bgColor: "bg-purple-50 text-purple-600 border border-purple-100/70",
      icon: RotateCcw,
    },
    {
      id: 4,
      title: "Phản Hồi Tích Cực",
      value: `${stats.overview.review_rating} ★`,
      subText: "Đánh giá dịch vụ:",
      subValue: stats.overview.review_positive_percent,
      bgColor: "bg-amber-50 text-amber-600 border border-amber-100/70",
      icon: Star,
    },
  ];

  // Hàm quyết định màu sắc huy hiệu xếp hạng
  const getBadgeStyle = (badgeName) => {
    const name = String(badgeName).toUpperCase();
    if (name === "KIM CƯƠNG")
      return "bg-indigo-50 text-indigo-600 border border-indigo-100";
    if (name === "VÀNG")
      return "bg-amber-50 text-amber-600 border border-amber-100";
    if (name === "BẠC")
      return "bg-slate-50 text-slate-500 border border-slate-200";
    return "bg-slate-50 text-slate-500 border border-slate-200";
  };

  return (
    <motion.main
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="w-full min-h-screen bg-[#fafafa] font-sans text-left text-slate-700 selection:bg-emerald-100 p-1 antialiased overflow-y-auto"
    >
      <div className="w-full pb-10">
        {/* TIÊU ĐỀ TRANG */}
        <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              Thống kê khách hàng
            </h1>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mt-1">
              <span>Tổng hành dinh</span>
              <span>❯</span>
              <span className="text-emerald-700 font-bold">
                Thống kê khách hàng
              </span>
            </div>
          </div>

          {loading && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100/50 shadow-sm">
              <RefreshCw className="w-3 h-3 animate-spin text-emerald-600" />
              <span>Đang đồng bộ cơ sở dữ liệu...</span>
            </div>
          )}
        </div>

        {/* THÔNG BÁO LỖI NẾU CÓ */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-bold text-center shadow-sm">
            {error}
          </div>
        )}

        {/* KHỐI 1: CARDS SỐ LIỆU TỔNG QUAN */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {customerCards.map((card) => {
            const CardIcon = card.icon;
            return (
              <div
                key={card.id}
                className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center justify-between hover:border-slate-200 hover:shadow-md transition-all duration-200"
              >
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    {card.title}
                  </span>
                  <span className="text-2xl font-black text-slate-900 block tracking-tight">
                    {card.value}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400 block">
                    {card.subText}{" "}
                    <span className="text-slate-700 font-extrabold">
                      {card.subValue}
                    </span>
                  </span>
                </div>
                <div
                  className={`w-11 h-11 ${card.bgColor} rounded-xl flex items-center justify-center shrink-0 shadow-sm`}
                >
                  <CardIcon className="w-5 h-5 stroke-[2.2]" />
                </div>
              </div>
            );
          })}
        </div>

        {/* KHỐI 2: BẢNG TOP KHÁCH HÀNG THÂN THIẾT */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 md:p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-slate-400 stroke-[2.5]" />
                Top khách hàng thân thiết
              </h3>
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider font-mono border border-emerald-100">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Live DB
              </span>
            </div>

            <button className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition cursor-pointer flex items-center justify-center">
              <MoreHorizontal className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left border-collapse table-auto min-w-[700px]">
              <thead>
                <tr className="bg-slate-50/70 text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-100">
                  <th className="py-3.5 px-4 w-24 text-center">Rank</th>
                  <th className="py-3.5 px-4">Tên người dùng</th>
                  <th className="py-3.5 px-4 text-center w-44">
                    Số đơn đã đặt
                  </th>
                  <th className="py-3.5 px-4 text-right w-44">Tổng chi tiêu</th>
                  <th className="py-3.5 px-4 text-center w-40 pr-6">
                    Hạng thành viên
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-700">
                {stats.top_customers.length === 0 && !loading ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="text-center py-12 text-slate-400 font-medium italic"
                    >
                      Chưa có dữ liệu khách hàng thân thiết (Chưa có đơn hàng
                      nào hoàn tất).
                    </td>
                  </tr>
                ) : (
                  stats.top_customers.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50/60 transition"
                    >
                      <td className="py-3.5 px-4 text-center text-slate-400 font-mono">
                        {user.rank}
                      </td>
                      <td className="py-3.5 px-4 text-slate-900 font-bold flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold uppercase overflow-hidden shrink-0">
                          {user.name.charAt(0)}
                        </div>
                        {user.name}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-500">
                        {user.orders}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-700 text-sm">
                        {formatFullCurrency(user.spent)}
                      </td>
                      <td className="py-3.5 px-4 text-center pr-6">
                        <span
                          className={`px-2.5 py-0.5 rounded text-[10px] font-black inline-block border uppercase tracking-wide shadow-sm ${getBadgeStyle(user.badge)}`}
                        >
                          {user.badge}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.main>
  );
}
