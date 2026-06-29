import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  Loader2,
  Save,
  ChevronLeft,
  Package,
  Layers,
  CheckCircle2,
} from "lucide-react";

export default function ProductEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [countries, setCountries] = useState([]);
  const [parents, setParents] = useState([]);
  const [children, setChildren] = useState([]);

  const [filter, setFilter] = useState({
    ma_quoc_gia: "",
    ma_dm_cha: "",
  });

  const [formData, setFormData] = useState({
    ma_san_pham: "",
    ten_san_pham: "",
    ma_dm_con: "",
    ma_quoc_gia: "",
    mo_ta: "",
    co_bien_the: false,
    gia_ban: 0,
  });

  // 🌟 STATE MỚI: Quản lý loại biến thể nếu đổi từ Đơn sang Nhóm
  const [variantType, setVariantType] = useState("GROUP");

  const apiUrl =
    import.meta.env.VITE_API_PRODUCT_URL || "http://localhost:5002";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [resProduct, resCat, resParents, resNations] = await Promise.all([
          axios.get(`${apiUrl}/api/products/${id}`),
          axios.get(`${apiUrl}/api/categories/children?country=ALL`),
          axios.get(`${apiUrl}/api/categories/parents?country=ALL`),
          axios.get(`${apiUrl}/api/nations`),
        ]);

        const product = resProduct.data;
        const allChildren = resCat.data.data || [];
        const allParents = resParents.data.data || [];
        const nations = resNations.data.data || [];

        const currentChild = allChildren.find(
          (c) => c.ma_dm_con === product.ma_dm_con,
        );
        const parentId = currentChild ? currentChild.ma_dm_cha : "";

        setFormData({
          ma_san_pham: product.ma_san_pham,
          ten_san_pham: product.ten_san_pham,
          ma_dm_con: product.ma_dm_con,
          ma_quoc_gia: product.ma_quoc_gia || "VN",
          mo_ta: product.mo_ta || "",
          co_bien_the: product.co_bien_the,
          gia_ban: product.gia_ban || 0,
        });

        setFilter({
          ma_quoc_gia: product.ma_quoc_gia || "VN",
          ma_dm_cha: parentId,
        });

        setChildren(allChildren);
        setParents(allParents);
        setCountries(nations);
      } catch (err) {
        console.error("Lỗi tải dữ liệu:", err);
        alert("Không thể tải thông tin sản phẩm!");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, apiUrl]);

  useEffect(() => {
    setFilter((prev) => ({ ...prev, ma_dm_cha: "" }));
    setFormData((prev) => ({ ...prev, ma_dm_con: "" }));
  }, [filter.ma_quoc_gia]);

  // 🌟 ĐÃ SỬA HÀM LƯU: XỬ LÝ ĐIỀU HƯỚNG THÔNG MINH
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      await axios.put(`${apiUrl}/api/products/${id}`, {
        ...formData,
        ma_quoc_gia: filter.ma_quoc_gia,
      });

      if (formData.co_bien_the) {
        // Nếu là sản phẩm nhóm -> Chuyển thẳng sang trang quản lý biến thể kèm tín hiệu SINGLE/GROUP
        alert("✅ Đã cập nhật! Chuyển sang giao diện quản lý biến thể.");
        navigate(`/admin/products/create-variant/${id}`, {
          state: { targetVariantType: variantType }, // Bắn cờ sang trang kia
        });
      } else {
        // Nếu là sản phẩm đơn -> Về danh sách
        alert("✅ Cập nhật sản phẩm thành công!");
        navigate("/admin/products/Danhsachsanpham");
      }
    } catch (err) {
      alert("❌ Lỗi: " + (err.response?.data?.message || "Có lỗi xảy ra"));
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading)
    return (
      <div className="p-10 flex justify-center text-[#006c49]">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );

  return (
    <div className="p-6 w-full flex-1 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-11 h-11 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition shadow-sm"
            title="Quay lại"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-800">
              Chỉnh Sửa Sản Phẩm
            </h1>
            <p className="text-xs font-bold text-slate-400 mt-1">
              Cập nhật thông tin chi tiết cho mã SKU: {formData.ma_san_pham}
            </p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-200/80">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-2">
                Mã sản phẩm (SKU) <span className="text-red-500">*</span>
              </label>
              <input
                disabled
                value={formData.ma_san_pham}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-2">
                Tên sản phẩm <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={formData.ten_san_pham}
                onChange={(e) =>
                  setFormData({ ...formData, ten_san_pham: e.target.value })
                }
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-[#006c49] transition"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-2">
                  Thị trường Quốc gia
                </label>
                <select
                  value={filter.ma_quoc_gia}
                  onChange={(e) =>
                    setFilter({ ma_quoc_gia: e.target.value, ma_dm_cha: "" })
                  }
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 cursor-pointer outline-none focus:border-[#006c49]"
                >
                  {countries.map((c) => (
                    <option key={c.ma_quoc_gia} value={c.ma_quoc_gia}>
                      {c.bieu_tuong_co} {c.ten_quoc_gia}
                    </option>
                  ))}
                </select>
              </div>

              {/* 🌟 GIAO DIỆN CẤU TRÚC BÁN HÀNG */}
              <div className="md:col-span-2 space-y-4 border-b border-slate-100 pb-6">
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wide">
                  Cấu trúc bán hàng
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, co_bien_the: false })
                    }
                    className={`p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${!formData.co_bien_the ? "border-[#006c49] bg-emerald-50/50" : "border-slate-200"}`}
                  >
                    <div
                      className={`p-2 rounded-lg ${!formData.co_bien_the ? "bg-[#006c49] text-white" : "bg-slate-100 text-slate-500"}`}
                    >
                      <Package size={16} />
                    </div>
                    <div>
                      <h3
                        className={`font-black text-sm ${!formData.co_bien_the ? "text-[#006c49]" : "text-slate-700"}`}
                      >
                        Sản Phẩm Đơn
                      </h3>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, co_bien_the: true })
                    }
                    className={`p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${formData.co_bien_the ? "border-indigo-600 bg-indigo-50/50" : "border-slate-200"}`}
                  >
                    <div
                      className={`p-2 rounded-lg ${formData.co_bien_the ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"}`}
                    >
                      <Layers size={16} />
                    </div>
                    <div>
                      <h3
                        className={`font-black text-sm ${formData.co_bien_the ? "text-indigo-600" : "text-slate-700"}`}
                      >
                        Có Nhiều Phân Loại
                      </h3>
                    </div>
                  </button>
                </div>

                {/* 🌟 NẾU CHỌN BIẾN THỂ -> HIỆN DROPDOWN SINGLE/GROUP NHƯ LÚC TẠO MỚI */}
                {formData.co_bien_the && (
                  <div className="mt-4 p-5 bg-slate-50 border border-slate-200 rounded-2xl animate-in fade-in slide-in-from-top-2">
                    <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wide mb-4">
                      👉 Bạn muốn quản lý phân loại theo cách nào?
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div
                        onClick={() => setVariantType("SINGLE")}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${variantType === "SINGLE" ? "bg-white border-indigo-500 shadow-sm" : "bg-transparent border-transparent hover:bg-slate-100"}`}
                      >
                        <div
                          className={`mt-0.5 shrink-0 ${variantType === "SINGLE" ? "text-indigo-600" : "text-slate-300"}`}
                        >
                          {variantType === "SINGLE" ? (
                            <CheckCircle2
                              size={18}
                              className="fill-indigo-100"
                            />
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
                          <p className="text-xs text-slate-500 mt-1">
                            VD: "Bản tiêu chuẩn", "Bản cao cấp"
                          </p>
                        </div>
                      </div>

                      <div
                        onClick={() => setVariantType("GROUP")}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${variantType === "GROUP" ? "bg-white border-indigo-500 shadow-sm" : "bg-transparent border-transparent hover:bg-slate-100"}`}
                      >
                        <div
                          className={`mt-0.5 shrink-0 ${variantType === "GROUP" ? "text-indigo-600" : "text-slate-300"}`}
                        >
                          {variantType === "GROUP" ? (
                            <CheckCircle2
                              size={18}
                              className="fill-indigo-100"
                            />
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
                          <p className="text-xs text-slate-500 mt-1">
                            VD: Áo Size M - Màu Đỏ
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {!formData.co_bien_the && (
              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-2">
                  Giá bán hiện tại (đ)
                </label>
                <input
                  type="number"
                  value={formData.gia_ban}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      gia_ban: Number(e.target.value),
                    })
                  }
                  className="w-full md:w-1/3 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-black text-[#006c49] outline-none focus:border-[#006c49]"
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-2">
                  Thuộc Danh mục Cha
                </label>
                <select
                  value={filter.ma_dm_cha}
                  onChange={(e) =>
                    setFilter({ ...filter, ma_dm_cha: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 cursor-pointer outline-none focus:border-[#006c49]"
                >
                  <option value="">-- Chọn danh mục cha --</option>
                  {parents
                    .filter((p) => p.ma_quoc_gia === filter.ma_quoc_gia)
                    .map((p) => (
                      <option key={p.ma_dm_cha} value={p.ma_dm_cha}>
                        {p.ten_danh_muc_cha}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-2">
                  Danh mục con <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.ma_dm_con}
                  onChange={(e) =>
                    setFormData({ ...formData, ma_dm_con: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 cursor-pointer outline-none focus:border-[#006c49]"
                >
                  <option value="">-- Chọn danh mục con --</option>
                  {children
                    .filter((c) => c.ma_dm_cha === filter.ma_dm_cha)
                    .map((c) => (
                      <option key={c.ma_dm_con} value={c.ma_dm_con}>
                        {c.ten_danh_muc_con}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-2">
                Mô tả chi tiết
              </label>
              <textarea
                rows={5}
                value={formData.mo_ta}
                onChange={(e) =>
                  setFormData({ ...formData, mo_ta: e.target.value })
                }
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-[#006c49] transition"
                placeholder="Nhập mô tả sản phẩm..."
              />
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={submitLoading}
                className="px-8 py-3 bg-[#006c49] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#005137] transition active:scale-95 shadow-md"
              >
                {submitLoading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Save size={18} />
                )}
                {formData.co_bien_the
                  ? "Lưu & Quản lý Phân Loại"
                  : "Lưu Thay Đổi"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
