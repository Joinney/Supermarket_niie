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
} from "lucide-react";

export default function SelectSkuModal({ isOpen, onClose, onSelect }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [variantsCache, setVariantsMap] = useState({});
  const [expandedProductId, setExpandedProductId] = useState(null);
  const [loadingVariants, setLoadingVariants] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await productApi.get("/products?page=1&limit=50");
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
        // 🌟 ƯU TIÊN 1: Lấy Tên Biến Thể cụ thể từ Database (VD: Đường Biên Hòa 800g)
        let displayName = v.ten_bien_the;

        // 🌟 DỰ PHÒNG: Nếu ten_bien_the rỗng hoặc null, tự động nối (Tên gốc + Thuộc tính)
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
          name: displayName, // Đã fix logic hiển thị tên
          category: detailedData.ten_danh_muc_con || "SẢN PHẨM",
          unit: v.ten_don_vi || "Gói",
          price: v.gia_ban_le || 0,
          icon: "📦",
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

  const categoriesList = useMemo(() => {
    const categories = new Set();
    products.forEach((p) => {
      if (p.ten_danh_muc_con && p.ten_danh_muc_con.trim() !== "") {
        categories.add(p.ten_danh_muc_con);
      }
    });
    return Array.from(categories);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const safeName = (p.ten_san_pham || "").toLowerCase();
      const safeCode = (p.ma_san_pham || "").toLowerCase();
      const query = searchQuery.toLowerCase();

      const matchSearch = safeName.includes(query) || safeCode.includes(query);
      const matchCategory =
        selectedCategory === "all" || p.ten_danh_muc_con === selectedCategory;

      return matchSearch && matchCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-4xl h-[640px] rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden text-left">
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
              <p className="text-[11px] text-slate-400 font-medium">
                Bấm chọn trực tiếp sản phẩm đơn hoặc mở rộng sản phẩm có nhiều
                biến thể
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
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none cursor-pointer focus:border-emerald-500"
          >
            <option value="all">📁 Tất cả danh mục</option>
            {categoriesList.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-slate-50/50">
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

              return (
                <div
                  key={product.ma_san_pham}
                  className={`bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-200 ${
                    isExpanded
                      ? "ring-2 ring-emerald-500/20 border-emerald-500/30"
                      : "hover:border-slate-200"
                  }`}
                >
                  {/* Dòng hiển thị sản phẩm cha */}
                  <div
                    onClick={() => handleToggleProduct(product)}
                    className={`p-4 flex items-center justify-between select-none ${product.co_bien_the ? "cursor-pointer hover:bg-slate-50" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-xl shrink-0 border border-emerald-100">
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
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                            {product.ten_danh_muc_con || "Khác"}
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
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                            Mở rộng SKUs
                          </span>
                          <ChevronRight
                            size={16}
                            className={`text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-90 text-emerald-600" : ""}`}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-4">
                          <div className="text-right hidden sm:block">
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                              Giá bán
                            </p>
                            <p className="text-xs font-mono font-extrabold text-slate-700">
                              {new Intl.NumberFormat("vi-VN").format(
                                product.gia_ban || 0,
                              )}{" "}
                              đ
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelect({
                                sku: product.ma_san_pham,
                                name: product.ten_san_pham,
                                category:
                                  product.ten_danh_muc_con || "SẢN PHẨM",
                                unit: product.unit || "Cái",
                                price: product.gia_ban || 0,
                                icon: "📦",
                              });
                              onClose();
                            }}
                            className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm hover:bg-emerald-700 transition cursor-pointer"
                          >
                            Thêm vào phiếu
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
                        productVariants.map((v) => (
                          <div
                            key={v.sku}
                            className="py-2.5 flex items-center justify-between hover:bg-white rounded-lg px-2 transition-colors"
                          >
                            <div>
                              {/* 🌟 ĐÃ HIỂN THỊ TÊN BIẾN THỂ RÕ RÀNG Ở ĐÂY */}
                              <p className="text-xs font-bold text-slate-700">
                                {v.name}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-amber-700 font-mono font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                                  {v.sku}
                                </span>
                                <span className="text-[10px] text-slate-400 font-semibold">
                                  Đơn vị: {v.unit}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right hidden sm:block">
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                  Giá niêm yết
                                </p>
                                <p className="text-xs font-mono font-extrabold text-slate-700">
                                  {new Intl.NumberFormat("vi-VN").format(
                                    v.price,
                                  )}{" "}
                                  đ
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  onSelect(v);
                                  onClose();
                                }}
                                className="bg-[#006c49] text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm hover:bg-[#005137] transition cursor-pointer"
                              >
                                Thêm vào phiếu
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-semibold">
            Tìm thấy {filteredProducts.length} mặt hàng tương thích
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl font-bold text-slate-600 transition cursor-pointer shadow-sm"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
}
