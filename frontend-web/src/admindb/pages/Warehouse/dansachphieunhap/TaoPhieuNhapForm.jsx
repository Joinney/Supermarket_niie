import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SelectSkuModal from "./SelectSkuModal";
import ProductDetailModal from "./ProductDetailModal"; // 👈 Thêm import Modal xem chi tiết mới ở đây

export default function TaoPhieuNhapForm() {
  const navigate = useNavigate();
  const [isSkuModalOpen, setIsSkuModalOpen] = useState(false);
  
  // Trạng thái điều khiển việc đóng / mở Modal xem chi tiết
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [activeDetailProduct, setActiveDetailProduct] = useState(null);

  // Danh sách sản phẩm được chọn trong giỏ hàng phiếu nhập
  const [selectedProducts, setSelectedProducts] = useState([
    {
      sku: "SKU-APPLE-A",
      name: "Táo Đỏ Loại A",
      category: "TRÁI CÂY",
      unit: "kg",
      tradeUnit: "Thùng",
      ratio: 20,          
      quantity: 10,       
      price: 350000,      
      icon: "🍎"
    }
  ]);

  const [warehouse, setWarehouse] = useState("1");
  const [importType, setImportType] = useState("mua");
  const [note, setNote] = useState("");

  // Kích hoạt mở popup xem chi tiết mặt hàng
  const handleOpenDetailModal = (product) => {
    setActiveDetailProduct(product);
    setIsDetailModalOpen(true);
  };

  const handleSelectProductFromModal = (product) => {
    const numericPrice = parseInt(product.price.replace(/[.\sđ]/g, ""), 10) || 0;
    const ratioMatch = product.ratio.match(/=\s*(\d+)/);
    const numericRatio = ratioMatch ? parseInt(ratioMatch[1], 10) : 1;
    const tradeUnitMatch = product.ratio.match(/\d+\s*([^\s=]+)/);
    const tradeUnit = tradeUnitMatch ? tradeUnitMatch[1] : product.unit;

    const isExisted = selectedProducts.some((item) => item.sku === product.sku);
    if (isExisted) {
      setSelectedProducts(prev =>
        prev.map(item =>
          item.sku === product.sku ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      const newRow = {
        sku: product.sku,
        name: product.name,
        category: product.category,
        unit: product.unit,
        tradeUnit: tradeUnit,
        ratio: numericRatio,
        quantity: 1,
        price: numericPrice,
        icon: product.icon
      };
      setSelectedProducts(prev => [...prev, newRow]);
    }
  };

  const handleQuantityChange = (sku, val) => {
    const qty = parseInt(val, 10) || 0;
    setSelectedProducts(prev =>
      prev.map(item => (item.sku === sku ? { ...item, quantity: qty } : item))
    );
  };

  const handleRemoveRow = (sku) => {
    setSelectedProducts(prev => prev.filter(item => item.sku !== sku));
  };

  const calculateTotals = () => {
    let grandTotal = 0;
    const itemsWithTotals = selectedProducts.map(item => {
      const standardQuantity = item.quantity * item.ratio;
      const totalPrice = item.quantity * item.price;
      grandTotal += totalPrice;
      return { ...item, standardQuantity, totalPrice };
    });
    return { itemsWithTotals, grandTotal };
  };

  const { itemsWithTotals, grandTotal } = calculateTotals();

  const formatVnCurrency = (num) => {
    return new Intl.NumberFormat("vi-VN").format(num) + " đ";
  };

  const handleConfirmSubmit = (e) => {
    e.preventDefault();
    if (selectedProducts.length === 0) {
      alert("Vui lòng chọn ít nhất 1 sản phẩm để lập phiếu nhập kho!");
      return;
    }
    navigate("/admin/inventory/import-list");
  };

  return (
    <div className="w-full min-h-screen bg-[#f4f6f8] font-sans text-slate-700 antialiased p-4 text-left animate-fadeIn">
      
      {/* HEADER AREA */}
      <div className="flex justify-between items-start mb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Nhập kho</h1>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1 font-medium">
            <span>Dashboard</span> <span>❯</span> <span>Danh sách phiếu nhập</span> <span>❯</span> <span className="text-emerald-600 font-semibold">Tạo phiếu nhập kho</span>
          </div>
        </div>
        <button type="button" onClick={() => navigate("/admin/inventory/import-list")} className="flex items-center gap-1 bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-gray-50 transition cursor-pointer">
          <span className="text-sm">↩</span> Quay về
        </button>
      </div>

      {/* MAIN BODY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* KHỐI TRÁI */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
              <input type="text" placeholder="Tìm kiếm nhanh tên sản phẩm..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-transparent rounded-lg text-sm outline-none focus:bg-white focus:border-emerald-500 transition font-medium placeholder-gray-400" />
            </div>
            <button type="button" onClick={() => setIsSkuModalOpen(true)} className="bg-[#006c49] text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-[#005237] cursor-pointer">
              <span>≡</span> Chọn SKU từ danh sách
            </button>
          </div>

          {/* BẢNG SẢN PHẨM */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex justify-between items-center mb-3 border-b border-gray-50 pb-2">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <span className="text-emerald-600">📋</span> CHI TIẾT SẢN PHẨM & LOT
              </div>
            </div>

            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs font-semibold">
                <thead>
                  <tr className="bg-slate-50 text-[10px] text-gray-400 uppercase tracking-wider border-b border-slate-100 select-none">
                    <th className="py-2.5 px-2">SKU / Sản phẩm</th>
                    <th className="py-2.5 px-2">Quản lý LOT</th>
                    <th className="py-2.5 px-2">ĐV Giao dịch</th>
                    <th className="py-2.5 px-2 text-center">Hệ số QĐ</th>
                    <th className="py-2.5 px-2 text-center w-[12%]">SL G.Dịch</th>
                    <th className="py-2.5 px-2 text-center text-emerald-600">SL Chuẩn</th>
                    <th className="py-2.5 px-2 text-right">Giá vốn</th>
                    <th className="py-2.5 px-2 text-right">Thành tiền</th>
                    <th className="py-2.5 px-2 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-slate-600">
                  {itemsWithTotals.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="py-8 text-center text-gray-400 font-medium">Chưa có sản phẩm nào được chọn.</td>
                    </tr>
                  ) : (
                    itemsWithTotals.map((row) => (
                      <tr key={row.sku} className="hover:bg-slate-50/40 transition-colors">
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded bg-emerald-50 text-gray-700 flex items-center justify-center text-base">{row.icon}</div>
                            <div>
                              <p className="text-slate-800 font-bold">{row.name}</p>
                              <p className="text-[10px] text-gray-400 font-mono font-medium">{row.sku}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <select className="bg-slate-50 border border-gray-200 rounded px-1.5 py-1 text-[11px] font-bold text-slate-700 outline-none cursor-pointer">
                            <option value="">-- Chọn LOT --</option>
                            <option value="lot-1" selected>Lô nông sản miền Tây</option>
                          </select>
                        </td>
                        <td className="py-3 px-2 text-gray-500 font-bold">{row.tradeUnit}</td>
                        <td className="py-3 px-2 text-center font-mono text-gray-400 font-bold">{row.ratio}</td>
                        <td className="py-3 px-2 text-center">
                          <input type="number" min="1" value={row.quantity} onChange={(e) => handleQuantityChange(row.sku, e.target.value)} className="w-full text-center px-1 py-1 bg-white border border-gray-200 rounded-md font-mono font-bold text-slate-800 outline-none focus:border-emerald-500 transition" />
                        </td>
                        <td className="py-3 px-2 text-center font-mono text-emerald-600 font-bold bg-emerald-50/40 rounded">
                          {row.standardQuantity} {row.unit}
                        </td>
                        <td className="py-3 px-2 text-right font-mono text-gray-500 font-medium">{formatVnCurrency(row.price)}</td>
                        <td className="py-3 px-2 text-right font-mono font-bold text-slate-800">{formatVnCurrency(row.totalPrice)}</td>
                        
                        <td className="py-3 px-2">
                          <div className="flex items-center justify-center gap-2.5">
                            {/* Gọi hàm kích hoạt mở Modal xem chi tiết */}
                            <button 
                              type="button"
                              onClick={() => handleOpenDetailModal(row)}
                              title="Xem chi tiết"
                              className="text-gray-400 hover:text-blue-600 transition text-sm cursor-pointer"
                            >
                              👁️
                            </button>
                            <button 
                              type="button"
                              onClick={() => handleRemoveRow(row.sku)}
                              title="Xóa khỏi danh sách"
                              className="text-gray-400 hover:text-rose-600 transition text-sm cursor-pointer"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <button type="button" onClick={() => setIsSkuModalOpen(true)} className="w-full mt-3 py-2 border border-dashed border-gray-200 text-gray-400 rounded-xl hover:bg-slate-50 transition text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer">
              <span>➕</span> Thêm dòng hàng mới
            </button>
          </div>
        </div>

        {/* KHỐI PHẢI */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#006c49] text-white p-4 rounded-xl shadow-sm">
            <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-200">TỔNG CỘNG (TẠM TÍNH)</p>
            <p className="text-3xl font-black font-mono mt-1">{formatVnCurrency(grandTotal)}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-3.5">
            <div className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-gray-50 pb-1.5 flex items-center gap-1.5">
              <span>🗄️</span> Dữ liệu hệ thống
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase">Kho nhận *</label>
              <select value={warehouse} onChange={(e) => setWarehouse(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 cursor-pointer">
                <option value="1">Kho Tổng (Quận 1)</option>
                <option value="2">Kho Nông Sản Cầu Đất</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase">Loại nhập *</label>
              <select value={importType} onChange={(e) => setImportType(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-gray-100 rounded-lg text-xs font-black text-emerald-700 outline-none">
                <option value="mua">Mua Hàng</option>
                <option value="tra">Trả Hàng</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase">Nhà cung cấp *</label>
              <input type="text" value="Công ty Nông Sản Xanh" readOnly className="w-full px-3 py-2 bg-slate-50 border border-gray-100 rounded-lg text-xs font-bold text-slate-800 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase">Ngày nhập *</label>
              <input type="text" value="27/06/2026" readOnly className="w-full px-3 py-2 bg-slate-50 border border-gray-100 rounded-lg text-xs font-bold text-slate-800 outline-none font-mono" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase">Ghi chú (optional)</label>
              <textarea rows="2" placeholder="Ghi chú phiếu nhập..." value={note} onChange={(e) => setNote(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-slate-700 outline-none resize-none"></textarea>
            </div>

            <div className="pt-2 space-y-2">
              <button type="button" onClick={handleConfirmSubmit} className="w-full bg-[#006c49] text-white py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider shadow-sm transition cursor-pointer">
                Xác nhận tạo phiếu nhập
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => navigate("/admin/inventory/import-list")} className="py-2 bg-slate-50 border border-gray-200 text-gray-500 rounded-lg font-bold text-xs hover:bg-slate-100 transition cursor-pointer">Hủy</button>
                <button type="button" onClick={() => { alert("Đã lưu bản nháp!"); navigate("/admin/inventory/import-list"); }} className="py-2 bg-slate-50 border border-gray-200 text-slate-700 rounded-lg font-bold text-xs hover:bg-slate-100 transition cursor-pointer">Lưu nháp</button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* RENDER POPUP CHỌN HÀNG */}
      <SelectSkuModal isOpen={isSkuModalOpen} onClose={() => setIsSkuModalOpen(false)} onSelect={handleSelectProductFromModal} />

      {/* RENDER POPUP XEM CHI TIẾT SẢN PHẨM (MỚI BỔ SUNG) */}
      <ProductDetailModal 
        isOpen={isDetailModalOpen} 
        onClose={() => { setIsDetailModalOpen(false); setActiveDetailProduct(null); }} 
        product={activeDetailProduct} 
      />
    </div>
  );
}