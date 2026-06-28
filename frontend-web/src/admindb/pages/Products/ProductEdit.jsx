import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Loader2, Save, ChevronLeft } from "lucide-react";

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
  });

  const apiUrl =
    import.meta.env.VITE_API_PRODUCT_URL || "http://localhost:5002";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [resProduct, resCat, resParents, resCountries] =
          await Promise.all([
            axios.get(`${apiUrl}/api/products/${id}`),
            axios.get(`${apiUrl}/api/categories/children?country=ALL`),
            axios.get(`${apiUrl}/api/categories/parents?country=ALL`),
            axios.get(`${apiUrl}/api/nations`),
          ]);

        const product = resProduct.data;
        const allChildren = resCat.data.data || [];
        const allParents = resParents.data.data || [];

        const currentChild = allChildren.find(
          (c) => c.ma_dm_con === product.ma_dm_con,
        );
        const parentId = currentChild ? currentChild.ma_dm_cha : "";

        setFormData(product);
        setFilter({
          ma_quoc_gia: product.ma_quoc_gia || "VN",
          ma_dm_cha: parentId,
        });

        setChildren(allChildren);
        setParents(allParents);
        setCountries(resCountries.data);
      } catch (err) {
        console.error("Lỗi tải dữ liệu:", err);
        alert("Không thể tải thông tin sản phẩm!");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, apiUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      await axios.put(`${apiUrl}/api/products/${id}`, {
        ...formData,
        ma_quoc_gia: filter.ma_quoc_gia,
      });
      alert("✅ Cập nhật sản phẩm thành công!");
      navigate("/admin/products/Danhsachsanpham");
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
      {/* Container căn giữa với giới hạn chiều rộng */}
      <div className="max-w-4xl mx-auto">
        {/* HEADER: Nút Quay lại + Tiêu đề */}
        <div className="flex items-center gap-4 mb-8">
          <button
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

        {/* BẢNG FORM */}
        <div className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-200/80">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* SKU - BỊ KHÓA */}
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

            {/* Tên */}
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

            {/* CASCADING DROPDOWNS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Chọn Quốc gia */}
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

              {/* Chọn Danh mục cha */}
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

              {/* Chọn Danh mục con (Lưu vào DB) */}
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

            {/* Mô tả */}
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

            {/* FOOTER ACTION BUTTONS */}
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
                Lưu Thay Đổi
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
