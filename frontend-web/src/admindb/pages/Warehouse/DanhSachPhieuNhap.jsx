import React, { useState } from "react";

export default function DanhSachPhieuNhap() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  
  // Trạng thái đóng/mở giao diện Tạo Phiếu Nhập từ Figma
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Dữ liệu mẫu danh sách phiếu nhập kho
  const [mockImportData] = useState([
    { id: "PN2401-08", warehouse: "Kho Tổng (Quận 1)", status: "completed", date: "28/01/2024 08:00", creator: "admin", total: 120000000, debt: 0 },
    { id: "PN2401-07", warehouse: "Kho Nông Sản Cầu Đất", status: "debt", date: "27/01/2024 15:30", creator: "nv_kho_01", total: 45500000, debt: 15000000 },
    { id: "PN2401-06", warehouse: "Kho Vật TW", status: "completed", date: "27/01/2024 10:15", creator: "admin", total: 89000000, debt: 0 },
    { id: "PN2401-05", warehouse: "Kho Tổng (Quận 1)", status: "debt", date: "26/01/2024 14:20", creator: "nv_kho_02", total: 210000000, debt: 50000000 },
  ]);

  const formatCurrency = (num) => {
    return new Intl.NumberFormat("vi-VN").format(num) + " đ";
  };

  // --- GIAO DIỆN TẠO PHIẾU NHẬP KHO (FIGMA MOCKUP) ---
  if (showCreateForm) {
    return (
      <div className="w-full min-h-screen bg-[#f4f6f8] font-sans text-slate-700 antialiased p-4 text-left animate-fadeIn">
        
        {/* HEADER AREA */}
        <div className="flex justify-between items-start mb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Nhập kho</h1>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1 font-medium">
              <span>Dashboard</span>
              <span>❯</span>
              <span>Danh sách phiếu nhập</span>
              <span>❯</span>
              <span className="text-emerald-600 font-semibold">Tạo phiếu nhập kho</span>
            </div>
          </div>
          <button 
            onClick={() => setShowCreateForm(false)}
            className="flex items-center gap-1 bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-gray-50 transition active:scale-95"
          >
            <span className="text-sm">↩</span> Quay về
          </button>
        </div>

        {/* MAIN BODY CONFIG: GRID 12 COLUMNS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* KHỐI TRÁI (8 COLUMNS): CHI TIẾT SẢN PHẨM & LOT */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* THANH TÌM KIẾM NHANH SKU */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                <input 
                  type="text" 
                  placeholder="Tìm kiếm nhanh tên sản phẩm..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-transparent rounded-lg text-sm outline-none focus:bg-white focus:border-emerald-500 transition font-medium placeholder-gray-400"
                />
              </div>
              <button className="bg-[#006c49] text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-[#005237]">
                <span>≡</span> Chọn SKU từ danh sách
              </button>
            </div>

            {/* BẢNG CHI TIẾT SẢN PHẨM HOÀN CHỈNH */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex justify-between items-center mb-3 border-b border-gray-50 pb-2">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                  <span className="text-emerald-600">📋</span> CHI TIẾT SẢN PHẨM & LOT
                </div>
                <span className="text-[10px] bg-rose-50 text-rose-500 px-2 py-0.5 rounded font-bold">Bắt buộc ít nhất 1 dòng hàng</span>
              </div>

              <div className="w-full overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs font-semibold">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] text-gray-400 uppercase tracking-wider border-b border-slate-100">
                      <th className="py-2.5 px-2">SKU / Sản phẩm</th>
                      <th className="py-2.5 px-2">Quản lý LOT</th>
                      <th className="py-2.5 px-2">ĐV Giao dịch</th>
                      <th className="py-2.5 px-2 text-center">Hệ số QĐ</th>
                      <th className="py-2.5 px-2 text-center">SL G.Dịch</th>
                      <th className="py-2.5 px-2 text-center text-emerald-600">SL Chuẩn</th>
                      <th className="py-2.5 px-2 text-right">Giá vốn (đ)</th>
                      <th className="py-2.5 px-2 text-right">Thành tiền (đ)</th>
                      <th className="py-2.5 px-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-slate-600">
                    {/* Dòng mặt hàng 1 */}
                    <tr className="hover:bg-slate-50/40">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded bg-rose-100 flex items-center justify-center text-base">🍎</div>
                          <div>
                            <p className="text-slate-800 font-bold">Táo Đỏ Loại A</p>
                            <p className="text-[10px] text-gray-400 font-mono">SKU-APPLE-A</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <select className="bg-slate-50 border border-gray-200 rounded px-1.5 py-1 text-[11px] font-bold text-slate-700 outline-none">
                          <option>-- Chọn LOT --</option>
                          <option selected>Thanh long Xuân Hạ</option>
                        </select>
                      </td>
                      <td className="py-3 px-2 text-gray-500">Thùng</td>
                      <td className="py-3 px-2 text-center font-mono">20</td>
                      <td className="py-3 px-2 text-center font-mono">10</td>
                      <td className="py-3 px-2 text-center font-mono text-emerald-600 font-bold bg-emerald-50/50 rounded">200 kg</td>
                      <td className="py-3 px-2 text-right font-mono">350.000</td>
                      <td className="py-3 px-2 text-right font-mono font-bold text-slate-800">3.500.000</td>
                      <td className="py-3 px-2 text-center text-gray-300 hover:text-red-500 cursor-pointer">🗑️</td>
                    </tr>
                    {/* Dòng mặt hàng 2 */}
                    <tr className="hover:bg-slate-50/40">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded bg-amber-100 flex items-center justify-center text-base">📦</div>
                          <div>
                            <p className="text-slate-800 font-bold">Táo Đỏ Loại A</p>
                            <p className="text-[10px] text-gray-400 font-mono">SKU-APPLE-A</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="space-y-1">
                          <select className="bg-slate-50 border border-gray-200 rounded px-1.5 py-1 text-[11px] font-bold text-slate-700 outline-none w-full">
                            <option selected>-- Chọn LOT --</option>
                            <option>Thanh long</option>
                          </select>
                          <div className="text-[10px] text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded flex justify-between items-center">
                            <span>Thanh long</span>
                            <button className="bg-emerald-600 text-white px-1 rounded text-[8px]">Thêm</button>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-gray-500">Thùng</td>
                      <td className="py-3 px-2 text-center font-mono">20</td>
                      <td className="py-3 px-2 text-center font-mono">10</td>
                      <td className="py-3 px-2 text-center font-mono text-emerald-600 font-bold bg-emerald-50/50 rounded">200 kg</td>
                      <td className="py-3 px-2 text-right font-mono">350.000</td>
                      <td className="py-3 px-2 text-right font-mono font-bold text-slate-800">3.500.000</td>
                      <td className="py-3 px-2 text-center text-gray-300 hover:text-red-500 cursor-pointer">🗑️</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* THÊM DÒNG HÀNG TRỐNG */}
              <button className="w-full mt-3 py-2 border border-dashed border-gray-200 text-gray-400 rounded-xl hover:bg-slate-50 transition text-xs font-bold flex items-center justify-center gap-1.5">
                <span>➕</span> Thêm dòng hàng mới
              </button>
            </div>
          </div>

          {/* KHỐI PHẢI (4 COLUMNS): DỮ LIỆU HỆ THỐNG & TỔNG CỘNG */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* TỔNG CỘNG BANNER ĐẬM ĐÀ */}
            <div className="bg-[#006c49] text-white p-4 rounded-xl shadow-sm">
              <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-200">TỔNG CỘNG (TẠM TÍNH)</p>
              <p className="text-3xl font-black font-mono mt-1">3.500.000 đ</p>
            </div>

            {/* FORM ĐIỀN THÔNG TIN HỆ THỐNG */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-3.5">
              <div className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-gray-50 pb-1.5 flex items-center gap-1.5">
                <span>🗄️</span> Dữ liệu hệ thống
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase">Kho nhận *</label>
                <select className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 cursor-pointer">
                  <option>-- Chọn Kho --</option>
                  <option value="1">Kho Tổng (Quận 1)</option>
                  <option value="2">Kho Nông Sản Cầu Đất</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase">Loại nhập *</label>
                <select className="w-full px-3 py-2 bg-slate-50 border border-gray-100 rounded-lg text-xs font-black text-emerald-700 outline-none cursor-pointer">
                  <option value="mua">Mua Hàng</option>
                  <option value="tra">Trả Hàng</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase">Nhà cung cấp *</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🏢</span>
                  <input 
                    type="text" 
                    value="Công ty Nông Sản Xanh" 
                    readOnly
                    className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-gray-100 rounded-lg text-xs font-bold text-slate-800 outline-none"
                  />
                </div>
                <p className="text-[9px] text-gray-400 italic">Bắt buộc khi Loại nhập = Mua</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase">Ngày nhập *</label>
                <input 
                  type="text" 
                  value="05/10/2024"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-slate-800 outline-none font-mono focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase">Ghi chú (optional)</label>
                <textarea 
                  rows="2" 
                  placeholder="Ghi chú phiếu nhập..."
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-slate-700 outline-none focus:border-emerald-500 resize-none"
                ></textarea>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase">Người nhập (Hệ thống)</label>
                <input 
                  type="text" 
                  value="User - NV Kho" 
                  disabled
                  className="w-full px-3 py-2 bg-slate-50 border border-transparent rounded-lg text-xs font-bold text-gray-400 outline-none"
                />
              </div>

              {/* NÚT THAO TÁC HOÀN THÀNH FORM */}
              <div className="pt-2 space-y-2">
                <button 
                  type="button"
                  onClick={() => { alert("Xác nhận tạo phiếu nhập thành công!"); setShowCreateForm(false); }}
                  className="w-full bg-[#006c49] text-white py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider shadow-sm hover:bg-[#005237] transition active:scale-95"
                >
                  Xác nhận tạo phiếu nhập
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button" 
                    onClick={() => setShowCreateForm(false)}
                    className="py-2 bg-slate-50 border border-gray-200 text-gray-500 rounded-lg font-bold text-xs hover:bg-slate-100 transition"
                  >
                    Hủy
                  </button>
                  <button 
                    type="button"
                    className="py-2 bg-slate-50 border border-gray-200 text-slate-700 rounded-lg font-bold text-xs hover:bg-slate-100 transition"
                  >
                    Lưu nháp
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    );
  }

  // --- GIAO DIỆN DANH SÁCH PHIẾU NHẬP (DEFAULT) ---
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
          onClick={() => setShowCreateForm(true)}
          className="bg-[#22c55e] hover:bg-[#16a34a] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
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
              placeholder="Search for id, name product"
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
          <button className="px-4 py-2 border border-gray-200 bg-white rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition">Lọc</button>
          <button className="px-4 py-2 border border-gray-200 bg-white rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition">Xuất</button>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-semibold text-slate-600">
              {mockImportData.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-4 px-6 text-blue-500 font-bold">{row.id}</td>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}