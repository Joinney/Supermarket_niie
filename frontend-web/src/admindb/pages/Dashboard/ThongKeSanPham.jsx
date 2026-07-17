import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { productApi } from "../../../api/axios";

export default function Dashboard() {
  const [stats, setStats] = useState({
    overview: {
      total_products: 0,
      active_products: 0,
      total_inventory_value: 0,
      total_stock_count: 0,
      out_of_stock_skus: 0,
      in_stock_skus: 0,
      total_skus: 0,
      active_skus: 0,
    },
    top_products_sku: [
      // Dữ liệu mẫu ban đầu phòng khi API chưa phản hồi kịp
      { ten_san_pham: "Áo Polo Classic Pro", sku_count: 24 },
      { ten_san_pham: "Quần Short Kaki Premium", sku_count: 18 },
      { ten_san_pham: "Giày Sneaker Street V1", sku_count: 14 },
      { ten_san_pham: "Áo Khoác Bomber Gió", sku_count: 11 },
    ],
    top_inventory_skus: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openMenu, setOpenMenu] = useState(null);

  const [showModalProd, setShowModalProd] = useState(false);
  const [showModalSku, setShowModalSku] = useState(false);

  // ĐỒNG HỒ REAL-TIME
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchProductStats = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await productApi.get("/products/admin/statistics");

      if (response.data?.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error("Lỗi fetch statistics:", err);
      setError("Không thể nạp dữ liệu thống kê từ máy chủ!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductStats();
  }, []);

  const handleExportPDF = () => {
    setOpenMenu(null);
    window.print();
  };

  const formatCompactCurrency = (amount) => {
    if (!amount || isNaN(amount)) return "0 Đ";
    if (amount >= 1e9) return (amount / 1e9).toFixed(2) + "B Đ";
    if (amount >= 1e6) return (amount / 1e6).toFixed(1) + "M Đ";
    if (amount >= 1e3) return (amount / 1e3).toFixed(0) + "K Đ";
    return amount.toLocaleString("vi-VN") + " Đ";
  };

  const formatFullCurrency = (amount) => {
    if (!amount || isNaN(amount)) return "0 Đ";
    return amount.toLocaleString("vi-VN") + " đ";
  };

  // Tính toán số liệu biểu đồ Donut Trạng thái kho
  const activeSkus = stats.overview.active_skus > 0 ? stats.overview.active_skus : 1;
  const inStockPercent = Math.round((stats.overview.in_stock_skus / activeSkus) * 100);
  const outOfStockPercent = 100 - inStockPercent;

  // Cấu hình SVG cho Donut Chart
  const radius = 15.9155;
  const circumference = 2 * Math.PI * radius; // ~100
  const strokeDashoffsetOut = circumference - outOfStockPercent;

  // Tìm giá trị SKU lớn nhất để chia tỉ lệ chiều dài biểu đồ thanh
  const maxSkuCount = Math.max(...stats.top_products_sku.map((p) => p.sku_count), 1);

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #pdf-report-template, #pdf-report-template * { visibility: visible; }
          #pdf-report-template {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: block !important;
          }
          @page { size: A4 portrait; margin: 15mm; }
        }
      `}</style>

      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="w-full min-h-screen bg-[#fafafa] font-sans text-left text-slate-700 selection:bg-emerald-100 p-4 md:p-6 antialiased overflow-y-auto print:bg-white"
        onClick={() => setOpenMenu(null)}
      >
        <div className="w-full print:hidden">
          
          {/* TIÊU ĐỀ TRANG & TIỆN ÍCH */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Thống kê sản phẩm
              </h1>
            </div>

            <div className="flex items-center flex-wrap gap-2 self-start sm:self-center">
              {loading && (
                <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full animate-pulse mr-2">
                  Đang tải...
                </div>
              )}

              <div className="flex items-center gap-2 border border-slate-200 bg-white px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 shadow-sm cursor-default">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 text-slate-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008ZM16.5 13.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
                </svg>
                <span>
                  {currentTime.toLocaleTimeString("vi-VN")} - {currentTime.toLocaleDateString("vi-VN")}
                </span>
              </div>

              <button
                type="button"
                onClick={fetchProductStats}
                className="p-2 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 transition shadow-sm text-slate-500 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              </button>

              <button
                type="button"
                onClick={handleExportPDF}
                className="px-4 py-1.5 border border-slate-200 bg-white rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 text-slate-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.617 0-1.11-.51-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-14.326 0C3.768 7.441 3 8.376 3 9.456v6.294a2.25 2.25 0 0 0 2.25 2.25h1.091M5.25 9.75h13.5M9 21h6" />
                </svg>
                Xuất báo cáo PDF
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-bold text-center">
              {error}
            </div>
          )}

          {/* KHỐI 1: 4 THẺ TỔNG QUAN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Tổng Sản Phẩm</span>
              <span className="text-2xl font-black text-slate-900 block my-1 tracking-tight">{stats.overview.total_products.toLocaleString()}</span>
              <span className="text-[11px] font-bold text-slate-400">Hoạt động: <span className="text-slate-700 font-extrabold">{stats.overview.active_products.toLocaleString()}</span></span>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Giá trị tồn kho</span>
              <span className="text-2xl font-black text-slate-900 block my-1 tracking-tight">{formatCompactCurrency(stats.overview.total_inventory_value)}</span>
              <span className="text-[11px] font-bold text-slate-400">Số lượng: <span className="text-slate-700 font-extrabold">{stats.overview.total_stock_count.toLocaleString()}</span></span>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">SKU Hết Hàng</span>
              <span className="text-2xl font-black text-slate-900 block my-1 tracking-tight">{stats.overview.out_of_stock_skus.toLocaleString()}</span>
              <span className="text-[11px] font-bold text-slate-400">Có hàng: <span className="text-slate-700 font-extrabold">{stats.overview.in_stock_skus.toLocaleString()}</span></span>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Tổng SKU</span>
              <span className="text-2xl font-black text-slate-900 block my-1 tracking-tight">{stats.overview.total_skus.toLocaleString()}</span>
              <span className="text-[11px] font-bold text-slate-400">Đang bán: <span className="text-slate-700 font-extrabold">{stats.overview.active_skus.toLocaleString()}</span></span>
            </div>
          </div>

          {/* KHỐI 2: HAI BIỂU ĐỒ TRỰC QUAN */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            
            {/* 📊 BIỂU ĐỒ THANH NGANG: TOP SẢN PHẨM NHIỀU SKU */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 md:p-6 shadow-sm lg:col-span-2 flex flex-col justify-between">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 text-slate-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
                  </svg>
                  Xu hướng biến thể hàng hóa (Top SKU)
                </h3>
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenu(openMenu === "topProd" ? null : "topProd");
                    }}
                    className="text-slate-400 hover:text-slate-600 p-1 flex items-center justify-center cursor-pointer rounded-lg hover:bg-slate-50 transition"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                    </svg>
                  </button>
                  {openMenu === "topProd" && (
                    <div className="absolute right-0 top-6 mt-1 w-36 bg-white border border-slate-100 rounded-xl shadow-lg overflow-hidden z-10 text-xs font-bold text-slate-600">
                      <div onClick={fetchProductStats} className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer">Làm mới dữ liệu</div>
                      <div onClick={() => { setShowModalProd(true); setOpenMenu(null); }} className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer text-emerald-600 border-t border-slate-50">Xem tất cả</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Thân biểu đồ Horizontal Bar Chart */}
              <div className="space-y-4 my-auto">
                {stats.top_products_sku.slice(0, 4).map((prod, idx) => {
                  const widthPercent = (prod.sku_count / maxSkuCount) * 100;
                  return (
                    <div key={idx} className="space-y-1 group">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-800 truncate max-w-[80%] group-hover:text-emerald-600 transition-colors">
                          {idx + 1}. {prod.ten_san_pham}
                        </span>
                        <span className="font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px]">
                          {prod.sku_count} SKU
                        </span>
                      </div>
                      <div className="w-full h-3 bg-slate-50 border border-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${widthPercent}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className={`h-full rounded-full ${
                            idx === 0 ? "bg-emerald-600" : idx === 1 ? "bg-emerald-500" : idx === 2 ? "bg-emerald-400" : "bg-cyan-500"
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 🍩 BIỂU ĐỒ BÁNH MÌ VÒNG: TRẠNG THÁI TỒN KHO */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 md:p-6 shadow-sm flex flex-col justify-between">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                Cơ cấu phân bổ trạng thái kho
              </h3>
              
              <div className="relative flex items-center justify-center my-4">
                <svg width="140" height="140" viewBox="0 0 36 36" className="transform -rotate-90">
                  {/* Vòng nền xám */}
                  <circle cx="18" cy="18" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="4.2" />
                  
                  {/* Phân đoạn: Còn hàng (Emerald) */}
                  <circle
                    cx="18" cy="18" r={radius} fill="none" stroke="#10b981" strokeWidth="4.2"
                    strokeDasharray={`${circumference}`}
                    strokeDashoffset={0}
                  />
                  
                  {/* Phân đoạn: Hết hàng (Rose) */}
                  <circle
                    cx="18" cy="18" r={radius} fill="none" stroke="#f43f5e" strokeWidth="4.2"
                    strokeDasharray={`${outOfStockPercent} ${inStockPercent}`}
                    strokeDashoffset={strokeDashoffsetOut}
                  />
                </svg>
                
                <div className="absolute flex flex-col items-center justify-center bg-white rounded-full w-20 h-20 shadow-sm border border-slate-50">
                  <span className="text-xl font-black text-slate-900 font-mono tracking-tight">
                    {inStockPercent}%
                  </span>
                  <span className="text-[8px] uppercase font-black text-emerald-600 tracking-wider">
                    Sẵn sàng
                  </span>
                </div>
              </div>

              {/* Chú thích dữ liệu (Legend) chuẩn UI thực tế */}
              <div className="flex flex-col gap-1.5 border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <div className="flex items-center gap-2 text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-md bg-emerald-500 block shadow-sm"></span>
                    <span>Biến thể khả dụng</span>
                  </div>
                  <span className="font-mono text-slate-900">{stats.overview.in_stock_skus.toLocaleString()} SKU</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <div className="flex items-center gap-2 text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-md bg-rose-500 block shadow-sm"></span>
                    <span>Biến thể đứt hàng</span>
                  </div>
                  <span className="font-mono text-slate-900">{stats.overview.out_of_stock_skus.toLocaleString()} SKU</span>
                </div>
              </div>
            </div>

          </div>

          {/* KHỐI 3: BẢNG LỚN DƯỚI CÙNG */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 md:p-6 shadow-sm relative">
            <div className="flex justify-between items-center mb-4 relative">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Top SKU Theo Giá Trị Tồn Kho
              </h3>
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenu(openMenu === "topValue" ? null : "topValue");
                  }}
                  className="text-slate-400 hover:text-slate-600 p-1 flex items-center justify-center cursor-pointer rounded-lg hover:bg-slate-50 transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                  </svg>
                </button>
                {openMenu === "topValue" && (
                  <div className="absolute right-0 top-6 mt-1 w-36 bg-white border border-slate-100 rounded-xl shadow-lg overflow-hidden z-10 text-xs font-bold text-slate-600">
                    <div onClick={fetchProductStats} className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer">Làm mới dữ liệu</div>
                    <div onClick={() => { setShowModalSku(true); setOpenMenu(null); }} className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer text-emerald-600 border-t border-slate-50">Xem tất cả</div>
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-left border-collapse table-auto min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50/70 text-slate-400 text-[10px] font-black uppercase border-b border-slate-100">
                    <th className="py-3.5 px-4">Cấu trúc Biến thể (SKU)</th>
                    <th className="py-3.5 px-4 text-center w-36">Số lượng tồn</th>
                    <th className="py-3.5 px-4 text-right w-44">Đơn giá</th>
                    <th className="py-3.5 px-4 text-right w-48 pr-6">Giá trị tồn kho</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-700">
                  {stats.top_inventory_skus.slice(0, 5).map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4">
                        <p className="text-slate-900 font-bold text-xs truncate max-w-[350px]">{item.name}</p>
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{item.sku}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs ${item.stock <= 20 ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-800"}`}>
                          {item.stock.toLocaleString("vi-VN")}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono">{formatFullCurrency(item.price)}</td>
                      <td className="py-3.5 px-4 text-right pr-6 font-mono font-black text-emerald-700">{formatFullCurrency(item.total_value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* CÁC MODAL XEM THÊM */}
        <AnimatePresence>
          {showModalProd && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50/50">
                  <h2 className="font-black text-lg text-slate-800">Danh sách Sản phẩm đa dạng SKU</h2>
                  <button type="button" onClick={() => setShowModalProd(false)} className="text-slate-400 hover:text-red-500 font-bold text-xl">&times;</button>
                </div>
                <div className="p-0 overflow-y-auto max-h-[400px]">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-white shadow-sm">
                      <tr className="text-slate-400 text-[10px] font-black uppercase border-b">
                        <th className="py-3 px-6 text-center w-16">STT</th>
                        <th className="py-3 px-6">Tên Sản Phẩm</th>
                        <th className="py-3 px-6 text-center">SKU</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                      {stats.top_products_sku.map((prod, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-3 px-6 text-center font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-6 font-bold">{prod.ten_san_pham}</td>
                          <td className="py-3 px-6 text-center font-mono">{prod.sku_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showModalSku && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50/50">
                  <h2 className="font-black text-lg text-slate-800">Bảng định giá Tồn kho SKU</h2>
                  <button type="button" onClick={() => setShowModalSku(false)} className="text-slate-400 hover:text-red-500 font-bold text-xl">&times;</button>
                </div>
                <div className="p-0 overflow-y-auto max-h-[450px]">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-white shadow-sm">
                      <tr className="text-slate-400 text-[10px] font-black uppercase border-b">
                        <th className="py-3 px-6 w-12">#</th>
                        <th className="py-3 px-6">Tên & Mã SKU</th>
                        <th className="py-3 px-6 text-right">Tồn</th>
                        <th className="py-3 px-6 text-right">Giá trị (VNĐ)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                      {stats.top_inventory_skus.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-3 px-6 font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-6">
                            <p className="font-bold text-slate-800">{item.name}</p>
                            <span className="text-[10px] text-slate-400 font-mono">{item.sku}</span>
                          </td>
                          <td className="py-3 px-6 text-right font-mono">{item.stock}</td>
                          <td className="py-3 px-6 text-right font-mono font-black text-emerald-600">{formatFullCurrency(item.total_value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TEMPLATE BÁO CÁO PDF */}
        <div id="pdf-report-template" className="hidden bg-white text-black font-serif">
          <div className="flex justify-between items-start mb-10 border-b-2 border-black pb-4">
            <div className="text-center">
              <h2 className="text-sm font-bold uppercase">CÔNG TY TNHH DEMI MART</h2>
              <p className="text-xs font-semibold underline decoration-solid underline-offset-4">HỆ THỐNG QUẢN LÝ TỒN KHO</p>
            </div>
            <div className="text-center">
              <h2 className="text-sm font-bold uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h2>
              <p className="text-xs font-bold underline decoration-solid underline-offset-4">Độc lập - Tự do - Hạnh phúc</p>
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-extrabold uppercase mb-2">BÁO CÁO THỐNG KÊ CHẤT LƯỢNG TỒN KHO</h1>
            <p className="text-sm italic">Thời điểm kết xuất: {currentTime.toLocaleTimeString("vi-VN")} - Ngày {currentTime.toLocaleDateString("vi-VN")}</p>
          </div>

          <div className="mb-6">
            <h3 className="font-bold text-lg mb-2 uppercase">I. Thông số Tổng Quan</h3>
            <ul className="list-disc list-inside text-sm space-y-1.5 ml-4">
              <li>Tổng số lượng Sản phẩm gốc: <span className="font-bold">{stats.overview.total_products.toLocaleString()}</span></li>
              <li>Tổng số lượng Biến thể (SKU) đang bán: <span className="font-bold">{stats.overview.active_skus.toLocaleString()}</span></li>
              <li>Tổng giá trị tồn kho ước tính: <span className="font-bold text-red-600">{formatFullCurrency(stats.overview.total_inventory_value)}</span></li>
              <li>SKU cần nhập hàng (Hết kho): <span className="font-bold">{stats.overview.out_of_stock_skus.toLocaleString()}</span></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-2 uppercase">II. Chi tiết Giá Trị Tồn Kho (Top SKU)</h3>
            <table className="w-full border-collapse border border-black text-sm">
              <thead>
                <tr className="bg-gray-100 font-bold text-center">
                  <th className="border border-black px-2 py-2 w-10">STT</th>
                  <th className="border border-black px-2 py-2">Tên Hàng Hóa / Mã SKU</th>
                  <th className="border border-black px-2 py-2 w-20">Tồn dư</th>
                  <th className="border border-black px-2 py-2 w-32">Thành tiền (VNĐ)</th>
                </tr>
              </thead>
              <tbody>
                {stats.top_inventory_skus.slice(0, 30).map((item, index) => (
                  <tr key={index}>
                    <td className="border border-black px-2 py-2 text-center">{index + 1}</td>
                    <td className="border border-black px-2 py-2">
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-[10px] text-gray-600">{item.sku}</p>
                    </td>
                    <td className="border border-black px-2 py-2 text-center">{item.stock}</td>
                    <td className="border border-black px-2 py-2 text-right font-semibold">{formatFullCurrency(item.total_value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mt-16 pt-8 pr-12">
            <div className="text-center">
              <p className="text-sm italic mb-1">TP. Hồ Chí Minh, ngày ... tháng ... năm 202...</p>
              <p className="text-base font-bold">Người lập báo cáo</p>
              <p className="text-xs italic mt-1">(Ký và ghi rõ họ tên)</p>
              <div className="h-24"></div>
            </div>
          </div>
        </div>
      </motion.main>
    </>
  );
}