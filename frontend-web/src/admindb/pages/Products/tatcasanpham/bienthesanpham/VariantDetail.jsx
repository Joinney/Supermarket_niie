import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Tag,
  DollarSign,
  Package,
  Calendar,
  Edit,
  Save,
  Layers,
  FileText,
  ShieldAlert,
  Archive,
  Image as ImageIcon,
  Edit3,
  Plus,
} from "lucide-react";
import axios from "axios";

export default function AdminVariantDetail() {
  const { variantId } = useParams();
  const navigate = useNavigate();

  const [variant, setVariant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // State phục vụ việc chỉnh sửa nhanh thông số biến thể
  const [isEditing, setIsEditing] = useState(false);
  const [editPrice, setEditPrice] = useState(0);
  const [editSku, setEditSku] = useState("");
  const [editStock, setEditStock] = useState(0);
  const [saving, setSaving] = useState(false);

  // 🟢 State & Ref phục vụ Upload ảnh
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchVariantDetail = async () => {
      try {
        const apiUrl =
          import.meta.env.VITE_API_PRODUCT_URL || "http://localhost:5002";
        const response = await axios.get(
          `${apiUrl}/api/products/variants/${variantId}`,
        );

        if (response.data) {
          const data = response.data;
          setVariant(data);
          setEditPrice(data.gia_ban_le || 0);
          setEditSku(data.sku || "");
          setEditStock(data.so_luong_ton || 0);
        }
      } catch (err) {
        console.error("Lỗi tải chi tiết biến thể:", err);
        setError(
          "Không tìm thấy thông tin phiên bản này hoặc mã ID đã bị xóa!",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchVariantDetail();
  }, [variantId]);

  const handleSaveVariant = async () => {
    setSaving(true);
    try {
      const apiUrl =
        import.meta.env.VITE_API_PRODUCT_URL || "http://localhost:5002";

      // 🌟 FIX BẢO MẬT DỮ LIỆU: Bổ sung ten_bien_the và ten_don_vi để BE không overwrite thành NULL
      await axios.put(`${apiUrl}/api/products/variants/${variantId}`, {
        ten_bien_the: variant.ten_bien_the,
        ten_don_vi: variant.ten_don_vi,
        gia_ban_le: editPrice,
        sku: editSku,
        so_luong_ton: editStock,
      });

      setVariant((prev) => ({
        ...prev,
        gia_ban_le: editPrice,
        sku: editSku,
        so_luong_ton: editStock,
      }));
      setIsEditing(false);
      alert("Đã cập nhật thông tin phiên bản thành công!");
    } catch (err) {
      alert("Gặp sự cố khi đồng bộ dữ liệu biến thể xuống DB!");
    } finally {
      setSaving(false);
    }
  };

  // 🟢 Hàm xử lý Upload ảnh
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Kích thước ảnh quá lớn. Vui lòng chọn ảnh dưới 5MB.");
      return;
    }

    setUploadingImage(true);

    const formData = new FormData();
    formData.append("image", file);
    formData.append("ma_san_pham", variant.ma_san_pham);
    formData.append("ma_bien_the", variant.ma_bien_the);
    formData.append("loai_media", "image");

    try {
      const apiUrl =
        import.meta.env.VITE_API_PRODUCT_URL || "http://localhost:5002";

      const response = await axios.post(
        `${apiUrl}/api/products/variants/${variantId}/upload-image`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (response.data && response.data.duong_dan_url) {
        setVariant((prev) => ({
          ...prev,
          duong_dan_url: response.data.duong_dan_url,
        }));
        alert("Đã cập nhật ảnh đại diện biến thể thành công!");
      }
    } catch (err) {
      console.error("Lỗi Upload ảnh:", err);
      alert("Đã xảy ra sự cố khi tải ảnh lên máy chủ.");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (loading) {
    return (
      <div className="w-full bg-[#fafafa] min-h-screen flex items-center justify-center font-sans">
        <div className="flex items-center gap-2 text-[#006c49] font-bold text-sm animate-pulse">
          <span className="w-2.5 h-2.5 rounded-full bg-[#006c49]"></span> Đang tải thông số phiên bản chi tiết...
        </div>
      </div>
    );
  }

  if (error || !variant) {
    return (
      <div className="w-full bg-[#fafafa] p-6 font-sans text-left min-h-screen antialiased text-slate-700">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-black mb-6"
        >
          <ArrowLeft size={16} /> Quay lại trang trước
        </button>
        <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-xs font-bold">
          {error}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="w-full min-h-screen bg-[#fafafa] font-sans text-left text-slate-700 selection:bg-emerald-100 p-1 antialiased"
    >
      {/* ================= HEADER SECTION ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Chi tiết biến thể
          </h1>
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-400 mt-1">
            <span>Dashboard</span>
            <span>❯</span>
            <span>Sản phẩm</span>
            <span>❯</span>
            <span className="text-[#006c49] font-bold">Chi tiết biến thể</span>
          </div>
        </div>

        {/* TOP BUTTONS */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer bg-white shadow-2xs"
          >
            <ArrowLeft size={14} /> Quay về
          </button>
          
          <button
            onClick={() => {
              if (isEditing) handleSaveVariant();
              else setIsEditing(true);
            }}
            disabled={saving}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition transform active:scale-98 cursor-pointer text-white ${
              isEditing ? "bg-amber-500 hover:bg-amber-600 !text-slate-900" : "bg-[#006c49] hover:bg-[#005137]"
            }`}
          >
            {isEditing ? <Save size={14} /> : <Edit size={14} />}
            {isEditing ? (saving ? "Đang lưu..." : "Lưu cấu hình") : "Chỉnh sửa"}
          </button>

          {/* 🌟 ĐÃ SỬA: Nút "Sửa ma trận thuộc tính" được đổi sang màu vàng hổ phách (amber) nổi bật hơn */}
          {!isEditing && (
            <button
              onClick={() => navigate(`/admin/products/create-variant/${variant.ma_san_pham}/${variant.ma_bien_the}`)}
              className="flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-900 px-4 py-2.5 rounded-xl text-xs font-black shadow-sm transition cursor-pointer"
            >
              <Layers size={14} /> Sửa ma trận thuộc tính
            </button>
          )}
        </div>
      </div>

      {/* ================= MAIN CONTAINER ================= */}
      <div className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm p-5 md:p-6">
        
        {/* Bản diễn giải định danh chính của phiên bản */}
        <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-800">
            {variant.ten_bien_the || "Biến thể mặc định"}
          </h2>
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-black bg-emerald-50 text-[#006c49] border border-emerald-100">
            Mã biến thể: {variant.ma_bien_the}
          </span>
        </div>

        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ----------------- CỘT TRÁI: HÌNH ẢNH ĐẠI DIỆN PHIÊN BẢN (4 Phần) ----------------- */}
          <div className="lg:col-span-4 space-y-4">
            <div className="border border-slate-100 bg-slate-50/50 rounded-xl p-3 shadow-2xs">
              <div className="aspect-square flex items-center justify-center overflow-hidden bg-white relative rounded-lg border border-slate-100/60 group">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                />

                {uploadingImage ? (
                  <div className="flex flex-col items-center justify-center text-[#006c49] w-full h-full">
                    <span className="w-7 h-7 rounded-full border-3 border-[#006c49]/20 border-t-[#006c49] animate-spin mb-2"></span>
                    <span className="text-[11px] font-bold animate-pulse">Đang tải ảnh lên...</span>
                  </div>
                ) : variant.duong_dan_url ? (
                  <>
                    <img
                      src={variant.duong_dan_url}
                      alt="variant-thumb"
                      className="w-full h-full object-cover transition-transform group-hover:scale-102 duration-300"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-lg backdrop-blur-xs">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-white text-slate-800 hover:bg-[#006c49] hover:text-white px-4 py-2 rounded-xl text-xs font-bold uppercase transition transform translate-y-2 group-hover:translate-y-0 duration-200 cursor-pointer shadow-sm"
                      >
                        Thay đổi ảnh
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-300 w-full h-full p-4 text-center">
                    <ImageIcon size={40} className="mb-2 opacity-60" />
                    <span className="text-xs font-bold mb-3">Chưa gắn ảnh đại diện</span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-[#006c49] hover:bg-[#005137] text-white px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs"
                    >
                      Tải ảnh lên
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100/60 text-[11px] font-bold text-emerald-800 leading-relaxed">
              💡 Định danh ảnh: Hệ thống quét ảnh độc lập từ kho dữ liệu liên kết <code>media_san_pham</code> dựa trên mã <code>#{variant.ma_bien_the}</code>.
            </div>
          </div>

          {/* ----------------- CỘT PHẢI: THÔNG SỐ VÀ MA TRẬN PHÂN LOẠI (8 Phần) ----------------- */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* THÔNG SỐ ĐỊNH VỊ THƯƠNG MẠI */}
            <div className="border border-slate-100 bg-white rounded-2xl p-5 md:p-6 shadow-2xs space-y-4">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-3">
                <Layers size={15} className="text-emerald-700" /> Thông số định vị thương mại
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <FileText size={12} /> Mã định danh SKU hệ thống
                  </label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={editSku}
                    onChange={(e) => setEditSku(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 disabled:opacity-75 focus:bg-white focus:border-emerald-600 font-mono font-bold text-amber-800 uppercase outline-none px-3 py-2.5 rounded-xl text-xs transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <DollarSign size={12} /> Giá bán thực tế (VNĐ)
                  </label>
                  <input
                    type="number"
                    disabled={!isEditing}
                    value={editPrice}
                    onChange={(e) => setEditPrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 disabled:opacity-75 focus:bg-white focus:border-emerald-600 font-mono font-bold text-slate-900 outline-none px-3 py-2.5 rounded-xl text-xs transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Package size={12} /> Số lượng hàng tồn trong kho
                  </label>
                  <input
                    type="number"
                    disabled={!isEditing}
                    value={editStock}
                    onChange={(e) => setEditStock(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 disabled:opacity-75 focus:bg-white focus:border-emerald-600 font-mono font-bold text-slate-900 outline-none px-3 py-2.5 rounded-xl text-xs transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Archive size={12} /> Quy chuẩn / Đơn vị tính
                  </label>
                  <input
                    type="text"
                    disabled={true}
                    value={variant?.ten_don_vi || "Chai"}
                    className="w-full bg-slate-100 border border-slate-200 opacity-65 font-bold text-slate-400 px-3 py-2.5 rounded-xl text-xs outline-none cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* DATABASE EAV MAPPING */}
            <div className="border border-slate-100 bg-white rounded-2xl p-5 md:p-6 shadow-2xs space-y-4">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-3">
                <Tag size={15} className="text-amber-500" /> Ma trận nhãn thuộc tính liên kết (Database EAV)
              </h3>

              {variant?.thuoc_tinh_hop_nhat && variant.thuoc_tinh_hop_nhat.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {variant.thuoc_tinh_hop_nhat.map((attr, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs"
                    >
                      <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                        {attr.ten_thuoc_tinh}
                      </span>
                      <span className="font-extrabold text-slate-800 bg-white border border-slate-200 px-3 py-1 rounded-lg shadow-2xs">
                        {attr.gia_tri}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-amber-50/70 text-amber-800 border border-amber-100 rounded-xl text-xs font-bold flex items-center gap-2">
                  <ShieldAlert size={15} /> Phiên bản này (Cấu trúc đơn) hiện không nằm trong ma trận liên kết thuộc tính chéo EAV.
                </div>
              )}
            </div>

            {/* METADATA SYSTEM LOGS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
              <div className="flex items-center gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-100 shadow-2xs">
                <Calendar size={15} className="text-slate-400" />
                <div>
                  <span className="text-slate-400 block uppercase text-[9px] tracking-wide">Ghi nhận hệ thống</span>
                  <span className="text-slate-800 font-extrabold mt-0.5 block">
                    {variant?.ngay_tao ? new Date(variant.ngay_tao).toLocaleDateString("vi-VN") : "N/A"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-100 shadow-2xs">
                <Calendar size={15} className="text-slate-400" />
                <div>
                  <span className="text-slate-400 block uppercase text-[9px] tracking-wide">Cập nhật log cuối</span>
                  <span className="text-slate-800 font-extrabold mt-0.5 block">
                    {variant?.ngay_cap_nhat ? new Date(variant.ngay_cap_nhat).toLocaleDateString("vi-VN") : "Chưa sửa đổi log"}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </motion.div>
  );
}