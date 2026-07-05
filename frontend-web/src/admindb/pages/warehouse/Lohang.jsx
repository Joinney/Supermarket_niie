import React, { useState } from "react";

// Dữ liệu mẫu mô phỏng chính xác từ hình ảnh image_ced540.png
const MOCK_LOT_DATA = [
  {
    id: "1",
    lotCode: "LOT-APL-2601",
    productName: "Táo Đỏ Loại A",
    mfgDate: "01/01/2026",
    expDate: "30/06/2026",
    stock: "150 Thùng",
    status: "active", // Còn hạn
  },
  {
    id: "2",
    lotCode: "LOT-APL-2601",
    productName: "Táo Đỏ Loại A",
    mfgDate: "01/05/2026",
    expDate: "15/05/2026",
    stock: "50 Thùng",
    status: "warning", // Cận date
  },
  {
    id: "3",
    lotCode: "LOT-APL-2601",
    productName: "Rau Cải Xanh Hữu Cơ",
    mfgDate: "01/05/2026",
    expDate: "08/05/2026",
    stock: "12 Kg",
    status: "expired", // Hết hạn
  },
];

const Quanlylohang = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  return (
    <div className="w-full min-h-screen bg-[#fafafa] font-sans text-gray-800 antialiased">
      
      {/* ---------------- TIÊU ĐỀ & TIỆN ÍCH ---------------- */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Quản lý lô hàng</h1>
          <nav className="text-sm text-gray-400 mt-1">
            Dashboard &gt; <span className="text-emerald-600 font-medium">Quản lý lô hàng</span>
          </nav>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg shadow-sm text-sm text-gray-600 font-medium transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
          </svg>
          Xuất
        </button>
      </div>

      {/* ---------------- KHỐI THẺ THỐNG KÊ KPI ---------------- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        {/* Thẻ 1: Tổng Lot đang lưu */}
        <div className="bg-white p-6 rounded-xl border-l-[5px] border-emerald-500 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25M9 9.75l4.5 2.625M9 14.25l4.5 2.625" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Tổng Lot đang lưu</p>
            <p className="text-3xl font-bold text-gray-800 mt-0.5">124</p>
          </div>
        </div>

        {/* Thẻ 2: Lot cận date */}
        <div className="bg-white p-6 rounded-xl border-l-[5px] border-amber-500 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Lot cận date (dưới 30 ngày)</p>
            <p className="text-3xl font-bold text-gray-800 mt-0.5">5</p>
          </div>
        </div>

        {/* Thẻ 3: Lot hết hạn */}
        <div className="bg-white p-6 rounded-xl border-l-[5px] border-rose-500 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Lot hết hạn</p>
            <p className="text-3xl font-bold text-gray-800 mt-0.5">2</p>
          </div>
        </div>
      </div>

      {/* ---------------- BỘ LỌC TÌM KIẾM ---------------- */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.603 10.601Z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Tìm mã LOT, SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 placeholder-gray-400 transition-all"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-600 outline-none min-w-[160px] font-medium"
        >
          <option value="">Trạng thái HSD</option>
          <option value="active">Còn hạn</option>
          <option value="warning">Cận date</option>
          <option value="expired">Hết hạn</option>
        </select>
      </div>

      {/* ---------------- BẢNG HIỂN THỊ DANH SÁCH ---------------- */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                <th className="py-4 px-6 text-center">Mã LOT</th>
                <th className="py-4 px-6 w-[30%]">Sản phẩm</th>
                <th className="py-4 px-6 text-center">Ngày SX</th>
                <th className="py-4 px-6 text-center">HSD</th>
                <th className="py-4 px-6 text-center">Tồn hiện tại</th>
                <th className="py-4 px-6 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
              {MOCK_LOT_DATA.map((lot) => (
                <tr key={lot.id} className="hover:bg-slate-50/60 transition-colors">
                  {/* Mã LOT */}
                  <td className="py-4 px-6 text-center text-emerald-600 font-bold">
                    {lot.lotCode}
                  </td>
                  {/* Tên sản phẩm */}
                  <td className="py-4 px-6 text-gray-900 font-semibold">
                    {lot.productName}
                  </td>
                  {/* Ngày sản xuất */}
                  <td className="py-4 px-6 text-center text-gray-400 font-normal">
                    {lot.mfgDate}
                  </td>
                  {/* Hạn sử dụng */}
                  <td className="py-4 px-6 text-center font-bold">
                    <span
                      className={
                        lot.status === "active"
                          ? "text-gray-900"
                          : lot.status === "warning"
                          ? "text-amber-500"
                          : "text-rose-500"
                      }
                    >
                      {lot.expDate}
                    </span>
                  </td>
                  {/* Tồn hiện tại */}
                  <td className="py-4 px-6 text-center text-gray-900 font-bold">
                    {lot.stock}
                  </td>
                  {/* Trạng thái Label */}
                  <td className="py-4 px-6 text-center">
                    {lot.status === "active" && (
                      <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-600">
                        Còn hạn
                      </span>
                    )}
                    {lot.status === "warning" && (
                      <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-50 text-amber-500">
                        Cận date
                      </span>
                    )}
                    {lot.status === "expired" && (
                      <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-rose-50 text-rose-600">
                        Hết hạn
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ---------------- PHÂN TRANG ---------------- */}
        <div className="p-4 bg-white border-t border-gray-50 flex items-center justify-between text-xs text-gray-400 font-medium">
          <div>1 - 10 of 13 Pages</div>
          <div className="flex items-center gap-4 text-gray-500">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">The page on</span>
              <select className="border border-gray-200 rounded px-2 py-1 bg-white text-gray-700 outline-none font-semibold">
                <option>1</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-1.5 border border-gray-200 rounded text-gray-300 bg-white cursor-not-allowed" disabled>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button className="p-1.5 border border-gray-200 rounded text-gray-600 bg-white hover:bg-gray-50 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Quanlylohang;