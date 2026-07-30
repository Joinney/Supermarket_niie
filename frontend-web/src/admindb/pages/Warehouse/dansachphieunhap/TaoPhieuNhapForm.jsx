import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import SelectSkuModal from "./SelectSkuModal";
import ProductDetailModal from "./ProductDetailModal";
import { warehouseApi } from "../../../../api/axios";

export default function TaoPhieuNhapForm() {
  const navigate = useNavigate();
  const [isSkuModalOpen, setIsSkuModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [activeDetailProduct, setActiveDetailProduct] = useState(null);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const [dbWarehouses, setDbWarehouses] = useState([]);
  const [globalRatios, setGlobalRatios] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [globalLots, setGlobalLots] = useState([]);

  const [warehouse, setWarehouse] = useState("");
  const [importType, setImportType] = useState("NHAP");
  const [note, setNote] = useState("");

  // 🌟 ĐÃ SỬA: Quản lý Nhà Cung Cấp bằng Danh sách API
  const [amountPaid, setAmountPaid] = useState("");
  const [supplierObj, setSupplierObj] = useState(null); // Lưu Object { id, name }
  const [dbSuppliers, setDbSuppliers] = useState([]); // Lưu danh sách đổ từ BE

  const [submitting, setSubmitting] = useState(false);

  const [activeLotDropdownSku, setActiveLotDropdownSku] = useState(null);
  const [lotSearchQuery, setLotSearchQuery] = useState("");
  const [showFastAddLot, setShowLotFastAdd] = useState(false);
  const [newLotName, setNewLotName] = useState("");
  const [newLotExpiry, setNewLotExpiry] = useState("");

  const [activeRatioDropdownSku, setActiveRatioDropdownSku] = useState(null);
  const [showFastAddRatio, setShowRatioFastAdd] = useState(false);
  const [newRatioUnit, setNewRatioUnit] = useState("Thùng");
  const [newRatioVal, setNewRatioVal] = useState("");

  const dropdownLotRef = useRef(null);
  const dropdownRatioRef = useRef(null);

  // 📡 ĐỒNG BỘ DỮ LIỆU TỪ BACKEND
  useEffect(() => {
    // 1. Lấy danh sách Kho
    warehouseApi
      .get("/warehouses")
      .then((res) => {
        setDbWarehouses(res.data);
        if (res.data.length > 0) setWarehouse(res.data[0].ma_kho);
      })
      .catch((err) => console.error("Lỗi tải danh sách kho nhận:", err));

    // 🌟 2. LẤY DANH SÁCH NHÀ CUNG CẤP TỪ API MỚI
    warehouseApi
      .get("/inventory/suppliers")
      .then((res) => {
        setDbSuppliers(res.data || []);
      })
      .catch((err) => console.error("Lỗi tải danh sách NCC:", err));

    // 3. Lấy Quy đổi đơn vị
    warehouseApi
      .get("/unit-conversions")
      .then((res) => {
        const mappedRatios = res.data.map((item) => ({
          id: `ratio_${item.id}`,
          tradeUnit: item.ma_don_vi_lon,
          baseUnit: item.ma_don_vi_co_so,
          ratio: item.so_luong_quy_doi,
          maSanPham: item.ma_san_pham,
          name: `1 ${item.ma_don_vi_lon} = ${item.so_luong_quy_doi} ${item.ma_don_vi_co_so}`,
        }));
        setGlobalRatios(mappedRatios);
      })
      .catch((err) => console.error("Lỗi tải danh mục quy đổi từ DB:", err));

    // 4. Lấy Lô hàng
    warehouseApi
      .get("/lots/summary")
      .then((res) => {
        const data = res.data || [];
        const lotMap = {};

        data.forEach((item) => {
          if (!lotMap[item.ma_lo_hang]) {
            lotMap[item.ma_lo_hang] = {
              id: item.ma_lo_hang,
              expiryDate: item.ngay_het_han
                ? item.ngay_het_han.substring(0, 10)
                : "N/A",
              skus: new Set([item.sku]),
              productNames: new Set([
                item.ten_san_pham !== "Chưa xác định" ? item.ten_san_pham : "",
              ]),
            };
          } else {
            lotMap[item.ma_lo_hang].skus.add(item.sku);
            if (item.ten_san_pham !== "Chưa xác định") {
              lotMap[item.ma_lo_hang].productNames.add(item.ten_san_pham);
            }
          }
        });

        const mappedLots = Object.values(lotMap).map((lot) => {
          const pNames = Array.from(lot.productNames)
            .filter(Boolean)
            .join(", ");
          return {
            id: lot.id,
            expiryDate: lot.expiryDate,
            skus: Array.from(lot.skus),
            displayName: pNames ? `${lot.id} (${pNames})` : lot.id,
            name: lot.id,
          };
        });
        setGlobalLots(mappedLots);
      })
      .catch((err) => console.error("Lỗi đồng bộ danh sách lô hàng:", err));
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownLotRef.current &&
        !dropdownLotRef.current.contains(event.target)
      ) {
        setActiveLotDropdownSku(null);
        setShowLotFastAdd(false);
      }
      if (
        dropdownRatioRef.current &&
        !dropdownRatioRef.current.contains(event.target)
      ) {
        setActiveRatioDropdownSku(null);
        setShowRatioFastAdd(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showNotification = (msg, type = "success") => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 4000);
  };

const handleSelectMultipleProducts = (selectedItems) => {
    if (!selectedItems || selectedItems.length === 0) return;

    setSelectedProducts((prev) => {
      let updatedList = [...prev];
      let addedCount = 0;

      selectedItems.forEach((product) => {
        const targetSku = product.ma_san_pham || product.sku;
        const targetName = product.ten_san_pham || product.name;
        const baseUnitFromDb = product.ma_don_vi_co_so || product.unit || "Cái";

        const numericPrice = parseInt(
          (product.price || product.gia_von || 0).toString().replace(/[.\sđ]/g, ""), 10
        ) || 0;
        const estimatedCostPrice = numericPrice > 0 ? numericPrice : 50000;

        const existingIndex = updatedList.findIndex((item) => item.sku === targetSku);

        if (existingIndex !== -1) {
          // Nếu đã có trong bảng -> Tăng số lượng lên 1
          updatedList[existingIndex] = {
            ...updatedList[existingIndex],
            quantity: updatedList[existingIndex].quantity + 1,
          };
        } else {
          // Nếu chưa có -> Thêm dòng mới
          const matchedRatio = globalRatios.find((r) => r.maSanPham === targetSku);
          updatedList.push({
            sku: targetSku,
            name: targetName,
            category: product.category || "Hàng hóa",
            unit: matchedRatio ? matchedRatio.baseUnit : baseUnitFromDb,
            tradeUnit: matchedRatio ? matchedRatio.tradeUnit : "Thùng",
            ratio: matchedRatio ? matchedRatio.ratio : 1,
            quantity: 1,
            price: estimatedCostPrice,
            icon: product.icon || "📦",
            selectedLotId: "",
            selectedRatioId: matchedRatio ? matchedRatio.id : "",
          });
          addedCount++;
        }
      });

      showNotification(`Đã đưa ${selectedItems.length} sản phẩm vào phiếu nhập!`);
      return updatedList;
    });

    setIsSkuModalOpen(false); // Đóng modal sau khi xác nhận
  };

  const handleQuantityChange = (sku, val) => {
    const qty = parseInt(val, 10) || 0;
    setSelectedProducts((prev) =>
      prev.map((item) =>
        item.sku === sku ? { ...item, quantity: qty } : item,
      ),
    );
  };

  const handleCostPriceChange = (sku, val) => {
    const price = parseInt(val, 10) || 0;
    setSelectedProducts((prev) =>
      prev.map((item) => (item.sku === sku ? { ...item, price: price } : item)),
    );
  };

  const handleRemoveRow = (sku) => {
    setSelectedProducts((prev) => prev.filter((item) => item.sku !== sku));
    showNotification("Đã bỏ sản phẩm khỏi phiếu", "warning");
  };

  const handleSelectLotForProduct = (sku, lotId) => {
    const selectedLot = globalLots.find((l) => l.id === lotId);
    if (selectedLot && selectedLot.expiryDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expDate = new Date(selectedLot.expiryDate);
      if (expDate < today) {
        return showNotification(
          `⚠️ TỪ CHỐI: Lô [${lotId}] đã hết hạn sử dụng!`,
          "error",
        );
      }
    }
    setSelectedProducts((prev) =>
      prev.map((item) =>
        item.sku === sku ? { ...item, selectedLotId: lotId } : item,
      ),
    );
    setActiveLotDropdownSku(null);
  };

  const handleCreateFastLot = async (sku) => {
    if (!newLotExpiry)
      return showNotification("Vui lòng chọn Hạn sử dụng!", "error");

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedExpiryDate = new Date(newLotExpiry);
    selectedExpiryDate.setHours(0, 0, 0, 0);

    if (selectedExpiryDate < today) {
      return showNotification(
        "⚠️ LỖI: Không thể tạo Lô hàng có HSD nằm trong quá khứ!",
        "error",
      );
    }

    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const currentDateSign = `${yyyy}${mm}${dd}`;

    const skuPrefix =
      sku && sku.includes("-") ? sku.split("-")[0].toUpperCase() : "GEN";
    const baseLotCode = `LOT-${currentDateSign}-${skuPrefix}`;

    const samePrefixLots = globalLots.filter((l) =>
      l.id.startsWith(baseLotCode),
    );
    const nextSequence = String(samePrefixLots.length + 1).padStart(2, "0");

    const finalLotId =
      newLotName.trim() !== ""
        ? newLotName.trim().toUpperCase()
        : `${baseLotCode}${nextSequence}`;

    const currentProduct = selectedProducts.find((p) => p.sku === sku);
    const estimatedPrice = currentProduct ? currentProduct.price : 0;

    const payloadNewLot = {
      sku: sku,
      lot_name: finalLotId,
      price: parseFloat(estimatedPrice),
      expiry_date: newLotExpiry,
    };

    try {
      setSubmitting(true);
      const res = await warehouseApi.post("/lots", payloadNewLot);
      if (res.status === 200 || res.status === 201) {
        const newLotObj = {
          id: finalLotId,
          displayName: `${finalLotId} (Lô vừa tạo)`,
          name: finalLotId,
          expiryDate: newLotExpiry,
          skus: [sku],
        };

        setGlobalLots((prev) => [newLotObj, ...prev]);
        handleSelectLotForProduct(sku, newLotObj.id);
        showNotification(`Đã tạo lô thành công: ${finalLotId}`);
        setNewLotName("");
        setNewLotExpiry("");
        setShowLotFastAdd(false);
      }
    } catch (err) {
      console.error("Lỗi khi đẩy lô hàng mới lên server:", err);
      showNotification("Không thể tạo lô hàng mới trên máy chủ!", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectRatioForProduct = (sku, ratioObj) => {
    setSelectedProducts((prev) =>
      prev.map((item) =>
        item.sku === sku
          ? {
              ...item,
              tradeUnit: ratioObj.tradeUnit,
              unit: ratioObj.baseUnit,
              ratio: ratioObj.ratio,
              selectedRatioId: ratioObj.id,
            }
          : item,
      ),
    );
    setActiveRatioDropdownSku(null);
  };

  const handleCreateFastRatio = (sku) => {
    if (!newRatioUnit.trim() || !newRatioVal)
      return alert("Vui lòng điền đủ thông số quy đổi!");
    const currentProduct = selectedProducts.find((p) => p.sku === sku);
    const fixedBaseUnit = currentProduct ? currentProduct.unit : "Cái";
    const targetRatio = parseInt(newRatioVal, 10) || 1;

    const newRatioObj = {
      id: `ratio_${Date.now()}`,
      tradeUnit: newRatioUnit.trim(),
      baseUnit: fixedBaseUnit,
      ratio: targetRatio,
      maSanPham: sku,
      name: `1 ${newRatioUnit.trim()} = ${targetRatio} ${fixedBaseUnit}`,
    };

    setGlobalRatios((prev) => [...prev, newRatioObj]);
    setSelectedProducts((prev) =>
      prev.map((item) =>
        item.sku === sku
          ? {
              ...item,
              tradeUnit: newRatioObj.tradeUnit,
              unit: newRatioObj.baseUnit,
              ratio: newRatioObj.ratio,
              selectedRatioId: newRatioObj.id,
            }
          : item,
      ),
    );

    showNotification(`Đã kích hoạt quy cách: ${newRatioObj.name}`);
    setNewRatioVal("");
    setShowRatioFastAdd(false);
    setActiveRatioDropdownSku(null);
  };

  const filteredLots = useMemo(() => {
    const query = lotSearchQuery.trim().toLowerCase();
    if (!query) return globalLots;
    return globalLots.filter(
      (l) =>
        l.name.toLowerCase().includes(query) ||
        l.displayName.toLowerCase().includes(query),
    );
  }, [lotSearchQuery, globalLots]);

  const calculateTotals = () => {
    let grandTotal = 0;
    const itemsWithTotals = selectedProducts.map((item) => {
      const standardQuantity = item.quantity * item.ratio;
      const totalPrice = standardQuantity * item.price;
      grandTotal += totalPrice;
      return { ...item, standardQuantity, totalPrice };
    });
    return { itemsWithTotals, grandTotal };
  };

  const { itemsWithTotals, grandTotal } = calculateTotals();

  // 🌟 Logic tính Nợ
  const parsedAmountPaid = parseInt(amountPaid || "0", 10);
  const totalDebt =
    grandTotal - parsedAmountPaid > 0 ? grandTotal - parsedAmountPaid : 0;

  const handleConfirmSubmit = async (e) => {
    e.preventDefault();
    if (selectedProducts.length === 0)
      return showNotification("Phiếu chưa có sản phẩm!", "error");
    if (selectedProducts.some((item) => !item.selectedLotId))
      return showNotification("Vui lòng điền đủ Số Lô & HSD!", "error");
    if (parsedAmountPaid > grandTotal && grandTotal > 0) {
      return showNotification(
        "Tiền trả trước không được vượt quá Tổng giá trị phiếu!",
        "error",
      );
    }

    setSubmitting(true);
    try {
      const savedAdminStr = localStorage.getItem("adminInfo");
      let currentUserId = 1;
      let currentFullName = "Hệ thống kho";

      if (savedAdminStr) {
        try {
          const parsedAdmin = JSON.parse(savedAdminStr);
          currentUserId = parsedAdmin.id || parsedAdmin.user_id || 1;
          currentFullName = `${parsedAdmin.full_name || parsedAdmin.fullName || parsedAdmin.username || "Hệ thống"} (${parsedAdmin.role || localStorage.getItem("adminRole") || "Staff"})`;
        } catch (err) {
          console.error(err);
        }
      }

      // 🌟 ĐÃ SỬA: Gửi đúng supplier_id và supplier_name xuống API
      const payload = {
        warehouse_id: warehouse,
        import_type: importType,
        note: note || "",
        user_id: parseInt(currentUserId, 10),
        full_name: currentFullName,
        amount_paid: parsedAmountPaid,
        supplier_id: supplierObj ? supplierObj.id : "",
        supplier_name: supplierObj ? supplierObj.name : "Chưa xác định",
        products: itemsWithTotals.map((item) => {
          const lotObj = globalLots.find((l) => l.id === item.selectedLotId);
          return {
            sku: item.sku,
            name: item.name,
            standard_quantity: parseInt(item.standardQuantity, 10),
            price: parseFloat(item.price || 0),
            lot_name: lotObj ? lotObj.id : "N/A",
            expiry_date: lotObj ? lotObj.expiryDate : null,
          };
        }),
      };

      const response = await warehouseApi.post("/inventory", payload);
      if (response.status === 200 || response.status === 201) {
        showNotification("🎉 Đã lưu chứng từ và cập nhật số lượng tồn kho!");
        setTimeout(() => navigate("/admin/inventory/import-list"), 1500);
      }
    } catch (err) {
      showNotification(
        err.response?.data?.error ||
          "Lỗi đồng bộ dữ liệu tới máy chủ kho hàng!",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formatVnCurrency = (num) =>
    new Intl.NumberFormat("vi-VN").format(num) + " đ";

  return (
    <div className="w-full min-h-screen bg-[#f4f6f8] font-sans text-slate-700 antialiased p-4 text-left relative">
      {toast.show && (
        <div
          className={`fixed top-5 right-5 z-[99999] px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border text-xs font-bold transition-all duration-300 ${toast.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"}`}
        >
          <span>{toast.type === "success" ? "✅" : "❌"}</span>
          <span>{toast.message}</span>
        </div>
      )}

      <div className="flex justify-between items-start mb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Tạo phiếu nhập kho
          </h1>
          <p className="text-xs text-gray-400 mt-1 font-bold uppercase tracking-wider">
            Hệ thống xử lý & Quy đổi đơn vị tự động
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/admin/inventory/import-list")}
          className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-gray-50 transition cursor-pointer"
        >
          ↩ Quay về
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                🔍
              </span>
              <input
                type="text"
                placeholder="Quét mã vạch hoặc tìm nhanh tên sản phẩm..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-transparent rounded-xl text-xs font-medium outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => setIsSkuModalOpen(true)}
              className="bg-[#006c49] text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm hover:bg-[#005237] cursor-pointer"
            >
              ≡ Chọn sản phẩm từ danh mục
            </button>
          </div>

          <div
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
            style={{ overflow: "visible" }}
          >
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              📦 Biến thể hàng hóa nhập kho thực tế
            </h3>
            <div className="w-full" style={{ overflow: "visible" }}>
              <table
                className="w-full border-collapse text-left text-xs font-bold"
                style={{ overflow: "visible" }}
              >
                <thead>
                  <tr className="bg-slate-50 text-[10px] text-gray-400 uppercase border-b border-slate-100 select-none">
                    <th className="py-3 px-2 w-[22%]">Mặt hàng / SKU</th>
                    <th className="py-3 px-2 w-[22%]">Quản lý LÔ & HSD</th>
                    <th className="py-3 px-2 w-[26%]">Quy Cách / Quy Đổi</th>
                    <th className="py-3 px-2 text-center w-[9%]">SL Nhập</th>
                    <th className="py-3 px-2 text-center text-emerald-700 w-[11%]">
                      Tồn Kho Đổi Ra
                    </th>
                    <th className="py-3 px-2 text-right w-[11%]">Giá Vốn</th>
                    <th className="py-3 px-2 text-right">Thành tiền</th>
                    <th className="py-3 px-2 text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody
                  className="divide-y divide-gray-50 text-slate-600"
                  style={{ overflow: "visible" }}
                >
                  {itemsWithTotals.length === 0 ? (
                    <tr>
                      <td
                        colSpan="8"
                        className="py-12 text-center text-gray-400 font-bold text-xs uppercase tracking-wider select-none"
                      >
                        Chưa có sản phẩm nào được chọn. Vui lòng bấm nút chọn từ
                        danh mục!
                      </td>
                    </tr>
                  ) : (
                    itemsWithTotals.map((row) => {
                      const currentLot = globalLots.find(
                        (l) => l.id === row.selectedLotId,
                      );
                      const isLotOpen = activeLotDropdownSku === row.sku;
                      const isRatioOpen = activeRatioDropdownSku === row.sku;

                      const todayTime = new Date().setHours(0, 0, 0, 0);
                      const validSuggestedLots = [];
                      const expiredSuggestedLots = [];
                      const validOtherLots = [];

                      filteredLots.forEach((l) => {
                        const isExpired =
                          l.expiryDate &&
                          new Date(l.expiryDate).setHours(0, 0, 0, 0) <
                            todayTime;
                        if (l.skus && l.skus.includes(row.sku)) {
                          if (isExpired) expiredSuggestedLots.push(l);
                          else validSuggestedLots.push(l);
                        } else {
                          if (!isExpired) validOtherLots.push(l);
                        }
                      });

                      return (
                        <tr
                          key={row.sku}
                          className="hover:bg-slate-50/40 transition-colors"
                          style={{ overflow: "visible" }}
                        >
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{row.icon}</span>
                              <div>
                                <p className="text-slate-800 font-black leading-tight">
                                  {row.name}
                                </p>
                                <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                                  {row.sku}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td
                            className="py-3 px-2 relative"
                            style={{ overflow: "visible" }}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setActiveLotDropdownSku(
                                  isLotOpen ? null : row.sku,
                                );
                                setActiveRatioDropdownSku(null);
                                setLotSearchQuery("");
                                setShowLotFastAdd(false);
                              }}
                              className={`w-full bg-white border px-2 py-1.5 rounded-xl text-left font-bold flex items-center justify-between text-xs transition duration-150 cursor-pointer ${
                                row.selectedLotId
                                  ? "border-emerald-500 text-emerald-800 bg-emerald-50/20"
                                  : "border-gray-200 text-slate-400"
                              }`}
                            >
                              <span className="truncate">
                                {currentLot
                                  ? `🏷️ ${currentLot.id}`
                                  : "-- Lô hàng --"}
                              </span>
                              <span className="text-gray-400 text-[10px]">
                                ▼
                              </span>
                            </button>
                            {currentLot && (
                              <p className="text-[9px] text-amber-600 font-mono mt-0.5 pl-1">
                                ⏳ HSD: {currentLot.expiryDate}
                              </p>
                            )}

                            {isLotOpen && (
                              <div
                                ref={dropdownLotRef}
                                className="absolute left-0 mt-1 bg-white border border-gray-200 shadow-2xl rounded-2xl p-2.5 space-y-2 text-left w-64"
                                style={{ zIndex: 9999 }}
                              >
                                {!showFastAddLot ? (
                                  <>
                                    <input
                                      type="text"
                                      placeholder="Tìm mã hoặc tên lô..."
                                      value={lotSearchQuery}
                                      onChange={(e) =>
                                        setLotSearchQuery(e.target.value)
                                      }
                                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-gray-200 rounded-lg text-[11px] outline-none"
                                    />

                                    <div className="max-h-48 overflow-y-auto divide-y divide-slate-50">
                                      {filteredLots.length === 0 ? (
                                        <p className="text-[10px] text-gray-400 text-center py-2">
                                          Không tìm thấy lô
                                        </p>
                                      ) : (
                                        <>
                                          {validSuggestedLots.length > 0 && (
                                            <div className="px-2 py-1 bg-emerald-50 text-[9px] font-black text-emerald-700 uppercase sticky top-0 z-10">
                                              Khuyên dùng (Còn hạn)
                                            </div>
                                          )}
                                          {validSuggestedLots.map((lot) => (
                                            <button
                                              type="button"
                                              key={lot.id}
                                              onClick={() =>
                                                handleSelectLotForProduct(
                                                  row.sku,
                                                  lot.id,
                                                )
                                              }
                                              className={`w-full text-left px-2 py-2 text-[11px] font-bold block rounded cursor-pointer ${row.selectedLotId === lot.id ? "bg-emerald-50 text-emerald-800" : "hover:bg-slate-50"}`}
                                            >
                                              <p className="truncate text-slate-700">
                                                🏷️ {lot.displayName}
                                              </p>
                                              <p className="text-[9px] text-emerald-600 font-mono mt-0.5">
                                                HSD: {lot.expiryDate}
                                              </p>
                                            </button>
                                          ))}

                                          {expiredSuggestedLots.length > 0 && (
                                            <div className="px-2 py-1 bg-rose-50 text-[9px] font-black text-rose-700 uppercase sticky top-0 z-10 mt-1">
                                              Lô cũ (Đã hết hạn)
                                            </div>
                                          )}
                                          {expiredSuggestedLots.map((lot) => (
                                            <button
                                              type="button"
                                              key={lot.id}
                                              disabled
                                              className="w-full text-left px-2 py-2 text-[11px] font-bold block rounded cursor-not-allowed opacity-50 bg-slate-50"
                                            >
                                              <p className="truncate text-slate-500">
                                                🚫 {lot.displayName}
                                              </p>
                                              <p className="text-[9px] text-rose-500 font-mono mt-0.5">
                                                HSD: {lot.expiryDate}
                                              </p>
                                            </button>
                                          ))}

                                          {validOtherLots.length > 0 && (
                                            <div className="px-2 py-1 bg-slate-100 text-[9px] font-black text-slate-500 uppercase sticky top-0 z-10 mt-1">
                                              Các lô khác (Còn hạn)
                                            </div>
                                          )}
                                          {validOtherLots.map((lot) => (
                                            <button
                                              type="button"
                                              key={lot.id}
                                              onClick={() =>
                                                handleSelectLotForProduct(
                                                  row.sku,
                                                  lot.id,
                                                )
                                              }
                                              className={`w-full text-left px-2 py-2 text-[11px] font-bold block rounded cursor-pointer ${row.selectedLotId === lot.id ? "bg-emerald-50 text-emerald-800" : "hover:bg-slate-50"}`}
                                            >
                                              <p className="truncate text-slate-700">
                                                🏷️ {lot.displayName}
                                              </p>
                                              <p className="text-[9px] text-gray-400 font-mono mt-0.5">
                                                HSD: {lot.expiryDate}
                                              </p>
                                            </button>
                                          ))}
                                        </>
                                      )}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setShowLotFastAdd(true)}
                                      className="w-full bg-[#006c49] text-white py-1.5 rounded-xl text-[10px] font-black uppercase text-center cursor-pointer hover:bg-[#005237]"
                                    >
                                      Tạo lô nhanh
                                    </button>
                                  </>
                                ) : (
                                  <div className="space-y-2 p-1">
                                    <input
                                      type="text"
                                      placeholder="Mã lô tuỳ chỉnh (Hoặc để trống tự tạo)..."
                                      value={newLotName}
                                      onChange={(e) =>
                                        setNewLotName(e.target.value)
                                      }
                                      className="w-full px-2 py-1.5 border rounded text-[11px] outline-none"
                                    />
                                    <input
                                      type="date"
                                      value={newLotExpiry}
                                      onChange={(e) =>
                                        setNewLotExpiry(e.target.value)
                                      }
                                      className="w-full px-2 py-1.5 border rounded text-[11px] cursor-pointer outline-none"
                                    />
                                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                                      <button
                                        type="button"
                                        onClick={() => setShowLotFastAdd(false)}
                                        className="py-1.5 bg-slate-100 rounded text-[10px] cursor-pointer hover:bg-slate-200 font-bold"
                                      >
                                        Hủy
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleCreateFastLot(row.sku)
                                        }
                                        className="py-1.5 bg-emerald-600 text-white rounded text-[10px] cursor-pointer hover:bg-emerald-700 font-bold"
                                      >
                                        Lưu & Áp dụng
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </td>

                          <td
                            className="py-3 px-2 relative"
                            style={{ overflow: "visible" }}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setActiveRatioDropdownSku(
                                  isRatioOpen ? null : row.sku,
                                );
                                setActiveLotDropdownSku(null);
                                setShowRatioFastAdd(false);
                              }}
                              className="w-full bg-white border border-gray-200 px-2 py-1.5 rounded-xl text-left font-bold flex items-center justify-between text-xs text-slate-700 cursor-pointer"
                            >
                              <span className="truncate">
                                🔄 1 {row.tradeUnit} = {row.ratio} {row.unit}
                              </span>
                              <span className="text-gray-400 text-[10px]">
                                ▼
                              </span>
                            </button>

                            {isRatioOpen && (
                              <div
                                ref={dropdownRatioRef}
                                className="absolute left-0 mt-1 bg-white border border-gray-200 shadow-2xl rounded-2xl p-2.5 text-left w-64"
                                style={{ zIndex: 9999 }}
                              >
                                {!showFastAddRatio ? (
                                  <>
                                    <div className="max-h-40 overflow-y-auto divide-y divide-slate-50 mb-1.5">
                                      {globalRatios
                                        .filter((r) => r.maSanPham === row.sku)
                                        .map((ratioItem) => (
                                          <button
                                            key={ratioItem.id}
                                            type="button"
                                            onClick={() =>
                                              handleSelectRatioForProduct(
                                                row.sku,
                                                ratioItem,
                                              )
                                            }
                                            className="w-full text-left px-2 py-2 text-[11px] font-bold block rounded hover:bg-slate-50 text-slate-700 cursor-pointer"
                                          >
                                            Quy đổi: {ratioItem.tradeUnit}{" "}
                                            &rarr; {ratioItem.ratio}{" "}
                                            {ratioItem.baseUnit}
                                          </button>
                                        ))}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setShowRatioFastAdd(true)}
                                      className="w-full bg-[#006c49] text-white py-1.5 rounded-xl text-[10px] font-black uppercase text-center cursor-pointer hover:bg-[#005237]"
                                    >
                                      Thiết lập quy đổi mới
                                    </button>
                                  </>
                                ) : (
                                  <div className="space-y-2 p-1 text-slate-700">
                                    <p className="text-[10px] font-black uppercase border-b pb-1">
                                      ⚙️ Công cụ quy đổi mẫu
                                    </p>
                                    <div className="space-y-1.5">
                                      <div>
                                        <label className="text-[9px] text-gray-400">
                                          Đơn vị nhập mới (Lớn)
                                        </label>
                                        <select
                                          value={newRatioUnit}
                                          onChange={(e) =>
                                            setNewRatioUnit(e.target.value)
                                          }
                                          className="w-full p-1.5 border text-[11px] rounded bg-white font-bold cursor-pointer outline-none"
                                        >
                                          <option value="Thùng">Thùng</option>
                                          <option value="Két">Két</option>
                                          <option value="Bao">Bao</option>
                                          <option value="Lốc">Lốc</option>
                                        </select>
                                      </div>
                                      <div>
                                        <label className="text-[9px] text-gray-400 block">
                                          Đơn vị cơ sở gốc của SKU
                                        </label>
                                        <span className="inline-block mt-0.5 px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 font-mono font-black text-[11px] rounded-lg">
                                          {row.unit}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="pt-1">
                                      <label className="text-[9px] text-gray-400">
                                        Hệ số đổi ra {row.unit}
                                      </label>
                                      <input
                                        type="number"
                                        placeholder={`Số lượng quy đổi ra ${row.unit}...`}
                                        value={newRatioVal}
                                        onChange={(e) =>
                                          setNewRatioVal(e.target.value)
                                        }
                                        className="w-full px-2 py-1 border rounded text-[11px] font-mono outline-none"
                                      />
                                    </div>
                                    <div className="grid grid-cols-2 gap-1.5 pt-1.5">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setShowRatioFastAdd(false)
                                        }
                                        className="py-1 bg-slate-100 rounded text-[10px] font-bold cursor-pointer hover:bg-slate-200"
                                      >
                                        Hủy
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleCreateFastRatio(row.sku)
                                        }
                                        className="py-1 bg-emerald-600 text-white rounded text-[10px] font-bold cursor-pointer hover:bg-emerald-700"
                                      >
                                        Áp dụng
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-2 text-center">
                            <input
                              type="number"
                              min="1"
                              value={row.quantity}
                              onChange={(e) =>
                                handleQuantityChange(row.sku, e.target.value)
                              }
                              className="w-full text-center p-1 bg-white border border-gray-200 rounded-lg font-mono font-bold text-slate-800 outline-none focus:border-emerald-500"
                            />
                          </td>
                          <td className="py-3 px-2 text-center font-mono text-emerald-700 font-black bg-emerald-50/40 rounded">
                            {row.standardQuantity} {row.unit}
                          </td>
                          <td className="py-3 px-2">
                            <input
                              type="number"
                              value={row.price}
                              onChange={(e) =>
                                handleCostPriceChange(row.sku, e.target.value)
                              }
                              className="w-full text-right p-1 bg-white border border-gray-200 rounded-lg font-mono text-slate-700 outline-none focus:border-emerald-500"
                            />
                          </td>
                          <td className="py-3 px-2 text-right font-mono font-black text-slate-800">
                            {formatVnCurrency(row.totalPrice)}
                          </td>
                          <td className="py-3 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(row.sku)}
                              className="text-gray-300 hover:text-rose-600 text-sm cursor-pointer transition"
                            >
                              🗑️
                            </button>
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

        {/* 🌟 BẢNG THÔNG TIN PHIẾU (CỘT PHẢI) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#006c49] text-white p-4 rounded-xl shadow-sm">
            <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-200">
              TỔNG GIÁ TRỊ VỐN CHỨNG TỪ
            </p>
            <p className="text-3xl font-black font-mono mt-1">
              {formatVnCurrency(grandTotal)}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-4">
            {/* 🌟 ĐÃ SỬA: SỬ DỤNG SELECT ĐỂ CHỌN NHÀ CUNG CẤP TỪ API */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase">
                Nhà cung cấp *
              </label>
              <select
                value={supplierObj ? supplierObj.id : ""}
                onChange={(e) => {
                  const selSup = dbSuppliers.find(
                    (s) => s.ma_nha_cung_cap === e.target.value,
                  );
                  setSupplierObj(
                    selSup
                      ? {
                          id: selSup.ma_nha_cung_cap,
                          name: selSup.ten_nha_cung_cap,
                        }
                      : null,
                  );
                }}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-slate-700 outline-none cursor-pointer focus:border-[#006c49]"
              >
                <option value="">-- Chọn Nhà cung cấp --</option>
                {dbSuppliers.map((s) => (
                  <option key={s.ma_nha_cung_cap} value={s.ma_nha_cung_cap}>
                    {s.ten_nha_cung_cap}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase">
                Kho nhận hàng *
              </label>
              <select
                value={warehouse}
                onChange={(e) => setWarehouse(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-slate-700 outline-none cursor-pointer focus:border-[#006c49]"
              >
                {dbWarehouses.map((w) => (
                  <option key={w.ma_kho} value={w.ma_kho}>
                    {w.ten_kho}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase">
                Hình thức kiểm duyệt *
              </label>
              <select
                value={importType}
                onChange={(e) => setImportType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-gray-100 rounded-lg text-xs font-black text-emerald-700 cursor-pointer outline-none"
              >
                <option value="NHAP">Mua Hàng Từ Nhà Cung Cấp</option>
                <option value="TRATON">Khách Trả Hàng Lưu Kho</option>
              </select>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase">
                  Đã thanh toán trước (VNĐ)
                </label>
                <input
                  type="number"
                  min="0"
                  max={grandTotal}
                  placeholder="Nhập số tiền đã trả..."
                  value={amountPaid}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10) || 0;

                    if (val > grandTotal) {
                      setAmountPaid(grandTotal.toString());
                      showNotification(
                        "Tiền trả trước không được vượt quá Tổng giá trị phiếu!",
                        "error",
                      );
                    } else if (val < 0) {
                      setAmountPaid("0");
                    } else {
                      setAmountPaid(e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div className="flex justify-between items-center border-t border-slate-200 pt-2">
                <span className="text-[10px] font-black text-slate-500 uppercase">
                  Còn Nợ Lại:
                </span>
                <span
                  className={`text-sm font-black font-mono ${totalDebt > 0 ? "text-rose-600" : "text-emerald-600"}`}
                >
                  {formatVnCurrency(totalDebt)}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase">
                Ghi chú vận hành
              </label>
              <textarea
                rows="2"
                placeholder="Nội dung ghi chú..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs outline-none resize-none focus:border-emerald-500 transition"
              ></textarea>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                onClick={handleConfirmSubmit}
                disabled={submitting}
                className={`w-full text-white py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider shadow-sm transition ${submitting ? "bg-gray-400 cursor-not-allowed" : "bg-[#006c49] hover:bg-[#005237] cursor-pointer"}`}
              >
                {submitting
                  ? "Đang đẩy dữ liệu kho..."
                  : "Xác nhận tạo phiếu nhập"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <SelectSkuModal
        isOpen={isSkuModalOpen}
        onClose={() => setIsSkuModalOpen(false)}
        onSelectMultiple={handleSelectMultipleProducts} 
      />
      <ProductDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setActiveDetailProduct(null);
        }}
        product={activeDetailProduct}
      />
    </div>
  );
}
