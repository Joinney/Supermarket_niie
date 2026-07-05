import React, { useState } from "react";
import TaoPhieuDieuChuyenForm from "./TaoPhieuDieuChuyenForm"; // 👈 Import Form vừa tạo ở trên

// 📦 Dữ liệu mẫu (Mock Data) chuẩn hóa
const MOCK_TRANSFER_DATA = [
  {
    id: "DC2405-02",
    fromWarehouse: "Kho Tổng (Quận 1)",
    toWarehouse: "Kho Vật TW",
    status: "pending", 
    createdAt: "10/05/2026 14:00",
    creator: "Admin Kho",
  },
  {
    id: "DC2405-01",
    fromWarehouse: "Kho Nông Sản Cầu Đất",
    toWarehouse: "Kho Tổng (Quận 1)",
    status: "completed", 
    createdAt: "08/05/2026 09:15",
    creator: "User NV Kho",
  },
];

const Dieuchuyenkho = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  // Trạng thái điều phối hiển thị màn hình (true: Hiện Form Tạo, false: Hiện Danh sách)
  const [isCreating, setIsCreating] = useState(false);

  // INTERCEPT: Nếu trạng thái tạo mới được bật, gọi cấu trúc Form Figma ra thay thế
  if (isCreating) {
    return <TaoPhieuDieuChuyenForm onCancel={() => setIsCreating(false)} />;
  }

  return (
    <div className="w-full min-h-screen bg-[#fafafa] font-sans text-gray-800 antialiased p-1">
      
      {/* ---------------- TIÊU ĐỀ & NÚT TẠO PHIẾU ---------------- */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Danh sách điều chuyển kho</h1>
          <nav className="text-sm text-gray-400 mt-1">
            Dashboard &gt; <span className="text-emerald-600 font-medium">Danh sách điều chuyển kho</span>
          </nav>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="bg-[#16a34a] hover:bg-[#15803d] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm flex items-center gap-1.5 active:scale-95 cursor-pointer"
        >
          <span className="text-base">+</span> Tạo Phiếu Điều Chuyển
        </button>
      </div>

      {/* ---------------- THANH BỘ LỌC TÌM KIẾM ---------------- */}
      <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[280px] flex-1 max-w-xs">
            <input
              type="text"
              placeholder="Tìm mã phiếu điều chuyển..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 placeholder-gray-400 transition-all"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-600 outline-none min-w-[160px] font-medium cursor-pointer"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="pending">Chờ xét duyệt</option>
            <option value="completed">Đã hoàn thành</option>
          </select>

          <div className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-400 font-medium select-none">
            2024-01-21 <span className="text-gray-300 mx-1">đến</span> 2024-01-27
          </div>

          <button 
            onClick={() => { setSearchTerm(""); setStatusFilter(""); }}
            className="p-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-gray-500 transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3.5 py-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-sm text-gray-600 font-medium transition-colors cursor-pointer">Lọc</button>
          <button className="flex items-center gap-1.5 px-3.5 py-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-sm text-gray-600 font-medium transition-colors cursor-pointer">Xuất</button>
        </div>
      </div>

      {/* ---------------- BẢNG HIỂN THỊ PHIẾU CHUYỂN KHO ---------------- */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-400 select-none">
                <th className="py-4 px-6 text-center">Mã phiếu</th>
                <th className="py-4 px-6">Kho nguồn (Xuất)</th>
                <th className="py-4 px-6">Kho đích (Nhập)</th>
                <th className="py-4 px-6 text-center">Trạng thái</th>
                <th className="py-4 px-6">Ngày tạo</th>
                <th className="py-4 px-6">Người tạo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
              {MOCK_TRANSFER_DATA
                .filter((row) => {
                  const matchSearch = row.id.toLowerCase().includes(searchTerm.toLowerCase());
                  const matchStatus = statusFilter === "" || row.status === statusFilter;
                  return matchSearch && matchStatus;
                })
                .map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6 text-center text-emerald-600 font-bold">{row.id}</td>
                    <td className="py-4 px-6 text-gray-700">
                      <div className="flex items-center gap-2">
                        <span className="text-rose-400">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
                          </svg>
                        </span>
                        {row.fromWarehouse}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-700">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6 9 12.75l4.286-4.286a11.948 11.948 0 0 1 4.306 6.43l.797 3.398m0 0-5.94-2.28m5.94 2.28-2.28 5.941" />
                          </svg>
                        </span>
                        {row.toWarehouse}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      {row.status === "pending" ? (
                        <span className="inline-block px-2.5 py-1 text-xs font-bold rounded bg-amber-50 text-amber-600 border border-amber-100">
                          Chờ xét duyệt
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-1 text-xs font-bold rounded bg-emerald-50 text-emerald-600 border border-emerald-100">
                          Đã hoàn thành
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-gray-400 font-normal font-mono">{row.createdAt}</td>
                    <td className="py-4 px-6 text-gray-900 font-bold whitespace-pre-line">
                      {row.creator.split(" ")[0]} {"\n"}
                      <span className="text-gray-400 font-normal text-xs">{row.creator.split(" ").slice(1).join(" ")}</span>
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PHÂN TRANG */}
        <div className="p-4 bg-white border-t border-gray-50 flex items-center justify-between text-xs text-gray-400 font-medium select-none">
          <div>1 - 10 of 13 Pages</div>
          <div className="flex items-center gap-2 text-gray-500">
            <span>The page on</span>
            <select className="border border-gray-200 rounded px-2 py-1 bg-white text-gray-700 outline-none font-bold">
              <option>1</option>
            </select>
            <div className="flex items-center gap-1 ml-2">
              <button className="p-1 border border-gray-200 rounded text-gray-300 bg-white cursor-not-allowed" disabled>&lt;</button>
              <button className="p-1 border border-gray-200 rounded text-gray-600 bg-white hover:bg-gray-50 cursor-pointer">&gt;</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dieuchuyenkho;