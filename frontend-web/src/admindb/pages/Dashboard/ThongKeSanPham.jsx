import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
// 🌟 ĐÃ XÓA SẠCH html2canvas và jspdf

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
    top_products_sku: [],
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
      const token = localStorage.getItem("adminToken");
      const apiUrl =
        import.meta.env.VITE_API_PRODUCT_URL || "http://localhost:5002";

      const response = await axios.get(
        `${apiUrl}/api/products/admin/statistics`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data?.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      setError("Không thể nạp dữ liệu thống kê từ máy chủ!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductStats();
  }, []);

  // 🌟 HÀM XUẤT PDF CHUẨN NATIVE (KHÔNG DÙNG THƯ VIỆN)
  const handleExportPDF = () => {
    setOpenMenu(null);
    // Gọi lệnh in mặc định của trình duyệt. CSS @media print (ở cuối file) sẽ lo phần còn lại.
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

  const badgeColors = [
    "bg-blue-50 text-blue-600",
    "bg-emerald-50 text-emerald-600",
    "bg-cyan-50 text-cyan-600",
    "bg-amber-50 text-amber-600",
  ];

  const activeSkus =
    stats.overview.active_skus > 0 ? stats.overview.active_skus : 1;
  const inStockPercent = Math.round(
    (stats.overview.in_stock_skus / activeSkus) * 100,
  );
  const outOfStockPercent = 100 - inStockPercent;

  return (
    <>
      {/* 🌟 CSS MA THUẬT DÀNH RIÊNG CHO LỆNH PRINT */}
      <style>{`
        @media print {
          /* Ẩn toàn bộ giao diện nền web */
          body * { visibility: hidden; }
          
          /* Chỉ hiển thị template báo cáo */
          #pdf-report-template, #pdf-report-template * { visibility: visible; }
          
          /* Kéo template lên góc trái cùng trang giấy */
          #pdf-report-template {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: block !important; /* Đè lệnh hidden của Tailwind */
          }
          
          /* Chỉnh khổ giấy A4, ẩn header/footer mặc định của trình duyệt */
          @page { size: A4 portrait; margin: 15mm; }
        }
      `}</style>

      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="w-full min-h-screen bg-[#fafafa] font-sans text-left text-slate-700 selection:bg-emerald-100 p-1 antialiased overflow-y-auto print:bg-white"
        onClick={() => setOpenMenu(null)}
      >
        <div className="w-full print:hidden">
          {" "}
          {/* print:hidden để ẩn cục này khi in */}
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
                <span>
                  📅 {currentTime.toLocaleTimeString("vi-VN")} -{" "}
                  {currentTime.toLocaleDateString("vi-VN")}
                </span>
              </div>

              <button
                type="button"
                onClick={fetchProductStats}
                className="p-2 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 transition shadow-sm text-slate-500 cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                  />
                </svg>
              </button>

              <button
                type="button"
                onClick={handleExportPDF}
                className="px-4 py-1.5 border border-slate-200 bg-white rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                🖨️ Xuất báo cáo PDF
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
              <span className="text-[10px] font-black text-slate-400 uppercase">
                Tổng Sản Phẩm
              </span>
              <span className="text-2xl font-black text-slate-900 block my-1">
                {stats.overview.total_products.toLocaleString()}
              </span>
              <span className="text-[11px] font-bold text-slate-400">
                Hoạt động:{" "}
                <span className="text-slate-700 font-extrabold">
                  {stats.overview.active_products.toLocaleString()}
                </span>
              </span>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase">
                Giá trị tồn kho
              </span>
              <span className="text-2xl font-black text-slate-900 block my-1">
                {formatCompactCurrency(stats.overview.total_inventory_value)}
              </span>
              <span className="text-[11px] font-bold text-slate-400">
                Số lượng:{" "}
                <span className="text-slate-700 font-extrabold">
                  {stats.overview.total_stock_count.toLocaleString()}
                </span>
              </span>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase">
                SKU Hết Hàng
              </span>
              <span className="text-2xl font-black text-slate-900 block my-1">
                {stats.overview.out_of_stock_skus.toLocaleString()}
              </span>
              <span className="text-[11px] font-bold text-slate-400">
                Có hàng:{" "}
                <span className="text-slate-700 font-extrabold">
                  {stats.overview.in_stock_skus.toLocaleString()}
                </span>
              </span>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase">
                Tổng SKU
              </span>
              <span className="text-2xl font-black text-slate-900 block my-1">
                {stats.overview.total_skus.toLocaleString()}
              </span>
              <span className="text-[11px] font-bold text-slate-400">
                Đang bán:{" "}
                <span className="text-slate-700 font-extrabold">
                  {stats.overview.active_skus.toLocaleString()}
                </span>
              </span>
            </div>
          </div>
          {/* KHỐI 2: HAI BẢNG */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-white border border-slate-100 rounded-2xl p-5 md:p-6 shadow-sm lg:col-span-2 relative">
              <div className="flex justify-between items-center mb-4 relative">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Top Sản Phẩm Có Nhiều SKU Nhất
                </h3>
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenu(openMenu === "topProd" ? null : "topProd");
                    }}
                    className="text-slate-400 hover:text-slate-600 font-bold text-xs p-1"
                  >
                    •••
                  </button>
                  {openMenu === "topProd" && (
                    <div className="absolute right-0 top-6 mt-1 w-36 bg-white border border-slate-100 rounded-xl shadow-lg overflow-hidden z-10 text-xs font-bold text-slate-600">
                      <div
                        onClick={fetchProductStats}
                        className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer"
                      >
                        Làm mới dữ liệu
                      </div>
                      <div
                        onClick={() => {
                          setShowModalProd(true);
                          setOpenMenu(null);
                        }}
                        className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer text-emerald-600 border-t border-slate-50"
                      >
                        Xem tất cả
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-50">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 text-slate-400 text-[10px] font-black uppercase border-b border-slate-100">
                      <th className="py-2.5 px-4 w-12 text-center">#</th>
                      <th className="py-2.5 px-4">Tên Sản phẩm</th>
                      <th className="py-2.5 px-4 text-right pr-6">
                        Số lượng SKU
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-700">
                    {stats.top_products_sku.slice(0, 4).map((prod, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-4 text-center text-slate-400 font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {prod.ten_san_pham}
                        </td>
                        <td className="py-3 px-4 text-right pr-6 font-mono">
                          {prod.sku_count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-5 md:p-6 shadow-sm">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                Trạng Thái Tồn Kho (Đang Bán)
              </h3>
              <div className="relative flex items-center justify-center my-4">
                <svg
                  width="130"
                  height="130"
                  viewBox="0 0 36 36"
                  className="transform -rotate-90"
                >
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="none"
                    stroke="#f8fafc"
                    strokeWidth="4"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="4"
                    strokeDasharray={`${inStockPercent} 100`}
                    strokeDashoffset="0"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="4"
                    strokeDasharray={`${outOfStockPercent} 100`}
                    strokeDashoffset={`-${inStockPercent}`}
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-lg font-black text-slate-900 font-mono">
                    {stats.overview.active_skus.toLocaleString()}
                  </span>
                  <span className="text-[8px] uppercase font-bold text-slate-400">
                    SKU
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-2 text-[10px] font-bold text-slate-500 border-t border-slate-50 pt-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 block"></span>{" "}
                  Có sẵn ({stats.overview.in_stock_skus})
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 block"></span>{" "}
                  Hết hàng ({stats.overview.out_of_stock_skus})
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
                  className="text-slate-400 hover:text-slate-600 font-bold text-xs p-1"
                >
                  •••
                </button>
                {openMenu === "topValue" && (
                  <div className="absolute right-0 top-6 mt-1 w-36 bg-white border border-slate-100 rounded-xl shadow-lg overflow-hidden z-10 text-xs font-bold text-slate-600">
                    <div
                      onClick={fetchProductStats}
                      className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer"
                    >
                      Làm mới dữ liệu
                    </div>
                    <div
                      onClick={() => {
                        setShowModalSku(true);
                        setOpenMenu(null);
                      }}
                      className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer text-emerald-600 border-t border-slate-50"
                    >
                      Xem tất cả
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-left border-collapse table-auto min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50/70 text-slate-400 text-[10px] font-black uppercase border-b border-slate-100">
                    <th className="py-3.5 px-4">Cấu trúc Biến thể (SKU)</th>
                    <th className="py-3.5 px-4 text-center w-36">
                      Số lượng tồn
                    </th>
                    <th className="py-3.5 px-4 text-right w-44">Đơn giá</th>
                    <th className="py-3.5 px-4 text-right w-48 pr-6">
                      Giá trị tồn kho
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-700">
                  {stats.top_inventory_skus.slice(0, 5).map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/60 transition"
                    >
                      <td className="py-3.5 px-4">
                        <p className="text-slate-900 font-bold text-xs truncate max-w-[350px]">
                          {item.name}
                        </p>
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                          {item.sku}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs ${item.stock <= 20 ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-800"}`}
                        >
                          {item.stock.toLocaleString("vi-VN")}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono">
                        {formatFullCurrency(item.price)}
                      </td>
                      <td className="py-3.5 px-4 text-right pr-6 font-mono font-black text-emerald-700">
                        {formatFullCurrency(item.total_value)}
                      </td>
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col"
              >
                <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50/50">
                  <h2 className="font-black text-lg text-slate-800">
                    Danh sách Sản phẩm đa dạng SKU
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowModalProd(false)}
                    className="text-slate-400 hover:text-red-500 font-bold text-xl"
                  >
                    &times;
                  </button>
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
                          <td className="py-3 px-6 text-center font-mono text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-6 font-bold">
                            {prod.ten_san_pham}
                          </td>
                          <td className="py-3 px-6 text-center font-mono">
                            {prod.sku_count}
                          </td>
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col"
              >
                <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50/50">
                  <h2 className="font-black text-lg text-slate-800">
                    Bảng định giá Tồn kho SKU
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowModalSku(false)}
                    className="text-slate-400 hover:text-red-500 font-bold text-xl"
                  >
                    &times;
                  </button>
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
                          <td className="py-3 px-6 font-mono text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-6">
                            <p className="font-bold text-slate-800">
                              {item.name}
                            </p>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {item.sku}
                            </span>
                          </td>
                          <td className="py-3 px-6 text-right font-mono">
                            {item.stock}
                          </td>
                          <td className="py-3 px-6 text-right font-mono font-black text-emerald-600">
                            {formatFullCurrency(item.total_value)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ========================================================================= */}
        {/* 🌟 TEMPLATE BÁO CÁO PDF ĐƯỢC ẨN BẰNG "hidden print:block" CỦA TAILWIND */}
        {/* ========================================================================= */}
        <div
          id="pdf-report-template"
          className="hidden bg-white text-black font-serif"
        >
          <div className="flex justify-between items-start mb-10 border-b-2 border-black pb-4">
            <div className="text-center">
              <h2 className="text-sm font-bold uppercase">
                CÔNG TY TNHH DEMI MART
              </h2>
              <p className="text-xs font-semibold underline decoration-solid underline-offset-4">
                HỆ THỐNG QUẢN LÝ TỒN KHO
              </p>
            </div>
            <div className="text-center">
              <h2 className="text-sm font-bold uppercase">
                CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
              </h2>
              <p className="text-xs font-bold underline decoration-solid underline-offset-4">
                Độc lập - Tự do - Hạnh phúc
              </p>
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-extrabold uppercase mb-2">
              BÁO CÁO THỐNG KÊ CHẤT LƯỢNG TỒN KHO
            </h1>
            <p className="text-sm italic">
              Thời điểm kết xuất: {currentTime.toLocaleTimeString("vi-VN")} -
              Ngày {currentTime.toLocaleDateString("vi-VN")}
            </p>
          </div>

          <div className="mb-6">
            <h3 className="font-bold text-lg mb-2 uppercase">
              I. Thông số Tổng Quan
            </h3>
            <ul className="list-disc list-inside text-sm space-y-1.5 ml-4">
              <li>
                Tổng số lượng Sản phẩm gốc:{" "}
                <span className="font-bold">
                  {stats.overview.total_products.toLocaleString()}
                </span>
              </li>
              <li>
                Tổng số lượng Biến thể (SKU) đang bán:{" "}
                <span className="font-bold">
                  {stats.overview.active_skus.toLocaleString()}
                </span>
              </li>
              <li>
                Tổng giá trị tồn kho ước tính:{" "}
                <span className="font-bold text-red-600">
                  {formatFullCurrency(stats.overview.total_inventory_value)}
                </span>
              </li>
              <li>
                SKU cần nhập hàng (Hết kho):{" "}
                <span className="font-bold">
                  {stats.overview.out_of_stock_skus.toLocaleString()}
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-2 uppercase">
              II. Chi tiết Giá Trị Tồn Kho (Top SKU)
            </h3>
            <table className="w-full border-collapse border border-black text-sm">
              <thead>
                <tr className="bg-gray-100 font-bold text-center">
                  <th className="border border-black px-2 py-2 w-10">STT</th>
                  <th className="border border-black px-2 py-2">
                    Tên Hàng Hóa / Mã SKU
                  </th>
                  <th className="border border-black px-2 py-2 w-20">Tồn dư</th>
                  <th className="border border-black px-2 py-2 w-32">
                    Thành tiền (VNĐ)
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.top_inventory_skus.slice(0, 30).map((item, index) => (
                  <tr key={index}>
                    <td className="border border-black px-2 py-2 text-center">
                      {index + 1}
                    </td>
                    <td className="border border-black px-2 py-2">
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-[10px] text-gray-600">{item.sku}</p>
                    </td>
                    <td className="border border-black px-2 py-2 text-center">
                      {item.stock}
                    </td>
                    <td className="border border-black px-2 py-2 text-right font-semibold">
                      {formatFullCurrency(item.total_value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mt-16 pt-8 pr-12">
            <div className="text-center">
              <p className="text-sm italic mb-1">
                TP. Hồ Chí Minh, ngày ... tháng ... năm 202...
              </p>
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
