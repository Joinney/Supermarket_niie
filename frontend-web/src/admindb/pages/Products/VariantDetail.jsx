import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Tag, DollarSign, Package, Calendar, Edit, Save, Check,
  Layers, FileText, ShieldAlert, Archive
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

  useEffect(() => {
    const fetchVariantDetail = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_PRODUCT_URL || "http://localhost:5002";
        // Gọi API bốc chi tiết 1 biến thể cụ thể từ Node.js Backend
        const response = await axios.get(`${apiUrl}/api/products/variants/${variantId}`);
        
        if (response.data) {
          const data = response.data;
          setVariant(data);
          setEditPrice(data.gia_ban_le || 0);
          setEditSku(data.sku || "");
          setEditStock(data.so_luong_ton || 0);
        }
      } catch (err) {
        console.error("Lỗi tải chi tiết biến thể:", err);
        setError("Không tìm thấy thông tin phiên bản này hoặc mã ID đã bị xóa!");
      } finally {
        setLoading(false);
      }
    };
    fetchVariantDetail();
  }, [variantId]);

  const handleSaveVariant = async () => {
    setSaving(true);
    try {
      const apiUrl = import.meta.env.VITE_API_PRODUCT_URL || "http://localhost:5002";
      await axios.put(`${apiUrl}/api/products/variants/${variantId}`, {
        gia_ban_le: editPrice,
        sku: editSku,
        so_luong_ton: editStock
      });
      
      setVariant(prev => ({
        ...prev,
        gia_ban_le: editPrice,
        sku: editSku,
        so_luong_ton: editStock
      }));
      setIsEditing(false);
      alert("Đã cập nhật thông tin phiên bản thành công!");
    } catch (err) {
      alert("Gặp sự cố khi đồng bộ dữ liệu biến thể xuống DB!");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 bg-[#f8f9fa] min-h-screen flex items-center justify-center font-sans">
        <div className="flex items-center gap-2 text-[#006c49] font-bold text-sm animate-pulse">
          <span className="w-2.5 h-2.5 rounded-full bg-[#006c49]"></span> Đang tải thông số phiên bản chi tiết...
        </div>
      </div>
    );
  }

  if (error || !variant) {
    return (
      <div className="flex-1 bg-[#f8f9fa] p-8 font-sans text-left">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-black mb-6">
          <ArrowLeft size={16} /> Quay lại trang trước
        </button>
        <div className="p-6 bg-red-50 text-red-600 rounded-2xl border border-red-200 text-xs font-bold">{error}</div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex-1 bg-[#f8f9fa] min-h-screen p-6 md:p-8 font-sans text-left"
    >
      {/* TOP BAR QUAY LẠI */}
      <div className="flex items-center justify-between pb-6 border-b border-gray-200 mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-slate-600 hover:bg-[#006c49] hover:text-white transition shadow-sm shrink-0"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">{variant.ten_bien_the || "Biến thể mặc định"}</h1>
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-black bg-amber-100 text-amber-800 border border-amber-200">
                #{variant.ma_bien_the}
              </span>
            </div>
            <p className="text-xs font-bold text-gray-400 mt-1">
              Thuộc sản phẩm cha: <span className="text-[#006c49]">{variant.ten_san_pham || `Sản phẩm #${variant.ma_san_pham}`}</span>
            </p>
          </div>
        </div>

        {/* Nút bật/tắt chế độ chỉnh sửa */}
        <button
          onClick={() => { if (isEditing) handleSaveVariant(); else setIsEditing(true); }}
          disabled={saving}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition flex items-center gap-1.5 ${
            isEditing ? "bg-amber-500 hover:bg-amber-600 text-slate-900" : "bg-[#006c49] hover:bg-[#005137] text-white"
          }`}
        >
          {isEditing ? <Save size={14} /> : <Edit size={14} />}
          {isEditing ? (saving ? "Đang lưu..." : "Lưu cấu hình") : "Chỉnh sửa nhanh"}
        </button>
      </div>

      {/* CHÍNH CƠ CẤU LAYOUT: GRID 2 CỘT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-7xl">
        
        {/* ==================== CỘT TRÁI: THƯ VIỆN ẢNH ĐẠI DIỆN RIÊNG ==================== */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-3xl border border-gray-200/80 p-3 shadow-sm aspect-square flex items-center justify-center overflow-hidden bg-slate-50 relative">
            {variant.duong_dan_url ? (
              <img src={variant.duong_dan_url} alt="variant-thumb" className="w-full h-full object-cover rounded-2xl" />
            ) : (
              <div className="flex flex-col items-center text-gray-300">
                <ImageIcon size={48} />
                <span className="text-xs font-bold mt-1">Chưa gán ảnh chính</span>
              </div>
            )}
          </div>
          <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 text-[11px] font-bold text-emerald-800 leading-relaxed">
            💡 <em>Mẹo Admin:</em> Ảnh hiển thị được lấy độc lập từ bảng dữ liệu liên kết media dựa trên mã định danh biến thể chi tiết này.
          </div>
        </div>

        {/* ==================== CỘT PHẢI: FORM VÀ THÔNG SỐ VẬT LÝ KHO BẢO MẬT ==================== */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* KHỐI 1: FORM CẬP NHẬT TRẠNG THÁI CORE */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm space-y-5">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-3">
              <Layers size={16} className="text-[#006c49]" /> Thông số định vị thương mại
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
              {/* Ô 1: Mã SKU */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-gray-400 uppercase flex items-center gap-1">
                  <FileText size={12} /> Mã định danh SKU toàn hệ thống
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={editSku}
                  onChange={(e) => setEditSku(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 disabled:opacity-75 focus:bg-white focus:border-amber-500 font-mono font-black text-amber-800 outline-none p-3 rounded-xl text-xs transition"
                />
              </div>

              {/* Ô 2: Giá bán lẻ niêm yết */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-gray-400 uppercase flex items-center gap-1">
                  <DollarSign size={12} /> Giá bán lẻ thực tế (VNĐ)
                </label>
                <input
                  type="number"
                  disabled={!isEditing}
                  value={editPrice}
                  onChange={(e) => setEditPrice(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-gray-200 disabled:opacity-75 focus:bg-white focus:border-[#006c49] font-mono font-black text-slate-900 outline-none p-3 rounded-xl text-xs transition"
                />
              </div>

              {/* Ô 3: Số lượng tồn kho vật lý */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-gray-400 uppercase flex items-center gap-1">
                  <Package size={12} /> Số lượng tồn hiện có trong kho
                </label>
                <input
                  type="number"
                  disabled={!isEditing}
                  value={editStock}
                  onChange={(e) => setEditStock(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-gray-200 disabled:opacity-75 focus:bg-white focus:border-[#006c49] font-mono font-black text-slate-900 outline-none p-3 rounded-xl text-xs transition"
                />
              </div>

              {/* Ô 4: Đơn vị tính tĩnh */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-gray-400 uppercase flex items-center gap-1">
                  <Archive size={12} /> Quy chuẩn đóng gói / Đơn vị
                </label>
                <input
                  type="text"
                  disabled={true}
                  value={variant.ten_don_vi || "Chai"}
                  className="w-full bg-slate-100 border border-gray-200 opacity-65 font-bold text-gray-500 p-3 rounded-xl text-xs outline-none"
                />
              </div>
            </div>
          </div>

          {/* KHỐI 2: LIÊN KẾT NHÃN THUỘC TÍNH PHÂN LOẠI CHÉO TRONG DATABASE (BẢNG EAV CHI TIẾT) */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-3">
              <Tag size={16} className="text-amber-500" /> Ma trận nhãn thuộc tính liên kết (Database EAV Mapping)
            </h3>

            {variant.thuoc_tinh_hop_nhat && variant.thuoc_tinh_hop_nhat.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {variant.thuoc_tinh_hop_nhat.map((attr, index) => (
                  <div key={index} className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 text-xs">
                    <span className="font-bold text-gray-400 uppercase tracking-wider">{attr.ten_thuoc_tinh}</span>
                    <span className="font-black text-slate-800 bg-white border border-gray-200 shadow-sm px-3 py-1 rounded-lg">
                      {attr.gia_tri}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-2">
                <ShieldAlert size={16} /> Phiên bản này chưa được đấu nối ma trận nhãn thuộc tính chéo trong DB!
              </div>
            )}
          </div>

          {/* KHỐI 3: METADATA LỊCH SỬ KHỞI TẠO HỆ THỐNG */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm grid grid-cols-2 gap-4 text-xs font-bold">
            <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <Calendar size={16} className="text-gray-400" />
              <div>
                <span className="text-gray-400 block uppercase text-[10px]">Ngày ghi nhận hệ thống:</span>
                <span className="text-slate-800 font-black mt-0.5 block">{new Date(variant.ngay_tao || Date.now()).toLocaleDateString("vi-VN")}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <Calendar size={16} className="text-gray-400" />
              <div>
                <span className="text-gray-400 block uppercase text-[10px]">Cập nhật log cuối:</span>
                <span className="text-slate-800 font-black mt-0.5 block">{variant.ngay_cap_nhat ? new Date(variant.ngay_cap_nhat).toLocaleDateString("vi-VN") : "Chưa có log chỉnh sửa"}</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </motion.div>
  );
}