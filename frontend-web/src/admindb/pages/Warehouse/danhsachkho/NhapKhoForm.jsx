import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // 👈 Thêm import này để điều hướng route

// 📦 Dữ liệu mẫu tĩnh chuẩn hóa theo cấu trúc quản lý thông tin các kho Demi Mart
const MOCK_WAREHOUSE_DATA = [
  { 
    maKho: "KHO-001", 
    tenKho: "Kho Tổng (Quận 1)", 
    diaChi: "123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. HCM", 
    trangThai: "active", 
    ngayTao: "20/01/2024 08:00", 
    ngayCapNhat: "26/06/2026 14:20" 
  },
  { 
    maKho: "KHO-002", 
    tenKho: "Kho Nông Sản Cầu Đất", 
    diaChi: "Quốc lộ 20, Xã Xuân Trường, TP. Đà Lạt, Lâm Đồng", 
    trangThai: "active", 
    ngayTao: "22/01/2024 08:30", 
    ngayCapNhat: "25/06/2026 09:15" 
  },
  { 
    maKho: "KHO-003", 
    tenKho: "Kho Vật TW", 
    diaChi: "456 Lê Duẩn, Phường Hải Châu I, Quận Hải Châu, Đà Nẵng", 
    trangThai: "active", 
    ngayTao: "24/01/2024 16:45", 
    ngayCapNhat: "24/06/2026 10:30" 
  },
  { 
    maKho: "KHO-004", 
    tenKho: "Kho Lạnh Vùng 2", 
    diaChi: "789 Nguyễn Văn Linh, Phường Tân Phong, Quận 7, TP. HCM", 
    trangThai: "maintenance", // Đang bảo trì hệ thống lạnh
    ngayTao: "26/01/2024 14:20", 
    ngayCapNhat: "20/06/2026 17:00" 
  },
];

const NhapKhoForm = () => {
  const navigate = useNavigate(); // 👈 Khởi tạo hàm điều hướng hệ thống
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  // Hàm xử lý xóa nhanh bộ lọc (Reset)
  const handleResetFilters = () => {
    setSearch("");
    setStatus("");
  };

  return (
    <div className="w-full min-h-screen bg-[#fafafa] font-sans text-gray-800 antialiased p-1 text-left">
      
      {/* ---------------- TIÊU ĐỀ HOẠT ĐỘNG ---------------- */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Danh sách kho</h1>
          <nav className="text-sm text-gray-400 mt-1">
            Dashboard &gt; Kho Hàng &gt; <span className="text-emerald-600 font-medium">Danh sách kho</span>
          </nav>
        </div>

        {/* Nút thêm kho dẫn sang Route tạo kho riêng biệt */}
        <button 
          onClick={() => navigate("/admin/inventory/create-warehouse")}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-bold rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Thêm kho
        </button>
      </div>

      {/* ---------------- BLOCK TÌM KIẾM & BỘ LỌC ---------------- */}
      <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Input Search */}
          <div className="relative min-w-[260px] flex-1 max-w-xs">
            <input
              type="text"
              placeholder="Tìm theo mã kho, tên kho..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-3 pr-9 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 transition-all placeholder-gray-400 font-medium"
            />
            <span className="absolute inset-y-0 right-3 flex items-center text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.603 10.601Z" />
              </svg>
            </span>
          </div>

          {/* Trạng thái Dropdown */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-600 outline-none min-w-[150px] font-bold cursor-pointer"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="maintenance">Bảo trì</option>
          </select>

          {/* Nút Reset Bộ Lọc */}
          <button 
            onClick={handleResetFilters}
            title="Xóa bộ lọc"
            className="p-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-gray-500 transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
        </div>

        {/* Nút Lọc & Xuất báo cáo */}
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3.5 py-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-sm text-gray-600 font-bold transition cursor-pointer">Lọc</button>
          <button className="flex items-center gap-1.5 px-3.5 py-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-sm text-gray-600 font-bold transition cursor-pointer">Xuất</button>
        </div>
      </div>

      {/* ---------------- BẢNG HIỂN THỊ DANH SÁCH CÁC KHO HÀNG ---------------- */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-400 select-none">
                <th className="py-4 px-6 text-center">Mã Kho</th>
                <th className="py-4 px-6">Tên Kho</th>
                <th className="py-4 px-6 w-[35%]">Địa Chỉ</th>
                <th className="py-4 px-6 text-center">Trạng Thái</th>
                <th className="py-4 px-6">Ngày Tạo</th>
                <th className="py-4 px-6">Ngày Cập Nhật</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-semibold text-slate-600">
              {MOCK_WAREHOUSE_DATA
                .filter((row) => {
                  // Logic tìm kiếm & lọc cơ bản trực tiếp trên giao diện
                  const matchesSearch = row.tenKho.toLowerCase().includes(search.toLowerCase()) || row.maKho.toLowerCase().includes(search.toLowerCase());
                  const matchesStatus = status === "" || row.trangThai === status;
                  return matchesSearch && matchesStatus;
                })
                .map((row) => (
                  <tr key={row.maKho} className="hover:bg-slate-50/60 transition-colors">
                    {/* Mã Kho */}
                    <td className="py-4 px-6 text-center text-[#006c49] font-black font-mono">
                      {row.maKho}
                    </td>
                    {/* Tên Kho */}
                    <td className="py-4 px-6 text-gray-900 font-bold">
                      {row.tenKho}
                    </td>
                    {/* Địa Chỉ */}
                    <td className="py-4 px-6 text-gray-500 font-medium whitespace-normal break-words">
                      {row.diaChi}
                    </td>
                    {/* Trạng Thái */}
                    <td className="py-4 px-6 text-center">
                      {row.trangThai === "active" ? (
                        <span className="px-2.5 py-0.5 text-[11px] font-bold rounded bg-emerald-50 text-emerald-600 uppercase">
                          Hoạt động
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 text-[11px] font-bold rounded bg-amber-50 text-amber-600 uppercase">
                          Bảo trì
                        </span>
                      )}
                    </td>
                    {/* Ngày Tạo */}
                    <td className="py-4 px-6 text-gray-400 font-medium font-mono text-xs">
                      {row.ngayTao}
                    </td>
                    {/* Ngày Cập Nhật */}
                    <td className="py-4 px-6 text-gray-400 font-medium font-mono text-xs">
                      {row.ngayCapNhat}
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FOOTER ĐIỀU HƯỚNG PHÂN TRANG GỌN GÀNG */}
        <div className="p-4 bg-white border-t border-gray-50 flex items-center justify-between text-xs text-gray-400 font-bold select-none">
          <div>Hiển thị 1 - {MOCK_WAREHOUSE_DATA.length} trên tổng số {MOCK_WAREHOUSE_DATA.length} Kho</div>
          <div className="flex items-center gap-4 text-xs font-medium text-gray-400">
            <div className="flex items-center gap-2">
              <span>The page on</span>
              <select className="border border-gray-200 rounded px-2 py-1 bg-white text-gray-700 outline-none font-bold">
                <option>1</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-1.5 border border-gray-200 rounded text-gray-300 bg-white cursor-not-allowed" disabled>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button className="p-1.5 border border-gray-200 rounded text-gray-300 bg-white cursor-not-allowed" disabled>
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

export default NhapKhoForm;