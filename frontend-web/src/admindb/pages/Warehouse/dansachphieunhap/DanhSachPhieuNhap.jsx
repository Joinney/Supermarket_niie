import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; 

export default function DanhSachPhieuNhap() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  // Dữ liệu mẫu danh sách phiếu nhập kho Demi Mart
  const [mockImportData] = useState([
    { id: "PN2401-08", warehouse: "Kho Tổng (Quận 1)", status: "completed", date: "28/01/2024 08:00", creator: "admin", total: 120000000, debt: 0 },
    { id: "PN2401-07", warehouse: "Kho Nông Sản Cầu Đất", status: "debt", date: "27/01/2024 15:30", creator: "nv_kho_01", total: 45500000, debt: 15000000 },
    { id: "PN2401-06", warehouse: "Kho Vật TW", status: "completed", date: "27/01/2024 10:15", creator: "admin", total: 89000000, debt: 0 },
    { id: "PN2401-05", warehouse: "Kho Tổng (Quận 1)", status: "debt", date: "26/01/2024 14:20", creator: "nv_kho_02", total: 210000000, debt: 50000000 },
  ]);

  const formatCurrency = (num) => {
    return new Intl.NumberFormat("vi-VN").format(num) + " đ";
  };

  return (
    <div className="w-full min-h-screen bg-[#fafafa] font-sans text-gray-800 antialiased p-1 text-left">
      
      {/* HEADER AREA */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Danh sách phiếu nhập</h1>
          <nav className="text-sm text-gray-400 mt-1">
            Dashboard &gt; <span className="text-emerald-600 font-medium">Danh sách phiếu nhập</span>
          </nav>
        </div>
        
        <button 
          onClick={() => navigate("/admin/inventory/create-import-ticket")}
          className="bg-[#22c55e] hover:bg-[#16a34a] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm flex items-center gap-1.5 active:scale-95 cursor-pointer"
        >
          <span className="text-base">+</span> Tạo Phiếu nhập
        </button>
      </div>

      {/* FILTER CONTROLS */}
      <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[260px] flex-1 max-w-xs">
            <input
              type="text"
              placeholder="Tìm kiếm theo mã phiếu nhập..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-3 pr-9 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 transition-all placeholder-gray-400 font-medium"
            />
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-600 outline-none min-w-[150px] font-bold cursor-pointer"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="completed">Hoàn thành</option>
            <option value="debt">Còn nợ</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 border border-gray-200 bg-white rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition cursor-pointer">Lọc</button>
          <button className="px-4 py-2 border border-gray-200 bg-white rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition cursor-pointer">Xuất</button>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-400 select-none">
                <th className="py-4 px-6">Mã phiếu nhập</th>
                <th className="py-4 px-6">Kho nhận</th>
                <th className="py-4 px-6">Tình trạng</th>
                <th className="py-4 px-6">Ngày nhập</th>
                <th className="py-4 px-6">Người lập</th>
                <th className="py-4 px-6 text-right">Tổng tiền</th>
                <th className="py-4 px-6 text-right">Nợ</th>
                <th className="py-4 px-6 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-semibold text-slate-600">
              {mockImportData
                .filter((row) => {
                  const matchId = row.id.toLowerCase().includes(search.toLowerCase());
                  const matchStatus = status === "" || row.status === status;
                  return matchId && matchStatus;
                })
                .map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Bấm vào mã ID để dẫn link sang Route chi tiết */}
                    <td 
                      onClick={() => navigate(`/admin/inventory/import-detail/${row.id}`)}
                      className="py-4 px-6 text-blue-500 font-bold hover:underline cursor-pointer"
                    >
                      {row.id}
                    </td>
                    <td className="py-4 px-6 text-gray-500 font-normal">{row.warehouse}</td>
                    <td className="py-4 px-6">
                      {row.status === "completed" ? (
                        <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-50 text-emerald-600">Hoàn thành</span>
                      ) : (
                        <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-rose-50 text-rose-500">Còn nợ</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-gray-400 font-normal font-mono">{row.date}</td>
                    <td className="py-4 px-6 text-gray-500 font-medium">{row.creator}</td>
                    <td className="py-4 px-6 text-right text-gray-900 font-bold font-mono">{formatCurrency(row.total)}</td>
                    <td className={`py-4 px-6 text-right font-bold font-mono ${row.debt > 0 ? "text-rose-500" : "text-gray-300"}`}>
                      {formatCurrency(row.debt)}
                    </td>
                    
                    {/* Nút hành động xem chi tiết */}
                    <td className="py-4 px-6 text-center">
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/inventory/import-detail/${row.id}`)}
                        className="text-gray-400 hover:text-emerald-600 font-bold text-xs bg-slate-50 hover:bg-emerald-50 px-2.5 py-1 rounded transition-all border border-gray-100 cursor-pointer"
                      >
                        👁 Xem chi tiết
                      </button>
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}