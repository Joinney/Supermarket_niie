import React, { useState, useEffect, useMemo } from "react";
// 🌟 Sử dụng productApi (Cổng 5002) để lấy danh mục sản phẩm gốc
import { productApi } from "../../../../api/axios";

import {
  X,
  Search,
  ChevronRight,
  Loader2,
  ShoppingBag,
  Grid,
  CheckSquare,
  Square
} from "lucide-react";

// 🌟 ĐÃ SỬA: Đổi tên prop onSelect thành onSelectMultiple để đồng bộ với Form nhập kho
export default function SelectSkuModal({ isOpen, onClose, onSelectMultiple }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [selectedParent, setSelectedParent] = useState("all");
  const [selectedChild, setSelectedChild] = useState("all");

  const [variantsCache, setVariantsMap] = useState({});
  const [expandedProductId, setExpandedProductId] = useState(null);
  const [loadingVariants, setLoadingVariants] = useState(false);

  // 🌟 THÊM MỚI: State quản lý danh sách các sản phẩm đang được tích chọn (Sử dụng Map để dễ quản lý theo SKU)
  const [selectedItems, setSelectedItems] = useState(new Map());

  // Reset state chọn khi đóng Modal
  useEffect(() => {
    if (!isOpen) {
      setSelectedItems(new Map());
      setExpandedProductId(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await productApi.get("/products?page=1&limit=1000");
        const data = response.data?.products || response.data || [];
        setProducts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("❌ Lỗi tải danh sách sản phẩm:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [isOpen]);

  const handleToggleProduct = async (product) => {
    if (!product.co_bien_the) return;

    if (expandedProductId === product.ma_san_pham) {
      setExpandedProductId(null);
      return;
    }

    setExpandedProductId(product.ma_san_pham);

    if (variantsCache[product.ma_san_pham]) return;

    setLoadingVariants(true);
    try {
      const response = await productApi.get(`/products/${product.ma_san_pham}`);

      const detailedData = response.data || {};
      const variants = detailedData.bien_the || [];

      const formattedVariants = variants.map((v) => {
        let displayName = v.ten_bien_the;

        if (
          !displayName ||
          displayName.trim() === "" ||
          displayName.trim().toLowerCase() === "mặc định"
        ) {
          const specText = Object.entries(v.thuoc_tinh || {})
            .map(([k, val]) => `${k}: ${val}`)
            .join(", ");
          displayName = `${detailedData.ten_san_pham || "Sản phẩm"} ${specText ? `(${specText})` : ""}`;
        }

        return {
          sku: v.sku || `SKU-${v.ma_bien_the}`,
          name: displayName,
          category: detailedData.ten_danh_muc_con || "SẢN PHẨM",
          unit: v.ten_don_vi || "Gói",
          price: v.gia_ban_le || 0,
          icon: "📦",
          // 🌟 THÊM MỚI: Quét Tồn kho của biến thể
          stock: v.ton_kho || v.so_luong_ton || v.stock || 0 
        };
      });

      setVariantsMap((prev) => ({
        ...prev,
        [product.ma_san_pham]: formattedVariants,
      }));
    } catch (error) {
      console.error(
        `❌ Lỗi tải danh sách biến thể của sản phẩm ${product.ma_san_pham}:`,
        error,
      );
    } finally {
      setLoadingVariants(false);
    }
  };

  // 🌟 THÊM MỚI: Hàm xử lý tích chọn / bỏ chọn
  const toggleSelection = (e, item, isVariant = false) => {
    e.stopPropagation(); // Tránh kích hoạt sự kiện mở rộng của dòng cha
    const skuKey = item.sku || item.ma_san_pham;

    setSelectedItems((prev) => {
      const nextMap = new Map(prev);
      if (nextMap.has(skuKey)) {
        nextMap.delete(skuKey); // Đã chọn -> Bỏ chọn
      } else {
        // Chưa chọn -> Thêm vào Map với form data chuẩn
        if (isVariant) {
          nextMap.set(skuKey, item);
        } else {
          nextMap.set(skuKey, {
            sku: item.ma_san_pham,
            name: item.ten_san_pham,
            category: item.ten_danh_muc_con || "SẢN PHẨM",
            unit: item.unit || item.ma_don_vi_co_so || "Cái",
            price: item.gia_ban || item.gia_von || 0,
            icon: "📦",
            stock: item.ton_kho || item.so_luong_ton || item.stock || 0
          });
        }
      }
      return nextMap;
    });
  };

  const categoryTree = useMemo(() => {
    const tree = {};
    products.forEach((p) => {
      const parentName = p.ten_danh_muc_cha && p.ten_danh_muc_cha.trim() !== "" ? p.ten_danh_muc_cha : "Chưa phân loại";
      const childName = p.ten_danh_muc_con && p.ten_danh_muc_con.trim() !== "" ? p.ten_danh_muc_con : "Khác";

      if (!tree[parentName]) tree[parentName] = new Set();
      tree[parentName].add(childName);
    });

    const formattedTree = {};
    Object.keys(tree).sort().forEach(key => {
      formattedTree[key] = Array.from(tree[key]).sort();
    });
    
    return formattedTree;
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const safeName = (p.ten_san_pham || "").toLowerCase();
      const safeCode = (p.ma_san_pham || "").toLowerCase();
      const query = searchQuery.toLowerCase();

      const matchSearch = safeName.includes(query) || safeCode.includes(query);

      const pCha = p.ten_danh_muc_cha && p.ten_danh_muc_cha.trim() !== "" ? p.ten_danh_muc_cha : "Chưa phân loại";
      const pCon = p.ten_danh_muc_con && p.ten_danh_muc_con.trim() !== "" ? p.ten_danh_muc_con : "Khác";

      const matchParent = selectedParent === "all" || pCha === selectedParent;
      const matchChild = selectedChild === "all" || pCon === selectedChild;

      return matchSearch && matchParent && matchChild;
    });
  }, [products, searchQuery, selectedParent, selectedChild]);

  const handleParentChange = (e) => {
    setSelectedParent(e.target.value);
    setSelectedChild("all");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-5xl h-[700px] rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden text-left">
        
        {/* MODAL HEADER */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <Grid size={20} />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Chọn hàng hóa nhập kho
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Tích chọn nhiều mặt hàng cùng lúc để thêm vào phiếu. Chú ý số lượng Tồn Kho thực tế.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* MODAL FILTERS */}
        <div className="p-4 border-b border-slate-100 bg-white flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Tìm kiếm nhanh tên hoặc mã gốc sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:border-emerald-500 transition"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={selectedParent}
              onChange={handleParentChange}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none cursor-pointer focus:border-emerald-500 min-w-[160px]"
            >
              <option value="all">📁 Tất cả DM Cha</option>
              {Object.keys(categoryTree).map((parentCat) => (
                <option key={parentCat} value={parentCat}>
                  {parentCat}
                </option>
              ))}
            </select>

            <select
              value={selectedChild}
              onChange={(e) => setSelectedChild(e.target.value)}
              disabled={selectedParent === "all"}
              className={`px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none cursor-pointer focus:border-emerald-500 min-w-[160px] ${selectedParent === "all" ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <option value="all">📂 Tất cả DM Con</option>
              {selectedParent !== "all" && categoryTree[selectedParent]?.map((childCat) => (
                <option key={childCat} value={childCat}>
                  - {childCat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50/50">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-2 py-20 text-slate-400">
              <Loader2 className="animate-spin text-emerald-600" size={32} />
              <span className="text-xs font-bold">
                Đang kết nối hệ thống dữ liệu...
              </span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20 text-slate-400 font-medium text-xs">
              <ShoppingBag className="mx-auto text-slate-300 mb-2" size={36} />
              Không tìm thấy sản phẩm nào phù hợp.
            </div>
          ) : (
            filteredProducts.map((product) => {
              const isExpanded = expandedProductId === product.ma_san_pham;
              const productVariants = variantsCache[product.ma_san_pham] || [];
              const isSimpleProductSelected = !product.co_bien_the && selectedItems.has(product.ma_san_pham);

              return (
                <div
                  key={product.ma_san_pham}
                  className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all duration-200 ${
                    isExpanded
                      ? "ring-2 ring-emerald-500/20 border-emerald-500/30"
                      : isSimpleProductSelected 
                        ? "border-emerald-400 bg-emerald-50/20" 
                        : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {/* Dòng hiển thị sản phẩm cha */}
                  <div
                    onClick={() => {
                      if (product.co_bien_the) handleToggleProduct(product);
                      else toggleSelection({ stopPropagation: () => {} }, product, false);
                    }}
                    className={`p-4 flex items-center justify-between select-none ${product.co_bien_the || !isSimpleProductSelected ? "cursor-pointer hover:bg-slate-50" : "cursor-pointer"}`}
                  >
                    <div className="flex items-center gap-3">
                      {/* 🌟 CHECKBOX CHO SẢN PHẨM ĐƠN */}
                      {!product.co_bien_the && (
                        <div 
                          className="mr-1 text-slate-400 cursor-pointer"
                          onClick={(e) => toggleSelection(e, product, false)}
                        >
                          {isSimpleProductSelected ? (
                            <CheckSquare size={22} className="text-emerald-600" />
                          ) : (
                            <Square size={22} />
                          )}
                        </div>
                      )}

                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0 border ${isSimpleProductSelected ? "bg-white border-emerald-200" : "bg-emerald-50 border-emerald-100"}`}>
                        {product.hinh_anh_chinh ? (
                          <img
                            src={product.hinh_anh_chinh}
                            alt={product.ten_san_pham}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          "📦"
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">
                          {product.ten_san_pham || "Chưa có tên"}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-slate-400 font-mono">
                            {product.ma_san_pham}
                          </span>
                          
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 flex items-center gap-1">
                            {product.ten_danh_muc_cha || "Chưa phân loại"} <ChevronRight size={10} className="text-slate-300"/> {product.ten_danh_muc_con || "Khác"}
                          </span>

                          {!product.co_bien_the && (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100 uppercase">
                              Sản phẩm đơn
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
  {product.co_bien_the ? (
    <div className="flex items-center gap-6">
      {/* 🌟 THÊM MỚI: HIỂN THỊ TỔNG TỒN KHO CHO SẢN PHẨM CHA */}
      <div className="text-right hidden sm:block border-r border-slate-100 pr-5">
        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
          Tổng tồn kho
        </p>
        <p className="text-xs font-mono font-extrabold text-emerald-600">
          {product.tong_ton_kho || product.ton_kho || product.so_luong_ton || product.stock || product.stock_quantity || 0}
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors">
          Mở rộng SKUs
        </span>
        <ChevronRight
          size={16}
          className={`text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-90 text-emerald-600" : ""}`}
        />
      </div>
    </div>
  ) : (
    <div className="flex items-center gap-6">
                          {/* 🌟 HIỂN THỊ TỒN KHO CHO SẢN PHẨM ĐƠN */}
                          <div className="text-right hidden sm:block border-r border-slate-100 pr-5">
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                              Tồn kho
                            </p>
                            <p className="text-xs font-mono font-extrabold text-emerald-600">
                              {product.ton_kho || product.stock || product.stock_quantity || 0}
                            </p>
                          </div>
                          <div className="text-right hidden sm:block">
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                              Giá bán
                            </p>
                            <p className="text-xs font-mono font-extrabold text-slate-700">
                              {new Intl.NumberFormat("vi-VN").format(product.gia_ban || 0)} đ
                            </p>
                          </div>
                          
                          {/* 🌟 NÚT TOGGLE */}
                          <button
                            type="button"
                            onClick={(e) => toggleSelection(e, product, false)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm transition cursor-pointer min-w-[80px] text-center ${
                              isSimpleProductSelected 
                                ? "bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100" 
                                : "bg-emerald-600 text-white border border-emerald-600 hover:bg-emerald-700"
                            }`}
                          >
                            {isSimpleProductSelected ? "Bỏ chọn" : "Chọn"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Khu vực hiển thị danh sách biến thể con */}
                  {product.co_bien_the && isExpanded && (
                    <div className="bg-slate-50/80 border-t border-slate-100 px-4 py-3 divide-y divide-slate-100">
                      {loadingVariants ? (
                        <div className="flex items-center justify-center gap-2 py-4 text-slate-400 text-xs font-semibold">
                          <Loader2
                            className="animate-spin text-emerald-600"
                            size={14}
                          />
                          <span>Đang nạp ma trận biến thể...</span>
                        </div>
                      ) : productVariants.length === 0 ? (
                        <div className="py-4 text-center text-slate-400 text-[11px] font-medium">
                          ⚠️ Không có biến thể khả dụng trên hệ thống.
                        </div>
                      ) : (
                        productVariants.map((v) => {
                          const isVariantSelected = selectedItems.has(v.sku);

                          return (
                            <div
                              key={v.sku}
                              onClick={(e) => toggleSelection(e, v, true)}
                              className={`py-3 flex items-center justify-between rounded-lg px-3 transition-colors cursor-pointer mt-1 border ${
                                isVariantSelected 
                                  ? "bg-white border-emerald-300 shadow-sm" 
                                  : "border-transparent hover:bg-white hover:border-slate-200"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {/* 🌟 CHECKBOX CHO BIẾN THỂ */}
                                <div className="text-slate-400">
                                  {isVariantSelected ? (
                                    <CheckSquare size={20} className="text-emerald-600" />
                                  ) : (
                                    <Square size={20} />
                                  )}
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-700">
                                    {v.name}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] text-amber-700 font-mono font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                                      {v.sku}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                      Đơn vị: {v.unit}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-6">
                                {/* 🌟 HIỂN THỊ TỒN KHO BIẾN THỂ */}
                                <div className="text-right hidden sm:block border-r border-slate-200 pr-5">
                                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                    Tồn kho
                                  </p>
                                  <p className="text-xs font-mono font-extrabold text-emerald-600">
                                    {v.stock}
                                  </p>
                                </div>
                                <div className="text-right hidden sm:block">
                                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                    Giá bán
                                  </p>
                                  <p className="text-xs font-mono font-extrabold text-slate-700">
                                    {new Intl.NumberFormat("vi-VN").format(v.price)} đ
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => toggleSelection(e, v, true)}
                                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm transition min-w-[80px] text-center ${
                                    isVariantSelected 
                                      ? "bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100" 
                                      : "bg-white border border-slate-300 text-slate-600 hover:bg-slate-50"
                                  }`}
                                >
                                  {isVariantSelected ? "Bỏ chọn" : "Chọn"}
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* MODAL FOOTER - 🌟 ĐÃ CẬP NHẬT GIAO DIỆN XÁC NHẬN */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-slate-500 font-medium text-xs">
              Tìm thấy {filteredProducts.length} mặt hàng
            </span>
            {selectedItems.size > 0 && (
              <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                Đã tích chọn: {selectedItems.size} sản phẩm
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl font-bold text-slate-600 transition cursor-pointer text-xs"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              disabled={selectedItems.size === 0}
              onClick={() => {
                if (selectedItems.size > 0 && onSelectMultiple) {
                  onSelectMultiple(Array.from(selectedItems.values()));
                }
              }}
              className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-sm transition ${
                selectedItems.size > 0 
                  ? "bg-[#006c49] text-white hover:bg-[#005137] cursor-pointer" 
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              Xác nhận ({selectedItems.size})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}