import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { UploadCloud, Loader2, ChevronLeft, Save } from "lucide-react";

export default function ParentCategoryForm() {
  const { id } = useParams(); // Lấy mã danh mục từ URL (nếu có)
  const navigate = useNavigate();
  const isEditMode = Boolean(id); // Nếu có ID trên URL thì là chế độ Sửa

  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(isEditMode);
  const [submitLoading, setSubmitLoading] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    ma_dm_cha: "",
    ten_danh_muc_cha: "",
    ma_quoc_gia: "VN",
    hinh_anh: "",
    bieu_tuong: "",
  });

  const apiUrl =
    import.meta.env.VITE_API_PRODUCT_URL || "http://localhost:5002";

  // Khởi tạo dữ liệu (Lấy danh sách quốc gia + Lấy dữ liệu cũ nếu đang Sửa)
  useEffect(() => {
    const fetchInitData = async () => {
      try {
        // 1. Lấy danh sách quốc gia
        const resCountries = await axios.get(
          `${apiUrl}/api/categories/countries`,
        );
        setCountries(resCountries.data);

        // 2. Nếu là chế độ sửa, lấy thông tin danh mục đổ vào form
        if (isEditMode) {
          // Tạm thời gọi API lấy danh sách cha (country=ALL) rồi lọc ra mã cần sửa
          const resParents = await axios.get(
            `${apiUrl}/api/categories/parents?country=ALL`,
          );
          const targetCategory = resParents.data.data.find(
            (p) => p.ma_dm_cha === id,
          );

          if (targetCategory) {
            setFormData({
              ma_dm_cha: targetCategory.ma_dm_cha,
              ten_danh_muc_cha: targetCategory.ten_danh_muc_cha,
              ma_quoc_gia: targetCategory.ma_quoc_gia,
              hinh_anh: targetCategory.hinh_anh || "",
              bieu_tuong: targetCategory.bieu_tuong || "",
            });
          } else {
            alert("Không tìm thấy dữ liệu danh mục này!");
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
  }, [id, apiUrl, navigate]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () =>
        setFormData({ ...formData, hinh_anh: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);

    try {
      if (isEditMode) {
        // CHẾ ĐỘ SỬA
        await axios.put(`${apiUrl}/api/categories/parents/${id}`, formData);
        alert("✅ Cập nhật danh mục thành công!");
      } else {
        // CHẾ ĐỘ THÊM
        const payload = {
          ...formData,
          duong_dan_seo: formData.ten_danh_muc_cha
            .toLowerCase()
            .replace(/ /g, "-")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, ""), // Sinh slug SEO
        };
        await axios.post(`${apiUrl}/api/categories/parents`, payload);
        alert("✅ Thêm danh mục mới thành công!");
      }

      // Thành công thì chuyển hướng về lại trang danh sách
      navigate("/admin/products/parent-categories");
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
          onClick={() => navigate("/admin/products/parent-categories")}
          className="p-2.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition shadow-sm"
          title="Quay lại danh sách"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-800">
            {isEditMode ? "Cập Nhật Danh Mục Cha" : "Thêm Danh Mục Cha Mới"}
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
            {/* Tên Danh Mục */}
            <div className="md:col-span-2">
              <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-2">
                Tên danh mục <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Đồ uống nhập khẩu"
                value={formData.ten_danh_muc_cha}
                onChange={(e) =>
                  setFormData({ ...formData, ten_danh_muc_cha: e.target.value })
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
                onChange={(e) =>
                  setFormData({ ...formData, ma_quoc_gia: e.target.value })
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

            {/* Mã Danh Mục (Khóa lại nếu đang sửa) */}
            <div>
              <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-2">
                Mã danh mục (Tùy chọn)
              </label>
              <input
                type="text"
                placeholder={
                  isEditMode
                    ? "Không thể sửa mã danh mục"
                    : "Để trống hệ thống sẽ tự cấp"
                }
                value={formData.ma_dm_cha}
                disabled={isEditMode} // Không cho sửa mã khi đang ở chế độ Edit
                onChange={(e) =>
                  setFormData({ ...formData, ma_dm_cha: e.target.value })
                }
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-[#006c49] transition disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Hình ảnh */}
            <div className="md:col-span-2">
              <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-2">
                Hình ảnh Danh mục
              </label>
              <div className="flex gap-4 items-start">
                {/* Image Preview (Nếu có ảnh) */}
                <div className="w-24 h-24 shrink-0 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                  {formData.hinh_anh ? (
                    <img
                      src={formData.hinh_anh}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] text-slate-400 font-bold uppercase">
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
              onClick={() => navigate("/admin/products/parent-categories")}
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
