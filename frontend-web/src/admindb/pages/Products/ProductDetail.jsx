import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Package, Key, Tag, 
  Image as ImageIcon, Info, Bookmark, Save, Check, Calendar, Layers 
} from "lucide-react";
import axios from "axios";

export default function AdminProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 1. State điều khiển Tab chính ('info' | 'variants' | 'notes')
  const [activeTab, setActiveTab] = useState("info");

  // 2. State lưu object ảnh xem ở Tab 1
  const [activeMediaObj, setActiveMediaObj] = useState(null);

  // 3. State Ghi chú nội bộ
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_PRODUCT_URL || "http://localhost:5002";
        const response = await axios.get(`${apiUrl}/api/products/${id}`);
        
        if (response.data) {
          const data = response.data;
          setProduct(data);
          
          const mainMedia = data.media?.find(m => m.la_anh_chinh) || data.media?.[0] || null;
          setActiveMediaObj(mainMedia);

          const savedNote = localStorage.getItem(`demi_note_${id}`);
          if (savedNote) setNoteText(savedNote);
        }
      } catch (err) {
        setError("Không tìm thấy thông tin sản phẩm hoặc ID không tồn tại!");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const handleSaveNote = () => {
    setSavingNote(true);
    setTimeout(() => {
      localStorage.setItem(`demi_note_${id}`, noteText);
      setSavingNote(false);
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 2500);
    }, 500);
  };

  const formatPrice = (val) => Number(val || 0).toLocaleString("vi-VN") + " đ";

  const getVariantNameByCode = (code) => {
    if (!code) return null;
    const found = product?.bien_the?.find(b => b.ma_bien_the === code);
    return found ? (found.ten_bien_the || code) : code;
  };

  // Tra cứu ảnh riêng của từng biến thể
  const getMediaOfVariant = (variantCode) => {
    if (!product?.media) return [];
    return product.media.filter(m => m.ma_bien_the === variantCode);
  };

  // Helper render tem thuộc tính xanh lục
  const renderAttributes = (attr) => {
    if (!attr) return <span className="text-gray-300">-</span>;
    let parsed = attr;
    if (typeof attr === "string") {
      try { parsed = JSON.parse(attr); } catch(e) { return <span>{attr}</span>; }
    }
    if (typeof parsed === "object" && parsed !== null) {
      return (
        <div className="flex flex-wrap gap-1.5 mt-0.5">
          {Object.entries(parsed).map(([k, v], i) => (
            <span key={i} className="bg-emerald-50 text-[#006c49] font-extrabold px-2 py-0.5 rounded-md text-[11px] border border-emerald-200">
              {k}: {v}
            </span>
          ))}
        </div>
      );
    }
    return <span>{String(attr)}</span>;
  };

  if (loading) {
    return (
      <div className="flex-1 bg-[#f8f9fa] min-h-screen flex items-center justify-center font-sans">
        <div className="flex items-center gap-2 text-[#006c49] font-bold text-sm animate-pulse">
          <span className="w-2.5 h-2.5 rounded-full bg-[#006c49]"></span> Đang nạp toàn bộ dữ liệu...
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex-1 bg-[#f8f9fa] p-8 font-sans text-left">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-black mb-6">
          <ArrowLeft size={16} /> Quay lại danh sách
        </button>
        <div className="p-6 bg-red-50 text-red-600 rounded-2xl border border-red-200 text-xs font-bold">{error}</div>
      </div>
    );
  }

  const tabNavigation = [
    { id: "info", label: "Thông tin & Thư viện", icon: Info },
    { id: "variants", label: "SKU & Phiên bản", icon: Package, count: product.bien_the?.length || 0 },
    { id: "notes", label: "Ghi chú nội bộ", icon: Bookmark },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex-1 bg-[#f8f9fa] min-h-screen p-6 md:p-8 font-sans text-left"
    >
      {/* TOP BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200 mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin/products/Danhsachsanpham')}
            className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-slate-600 hover:bg-[#006c49] hover:text-white hover:border-[#006c49] transition shadow-sm shrink-0"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{product.ten_san_pham}</h1>
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-black bg-emerald-100 text-[#006c49]">
                #{product.ma_san_pham}
              </span>
            </div>
            <p className="text-xs font-bold text-gray-400 mt-0.5">
              Danh mục: <span className="text-[#006c49]">{product.ten_danh_muc_con}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 p-1.5 bg-slate-200/70 rounded-2xl self-start sm:self-auto overflow-x-auto max-w-full">
          {tabNavigation.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-extrabold text-xs transition-all shrink-0 ${
                  isActive ? "bg-[#006c49] text-white shadow-md" : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                }`}
              >
                <Icon size={15} />
                <span>{t.label}</span>
                {t.count !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${isActive ? "bg-white/20 text-white" : "bg-slate-300 text-slate-700"}`}>
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-6xl">
        
        {/* ==================== TAB 1: THÔNG TIN & THƯ VIỆN ==================== */}
        {activeTab === "info" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-3xl border border-gray-200/80 p-3 shadow-sm aspect-square flex items-center justify-center overflow-hidden bg-slate-50 relative">
                {activeMediaObj?.duong_dan_url ? (
                  <>
                    <img src={activeMediaObj.duong_dan_url} alt="preview" className="w-full h-full object-cover rounded-2xl" />
                    {activeMediaObj.ma_bien_the && (
                      <span className="absolute bottom-5 right-5 bg-slate-900/85 backdrop-blur-md text-amber-300 border border-amber-400/40 px-3 py-1.5 rounded-xl text-xs font-black shadow-lg">
                        🏷️ Biến thể: {getVariantNameByCode(activeMediaObj.ma_bien_the)}
                      </span>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center text-gray-300">
                    <ImageIcon size={48} />
                    <span className="text-xs font-bold mt-1">Chưa có file media</span>
                  </div>
                )}
              </div>

              {product.media && product.media.length > 0 && (
                <div className="flex gap-2.5 overflow-x-auto pb-2 custom-scrollbar">
                  {product.media.map((imgObj) => {
                    const isCurrent = activeMediaObj?.ma_media === imgObj.ma_media;
                    return (
                      <button
                        key={imgObj.ma_media}
                        onClick={() => setActiveMediaObj(imgObj)}
                        className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all relative ${
                          isCurrent ? "border-[#006c49] scale-105 shadow-md" : "border-gray-200 opacity-60 hover:opacity-100"
                        }`}
                      >
                        <img src={imgObj.duong_dan_url} alt="thumb" className="w-full h-full object-cover" />
                        {imgObj.ma_bien_the && (
                          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 ring-1 ring-black"></span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm space-y-4">
                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-100 text-xs">
                  <div>
                    <span className="font-bold text-gray-400 uppercase block">Khởi tạo DB:</span>
                    <span className="font-black text-slate-800 mt-0.5 block"> 
                      {new Date(product.ngay_tao).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-400 uppercase block">Cập nhật cuối:</span>
                    <span className="font-black text-slate-800 mt-0.5 block">
                      {product.ngay_cap_nhat ? new Date(product.ngay_cap_nhat).toLocaleDateString("vi-VN") : "Chưa sửa đổi"}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Bài viết mô tả (`mo_ta`)</h3>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-2xl border border-slate-100 max-h-60 overflow-y-auto custom-scrollbar">
                    {product.mo_ta || "Sản phẩm chưa có nội dung mô tả chi tiết."}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ==================== TAB 2: SKU VÀ PHIÊN BẢN (TRẢI PHẲNG MẶT TIỀN) ==================== */}
        {activeTab === "variants" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Layers size={16} className="text-[#006c49]" /> Bảng tổng hợp thuộc tính các phiên bản ({product.bien_the?.length || 0})
              </h3>
              <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full font-mono">
                Flat Layout
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                    <th className="py-3 px-3 w-14 text-center">Hình ảnh</th>
                    <th className="py-3 px-3">Mã CSDL</th>
                    <th className="py-3 px-3">Phiên bản & SKU</th>
                    <th className="py-3 px-3 font-mono">Giá niêm yết</th>
                    <th className="py-3 px-3">Đơn vị</th>
                    <th className="py-3 px-3">Thuộc tính cấu hình</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs font-bold text-gray-700">
                  {product.bien_the && product.bien_the.length > 0 ? (
                    product.bien_the.map((bt, idx) => {
                      // Tìm ảnh riêng của biến thể này
                      const varMediaObj = getMediaOfVariant(bt.ma_bien_the)[0];

                      return (
                        <tr key={bt.ma_bien_the || idx} className="hover:bg-emerald-50/40 transition">
                          
                          {/* CỘT 1: HÌNH ẢNH BIẾN THỂ */}
                          <td className="py-3.5 px-3 text-center">
                            {varMediaObj?.duong_dan_url ? (
                              <img 
                                src={varMediaObj.duong_dan_url} 
                                alt="var" 
                                className="w-10 h-10 rounded-xl object-cover border border-emerald-300 shadow-2xs cursor-pointer hover:scale-110 transition mx-auto"
                                onClick={() => { setActiveTab("info"); setActiveMediaObj(varMediaObj); }}
                                title="Nhấp xem phóng to ở Thư viện"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-slate-100 text-gray-300 flex items-center justify-center mx-auto text-[10px]">
                                -
                              </div>
                            )}
                          </td>

                          {/* CỘT 2: MÃ BIẾN THỂ */}
                          <td className="py-3.5 px-3 font-mono font-black text-[#006c49]">
                            {bt.ma_bien_the}
                          </td>

                          {/* CỘT 3: TÊN & SKU (Gộp chung để tiết kiệm diện tích) */}
                          <td className="py-3.5 px-3">
                            <p className="text-slate-900 font-extrabold">{bt.ten_bien_the || "Mặc định"}</p>
                            <p className="text-[10px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60 w-fit mt-0.5 font-black">
                              SKU: {bt.sku || "N/A"}
                            </p>
                          </td>

                          {/* CỘT 4: GIÁ */}
                          <td className="py-3.5 px-3 text-slate-900 font-black font-mono">
                            {formatPrice(bt.gia_ban_le)}
                          </td>

                          {/* CỘT 5: ĐƠN VỊ TÍNH */}
                          <td className="py-3.5 px-3 text-gray-500 font-semibold">
                            {bt.ten_don_vi || "Hộp"}
                          </td>

                          {/* CỘT 6: THUỘC TÍNH (Hiển thị trực tiếp) */}
                          <td className="py-3.5 px-3 max-w-[280px]">
                            {renderAttributes(bt.thuoc_tinh)}
                          </td>

                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-amber-600 bg-amber-50 font-bold rounded-2xl border border-amber-200">
                        ⚠️ Sản phẩm này chưa có biến thể nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* ==================== TAB 3: GHI CHÚ NỘI BỘ ==================== */}
        {activeTab === "notes" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm max-w-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Bookmark size={16} className="text-[#006c49]" /> Ghi chú lưu ý kiểm hàng & nhà cung cấp
              </span>
              <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Internal Only
              </span>
            </div>

            {noteSaved && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-black flex items-center gap-1.5">
                <Check size={16} /> Đã lưu thành công ghi chú nội bộ!
              </div>
            )}

            <textarea 
              rows={7}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Nhập các lưu ý nội bộ về lô hàng, hạn sử dụng..."
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#006c49] outline-none transition"
            />

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-gray-400 italic">
                * Ghi chú này chỉ lưu nội bộ, khách hàng không nhìn thấy.
              </span>
              <button
                onClick={handleSaveNote}
                disabled={savingNote}
                className="bg-[#006c49] hover:bg-[#004d34] text-white px-6 py-2.5 rounded-xl text-xs font-black shadow-sm transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
              >
                <Save size={14} /> {savingNote ? "Đang ghi..." : "Lưu ghi chú"}
              </button>
            </div>
          </motion.div>
        )}

      </div>
    </motion.div>
  );
}