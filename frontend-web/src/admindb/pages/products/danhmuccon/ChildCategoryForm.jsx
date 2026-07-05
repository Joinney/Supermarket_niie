import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
// 🌟 ĐỒNG BỘ: Sử dụng instance productApi trích xuất từ tệp cấu hình Interceptor của bạn
import { productApi } from "../../../../api/axios"; // <--- Hãy điều chỉnh đường dẫn thực tế đến file config Axios của bạn
import { UploadCloud, Loader2, ChevronLeft, Save } from "lucide-react";

export default function ChildCategoryForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [countries, setCountries] = useState([]);
  const [parentCategories, setParentCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false); 
  const fileInputRef = useRef(null);
  const [codeSuffix, setCodeSuffix] = useState("");

  const [formData, setFormData] = useState({
    ma_dm_con: "",
    ma_dm_cha: "",
    ten_danh_muc_con: "",
    ma_quoc_gia: "VN",
    hinh_anh: "",
  });

  // Khởi tạo dữ liệu via productApi Interceptor
  useEffect(() => {
    const fetchInitData = async () => {
      try {
        setLoading(true);
        // 1. Lấy danh sách quốc gia qua path tương đối
        const resNations = await productApi.get("/nations");
        setCountries(resNations.data.data || []);

        // 2. Lấy danh sách danh mục cha
        const resParents = await productApi.get("/categories/parents?country=ALL");
        setParentCategories(resParents.data.data || []);

        // 3. Nếu đang ở chế độ Sửa, lấy thông tin danh mục con
        if (isEditMode) {
          const resChildren = await productApi.get("/categories/children?country=ALL");

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
  }, [id, navigate, isEditMode]);

  const generatedCode = isEditMode
    ? formData.ma_dm_con
    : codeSuffix
      ? `MDM_${formData.ma_quoc_gia}_${codeSuffix.toUpperCase().replace(/\s+/g, "_")}`
      : "";

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return alert("Vui lòng chọn tệp tin hình ảnh hợp lệ!");
    }

    setUploadingImage(true);
    const uploadData = new FormData();
    uploadData.append("image", file);

    try {
      // 🚀 Đồng bộ luồng upload qua productApi
      const response = await productApi.post("/products/upload", uploadData, { 
        headers: { "Content-Type": "multipart/form-data" } 
      });

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

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.ma_dm_cha) return alert("Vui lòng chọn Danh mục cha!");

    setSubmitLoading(true);

    try {
      const finalPayload = { ...formData };
      if (!isEditMode && codeSuffix.trim() !== "") {
        finalPayload.ma_dm_con = generatedCode;
      }

      if (isEditMode) {
        // 🚀 Đồng bộ các phương thức cập nhật/thêm mới qua productApi
        await productApi.put(`/categories/children/${id}`, finalPayload);
        alert("✅ Cập nhật danh mục con thành công!");
      } else {
        const payload = {
          ...finalPayload,
          duong_dan_seo: formData.ten_danh_muc_con
            .toLowerCase()
            .replace(/ /g, "-")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, ""),
        };
        await productApi.post("/categories/children", payload);
        alert("✅ Thêm danh mục con mới thành công!");
      }
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
      className="w-full min-h-screen bg-[#fafafa] font-sans text-left text-slate-700 selection:bg-emerald-100 p-1 antialiased"
    >
      <div className="w-full">
        {/* HEADER SECTION */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate("/admin/products/child-categories")}
            className="w-11 h-11 bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition shadow-sm shrink-0 cursor-pointer flex items-center justify-center"
            title="Quay lại danh sách"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              {isEditMode ? "Cập nhật danh mục con" : "Thêm danh mục con mới"}
            </h1>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mt-1">
              <span>Tổng hành dinh</span>
              <span>❯</span>
              <span>Danh mục con</span>
              <span>❯</span>
              <span className="text-emerald-700 font-bold">
                {isEditMode ? "Cập nhật" : "Khởi tạo mới"}
              </span>
            </div>
          </div>
        </div>

        {/* MAIN CONTAINER */}
        <div className="w-full bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100 relative">
          <form onSubmit={handleSubmitForm} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Tên Danh Mục Con */}
              <div className="md:col-span-2 space-y-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
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
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-50 transition"
                />
              </div>

              {/* Phân vùng thị trường */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Phân vùng thị trường
                </label>
                <select
                  value={formData.ma_quoc_gia}
                  onChange={(e) =>
                    setFormData({ ...formData, ma_quoc_gia: e.target.value })
                  }
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer"
                >
                  {countries.map((c) => (
                    <option key={c.ma_quoc_gia} value={c.ma_quoc_gia}>
                      {c.bieu_tuong_co} {c.ten_quoc_gia}
                    </option>
                  ))}
                </select>
              </div>

              {/* Danh Mục Cha */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Thuộc Danh Mục Cha <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.ma_dm_cha}
                  onChange={(e) =>
                    setFormData({ ...formData, ma_dm_cha: e.target.value })
                  }
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 cursor-pointer"
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
              <div className="md:col-span-2 space-y-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Mã định danh danh mục con (Tùy chọn)
                </label>

                {isEditMode ? (
                  <input
                    type="text"
                    value={formData.ma_dm_con}
                    disabled
                    className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-400 outline-none cursor-not-allowed"
                  />
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Ví dụ: SNACK, HEALTH, NOODLE..."
                      value={codeSuffix}
                      onChange={(e) => setCodeSuffix(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-50 transition"
                    />
                    {generatedCode && (
                      <p className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 mt-1 font-mono w-fit">
                        Khớp mã: {generatedCode}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Hình ảnh danh mục con */}
              <div className="md:col-span-2 space-y-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Hình ảnh phân loại con
                </label>
                <div className="flex gap-4 items-start flex-col sm:flex-row">
                  <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-slate-50 border border-slate-200 flex items-center justify-center relative shadow-inner">
                    {formData.hinh_anh ? (
                      <img
                        src={formData.hinh_anh}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[9px] text-slate-400 font-black uppercase">Trống</span>
                    )}
                    {uploadingImage && (
                      <div className="absolute inset-0 bg-white/70 flex items-center justify-center backdrop-blur-xs">
                        <Loader2 size={16} className="animate-spin text-emerald-700" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2 w-full">
                    <button
                      type="button"
                      disabled={uploadingImage}
                      onClick={() => fileInputRef.current.click()}
                      className="w-full py-2 border border-dashed border-slate-300 rounded-xl flex items-center justify-center gap-1.5 text-xs text-slate-600 hover:border-emerald-600 hover:bg-emerald-50/20 transition font-bold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <UploadCloud size={14} /> 
                      {uploadingImage ? "Đang đồng bộ..." : "Tải ảnh cục bộ"}
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    
                    <div className="flex items-center gap-2">
                      <div className="h-[1px] bg-slate-100 flex-1"></div>
                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider">Hoặc sử dụng URL</span>
                      <div className="h-[1px] bg-slate-100 flex-1"></div>
                    </div>

                    <input
                      type="url"
                      placeholder="https://giao-dien-anh..."
                      value={formData.hinh_anh.startsWith("http") ? formData.hinh_anh : ""}
                      onChange={(e) =>
                        setFormData({ ...formData, hinh_anh: e.target.value })
                      }
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-emerald-600 transition"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* BUTTONS XÁC NHẬN */}
            <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-end gap-3 text-xs font-bold">
              <button
                type="button"
                onClick={() => navigate("/admin/products/child-categories")}
                className="px-5 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={submitLoading || uploadingImage}
                className="flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm hover:shadow transition transform active:scale-98 cursor-pointer disabled:opacity-50"
              >
                {submitLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                {isEditMode ? "Lưu cập nhật" : "Hoàn tất cấu trúc"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
}