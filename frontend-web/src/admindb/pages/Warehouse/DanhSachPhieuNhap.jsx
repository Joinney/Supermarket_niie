import React, { useState } from "react";

// Dữ liệu mẫu chuẩn hóa khớp chính xác theo hình ảnh image_cef001.png
const MOCK_IMPORT_DATA = [
  { id: "PN2401-08", warehouse: "Kho Tổng (Quận 1)", status: "completed", date: "28/01/2024 08:00", creator: "admin", total: 120000000, debt: 0 },
  { id: "PN2401-07", warehouse: "Kho Nông Sản Cầu Đất", status: "debt", date: "27/01/2024 15:30", creator: "nv_kho_01", total: 45500000, debt: 15000000 },
  { id: "PN2401-06", warehouse: "Kho Vật TW", status: "completed", date: "27/01/2024 10:15", creator: "admin", total: 89000000, debt: 0 },
  { id: "PN2401-05", warehouse: "Kho Tổng (Quận 1)", status: "debt", date: "26/01/2024 14:20", creator: "nv_kho_02", total: 210000000, debt: 50000000 },
  { id: "PN2401-04", warehouse: "Kho Nông Sản Cầu Đất", status: "completed", date: "25/01/2024 09:00", creator: "admin", total: 32400000, debt: 0 },
  { id: "PN2401-03", warehouse: "Kho Vật TW", status: "completed", date: "24/01/2024 16:45", creator: "nv_kho_01", total: 15600000, debt: 0 },
  { id: "PN2401-02", warehouse: "Kho Tổng (Quận 1)", status: "debt", date: "23/01/2024 11:10", creator: "admin", total: 75000000, debt: 25000000 },
  { id: "PN2401-01", warehouse: "Kho Nông Sản Cầu Đất", status: "completed", date: "22/01/2024 08:30", creator: "nv_kho_02", total: 12800000, debt: 0 },
];

const DanhSachPhieuNhap = () => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const formatCurrency = (num) => {
    return new Intl.NumberFormat("vi-VN").format(num) + " đ";
  };

  return (
    <div className="w-full min-h-screen bg-[#fafafa] font-sans text-gray-800 antialiased p-1">
      
      {/* ---------------- TIÊU ĐỀ HOẠT ĐỘNG ---------------- */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Danh sách phiếu nhập</h1>
          <nav className="text-sm text-gray-400 mt-1">
            Dashboard &gt; <span className="text-emerald-600 font-medium">Danh sách phiếu nhập</span>
          </nav>
        </div>
        <button className="bg-[#22c55e] hover:bg-[#16a34a] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm flex items-center gap-1.5">
          <span className="text-base">+</span> Tạo Phiếu nhập
        </button>
      </div>

      {/* ---------------- BLOCK TÌM KIẾM & BỘ LỌC ---------------- */}
      <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Input Search */}
          <div className="relative min-w-[260px] flex-1 max-w-xs">
            <input
              type="text"
              placeholder="Search for id, name product"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-3 pr-9 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 transition-all placeholder-gray-400"
            />
            <span className="absolute inset-y-0 right-3 flex items-center text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.603 10.601Z" /></svg>
            </span>
          </div>

          {/* Trạng thái Dropdown */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-600 outline-none min-w-[150px] font-medium"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="completed">Hoàn thành</option>
            <option value="debt">Còn nợ</option>
          </select>

          {/* Date Picker Range Mock */}
          <div className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-400 font-medium">
            2024-01-21 <span className="text-gray-300 mx-1">đến</span> 2024-01-27
          </div>

          {/* Nút Reset Hàng */}
          <button className="p-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-gray-500 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
          </button>
        </div>

        {/* Nút Lọc & Xuất */}
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3.5 py-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-sm text-gray-600 font-medium transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" /></svg>
            Lọc
          </button>
          <button className="flex items-center gap-1.5 px-3.5 py-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-sm text-gray-600 font-medium transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" /></svg>
            Xuất
          </button>
        </div>
      </div>

      {/* ---------------- BẢNG HIỂN THỊ DỮ LIỆU NHẬP KHO ---------------- */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                <th className="py-4 px-6">Mã phiếu nhập</th>
                <th className="py-4 px-6">Kho nhận</th>
                <th className="py-4 px-6">Tình trạng</th>
                <th className="py-4 px-6">Ngày nhập</th>
                <th className="py-4 px-6">Người lập</th>
                <th className="py-4 px-6 text-right">Tổng tiền</th>
                <th className="py-4 px-6 text-right flex items-center justify-end gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.854-1.106-2.24 0-3.093 1.147-.881 2.91-.881 4.058 0L15 8.5m-5-3h4.5m-4.5 13H14" /></svg>
                  Nợ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
              {MOCK_IMPORT_DATA.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-4 px-6 text-blue-500 font-semibold cursor-pointer hover:underline">{row.id}</td>
                  <td className="py-4 px-6 text-gray-600 font-normal">{row.warehouse}</td>
                  <td className="py-4 px-6">
                    {row.status === "completed" ? (
                      <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-600">Hoàn thành</span>
                    ) : (
                      <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-rose-50 text-rose-500">Còn nợ</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-gray-400 font-normal">{row.date}</td>
                  <td className="py-4 px-6 text-gray-500 font-normal">{row.creator}</td>
                  <td className="py-4 px-6 text-right text-gray-900 font-bold">{formatCurrency(row.total)}</td>
                  <td className={`py-4 px-6 text-right font-bold ${row.debt > 0 ? "text-rose-500" : "text-gray-300"}`}>
                    {formatCurrency(row.debt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FOOTER ĐIỀU HƯỚNG & SỐ LIỆU TỔNG KPI */}
        <div className="p-5 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4 bg-white">
          <div className="flex items-center gap-8">
            <div className="text-center">
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Tổng số phiếu</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5 text-left">8</p>
            </div>
            <div className="border-l border-gray-200 pl-8 text-center">
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Tổng tiền nhập</p>
              <p className="text-xl font-bold text-emerald-600 mt-0.5">{formatCurrency(520200000)}</p>
            </div>
            <div className="border-l border-gray-200 pl-8 text-center">
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Tổng nợ</p>
              <p className="text-xl font-bold text-rose-500 mt-0.5">{formatCurrency(90000000)}</p>
            </div>
          </div>

          {/* Cụm Phân Trang */}
          <div className="flex items-center gap-4 text-xs font-medium text-gray-400">
            <div className="flex items-center gap-2">
              <span>The page on</span>
              <select className="border border-gray-200 rounded px-2 py-1 bg-white text-gray-700 outline-none font-bold">
                <option>1</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-1.5 border border-gray-200 rounded text-gray-300 bg-white cursor-not-allowed" disabled>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
              </button>
              <button className="p-1.5 border border-gray-200 rounded text-gray-600 bg-white hover:bg-gray-50 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DanhSachPhieuNhap;