// File: frontend/src/admindb/pages/dashboard/AdminDashboardPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { adminStatsApi } from "../../../api/adminStatsApi";
import { RefreshCw, Calendar, ArrowUpRight, ArrowDownRight, Trophy, PackageCheck, AlertCircle } from "lucide-react";

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
  
  const [timeFilter, setTimeFilter] = useState("6months");
  const [viewType, setViewType] = useState("month");
  const [customDates, setCustomDates] = useState({ from: "", to: "" });
  const [hoveredNode, setHoveredNode] = useState(null);

  const syncAllDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      let filters = { groupBy: viewType };
      const today = new Date();

      if (timeFilter === "custom") {
        if (customDates.from) filters.from = customDates.from;
        if (customDates.to) filters.to = customDates.to;
      } else {
        let monthsToSubtract = 6;
        if (timeFilter === "3months") monthsToSubtract = 3;
        
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
      setError("Không thể đồng bộ dữ liệu thời gian thực từ mạng lưới Microservices!");
    } finally {
      setLoading(false);
    }
  }, [timeFilter, viewType, customDates]);

  useEffect(() => {
    syncAllDashboardData();
  }, [syncAllDashboardData]);

  const formatCurrency = (amount) => {
    if (!amount || isNaN(amount)) return "0 đ";
    return amount.toLocaleString("vi-VN") + " đ";
  };

  let displayLabels = [...(chartData?.months || [])];
  let displayRevenues = [...(chartData?.revenues || [])];

  if (displayLabels.length === 0) {
    displayLabels = ["Kỳ 1", "Kỳ 2", "Kỳ 3", "Kỳ 4", "Kỳ 5"];
    displayRevenues = [0, 0, 0, 0, 0];
  } else if (displayLabels.length === 1) {
    displayLabels = ["Khởi tạo", displayLabels[0], "Kỳ kế"];
    displayRevenues = [0, displayRevenues[0], displayRevenues[0]];
  }

  const svgWidth = 500;
  const svgHeight = 220;
  const padding = { top: 30, right: 30, bottom: 25, left: 55 };
  
  const pointsCount = displayLabels.length;
  const maxRevenue = Math.max(...displayRevenues, 1000000);

  const realPoints = displayRevenues.map((val, idx) => {
    const x = padding.left + (idx / Math.max(pointsCount - 1, 1)) * (svgWidth - padding.left - padding.right);
    const y = svgHeight - padding.bottom - (val / maxRevenue) * (svgHeight - padding.top - padding.bottom);
    return { x, y, value: val, label: displayLabels[idx] };
  });

  const targetPoints = displayRevenues.map((val, idx) => {
    const x = padding.left + (idx / Math.max(pointsCount - 1, 1)) * (svgWidth - padding.left - padding.right);
    const mockTargetVal = val === 0 ? maxRevenue * 0.2 * (idx + 1) : val * 1.15;
    const y = svgHeight - padding.bottom - (mockTargetVal / maxRevenue) * (svgHeight - padding.top - padding.bottom);
    return { x, y };
  });

  const generatePathString = (points) => {
    if (points.length === 0) return "";
    return points.reduce((acc, p, idx) => idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, "");
  };

  const realPathD = generatePathString(realPoints);
  const targetPathD = generatePathString(targetPoints);
  const areaPathD = realPoints.length > 0 ? `${realPathD} L ${realPoints[realPoints.length - 1].x} ${svgHeight - padding.bottom} L ${realPoints[0].x} ${svgHeight - padding.bottom} Z` : "";

  // =========================================================================
  // ⚡ THUẬT TOÁN BIỂU ĐỒ MỚI: RADIAL BAR RINGS ĐỒNG TÂM CAO CẤP
  // =========================================================================
  const activeSkusCount = prodOverview?.active_skus > 0 ? prodOverview.active_skus : 1;
  const inStockPercent = Math.round(((prodOverview?.in_stock_skus || 0) / activeSkusCount) * 100) || 0;
  const outOfStockPercent = Math.round(((prodOverview?.out_of_stock_skus || 0) / activeSkusCount) * 100) || 0;

  // Tính toán chu vi tương ứng cho 2 vòng nhẫn đồng tâm lớn nhỏ khác nhau
  const radiusOuter = 15; // Vòng ngoài (Khả dụng)
  const radiusInner = 11; // Vòng trong (Đứt hàng)
  const circOuter = 2 * Math.PI * radiusOuter;
  const circInner = 2 * Math.PI * radiusInner;

  const offsetOuter = circOuter - (inStockPercent / 100) * circOuter;
  const offsetInner = circInner - (outOfStockPercent / 100) * circInner;

  return (
    <div className="w-full text-slate-700 font-sans p-2">
      {/* TOOLBAR TIÊU ĐỀ */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Bảng Điều Khiển Trung Tâm</h1>
          <p className="text-xs text-slate-400 mt-0.5">Hệ thống phân tích Insight kinh doanh cao cấp của Demi Mart.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {loading && (
            <div className="flex items-center gap-1.5 text-[11px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-xl">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>ĐỒNG BỘ LIVE...</span>
            </div>
          )}

          {timeFilter === "custom" && (
            <div className="flex items-center gap-2 border border-slate-200 bg-slate-50/50 p-1 rounded-xl">
              <input type="date" value={customDates.from} onChange={(e) => setCustomDates(prev => ({...prev, from: e.target.value}))} className="bg-transparent text-[11px] font-bold outline-none cursor-pointer text-slate-600" />
              <span className="text-[10px] font-bold text-slate-400">❯</span>
              <input type="date" value={customDates.to} onChange={(e) => setCustomDates(prev => ({...prev, to: e.target.value}))} className="bg-transparent text-[11px] font-bold outline-none cursor-pointer text-slate-600" />
            </div>
          )}

          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm hover:border-slate-300">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} className="bg-transparent border-none outline-none cursor-pointer font-black text-slate-700">
              <option value="6months">6 tháng qua</option>
              <option value="3months">3 tháng qua</option>
              <option value="all">Toàn chu kỳ</option>
              <option value="custom">📅 Chọn ngày cụ thể...</option>
            </select>
          </div>
        </div>
      </div>

      {error && <div className="mb-4 p-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-xs font-bold text-center">{error}</div>}

      {/* KPI WIDGETS TẦNG 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { title: "Doanh thu thuần", value: formatCurrency(orderOverview?.total_revenue), label: "Trạng thái PAID", icon: ArrowUpRight, color: "text-blue-500", bg: "bg-blue-50" },
          { title: "Đơn đặt hàng", value: `${(orderOverview?.total_orders ?? 0).toLocaleString()} Đơn`, label: `Hôm nay: ${orderOverview?.today_orders}`, icon: ArrowUpRight, color: "text-purple-500", bg: "bg-purple-50" },
          { title: "Khách hàng mới", value: "12,740", label: "Tỷ lệ tương tác: 15.3%", icon: ArrowUpRight, color: "text-emerald-500", bg: "bg-emerald-50" },
          { title: "Tỷ lệ hủy đơn", value: "1.25%", label: "Biến động: -2.3%", icon: ArrowDownRight, color: "text-rose-500", bg: "bg-rose-50" }
        ].map((item, idx) => (
          <div key={idx} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-all group">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block group-hover:text-slate-600">{item.title}</span>
              <span className="text-2xl font-black text-slate-900 block tracking-tight mt-1 font-mono">{item.value}</span>
            </div>
            <div className="flex items-center justify-between mt-4 pt-2 border-t border-slate-50">
              <span className="text-[11px] font-medium text-slate-400">{item.label}</span>
              <span className={`flex items-center gap-0.5 text-[10px] font-black ${item.color} ${item.bg} px-1.5 py-0.5 rounded-lg`}><item.icon className="w-3 h-3 stroke-[2.5]" /></span>
            </div>
          </div>
        ))}
      </div>

      {/* BIỂU ĐỒ DOANH THU ĐƯỜNG CONG TẦNG 2 KÈM BIỂU ĐỒ RADIAL ĐỒNG TÂM MỚI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white border border-slate-100 rounded-2xl p-5 md:p-6 shadow-sm lg:col-span-2 flex flex-col justify-between relative min-h-[340px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Doanh thu tích hợp</h3>
              <p className="text-xs text-slate-400 mt-0.5">Di chuột vào các nút thắt để xem doanh thu chi tiết.</p>
            </div>
            <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200/50 text-[10px] font-black shadow-inner">
              {['day', 'week', 'month', 'year'].map((tab) => (
                <button key={tab} type="button" onClick={() => setViewType(tab)} className={`px-3 py-1.5 rounded-lg uppercase tracking-wider ${viewType === tab ? "bg-white text-blue-600 shadow-sm font-black" : "text-slate-400"}`}>
                  {tab === 'day' ? 'Ngày' : tab === 'week' ? 'Tuần' : tab === 'month' ? 'Tháng' : 'Năm'}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full relative mt-4">
            <AnimatePresence>
              {hoveredNode && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute bg-slate-900 text-white p-2 rounded-xl text-xs font-bold shadow-xl border border-slate-800 pointer-events-none" style={{ left: `${hoveredNode.x - 40}px`, top: `${hoveredNode.y - 50}px`, zIndex: 50 }}>
                  <p className="text-[9px] text-slate-400 uppercase font-black">{hoveredNode.label}</p>
                  <p className="font-mono text-blue-400 mt-0.5">{formatCurrency(hoveredNode.value)}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible">
              <defs>
                <linearGradient id="blueAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.00" />
                </linearGradient>
              </defs>
              
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const y = padding.top + ratio * (svgHeight - padding.top - padding.bottom);
                return <line key={i} x1={padding.left} y1={y} x2={svgWidth - padding.right} y2={y} stroke="#f1f5f9" strokeWidth="1.2" />;
              })}
              
              {realPoints.map((p, idx) => {
                const barWidth = 14;
                const barHeight = svgHeight - padding.bottom - p.y;
                return (
                  <motion.rect
                    key={`bar-${idx}`}
                    initial={{ height: 0, y: svgHeight - padding.bottom }}
                    animate={{ height: Math.max(barHeight, 2), y: p.y }}
                    transition={{ duration: 0.4 }}
                    x={p.x - barWidth / 2}
                    width={barWidth}
                    fill="#3b82f6"
                    className="opacity-[0.12]"
                    rx="3"
                  />
                );
              })}
              
              {areaPathD && <path d={areaPathD} fill="url(#blueAreaGradient)" />}
              {targetPathD && <path d={targetPathD} fill="none" stroke="#10b981" strokeWidth="1.8" strokeDasharray="4 4" className="opacity-40" />}
              {realPathD && <path d={realPathD} fill="none" stroke="#3b82f6" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />}
              
              {realPoints.map((p, i) => (
                <g key={i} className="cursor-pointer" onMouseEnter={() => setHoveredNode(p)} onMouseLeave={() => setHoveredNode(null)}>
                  <circle cx={p.x} cy={p.y} r="4" fill="#ffffff" stroke="#3b82f6" strokeWidth="2.5" />
                  <circle cx={p.x} cy={p.y} r="10" fill="#3b82f6" className="opacity-0 hover:opacity-10 transition-opacity" />
                </g>
              ))}
            </svg>
            <div className="flex justify-between items-center mt-3 px-1">
              {displayLabels.map((label, idx) => <span key={idx} className="flex-1 text-[9px] font-bold font-mono text-slate-400 text-center truncate">{label}</span>)}
            </div>
          </div>

          <div className="flex items-center gap-5 mt-4 justify-center text-[10px] font-black text-slate-500 uppercase tracking-wider">
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-blue-500/20 inline-block rounded-sm"></span><span>Khối lượng cột</span></div>
            <div className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-[#3b82f6] inline-block rounded-full"></span><span>Doanh thu thực</span></div>
          </div>
        </div>

        {/* 🌟 THAY ĐỔI BIỂU ĐỒ TRÒN SANG: RADIAL BAR RINGS ĐỒNG TÂM KIỂU MỚI CAO CẤP */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 md:p-6 shadow-sm flex flex-col justify-between">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Phân bổ trạng thái tồn kho</h3>
          
          <div className="relative flex items-center justify-center my-6">
            <svg width="140" height="140" viewBox="0 0 36 36" className="transform -rotate-90 overflow-visible">
              {/* 1. Track và Ring ngoài cho sản phẩm Khả dụng (Màu xanh lá) */}
              <circle cx="18" cy="18" r={radiusOuter} fill="none" stroke="#f1f5f9" strokeWidth="2.8" />
              <motion.circle 
                cx="18" cy="18" r={radiusOuter} fill="none" stroke="#10b981" strokeWidth="2.8" strokeLinecap="round"
                initial={{ strokeDashoffset: circOuter }}
                animate={{ strokeDashoffset: offsetOuter }}
                strokeDasharray={`${circOuter}`}
                transition={{ duration: 0.6 }}
              />

              {/* 2. Track và Ring trong cho sản phẩm Đứt hàng (Màu hồng đỏ) */}
              <circle cx="18" cy="18" r={radiusInner} fill="none" stroke="#f1f5f9" strokeWidth="2.8" />
              <motion.circle 
                cx="18" cy="18" r={radiusInner} fill="none" stroke="#f43f5e" strokeWidth="2.8" strokeLinecap="round"
                initial={{ strokeDashoffset: circInner }}
                animate={{ strokeDashoffset: offsetInner }}
                strokeDasharray={`${circInner}`}
                transition={{ duration: 0.6, delay: 0.1 }}
              />
            </svg>
            
            {/* Tỷ lệ trung tâm hiển thị trạng thái chính */}
            <div className="absolute flex flex-col items-center justify-center bg-white rounded-full w-14 h-14 shadow-sm border border-slate-50">
              <span className="text-base font-black text-slate-900 font-mono">{inStockPercent}%</span>
              <span className="text-[7px] uppercase font-black text-slate-400 tracking-wider">Tối ưu</span>
            </div>
          </div>

          {/* Thiết kế các thanh Legend tiến trình thanh mảnh đi kèm */}
          <div className="flex flex-col gap-3 border-t border-slate-50 pt-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <PackageCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Biến thể khả dụng</span>
                </div>
                <span className="font-mono text-slate-900">{inStockPercent}% ({prodOverview.in_stock_skus} SKU)</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${inStockPercent}%` }}></div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                  <span>Biến thể đứt hàng</span>
                </div>
                <span className="font-mono text-slate-900">{outOfStockPercent}% ({prodOverview.out_of_stock_skus} SKU)</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: `${outOfStockPercent}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DANH SÁCH TOP SẢN PHẨM BÁN CHẠY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white border border-slate-100 rounded-2xl p-5 md:p-6 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Top biến thể sản phẩm dẫn đầu doanh thu</h3>
          </div>
          <div className="overflow-x-auto">
            {topProducts.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 font-bold uppercase">Không có dữ liệu sản phẩm bán chạy</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    <th className="pb-3">Tên sản phẩm</th>
                    <th className="pb-3 text-center">Đã bán</th>
                    <th className="pb-3 text-right">Tổng doanh thu</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-bold text-slate-600">
                  {topProducts.map((prod, index) => (
                    <tr key={prod.id || index} className="border-b border-slate-50 last:border-none hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 flex items-center gap-2.5">
                        <span className="w-5 h-5 flex items-center justify-center rounded-lg bg-slate-100 text-[10px] font-black text-slate-500 font-mono">{index + 1}</span>
                        <span className="text-slate-800 truncate max-w-[240px]">{prod.name || prod.ten_san_pham}</span>
                      </td>
                      <td className="py-3 text-center font-mono text-slate-500">{(prod.sales || prod.so_luong_ban || 0).toLocaleString()}</td>
                      <td className="py-3 text-right font-mono text-emerald-600">{formatCurrency(prod.revenue || prod.tong_doanh_thu)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* KHỐI SỐ LIỆU TỒN KHO DỌC */}
        <div className="flex flex-col gap-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex-1 flex flex-col justify-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Sản phẩm gốc kinh doanh</span>
            <span className="text-xl font-black text-slate-900 font-mono mt-1">{(prodOverview?.total_products ?? 0).toLocaleString()} Mã</span>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex-1 flex flex-col justify-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Giá trị tài sản kho</span>
            <span className="text-xl font-black text-slate-900 font-mono mt-1">{formatCurrency(prodOverview?.total_inventory_value)}</span>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex-1 flex flex-col justify-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Đơn chờ duyệt hệ thống</span>
            <span className="text-xl font-black text-slate-900 font-mono mt-1">{(orderOverview?.pending_orders ?? 0).toLocaleString()} Đơn</span>
          </div>
        </div>
      </div>
    </div>
  );
}