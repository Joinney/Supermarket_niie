import React, { useState } from "react";

const TaoPhieuDieuChuyenForm = ({ onCancel }) => {
  const [fromWarehouse, setFromWarehouse] = useState("");
  const [toWarehouse, setToWarehouse] = useState("");
  const [note, setNote] = useState("");

  // Dữ liệu mẫu danh sách sản phẩm điều chuyển trong bảng bên trái
  const [products, setProducts] = useState([
    {
      sku: "SKU-APPLE-A",
      name: "Táo Đỏ Loại A",
      stock: "150 Thùng",
      quantity: 1,
    },
  ]);

  const handleQuantityChange = (sku, value) => {
    const qty = parseInt(value, 10) || 0;
    setProducts((prev) =>
      prev.map((item) => (item.sku === sku ? { ...item, quantity: qty } : item))
    );
  };

  const handleRemoveProduct = (sku) => {
    setProducts((prev) => prev.filter((item) => item.sku !== sku));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!fromWarehouse || !toWarehouse) {
      alert("Vui lòng chọn đầy đủ Kho Nguồn và Kho Đích!");
      return;
    }
    if (fromWarehouse === toWarehouse) {
      alert("Kho nguồn và kho đích không được trùng nhau!");
      return;
    }
    alert("Gửi yêu cầu điều chuyển kho duyệt thành công!");
    onCancel();
  };

  return (
    <div className="w-full min-h-screen bg-[#f4f6f8] font-sans text-slate-700 antialiased p-4 text-left animate-fadeIn">
      
      {/* HEADER AREA */}
      <div className="flex justify-between items-start mb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tạo phiếu điều chuyển kho</h1>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1 font-medium">
            <span>Dashboard</span>
            <span>❯</span>
            <span>Danh sách điều chuyển kho</span>
            <span>❯</span>
            <span className="text-emerald-600 font-semibold">Tạo phiếu điều chuyển kho</span>
          </div>
        </div>
        <button 
          type="button" 
          onClick={onCancel}
          className="flex items-center gap-1 bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-gray-50 transition active:scale-95 cursor-pointer"
        >
          <span className="text-sm">↩</span> Quay về
        </button>
      </div>

      {/* MAIN BODY CONFIG: GRID LAYOUT */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* KHỐI TRÁI (8 COLUMNS): DANH SÁCH SẢN PHẨM ĐIỀU CHUYỂN */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="text-sm font-bold text-slate-800 pb-2 border-b border-gray-50">
            Danh sách Sản phẩm điều chuyển
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs font-semibold">
              <thead>
                <tr className="text-[10px] text-gray-400 uppercase tracking-wider border-b border-slate-100 select-none">
                  <th className="py-3 px-2 w-[40%]">Sản phẩm / SKU</th>
                  <th className="py-3 px-2 text-center">Tồn kho (Khả dụng)</th>
                  <th className="py-3 px-2 text-center w-[15%]">SL Chuyển</th>
                  <th className="py-3 px-2 text-center w-[10%]">Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-slate-600">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-gray-400 font-medium">
                      Chưa có sản phẩm nào được chọn điều chuyển.
                    </td>
                  </tr>
                ) : (
                  products.map((row) => (
                    <tr key={row.sku} className="hover:bg-slate-50/40 transition-colors">
                      {/* Sản phẩm / SKU */}
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-gray-200/50 flex items-center justify-center text-gray-400 text-lg flex-shrink-0">
                            🖼️
                          </div>
                          <div>
                            <p className="text-slate-800 font-bold">{row.name}</p>
                            <p className="text-[10px] text-gray-400 font-mono font-medium mt-0.5">{row.sku}</p>
                          </div>
                        </div>
                      </td>

                      {/* Tồn kho khả dụng */}
                      <td className="py-4 px-2 text-center">
                        <span className="inline-block bg-slate-100 text-slate-700 text-[11px] font-bold px-3 py-1 rounded-md">
                          {row.stock}
                        </span>
                      </td>

                      {/* Số lượng chuyển (Input) */}
                      <td className="py-4 px-2 text-center">
                        <input
                          type="number"
                          min="1"
                          value={row.quantity}
                          onChange={(e) => handleQuantityChange(row.sku, e.target.value)}
                          className="w-full text-center px-1 py-1.5 bg-white border border-gray-200 rounded-md font-mono font-bold text-slate-800 outline-none focus:border-emerald-500 transition shadow-inner"
                        />
                      </td>

                      {/* Nút xóa mặt hàng */}
                      <td className="py-4 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(row.sku)}
                          className="text-gray-300 hover:text-rose-500 transition text-sm cursor-pointer p-1"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Thanh thêm sản phẩm nét đứt đáy bảng */}
          <button 
            type="button"
            className="w-full py-2.5 border border-dashed border-gray-200 text-gray-400 rounded-xl hover:bg-slate-50 transition text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer mt-2"
          >
            <span>(+)</span> Thêm sản phẩm
          </button>
        </div>

        {/* KHỐI PHẢI (4 COLUMNS): LỘ TRÌNH & GHI CHÚ */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
          <div className="text-sm font-bold text-slate-800 pb-2 border-b border-gray-50">
            Lộ trình & Ghi chú
          </div>

          {/* Chọn Kho Nguồn */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
              Kho nguồn (Xuất đi) <span className="text-red-500">*</span>
            </label>
            <select
              value={fromWarehouse}
              onChange={(e) => setFromWarehouse(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 cursor-pointer shadow-sm"
            >
              <option value="">-- Chọn Kho Nguồn --</option>
              <option value="1">Kho Tổng (Quận 1)</option>
              <option value="2">Kho Nông Sản Cầu Đất</option>
              <option value="3">Kho Vật TW</option>
            </select>
          </div>

          {/* Icon Mũi tên hướng xuống chỉ lộ trình chuyển kho */}
          <div className="flex justify-center py-1 select-none">
            <div className="w-7 h-7 rounded-full bg-slate-50 border border-gray-100 flex items-center justify-center text-gray-400 shadow-inner">
              ↓
            </div>
          </div>

          {/* Chọn Kho Đích */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
              Kho đích (Nhập vào) <span className="text-red-500">*</span>
            </label>
            <select
              value={toWarehouse}
              onChange={(e) => setToWarehouse(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 cursor-pointer shadow-sm"
            >
              <option value="">-- Chọn Kho Đích --</option>
              <option value="1">Kho Tổng (Quận 1)</option>
              <option value="2">Kho Nông Sản Cầu Đất</option>
              <option value="3">Kho Vật TW</option>
            </select>
          </div>

          {/* Ghi chú điều chuyển */}
          <div className="space-y-1.5 pt-2 border-t border-gray-50">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
              Ghi chú điều chuyển
            </label>
            <textarea
              rows="3"
              placeholder="Lý do điều chuyển, xe vận chuyển..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-slate-700 outline-none focus:border-emerald-500 resize-none shadow-sm"
            ></textarea>
          </div>

          {/* Các nút hành động hoàn tất biểu mẫu */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider shadow-sm transition active:scale-95 cursor-pointer"
            >
              Xác nhận Lưu (Gửi duyệt)
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="w-full bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 py-2.5 rounded-lg font-bold text-xs transition cursor-pointer"
            >
              Hủy
            </button>
          </div>
        </div>

      </form>
    </div>
  );
};

export default TaoPhieuDieuChuyenForm;