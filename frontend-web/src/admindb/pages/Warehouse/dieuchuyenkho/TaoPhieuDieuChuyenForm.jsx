import React, { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ArrowDown, Package, Trash2, Plus } from "lucide-react";

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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      /* 🌟 ĐÃ ĐỒNG BỘ: p-1 giải phóng 2 bên mép màn hình, màu nền chuẩn #fafafa */
      className="w-full min-h-screen bg-[#fafafa] font-sans text-left text-slate-700 selection:bg-emerald-100 p-1 antialiased overflow-y-auto"
    >
      <div className="w-full">
        
        {/* HEADER AREA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              Tạo phiếu điều chuyển kho
            </h1>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mt-1">
              <span>Tổng hành dinh</span>
              <span>❯</span>
              <span>Quản lý kho vận</span>
              <span>❯</span>
              <span className="text-emerald-700 font-bold">Khởi tạo phiếu điều chuyển</span>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onCancel} 
            className="flex items-center justify-center border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold transition shadow-3xs cursor-pointer shrink-0"
          >
            ↩ Quay về danh sách
          </button>
        </div>

        {/* MAIN BODY CONFIG: GRID LAYOUT */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          
          {/* KHỐI TRÁI (8 COLUMNS): DANH SÁCH SẢN PHẨM ĐIỀU CHUYỂN */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-5 space-y-4" style={{ overflow: "visible" }}>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              📦 Danh sách Sản phẩm điều chuyển thực tế
            </h3>

            <div className="w-full overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full border-collapse text-left text-xs font-bold min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50/70 text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-100 select-none">
                    <th className="py-3 px-4 w-[45%]">Sản phẩm / SKU</th>
                    <th className="py-3 px-4 text-center w-[25%]">Tồn kho hiện hữu (Khả dụng)</th>
                    <th className="py-3 px-4 text-center w-[18%]">Số lượng Chuyển</th>
                    <th className="py-3 px-4 w-12 text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-600 font-semibold">
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-12 text-center text-slate-400 font-medium tracking-wide uppercase text-[10px] select-none">
                        Chưa có sản phẩm nào được chọn điều chuyển.
                      </td>
                    </tr>
                  ) : (
                    products.map((row) => (
                      <tr key={row.sku} className="hover:bg-slate-50/60 transition-colors">
                        {/* Sản phẩm / SKU */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 text-sm shrink-0 select-none">
                              <Package size={16} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-slate-800 font-bold truncate max-w-[220px]" title={row.name}>{row.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono font-medium mt-0.5">{row.sku}</p>
                            </div>
                          </div>
                        </td>

                        {/* Tồn kho khả dụng */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-block px-2.5 py-0.5 bg-slate-50 border border-slate-100 text-slate-700 rounded text-[11px] font-mono font-black">
                            {row.stock}
                          </span>
                        </td>

                        {/* Số lượng chuyển (Input) */}
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="number"
                            min="1"
                            value={row.quantity}
                            onChange={(e) => handleQuantityChange(row.sku, e.target.value)}
                            className="w-full text-center p-1 bg-slate-50 border border-slate-200 rounded-lg font-mono font-black text-slate-800 outline-none focus:bg-white focus:border-emerald-600 transition"
                          />
                        </td>

                        {/* Nút xóa mặt hàng */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveProduct(row.sku)}
                            className="text-slate-300 hover:text-rose-600 transition cursor-pointer"
                          >
                            <Trash2 size={14} />
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
              className="w-full py-2 border border-dashed border-slate-200 text-slate-400 rounded-xl hover:bg-slate-50 transition text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer mt-2"
            >
              <Plus size={14} /> Thêm mặt hàng điều chuyển
            </button>
          </div>

          {/* KHỐI PHẢI (4 COLUMNS): LỘ TRÌNH & GHI CHÚ */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-50 pb-2">
              🗺️ Lộ trình di chuyển & Ghi chú chứng từ
            </h3>

            {/* Chọn Kho Nguồn */}
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Kho nguồn (Phân vùng xuất đi) <span className="text-red-500">*</span>
              </label>
              <select
                value={fromWarehouse}
                onChange={(e) => setFromWarehouse(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer shadow-3xs"
              >
                <option value="">-- Chọn Kho Nguồn --</option>
                <option value="1">Kho Tổng (Quận 1)</option>
                <option value="2">Kho Nông Sản Cầu Đất</option>
                <option value="3">Kho Vật TW</option>
              </select>
            </div>

            {/* Hướng lộ trình chuyển kho */}
            <div className="flex justify-center select-none py-0.5">
              <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shadow-3xs">
                <ArrowDown size={14} strokeWidth={2.5} />
              </div>
            </div>

            {/* Chọn Kho Đích */}
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Kho đích (Phân vùng nhập vào) <span className="text-red-500">*</span>
              </label>
              <select
                value={toWarehouse}
                onChange={(e) => setToWarehouse(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer shadow-3xs"
              >
                <option value="">-- Chọn Kho Đích --</option>
                <option value="1">Kho Tổng (Quận 1)</option>
                <option value="2">Kho Nông Sản Cầu Đất</option>
                <option value="3">Kho Vật TW</option>
              </select>
            </div>

            {/* Ghi chú điều chuyển */}
            <div className="space-y-1 pt-2 border-t border-slate-100">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Ghi chú lý do điều vận
              </label>
              <textarea
                rows="3"
                placeholder="Lý do điều chuyển hệ thống, số xe vận tải trung chuyển hàng hóa..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-emerald-600 transition resize-none font-medium placeholder-slate-400"
              />
            </div>

            {/* Các nút hành động hoàn tất biểu mẫu */}
            <div className="pt-2 space-y-2 text-xs font-bold">
              <button
                type="submit"
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-2.5 rounded-xl uppercase tracking-wider shadow-sm transition transform active:scale-98 cursor-pointer"
              >
                Xác nhận lưu (Gửi duyệt)
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="w-full bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 py-2.5 rounded-xl transition cursor-pointer"
              >
                Hủy bỏ
              </button>
            </div>
          </div>

        </form>
      </div>
    </motion.div>
  );
};

export default TaoPhieuDieuChuyenForm;