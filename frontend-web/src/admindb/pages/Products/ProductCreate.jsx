import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ChevronLeft, X, Loader2, UploadCloud, Save } from "lucide-react";

export default function ProductCreate() {
  const navigate = useNavigate();

  // =======================================================================
  // 1. STATE CHÍNH: TẠO SẢN PHẨM
  // =======================================================================
  const [formData, setFormData] = useState({
    ten_san_pham: "",
    ma_dm_con: "",
    ma_quoc_gia: "VN",
    xuat_xu: "",
    mo_ta: "",
  });

  const [parents, setParents] = useState([]);
  const [children, setChildren] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [filter, setFilter] = useState({ ma_dm_cha: "" });
  const [isCustomOrigin, setIsCustomOrigin] = useState(false);

  // =======================================================================
  // 2. STATE POPUP: TẠO NHANH DANH MỤC CHA
  // =======================================================================
  const [showParentModal, setShowParentModal] = useState(false);
  const [isCreatingParent, setIsCreatingParent] = useState(false);
  const parentFileInputRef = useRef(null);

  const [newParentName, setNewParentName] = useState("");
  const [parentCodeSuffix, setParentCodeSuffix] = useState("");
  const [parentImage, setParentImage] = useState("");

  const generatedParentCode = parentCodeSuffix
    ? `MDC_${formData.ma_quoc_gia}_${parentCodeSuffix.toUpperCase().replace(/\s+/g, "_")}`
    : "";

  // =======================================================================
  // 3. STATE POPUP: TẠO NHANH DANH MỤC CON
  // =======================================================================
  const [showChildModal, setShowChildModal] = useState(false);
  const [isCreatingChild, setIsCreatingChild] = useState(false);
  const childFileInputRef = useRef(null);

  const [newChildName, setNewChildName] = useState("");
  const [childCodeSuffix, setChildCodeSuffix] = useState("");
  const [childImage, setChildImage] = useState("");

  const generatedChildCode = childCodeSuffix
    ? `MDM_${formData.ma_quoc_gia}_${childCodeSuffix.toUpperCase().replace(/\s+/g, "_")}`
    : "";

  const apiUrl =
    import.meta.env.VITE_API_PRODUCT_URL || "http://localhost:5002";

  // Nạp danh mục khởi tạo
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const [resParents, resCat] = await Promise.all([
          axios.get(`${apiUrl}/api/categories/parents?country=ALL`),
          axios.get(`${apiUrl}/api/categories/children?country=ALL`),
        ]);
        setParents(resParents.data.data || []);
        setChildren(resCat.data.data || resCat.data || []);
      } catch (err) {
        console.error("Lỗi nạp danh mục:", err);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, [apiUrl]);

  // Reset filter & danh mục con khi đổi quốc gia
  useEffect(() => {
    setFilter({ ma_dm_cha: "" });
    setFormData((prev) => ({ ...prev, ma_dm_con: "" }));
  }, [formData.ma_quoc_gia]);

  // --- XỬ LÝ ẢNH DANH MỤC CHA & CON ---
  const handleParentFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setParentImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleChildFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setChildImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // --- SUBMIT TẠO DANH MỤC CHA ---
  const handleCreateParent = async (e) => {
    e.preventDefault();
    if (!newParentName.trim()) return;
    setIsCreatingParent(true);
    try {
      const payload = {
        ma_dm_cha: generatedParentCode || null,
        ten_danh_muc_cha: newParentName,
        ma_quoc_gia: formData.ma_quoc_gia,
        hinh_anh: parentImage,
        duong_dan_seo: newParentName
          .toLowerCase()
          .replace(/ /g, "-")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, ""),
      };

      const res = await axios.post(`${apiUrl}/api/categories/parents`, payload);
      const newParent = res.data.data;

      setParents([...parents, newParent]);
      setFilter({ ma_dm_cha: newParent.ma_dm_cha });

      setShowParentModal(false);
      setNewParentName("");
      setParentCodeSuffix("");
      setParentImage("");
    } catch (err) {
      alert(
        "Lỗi: " + (err.response?.data?.message || "Không thể tạo danh mục cha"),
      );
    } finally {
      setIsCreatingParent(false);
    }
  };

  // --- SUBMIT TẠO DANH MỤC CON ---
  const handleCreateChild = async (e) => {
    e.preventDefault();
    if (!newChildName.trim() || !filter.ma_dm_cha) return;
    setIsCreatingChild(true);
    try {
      const payload = {
        ma_dm_con: generatedChildCode || null,
        ten_danh_muc_con: newChildName,
        ma_dm_cha: filter.ma_dm_cha,
        ma_quoc_gia: formData.ma_quoc_gia,
        hinh_anh: childImage,
        duong_dan_seo: newChildName
          .toLowerCase()
          .replace(/ /g, "-")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, ""),
      };

      const res = await axios.post(
        `${apiUrl}/api/categories/children`,
        payload,
      );
      const newChild = res.data.data;

      setChildren([...children, newChild]);
      setFormData({ ...formData, ma_dm_con: newChild.ma_dm_con });

      setShowChildModal(false);
      setNewChildName("");
      setChildCodeSuffix("");
      setChildImage("");
    } catch (err) {
      alert(
        "Lỗi: " + (err.response?.data?.message || "Không thể tạo danh mục con"),
      );
    } finally {
      setIsCreatingChild(false);
    }
  };

  // --- SUBMIT TẠO SẢN PHẨM ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await axios.post(`${apiUrl}/api/products`, formData);
      if (response.data?.success) {
        alert(
          "🎉 Sản phẩm đã được tạo lập thành công! Hệ thống AI đang sinh mô tả tự động.",
        );
        navigate("/admin/products");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Gặp sự cố khi thêm mới sản phẩm.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="p-6 w-full flex-1 font-sans bg-[#fafafa] min-h-screen relative"
    >
      <div className="max-w-4xl mx-auto">
        {/* HEADER SẢN PHẨM */}
        <div className="flex items-center gap-4 mb-8">
          <button
            type="button"
            onClick={() => navigate("/admin/products")}
            className="w-11 h-11 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition shadow-sm shrink-0"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              Thêm Sản Phẩm Mới
            </h1>
            <p className="text-xs font-bold text-slate-400 mt-1">
              Điền các thông tin cơ bản để khởi tạo sản phẩm vào hệ thống
            </p>
          </div>
        </div>

        {/* FORM SẢN PHẨM CHÍNH */}
        <div className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-200/80 relative z-10">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-bold text-center">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* TÊN SẢN PHẨM */}
            <div>
              <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-2 tracking-wide">
                Tên sản phẩm <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Trà Đông Trai Cozy"
                value={formData.ten_san_pham}
                onChange={(e) =>
                  setFormData({ ...formData, ten_san_pham: e.target.value })
                }
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 placeholder-slate-300 outline-none focus:border-[#006c49] transition"
              />
            </div>

            {/* QUỐC GIA */}
            <div>
              <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-3 tracking-wide">
                Thị trường phân phối
              </label>
              <div className="flex items-center gap-6 bg-slate-50 p-3.5 rounded-xl border border-slate-100 w-fit">
                {["VN", "US", "CN"].map((country) => (
                  <label
                    key={country}
                    className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-700 hover:text-slate-900"
                  >
                    <input
                      type="radio"
                      name="ma_quoc_gia"
                      value={country}
                      checked={formData.ma_quoc_gia === country}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          ma_quoc_gia: e.target.value,
                        })
                      }
                      className="w-4 h-4 text-[#006c49] focus:ring-[#006c49] border-slate-300 cursor-pointer"
                    />
                    {country === "VN"
                      ? "🇻🇳 Việt Nam (VN)"
                      : country === "US"
                        ? "🇺🇸 Mỹ (US)"
                        : "🇨🇳 Trung Quốc (CN)"}
                  </label>
                ))}
              </div>
            </div>

            {/* CASCADING GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* DANH MỤC CHA */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-2 tracking-wide">
                  Danh mục Cha
                </label>
                <select
                  value={filter.ma_dm_cha}
                  onChange={(e) => {
                    if (e.target.value === "create_new_parent") {
                      setShowParentModal(true);
                    } else {
                      setFilter({ ma_dm_cha: e.target.value });
                      setFormData({ ...formData, ma_dm_con: "" });
                    }
                  }}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-[#006c49] transition cursor-pointer"
                >
                  <option value="">-- Chọn danh mục cha --</option>
                  {parents
                    .filter((p) => p.ma_quoc_gia === formData.ma_quoc_gia)
                    .map((p) => (
                      <option key={p.ma_dm_cha} value={p.ma_dm_cha}>
                        {p.ten_danh_muc_cha}
                      </option>
                    ))}
                  <option
                    value="create_new_parent"
                    className="font-bold text-[#006c49]"
                  >
                    ➕ Nhập danh mục mới...
                  </option>
                </select>
              </div>

              {/* DANH MỤC CON */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-2 tracking-wide">
                  Danh mục con <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.ma_dm_con}
                  disabled={!filter.ma_dm_cha}
                  onChange={(e) => {
                    if (e.target.value === "create_new_child") {
                      setShowChildModal(true);
                    } else {
                      setFormData({ ...formData, ma_dm_con: e.target.value });
                    }
                  }}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-[#006c49] transition cursor-pointer disabled:bg-slate-50 disabled:text-slate-400"
                >
                  <option value="">
                    {filter.ma_dm_cha
                      ? "-- Chọn danh mục con --"
                      : "Vui lòng chọn cha trước"}
                  </option>
                  {children
                    .filter((c) => c.ma_dm_cha === filter.ma_dm_cha)
                    .map((cat) => (
                      <option key={cat.ma_dm_con} value={cat.ma_dm_con}>
                        {cat.ten_danh_muc_con}
                      </option>
                    ))}
                  {filter.ma_dm_cha && (
                    <option
                      value="create_new_child"
                      className="font-bold text-[#006c49]"
                    >
                      ➕ Nhập danh mục con mới...
                    </option>
                  )}
                </select>
              </div>

              {/* XUẤT XỨ */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-2 tracking-wide">
                  Xuất xứ
                </label>
                {isCustomOrigin ? (
                  <div className="flex gap-2 relative">
                    <input
                      type="text"
                      autoFocus
                      placeholder="VD: Đức, Pháp..."
                      value={formData.xuat_xu}
                      onChange={(e) =>
                        setFormData({ ...formData, xuat_xu: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-white border border-[#006c49] rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#006c49]/20 transition pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomOrigin(false);
                        setFormData({ ...formData, xuat_xu: "" });
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                      title="Hủy nhập"
                    >
                      <X size={16} strokeWidth={3} />
                    </button>
                  </div>
                ) : (
                  <select
                    value={formData.xuat_xu || ""}
                    onChange={(e) => {
                      if (e.target.value === "custom") {
                        setIsCustomOrigin(true);
                        setFormData({ ...formData, xuat_xu: "" });
                      } else {
                        setFormData({ ...formData, xuat_xu: e.target.value });
                      }
                    }}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-[#006c49] transition cursor-pointer"
                  >
                    <option value="" disabled>
                      -- Chọn xuất xứ --
                    </option>
                    <option value="Sản xuất nội địa (Việt Nam)">
                      Sản xuất nội địa (Việt Nam)
                    </option>
                    <option value="Hàng nhập khẩu chung">
                      Hàng nhập khẩu chung
                    </option>
                    <option value="Nhật Bản">Nhật Bản</option>
                    <option value="Hàn Quốc">Hàn Quốc</option>
                    <option value="Trung Quốc">Trung Quốc</option>
                    <option value="Mỹ">Mỹ</option>
                    <option value="custom" className="font-bold text-[#006c49]">
                      ➕ Nhập xuất xứ khác...
                    </option>
                  </select>
                )}
              </div>
            </div>

            {/* MÔ TẢ */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wide">
                  Mô tả chi tiết
                </label>
                <span className="text-[10px] text-[#006c49] font-bold bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                  ✨ Để trống sẽ tự động sinh bằng AI
                </span>
              </div>
              <textarea
                rows="5"
                placeholder="Nhập mô tả sản phẩm chủ động hoặc bỏ trống để hệ thống AI tự phân tích và sinh văn bản tự động..."
                value={formData.mo_ta}
                onChange={(e) =>
                  setFormData({ ...formData, mo_ta: e.target.value })
                }
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 placeholder-slate-300 outline-none focus:border-[#006c49] transition resize-none leading-relaxed"
              />
            </div>

            {/* BUTTONS SẢN PHẨM */}
            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate("/admin/products")}
                className="px-6 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-xl transition"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3 bg-[#006c49] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#005137] transition active:scale-95 shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Đang xử lý...
                  </>
                ) : (
                  "Hoàn Tất Tạo Mới"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ========================================================================================================= */}
      {/* ======================================= MODAL TẠO NHANH DANH MỤC CHA ==================================== */}
      {/* ========================================================================================================= */}
      <AnimatePresence>
        {showParentModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowParentModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative z-10"
            >
              <div className="sticky top-0 bg-white/90 backdrop-blur-md z-20 px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-black text-slate-800">
                    Thêm Danh Mục Cha Mới
                  </h3>
                  <p className="text-xs font-bold text-slate-400 mt-1">
                    Điền các thông tin cơ bản để tạo mới
                  </p>
                </div>
                <button
                  onClick={() => setShowParentModal(false)}
                  className="w-10 h-10 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full flex items-center justify-center transition"
                >
                  <X size={20} strokeWidth={2.5} />
                </button>
              </div>

              <form onSubmit={handleCreateParent} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Tên & Thị trường */}
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-2">
                      Tên danh mục <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder="Ví dụ: Đồ uống nhập khẩu"
                      value={newParentName}
                      onChange={(e) => setNewParentName(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-[#006c49] transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-2">
                      Thị trường Quốc gia
                    </label>
                    <div className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 cursor-not-allowed">
                      {formData.ma_quoc_gia === "VN"
                        ? "🇻🇳 Việt Nam (VN)"
                        : formData.ma_quoc_gia === "US"
                          ? "🇺🇸 Mỹ (US)"
                          : "🇨🇳 Trung Quốc (CN)"}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-2">
                      Mã danh mục (Tùy chọn)
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: SNACK, TEA, HEALTH"
                      value={parentCodeSuffix}
                      onChange={(e) => setParentCodeSuffix(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-[#006c49] transition"
                    />
                    {generatedParentCode && (
                      <p className="text-[11px] font-bold text-[#006c49] bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                        Mã dự kiến:{" "}
                        <span className="font-mono text-xs">
                          {generatedParentCode}
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Hình ảnh */}
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-2">
                      Hình ảnh Danh mục
                    </label>
                    <div className="flex flex-col sm:flex-row gap-4 items-start">
                      <div className="w-32 h-32 shrink-0 rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 flex items-center justify-center shadow-inner">
                        {parentImage ? (
                          <img
                            src={parentImage}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            No Image
                          </span>
                        )}
                      </div>
                      <div className="flex-1 space-y-3 w-full">
                        <button
                          type="button"
                          onClick={() => parentFileInputRef.current.click()}
                          className="w-full p-3 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center gap-2 text-sm text-slate-600 hover:border-[#006c49] hover:bg-emerald-50 hover:text-[#006c49] transition font-bold"
                        >
                          <UploadCloud size={18} /> Chọn ảnh từ máy tính
                        </button>
                        <input
                          type="file"
                          ref={parentFileInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={handleParentFileChange}
                        />
                        <div className="flex items-center gap-3">
                          <div className="h-px bg-slate-200 flex-1"></div>
                          <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                            Hoặc dán URL
                          </span>
                          <div className="h-px bg-slate-200 flex-1"></div>
                        </div>
                        <input
                          type="url"
                          placeholder="https://example.com/image.jpg"
                          value={
                            parentImage.startsWith("http") ? parentImage : ""
                          }
                          onChange={(e) => setParentImage(e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:border-[#006c49] transition"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowParentModal(false)}
                    className="px-6 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingParent}
                    className="px-8 py-3 bg-[#006c49] text-white rounded-xl text-sm font-bold hover:bg-[#005137] flex gap-2 items-center transition shadow-md active:scale-95"
                  >
                    {isCreatingParent ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Save size={18} />
                    )}{" "}
                    Hoàn Tất Tạo Mới
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================================================= */}
      {/* ======================================= MODAL TẠO NHANH DANH MỤC CON ==================================== */}
      {/* ========================================================================================================= */}
      <AnimatePresence>
        {showChildModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowChildModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative z-10"
            >
              <div className="sticky top-0 bg-white/90 backdrop-blur-md z-20 px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-black text-slate-800">
                    Thêm Danh Mục Con Mới
                  </h3>
                  <p className="text-xs font-bold text-slate-400 mt-1">
                    Điền các thông tin cơ bản để tạo mới
                  </p>
                </div>
                <button
                  onClick={() => setShowChildModal(false)}
                  className="w-10 h-10 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full flex items-center justify-center transition"
                >
                  <X size={20} strokeWidth={2.5} />
                </button>
              </div>

              <form onSubmit={handleCreateChild} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Tên Danh Mục Con */}
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-2">
                      Tên danh mục con <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder="Ví dụ: Nước ngọt có gas"
                      value={newChildName}
                      onChange={(e) => setNewChildName(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-[#006c49] transition"
                    />
                  </div>

                  {/* Quốc gia & Danh mục cha (Khóa, tự động ăn theo) */}
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-2">
                      Thị trường Quốc gia
                    </label>
                    <div className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 cursor-not-allowed">
                      {formData.ma_quoc_gia === "VN"
                        ? "🇻🇳 Việt Nam (VN)"
                        : formData.ma_quoc_gia === "US"
                          ? "🇺🇸 Mỹ (US)"
                          : "🇨🇳 Trung Quốc (CN)"}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-2">
                      Thuộc Danh mục Cha
                    </label>
                    <div className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-emerald-700 cursor-not-allowed border-l-4 border-l-emerald-500">
                      {parents.find((p) => p.ma_dm_cha === filter.ma_dm_cha)
                        ?.ten_danh_muc_cha || "Lỗi: Chưa có danh mục cha"}
                    </div>
                  </div>

                  {/* Mã Danh Mục Con */}
                  <div className="md:col-span-2 space-y-2">
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-2">
                      Mã danh mục con (Tùy chọn)
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: SNACK, HEALTH, NOODLE..."
                      value={childCodeSuffix}
                      onChange={(e) => setChildCodeSuffix(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-[#006c49] transition"
                    />
                    {generatedChildCode && (
                      <p className="text-[11px] font-bold text-[#006c49] bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 w-fit">
                        Mã dự kiến:{" "}
                        <span className="font-mono text-xs">
                          {generatedChildCode}
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Hình ảnh */}
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-2">
                      Hình ảnh Danh mục Con
                    </label>
                    <div className="flex flex-col sm:flex-row gap-4 items-start">
                      <div className="w-32 h-32 shrink-0 rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 flex items-center justify-center shadow-inner">
                        {childImage ? (
                          <img
                            src={childImage}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center p-2">
                            No Image
                          </span>
                        )}
                      </div>
                      <div className="flex-1 space-y-3 w-full">
                        <button
                          type="button"
                          onClick={() => childFileInputRef.current.click()}
                          className="w-full p-3 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center gap-2 text-sm text-slate-600 hover:border-[#006c49] hover:bg-emerald-50 hover:text-[#006c49] transition font-bold"
                        >
                          <UploadCloud size={18} /> Chọn ảnh từ máy tính
                        </button>
                        <input
                          type="file"
                          ref={childFileInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={handleChildFileChange}
                        />
                        <div className="flex items-center gap-3">
                          <div className="h-px bg-slate-200 flex-1"></div>
                          <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                            Hoặc dán URL
                          </span>
                          <div className="h-px bg-slate-200 flex-1"></div>
                        </div>
                        <input
                          type="url"
                          placeholder="https://example.com/image.jpg"
                          value={
                            childImage.startsWith("http") ? childImage : ""
                          }
                          onChange={(e) => setChildImage(e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:border-[#006c49] transition"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowChildModal(false)}
                    className="px-6 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingChild}
                    className="px-8 py-3 bg-[#006c49] text-white rounded-xl text-sm font-bold hover:bg-[#005137] flex gap-2 items-center transition shadow-md active:scale-95"
                  >
                    {isCreatingChild ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Save size={18} />
                    )}{" "}
                    Hoàn Tất Tạo Mới
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
