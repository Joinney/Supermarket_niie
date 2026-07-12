import React, { useState, useEffect, useMemo } from "react";
import { warehouseApi } from "../../../api/axios";

// 🌟 HÀM PHỤ TRỢ: Loại bỏ dấu tiếng Việt để tìm kiếm thông minh hơn
const removeVietnameseTones = (str) => {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
};

const Quanlylohang = () => {
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 1. FETCH DỮ LIỆU TỪ BACKEND
  useEffect(() => {
    const fetchLots = async () => {
      setLoading(true);
      try {
        const res = await warehouseApi.get("/lots/summary");
        const rawData = res.data || [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const mappedData = rawData.map((item) => {
          const mfgDate = new Date(item.ngay_san_xuat);
          const expDate = new Date(item.ngay_het_han);

          // Ép HSD về cuối ngày để trừ ra số ngày chuẩn xác
          expDate.setHours(23, 59, 59, 999);
          const diffTime = expDate.getTime() - new Date().getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          let status = "active";
          if (diffDays <= 0) status = "expired";
          else if (diffDays <= 30) status = "warning";

          return {
            id: `${item.ma_lo_hang}_${item.sku}_${Math.random()}`,
            lotCode: item.ma_lo_hang,
            sku: item.sku,
            productName: item.ten_san_pham,
            mfgDate: mfgDate.toLocaleDateString("vi-VN"),
            expDate: expDate.toLocaleDateString("vi-VN"),
            stock: item.ton_hien_tai,
            status: status,
          };
        });

        // 🌟 SẮP XẾP: Đẩy các Lô mới nhất (Mã Lô lớn nhất) lên đầu bảng
        mappedData.sort((a, b) => b.lotCode.localeCompare(a.lotCode));

        setLots(mappedData);
      } catch (error) {
        console.error("Lỗi khi tải danh sách lô hàng:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLots();
  }, []);

  // 2. TÍNH TOÁN KPI THỐNG KÊ (Đã bổ sung thẻ Còn Hạn)
  const stats = useMemo(() => {
    let activeCount = 0;
    let warningCount = 0;
    let expiredCount = 0;

    lots.forEach((lot) => {
      if (lot.status === "active") activeCount++;
      if (lot.status === "warning") warningCount++;
      if (lot.status === "expired") expiredCount++;
    });

    return {
      total: lots.length,
      active: activeCount,
      warning: warningCount,
      expired: expiredCount,
    };
  }, [lots]);

  // 3. XỬ LÝ LỌC DỮ LIỆU (Đã tích hợp xử lý tìm kiếm không dấu)
  const filteredLots = useMemo(() => {
    return lots.filter((lot) => {
      const query = removeVietnameseTones(searchTerm.toLowerCase());

      const safeLotCode = removeVietnameseTones(
        (lot.lotCode || "").toLowerCase(),
      );
      const safeSku = removeVietnameseTones((lot.sku || "").toLowerCase());
      const safeProductName = removeVietnameseTones(
        (lot.productName || "").toLowerCase(),
      );

      const matchSearch =
        safeLotCode.includes(query) ||
        safeSku.includes(query) ||
        safeProductName.includes(query);

      const matchStatus = statusFilter === "" || lot.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [lots, searchTerm, statusFilter]);

  // 4. XỬ LÝ PHÂN TRANG
  const totalPages = Math.ceil(filteredLots.length / itemsPerPage) || 1;
  const currentTableData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredLots.slice(start, end);
  }, [filteredLots, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const handleExport = () => {
    window.print();
  };

  return (
    <>
      {/* 🌟 CSS MA THUẬT DÀNH RIÊNG CHO LỆNH PRINT */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #pdf-report-template, #pdf-report-template * { 
            visibility: visible; 
            font-family: 'Times New Roman', Times, serif !important;
          }
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

      <div className="w-full min-h-screen bg-[#fafafa] font-sans text-gray-800 antialiased print:bg-white">
        <div className="w-full print:hidden">
          {/* ---------------- TIÊU ĐỀ & TIỆN ÍCH ---------------- */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
                Quản lý lô hàng
              </h1>
              <nav className="text-sm text-gray-400 mt-1">
                Dashboard &gt;{" "}
                <span className="text-[#006c49] font-medium">
                  Quản lý lô hàng
                </span>
              </nav>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 rounded-lg shadow-sm text-sm text-[#006c49] font-bold transition-colors cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.617 0-1.11-.51-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-14.326 0C3.768 7.441 3 8.376 3 9.456v6.294a2.25 2.25 0 0 0 2.25 2.25h1.091M5.25 9.75h13.5M9 21h6"
                />
              </svg>
              Xuất PDF
            </button>
          </div>

          {/* ---------------- KHỐI 4 THẺ THỐNG KÊ KPI ---------------- */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-5 rounded-xl border-l-[5px] border-indigo-500 shadow-sm flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25M9 9.75l4.5 2.625M9 14.25l4.5 2.625"
                  />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  Tổng Lô & SKU
                </p>
                <p className="text-2xl font-black text-gray-800 mt-0.5">
                  {stats.total.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border-l-[5px] border-emerald-500 shadow-sm flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  Lô còn hạn (Tốt)
                </p>
                <p className="text-2xl font-black text-emerald-600 mt-0.5">
                  {stats.active.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border-l-[5px] border-amber-500 shadow-sm flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  Cận date (&le;30 Ngày)
                </p>
                <p className="text-2xl font-black text-amber-600 mt-0.5">
                  {stats.warning.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border-l-[5px] border-rose-500 shadow-sm flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  Lô đã hết hạn
                </p>
                <p className="text-2xl font-black text-rose-600 mt-0.5">
                  {stats.expired.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* ---------------- BỘ LỌC TÌM KIẾM ---------------- */}
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.603 10.601Z"
                  />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Tìm mã LOT, mã SKU, tên sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#006c49] placeholder-gray-400 transition-all text-slate-700 font-medium"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-600 outline-none min-w-[160px] font-bold cursor-pointer focus:border-[#006c49]"
            >
              <option value="">Tất cả Trạng thái</option>
              <option value="active">Còn hạn</option>
              <option value="warning">Cận date</option>
              <option value="expired">Hết hạn</option>
            </select>
          </div>

          {/* ---------------- BẢNG HIỂN THỊ DANH SÁCH ---------------- */}
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden mb-6">
            <div className="overflow-x-auto min-h-[300px]">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-[#f8fafc] border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    <th className="py-4 px-6">Mã LOT & SKU</th>
                    <th className="py-4 px-6 w-[30%]">Tên Sản phẩm</th>
                    <th className="py-4 px-6 text-center">Ngày SX</th>
                    <th className="py-4 px-6 text-center">Hạn Sử Dụng</th>
                    <th className="py-4 px-6 text-center">Tồn hiện tại</th>
                    <th className="py-4 px-6 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                  {loading ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="py-20 text-center text-xs text-[#006c49] font-bold uppercase tracking-widest animate-pulse"
                      >
                        🔄 Đang nạp dữ liệu Lô hàng & Tồn kho...
                      </td>
                    </tr>
                  ) : currentTableData.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="py-20 text-center text-xs text-gray-400 font-bold uppercase"
                      >
                        Không tìm thấy lô hàng nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    currentTableData.map((lot) => (
                      <tr
                        key={lot.id}
                        className="hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <p className="text-[#006c49] font-black tracking-wide">
                            {lot.lotCode}
                          </p>
                          <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                            {lot.sku}
                          </p>
                        </td>
                        <td className="py-4 px-6 text-gray-900 font-bold">
                          {lot.productName}
                        </td>
                        <td className="py-4 px-6 text-center text-gray-400 font-normal">
                          {lot.mfgDate}
                        </td>
                        <td className="py-4 px-6 text-center font-bold">
                          <span
                            className={
                              lot.status === "active"
                                ? "text-gray-900"
                                : lot.status === "warning"
                                  ? "text-amber-600"
                                  : "text-rose-600"
                            }
                          >
                            {lot.expDate}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="font-mono font-black text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                            {lot.stock.toLocaleString("vi-VN")}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          {lot.status === "active" && (
                            <span className="inline-block px-2.5 py-1 text-[10px] font-black rounded bg-emerald-50 text-emerald-600 uppercase">
                              Còn hạn
                            </span>
                          )}
                          {lot.status === "warning" && (
                            <span className="inline-block px-2.5 py-1 text-[10px] font-black rounded bg-amber-50 text-amber-600 uppercase animate-pulse">
                              Cận date
                            </span>
                          )}
                          {lot.status === "expired" && (
                            <span className="inline-block px-2.5 py-1 text-[10px] font-black rounded bg-rose-50 text-rose-600 uppercase">
                              Hết hạn
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* ---------------- PHÂN TRANG ---------------- */}
            {!loading && filteredLots.length > 0 && (
              <div className="p-4 bg-white border-t border-gray-50 flex flex-wrap items-center justify-between text-xs text-gray-400 font-medium">
                <div>
                  Đang xem {(currentPage - 1) * itemsPerPage + 1} -{" "}
                  {Math.min(currentPage * itemsPerPage, filteredLots.length)}{" "}
                  trong tổng số{" "}
                  <span className="font-bold text-gray-600">
                    {filteredLots.length}
                  </span>{" "}
                  kết quả
                </div>
                <div className="flex items-center gap-4 text-gray-500">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Trang số</span>
                    <select
                      value={currentPage}
                      onChange={(e) => setCurrentPage(Number(e.target.value))}
                      className="border border-gray-200 rounded px-2 py-1 bg-white text-gray-700 outline-none font-semibold cursor-pointer"
                    >
                      {Array.from({ length: totalPages }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className={`p-1.5 border border-gray-200 rounded transition-colors ${currentPage === 1 ? "text-gray-300 bg-white cursor-not-allowed" : "text-gray-600 bg-white hover:bg-gray-50 cursor-pointer"}`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                        className="w-3.5 h-3.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.75 19.5 8.25 12l7.5-7.5"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className={`p-1.5 border border-gray-200 rounded transition-colors ${currentPage === totalPages ? "text-gray-300 bg-white cursor-not-allowed" : "text-gray-600 bg-white hover:bg-gray-50 cursor-pointer"}`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                        className="w-3.5 h-3.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m8.25 4.5 7.5 7.5-7.5 7.5"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 🌟 TEMPLATE BÁO CÁO PDF (CHỈ HIỂN THỊ KHI IN NHỜ class hidden) */}
        {/* ========================================================================= */}
        <div id="pdf-report-template" className="hidden bg-white text-black">
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
              BÁO CÁO QUẢN LÝ LÔ HÀNG VÀ HẠN SỬ DỤNG
            </h1>
            <p className="text-sm italic">
              Thời điểm kết xuất: {currentTime.toLocaleTimeString("vi-VN")} -
              Ngày {currentTime.toLocaleDateString("vi-VN")}
            </p>
            {(searchTerm || statusFilter) && (
              <p className="text-xs italic mt-1 text-gray-600">
                (Dữ liệu đã được lọc theo tiêu chí tìm kiếm của hệ thống)
              </p>
            )}
          </div>

          <div className="mb-6">
            <h3 className="font-bold text-lg mb-2 uppercase">
              I. Tổng hợp dữ liệu lô hàng
            </h3>
            <ul className="list-disc list-inside text-sm space-y-1.5 ml-4">
              <li>
                Tổng số lượng Lô đang quản lý (đã lọc):{" "}
                <span className="font-bold">{filteredLots.length} Lô</span>
              </li>
              <li>
                Số Lô Còn Hạn (Tốt):{" "}
                <span className="font-bold text-emerald-600">
                  {stats.active} Lô
                </span>
              </li>
              <li>
                Số Lô Cận Date (Dưới 30 ngày):{" "}
                <span className="font-bold text-amber-600">
                  {stats.warning} Lô
                </span>
              </li>
              <li>
                Số Lô Đã Hết Hạn:{" "}
                <span className="font-bold text-red-600">
                  {stats.expired} Lô
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-2 uppercase">
              II. Bảng kê chi tiết
            </h3>
            <table className="w-full border-collapse border border-black text-sm">
              <thead>
                <tr className="bg-gray-100 font-bold text-center">
                  <th className="border border-black px-2 py-2 w-10">STT</th>
                  <th className="border border-black px-2 py-2">
                    Mã LOT & SKU
                  </th>
                  <th className="border border-black px-2 py-2">
                    Tên Sản Phẩm
                  </th>
                  <th className="border border-black px-2 py-2">Ngày SX</th>
                  <th className="border border-black px-2 py-2">HSD</th>
                  <th className="border border-black px-2 py-2 w-20">Tồn Dư</th>
                  <th className="border border-black px-2 py-2 w-24">
                    Trạng Thái
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLots.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-black px-2 py-2 text-center">
                      {index + 1}
                    </td>
                    <td className="border border-black px-2 py-2">
                      <p className="font-semibold">{item.lotCode}</p>
                      <p className="text-[10px] text-gray-600">{item.sku}</p>
                    </td>
                    <td className="border border-black px-2 py-2 font-semibold">
                      {item.productName}
                    </td>
                    <td className="border border-black px-2 py-2 text-center">
                      {item.mfgDate}
                    </td>
                    <td className="border border-black px-2 py-2 text-center font-bold">
                      {item.expDate}
                    </td>
                    <td className="border border-black px-2 py-2 text-center font-bold">
                      {item.stock}
                    </td>
                    <td className="border border-black px-2 py-2 text-center font-bold">
                      {item.status === "active" && <span>Còn hạn</span>}
                      {item.status === "warning" && (
                        <span className="text-amber-600">Cận Date</span>
                      )}
                      {item.status === "expired" && (
                        <span className="text-red-600">Hết Hạn</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredLots.length === 0 && (
                  <tr>
                    <td
                      colSpan="7"
                      className="border border-black px-2 py-4 text-center italic text-gray-500"
                    >
                      Không có dữ liệu lô hàng.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between mt-12 pt-8 px-12">
            <div className="text-center">
              <p className="text-base font-bold">Thủ Kho</p>
              <p className="text-xs italic mt-1">(Ký và ghi rõ họ tên)</p>
              <div className="h-24"></div>
            </div>
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
      </div>
    </>
  );
};

export default Quanlylohang;
