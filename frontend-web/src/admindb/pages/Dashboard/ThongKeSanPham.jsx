import React, { useState, useEffect } from "react";

import { motion, AnimatePresence } from "framer-motion";

import { productApi } from "../../../api/axios";

import {
  Package,
  Layers,
  AlertTriangle,
  Boxes,
  RefreshCw,
  Printer,
  Calendar as CalendarIcon,
  ArrowRight,
  MoreHorizontal,
  Info,
} from "lucide-react";

export default function ThongKeSanPham() {
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

  // States lọc thời gian tương tự AdminDashboardPage

  const [viewType, setViewType] = useState("month");

  const [showDatePicker, setShowDatePicker] = useState(false);

  const [customDates, setCustomDates] = useState({ from: "", to: "" });

  // Đồng hồ Real-time

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
  }, [viewType, customDates]);

  const handleExportPDF = () => {
    setOpenMenu(null);

    window.print();
  };

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

  // Tính toán số liệu biểu đồ Donut Trạng thái kho

  const activeSkusCount =
    stats.overview.active_skus > 0 ? stats.overview.active_skus : 1;

  const inStockPercent =
    Math.round((stats.overview.in_stock_skus / activeSkusCount) * 100) || 0;

  const outOfStockPercent = 100 - inStockPercent;

  // Cấu hình SVG cho Donut Chart

  const radius = 15.9155;

  const circumference = 2 * Math.PI * radius; // ~100

  const strokeDashoffsetOut = circumference - outOfStockPercent;

  // Tỷ lệ cho biểu đồ thanh ngang Top SKU

  const maxSkuCount = Math.max(
    ...stats.top_products_sku.map((p) => p.sku_count || 1),

    1,
  );

  const productCards = [
    {
      id: 1,

      title: "TỔNG SẢN PHẨM",

      value: stats.overview.total_products.toLocaleString("vi-VN"),

      subText: "Hoạt động:",

      subValue: stats.overview.active_products.toLocaleString("vi-VN"),

      icon: Package,
    },

    {
      id: 2,

      title: "GIÁ TRỊ TỒN KHO",

      value: formatCompactCurrency(stats.overview.total_inventory_value),

      subText: "Số lượng:",

      subValue: `${stats.overview.total_stock_count.toLocaleString("vi-VN")} món`,

      icon: Boxes,
    },

    {
      id: 3,

      title: "SKU HẾT HÀNG",

      value: stats.overview.out_of_stock_skus.toLocaleString("vi-VN"),

      subText: "Còn hàng:",

      subValue: `${stats.overview.in_stock_skus.toLocaleString("vi-VN")} SKU`,

      icon: AlertTriangle,
    },

    {
      id: 4,

      title: "TỔNG SỐ SKU",

      value: stats.overview.total_skus.toLocaleString("vi-VN"),

      subText: "Đang bán:",

      subValue: `${stats.overview.active_skus.toLocaleString("vi-VN")} SKU`,

      icon: Layers,
    },
  ];

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
        className="w-full min-h-screen bg-[#f8fafc] font-sans text-left text-slate-800 p-4 md:p-6 antialiased overflow-y-auto print:bg-white pb-12"
        onClick={() => setOpenMenu(null)}
      >
        <div className="w-full print:hidden pb-10">
          {/* 🌟 1. TOOLBAR TÙY CHỈNH THỜI GIAN & TIỆN ÍCH */}

          <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Thống kê sản phẩm
              </h1>

              <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mt-1">
                <span>Tổng hành dinh</span>

                <span>❯</span>

                <span className="text-[#006c49] font-bold">
                  Thống kê sản phẩm
                </span>
              </div>
            </div>

            {/* Cụm nút Lọc thời gian, Real-time clock & Action Buttons */}

            <div className="flex flex-wrap items-center gap-3">
              {/* Nút Chọn Ngày / Tháng / Năm */}

              <div className="flex bg-white p-1 rounded-2xl border border-slate-200/80 shadow-xs">
                {[
                  { id: "day", label: "Ngày" },

                  { id: "month", label: "Tháng" },

                  { id: "year", label: "Năm" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setViewType(tab.id);

                      setShowDatePicker(false);
                    }}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      viewType === tab.id && !showDatePicker
                        ? "bg-[#006c49] text-white shadow-xs font-black"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Nút Tùy chỉnh ngày (Popover) */}

              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();

                    setShowDatePicker(!showDatePicker);

                    setViewType("custom");
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                    showDatePicker || viewType === "custom"
                      ? "bg-[#006c49] text-white border border-[#006c49]"
                      : "bg-white text-slate-700 border border-slate-200 hover:border-[#006c49]"
                  }`}
                >
                  <CalendarIcon className="w-3.5 h-3.5" />

                  <span>Tùy chỉnh ngày</span>
                </button>

                <AnimatePresence>
                  {showDatePicker && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 top-11 z-50 bg-white p-4 rounded-2xl border border-slate-200 shadow-xl flex flex-col sm:flex-row items-center gap-3 min-w-[320px]"
                    >
                      <div className="flex flex-col gap-1 w-full sm:w-auto">
                        <label className="text-[10px] font-black text-slate-400 uppercase">
                          Từ ngày
                        </label>

                        <input
                          type="date"
                          value={customDates.from}
                          onChange={(e) =>
                            setCustomDates((prev) => ({
                              ...prev,

                              from: e.target.value,
                            }))
                          }
                          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-[#006c49] cursor-pointer"
                        />
                      </div>

                      <ArrowRight className="w-4 h-4 text-slate-300 hidden sm:block mt-4" />

                      <div className="flex flex-col gap-1 w-full sm:w-auto">
                        <label className="text-[10px] font-black text-slate-400 uppercase">
                          Đến ngày
                        </label>

                        <input
                          type="date"
                          value={customDates.to}
                          onChange={(e) =>
                            setCustomDates((prev) => ({
                              ...prev,

                              to: e.target.value,
                            }))
                          }
                          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-[#006c49] cursor-pointer"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowDatePicker(false)}
                        className="mt-4 sm:mt-4 w-full sm:w-auto bg-[#006c49] text-white text-xs font-bold px-3.5 py-2 rounded-xl hover:bg-[#005539] transition-all cursor-pointer"
                      >
                        Lọc
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Real-time Clock Badge */}

              <div className="hidden md:flex items-center gap-2 border border-slate-200 bg-white px-3 py-2 rounded-xl text-xs font-mono font-bold text-slate-600 shadow-xs">
                <CalendarIcon className="w-3.5 h-3.5 text-[#006c49]" />

                <span>
                  {currentTime.toLocaleTimeString("vi-VN")} -{" "}
                  {currentTime.toLocaleDateString("vi-VN")}
                </span>
              </div>

              {/* Nút Refresh */}

              <button
                type="button"
                onClick={fetchProductStats}
                className="p-2 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 transition shadow-xs text-slate-600 cursor-pointer"
                title="Làm mới dữ liệu"
              >
                <RefreshCw
                  className={`w-4 h-4 text-[#006c49] ${
                    loading ? "animate-spin" : ""
                  }`}
                />
              </button>

              {/* Nút Xuất PDF */}

              <button
                type="button"
                onClick={handleExportPDF}
                className="px-3.5 py-2 border border-slate-200 bg-white rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-[#006c49]" />

                <span>Xuất PDF</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-xs font-bold text-center">
              {error}
            </div>
          )}

          {/* 🌟 2. KHỐI CARDS SỐ LIỆU TỔNG QUAN (4 CARDS) */}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {productCards.map((card) => {
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

          {/* 🌟 3. KHỐI BIỂU ĐỒ TRỰC QUAN */}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* 📊 BIỂU ĐỒ THANH NGANG: TOP SẢN PHẨM NHIỀU SKU */}

            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs lg:col-span-2 flex flex-col justify-between">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#006c49]" />
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
                    <MoreHorizontal className="w-4 h-4" />
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
                        className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer text-[#006c49] border-t border-slate-50"
                      >
                        Xem tất cả
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Thân biểu đồ Horizontal Bar Chart */}

              <div className="space-y-4 my-auto">
                {stats.top_products_sku.slice(0, 4).map((prod, idx) => {
                  const widthPercent =
                    (prod.sku_count / maxSkuCount) * 100 || 0;

                  return (
                    <div key={idx} className="space-y-1.5 group">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-800 truncate max-w-[80%] group-hover:text-[#006c49] transition-colors">
                          {idx + 1}. {prod.ten_san_pham}
                        </span>

                        <span className="font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">
                          {prod.sku_count} SKU
                        </span>
                      </div>

                      <div className="w-full h-3 bg-slate-50 border border-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${widthPercent}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className="h-full rounded-full bg-[#006c49]"
                          style={{
                            opacity: 1 - idx * 0.18,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 🍩 BIỂU ĐỒ BÁNH MÌ VÒNG: TRẠNG THÁI TỒN KHO */}

            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-extrabold text-slate-800">
                  Cơ cấu phân bổ trạng thái kho
                </h3>

                <Info className="w-4 h-4 text-slate-400 cursor-pointer" />
              </div>

              <div className="relative flex items-center justify-center my-4">
                <svg
                  width="150"
                  height="150"
                  viewBox="0 0 36 36"
                  className="transform -rotate-90"
                >
                  {/* Vòng nền xám */}

                  <circle
                    cx="18"
                    cy="18"
                    r={radius}
                    fill="none"
                    stroke="#f1f5f9"
                    strokeWidth="4.5"
                  />

                  {/* Phân đoạn: Còn hàng (#006c49) */}

                  <circle
                    cx="18"
                    cy="18"
                    r={radius}
                    fill="none"
                    stroke="#006c49"
                    strokeWidth="4.5"
                    strokeDasharray={`${circumference}`}
                    strokeDashoffset={0}
                  />

                  {/* Phân đoạn: Hết hàng (Rose-500) */}

                  <circle
                    cx="18"
                    cy="18"
                    r={radius}
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="4.5"
                    strokeDasharray={`${outOfStockPercent} ${inStockPercent}`}
                    strokeDashoffset={strokeDashoffsetOut}
                  />
                </svg>

                <div className="absolute flex flex-col items-center justify-center bg-white rounded-full w-20 h-20 shadow-xs border border-slate-50">
                  <span className="text-xl font-black text-slate-900 font-mono tracking-tight">
                    {inStockPercent}%
                  </span>

                  <span className="text-[8px] uppercase font-black text-[#006c49] tracking-wider">
                    Sẵn sàng
                  </span>
                </div>
              </div>

              {/* Chú thích dữ liệu (Legend) */}

              <div className="flex flex-col gap-2 border-t border-slate-50 pt-3 text-xs font-bold">
                <div className="flex items-center justify-between text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#006c49]"></span>

                    <span>Biến thể khả dụng</span>
                  </div>

                  <span className="font-mono text-slate-900">
                    {stats.overview.in_stock_skus.toLocaleString()} SKU
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>

                    <span>Biến thể đứt hàng</span>
                  </div>

                  <span className="font-mono text-slate-900">
                    {stats.overview.out_of_stock_skus.toLocaleString()} SKU
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 🌟 4. KHỐI BẢNG LỚN: TOP SKU THEO GIÁ TRỊ TỒN KHO */}

          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs relative">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-[#006c49]" />
                  Top SKU Theo Giá Trị Tồn Kho
                </h3>

                <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#006c49] bg-[#006c49]/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono border border-[#006c49]/20">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#006c49] opacity-75"></span>

                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#006c49]"></span>
                  </span>
                  Live DB
                </span>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();

                    setOpenMenu(openMenu === "topValue" ? null : "topValue");
                  }}
                  className="text-slate-400 hover:text-slate-600 p-1 flex items-center justify-center cursor-pointer rounded-lg hover:bg-slate-50 transition"
                >
                  <MoreHorizontal className="w-4 h-4" />
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
                      className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer text-[#006c49] border-t border-slate-50"
                    >
                      Xem tất cả
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4 rounded-l-xl">
                      Cấu trúc Biến thể (SKU)
                    </th>

                    <th className="py-3 px-4 text-center w-36">Số lượng tồn</th>

                    <th className="py-3 px-4 text-right w-44">Đơn giá</th>

                    <th className="py-3 px-4 text-right rounded-r-xl w-48 pr-6">
                      Giá trị tồn kho
                    </th>
                  </tr>
                </thead>

                <tbody className="text-xs font-bold text-slate-700">
                  {stats.top_inventory_skus.length === 0 && !loading ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="text-center py-12 text-slate-400 font-medium italic"
                      >
                        Chưa có dữ liệu biến thể tồn kho trong hệ thống.
                      </td>
                    </tr>
                  ) : (
                    stats.top_inventory_skus.slice(0, 5).map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-slate-50 last:border-none hover:bg-slate-50/50 transition-colors"
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
                            className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs ${
                              item.stock <= 20
                                ? "bg-rose-50 text-rose-600 border border-rose-100"
                                : "bg-slate-50 text-slate-800 border border-slate-100"
                            }`}
                          >
                            {item.stock.toLocaleString("vi-VN")}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-600">
                          {formatFullCurrency(item.price)}
                        </td>

                        <td className="py-3.5 px-4 text-right pr-6 font-mono font-black text-[#006c49] text-sm">
                          {formatFullCurrency(item.total_value)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* CÁC MODAL XEM THÊM (CHUẨN ĐỒNG BỘ) */}

        <AnimatePresence>
          {showModalProd && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4"
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]"
              >
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h2 className="font-extrabold text-base text-slate-800">
                    Danh sách sản phẩm đa dạng SKU
                  </h2>

                  <button
                    type="button"
                    onClick={() => setShowModalProd(false)}
                    className="text-slate-400 hover:text-slate-800 font-bold text-lg cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-0 overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-50 text-slate-400 text-[10px] font-extrabold uppercase border-b border-slate-100">
                      <tr>
                        <th className="py-3 px-6 text-center w-16">STT</th>

                        <th className="py-3 px-6">Tên sản phẩm</th>

                        <th className="py-3 px-6 text-center">Số SKU</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-50 text-xs font-bold text-slate-700">
                      {stats.top_products_sku.map((prod, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="py-3.5 px-6 text-center font-mono text-slate-400">
                            #{idx + 1}
                          </td>

                          <td className="py-3.5 px-6 text-slate-900 font-bold">
                            {prod.ten_san_pham}
                          </td>

                          <td className="py-3.5 px-6 text-center font-mono text-[#006c49]">
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
              className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4"
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[85vh]"
              >
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h2 className="font-extrabold text-base text-slate-800">
                    Bảng định giá tồn kho SKU
                  </h2>

                  <button
                    type="button"
                    onClick={() => setShowModalSku(false)}
                    className="text-slate-400 hover:text-slate-800 font-bold text-lg cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-0 overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-50 text-slate-400 text-[10px] font-extrabold uppercase border-b border-slate-100">
                      <tr>
                        <th className="py-3 px-6 w-12">#</th>

                        <th className="py-3 px-6">Tên & Mã SKU</th>

                        <th className="py-3 px-6 text-center">Tồn kho</th>

                        <th className="py-3 px-6 text-right">Giá trị (VNĐ)</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-50 text-xs font-bold text-slate-700">
                      {stats.top_inventory_skus.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="py-3.5 px-6 font-mono text-slate-400">
                            {idx + 1}
                          </td>

                          <td className="py-3.5 px-6">
                            <p className="font-bold text-slate-800">
                              {item.name}
                            </p>

                            <span className="text-[10px] text-slate-400 font-mono">
                              {item.sku}
                            </span>
                          </td>

                          <td className="py-3.5 px-6 text-center font-mono text-slate-600">
                            {item.stock.toLocaleString("vi-VN")}
                          </td>

                          <td className="py-3.5 px-6 text-right font-mono font-black text-[#006c49]">
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

        {/* TEMPLATE BÁO CÁO PDF (KHI ẤN NÚT IN BÁO CÁO) */}

        <div
          id="pdf-report-template"
          className="hidden bg-white text-black font-serif p-8"
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
                <span className="font-bold text-rose-600">
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
                TP. Hồ Chí Minh, ngày {currentTime.getDate()} tháng{" "}
                {currentTime.getMonth() + 1} năm {currentTime.getFullYear()}
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
