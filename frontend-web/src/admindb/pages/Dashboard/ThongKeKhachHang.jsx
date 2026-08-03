import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { authApi } from "../../../api/axios";
import {
  Users,
  UserPlus,
  RotateCcw,
  Star,
  Award,
  RefreshCw,
} from "lucide-react";

export default function ThongKeKhachHang() {
  // STATE: Lưu trữ dữ liệu thống kê từ Backend Auth Service
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

  // GỌI API KHI COMPONENT MOUNT
  useEffect(() => {
    const fetchCustomerStats = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await authApi.get("/auth/admin/statistics/customers");

        if (response.data?.success) {
          setStats(response.data.data);
        }
      } catch (err) {
        console.error("Lỗi tải thống kê khách hàng:", err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          setError("Phiên đăng nhập hết hạn hoặc bạn không có quyền truy cập.");
        } else {
          setError("Không thể kết nối đến máy chủ Auth Service.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerStats();
  }, []);

  // Format tiền tệ chuẩn (Ví dụ: 14.500.000 đ)
  const formatFullCurrency = (amount) => {
    if (!amount || isNaN(amount)) return "0 đ";
    return Number(amount).toLocaleString("vi-VN") + " đ";
  };

  // Mảng dữ liệu cho 4 thẻ thông số tổng quan (Map dữ liệu từ State & Áp dụng Style chuẩn Admin)
  const customerCards = [
    {
      id: 1,
      title: "TỔNG KHÁCH HÀNG",
      value: (stats.overview?.total_customers || 0).toLocaleString("vi-VN"),
      subText: "Tài khoản active:",
      subValue: (stats.overview?.active_customers || 0).toLocaleString("vi-VN"),
      icon: Users,
    },
    {
      id: 2,
      title: "KHÁCH HÀNG MỚI",
      value: `+${stats.overview?.new_customers_7d || 0}`,
      subText: "Trong tuần này:",
      subValue: `${stats.overview?.new_customers_7d || 0} user`,
      icon: UserPlus,
    },
    {
      id: 3,
      title: "TỶ LỆ QUAY LẠI",
      value: `${stats.overview?.retention_rate || "0.0"}%`,
      subText: "Chu kỳ mua sắm:",
      subValue: "30 ngày",
      icon: RotateCcw,
    },
    {
      id: 4,
      title: "PHẢN HỒI TÍCH CỰC",
      value: `${stats.overview?.review_rating || "0.0"} ★`,
      subText: "Đánh giá dịch vụ:",
      subValue: stats.overview?.review_positive_percent || "0%",
      icon: Star,
    },
  ];

  // Hàm quyết định màu sắc huy hiệu xếp hạng theo tông màu chung
  const getBadgeStyle = (badgeName) => {
    const name = String(badgeName || "").toUpperCase();
    if (name === "KIM CƯƠNG")
      return "bg-indigo-50 text-indigo-600 border-indigo-200";
    if (name === "VÀNG")
      return "bg-amber-50 text-amber-600 border-amber-200";
    if (name === "BẠC")
      return "bg-slate-50 text-slate-500 border-slate-200";
    return "bg-slate-50 text-slate-500 border-slate-200";
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
              Thống kê khách hàng
            </h1>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mt-1">
              <span>Tổng hành dinh</span>
              <span>❯</span>
              <span className="text-[#006c49] font-bold">
                Thống kê khách hàng
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

        {/* THÔNG BÁO LỖI NẾU CÓ */}
        {error && (
          <div className="mb-4 p-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-xs font-bold text-center">
            {error}
          </div>
        )}

        {/* KHỐI 1: CARDS SỐ LIỆU TỔNG QUAN (ĐỒNG BỘ NỀN VÀ MÀU SẮC DÙNG #006c49) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {customerCards.map((card) => {
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

        {/* KHỐI 2: BẢNG TOP KHÁCH HÀNG THÂN THIẾT */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <Award className="w-4 h-4 text-[#006c49]" />
                Top khách hàng thân thiết
              </h3>
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#006c49] bg-[#006c49]/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono border border-[#006c49]/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#006c49] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#006c49]"></span>
                </span>
                Live DB
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4 rounded-l-xl w-20 text-center">Rank</th>
                  <th className="py-3 px-4">Tên người dùng</th>
                  <th className="py-3 px-4 text-center w-44">Số đơn đã đặt</th>
                  <th className="py-3 px-4 text-right w-44">Tổng chi tiêu</th>
                  <th className="py-3 px-4 text-center rounded-r-xl w-40">
                    Hạng thành viên
                  </th>
                </tr>
              </thead>
              <tbody className="text-xs font-bold text-slate-700">
                {stats.top_customers.length === 0 && !loading ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="text-center py-12 text-slate-400 font-medium italic"
                    >
                      Chưa có dữ liệu khách hàng thân thiết (Chưa có đơn hàng nào hoàn tất).
                    </td>
                  </tr>
                ) : (
                  stats.top_customers.map((user, idx) => (
                    <tr
                      key={user.id || idx}
                      className="border-b border-slate-50 last:border-none hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-center text-slate-400 font-mono font-bold">
                        #{user.rank || idx + 1}
                      </td>
                      <td className="py-3.5 px-4 text-slate-900 font-bold flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#006c49]/10 border border-[#006c49]/20 flex items-center justify-center text-[#006c49] font-black uppercase overflow-hidden shrink-0">
                          {user.name?.charAt(0) || "U"}
                        </div>
                        <span>{user.name}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-600">
                        {user.orders}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 text-sm">
                        {formatFullCurrency(user.spent)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black inline-block border uppercase tracking-wider ${getBadgeStyle(user.badge)}`}
                        >
                          {user.badge || "THÀNH VIÊN"}
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