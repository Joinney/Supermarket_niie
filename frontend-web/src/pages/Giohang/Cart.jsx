import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Trash2,
  Minus,
  Plus,
  ShoppingBag,
  ArrowLeft,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { useCart } from "../../context/CartContext";

export default function Cart() {
  const { cart, loading, removeFromCart, addToCart, fetchCart } = useCart();
  const navigate = useNavigate();

  const [expandedProducts, setExpandedOrigins] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => {
    if (typeof fetchCart === "function") {
      fetchCart();
    }
  }, [fetchCart]);

  // Gom các phân loại trùng productId lại
  const groupedCart = useMemo(() => {
    const groups = {};
    cart.forEach((item) => {
      const pId = item.productId || item.id || "unknown";
      if (!groups[pId]) {
        groups[pId] = {
          productId: pId,
          name: item.name,
          image: item.image,
          countryCode: item.countryCode,
          categorySlug: item.categorySlug,
          totalQuantity: 0,
          subVariants: [],
        };
      }
      groups[pId].totalQuantity += item.quantity || 1;
      groups[pId].subVariants.push(item);
    });
    return Object.values(groups);
  }, [cart]);

  useEffect(() => {
    if (groupedCart.length > 0 && expandedProducts.length === 0) {
      const multiVariantIds = groupedCart
        .filter((group) => group.subVariants.length > 1)
        .map((group) => group.productId);
      setExpandedOrigins(multiVariantIds);
    }
  }, [groupedCart]);

  useEffect(() => {
    if (cart && cart.length > 0) {
      setSelectedItems(cart.map((item) => item.variantId));
    } else {
      setSelectedItems([]);
    }
  }, [cart]);

  const toggleExpandProduct = (productId) => {
    setExpandedOrigins((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  };

  const toggleSelectItem = (variantId) => {
    setSelectedItems((prev) =>
      prev.includes(variantId)
        ? prev.filter((id) => id !== variantId)
        : [...prev, variantId],
    );
  };

  const toggleSelectGroup = (subVariants) => {
    const subVariantIds = subVariants.map((v) => v.variantId);
    const isAllGroupSelected = subVariantIds.every((id) =>
      selectedItems.includes(id),
    );

    if (isAllGroupSelected) {
      setSelectedItems((prev) =>
        prev.filter((id) => !subVariantIds.includes(id)),
      );
    } else {
      setSelectedItems((prev) => [...new Set([...prev, ...subVariantIds])]);
    }
  };

  const toggleSelectAll = () => {
    setSelectedItems(
      selectedItems.length === cart.length
        ? []
        : cart.map((item) => item.variantId),
    );
  };

  const getMaxStock = (item) => {
    const stockVal = item.stock 
      ?? item.so_luong_ton 
      ?? item.so_luong_thuc_te
      ?? item?.variant?.so_luong_ton 
      ?? item?.bien_the?.so_luong_ton 
      ?? item?.product?.so_luong_ton;
    return stockVal !== undefined && stockVal !== null ? Number(stockVal) : 9999;
  };

  const handleUpdateQuantity = (item, type) => {
    // IN RA CONSOLE ĐỂ XEM BACKEND TRẢ VỀ CÁI GÌ
    console.log("🔍 KIỂM TRA ITEM TRONG GIỎ HÀNG:", item); 

    const currentQty = Number(item.quantity) || 1;
    const maxStock = getMaxStock(item);

    if (type === "minus" && currentQty <= 1) return;
    
    if (type === "plus" && currentQty >= maxStock) {
      alert(`Rất tiếc! Phân loại này chỉ còn ${maxStock} sản phẩm trong kho.`);
      return;
    }

    addToCart({ ...item, quantity: type === "plus" ? 1 : -1 });
  };

  const selectedCartItems = cart.filter((item) =>
    selectedItems.includes(item.variantId),
  );
  const totalPrice = selectedCartItems.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
    0,
  );

  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      alert("Vui lòng chọn ít nhất một sản phẩm để tiến hành thanh toán!");
      return;
    }
    localStorage.setItem("checkoutItems", JSON.stringify(selectedCartItems));
    navigate("/checkout");
  };

  if (loading) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center bg-white">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-[#006c49]/10 border-t-[#006c49] rounded-full animate-spin"></div>
          <ShoppingBag
            size={24}
            className="absolute text-[#006c49] animate-pulse"
          />
        </div>
        <p className="text-slate-400 font-extrabold tracking-widest mt-6 uppercase italic text-xs animate-pulse">
          Đang đồng bộ túi hàng Demi Mart...
        </p>
      </div>
    );
  }

  if (!cart || cart.length === 0) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 bg-gradient-to-br from-slate-50 to-emerald-50/20">
        <div className="bg-white border border-slate-100 p-8 rounded-2xl shadow-xl shadow-slate-200/50 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-gradient-to-tr from-emerald-50 to-teal-50 rounded-full flex items-center justify-center mx-auto mb-6 relative">
            <ShoppingBag size={36} className="text-[#006c49]" />
            <Sparkles
              size={14}
              className="absolute top-2 right-4 text-amber-400 animate-spin"
            />
          </div>
          <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tight">
            Túi hàng trống
          </h2>
          <Link
            to="/"
            className="mt-6 inline-block w-full bg-gradient-to-r from-[#006c49] to-[#00523d] text-white py-3.5 rounded-xl font-black uppercase tracking-widest transition-all shadow-md text-center"
          >
            Quay lại mua sắm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 pb-28 text-left selection:bg-[#006c49] selection:text-white">
      <div className="w-full max-w-[1250px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 lg:pt-14">
        <div className="flex items-center gap-4 mb-10 border-b border-slate-100 pb-6 flex-wrap justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-3 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl transition-all shadow-sm"
            >
              <ArrowLeft size={18} className="text-slate-700" />
            </button>
            <div>
              <h1 className="text-2xl lg:text-3xl font-black text-slate-900 uppercase italic tracking-tighter flex items-center gap-3">
                Giỏ hàng của bạn
                <span className="bg-emerald-50 text-[#006c49] font-black not-italic text-xs lg:text-sm px-3 py-1 rounded-lg border border-emerald-100 shadow-inner">
                  {cart.length} mục
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-amber-600 bg-amber-50 px-4 py-2 rounded-xl border border-amber-100">
            <AlertCircle size={14} /> Giao hàng miễn phí cho đơn hàng từ 500k
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between bg-white border border-slate-100 px-5 py-4 rounded-xl shadow-sm">
              <label className="flex items-center gap-3 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={
                    selectedItems.length === cart.length && cart.length > 0
                  }
                  onChange={toggleSelectAll}
                  className="w-5 h-5 rounded accent-[#006c49] cursor-pointer border-slate-300"
                />
                <span className="font-black text-slate-700 text-xs lg:text-sm uppercase tracking-wide">
                  Chọn tất cả phân loại ({selectedItems.length}/{cart.length})
                </span>
              </label>
            </div>

            <div className="space-y-4">
              {groupedCart.map((group) => {
                const country = group.countryCode || "vn";
                const category = group.categorySlug || "san-pham";
                const hasMultipleVariants = group.subVariants.length > 1;

                // ─── TRƯỜNG HỢP 1: SẢN PHẨM ĐƠN ───
                if (!hasMultipleVariants) {
                  const singleItem = group.subVariants[0];
                  const isSelected = selectedItems.includes(
                    singleItem.variantId,
                  );
                  const productDetailUrl = `/${country.toLowerCase()}/product/${category}/${group.productId}/${singleItem.variantId}`;
                  
                  const maxStock = getMaxStock(singleItem);

                  return (
                    <div
                      key={singleItem.variantId}
                      className={`flex items-center gap-4 bg-white border p-4 rounded-2xl shadow-sm transition-all duration-300 ${
                        isSelected
                          ? "border-[#006c49]/40 bg-emerald-50/5 ring-2 ring-emerald-500/5"
                          : "border-slate-100"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectItem(singleItem.variantId)}
                        className="w-5 h-5 rounded accent-[#006c49] cursor-pointer border-slate-300"
                      />

                      <div className="w-16 h-16 bg-white border border-slate-200/60 rounded-xl overflow-hidden p-1.5 shadow-sm flex-shrink-0 flex items-center justify-center">
                        <img
                          src={
                            singleItem.image ||
                            "https://via.placeholder.com/150"
                          }
                          alt={singleItem.name}
                          className="w-full h-full object-contain"
                        />
                      </div>

                      <div className="flex-1 min-w-0 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
                        <div className="min-w-0 flex-1 text-left">
                          <Link
                            to={productDetailUrl}
                            className="font-black text-slate-800 text-sm lg:text-base uppercase truncate italic hover:text-[#006c49] block"
                          >
                            {singleItem.name || "Sản phẩm"}
                          </Link>

                          {singleItem.thuoc_tinh_hop_nhat &&
                          singleItem.thuoc_tinh_hop_nhat.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {singleItem.thuoc_tinh_hop_nhat.map(
                                (attr, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center text-[10px] font-bold tracking-wide text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-100/60 shadow-sm"
                                  >
                                    {attr.ten_thuoc_tinh}:{" "}
                                    <b className="text-slate-700 ml-1 font-black">
                                      {attr.gia_tri}
                                    </b>
                                  </span>
                                ),
                              )}
                            </div>
                          ) : (
                            singleItem.variantName && (
                              <span className="inline-block mt-1.5 text-[10px] font-bold tracking-wide text-slate-400 bg-slate-50 px-2.5 py-0.5 rounded border border-slate-100">
                                Phân loại: {singleItem.variantName}
                              </span>
                            )
                          )}
                        </div>

                        <div className="flex items-center gap-4 flex-shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                          <span className="font-black text-[#006c49] text-sm lg:text-base italic tracking-tight min-w-[70px] text-right">
                            {(singleItem.price || 0).toLocaleString()}đ
                          </span>

                          <div className="flex items-center bg-slate-100 border border-slate-200/60 rounded-lg p-0.5 shadow-inner">
                            <button
                              onClick={() =>
                                handleUpdateQuantity(singleItem, "minus")
                              }
                              disabled={(singleItem.quantity || 1) <= 1}
                              className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-white rounded transition-all disabled:opacity-30"
                            >
                              <Minus size={10} strokeWidth={3} />
                            </button>
                            <span className="w-8 text-center font-black text-slate-800 text-xs">
                              {singleItem.quantity || 1}
                            </span>
                            
                            <button
                              onClick={() =>
                                handleUpdateQuantity(singleItem, "plus")
                              }
                              disabled={(singleItem.quantity || 1) >= maxStock}
                              className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-white rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Plus size={10} strokeWidth={3} />
                            </button>
                          </div>

                          <button
                            onClick={() => removeFromCart(singleItem.variantId)}
                            className="text-slate-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                // ─── TRƯỜNG HỢP 2: SẢN PHẨM GOM BIẾN THỂ ───
                const isExpanded = expandedProducts.includes(group.productId);
                const mainProductUrl = `/${country.toLowerCase()}/product/${category}/${group.productId}`;

                const isAllGroupSelected = group.subVariants
                  .map((v) => v.variantId)
                  .every((id) => selectedItems.includes(id));

                return (
                  <div
                    key={group.productId}
                    className={`bg-white border rounded-2xl shadow-sm overflow-hidden transition-all duration-300 border-slate-100 ${isExpanded ? "ring-1 ring-slate-200 shadow-md" : ""}`}
                  >
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-slate-50 via-slate-50/30 to-white justify-between">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={isAllGroupSelected}
                          onChange={() => toggleSelectGroup(group.subVariants)}
                          className="w-5 h-5 rounded accent-[#006c49] cursor-pointer border-slate-300"
                        />

                        <div className="w-16 h-16 bg-white border border-slate-200/60 rounded-xl overflow-hidden p-1.5 shadow-sm flex-shrink-0 flex items-center justify-center">
                          <img
                            src={group.image}
                            alt={group.name}
                            className="w-full h-full object-contain"
                          />
                        </div>

                        <div className="min-w-0 text-left">
                          <Link
                            to={mainProductUrl}
                            className="font-black text-slate-800 text-sm lg:text-base uppercase truncate italic hover:text-[#006c49] block transition-colors"
                          >
                            {group.name}
                          </Link>
                          <p className="text-[11px] text-slate-400 mt-1 font-bold">
                            Tổng phân loại trong túi:{" "}
                            <span className="text-[#006c49] font-black bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 shadow-inner">
                              {group.totalQuantity} mục
                            </span>
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleExpandProduct(group.productId)}
                        className={`flex items-center gap-2 px-3.5 py-2 border rounded-lg transition-all text-xs font-black active:scale-95 shadow-sm ${
                          isExpanded
                            ? "bg-[#006c49] border-[#006c49] text-white hover:bg-[#005436]"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {isExpanded ? (
                          <>
                            Thu gọn <ChevronUp size={13} strokeWidth={3} />
                          </>
                        ) : (
                          <>
                            Xem phân loại ({group.subVariants.length}){" "}
                            <ChevronDown size={13} strokeWidth={3} />
                          </>
                        )}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="divide-y divide-slate-100 bg-white border-t border-slate-50/50">
                        {group.subVariants.map((subItem) => {
                          const isSubSelected = selectedItems.includes(
                            subItem.variantId,
                          );
                          const subMaxStock = getMaxStock(subItem); // 🌟 Tương tự lấy giới hạn kho

                          return (
                            <div
                              key={subItem.variantId}
                              className={`flex items-center gap-4 p-4 transition-all duration-200 border-l-4 ${isSubSelected ? "bg-emerald-50/5 border-l-[#006c49]" : "border-l-transparent"}`}
                            >
                              <input
                                type="checkbox"
                                checked={isSubSelected}
                                onChange={() =>
                                  toggleSelectItem(subItem.variantId)
                                }
                                className="w-4 h-4 rounded accent-[#006c49] cursor-pointer"
                              />

                              <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-xl overflow-hidden p-1 flex-shrink-0 flex items-center justify-center shadow-sm">
                                <img
                                  src={subItem.image}
                                  alt={subItem.variantName}
                                  className="w-full h-full object-contain"
                                />
                              </div>

                              <div className="flex-1 min-w-0 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
                                <div className="min-w-0 flex-1 text-left">
                                  {subItem.thuoc_tinh_hop_nhat &&
                                  subItem.thuoc_tinh_hop_nhat.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5">
                                      {subItem.thuoc_tinh_hop_nhat.map(
                                        (attr, idx) => (
                                          <span
                                            key={idx}
                                            className="inline-flex items-center text-[9px] font-black tracking-wide text-emerald-800 bg-emerald-50/80 px-2 py-0.5 rounded border border-emerald-100/40 shadow-inner"
                                          >
                                            {attr.ten_thuoc_tinh}:{" "}
                                            <span className="text-slate-600 ml-1 font-bold">
                                              {attr.gia_tri}
                                            </span>
                                          </span>
                                        ),
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-xs font-bold text-slate-500">
                                      {subItem.variantName}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-4 flex-shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                                  <div className="font-black text-[#006c49] text-xs lg:text-sm italic tracking-tight min-w-[70px] text-right">
                                    {subItem.price.toLocaleString()}đ
                                  </div>

                                  <div className="flex items-center bg-slate-100 border border-slate-200/60 rounded-lg p-0.5 shadow-inner flex-shrink-0">
                                    <button
                                      onClick={() =>
                                        handleUpdateQuantity(subItem, "minus")
                                      }
                                      disabled={(subItem.quantity || 1) <= 1}
                                      className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-white rounded transition-all disabled:opacity-30"
                                    >
                                      <Minus size={10} strokeWidth={3} />
                                    </button>
                                    <span className="w-8 text-center font-black text-slate-800 text-xs">
                                      {subItem.quantity || 1}
                                    </span>
                                    
                                    <button
                                      onClick={() =>
                                        handleUpdateQuantity(subItem, "plus")
                                      }
                                      disabled={(subItem.quantity || 1) >= subMaxStock}
                                      className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-white rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                      <Plus size={10} strokeWidth={3} />
                                    </button>
                                  </div>

                                  <button
                                    onClick={() =>
                                      removeFromCart(subItem.variantId)
                                    }
                                    className="text-slate-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-xl transition-all flex-shrink-0"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-4 lg:sticky lg:top-24">
            <div className="bg-white border border-slate-100 rounded-2xl p-6 lg:p-8 shadow-2xl shadow-slate-200/60 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-full pointer-events-none"></div>

              <h2 className="text-sm font-black text-slate-800 uppercase italic tracking-wider border-b border-slate-100 pb-4 flex items-center gap-2.5">
                <CreditCard size={16} className="text-[#006c49]" /> Tóm tắt hóa
                đơn
              </h2>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs lg:text-sm font-bold text-slate-500">
                  <span>Mục phân loại đã chọn</span>
                  <span className="font-mono font-black text-[#006c49] bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded text-xs shadow-sm">
                    {selectedItems.length} loại
                  </span>
                </div>

                <div className="flex justify-between items-baseline pt-4 border-t border-dashed border-slate-200">
                  <span className="font-black text-slate-800 uppercase italic text-xs lg:text-sm">
                    Tổng tiền tạm tính
                  </span>
                  <span
                    className="text-xl lg:text-2xl font-black text-[#006c49] tracking-tighter"
                    translate="no"
                  >
                    {totalPrice.toLocaleString()}đ
                  </span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={selectedItems.length === 0}
                className="w-full bg-gradient-to-r from-[#ffc800] to-[#ffb800] hover:from-[#ffb800] hover:to-[#e6a600] text-slate-900 py-3.5 rounded-xl font-black uppercase tracking-widest transition-all shadow-lg shadow-amber-500/10 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Thanh toán ngay ({selectedItems.length})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}