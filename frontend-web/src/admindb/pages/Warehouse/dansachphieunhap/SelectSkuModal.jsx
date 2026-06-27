import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { 
  X, 
  Search, 
  Layers, 
  Tag, 
  Package, 
  ChevronRight, 
  Loader2, 
  ShoppingBag,
  Grid
} from "lucide-react";

export default function SelectSkuModal({ isOpen, onClose, onSelect }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  // Trạng thái lưu trữ các biến thể (SKUs) đã tải của từng sản phẩm để tránh gọi lại API nhiều lần
  const [variantsCache, setVariantsMap] = useState({});
  const [expandedProductId, setExpandedProductId] = useState(null);
  const [loadingVariants, setLoadingVariants] = useState(false);

  // 🌟 Tải danh sách sản phẩm tổng quát khi mở Modal
  useEffect(() => {
    if (!isOpen) return;

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const apiUrl = import.meta.env.VITE_API_PRODUCT_URL || "http://localhost:5002";
        // Lấy danh sách sản phẩm (Mặc định trang 1, tải 50 sản phẩm đầu tiên)
        const response = await axios.get(`${apiUrl}/api/products?page=1&limit=50`);
        
        const data = response.data?.products || response.data || [];
        setProducts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("❌ Lỗi tải danh sách sản phẩm cho modal chọn SKU:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [isOpen]);

  // 🌟 Hàm tải động các biến thể (SKUs) của sản phẩm khi người dùng nhấn mở rộng
  const handleToggleProduct = async (productId) => {
    if (expandedProductId === productId) {
      setExpandedProductId(null);
      return;
    }

    setExpandedProductId(productId);

    // Nếu biến thể sản phẩm này đã được lưu ở cache thì không cần gọi API nữa
    if (variantsCache[productId]) return;

    setLoadingVariants(true);
    try {
      const apiUrl = import.meta.env.VITE_API_PRODUCT_URL || "http://localhost:5002";
      const response = await axios.get(`${apiUrl}/api/products/${productId}`);
      
      const detailedData = response.data || {};
      const variants = detailedData.bien_the || [];

      // Định dạng lại các biến thể theo chuẩn của phiếu nhập kho
      const formattedVariants = variants.map(v => {
        // Gom các thuộc tính EAV của biến thể làm thông tin gợi ý (Vị, Dung tích...)
        const specText = Object.entries(v.thuoc_tinh || {})
          .map(([k, val]) => `${k}: ${val}`)
          .join(", ");

        return {
          sku: v.sku || `SKU-${v.ma_bien_the}`,
          name: `${detailedData.ten_san_pham} ${specText ? `(${specText})` : ""}`,
          category: detailedData.ten_danh_muc_con || "SẢN PHẨM",
          unit: detailedData.unit || v.ten_don_vi || "Gói",
          ratio: `1 ${v.ten_don_vi || "Thùng"} = 1`, // Fallback hệ số quy đổi mặc định
          price: v.gia_ban_le || 0,
          icon: detailedData.icon || "📦"
        };
      });

      setVariantsMap(prev => ({
        ...prev,
        [productId]: formattedVariants
      }));
    } catch (error) {
      console.error(`❌ Lỗi tải danh sách biến thể sản phẩm ${productId}:`, error);
    } finally {
      setLoadingVariants(false);
    }
  };

  // 🌟 Trích xuất các danh mục độc bản có trong danh sách sản phẩm hiện tại
  const categoriesList = useMemo(() => {
    const categories = new Set();
    products.forEach(p => {
      if (p.ten_danh_muc_con) categories.add(p.ten_danh_muc_con);
    });
    return Array.from(categories);
  }, [products]);

  // Lọc sản phẩm theo tìm kiếm và danh mục đã chọn
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.ten_san_pham.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.ma_san_pham.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = selectedCategory === "all" || p.ten_danh_muc_con === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-4xl h-[640px] rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-slideUp text-left">
        
        {/* MODAL HEADER */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <Grid size={20} />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-800">Chọn biến thể SKU thực tế</h3>
              <p className="text-[11px] text-slate-400 font-medium">Bấm vào sản phẩm cha để lựa chọn các phiên bản đóng gói tương ứng</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* MODAL SEARCH & FILTERS */}
        <div className="p-4 border-b border-slate-100 bg-white flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Search size={16} />
            </span>
            <input 
              type="text" 
              placeholder="Tìm kiếm nhanh tên sản phẩm hoặc mã sản phẩm gốc..." 
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
            {categoriesList.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-slate-50/50">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-2 py-20 text-slate-400">
              <Loader2 className="animate-spin text-emerald-600" size={32} />
              <span className="text-xs font-bold">Đang truy xuất kho dữ liệu EAV...</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20 text-slate-400 font-medium text-xs">
              <ShoppingBag className="mx-auto text-slate-300 mb-2" size={36} />
              Không tìm thấy sản phẩm nào khớp với bộ lọc tìm kiếm.
            </div>
          ) : (
            filteredProducts.map((product) => {
              const isExpanded = expandedProductId === product.ma_san_pham;
              const productVariants = variantsCache[product.ma_san_pham] || [];

              return (
                <div 
                  key={product.ma_san_pham} 
                  className={`bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-200 ${
                    isExpanded ? "ring-2 ring-emerald-500/20 border-emerald-500/30" : "hover:border-slate-200"
                  }`}
                >
                  {/* Dòng tóm tắt sản phẩm cha */}
                  <div 
                    onClick={() => handleToggleProduct(product.ma_san_pham)}
                    className="p-4 flex items-center justify-between cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-xl shrink-0">
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
                        <h4 className="text-xs font-bold text-slate-800">{product.ten_san_pham}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-slate-400 font-mono">{product.ma_san_pham}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{product.ten_danh_muc_con}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                        Mở rộng SKUs
                      </span>
                      <ChevronRight 
                        size={16} 
                        className={`text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-90 text-emerald-600" : ""}`} 
                      />
                    </div>
                  </div>

                  {/* Vùng hiển thị danh sách SKU biến thể con */}
                  {isExpanded && (
                    <div className="bg-slate-50/50 border-t border-slate-100 px-4 py-3 divide-y divide-slate-100">
                      {loadingVariants ? (
                        <div className="flex items-center justify-center gap-2 py-6 text-slate-400 text-xs font-semibold">
                          <Loader2 className="animate-spin text-emerald-600" size={16} />
                          <span>Đang tải ma trận SKU...</span>
                        </div>
                      ) : productVariants.length === 0 ? (
                        <div className="py-6 text-center text-slate-400 text-[11px] font-medium">
                          ⚠️ Sản phẩm này hiện tại chưa gán biến thể SKU nào.
                        </div>
                      ) : (
                        productVariants.map((v) => (
                          <div key={v.sku} className="py-2.5 flex items-center justify-between hover:bg-slate-100/40 rounded-lg px-2 transition-colors">
                            <div>
                              <p className="text-xs font-bold text-slate-700">{v.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-amber-700 font-mono font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">{v.sku}</span>
                                <span className="text-[10px] text-slate-400 font-semibold">Đơn vị: {v.unit}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Giá niêm yết</p>
                                <p className="text-xs font-mono font-extrabold text-slate-700">{new Intl.NumberFormat("vi-VN").format(v.price)} đ</p>
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
          <span className="text-slate-400 font-semibold">Tìm thấy {filteredProducts.length} sản phẩm tương thích</span>
          <button 
            type="button" 
            onClick={onClose} 
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl font-bold text-slate-600 transition cursor-pointer"
          >
            Đóng cửa sổ
          </button>
        </div>

      </div>
    </div>
  );
}