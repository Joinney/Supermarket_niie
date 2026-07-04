import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { ChevronLeft, Loader2, Save } from "lucide-react";

export default function NationalForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(isEditMode);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");

  // Khởi tạo state khớp 100% với cấu trúc bảng danh_muc_quoc_gia
  const [formData, setFormData] = useState({
    ma_quoc_gia: "",
    ten_quoc_gia: "",
    ma_dinh_danh_sp: "",
    dinh_dang_vung: "vi-VN",
    ma_tien_te: "VND",
    bieu_tuong_tien: "đ",
    ty_gia: 1.0,
    bieu_tuong_co: "🇻🇳",
  });

  const apiUrl = import.meta.env.VITE_API_PRODUCT_URL || "http://localhost:5002";

  // Lấy dữ liệu nếu đang ở chế độ Sửa (Edit)
  useEffect(() => {
    const fetchNation = async () => {
      if (!isEditMode) return;
      try {
        setLoading(true);
        const res = await axios.get(`${apiUrl}/api/nations/${id}`);
        if (res.data && res.data.success) {
          setFormData(res.data.data);
        } else {
          alert("Không tìm thấy dữ liệu quốc gia này!");
          navigate(-1);
        }
      } catch (err) {
        console.error("Lỗi tải quốc gia:", err);
        setError("Không thể tải thông tin quốc gia.");
      } finally {
        setLoading(false);
      }
    };
    fetchNation();
  }, [id, apiUrl, isEditMode, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError("");

    try {
      if (isEditMode) {
        // Cập nhật
        await axios.put(`${apiUrl}/api/nations/${id}`, formData);
        alert("✅ Cập nhật thông tin quốc gia thành công!");
      } else {
        // Thêm mới
        await axios.post(`${apiUrl}/api/nations`, formData);
        alert("✅ Thêm cửa hàng quốc gia mới thành công!");
      }
      navigate("/admin/nations/list");
    } catch (err) {
      console.error("Lỗi lưu quốc gia:", err);
      setError(err.response?.data?.message || "Gặp sự cố khi lưu dữ liệu.");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-10 flex justify-center text-[#006c49]">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      /* 🌟 THAY ĐỔI: Chuyển bg về #fafafa và dùng p-1 để bung sát mép hai bên đồng bộ hệ thống */
      className="w-full min-h-screen bg-[#fafafa] font-sans text-left text-slate-700 selection:bg-emerald-100 p-1 antialiased"
    >
      <div className="w-full">
        {/* HEADER */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate("/admin/nations/list")}
            type="button"
            className="w-11 h-11 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition shadow-sm shrink-0 cursor-pointer"
            title="Quay lại"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              {isEditMode ? "Cập Nhật Thị Trường" : "Thêm Thị Trường Mới"}
            </h1>
            <p className="text-xs font-bold text-slate-400 mt-1">
              {isEditMode
                ? `Đang chỉnh sửa mã: ${id}`
                : "Thiết lập cấu hình khu vực, tiền tệ và định dạng vùng"}
            </p>
          </div>
        </div>

        {/* MAIN FORM */}
        <div className="w-full bg-white p-5 md:p-6 rounded-2xl border border-slate-100 shadow-sm relative">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-bold text-center">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Mã Quốc Gia */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Mã Quốc Gia <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={isEditMode}
                  maxLength={10}
                  placeholder="VD: VN, US, CN"
                  value={formData.ma_quoc_gia}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ma_quoc_gia: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-50 transition disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                />
                {!isEditMode && (
                  <p className="text-[9px] text-slate-400 font-bold italic mt-0.5">
                    * Mã viết tắt (Tối đa 10 ký tự, tự động in hoa).
                  </p>
                )}
              </div>

              {/* Tên Quốc Gia */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Tên Quốc Gia (Cửa Hàng) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  placeholder="VD: Việt Nam, Hoa Kỳ"
                  value={formData.ten_quoc_gia}
                  onChange={(e) =>
                    setFormData({ ...formData, ten_quoc_gia: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-50 transition"
                />
              </div>

              {/* Mã Định Danh Sản Phẩm */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-wider">
                  Mã Định Danh SP (GS1) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  placeholder="VD: 893 (VN), 000 (US), 690 (CN)"
                  value={formData.ma_dinh_danh_sp}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ma_dinh_danh_sp: e.target.value.trim(),
                    })
                  }
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-indigo-700 placeholder-slate-400 outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-50 transition"
                />
                <p className="text-[9px] text-slate-400 font-bold italic mt-0.5">
                  * Tiền tố sinh mã sản phẩm tự động (VD: MSP <span className="font-bold text-slate-600">893</span>...)
                </p>
              </div>

              {/* Biểu tượng cờ & Định dạng vùng */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Cờ (Emoji)
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="VD: 🇻🇳, 🇺🇸"
                    value={formData.bieu_tuong_co}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bieu_tuong_co: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-center font-bold text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-emerald-600 transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Định Dạng Vùng
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="VD: vi-VN, en-US"
                    value={formData.dinh_dang_vung}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dinh_dang_vung: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-emerald-600 transition"
                  />
                </div>
              </div>

              {/* Nhóm Tiền tệ */}
              <div className="grid grid-cols-3 gap-4 md:col-span-2">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Mã Tiền Tệ
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="VD: VND, USD"
                    value={formData.ma_tien_te}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        ma_tien_te: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-emerald-600 transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Ký Hiệu
                  </label>
                  <input
                    type="text"
                    maxLength={5}
                    placeholder="VD: đ, $, ¥"
                    value={formData.bieu_tuong_tien}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bieu_tuong_tien: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-center text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-emerald-600 transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-sky-600 uppercase tracking-wider">
                    Tỷ Giá (So với gốc)
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    min="0"
                    placeholder="VD: 1.000000"
                    value={formData.ty_gia}
                    onChange={(e) =>
                      setFormData({ ...formData, ty_gia: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-300 outline-none focus:bg-white focus:border-emerald-600 transition"
                  />
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-end gap-3 text-xs font-bold">
              <button
                type="button"
                onClick={() => navigate("/admin/nations/list")}
                className="px-5 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={submitLoading}
                className="flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm hover:shadow transition transform active:scale-98 cursor-pointer"
              >
                {submitLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Đang xử lý...
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    {isEditMode ? "Lưu Cập Nhật" : "Hoàn Tất Tạo Mới"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
}