import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

  const apiUrl =
    import.meta.env.VITE_API_PRODUCT_URL || "http://localhost:5002";

  // Lấy dữ liệu nếu đang ở chế độ Sửa (Edit)
  useEffect(() => {
    const fetchNation = async () => {
      if (!isEditMode) return;
      try {
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
    <div className="p-6 w-full flex-1 font-sans bg-[#fafafa] min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* HEADER */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate("/admin/nations/list")}
            className="w-11 h-11 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition shadow-sm shrink-0"
            title="Quay lại"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
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
        <div className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-200/80">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-bold text-center">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mã Quốc Gia */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-2 tracking-wide">
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
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 placeholder-slate-300 outline-none focus:border-[#006c49] transition disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                />
                {!isEditMode && (
                  <p className="text-[10px] text-slate-400 mt-1.5 italic">
                    Mã viết tắt (Tối đa 10 ký tự, tự động in hoa).
                  </p>
                )}
              </div>

              {/* Tên Quốc Gia */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-2 tracking-wide">
                  Tên Quốc Gia (Cửa Hàng){" "}
                  <span className="text-red-500">*</span>
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
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 placeholder-slate-300 outline-none focus:border-[#006c49] transition"
                />
              </div>

              {/* Mã Định Danh Sản Phẩm */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-2 tracking-wide text-indigo-600">
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
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 placeholder-slate-300 outline-none focus:border-indigo-500 transition"
                />
                <p className="text-[10px] text-slate-400 mt-1.5 italic">
                  Dùng làm tiền tố sinh mã sản phẩm tự động (VD: MSP
                  <span className="font-bold text-slate-600">893</span>...)
                </p>
              </div>

              {/* Biểu tượng cờ & Định dạng vùng */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-2 tracking-wide">
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
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-lg text-center font-bold text-slate-800 placeholder-slate-300 outline-none focus:border-[#006c49] transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-2 tracking-wide">
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
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 placeholder-slate-300 outline-none focus:border-[#006c49] transition"
                  />
                </div>
              </div>

              {/* Nhóm Tiền tệ */}
              <div className="grid grid-cols-3 gap-4 md:col-span-2">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-2 tracking-wide">
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
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 placeholder-slate-300 outline-none focus:border-[#006c49] transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-2 tracking-wide">
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
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-center text-slate-800 placeholder-slate-300 outline-none focus:border-[#006c49] transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-2 tracking-wide text-sky-600">
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
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 placeholder-slate-300 outline-none focus:border-[#006c49] transition"
                  />
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate("/admin/nations/list")}
                className="px-6 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-xl transition"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={submitLoading}
                className="px-8 py-3 bg-[#006c49] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#005137] transition active:scale-95 shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {submitLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Đang xử lý...
                  </>
                ) : (
                  <>
                    <Save size={18} />{" "}
                    {isEditMode ? "Lưu Cập Nhật" : "Hoàn Tất Tạo Mới"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
