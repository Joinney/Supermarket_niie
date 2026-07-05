import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Image as ImageIcon,
  Info,
  Bookmark,
  Save,
  Check,
  Layers,
  ChevronLeft,
  ChevronRight,
  Eye,
  Plus,
  Edit,
  Trash2,
  RotateCcw,
  UploadCloud,
  Link as LinkIcon,
  X,
  Loader2,
} from "lucide-react";
// 🌟 ĐỒNG BỘ: Sử dụng instance productApi trích xuất từ tệp cấu hình Interceptor của bạn
import { productApi } from "../../../../api/axios"; // <--- Hãy điều chỉnh đường dẫn thực tế đến file config Axios của bạn

export default function AdminProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const location = useLocation();
  const [activeTab, setActiveTab] = useState(
    location.state?.targetTab || "info",
  );
  const [activeMediaObj, setActiveMediaObj] = useState(null);

  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const variantsPerPage = 5;
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [newMediaFile, setNewMediaFile] = useState(null);
  const [newMediaUrl, setNewMediaUrl] = useState("");
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  const fetchDetail = useCallback(
    async (showLoading = true) => {
      if (showLoading) setLoading(true);
      try {
        // 🚀 TỐI ƯU: Sử dụng đường dẫn tương đối ngắn sạch qua productApi
        const response = await productApi.get(`/products/${id}?role=admin`);

        if (response.data) {
          const data = Array.isArray(response.data)
            ? response.data[0]
            : response.data;
          setProduct(data);

          const mainMedia =
            data?.media?.find((m) => m.la_anh_chinh) ||
            data?.media?.[0] ||
            null;
          if (!activeMediaObj) setActiveMediaObj(mainMedia);

          const savedNote = localStorage.getItem(`demi_note_${id}`);
          if (savedNote) setNoteText(savedNote);
        }
      } catch (err) {
        setError("Không tìm thấy thông tin sản phẩm hoặc ID không tồn tại!");
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [id, activeMediaObj],
  );

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

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
    const found = product?.bien_the?.find((b) => b.ma_bien_the === code);
    return found ? found.ten_bien_the || code : code;
  };

  const getMediaOfVariant = (variantCode) => {
    if (!product?.media) return [];
    return product.media.filter((m) => m.ma_bien_the === variantCode);
  };

  // --- LOGIC PHÂN TRANG BIẾN THỂ ---
  const variants = product?.bien_the || [];
  const totalVariants = variants.length;
  const totalPages = Math.ceil(totalVariants / variantsPerPage);
  const startIndex = (currentPage - 1) * variantsPerPage;
  const currentVariants = variants.slice(
    startIndex,
    startIndex + variantsPerPage,
  );

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  // HÀM XÓA 1 BIẾN THỂ
  const handleDeleteVariant = async (variantId, variantName) => {
    if (
      window.confirm(
        `⚠️ Bạn có chắc chắn muốn đưa SKU "${variantName}" vào lưu trữ?`,
      )
    ) {
      try {
        // 🚀 TỐI ƯU: Đồng bộ luồng xóa mềm qua productApi
        await productApi.delete(`/products/variants/${variantId}`);
        alert("✅ Đã lưu trữ biến thể thành công!");
        fetchDetail(false);
      } catch (err) {
        alert(
          "❌ Xóa thất bại: " + (err.response?.data?.message || err.message),
        );
      }
    }
  };

  // HÀM XÓA TẤT CẢ BIẾN THỂ
  const handleDeleteAllVariants = async () => {
    if (
      window.confirm(`🧨 NGUY HIỂM: Lưu trữ TOÀN BỘ biến thể của sản phẩm này?`)
    ) {
      try {
        // 🚀 TỐI ƯU: Đồng bộ qua productApi
        await productApi.delete(`/products/${product.ma_san_pham}/variants-all`);
        alert("✅ Đã lưu trữ toàn bộ biến thể thành công!");
        fetchDetail(false);
      } catch (err) {
        alert(
          "❌ Xóa thất bại: " + (err.response?.data?.message || err.message),
        );
      }
    }
  };

  // HÀM KHÔI PHỤC BIẾN THỂ
  const handleRestoreVariant = async (variantId, variantName) => {
    if (
      window.confirm(
        `🔄 Bạn muốn khôi phục lại phiên bản "${variantName}" để tiếp tục kinh doanh?`,
      )
    ) {
      try {
        // 🚀 TỐI ƯU: Đồng bộ qua productApi
        await productApi.put(`/products/variants/${variantId}/restore`);
        alert("✅ Đã khôi phục biến thể thành công!");
        fetchDetail(false);
      } catch (err) {
        alert(
          "❌ Khôi phục thất bại: " +
            (err.response?.data?.message || err.message),
        );
      }
    }
  };

  const handleHardDeleteVariant = async (variantId, variantName) => {
    if (
      window.confirm(
        `🧨 NGUY HIỂM: Bạn có CHẮC CHẮN muốn XÓA VĨNH VIỄN biến thể "${variantName}" khỏi Database không?\n\nHành động này KHÔNG THỂ HOÀN TÁC và sẽ xóa mọi dữ liệu liên quan!`,
      )
    ) {
      try {
        // 🚀 TỐI ƯU: Đồng bộ xóa cứng qua productApi
        await productApi.delete(`/products/variants/${variantId}/hard`);
        alert("✅ Đã xóa vĩnh viễn biến thể khỏi hệ thống!");
        fetchDetail(false);
      } catch (err) {
        alert(
          "❌ Xóa vĩnh viễn thất bại: " +
            (err.response?.data?.message || err.message),
        );
      }
    }
  };

  const activeVariantsForSummary = variants.filter(
    (v) => v.trang_thai !== false,
  );
  const totalActiveVariants = activeVariantsForSummary.length;
  const prices = activeVariantsForSummary.map((v) => Number(v.gia_ban_le || 0));
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const totalStock = activeVariantsForSummary.reduce(
    (sum, v) => sum + Number(v.ton_kho || v.so_luong_ton || 0),
    0,
  );

  const handleAddMedia = async () => {
    if (!newMediaFile && !newMediaUrl.trim()) {
      return alert("Vui lòng chọn ảnh từ máy tính hoặc dán URL!");
    }

    setIsUploadingMedia(true);
    try {
      let finalUrl = newMediaUrl.trim();

      if (newMediaFile) {
        const formData = new FormData();
        formData.append("image", newMediaFile);

        // 🚀 TỐI ƯU: Đồng bộ qua productApi
        const uploadRes = await productApi.post("/api/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        finalUrl = uploadRes.data.url;
      }

      // 🚀 TỐI ƯU: Đồng bộ qua productApi
      await productApi.post(`/products/${product.ma_san_pham}/media`, {
        duong_dan_url: finalUrl,
      });

      alert("✅ Đã thêm hình ảnh thành công!");
      setShowMediaModal(false);
      setNewMediaFile(null);
      setNewMediaUrl("");
      fetchDetail(false);
    } catch (err) {
      alert("❌ Lỗi: " + (err.response?.data?.message || err.message));
    } finally {
      setIsUploadingMedia(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full bg-[#fafafa] min-h-screen flex items-center justify-center font-sans">
        <div className="flex items-center gap-2 text-[#006c49] font-bold text-sm animate-pulse">
          <span className="w-2.5 h-2.5 rounded-full bg-[#006c49]"></span> Đang tải thông tin...
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="w-full bg-[#fafafa] p-1 font-sans text-left min-h-screen antialiased text-slate-700">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-black mb-6 cursor-pointer"
        >
          <ArrowLeft size={16} /> Quay lại danh sách
        </button>
        <div className="p-6 bg-red-50 text-red-600 rounded-2xl border border-red-200 text-xs font-bold">
          {error}
        </div>
      </div>
    );
  }

  const tabNavigation = [
    { id: "info", label: "Thông tin sản phẩm", icon: Info },
    { id: "variants", label: "SKU & Biến thể", icon: Layers },
    { id: "notes", label: "Ghi chú", icon: Bookmark },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="w-full min-h-screen bg-[#fafafa] font-sans text-left text-slate-700 selection:bg-emerald-100 p-1 antialiased"
    >
      {/* ================= HEADER BAR ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Chi tiết sản phẩm
          </h1>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mt-1">
            <span>Dashboard</span>
            <span>❯</span>
            <span>Sản phẩm</span>
            <span>❯</span>
            <span className="text-[#006c49] font-bold">Chi tiết sản phẩm</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer bg-white shadow-2xs"
          >
            <ArrowLeft size={14} /> Quay về
          </button>
          <Link
            to={`/admin/products/edit/${product.ma_san_pham}`}
            className="flex items-center justify-center gap-2 bg-[#006c49] hover:bg-[#005438] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition transform active:scale-98 cursor-pointer"
          >
            <Edit size={14} /> Chỉnh sửa
          </Link>
        </div>
      </div>

      {/* ================= MAIN CONTAINER ================= */}
      <div className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm p-5 md:p-6 relative">
        
        {/* ================= TAB NAVIGATION ================= */}
        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-3 overflow-x-auto">
          {tabNavigation.map((t) => {
            const isDisabled = t.id === "variants" && !product.co_bien_the;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => !isDisabled && setActiveTab(t.id)}
                disabled={isDisabled}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isDisabled
                    ? "opacity-30 cursor-not-allowed"
                    : isActive
                      ? "bg-[#006c49] text-white shadow-xs"
                      : "border border-slate-200 text-slate-600 hover:bg-slate-50 bg-white"
                }`}
              >
                <t.icon size={14} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* ================= GRID 2 CỘT CHÍNH ================= */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ----------------- CỘT TRÁI: THÔNG TIN CHI TIẾT ----------------- */}
          <div className="lg:col-span-8 space-y-6 order-2 lg:order-1">
            
            {activeTab === "info" && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-[#006c49] uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#006c49]"></span> THÔNG TIN CƠ BẢN
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-xs">
                    <div>
                      <span className="font-bold text-slate-400 block mb-1">Tên sản phẩm</span>
                      <span className="font-extrabold text-slate-900 text-sm block">
                        {product.ten_san_pham || "Chưa cập nhật"}
                      </span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-400 block mb-1">Loại danh mục con</span>
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-50 border border-slate-100 text-slate-600 font-extrabold text-[10px] mt-0.5">
                        {product.ten_danh_muc_con || "Chưa phân loại"}
                      </span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-400 block mb-1">Mã sản phẩm (ID)</span>
                      <span className="font-mono font-extrabold text-slate-800 block">
                        {product.ma_san_pham || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-400 block mb-1">Mã SKU phiên bản đầu</span>
                      <span className="font-mono font-extrabold text-slate-800 block">
                        {product.bien_the?.[0]?.sku || "N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <span className="text-xs font-bold text-slate-400 block mb-1.5">Mô tả sản phẩm</span>
                    <p className="p-4 bg-slate-50/70 border border-slate-100 rounded-2xl text-xs text-slate-600 font-semibold leading-relaxed whitespace-pre-line max-h-[300px] overflow-y-auto custom-scrollbar">
                      {product.mo_ta || "Sản phẩm chưa có nội dung mô tả chi tiết."}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-black text-[#006c49] uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#006c49]"></span> ĐẶC TÍNH HỆ THỐNG
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 text-xs">
                    <div>
                      <span className="font-bold text-slate-400 block mb-1">Đơn vị mặc định</span>
                      <span className="font-extrabold text-slate-800 block">
                        {product.bien_the?.[0]?.ten_don_vi || "Chưa cấu hình"}
                      </span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-400 block mb-1">Phân loại cấu trúc</span>
                      <span className="font-extrabold text-slate-800 block">
                        {product.co_bien_the ? "Sản phẩm nhiều biến thể" : "Sản phẩm đơn (Bán trực tiếp)"}
                      </span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-400 block mb-1">Tổng số biến thể</span>
                      <span className="font-extrabold text-slate-800 block">
                        {totalVariants} phân loại
                      </span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-400 block mb-1">Ngày tạo sản phẩm</span>
                      <span className="font-extrabold text-slate-800 block">
                        {product.ngay_tao ? new Date(product.ngay_tao).toLocaleDateString("vi-VN") : "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-400 block mb-1">Cập nhật gần nhất</span>
                      <span className="font-extrabold text-slate-800 block">
                        {product.ngay_cap_nhat ? new Date(product.ngay_cap_nhat).toLocaleDateString("vi-VN") : "Chưa từng chỉnh sửa"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Báo cáo khoảng giá niêm yết</span>
                  <h4 className="text-xl font-extrabold text-slate-900 font-mono">
                    {!product.co_bien_the 
                      ? formatPrice(product.bien_the?.[0]?.gia_ban_le || 0)
                      : minPrice === maxPrice 
                        ? formatPrice(minPrice)
                        : `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`
                    }
                  </h4>
                  <p className="text-[11px] text-slate-400 font-bold mt-1">
                    Tổng lượng hàng tồn: <span className="text-[#006c49] font-extrabold">{totalStock}</span> sản phẩm.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "variants" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    Danh sách các phiên bản ({totalVariants})
                  </h3>

                  <div className="flex items-center gap-1.5">
                    {totalVariants > 0 && (
                      <button
                        onClick={handleDeleteAllVariants}
                        className="flex items-center gap-1 px-3 py-1.5 border border-red-200 bg-red-50 Guest text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition cursor-pointer"
                      >
                        <Trash2 size={13} /> Xóa tất cả
                      </button>
                    )}
                    <Link
                      to={`/admin/products/create-variant/${product.ma_san_pham}`}
                      state={{ existingVariants: product.bien_the }}
                      className="flex items-center gap-1 bg-[#006c49] text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-[#004d34] transition cursor-pointer"
                    >
                      <Plus size={13} /> Thêm biến thể
                    </Link>
                  </div>
                </div>

                <div className="w-full overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-left border-collapse table-auto">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-3 w-16 text-center">Hình ảnh</th>
                        <th className="py-3 px-3">Phiên bản</th>
                        <th className="py-3 px-3">Mã SKU</th>
                        <th className="py-3 px-3 text-right">Giá niêm yết</th>
                        <th className="py-3 px-3">Đơn vị</th>
                        <th className="py-3 px-3 text-center w-24">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-700">
                      {currentVariants.length > 0 ? (
                        currentVariants.map((bt, idx) => {
                          const varMediaObj = getMediaOfVariant(bt.ma_bien_the)[0];
                          return (
                            <tr
                              key={bt.ma_bien_the || idx}
                              className={`group transition hover:bg-slate-50/60 ${bt.trang_thai === false ? "bg-slate-50/50" : ""}`}
                            >
                              <td className="py-3 px-3">
                                <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-50 border border-slate-200 mx-auto">
                                  {varMediaObj?.duong_dan_url ? (
                                    <img
                                      src={varMediaObj.duong_dan_url}
                                      alt="sku-img"
                                      className={`w-full h-full object-cover ${bt.trang_thai === false ? "grayscale opacity-50" : ""}`}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                      <ImageIcon size={16} />
                                    </div>
                                  )}
                                </div>
                              </td>

                              <td className="py-3 px-3">
                                <div className="flex items-center gap-1.5">
                                  <Link
                                    to={`/admin/products/variant-detail/${bt.ma_bien_the}`}
                                    className={`font-bold hover:text-[#006c49] hover:underline ${bt.trang_thai === false ? "text-slate-400 line-through" : "text-slate-900"}`}
                                  >
                                    {bt.ten_bien_the || "Mặc định"}
                                  </Link>
                                  {bt.trang_thai === false && (
                                    <span className="bg-red-50 text-red-600 border border-red-100 px-1 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">
                                      Đã xóa
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className={`py-3 px-3 font-mono font-bold ${bt.trang_thai === false ? "text-slate-400" : "text-amber-700"}`}>
                                {bt.sku || "N/A"}
                              </td>
                              <td className={`py-3 px-3 font-bold font-mono text-right text-slate-900 ${bt.trang_thai === false ? "text-slate-400" : ""}`}>
                                {formatPrice(bt.gia_ban_le)}
                              </td>
                              <td className="py-3 px-3 text-slate-500">{bt.ten_don_vi || "Hộp"}</td>

                              <td className="py-3 px-3 text-center">
                                <div className="flex items-center justify-center gap-1 text-slate-400">
                                  <Link
                                    to={`/admin/products/variant-detail/${bt.ma_bien_the}`}
                                    className="p-1 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                                  >
                                    <Eye size={15} />
                                  </Link>

                                  {bt.trang_thai !== false ? (
                                    <>
                                      <button
                                        onClick={() => {
                                          const isGroupMode = bt.thuoc_tinh && Object.keys(bt.thuoc_tinh).length > 0;
                                          navigate(
                                            `/admin/products/create-variant/${product.ma_san_pham}/${bt.ma_bien_the}`,
                                            { state: { existingVariants: product.bien_the, initMode: isGroupMode } }
                                          );
                                        }}
                                        className="p-1 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                      >
                                        <Edit size={15} />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteVariant(bt.ma_bien_the, bt.ten_bien_the)}
                                        className="p-1 hover:text-red-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                      >
                                        <Trash2 size={15} />
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      onClick={() => handleRestoreVariant(bt.ma_bien_the, bt.ten_bien_the)}
                                      className="p-1 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                    >
                                      <RotateCcw size={15} />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleHardDeleteVariant(bt.ma_bien_the, bt.ten_bien_the)}
                                    className="p-1 hover:text-red-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                  >
                                    <X size={15} strokeWidth={2.5} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-gray-400 font-medium bg-slate-50/50">
                            Sản phẩm chưa có biến thể nào được tạo.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-3 text-[11px] font-bold text-slate-400">
                    <span>
                      Hiển thị {startIndex + 1} - {Math.min(startIndex + variantsPerPage, totalVariants)} trên {totalVariants}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        disabled={currentPage === 1}
                        onClick={handlePrevPage}
                        className="w-6 h-6 border border-slate-200 flex items-center justify-center rounded-md hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                      >
                        ❮
                      </button>
                      <span className="px-1.5 text-slate-700">Trang {currentPage}/{totalPages}</span>
                      <button
                        disabled={currentPage === totalPages}
                        onClick={handleNextPage}
                        className="w-6 h-6 border border-slate-200 flex items-center justify-center rounded-md hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                      >
                        ❯
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "notes" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    Ghi chú nội bộ
                  </span>
                  <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 uppercase tracking-wider">
                    Internal Only
                  </span>
                </div>
                {noteSaved && (
                  <div className="p-2.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-xs font-bold">
                    ✓ Đã lưu thành công ghi chú!
                  </div>
                )}
                <motion.textarea
                  rows={8}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Nhập các lưu ý nội bộ..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#006c49] outline-none transition resize-none"
                />
                <div className="flex items-center justify-between pt-2">
                  <span className="text-[10px] text-slate-400 italic">
                    * Ghi chú này chỉ lưu nội bộ, khách hàng không nhìn thấy.
                  </span>
                  <button
                    onClick={handleSaveNote}
                    disabled={savingNote}
                    className="flex items-center gap-1.5 bg-[#006c49] hover:bg-[#004d34] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
                  >
                    <Save size={13} /> {savingNote ? "Đang ghi..." : "Lưu ghi chú"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ----------------- CỘT PHẢI: HÌNH ẢNH & TRẠNG THÁI ----------------- */}
          <div className="lg:col-span-4 space-y-4 order-1 lg:order-2 lg:sticky lg:top-4">
            
            {/* BOX MEDIA HÌNH ẢNH */}
            <div className="border border-slate-100 bg-white rounded-xl p-3 shadow-2xs space-y-3">
              <div className="aspect-square flex items-center justify-center overflow-hidden bg-slate-50 relative rounded-lg border border-slate-100/60">
                {activeMediaObj?.duong_dan_url ? (
                  <>
                    <img
                      src={activeMediaObj.duong_dan_url}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                    {product.co_bien_the && activeMediaObj.ma_bien_the && (
                      <span className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-xs text-amber-300 border border-slate-800 px-2 py-1 rounded-md text-[10px] font-bold shadow-xs">
                        🏷️ {getVariantNameByCode(activeMediaObj.ma_bien_the)}
                      </span>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center text-slate-300">
                    <ImageIcon size={40} />
                    <span className="text-[11px] font-bold mt-1">Không có tệp hình ảnh</span>
                  </div>
                )}

                {activeMediaObj && (
                  <div className="absolute top-3 left-3">
                    {activeMediaObj.la_anh_chinh ? (
                      <span className="bg-[#006c49] text-white px-2 py-0.5 rounded text-[9px] font-black tracking-wider flex items-center gap-0.5 shadow-xs uppercase">
                        Ảnh chính
                      </span>
                    ) : (
                      <button
                        onClick={async () => {
                          try {
                            // 🚀 TỐI ƯU: Sử dụng productApi
                            await productApi.put("/products/media/set-main", {
                              ma_san_pham: product.ma_san_pham,
                              ma_media: activeMediaObj.ma_media,
                            });
                            alert("Đặt ảnh chính thành công!");
                            window.location.reload();
                          } catch (err) {
                            alert("Lỗi cấu hình ảnh chính.");
                          }
                        }}
                        className="bg-white text-slate-700 hover:bg-slate-900 hover:text-white px-2 py-0.5 rounded text-[9px] font-black border border-slate-200 transition cursor-pointer shadow-2xs"
                      >
                        ĐẶT CHÍNH
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* THUMBNAILS */}
              <div className="flex gap-2 overflow-x-auto pb-1 items-center custom-scrollbar">
                <button
                  onClick={() => setShowMediaModal(true)}
                  className="w-12 h-12 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#006c49] hover:border-[#006c49] hover:bg-emerald-50/50 transition shrink-0 bg-white cursor-pointer"
                >
                  <Plus size={16} />
                </button>

                {product?.media?.map((imgObj) => (
                  <button
                    key={imgObj.ma_media}
                    onClick={() => setActiveMediaObj(imgObj)}
                    className={`w-12 h-12 rounded-lg overflow-hidden border shrink-0 transition relative cursor-pointer ${
                      activeMediaObj?.ma_media === imgObj.ma_media
                        ? "border-[#006c49] ring-2 ring-emerald-50 scale-102"
                        : "border-slate-200 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={imgObj.duong_dan_url} alt="thumb" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* BOX TRẠNG THÁI ACTIVE HỆ THỐNG */}
            <div className="border border-slate-100 bg-white rounded-xl p-4 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Trạng thái bán</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${product.trang_thai !== false ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}></span>
                  <span className={`text-sm font-black tracking-wide uppercase ${product.trang_thai !== false ? "text-emerald-600" : "text-slate-400"}`}>
                    {product.trang_thai !== false ? "ACTIVE" : "DISABLED"}
                  </span>
                </div>
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border text-white ${
                product.trang_thai !== false ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-200"
              }`}>
                {product.trang_thai !== false ? <Check size={16} strokeWidth={3} /> : <X size={16} />}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ================= MODAL UPLOAD MEDIA ================= */}
      {showMediaModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-1.5 text-sm">
                <ImageIcon className="text-[#006c49]" size={16} /> Thêm tệp hình ảnh sản phẩm
              </h3>
              <button
                onClick={() => setShowMediaModal(false)}
                className="text-slate-400 hover:text-red-500 p-1 bg-white rounded-full border border-slate-200 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                  Tải lên hình ảnh từ máy
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    setNewMediaFile(e.target.files[0]);
                    setNewMediaUrl("");
                  }}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-emerald-50 file:text-[#006c49] hover:file:bg-emerald-100 border border-slate-200 rounded-lg p-1 bg-white cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-300 justify-center">
                <div className="flex-1 h-px bg-slate-100"></div> HOẶC <div className="flex-1 h-px bg-slate-100"></div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                  Đường dẫn liên kết hình ảnh (URL)
                </label>
                <input
                  type="text"
                  placeholder="https://example.com/image.jpg"
                  value={newMediaUrl}
                  onChange={(e) => {
                    setNewMediaUrl(e.target.value);
                    setNewMediaFile(null);
                  }}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-[#006c49] transition text-slate-800"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex justify-end gap-2">
              <button
                onClick={() => setShowMediaModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleAddMedia}
                disabled={isUploadingMedia || (!newMediaFile && !newMediaUrl.trim())}
                className="bg-[#006c49] text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isUploadingMedia ? (
                  <span className="flex items-center gap-1"><Loader2 size={14} className="animate-spin" /> Đang đồng bộ...</span>
                ) : (
                  "Lưu tệp ảnh"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}