import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { UploadCloud, Loader2, ChevronLeft, Save } from "lucide-react";

export default function ChildCategoryForm() {
  const { id } = useParams(); // Lấy mã danh mục con từ URL (nếu có)
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [countries, setCountries] = useState([]);
  const [parentCategories, setParentCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    ma_dm_con: "",
    ma_dm_cha: "",
    ten_danh_muc_con: "",
    ma_quoc_gia: "VN",
    hinh_anh: "",
  });

  const apiUrl =
    import.meta.env.VITE_API_PRODUCT_URL || "http://localhost:5002";

  // Khởi tạo dữ liệu (Quốc gia, Danh mục cha, và Dữ liệu sửa)
  useEffect(() => {
    const fetchInitData = async () => {
      try {
        // 1. Lấy danh sách quốc gia
        const resCountries = await axios.get(
          `${apiUrl}/api/categories/countries`,
        );
        setCountries(resCountries.data);

        // 2. Lấy danh sách danh mục cha (để đưa vào dropdown)
        const resParents = await axios.get(
          `${apiUrl}/api/categories/parents?country=ALL`,
        );
        setParentCategories(resParents.data.data || []);

        // 3. Nếu đang ở chế độ Sửa, lấy thông tin danh mục con đó
        if (isEditMode) {
          const resChildren = await axios.get(
            `${apiUrl}/api/categories/children?country=ALL`,
          );
          const targetCategory = resChildren.data.data.find(
            (c) => c.ma_dm_con === id,
          );

          if (targetCategory) {
            setFormData({
              ma_dm_con: targetCategory.ma_dm_con,
              ma_dm_cha: targetCategory.ma_dm_cha,
              ten_danh_muc_con: targetCategory.ten_danh_muc_con,
              ma_quoc_gia: targetCategory.ma_quoc_gia,
              hinh_anh: targetCategory.hinh_anh || "",
            });
          } else {
            alert("Không tìm thấy dữ liệu danh mục con này!");
            navigate(-1);
          }
        }
      } catch (error) {
        console.error("Lỗi khởi tạo dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitData();
  }, [id, apiUrl, navigate, isEditMode]);

  // Xử lý khi user đổi ảnh từ máy
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () =>
        setFormData({ ...formData, hinh_anh: reader.result });
      reader.readAsDataURL(file);
    }
  };

  // Submit Form
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.ma_dm_cha) {
      return alert("Vui lòng chọn Danh mục cha!");
    }

    setSubmitLoading(true);

    try {
      if (isEditMode) {
        await axios.put(`${apiUrl}/api/categories/children/${id}`, formData);
        alert("✅ Cập nhật danh mục con thành công!");
      } else {
        await axios.post(`${apiUrl}/api/categories/children`, formData);
        alert("✅ Thêm danh mục con mới thành công!");
      }

      // Chuyển hướng về trang danh sách
      navigate("/admin/products/child-categories");
    } catch (error) {
      alert(
        "❌ Lỗi: " +
          (error.response?.data?.message || "Không thể lưu dữ liệu."),
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
    <div className="p-6 w-full flex-1 font-sans max-w-4xl mx-auto">
      {/* Header Form */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate("/admin/products/child-categories")}
          className="p-2.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition shadow-sm"
          title="Quay lại danh sách"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-800">
            {isEditMode ? "Cập Nhật Danh Mục Con" : "Thêm Danh Mục Con Mới"}
          </h1>
          <p className="text-xs font-bold text-slate-400 mt-1">
            {isEditMode
              ? `Đang chỉnh sửa mã: ${id}`
              : "Điền các thông tin cơ bản để tạo mới"}
          </p>
        </div>
      </div>

      {/* Main Form Box */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden p-8">
        <form onSubmit={handleSubmitForm} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tên Danh Mục Con */}
            <div className="md:col-span-2">
              <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-2">
                Tên danh mục con <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Nước ngọt có gas"
                value={formData.ten_danh_muc_con}
                onChange={(e) =>
                  setFormData({ ...formData, ten_danh_muc_con: e.target.value })
                }
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-[#006c49] transition"
              />
            </div>

            {/* Quốc Gia */}
            <div>
              <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-2">
                Thị trường Quốc gia
              </label>
              <select
                value={formData.ma_quoc_gia}
                onChange={
                  (e) =>
                    setFormData({
                      ...formData,
                      ma_quoc_gia: e.target.value,
                      ma_dm_cha: "",
                    }) // Reset cha khi đổi quốc gia
                }
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-[#006c49] transition cursor-pointer"
              >
                {countries.map((c) => (
                  <option key={c.ma_quoc_gia} value={c.ma_quoc_gia}>
                    {c.bieu_tuong_co} {c.ten_quoc_gia}
                  </option>
                ))}
              </select>
            </div>

            {/* Danh Mục Cha (Lọc theo Quốc gia) */}
            <div>
              <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-2">
                Thuộc Danh Mục Cha <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.ma_dm_cha}
                onChange={(e) =>
                  setFormData({ ...formData, ma_dm_cha: e.target.value })
                }
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-[#006c49] transition cursor-pointer"
              >
                <option value="">-- Chọn danh mục cha --</option>
                {parentCategories
                  .filter((p) => p.ma_quoc_gia === formData.ma_quoc_gia)
                  .map((p) => (
                    <option key={p.ma_dm_cha} value={p.ma_dm_cha}>
                      {p.ten_danh_muc_cha}
                    </option>
                  ))}
              </select>
            </div>

            {/* Mã Danh Mục Con */}
            <div className="md:col-span-2">
              <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-2">
                Mã danh mục con (Tùy chọn)
              </label>
              <input
                type="text"
                placeholder={
                  isEditMode
                    ? "Không thể sửa mã danh mục"
                    : "Để trống hệ thống sẽ tự cấp (VD: SUB001)"
                }
                value={formData.ma_dm_con}
                disabled={isEditMode}
                onChange={(e) =>
                  setFormData({ ...formData, ma_dm_con: e.target.value })
                }
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-[#006c49] transition disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Hình ảnh */}
            <div className="md:col-span-2">
              <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-2">
                Hình ảnh Danh mục Con
              </label>
              <div className="flex gap-4 items-start">
                <div className="w-24 h-24 shrink-0 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                  {formData.hinh_anh ? (
                    <img
                      src={formData.hinh_anh}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] text-slate-400 font-bold uppercase text-center leading-tight p-2">
                      No Image
                    </span>
                  )}
                </div>

                <div className="flex-1 space-y-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="w-full p-3 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center gap-2 text-sm text-slate-600 hover:border-[#006c49] hover:bg-[#006c49]/5 transition font-bold"
                  >
                    <UploadCloud size={18} /> Chọn ảnh từ máy tính
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <div className="flex items-center gap-3">
                    <div className="h-px bg-slate-200 flex-1"></div>
                    <span className="text-[10px] text-slate-400 font-black uppercase">
                      Hoặc dán URL
                    </span>
                    <div className="h-px bg-slate-200 flex-1"></div>
                  </div>
                  <input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={
                      formData.hinh_anh.startsWith("http")
                        ? formData.hinh_anh
                        : ""
                    }
                    onChange={(e) =>
                      setFormData({ ...formData, hinh_anh: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-[#006c49] transition"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/admin/products/child-categories")}
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
