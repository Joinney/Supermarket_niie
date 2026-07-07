import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
// 🌟 ĐỒNG BỘ: Sử dụng instance productApi từ file config Axios chung của bạn
import { productApi } from "../../../../api/axios"; // <--- Hãy điều chỉnh đường dẫn thực tế đến file config Axios của bạn
import { Loader2, ChevronLeft, Save } from "lucide-react";

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

  // 1. TẢI DỮ LIỆU NẾU LÀ CHẾ ĐỘ SỬA VIA INTERCEPTOR
  useEffect(() => {
    if (isEditMode) {
      const fetchUnitDetail = async () => {
        try {
          // 🚀 TỐI ƯU: Gọi path tương đối ngắn gọn sạch sẽ qua productApi
          const res = await productApi.get("/products/units");
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
  }, [id, isEditMode, navigate]);

  // 2. GỬI DỮ LIỆU QUA INSTANCE CHUNG
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.ten_don_vi.trim())
      return alert("Tên đơn vị không được để trống!");

    setSubmitLoading(true);
    try {
      if (isEditMode) {
        // 🚀 Đồng bộ các phương thức cập nhật/thêm mới qua productApi
        await productApi.put(`/products/units/${id}`, {
          ten_don_vi: formData.ten_don_vi.trim(),
          mo_ta: formData.mo_ta.trim(),
        });
        alert("✅ Cập nhật thành công!");
      } else {
        await productApi.post("/products/units", {
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
      <div className="p-10 flex justify-center text-emerald-700">
        <Loader2 className="animate-spin" size={28} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      /* 🌟 ĐÃ ĐỒNG BỘ: p-1 trải phẳng biên mép 2 bên, nền #fafafa chuẩn hệ thống */
      className="w-full min-h-screen bg-[#fafafa] font-sans text-left text-slate-700 selection:bg-emerald-100 p-1 antialiased"
    >
      <div className="w-full max-w-4xl mx-auto">
        {/* HEADER AREA */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate("/admin/products/units")}
            type="button"
            className="w-11 h-11 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition shadow-sm shrink-0 cursor-pointer"
            title="Quay lại"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              {isEditMode ? "Cập nhật đơn vị tính" : "Thêm đơn vị tính mới"}
            </h1>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mt-1">
              <span>Tổng hành dinh</span>
              <span>❯</span>
              <span>Cấu trúc cấu tạo</span>
              <span>❯</span>
              <span className="text-emerald-700 font-bold">Quy chuẩn đóng gói</span>
            </div>
          </div>
        </div>

        {/* MAIN BODY CONTAINER */}
        <div className="w-full bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100 relative">
          <form onSubmit={handleSubmitForm} className="space-y-6">
            {/* Tên đơn vị */}
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Tên đơn vị đóng gói <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Thùng, Lốc, Lon, Chai, Túi, Cái..."
                value={formData.ten_don_vi}
                onChange={(e) =>
                  setFormData({ ...formData, ten_don_vi: e.target.value })
                }
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-50 transition"
              />
            </div>

            {/* Mô tả nghiệp vụ */}
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Mô tả chi tiết phân vùng sử dụng
              </label>
              <textarea
                rows="4"
                placeholder="Mô tả mục đích sử dụng thực tế (Ví dụ: Đơn vị cơ sở quy đổi tính toán cho nước giải khát lon)..."
                value={formData.mo_ta}
                onChange={(e) =>
                  setFormData({ ...formData, mo_ta: e.target.value })
                }
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-50 transition resize-none leading-relaxed"
              />
            </div>

            {/* FOOTER BUTTONS XÁC NHẬN */}
            <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-end gap-3 text-xs font-bold">
              <button
                type="button"
                onClick={() => navigate("/admin/products/units")}
                className="px-5 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={submitLoading}
                className="flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm hover:shadow transition transform active:scale-98 cursor-pointer disabled:opacity-50"
              >
                {submitLoading ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  <Save size={14} />
                )}
                {isEditMode ? "Lưu Cập Nhật" : "Hoàn Tất Tạo Mới"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
}