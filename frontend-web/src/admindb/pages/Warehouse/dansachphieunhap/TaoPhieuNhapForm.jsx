import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import SelectSkuModal from "./SelectSkuModal";
import ProductDetailModal from "./ProductDetailModal"; 
import axios from "axios";

export default function TaoPhieuNhapForm() {
  const navigate = useNavigate();
  const [isSkuModalOpen, setIsSkuModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [activeDetailProduct, setActiveDetailProduct] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // --- STATE LƯU TRỮ PHIẾU NHẬP KHO ---
  const [warehouse, setWarehouse] = useState("1");
  const [importType, setImportType] = useState("mua");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // --- DANH SÁCH SẢN PHẨM TRONG GIỎ HÀNG PHIẾU NHẬP ---
  const [selectedProducts, setSelectedProducts] = useState([
    {
      sku: "BEV-0075-T24",
      name: "Cà Phê Sữa Đá Lon Birdy",
      category: "NƯỚC NGỌT CÓ GA",
      unit: "Lon",       
      tradeUnit: "Thùng", 
      ratio: 24,          
      quantity: 5,        
      price: 310000,      
      icon: "🥫",
      selectedLotId: "lot-1",
      selectedRatioId: "ratio-1" 
    }
  ]);

  // --- 1. DANH SÁCH CÁC LÔ HÀNG HỆ THỐNG ---
  const [globalLots, setGlobalLots] = useState([
    { id: "lot-1", name: "Lô hàng Xuân Hạ", expiryDate: "2026-12-31" },
    { id: "lot-2", name: "Lô nông sản miền Tây", expiryDate: "2026-09-15" },
    { id: "lot-3", name: "Thanh long Bình Thuận Q2", expiryDate: "2026-07-20" }
  ]);

  // --- 2. DANH SÁCH MẪU QUY ĐỔI ĐÓNG GÓI HỆ THỐNG ---
  const [globalRatios, setGlobalRatios] = useState([
    { id: "ratio-1", name: "Thùng 24", tradeUnit: "Thùng", ratio: 24 },
    { id: "ratio-2", name: "Lốc 6", tradeUnit: "Lốc", ratio: 6 },
    { id: "ratio-3", name: "Thùng 30", tradeUnit: "Thùng", ratio: 30 },
    { id: "ratio-4", name: "Kiện 10", tradeUnit: "Kiện", ratio: 10 },
    { id: "ratio-5", name: "Bao 50kg", tradeUnit: "Bao", ratio: 50 }
  ]);

  // --- STATE ĐIỀU KHIỂN DROPDOWN LÔ HÀNG ---
  const [activeLotDropdownSku, setActiveLotDropdownSku] = useState(null);
  const [lotSearchQuery, setLotSearchQuery] = useState("");
  const [showFastAddLot, setShowLotFastAdd] = useState(false);
  const [newLotName, setNewLotName] = useState("");
  const [newLotExpiry, setNewLotExpiry] = useState("");

  // --- STATE ĐIỀU KHIỂN DROPDOWN QUY CÁCH QUY ĐỔI ---
  const [activeRatioDropdownSku, setActiveRatioDropdownSku] = useState(null);
  const [ratioSearchQuery, setRatioSearchQuery] = useState("");
  const [showFastAddRatio, setShowRatioFastAdd] = useState(false);
  const [newRatioName, setNewRatioName] = useState("");
  const [newRatioUnit, setNewRatioUnit] = useState("");
  const [newRatioVal, setNewRatioVal] = useState("");

  const dropdownLotRef = useRef(null);
  const dropdownRatioRef = useRef(null);

  // Lắng nghe Click Out đóng toàn bộ Dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownLotRef.current && !dropdownLotRef.current.contains(event.target)) {
        setActiveLotDropdownSku(null);
        setShowLotFastAdd(false);
      }
      if (dropdownRatioRef.current && !dropdownRatioRef.current.contains(event.target)) {
        setActiveRatioDropdownSku(null);
        setShowRatioFastAdd(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showNotification = (msg, type = "success") => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => { setToast({ show: false, message: "", type: "success" }); }, 4000);
  };

  const handleSelectProductFromModal = (product) => {
    const numericPrice = parseInt(product.price.toString().replace(/[.\sđ]/g, ""), 10) || 0;
    const estimatedCostPrice = Math.round(numericPrice * 0.85);

    const isExisted = selectedProducts.some((item) => item.sku === product.sku);
    if (isExisted) {
      setSelectedProducts(prev =>
        prev.map(item => item.sku === product.sku ? { ...item, quantity: item.quantity + 1 } : item)
      );
      showNotification(`Đã tăng số lượng của ${product.name}`);
    } else {
      const newRow = {
        sku: product.sku,
        name: product.name,
        category: product.category,
        unit: product.unit || "Lon",
        tradeUnit: "Thùng", 
        ratio: 24,  
        quantity: 1,
        price: estimatedCostPrice,
        icon: product.icon || "📦",
        selectedLotId: "",
        selectedRatioId: "ratio-1"
      };
      setSelectedProducts(prev => [...prev, newRow]);
      showNotification(`Đã thêm ${product.name} vào phiếu nhập`);
    }
  };

  const handleQuantityChange = (sku, val) => {
    const qty = parseInt(val, 10) || 0;
    setSelectedProducts(prev => prev.map(item => (item.sku === sku ? { ...item, quantity: qty } : item)));
  };

  const handleCostPriceChange = (sku, val) => {
    const price = parseInt(val, 10) || 0;
    setSelectedProducts(prev => prev.map(item => (item.sku === sku ? { ...item, price: price } : item)));
  };

  const handleRemoveRow = (sku) => {
    setSelectedProducts(prev => prev.filter(item => item.sku !== sku));
    showNotification("Đã xóa sản phẩm khỏi danh sách", "warning");
  };

  // --- LOGIC XỬ LÝ LÔ HÀNG (LOT) ---
  const handleSelectLotForProduct = (sku, lotId) => {
    setSelectedProducts(prev => prev.map(item => (item.sku === sku ? { ...item, selectedLotId: lotId } : item)));
    setActiveLotDropdownSku(null); 
  };

  const handleCreateFastLot = (sku) => {
    if (!newLotName.trim() || !newLotExpiry) return alert("Vui lòng điền đầy đủ thông tin Lô hàng!");
    const newLotObj = { id: `lot_${Date.now()}`, name: newLotName.trim(), expiryDate: newLotExpiry };
    setGlobalLots(prev => [...prev, newLotObj]);
    handleSelectLotForProduct(sku, newLotObj.id);
    showNotification(`Đã tạo và áp dụng Lô mới: ${newLotObj.name}`);
    setNewLotName(""); setNewLotExpiry(""); setShowLotFastAdd(false);
  };

  // --- LOGIC XỬ LÝ MẪU QUY ĐỔI ĐÓNG GÓI ---
  const handleSelectRatioForProduct = (sku, ratioObj) => {
    setSelectedProducts(prev => prev.map(item => (item.sku === sku ? { 
      ...item, 
      tradeUnit: ratioObj.tradeUnit, 
      ratio: ratioObj.ratio,
      selectedRatioId: ratioObj.id
    } : item)));
    setActiveRatioDropdownSku(null);
  };

  const handleCreateFastRatio = (sku) => {
    if (!newRatioName.trim() || !newRatioUnit.trim() || !newRatioVal) return alert("Vui lòng nhập đầy đủ thông tin quy cách đóng gói!");
    const newRatioObj = {
      id: `ratio_${Date.now()}`,
      name: newRatioName.trim(),
      tradeUnit: newRatioUnit.trim(),
      ratio: parseInt(newRatioVal, 10) || 1
    };
    setGlobalRatios(prev => [...prev, newRatioObj]);
    
    // Gán trực tiếp quy cách mới tạo lập vào dòng hàng hiện tại
    setSelectedProducts(prev => prev.map(item => (item.sku === sku ? {
      ...item,
      tradeUnit: newRatioObj.tradeUnit,
      ratio: newRatioObj.ratio,
      selectedRatioId: newRatioObj.id
    } : item)));

    showNotification(`Đã lưu và áp dụng quy cách: ${newRatioObj.name}`);
    setNewRatioName(""); setNewRatioUnit(""); setNewRatioVal(""); setShowRatioFastAdd(false);
    setActiveRatioDropdownSku(null);
  };

  const filteredLots = useMemo(() => {
    const query = lotSearchQuery.trim().toLowerCase();
    if (!query) return globalLots;
    return globalLots.filter(l => l.name.toLowerCase().includes(query));
  }, [lotSearchQuery, globalLots]);

  const filteredRatios = useMemo(() => {
    const query = ratioSearchQuery.trim().toLowerCase();
    if (!query) return globalRatios;
    return globalRatios.filter(r => r.name.toLowerCase().includes(query));
  }, [ratioSearchQuery, globalRatios]);

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

  const handleConfirmSubmit = async (e) => {
    e.preventDefault();
    if (selectedProducts.length === 0) return showNotification("Giỏ hàng đang trống!", "error");
    if (selectedProducts.some(item => !item.selectedLotId)) return showNotification("Vui lòng chọn đầy đủ Số Lô & HSD!", "error");

    setSubmitting(true);
    try {
      const apiUrl = import.meta.env.VITE_API_PRODUCT_URL || "http://localhost:5002";
      const payload = {
        warehouse_id: warehouse,
        import_type: importType,
        note: note,
        products: itemsWithTotals.map(item => {
          const lotObj = globalLots.find(l => l.id === item.selectedLotId);
          return {
            sku: item.sku,
            name: item.name,
            standard_quantity: item.standardQuantity, 
            price: item.price, 
            lot_name: lotObj ? lotObj.name : "N/A",
            expiry_date: lotObj ? lotObj.expiryDate : null 
          };
        })
      };
      const response = await axios.post(`${apiUrl}/api/products/inventory/import`, payload);
      if (response.data && response.data.success) {
        showNotification("🎉 Tạo phiếu nhập kho chuẩn nghiệp vụ thành công!");
        setTimeout(() => { navigate("/admin/inventory/import-list"); }, 1500);
      }
    } catch (err) {
      showNotification("Gặp sự cố kết nối tới máy chủ dữ liệu kho!", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const formatVnCurrency = (num) => {
    return new Intl.NumberFormat("vi-VN").format(num) + " đ";
  };

  return (
    <div className="w-full min-h-screen bg-[#f4f6f8] font-sans text-slate-700 antialiased p-4 text-left relative">
      
      {/* TOAST SYSTEM */}
      {toast.show && (
        <div className={`fixed top-5 right-5 z-[99999] px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border text-xs font-bold transition-all duration-300 ${
          toast.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"
        }`}>
          <span>{toast.type === "success" ? "✅" : "❌"}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* HEADER AREA */}
      <div className="flex justify-between items-start mb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Tạo phiếu nhập kho</h1>
          <p className="text-xs text-gray-400 mt-1 font-bold uppercase tracking-wider">Môi trường kiểm kho nghiệp vụ chuyên nghiệp</p>
        </div>
        <button type="button" onClick={() => navigate("/admin/inventory/import-list")} className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-gray-50 transition">
          ↩ Quay về
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* KHỐI TRÁI: DANH SÁCH MẶT HÀNG */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
              <input type="text" placeholder="Quét mã vạch hoặc tìm nhanh tên sản phẩm..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-transparent rounded-xl text-xs font-medium outline-none" />
            </div>
            <button type="button" onClick={() => setIsSkuModalOpen(true)} className="bg-[#006c49] text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm hover:bg-[#005237]">
              ≡ Chọn SKU từ danh sách
            </button>
          </div>

          {/* BẢNG SẢN PHẨM KHÔNG BỊ KHUẤT DROPDOWN */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4" style={{ overflow: "visible" }}>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              📦 Danh sách biến thể kiểm duyệt nhập kho
            </h3>

            <div className="w-full" style={{ overflow: "visible" }}>
              <table className="w-full border-collapse text-left text-xs font-bold" style={{ overflow: "visible" }}>
                <thead>
                  <tr className="bg-slate-50 text-[10px] text-gray-400 uppercase border-b border-slate-100 select-none">
                    <th className="py-3 px-2 w-[22%]">Sản phẩm / SKU</th>
                    <th className="py-3 px-2 w-[24%]">Quản lý LÔ & HSD</th>
                    <th className="py-3 px-2 w-[24%]">Mẫu Quy Đổi Đóng Gói</th>
                    <th className="py-3 px-2 text-center w-[9%]">SL Nhập</th>
                    <th className="py-3 px-2 text-center text-emerald-700 w-[11%]">SL Chuẩn quy đổi</th>
                    <th className="py-3 px-2 text-right w-[11%]">Giá Vốn Nhập</th>
                    <th className="py-3 px-2 text-right">Thành tiền</th>
                    <th className="py-3 px-2 text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-slate-600" style={{ overflow: "visible" }}>
                  {itemsWithTotals.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-8 text-center text-gray-400 font-medium">Chưa có sản phẩm nào được chọn.</td>
                    </tr>
                  ) : (
                    itemsWithTotals.map((row) => {
                      const currentLot = globalLots.find(l => l.id === row.selectedLotId);
                      const currentRatio = globalRatios.find(r => r.id === row.selectedRatioId);
                      const isLotOpen = activeLotDropdownSku === row.sku;
                      const isRatioOpen = activeRatioDropdownSku === row.sku;

                      return (
                        <tr key={row.sku} className="hover:bg-slate-50/40 transition-colors" style={{ overflow: "visible" }}>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{row.icon}</span>
                              <div>
                                <p className="text-slate-800 font-black leading-tight">{row.name}</p>
                                <p className="text-[10px] text-gray-400 font-mono mt-0.5">{row.sku}</p>
                              </div>
                            </div>
                          </td>

                          {/* Ô CHỌN LOT TRỰC TIẾP CHỐNG CHE KHUẤT */}
                          <td className="py-3 px-2 relative" style={{ overflow: "visible" }}>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveLotDropdownSku(isLotOpen ? null : row.sku);
                                setActiveRatioDropdownSku(null);
                                setLotSearchQuery("");
                                setShowLotFastAdd(false);
                              }}
                              className={`w-full bg-white border px-3 py-1.5 rounded-xl text-left font-bold flex items-center justify-between text-xs transition duration-150 ${
                                row.selectedLotId ? "border-emerald-500 text-emerald-800 bg-emerald-50/20" : "border-gray-200 text-slate-400"
                              }`}
                              style={{ zIndex: isLotOpen ? 40 : 1 }}
                            >
                              <span className="truncate">
                                {currentLot ? `📦 ${currentLot.name}` : "-- Chọn LOT --"}
                              </span>
                              <span className="text-gray-400 ml-1 select-none">▼</span>
                            </button>

                            {currentLot && (
                              <p className="text-[9px] text-amber-600 font-mono mt-0.5 pl-1">
                                ⏳ HSD: {new Date(currentLot.expiryDate).toLocaleDateString("vi-VN")}
                              </p>
                            )}

                            {/* KHỐI POPUP DROPDOWN CHỌN LÔ & HSD */}
                            {isLotOpen && (
                              <div 
                                ref={dropdownLotRef} 
                                className="absolute left-0 mt-1 bg-white border border-gray-200 shadow-2xl rounded-2xl p-2.5 space-y-2 text-left w-56"
                                style={{ zIndex: 9999, top: "100%" }}
                              >
                                {!showFastAddLot ? (
                                  <>
                                    <input
                                      type="text"
                                      placeholder="Tìm tên lô..."
                                      value={lotSearchQuery}
                                      onChange={(e) => setLotSearchQuery(e.target.value)}
                                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-gray-200 rounded-lg text-[11px] font-medium outline-none focus:border-emerald-500"
                                    />
                                    <div className="max-h-32 overflow-y-auto divide-y divide-slate-50">
                                      {filteredLots.map(lot => (
                                        <button
                                          type="button"
                                          key={lot.id}
                                          onClick={() => handleSelectLotForProduct(row.sku, lot.id)}
                                          className={`w-full text-left px-2 py-1.5 text-[11px] font-bold block rounded transition ${row.selectedLotId === lot.id ? "bg-emerald-50 text-emerald-800" : "hover:bg-slate-50"}`}
                                        >
                                          <p className="truncate">🏷️ {lot.name}</p>
                                          <p className="text-[9px] text-gray-400 font-mono">EXP: {lot.expiryDate}</p>
                                        </button>
                                      ))}
                                      {filteredLots.length === 0 && (
                                        <p className="text-[10px] text-gray-400 italic text-center py-2">Không thấy lô khớp!</p>
                                      )}
                                    </div>
                                    <button type="button" onClick={() => setShowLotFastAdd(true)} className="w-full bg-[#006c49] text-white py-1.5 rounded-xl text-[10px] font-black uppercase text-center hover:bg-[#005137]">Thêm lô mới</button>
                                  </>
                                ) : (
                                  <div className="space-y-2 p-1">
                                    <p className="text-[10px] font-black text-slate-800 uppercase border-b pb-1">✨ Khởi tạo lô & HSD</p>
                                    <input type="text" placeholder="Tên số Lô..." value={newLotName} onChange={(e) => setNewLotName(e.target.value)} className="w-full px-2 py-1 border border-gray-200 rounded text-[11px]" />
                                    <input type="date" value={newLotExpiry} onChange={(e) => setNewLotExpiry(e.target.value)} className="w-full px-2 py-1 border border-gray-200 rounded text-[11px] font-mono cursor-pointer" />
                                    <div className="grid grid-cols-2 gap-1.5 pt-1"><button type="button" onClick={() => setShowLotFastAdd(false)} className="py-1 bg-slate-100 text-slate-500 rounded text-[10px] font-bold">Hủy</button><button type="button" onClick={() => handleCreateFastLot(row.sku)} className="py-1 bg-emerald-600 text-white rounded text-[10px] font-bold">Lưu lô</button></div>
                                  </div>
                                )}
                              </div>
                            )}
                          </td>

                          {/* 🌟 Ô CHỌN MẪU QUY ĐỔI ĐÓNG GÓI - CUSTOM POPUP */}
                          <td className="py-3 px-2 relative" style={{ overflow: "visible" }}>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveRatioDropdownSku(isRatioOpen ? null : row.sku);
                                setActiveLotDropdownSku(null);
                                setRatioSearchQuery("");
                                setShowRatioFastAdd(false);
                              }}
                              className={`w-full bg-white border px-3 py-1.5 rounded-xl text-left font-bold flex items-center justify-between text-xs transition duration-150 ${
                                row.selectedRatioId ? "border-emerald-500 text-emerald-800 bg-emerald-50/20" : "border-gray-200 text-slate-400"
                              }`}
                              style={{ zIndex: isRatioOpen ? 40 : 1 }}
                            >
                              <span className="truncate">
                                {currentRatio ? `🔄 ${currentRatio.name} (= ${row.ratio} ${row.unit})` : "-- Chọn Quy Cách --"}
                              </span>
                              <span className="text-gray-400 ml-1 select-none">▼</span>
                            </button>

                            {currentRatio && (
                              <p className="text-[9px] text-emerald-600 font-bold mt-0.5 pl-1">
                                📦 ĐV: {row.tradeUnit} (Hệ số: {row.ratio})
                              </p>
                            )}

                            {/* KHỐI POPUP DROPDOWN QUY CÁCH ĐÓNG GÓI */}
                            {isRatioOpen && (
                              <div 
                                ref={dropdownRatioRef} 
                                className="absolute left-0 mt-1 bg-white border border-gray-200 shadow-2xl rounded-2xl p-2.5 text-left w-56"
                                style={{ zIndex: 9999, top: "100%" }}
                              >
                                {!showFastAddRatio ? (
                                  <>
                                    <input type="text" placeholder="Tìm quy cách..." value={ratioSearchQuery} onChange={(e) => setRatioSearchQuery(e.target.value)} className="w-full px-2.5 py-1.5 bg-slate-50 border border-gray-200 rounded-lg text-[11px] outline-none mb-1.5" />
                                    <div className="max-h-32 overflow-y-auto divide-y divide-slate-50 mb-1.5">
                                      {filteredRatios.map(ratioItem => (
                                        <button key={ratioItem.id} type="button" onClick={() => handleSelectRatioForProduct(row.sku, ratioItem)} className={`w-full text-left px-2 py-1.5 text-[11px] font-bold block rounded transition ${row.selectedRatioId === ratioItem.id ? "bg-emerald-50 text-emerald-800" : "hover:bg-slate-50"}`}>
                                          <p className="truncate">⚖️ {ratioItem.name}</p>
                                          <p className="text-[9px] text-gray-400 font-medium">1 {ratioItem.tradeUnit} = {ratioItem.ratio} {row.unit}</p>
                                        </button>
                                      ))}
                                    </div>
                                    <button type="button" onClick={() => setShowRatioFastAdd(true)} className="w-full bg-[#006c49] text-white py-1.5 rounded-xl text-[10px] font-black uppercase text-center hover:bg-[#005137]">Thêm mẫu mới</button>
                                  </>
                                ) : (
                                  <div className="space-y-2 p-1">
                                    <p className="text-[10px] font-black text-slate-800 uppercase border-b pb-1">✨ Thêm quy cách đóng gói</p>
                                    <input type="text" placeholder="Tên nhãn (VD: Thùng 24, Lốc 6)..." value={newRatioName} onChange={(e) => setNewRatioName(e.target.value)} className="w-full px-2 py-1 border border-gray-200 rounded text-[11px]" />
                                    <input type="text" placeholder="ĐV Giao dịch (Thùng, Lốc)..." value={newRatioUnit} onChange={(e) => setNewRatioUnit(e.target.value)} className="w-full px-2 py-1 border border-gray-200 rounded text-[11px]" />
                                    <input type="number" placeholder="Hệ số quy đổi chuẩn..." value={newRatioVal} onChange={(e) => setNewRatioVal(e.target.value)} className="w-full px-2 py-1 border border-gray-200 rounded text-[11px] font-mono" />
                                    <div className="grid grid-cols-2 gap-1.5 pt-1"><button type="button" onClick={() => setShowFastAddRatio(false)} className="py-1 bg-slate-100 text-slate-500 rounded text-[10px] font-bold">Hủy</button><button type="button" onClick={() => handleCreateFastRatio(row.sku)} className="py-1 bg-emerald-600 text-white rounded text-[10px] font-bold">Áp dụng</button></div>
                                  </div>
                                )}
                              </div>
                            )}
                          </td>

                          {/* SỐ LƯỢNG BAO BÌ NHẬP */}
                          <td className="py-3 px-2 text-center">
                            <input type="number" min="1" value={row.quantity} onChange={(e) => handleQuantityChange(row.sku, e.target.value)} className="w-full text-center p-1 bg-white border border-gray-200 rounded-lg font-mono font-bold text-slate-800 outline-none focus:border-emerald-500" />
                          </td>

                          {/* TỰ ĐỘNG HIỂN THỊ SỐ LƯỢNG CHUẨN CƠ SỞ (SL Nhập * Hệ số Ratio) */}
                          <td className="py-3 px-2 text-center font-mono text-emerald-600 font-black bg-emerald-50/20 rounded">
                            {row.standardQuantity} {row.unit}
                          </td>

                          {/* GIÁ VỐN NHẬP KHO */}
                          <td className="py-3 px-2">
                            <input type="number" value={row.price} onChange={(e) => handleCostPriceChange(row.sku, e.target.value)} className="w-full text-right p-1 bg-white border border-gray-200 rounded-lg font-mono text-slate-700 outline-none focus:border-emerald-500" />
                          </td>

                          <td className="py-3 px-2 text-right font-mono font-black text-slate-800">{formatVnCurrency(row.totalPrice)}</td>
                          <td className="py-3 px-2 text-center">
                            <button type="button" onClick={() => handleRemoveRow(row.sku)} className="text-gray-300 hover:text-rose-600 transition text-sm cursor-pointer">🗑️</button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* KHỐI PHẢI: KHO NHẬN & XÁC NHẬN CHỨNG TỪ */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#006c49] text-white p-4 rounded-xl shadow-sm">
            <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-200">TỔNG CỘNG PHIẾU NHẬP VỐN</p>
            <p className="text-3xl font-black font-mono mt-1">{formatVnCurrency(grandTotal)}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase">Kho nhận *</label>
              <select value={warehouse} onChange={(e) => setWarehouse(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 cursor-pointer">
                <option value="1">Kho Tổng (Quận 1)</option>
                <option value="2">Kho Nông Sản Cầu Đất</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase">Loại nhập *</label>
              <select value={importType} onChange={(e) => setImportType(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-gray-100 rounded-lg text-xs font-black text-emerald-700">
                <option value="mua">Mua Hàng</option>
                <option value="tra">Trả Hàng</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase">Nhà cung cấp *</label>
              <input type="text" value="Công ty Nông Sản Xanh" readOnly className="w-full px-3 py-2 bg-slate-50 border border-gray-100 rounded-lg text-xs font-bold text-slate-800 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase">Ghi chú (optional)</label>
              <textarea rows="2" placeholder="Ghi chú phiếu nhập..." value={note} onChange={(e) => setNote(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-slate-700 outline-none resize-none"></textarea>
            </div>

            <div className="pt-2 space-y-2">
              <button type="submit" onClick={handleConfirmSubmit} disabled={submitting} className="w-full bg-[#006c49] text-white py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider shadow-sm disabled:opacity-50 transition cursor-pointer">
                {submitting ? "Đang đẩy dữ liệu kho..." : "Xác nhận tạo phiếu nhập"}
              </button>
            </div>
          </div>
        </div>

      </div>

      <SelectSkuModal isOpen={isSkuModalOpen} onClose={() => setIsSkuModalOpen(false)} onSelect={handleSelectProductFromModal} />
      <ProductDetailModal isOpen={isDetailModalOpen} onClose={() => { setIsDetailModalOpen(false); setActiveDetailProduct(null); }} product={activeDetailProduct} />
    </div>
  );
}