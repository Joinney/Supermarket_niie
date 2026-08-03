// File: frontend/src/admindb/pages/dashboard/AdminDashboardPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { adminStatsApi } from "../../../api/adminStatsApi";
import { 
  RefreshCw, 
  Calendar as CalendarIcon, 
  ArrowUpRight, 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  PackageCheck, 
  Info,
  ArrowRight
} from "lucide-react";

export default function AdminDashboardPage() {
  const [prodOverview, setProdOverview] = useState({ 
    total_products: 0, 
    total_inventory_value: 0,
    out_of_stock_skus: 0,
    in_stock_skus: 0,
    active_skus: 1
  });
  
  const [orderOverview, setOrderOverview] = useState({ 
    total_orders: 0, 
    total_revenue: 0,
    today_orders: 0,
    pending_orders: 0
  });
  
  const [chartData, setChartData] = useState({ months: [], revenues: [] });
  const [topProducts, setTopProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Xử lý mặc định chọn lọc theo Ngày ("day")
  const [viewType, setViewType] = useState("day"); // day | month | year | custom
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customDates, setCustomDates] = useState({ from: "", to: "" });
  const [hoveredNode, setHoveredNode] = useState(null);

  const syncAllDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      let filters = { groupBy: viewType === "custom" ? "day" : viewType };
      const today = new Date();

      if (viewType === "custom") {
        if (customDates.from) filters.from = customDates.from;
        if (customDates.to) filters.to = customDates.to;
      } else {
        let monthsToSubtract = 6;
        if (viewType === "day") {
          filters.from = new Date(today.setDate(today.getDate() - 30)).toISOString().split("T")[0];
        } else if (viewType === "week") {
          filters.from = new Date(today.setDate(today.getDate() - 84)).toISOString().split("T")[0];
        } else {
          filters.from = new Date(today.setMonth(today.getMonth() - monthsToSubtract)).toISOString().split("T")[0];
        }
      }

      const [prodRes, orderRes, revenueRes, topProdRes] = await Promise.all([
        adminStatsApi.getProductStats(),
        adminStatsApi.getOrderOverview(filters), 
        adminStatsApi.getMonthlyRevenue(filters),
        adminStatsApi.getTopProducts(filters) 
      ]);

      if (prodRes.data?.success) {
        const pData = prodRes.data.data;
        setProdOverview(pData.overview ? pData.overview : pData);
      }
      if (orderRes.data?.success) {
        const oData = orderRes.data.data;
        setOrderOverview(oData.overview ? oData.overview : oData);
      }
      if (revenueRes.data?.success) {
        setChartData(revenueRes.data);
      }
      if (topProdRes.data?.success) {
        setTopProducts(topProdRes.data.data || []);
      }

    } catch (err) {
      console.error("❌ Lỗi mạng:", err);
      setError("Không thể đồng bộ dữ liệu thời gian thực!");
    } finally {
      setLoading(false);
    }
  }, [viewType, customDates]);

  useEffect(() => {
    if (viewType === "custom") {
      if (customDates.from && customDates.to) {
        syncAllDashboardData();
      }
    } else {
      syncAllDashboardData();
    }
  }, [syncAllDashboardData, viewType, customDates]);

  const formatCurrency = (amount) => {
    if (!amount || isNaN(amount)) return "0 đ";
    return amount.toLocaleString("vi-VN") + " đ";
  };

  let displayLabels = [...(chartData?.months || [])];
  let displayRevenues = [...(chartData?.revenues || [])];

  if (displayLabels.length === 0) {
    displayLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];
    displayRevenues = [420000, 580000, 450000, 720000, 630000, 810000, 750000, 920000];
  }

  const svgWidth = 550;
  const svgHeight = 220;
  const padding = { top: 20, right: 20, bottom: 30, left: 20 };
  const maxRevenue = Math.max(...displayRevenues, 100000);

  const barPoints = displayRevenues.map((val, idx) => {
    const x = padding.left + (idx / Math.max(displayLabels.length - 1, 1)) * (svgWidth - padding.left - padding.right);
    const height = (val / maxRevenue) * (svgHeight - padding.top - padding.bottom);
    const y = svgHeight - padding.bottom - height;
    return { x, y, height, value: val, label: displayLabels[idx] };
  });

  const activeSkusCount = prodOverview?.active_skus > 0 ? prodOverview.active_skus : 1;
  const inStockPercent = Math.round(((prodOverview?.in_stock_skus || 0) / activeSkusCount) * 100) || 75;
  const outOfStockPercent = Math.round(((prodOverview?.out_of_stock_skus || 0) / activeSkusCount) * 100) || 25;

  return (
    <div className="w-full bg-[#f8fafc] min-h-screen text-slate-800 font-sans p-4 md:p-6 pb-12">
      
      {/* 🌟 1. TOOLBAR TÙY CHỈNH THỜI GIAN & BỘ LỊCH TỪ NGÀY -> ĐẾN NGÀY */}
      <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* NÚT CHỌN NGÀY / THÁNG / NĂM */}
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200/80 shadow-xs">
          {[
            { id: "day", label: "Ngày" },
            { id: "month", label: "Tháng" },
            { id: "year", label: "Năm" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setViewType(tab.id);
                setShowDatePicker(false);
              }}
              className={`px-5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewType === tab.id && !showDatePicker
                  ? "bg-[#006c49] text-white shadow-sm font-black" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* NÚT TÙY CHỈNH NGÀY + KHU VỰC BẢNG LỊCH */}
        <div className="relative flex items-center gap-3">
          {loading && (
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#006c49] bg-[#006c49]/10 px-3 py-1.5 rounded-xl">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>ĐỒNG BỘ LIVE...</span>
            </div>
          )}

          {/* Nút bấm bật/tắt Lịch */}
          <button 
            onClick={() => {
              setShowDatePicker(!showDatePicker);
              setViewType("custom");
            }}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
              showDatePicker || viewType === "custom"
                ? "bg-[#006c49] text-white border border-[#006c49]"
                : "bg-white text-slate-700 border border-slate-200/80 hover:border-[#006c49]"
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Tùy chỉnh ngày</span>
          </button>

          {/* BỘ CHỌN LỊCH TỪ NGÀY - ĐẾN NGÀY (POPOVER) */}
          <AnimatePresence>
            {showDatePicker && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                className="absolute right-0 top-11 z-50 bg-white p-4 rounded-2xl border border-slate-200 shadow-xl flex flex-col sm:flex-row items-center gap-3 min-w-[320px]"
              >
                <div className="flex flex-col gap-1 w-full sm:w-auto">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Từ ngày</label>
                  <input
                    type="date"
                    value={customDates.from}
                    onChange={(e) => setCustomDates(prev => ({ ...prev, from: e.target.value }))}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-[#006c49] cursor-pointer"
                  />
                </div>

                <ArrowRight className="w-4 h-4 text-slate-300 hidden sm:block mt-4" />

                <div className="flex flex-col gap-1 w-full sm:w-auto">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Đến ngày</label>
                  <input
                    type="date"
                    value={customDates.to}
                    onChange={(e) => setCustomDates(prev => ({ ...prev, to: e.target.value }))}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-[#006c49] cursor-pointer"
                  />
                </div>

                <button
                  onClick={() => setShowDatePicker(false)}
                  className="mt-4 sm:mt-4 w-full sm:w-auto bg-[#006c49] text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-[#005539] transition-all cursor-pointer"
                >
                  Lọc
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-xs font-bold text-center">
          {error}
        </div>
      )}

      {/* 🌟 2. HÀNG CARDS THỐNG KÊ KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">TỔNG DOANH THU</span>
            <div className="p-2 rounded-xl bg-[#006c49]/10 text-[#006c49]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h2 className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {formatCurrency(orderOverview?.total_revenue)}
            </h2>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-[#006c49]">
            <ArrowUpRight className="w-3.5 h-3.5 stroke-[3]" />
            <span>12.5%</span>
            <span className="text-slate-400 font-normal">so với trước</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">SỐ LƯỢNG ĐƠN HÀNG</span>
            <div className="p-2 rounded-xl bg-[#006c49]/10 text-[#006c49]">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h2 className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {(orderOverview?.total_orders ?? 0).toLocaleString()}
            </h2>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-[#006c49]">
            <ArrowUpRight className="w-3.5 h-3.5 stroke-[3]" />
            <span>8.2%</span>
            <span className="text-slate-400 font-normal">Hôm nay: {orderOverview?.today_orders || 0} đơn</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">TỶ LỆ TỒN KHO TỐI ƯU</span>
            <div className="p-2 rounded-xl bg-[#006c49]/10 text-[#006c49]">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h2 className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {inStockPercent}%
            </h2>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-[#006c49]">
            <span>🎯 Mục tiêu đạt 95%</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">ĐƠN GIÁ TRUNG BÌNH</span>
            <div className="p-2 rounded-xl bg-[#006c49]/10 text-[#006c49]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h2 className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {formatCurrency(orderOverview?.total_revenue / (orderOverview?.total_orders || 1))}
            </h2>
          </div>
          <div className="mt-3 text-[11px] font-normal text-slate-400">
            Tính toán trên {orderOverview?.total_orders || 0} đơn
          </div>
        </div>
      </div>

      {/* 🌟 3. BIỂU ĐỒ CỘT & CƠ CẤU */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-extrabold text-slate-800">Biểu đồ doanh thu theo thời gian</h3>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full bg-[#006c49]"></span>
              <span>Doanh thu</span>
            </div>
          </div>

          <div className="w-full relative mt-4">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible">
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const y = padding.top + ratio * (svgHeight - padding.top - padding.bottom);
                return <line key={i} x1={padding.left} y1={y} x2={svgWidth - padding.right} y2={y} stroke="#f1f5f9" strokeWidth="1" />;
              })}

              {barPoints.map((p, idx) => {
                const barWidth = 28;
                return (
                  <g key={idx} className="cursor-pointer group" onMouseEnter={() => setHoveredNode(p)} onMouseLeave={() => setHoveredNode(null)}>
                    <rect
                      x={p.x - barWidth / 2}
                      y={p.y}
                      width={barWidth}
                      height={Math.max(p.height, 4)}
                      fill="#006c49"
                      fillOpacity="0.12"
                      rx="4"
                      className="group-hover:fill-opacity-25 transition-all"
                    />
                    <rect
                      x={p.x - barWidth / 2}
                      y={p.y}
                      width={barWidth}
                      height={3}
                      fill="#006c49"
                      rx="1.5"
                    />
                  </g>
                );
              })}
            </svg>

            <div className="flex justify-between items-center mt-3 px-1">
              {displayLabels.map((label, idx) => (
                <span key={idx} className="flex-1 text-[11px] font-bold text-slate-400 text-center">
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-extrabold text-slate-800">Cơ cấu trạng thái kho</h3>
            <Info className="w-4 h-4 text-slate-400 cursor-pointer" />
          </div>

          <div className="relative flex items-center justify-center my-4">
            <svg width="150" height="150" viewBox="0 0 36 36" className="transform -rotate-90">
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="4.5" />
              <circle
                cx="18" cy="18" r="15.915" fill="none" stroke="#006c49" strokeWidth="4.5"
                strokeDasharray={`${inStockPercent} ${100 - inStockPercent}`}
                strokeDashoffset="0"
              />
              <circle
                cx="18" cy="18" r="15.915" fill="none" stroke="#e11d48" strokeWidth="4.5"
                strokeDasharray={`${outOfStockPercent} ${100 - outOfStockPercent}`}
                strokeDashoffset={`-${inStockPercent}`}
              />
            </svg>

            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">TỔNG SKU</span>
              <span className="text-base font-black text-slate-900 font-mono">
                {prodOverview?.active_skus || 0}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 border-t border-slate-50 pt-3 text-xs font-bold">
            <div className="flex items-center justify-between text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#006c49]"></span>
                <span>Biến thể khả dụng</span>
              </div>
              <span className="font-mono text-slate-900">{inStockPercent}%</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                <span>Biến thể đứt hàng</span>
              </div>
              <span className="font-mono text-slate-900">{outOfStockPercent}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 🌟 4. TẦNG DƯỚI: PHÂN BỔ & TOP SẢN PHẨM */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs flex flex-col justify-between">
          <h3 className="text-sm font-extrabold text-slate-800 mb-4">Số lượng sản phẩm kho</h3>
          
          <div className="flex flex-col gap-4">
            <div>
              <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                <span className="text-slate-600">Sản phẩm khả dụng</span>
                <span className="font-mono text-slate-900">{prodOverview?.in_stock_skus || 0} SKU</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#006c49] rounded-full" style={{ width: `${inStockPercent}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                <span className="text-slate-600">Sản phẩm hết hàng</span>
                <span className="font-mono text-slate-900">{prodOverview?.out_of_stock_skus || 0} SKU</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: `${outOfStockPercent}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                <span className="text-slate-600">Đơn chờ duyệt</span>
                <span className="font-mono text-slate-900">{orderOverview?.pending_orders || 0} đơn</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `45%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-extrabold text-slate-800">Sản phẩm bán chạy nhất</h3>
            <button className="text-xs font-bold text-[#006c49] hover:underline cursor-pointer">Xem tất cả</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3 rounded-l-xl">Sản phẩm</th>
                  <th className="py-2.5 px-3 text-center">Số lượng</th>
                  <th className="py-2.5 px-3 text-right rounded-r-xl">Doanh thu</th>
                </tr>
              </thead>
              <tbody className="text-xs font-bold text-slate-700">
                {topProducts.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="text-center py-6 text-slate-400">Chưa có dữ liệu sản phẩm</td>
                  </tr>
                ) : (
                  topProducts.slice(0, 5).map((prod, idx) => (
                    <tr key={idx} className="border-b border-slate-50 last:border-none hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black text-[#006c49] font-mono">
                          {idx + 1}
                        </div>
                        <span className="text-slate-900 font-bold truncate max-w-[200px]">
                          {prod.name || prod.ten_san_pham}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-500">
                        {(prod.sales || prod.so_luong_ban || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-black text-slate-900">
                        {formatCurrency(prod.revenue || prod.tong_doanh_thu)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}