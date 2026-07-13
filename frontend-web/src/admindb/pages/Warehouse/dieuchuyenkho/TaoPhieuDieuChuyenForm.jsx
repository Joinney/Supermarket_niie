import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ArrowDown,
  Package,
  Trash2,
  Plus,
  Search,
  X,
} from "lucide-react";
import { warehouseApi } from "../../../../api/axios";

const removeVietnameseTones = (str) => {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
};

const TaoPhieuDieuChuyenForm = ({ onCancel }) => {
  const [fromWarehouse, setFromWarehouse] = useState("");
  const [toWarehouse, setToWarehouse] = useState("");
  const [note, setNote] = useState("");

  const [warehouses, setWarehouses] = useState([]);
  const [inventory, setInventory] = useState([]);

  const [products, setProducts] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);

  // 1. TẢI DANH SÁCH KHO KHI MỞ FORM
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const whRes = await warehouseApi.get("/warehouses");
        const activeWarehouses = (whRes.data || []).filter(
          (w) => w.trang_thai === "active" || w.trang_thai === true,
        );
        setWarehouses(activeWarehouses);
      } catch (error) {
        console.error("Lỗi khi tải danh sách kho:", error);
      }
    };
    fetchWarehouses();
  }, []);

  // 2. TẢI TỒN KHO THEO ĐÚNG KHO NGUỒN ĐƯỢC CHỌN
  useEffect(() => {
    const fetchWarehouseInventory = async () => {
      if (!fromWarehouse) {
        setInventory([]);
        return;
      }
      setIsLoadingInventory(true);
      try {
        // Gửi query param ma_kho để BE lọc đúng hàng của kho này
        const invRes = await warehouseApi.get(
          `/inventory?ma_kho=${fromWarehouse}`,
        );
        setInventory(invRes.data || []);
      } catch (error) {
        console.error("Lỗi khi tải tồn kho của kho nguồn:", error);
        setInventory([]);
      } finally {
        setIsLoadingInventory(false);
      }
    };
    fetchWarehouseInventory();
  }, [fromWarehouse]);

  const filteredInventory = inventory.filter((item) => {
    const query = removeVietnameseTones(searchKeyword.toLowerCase());
    const matchName = removeVietnameseTones(
      (item.name || "").toLowerCase(),
    ).includes(query);
    const matchSku = removeVietnameseTones(
      (item.sku || item.id || "").toLowerCase(),
    ).includes(query);
    // Chỉ hiển thị các sản phẩm có tồn kho > 0
    return (
      (matchName || matchSku) &&
      (item.so_luong_thuc_te > 0 || item.quantity > 0)
    );
  });

  const handleAddProduct = (item) => {
    const skuCode = item.sku || item.id;
    if (products.some((p) => p.sku === skuCode)) {
      alert("Sản phẩm này đã được chọn!");
      return;
    }
    setProducts((prev) => [
      ...prev,
      {
        sku: skuCode,
        name: item.name || item.ten_san_pham,
        maxStock: item.so_luong_thuc_te || item.quantity,
        quantity: 1,
      },
    ]);
    setShowSearch(false);
    setSearchKeyword("");
  };

  const handleQuantityChange = (sku, value) => {
    const qty = parseInt(value, 10) || 0;
    setProducts((prev) =>
      prev.map((item) => {
        if (item.sku === sku) {
          let finalQty = qty < 0 ? 0 : qty;
          if (finalQty > item.maxStock) {
            alert(
              `Sản phẩm ${item.name} tại kho này chỉ còn tồn tối đa ${item.maxStock} đơn vị!`,
            );
            finalQty = item.maxStock;
          }
          return { ...item, quantity: finalQty };
        }
        return item;
      }),
    );
  };

  const handleRemoveProduct = (sku) => {
    setProducts((prev) => prev.filter((item) => item.sku !== sku));
  };

  // 3. UX LOGIC KHI ĐỔI KHO NGUỒN
  const handleFromWarehouseChange = (e) => {
    const newFrom = e.target.value;

    // Nếu đang chọn sản phẩm mà đổi kho nguồn -> Cảnh báo và Xóa danh sách sản phẩm cũ
    if (products.length > 0) {
      if (
        !window.confirm(
          "Thay đổi Kho nguồn sẽ làm mới danh sách sản phẩm đang chọn. Bạn có chắc chắn muốn đổi?",
        )
      ) {
        return;
      }
    }

    setFromWarehouse(newFrom);
    setProducts([]); // Dọn dẹp danh sách sản phẩm cũ
    setSearchKeyword("");
    setShowSearch(false);

    if (newFrom === toWarehouse && newFrom !== "") {
      setToWarehouse("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fromWarehouse || !toWarehouse) {
      alert("Vui lòng chọn đầy đủ Kho Nguồn và Kho Đích!");
      return;
    }
    if (fromWarehouse === toWarehouse) {
      alert("Kho nguồn và kho đích không được trùng nhau!");
      return;
    }
    if (products.length === 0) {
      alert("Vui lòng chọn ít nhất 1 sản phẩm để điều chuyển!");
      return;
    }

    const invalidItem = products.find((p) => p.quantity <= 0);
    if (invalidItem) {
      alert(`Sản phẩm ${invalidItem.name} có số lượng chuyển không hợp lệ!`);
      return;
    }

    const payload = {
      kho_nguon: fromWarehouse,
      kho_dich: toWarehouse,
      ghi_chu: note,
      nguoi_tao_id: 1, // Đã fix chuẩn Integer cho DB
      items: products.map((p) => ({
        sku: p.sku,
        quantity: p.quantity,
      })),
    };

    try {
      await warehouseApi.post("/transfers", payload);
      alert("🎉 Đã tạo Phiếu Điều Chuyển thành công! Chờ xét duyệt.");
      onCancel();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || "Đã xảy ra lỗi khi tạo phiếu!");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="w-full min-h-screen bg-[#fafafa] font-sans text-left text-slate-700 selection:bg-emerald-100 p-1 antialiased overflow-y-auto"
    >
      <div className="w-full">
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
              <span className="text-[#006c49] font-bold">
                Khởi tạo phiếu điều chuyển
              </span>
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

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start"
        >
          {/* KHỐI TRÁI: DANH SÁCH SẢN PHẨM */}
          <div
            className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-5 space-y-4"
            style={{ overflow: "visible" }}
          >
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              📦 Danh sách Sản phẩm điều chuyển thực tế
            </h3>

            <div className="w-full overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full border-collapse text-left text-xs font-bold min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50/70 text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-100 select-none">
                    <th className="py-3 px-4 w-[45%]">Sản phẩm / SKU</th>
                    <th className="py-3 px-4 text-center w-[25%]">
                      Tồn kho nguồn
                    </th>
                    <th className="py-3 px-4 text-center w-[18%]">SL Chuyển</th>
                    <th className="py-3 px-4 w-12 text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-600 font-semibold">
                  {products.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="py-12 text-center text-slate-400 font-medium tracking-wide uppercase text-[10px] select-none"
                      >
                        Chưa có sản phẩm nào được chọn điều chuyển.
                      </td>
                    </tr>
                  ) : (
                    products.map((row) => (
                      <tr
                        key={row.sku}
                        className="hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 text-sm shrink-0 select-none">
                              <Package size={16} />
                            </div>
                            <div className="min-w-0">
                              <p
                                className="text-slate-800 font-bold truncate max-w-[220px]"
                                title={row.name}
                              >
                                {row.name}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono font-medium mt-0.5">
                                {row.sku}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-block px-2.5 py-0.5 bg-slate-50 border border-slate-100 text-slate-700 rounded text-[11px] font-mono font-black">
                            {row.maxStock.toLocaleString("vi-VN")} Đơn vị
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="number"
                            min="1"
                            max={row.maxStock}
                            value={row.quantity}
                            onChange={(e) =>
                              handleQuantityChange(row.sku, e.target.value)
                            }
                            className="w-full text-center p-1 bg-slate-50 border border-slate-200 rounded-lg font-mono font-black text-slate-800 outline-none focus:bg-white focus:border-[#006c49] transition"
                          />
                        </td>
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

            {/* BLOCK TÌM KIẾM VÀ CHỌN SẢN PHẨM */}
            {!fromWarehouse ? (
              <div className="w-full py-4 mt-2 border border-dashed border-amber-200 bg-amber-50/50 text-amber-600 rounded-xl text-xs font-bold flex items-center justify-center text-center px-4">
                Vui lòng chọn "Kho Nguồn" ở bảng bên phải trước khi thêm sản
                phẩm điều chuyển!
              </div>
            ) : !showSearch ? (
              <button
                type="button"
                onClick={() => setShowSearch(true)}
                className="w-full py-2 border border-dashed border-slate-200 text-slate-400 rounded-xl hover:bg-slate-50 hover:text-slate-600 hover:border-slate-300 transition text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer mt-2"
              >
                <Plus size={14} /> Thêm mặt hàng điều chuyển
              </button>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 bg-slate-50 border border-slate-200 rounded-xl p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-black uppercase text-slate-500">
                    Tra cứu sản phẩm trong kho nguồn
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowSearch(false)}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="relative mb-2">
                  <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                    <Search size={14} />
                  </span>
                  <input
                    autoFocus
                    type="text"
                    placeholder="Gõ tên hoặc mã SKU để tìm..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs font-medium border border-slate-200 rounded-lg outline-none focus:border-[#006c49] bg-white"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto bg-white border border-slate-100 rounded-lg shadow-3xs divide-y divide-slate-50">
                  {isLoadingInventory ? (
                    <p className="p-4 text-center text-xs text-[#006c49] font-bold animate-pulse">
                      Đang tải dữ liệu tồn kho...
                    </p>
                  ) : filteredInventory.length === 0 ? (
                    <p className="p-4 text-center text-xs text-slate-400 font-medium italic">
                      Không tìm thấy sản phẩm nào có sẵn trong kho nguồn này.
                    </p>
                  ) : (
                    filteredInventory.map((item) => (
                      <div
                        key={item.sku || item.id}
                        onClick={() => handleAddProduct(item)}
                        className="p-2.5 flex items-center justify-between hover:bg-emerald-50 cursor-pointer transition group"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-800 group-hover:text-[#006c49]">
                            {item.name || item.ten_san_pham}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {item.sku || item.id}
                          </p>
                        </div>
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">
                          Tồn: {item.so_luong_thuc_te || item.quantity}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* KHỐI PHẢI: LỘ TRÌNH & GHI CHÚ */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-50 pb-2">
              🗺️ Lộ trình di chuyển & Ghi chú chứng từ
            </h3>

            <div className="space-y-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Kho nguồn (Phân vùng xuất đi){" "}
                <span className="text-red-500">*</span>
              </label>
              <select
                value={fromWarehouse}
                onChange={handleFromWarehouseChange}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-[#006c49] cursor-pointer shadow-3xs"
              >
                <option value="">-- Chọn Kho Nguồn --</option>
                {warehouses.map((w) => (
                  <option key={w.ma_kho} value={w.ma_kho}>
                    {w.ten_kho}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-center select-none py-0.5">
              <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shadow-3xs">
                <ArrowDown size={14} strokeWidth={2.5} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Kho đích (Phân vùng nhập vào){" "}
                <span className="text-red-500">*</span>
              </label>
              <select
                value={toWarehouse}
                onChange={(e) => setToWarehouse(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-[#006c49] cursor-pointer shadow-3xs"
              >
                <option value="">-- Chọn Kho Đích --</option>
                {warehouses.map((w) => (
                  <option
                    key={w.ma_kho}
                    value={w.ma_kho}
                    disabled={w.ma_kho === fromWarehouse}
                  >
                    {w.ten_kho}{" "}
                    {w.ma_kho === fromWarehouse ? "(Đang là kho nguồn)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1 pt-2 border-t border-slate-100">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Ghi chú lý do điều vận
              </label>
              <textarea
                rows="3"
                placeholder="Lý do điều chuyển hệ thống, số xe vận tải trung chuyển hàng hóa..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-[#006c49] transition resize-none placeholder-slate-400"
              />
            </div>

            <div className="pt-2 space-y-2 text-xs font-bold">
              <button
                type="submit"
                className="w-full bg-[#006c49] hover:bg-[#005137] text-white py-2.5 rounded-xl uppercase tracking-wider shadow-sm transition transform active:scale-98 cursor-pointer"
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
