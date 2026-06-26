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
} from "lucide-react";
import axios from "axios";

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

  // 🌟 Đã tách hàm fetchDetail ra ngoài để có thể tái sử dụng sau khi xóa SKU
  const fetchDetail = useCallback(
    async (showLoading = true) => {
      if (showLoading) setLoading(true);
      try {
        const apiUrl =
          import.meta.env.VITE_API_PRODUCT_URL || "http://localhost:5002";
        const response = await axios.get(`${apiUrl}/api/products/${id}`);

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
        setLoading(false);
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
        const apiUrl =
          import.meta.env.VITE_API_PRODUCT_URL || "http://localhost:5002";
        await axios.delete(`${apiUrl}/api/products/variants/${variantId}`);
        alert("✅ Đã lưu trữ biến thể thành công!");
        fetchDetail(false); // Load lại dữ liệu ngầm không bị chớp màn hình
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
        const apiUrl =
          import.meta.env.VITE_API_PRODUCT_URL || "http://localhost:5002";
        await axios.delete(
          `${apiUrl}/api/products/${product.ma_san_pham}/variants-all`,
        );
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
        const apiUrl =
          import.meta.env.VITE_API_PRODUCT_URL || "http://localhost:5002";
        await axios.put(`${apiUrl}/api/products/variants/${variantId}/restore`);
        alert("✅ Đã khôi phục biến thể thành công!");
        fetchDetail(false); // Load lại danh sách ngầm
      } catch (err) {
        alert(
          "❌ Khôi phục thất bại: " +
            (err.response?.data?.message || err.message),
        );
      }
    }
  };

  if (loading) {
    return (
      <div className="flex-1 bg-[#f8f9fa] min-h-screen flex items-center justify-center font-sans">
        <div className="flex items-center gap-2 text-[#006c49] font-bold text-sm animate-pulse">
          <span className="w-2.5 h-2.5 rounded-full bg-[#006c49]"></span> Đang
          nạp toàn bộ dữ liệu...
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex-1 bg-[#f8f9fa] p-8 font-sans text-left">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-black mb-6"
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
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex-1 bg-[#f8f9fa] min-h-screen p-6 md:p-8 font-sans text-left"
    >
      {/* TOP BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200 mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/admin/products/Danhsachsanpham")}
            className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-slate-600 hover:bg-[#006c49] hover:text-white hover:border-[#006c49] transition shadow-sm shrink-0"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {product.ten_san_pham}
              </h1>
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-black bg-emerald-100 text-[#006c49]">
                #{product.ma_san_pham}
              </span>
            </div>
            <p className="text-xs font-bold text-gray-400 mt-0.5">
              Danh mục:{" "}
              <span className="text-[#006c49]">{product.ten_danh_muc_con}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* CỘT TRÁI */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-6">
          <div className="bg-white rounded-3xl border border-gray-200/80 p-3 shadow-sm aspect-square flex items-center justify-center overflow-hidden bg-slate-50 relative">
            {activeMediaObj?.duong_dan_url ? (
              <>
                <img
                  src={activeMediaObj.duong_dan_url}
                  alt="preview"
                  className="w-full h-full object-cover rounded-2xl"
                />
                {activeMediaObj.ma_bien_the && (
                  <span className="absolute bottom-5 right-5 bg-slate-900/85 backdrop-blur-md text-amber-300 border border-amber-400/40 px-3 py-1.5 rounded-xl text-xs font-black shadow-lg">
                    🏷️ Biến thể:{" "}
                    {getVariantNameByCode(activeMediaObj.ma_bien_the)}
                  </span>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center text-gray-300">
                <ImageIcon size={48} />
                <span className="text-xs font-bold mt-1">
                  Chưa có file media
                </span>
              </div>
            )}
          </div>
          {/* NÚT ĐẶT LÀM ẢNH CHÍNH */}
          {activeMediaObj && (
            <div className="absolute top-4 left-4">
              {activeMediaObj.la_anh_chinh ? (
                <span className="bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-black shadow-md flex items-center gap-1.5">
                  <Check size={14} /> ẢNH CHÍNH
                </span>
              ) : (
                <button
                  onClick={async () => {
                    try {
                      const apiUrl =
                        import.meta.env.VITE_API_PRODUCT_URL ||
                        "http://localhost:5002";
                      await axios.put(`${apiUrl}/api/products/media/set-main`, {
                        ma_san_pham: product.ma_san_pham,
                        ma_media: activeMediaObj.ma_media,
                      });
                      alert("Đã đặt làm ảnh chính thành công!");
                      window.location.reload();
                    } catch (err) {
                      alert("Lỗi khi thiết lập ảnh chính.");
                    }
                  }}
                  className="bg-white/90 backdrop-blur text-slate-700 hover:bg-emerald-500 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-black shadow-sm transition-colors flex items-center gap-1.5 border border-slate-200"
                >
                  <ImageIcon size={14} /> ĐẶT LÀM ẢNH CHÍNH
                </button>
              )}
            </div>
          )}
          {product.media && product.media.length > 0 && (
            <div className="flex gap-2.5 overflow-x-auto pb-2 custom-scrollbar">
              {product.media.map((imgObj) => (
                <button
                  key={imgObj.ma_media}
                  onClick={() => setActiveMediaObj(imgObj)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all relative ${
                    activeMediaObj?.ma_media === imgObj.ma_media
                      ? "border-[#006c49] scale-105 shadow-md"
                      : "border-gray-200 opacity-60"
                  }`}
                >
                  <img
                    src={imgObj.duong_dan_url}
                    alt="thumb"
                    className="w-full h-full object-cover"
                  />
                  {imgObj.ma_bien_the && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 ring-1 ring-black"></span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* CỘT PHẢI */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-200/70 rounded-2xl self-start overflow-x-auto max-w-max">
            {tabNavigation.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-extrabold text-xs transition-all shrink-0 ${
                    activeTab === t.id
                      ? "bg-[#006c49] text-white shadow-md"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                  }`}
                >
                  <Icon size={15} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          <div>
            {/* TAB 1: INFO */}
            {activeTab === "info" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm space-y-4"
              >
                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-100 text-xs">
                  <div>
                    <span className="font-bold text-gray-400 uppercase block">
                      Khởi tạo DB:
                    </span>
                    <span className="font-black text-slate-800 mt-0.5 block">
                      {new Date(product.ngay_tao).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-400 uppercase block">
                      Cập nhật cuối:
                    </span>
                    <span className="font-black text-slate-800 mt-0.5 block">
                      {product.ngay_cap_nhat
                        ? new Date(product.ngay_cap_nhat).toLocaleDateString(
                            "vi-VN",
                          )
                        : "Chưa sửa đổi"}
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">
                    Bài viết mô tả sản phẩm (`mo_ta`)
                  </h3>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-2xl border border-slate-100 max-h-80 overflow-y-auto custom-scrollbar">
                    {product.mo_ta ||
                      "Sản phẩm chưa có nội dung mô tả chi tiết."}
                  </p>
                </div>
              </motion.div>
            )}

            {/* --- TAB 2: SKU & BIẾN THỂ --- */}
            {activeTab === "variants" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Layers size={16} className="text-[#006c49]" /> Danh sách
                    các phiên bản ({totalVariants})
                  </h3>

                  {/* 🌟 NÚT XÓA TẤT CẢ VÀ THÊM MỚI */}
                  <div className="flex items-center gap-2">
                    {totalVariants > 0 && (
                      <button
                        onClick={handleDeleteAllVariants}
                        className="flex items-center gap-1.5 bg-red-50 hover:bg-red-500 hover:text-white text-red-600 border border-red-200 hover:border-red-500 px-3 py-1.5 rounded-xl text-xs font-black shadow-sm transition active:scale-95 uppercase tracking-wider"
                      >
                        <Trash2 size={14} /> Xóa tất cả
                      </button>
                    )}

                    <Link
                      to={`/admin/products/create-variant/${product.ma_san_pham}`}
                      state={{ existingVariants: product.bien_the }}
                      className="flex items-center gap-1 bg-[#006c49] hover:bg-[#004d34] text-white px-3 py-1.5 rounded-xl text-xs font-black shadow-sm transition active:scale-95 uppercase tracking-wider"
                    >
                      <Plus size={14} /> Thêm biến thể
                    </Link>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                        <th className="py-3 px-3 w-20 text-center">Hình ảnh</th>
                        <th className="py-3 px-3">Phiên bản</th>
                        <th className="py-3 px-3">Mã SKU</th>
                        <th className="py-3 px-3 font-mono">Giá niêm yết</th>
                        <th className="py-3 px-3">Đơn vị</th>
                        <th className="py-3 px-3 text-center w-24">
                          Hành động
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-xs font-bold text-gray-700">
                      {currentVariants.length > 0 ? (
                        currentVariants.map((bt, idx) => {
                          const varMediaObj = getMediaOfVariant(
                            bt.ma_bien_the,
                          )[0];
                          return (
                            <tr
                              key={bt.ma_bien_the || idx}
                              className={`group transition ${bt.trang_thai === false ? "bg-slate-50" : "hover:bg-emerald-50/40"}`}
                            >
                              <td className="py-3.5 px-3">
                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 mx-auto">
                                  {varMediaObj?.duong_dan_url ? (
                                    <img
                                      src={varMediaObj.duong_dan_url}
                                      alt="sku-img"
                                      className={`w-full h-full object-cover ${bt.trang_thai === false ? "grayscale opacity-50" : ""}`}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                      <ImageIcon size={18} />
                                    </div>
                                  )}
                                </div>
                              </td>

                              <td className="py-3.5 px-3">
                                <div className="flex items-center gap-2">
                                  <Link
                                    to={`/admin/products/variant-detail/${bt.ma_bien_the}`}
                                    className={`font-extrabold hover:text-[#006c49] hover:underline transition-all ${bt.trang_thai === false ? "text-slate-400 line-through" : "text-slate-900"}`}
                                  >
                                    {bt.ten_bien_the || "Mặc định"}
                                  </Link>
                                  {/* 🌟 NHÃN "ĐÃ XÓA" */}
                                  {bt.trang_thai === false && (
                                    <span className="bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded text-[9px] font-black uppercase whitespace-nowrap">
                                      Đã xóa
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td
                                className={`py-3.5 px-3 font-mono font-black ${bt.trang_thai === false ? "text-slate-400" : "text-amber-700"}`}
                              >
                                {bt.sku || "N/A"}
                              </td>
                              <td
                                className={`py-3.5 px-3 font-black font-mono ${bt.trang_thai === false ? "text-slate-400" : "text-slate-900"}`}
                              >
                                {formatPrice(bt.gia_ban_le)}
                              </td>
                              <td className="py-3.5 px-3 text-gray-500 font-semibold">
                                {bt.ten_don_vi || "Hộp"}
                              </td>

                              <td className="py-3.5 px-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  {/* 1. Nút Xem chi tiết (Luôn hiện để Admin xem lại data cũ) */}
                                  <Link
                                    to={`/admin/products/variant-detail/${bt.ma_bien_the}`}
                                    className="p-1.5 text-slate-400 hover:text-[#006c49] hover:bg-emerald-50 rounded-lg transition shadow-sm border border-transparent hover:border-emerald-200"
                                    title="Xem chi tiết biến thể"
                                  >
                                    <Eye size={16} />
                                  </Link>

                                  {/* Logic hiển thị: Nếu ĐANG MỞ BÁN thì hiện Sửa/Xóa. Nếu ĐÃ XÓA thì hiện Khôi phục */}
                                  {bt.trang_thai !== false ? (
                                    <>
                                      {/* Nút Sửa */}
                                      <button
                                        onClick={() =>
                                          navigate(
                                            `/admin/products/create-variant/${product.ma_san_pham}/${bt.ma_bien_the}`,
                                            {
                                              state: {
                                                existingVariants:
                                                  product.bien_the,
                                              },
                                            },
                                          )
                                        }
                                        className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition shadow-sm border border-transparent hover:border-sky-200"
                                        title="Chỉnh sửa EAV & Giá"
                                      >
                                        <Edit size={16} />
                                      </button>

                                      {/* Nút Xóa (Lưu trữ) */}
                                      <button
                                        onClick={() =>
                                          handleDeleteVariant(
                                            bt.ma_bien_the,
                                            bt.ten_bien_the,
                                          )
                                        }
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition shadow-sm border border-transparent hover:border-red-200"
                                        title="Xóa biến thể (Lưu trữ)"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </>
                                  ) : (
                                    /*  NÚT KHÔI PHỤC */
                                    <button
                                      onClick={() =>
                                        handleRestoreVariant(
                                          bt.ma_bien_the,
                                          bt.ten_bien_the,
                                        )
                                      }
                                      className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition shadow-sm border border-transparent hover:border-emerald-200"
                                      title="Khôi phục biến thể này"
                                    >
                                      <RotateCcw size={16} />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td
                            colSpan="6"
                            className="py-8 text-center text-amber-600 bg-amber-50 font-bold rounded-2xl border border-amber-200"
                          >
                            ⚠️ Sản phẩm này chưa có biến thể nào.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* PHÂN TRANG */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className="text-xs font-bold text-gray-500">
                      Hiển thị{" "}
                      <span className="text-slate-900">
                        {startIndex + 1} -{" "}
                        {Math.min(startIndex + variantsPerPage, totalVariants)}
                      </span>{" "}
                      trên tổng {totalVariants}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-lg border border-gray-200 text-slate-600 hover:bg-gray-50 disabled:opacity-40"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="text-xs font-bold text-slate-700 px-2">
                        Trang {currentPage} / {totalPages}
                      </span>
                      <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded-lg border border-gray-200 text-slate-600 hover:bg-gray-50 disabled:opacity-40"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB 3: NOTES */}
            {activeTab === "notes" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Bookmark size={16} className="text-[#006c49]" /> Ghi chú
                    lưu ý kiểm hàng & nhà cung cấp
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
                  rows={8}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Nhập các lưu ý nội bộ..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#006c49] outline-none transition"
                />
                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-gray-400 italic">
                    * Ghi chú này chỉ lưu nội bộ, khách hàng không nhìn thấy.
                  </span>
                  <button
                    onClick={handleSaveNote}
                    disabled={savingNote}
                    className="bg-[#006c49] hover:bg-[#004d34] text-white px-6 py-2.5 rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5"
                  >
                    <Save size={14} />{" "}
                    {savingNote ? "Đang ghi..." : "Lưu ghi chú"}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
