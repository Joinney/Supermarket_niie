import React, { useState } from "react";
import { createPortal } from "react-dom"; // 👈 Thêm import này

export default function SelectSkuModal({ isOpen, onClose, onSelect }) {
  const [searchTerm, setSearchTerm] = useState("");

  const mockProducts = [
    { sku: "SKU-APPLE-A", name: "Táo Đỏ Loại A", category: "TRÁI CÂY", unit: "kg", ratio: "1 Thùng = 20 kg", price: "350.000 đ", icon: "🍎" },
    { sku: "SKU-SEED-MELON", name: "Hạt giống Dưa Lưới F1", category: "HẠT GIỐNG", unit: "Gói", ratio: "1 Gói = 1 Gói", price: "120.000 đ", icon: "🌱" },
    { sku: "SKU-FERT-TRI", name: "Phân bón vi sinh Trichoderma", category: "VẬT TƯ NÔNG NGHIỆP", unit: "kg", ratio: "1 Bao = 25 kg", price: "450.000 đ", icon: "🧪" },
    { sku: "SKU-BAG-FRUIT", name: "Túi bọc trái cây sinh học", category: "VẬT TƯ TIÊU HAO", unit: "Cái", ratio: "1 Bịch = 100 Cái", price: "50.000 đ", icon: "🛍️" },
    { sku: "SKU-GEN-001", name: "Sản phẩm khác...", category: "KHÁC", unit: "Cái", ratio: "1 Cái = 1 Cái", price: "10.000 đ", icon: "📦" }
  ];

  if (!isOpen) return null;

  // 💡 Sử dụng createPortal để đưa Modal ra ngoài cùng của DOM tree
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-[4px] p-4 font-sans antialiased">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-gray-100 flex flex-col max-h-[85vh] overflow-hidden text-left animate-fadeIn">
        
        {/* MODAL HEADER */}
        <div className="p-6 pb-4 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Chọn sản phẩm / SKU</h2>
            <p className="text-xs text-gray-400 mt-1">Điền thông tin để tìm kiếm</p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition text-2xl font-semibold leading-none cursor-pointer p-1"
          >
            &times;
          </button>
        </div>

        {/* SEARCH INPUT */}
        <div className="px-6 pb-4">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input 
              type="text"
              placeholder="Tìm theo tên, mã SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-emerald-500 transition font-medium text-gray-700 placeholder-gray-400 shadow-sm"
            />
          </div>
        </div>

        {/* DATA TABLE AREA */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="w-full overflow-x-auto border border-gray-100 rounded-xl">
            <table className="w-full border-collapse text-left text-xs font-semibold">
              <thead>
                <tr className="bg-slate-50/70 text-[10px] text-gray-400 uppercase tracking-wider border-b border-gray-100 select-none">
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Sản Phẩm</th>
                  <th className="py-3 px-4 text-center">ĐV Chuẩn</th>
                  <th className="py-3 px-4 text-center">Hệ số mặc định</th>
                  <th className="py-3 px-4 text-right">Giá vốn</th>
                  <th className="py-3 px-4 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-gray-600">
                {mockProducts
                  .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((product) => (
                    <tr key={product.sku} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-gray-400 font-medium">{product.sku}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-lg border border-gray-100 shadow-inner flex-shrink-0">
                            {product.icon}
                          </div>
                          <div>
                            <p className="text-gray-900 font-bold">{product.name}</p>
                            <p className="text-[9px] text-gray-400 font-bold tracking-wide mt-0.5 uppercase">{product.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[11px]">{product.unit}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center text-gray-400 font-medium">{product.ratio}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-gray-800">{product.price}</td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => { onSelect(product); onClose(); }}
                          className="px-3 py-1 bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95"
                        >
                          Chọn
                        </button>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>,
    document.body // 👈 Gắn trực tiếp vào body toàn trang
  );
}