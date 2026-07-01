import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Loader2, ChevronLeft, Save, Box } from "lucide-react";

export default function UnitForm() {
  const { id } = useParams(); // Lấy ID từ URL
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(isEditMode);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formData, setFormData] = useState({
    ten_don_vi: "",
    mo_ta: "",
  });

  const apiUrl =
    import.meta.env.VITE_API_PRODUCT_URL || "http://localhost:5002";

  // 1. TẢI DỮ LIỆU NẾU LÀ CHẾ ĐỘ SỬA
  useEffect(() => {
    if (isEditMode) {
      const fetchUnitDetail = async () => {
        try {
          // Lưu ý: Bạn cần chắc chắn Backend có API GET /api/products/units/:id
          // Nếu Backend chưa có, bạn có thể lấy từ danh sách units hiện tại rồi filter
          const res = await axios.get(`${apiUrl}/api/products/units`);
          const unit = res.data.find((u) => u.id.toString() === id.toString());

          if (unit) {
            setFormData({
              ten_don_vi: unit.ten_don_vi,
              mo_ta: unit.mo_ta || "",
            });
          } else {
            alert("Không tìm thấy đơn vị này!");
            navigate("/admin/products/units");
          }
        } catch (error) {
          console.error("Lỗi lấy dữ liệu đơn vị:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchUnitDetail();
    }
  }, [id, isEditMode, apiUrl, navigate]);

  // 2. GỬI DỮ LIỆU
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.ten_don_vi.trim())
      return alert("Tên đơn vị không được để trống!");

    setSubmitLoading(true);
    try {
      if (isEditMode) {
        await axios.put(`${apiUrl}/api/products/units/${id}`, {
          ten_don_vi: formData.ten_don_vi.trim(),
          mo_ta: formData.mo_ta.trim(),
        });
        alert("✅ Cập nhật thành công!");
      } else {
        await axios.post(`${apiUrl}/api/products/units`, {
          ten_don_vi: formData.ten_don_vi.trim(),
          mo_ta: formData.mo_ta.trim(),
        });
        alert("✅ Thêm đơn vị mới thành công!");
      }
      navigate("/admin/products/units");
    } catch (error) {
      alert(
        "❌ Lỗi: " + (error.response?.data?.message || "Không thể lưu đơn vị."),
      );
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
    <div className="p-6 w-full flex-1 font-sans max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate("/admin/products/units")}
          className="p-2.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition shadow-sm"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-800">
            {isEditMode ? "Cập Nhật Đơn Vị" : "Thêm Đơn Vị Mới"}
          </h1>
          <p className="text-xs font-bold text-slate-400 mt-1">
            Thiết lập quy chuẩn đóng gói cho hệ thống
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-8">
        <form onSubmit={handleSubmitForm} className="space-y-6">
          {/* Tên đơn vị */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-2">
              Tên đơn vị <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="VD: Thùng, Lốc, Lon, Túi..."
              value={formData.ten_don_vi}
              onChange={(e) =>
                setFormData({ ...formData, ten_don_vi: e.target.value })
              }
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-[#006c49] transition"
            />
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-2">
              Mô tả chi tiết
            </label>
            <textarea
              rows="4"
              placeholder="Mô tả mục đích sử dụng (VD: Đơn vị tính cho bia lon)..."
              value={formData.mo_ta}
              onChange={(e) =>
                setFormData({ ...formData, mo_ta: e.target.value })
              }
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-[#006c49] transition resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate("/admin/products/units")}
              className="px-6 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={submitLoading}
              className="px-8 py-3 bg-[#006c49] hover:bg-[#005137] text-white text-sm font-bold rounded-xl shadow-md transition active:scale-95 flex items-center gap-2"
            >
              {submitLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {isEditMode ? "Lưu Cập Nhật" : "Hoàn Tất Tạo Mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
