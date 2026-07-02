import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ChevronLeft,
  X,
  Loader2,
  UploadCloud,
  Save,
  Package,
  Layers,
  Image as ImageIcon,
  CheckCircle2,
} from "lucide-react";

export default function ProductCreate() {
  const navigate = useNavigate();

  // =======================================================================
  // 1. STATE CHÍNH: TẠO SẢN PHẨM
  // =======================================================================
  const [formData, setFormData] = useState({
    ten_san_pham: "",
    ma_dm_con: "",
    ma_quoc_gia: "VN",
    mo_ta: "",
    co_bien_the: false, // Mặc định là Sản phẩm đơn
    sku: "", // Sẽ luôn để trống để Backend tự động sinh mã
    gia_ban: 0,
    so_luong_ton: 0,
    hinh_anh_chinh: "",
  });

  const [variantType, setVariantType] = useState("GROUP");

  const [parents, setParents] = useState([]);
  const [children, setChildren] = useState([]);
  const [nations, setNations] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState("");

  const [filter, setFilter] = useState({ ma_dm_cha: "" });
  const productFileInputRef = useRef(null);

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

  useEffect(() => {
    const fetchInitData = async () => {
      try {
        setLoadingCategories(true);
        const [resParents, resCat, resNations] = await Promise.all([
          axios.get(`${apiUrl}/api/categories/parents?country=ALL`),
          axios.get(`${apiUrl}/api/categories/children?country=ALL`),
          axios.get(`${apiUrl}/api/nations`),
        ]);
        setParents(resParents.data.data || []);
        setChildren(resCat.data.data || resCat.data || []);
        if (resNations.data && resNations.data.success) {
          setNations(resNations.data.data);
        }
      } catch (err) {
        console.error("Lỗi nạp dữ liệu khởi tạo:", err);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchInitData();
  }, [apiUrl]);

  useEffect(() => {
    setFilter({ ma_dm_cha: "" });
    setFormData((prev) => ({ ...prev, ma_dm_con: "" }));
  }, [formData.ma_quoc_gia]);

  const handleProductImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/"))
      return alert("Vui lòng chọn tệp tin hình ảnh!");

    setUploadingImage(true);
    const formUpload = new FormData();
    formUpload.append("image", file);

    try {
      const response = await axios.post(
        `${apiUrl}/api/products/upload`,
        formUpload,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      if (response.data && response.data.url) {
        setFormData({ ...formData, hinh_anh_chinh: response.data.url });
      }
    } catch (err) {
      alert("Lỗi upload ảnh lên hệ thống!");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileChange = (e, setImgState) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImgState(reader.result);
      reader.readAsDataURL(file);
    }
  };

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
      alert("Lỗi tạo danh mục cha");
    } finally {
      setIsCreatingParent(false);
    }
  };

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
      alert("Lỗi tạo danh mục con");
    } finally {
      setIsCreatingChild(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.ma_dm_con) return setError("Vui lòng chọn danh mục con!");
    if (!formData.co_bien_the && formData.gia_ban <= 0)
      return setError("Sản phẩm đơn yêu cầu phải có giá bán hợp lệ!");

    setSubmitting(true);
    setError("");
    try {
      const response = await axios.post(`${apiUrl}/api/products`, formData);

      if (response.data?.success) {
        const newProductId = response.data.data?.ma_san_pham;

        if (formData.co_bien_the) {
          alert(
            "🎉 Khởi tạo sản phẩm thành công! Chuyển sang bước cấu hình chi tiết phân loại.",
          );
          navigate(`/admin/products/create-variant/${newProductId}`, {
            state: {
              initMode: true,
              targetVariantType: variantType,
            },
          });
        } else {
          alert(
            "🎉 Tạo sản phẩm đơn thành công! Đã lưu thông số kho và giá bán.",
          );
          navigate(`/admin/products/detail/${newProductId}`);
        }
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
      className="p-6 w-full flex-1 font-sans bg-[#fafafa] min-h-screen relative text-left"
    >
      <div className="max-w-4xl mx-auto">
        {/* HEADER */}
        <div className="flex items-center gap-4 mb-8">
          <button
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
              Điền thông tin nền tảng để khởi tạo sản phẩm
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

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 1. TÊN VÀ QUỐC GIA */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-slate-100 pb-8">
              <div className="md:col-span-2">
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

              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-2 tracking-wide">
                  Thị trường Quốc gia
                </label>
                <select
                  value={formData.ma_quoc_gia}
                  onChange={(e) =>
                    setFormData({ ...formData, ma_quoc_gia: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-[#006c49] transition cursor-pointer"
                >
                  {nations.map((nation) => (
                    <option key={nation.ma_quoc_gia} value={nation.ma_quoc_gia}>
                      {nation.bieu_tuong_co} {nation.ten_quoc_gia} (
                      {nation.ma_quoc_gia})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 2. CẤU TRÚC BÁN HÀNG */}
            <div className="space-y-6 border-b border-slate-100 pb-8">
              <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wide">
                Cấu trúc bán hàng <span className="text-red-500">*</span>
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nút: Sản phẩm đơn */}
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, co_bien_the: false })
                  }
                  className={`p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden ${!formData.co_bien_the ? "border-[#006c49] bg-emerald-50/50" : "border-slate-200 hover:border-emerald-200"}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`p-2 rounded-lg ${!formData.co_bien_the ? "bg-[#006c49] text-white" : "bg-slate-100 text-slate-500"}`}
                    >
                      <Package size={20} />
                    </div>
                    <h3
                      className={`font-black ${!formData.co_bien_the ? "text-[#006c49]" : "text-slate-700"}`}
                    >
                      Sản Phẩm Đơn
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Bán trực tiếp một lựa chọn duy nhất. Không chia màu sắc,
                    kích thước.
                  </p>
                  {!formData.co_bien_the && (
                    <div className="absolute top-0 right-0 w-16 h-16 bg-[#006c49] opacity-5 rounded-bl-full"></div>
                  )}
                </button>

                {/* Nút: Có biến thể */}
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      co_bien_the: true,
                      gia_ban: 0,
                      so_luong_ton: 0,
                      sku: "",
                    })
                  }
                  className={`p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden ${formData.co_bien_the ? "border-indigo-600 bg-indigo-50/50" : "border-slate-200 hover:border-indigo-200"}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`p-2 rounded-lg ${formData.co_bien_the ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"}`}
                    >
                      <Layers size={20} />
                    </div>
                    <h3
                      className={`font-black ${formData.co_bien_the ? "text-indigo-600" : "text-slate-700"}`}
                    >
                      Có Nhiều Phân Loại
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Khách hàng có thể chọn nhiều biến thể (Ví dụ: Màu sắc, Kích
                    thước).
                  </p>
                  {formData.co_bien_the && (
                    <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-600 opacity-5 rounded-bl-full"></div>
                  )}
                </button>
              </div>

              {/* 🌟 FORM THÔNG SỐ: CHỈ HIỆN KHI LÀ SẢN PHẨM ĐƠN */}
              {!formData.co_bien_the && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-6 p-5 bg-emerald-50/50 border border-emerald-100 rounded-2xl"
                >
                  <h4 className="text-[11px] font-black text-[#006c49] mb-4 uppercase tracking-wider flex items-center gap-1.5">
                    Thông số bán hàng trực tiếp (Sản phẩm đơn)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* 🌟 ĐÃ KHÓA Ô SKU THEO YÊU CẦU */}
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wide">
                        Mã SKU (Tự động)
                      </label>
                      <input
                        type="text"
                        disabled
                        value="Hệ thống tự động tạo mã"
                        className="w-full px-4 py-3 bg-slate-100/70 border border-slate-200 rounded-xl text-xs font-bold text-slate-400 outline-none cursor-not-allowed transition"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wide">
                        Giá Bán Niêm Yết (VND){" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={formData.gia_ban}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            gia_ban: Number(e.target.value),
                          })
                        }
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-black text-[#006c49] outline-none focus:border-[#006c49] transition"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wide">
                        Số lượng trong kho
                      </label>
                      <input
                        type="number"
                        min="0"
                        readOnly
                        value={formData.so_luong_ton}
                        className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-xs font-black text-slate-400 outline-none cursor-not-allowed transition"
                      />
                      <p className="text-[10px] text-slate-400 font-bold italic">
                        * Kho sẽ được cập nhật sau khi tạo các biến thể hoặc qua
                        phiếu nhập kho.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* GIAO DIỆN CHỌN LOẠI BIẾN THỂ KHI CO_BIEN_THE = TRUE */}
              {formData.co_bien_the && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-5 bg-slate-50 border border-slate-200 rounded-2xl"
                >
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wide mb-4">
                    👉 Xác định loại phân loại cho sản phẩm này:
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Lựa chọn 1: Biến thể đơn */}
                    <div
                      onClick={() => setVariantType("SINGLE")}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${variantType === "SINGLE" ? "bg-white border-indigo-500 shadow-sm" : "bg-transparent border-transparent hover:bg-slate-100"}`}
                    >
                      <div
                        className={`mt-0.5 shrink-0 ${variantType === "SINGLE" ? "text-indigo-600" : "text-slate-300"}`}
                      >
                        {variantType === "SINGLE" ? (
                          <CheckCircle2 size={18} className="fill-indigo-100" />
                        ) : (
                          <div className="w-[18px] h-[18px] rounded-full border-2 border-slate-300"></div>
                        )}
                      </div>
                      <div>
                        <h4
                          className={`text-sm font-bold ${variantType === "SINGLE" ? "text-indigo-700" : "text-slate-600"}`}
                        >
                          Biến Thể Đơn Lập
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          Phù hợp sản phẩm có các tên gọi tách rời, không theo
                          ma trận. (VD: "Bản tiêu chuẩn", "Bản cao cấp").
                        </p>
                      </div>
                    </div>

                    {/* Lựa chọn 2: Biến thể nhóm (Ma trận) */}
                    <div
                      onClick={() => setVariantType("GROUP")}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${variantType === "GROUP" ? "bg-white border-indigo-500 shadow-sm" : "bg-transparent border-transparent hover:bg-slate-100"}`}
                    >
                      <div
                        className={`mt-0.5 shrink-0 ${variantType === "GROUP" ? "text-indigo-600" : "text-slate-300"}`}
                      >
                        {variantType === "GROUP" ? (
                          <CheckCircle2 size={18} className="fill-indigo-100" />
                        ) : (
                          <div className="w-[18px] h-[18px] rounded-full border-2 border-slate-300"></div>
                        )}
                      </div>
                      <div>
                        <h4
                          className={`text-sm font-bold ${variantType === "GROUP" ? "text-indigo-700" : "text-slate-600"}`}
                        >
                          Ma Trận Thuộc Tính
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          Phù hợp sản phẩm cấu hình chéo nhiều lớp thuộc tính.
                          (VD: Áo thun Size M - Màu Đỏ).
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* 3. DANH MỤC */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-slate-100 pb-8">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-2 tracking-wide">
                  Danh mục Cha
                </label>
                <select
                  value={filter.ma_dm_cha}
                  onChange={(e) => {
                    if (e.target.value === "create_new_parent")
                      setShowParentModal(true);
                    else {
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

              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-2 tracking-wide">
                  Danh mục con <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.ma_dm_con}
                  disabled={!filter.ma_dm_cha}
                  onChange={(e) => {
                    if (e.target.value === "create_new_child")
                      setShowChildModal(true);
                    else
                      setFormData({ ...formData, ma_dm_con: e.target.value });
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
            </div>

            {/* 4. HÌNH ẢNH CHÍNH & MÔ TẢ */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Khu vực Upload Ảnh */}
              <div className="md:col-span-5 space-y-4">
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wide">
                  Hình ảnh đại diện <span className="text-red-500">*</span>
                </label>
                <div className="w-full aspect-square rounded-2xl overflow-hidden bg-slate-50 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center relative group">
                  {formData.hinh_anh_chinh ? (
                    <>
                      <img
                        src={formData.hinh_anh_chinh}
                        alt="Main"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, hinh_anh_chinh: "" })
                          }
                          className="text-white text-xs font-bold uppercase border border-white px-3 py-1.5 rounded-lg hover:bg-white hover:text-black transition"
                        >
                          Gỡ ảnh
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      {uploadingImage ? (
                        <Loader2 className="animate-spin" size={32} />
                      ) : (
                        <ImageIcon size={32} className="opacity-50" />
                      )}
                      <span className="text-xs font-bold">
                        {uploadingImage ? "Đang tải lên..." : "Chưa có ảnh"}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => productFileInputRef.current.click()}
                    disabled={uploadingImage}
                    className="w-full py-2.5 bg-slate-100 hover:bg-[#006c49] text-slate-600 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <UploadCloud size={16} /> Chọn ảnh từ máy tính
                  </button>
                  <input
                    type="file"
                    ref={productFileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleProductImageUpload}
                  />

                  <div className="flex items-center gap-3">
                    <div className="h-px bg-slate-200 flex-1"></div>
                    <span className="text-[10px] text-slate-400 font-black uppercase">
                      Hoặc dán URL URL
                    </span>
                    <div className="h-px bg-slate-200 flex-1"></div>
                  </div>

                  <input
                    type="url"
                    placeholder="https://..."
                    value={formData.hinh_anh_chinh}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hinh_anh_chinh: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none focus:border-[#006c49] transition"
                  />
                </div>
              </div>

              {/* Khối Mô tả */}
              <div className="md:col-span-7 flex flex-col">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wide">
                    Mô tả chi tiết
                  </label>
                  <span className="text-[10px] text-[#006c49] font-bold bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                    ✨ Để trống sẽ tự động sinh bằng AI
                  </span>
                </div>
                <textarea
                  placeholder="Nhập mô tả sản phẩm chủ động hoặc bỏ trống để hệ thống AI tự phân tích và sinh văn bản tự động..."
                  value={formData.mo_ta}
                  onChange={(e) =>
                    setFormData({ ...formData, mo_ta: e.target.value })
                  }
                  className="w-full flex-1 min-h-[200px] p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 placeholder-slate-300 outline-none focus:border-[#006c49] transition resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* BUTTONS XÁC NHẬN */}
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
                  "Tạo Sản Phẩm & Tiếp Tục ➔"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ======================================= MODAL TẠO NHANH DANH MỤC CHA ==================================== */}
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
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-2">
                      Tên danh mục <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      autoFocus
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
                      {nations.find(
                        (n) => n.ma_quoc_gia === formData.ma_quoc_gia,
                      )?.ten_quoc_gia || formData.ma_quoc_gia}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-2">
                      Mã danh mục (Tùy chọn)
                    </label>
                    <input
                      type="text"
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
                          <span className="text-[10px] text-slate-400 font-bold uppercase">
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
                          <UploadCloud size={18} /> Chọn ảnh từ máy
                        </button>
                        <input
                          type="file"
                          ref={parentFileInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, setParentImage)}
                        />
                        <input
                          type="url"
                          placeholder="Hoặc dán URL..."
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
                    Lưu
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================= MODAL TẠO NHANH DANH MỤC CON ==================================== */}
      <AnimatePresence>
        {showChildModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowChildModal(false)}
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
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-2">
                      Tên danh mục con <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      autoFocus
                      value={newChildName}
                      onChange={(e) => setNewChildName(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-[#006c49] transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-2">
                      Thị trường Quốc gia
                    </label>
                    <div className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 cursor-not-allowed">
                      {nations.find(
                        (n) => n.ma_quoc_gia === formData.ma_quoc_gia,
                      )?.ten_quoc_gia || formData.ma_quoc_gia}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-2">
                      Thuộc Danh mục Cha
                    </label>
                    <div className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-emerald-700 cursor-not-allowed border-l-4 border-l-emerald-500">
                      {parents.find((p) => p.ma_dm_cha === filter.ma_dm_cha)
                        ?.ten_danh_muc_cha || "Lỗi"}
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-2">
                      Mã danh mục con (Tùy chọn)
                    </label>
                    <input
                      type="text"
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
                          <span className="text-[10px] text-slate-400 font-bold uppercase text-center">
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
                          <UploadCloud size={18} /> Chọn ảnh từ máy
                        </button>
                        <input
                          type="file"
                          ref={childFileInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, setChildImage)}
                        />
                        <input
                          type="url"
                          placeholder="Hoặc dán URL..."
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
                    Lưu
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
