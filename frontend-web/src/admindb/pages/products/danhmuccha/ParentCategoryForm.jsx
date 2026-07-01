import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { UploadCloud, Loader2, ChevronLeft, Save, Smile } from "lucide-react";

export default function ParentCategoryForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(isEditMode);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false); // 🌟 Thêm state loading cho ảnh
  const fileInputRef = useRef(null);
  const [codeSuffix, setCodeSuffix] = useState("");

  const [formData, setFormData] = useState({
    ma_dm_cha: "",
    ten_danh_muc_cha: "",
    ma_quoc_gia: "VN",
    hinh_anh: "",
    bieu_tuong: "", // Đã có sẵn state bieu_tuong
  });

  const apiUrl =
    import.meta.env.VITE_API_PRODUCT_URL || "http://localhost:5002";

  // Khởi tạo dữ liệu
  useEffect(() => {
    const fetchInitData = async () => {
      try {
        setLoading(true);
        const resNations = await axios.get(`${apiUrl}/api/nations`);
        setCountries(resNations.data.data || []);

        if (isEditMode) {
          const resParents = await axios.get(
            `${apiUrl}/api/categories/parents?country=ALL`,
          );
          const parentList = resParents.data.data || [];
          const targetCategory = parentList.find((p) => p.ma_dm_cha === id);

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
  }, [id, apiUrl, navigate, isEditMode]);

  // 🌟 ĐÃ NÂNG CẤP LÊN CLOUDINARY UPLOAD TỪ LOCAL
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return alert("Vui lòng chọn tệp tin hình ảnh hợp lệ!");
    }

    setUploadingImage(true);
    const uploadData = new FormData();
    uploadData.append("image", file); // Tên field có thể là 'image' hoặc 'file' tùy backend của bạn

    try {
      // Gọi chung API upload ảnh mà bạn đã dùng ở trang Sản phẩm
      const response = await axios.post(
        `${apiUrl}/api/products/upload`,
        uploadData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      if (response.data && response.data.url) {
        setFormData({ ...formData, hinh_anh: response.data.url });
      }
    } catch (err) {
      alert("Gặp sự cố khi upload ảnh lên Cloudinary!");
      console.error(err);
    } finally {
      setUploadingImage(false);
    }
  };

  const generatedCode = isEditMode
    ? formData.ma_dm_cha
    : codeSuffix
      ? `MDC_${formData.ma_quoc_gia}_${codeSuffix.toUpperCase().replace(/\s+/g, "_")}`
      : "";

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);

    try {
      const finalPayload = { ...formData };
      if (!isEditMode && codeSuffix.trim() !== "") {
        finalPayload.ma_dm_cha = generatedCode;
      }

      if (isEditMode) {
        await axios.put(`${apiUrl}/api/categories/parents/${id}`, finalPayload);
        alert("✅ Cập nhật danh mục thành công!");
      } else {
        const payload = {
          ...finalPayload,
          duong_dan_seo: formData.ten_danh_muc_cha
            .toLowerCase()
            .replace(/ /g, "-")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, ""),
        };
        await axios.post(`${apiUrl}/api/categories/parents`, payload);
        alert("✅ Thêm danh mục mới thành công!");
      }
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

            {/* Thị trường Quốc gia */}
            <div>
              <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-2">
                Thị trường Quốc gia
              </label>
              <select
                value={formData.ma_quoc_gia}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    ma_quoc_gia: e.target.value,
                  })
                }
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-[#006c49] transition cursor-pointer appearance-none"
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

              {isEditMode ? (
                <input
                  type="text"
                  value={formData.ma_dm_cha}
                  disabled
                  className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 cursor-not-allowed"
                />
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Ví dụ: SNACK, TEA, HEALTH"
                    value={codeSuffix}
                    onChange={(e) => setCodeSuffix(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-[#006c49] transition"
                  />
                  {generatedCode && (
                    <p className="text-[11px] font-bold text-[#006c49] bg-emerald-50 px-3 py-1 rounded-lg">
                      Mã dự kiến:{" "}
                      <span className="font-mono">{generatedCode}</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* 🌟 Biểu tượng Danh Mục (Emoji) */}
            <div className="md:col-span-2">
              <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-2 flex items-center gap-1.5">
                <Smile size={14} className="text-amber-500" /> Biểu tượng
                (Emoji)
              </label>
              <input
                type="text"
                placeholder="Ví dụ: 🍬, 🥤, 🌶️..."
                value={formData.bieu_tuong}
                onChange={(e) =>
                  setFormData({ ...formData, bieu_tuong: e.target.value })
                }
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-[#006c49] transition"
              />
            </div>

            {/* Hình ảnh */}
            <div className="md:col-span-2">
              <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-2">
                Hình ảnh Danh mục
              </label>
              <div className="flex gap-4 items-start">
                <div className="w-24 h-24 shrink-0 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center relative">
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
                  {/* Overlay loading khi đang upload ảnh */}
                  {uploadingImage && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center backdrop-blur-sm">
                      <Loader2
                        size={20}
                        className="animate-spin text-[#006c49]"
                      />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-3">
                  <button
                    type="button"
                    disabled={uploadingImage}
                    onClick={() => fileInputRef.current.click()}
                    className="w-full p-3 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center gap-2 text-sm text-slate-600 hover:border-[#006c49] hover:bg-[#006c49]/5 transition font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <UploadCloud size={18} />{" "}
                    {uploadingImage
                      ? "Đang tải ảnh..."
                      : "Chọn ảnh từ máy tính"}
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
              disabled={submitLoading || uploadingImage}
              className="px-8 py-3 bg-[#006c49] hover:bg-[#005137] text-white text-sm font-bold rounded-xl shadow-md transition active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
