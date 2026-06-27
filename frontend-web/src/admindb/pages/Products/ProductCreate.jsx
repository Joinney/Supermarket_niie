import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function ProductCreate() {
  const navigate = useNavigate();

  // 1. State lưu trữ dữ liệu Form tạo sản phẩm
  const [formData, setFormData] = useState({
    ten_san_pham: "",
    ma_dm_con: "",
    ma_quoc_gia: "VN", // Mặc định quốc gia theo logic hệ thống
    xuat_xu: "",
    mo_ta: "", // Có thể để trống để AI tự sinh ngầm ở Backend
  });

  // 2. State lưu danh mục con để đổ vào ô Select Dropdown
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const apiUrl =
    import.meta.env.VITE_API_PRODUCT_URL || "http://localhost:5002";

  // 3. Gọi API lấy cây danh mục để hiển thị danh mục con
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(
          `${apiUrl}/api/categories/tree?country=${formData.ma_quoc_gia}`,
        );

        // Làm phẳng cấu trúc cây danh mục hoặc trích xuất danh mục con (children)
        if (Array.isArray(response.data)) {
          const allSubCategories = response.data.flatMap(
            (parent) => parent.children || [],
          );
          setCategories(allSubCategories);
        }
      } catch (err) {
        console.error("Lỗi nạp danh mục:", err);
        setError("Không thể tải danh sách danh mục để lựa chọn.");
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, [formData.ma_quoc_gia]);

  // 4. Xử lý khi người dùng nhấn nút Lưu sản phẩm
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      // Gửi dữ liệu lên API createProduct của Backend
      const response = await axios.post(`${apiUrl}/api/products`, formData);

      if (response.data?.success) {
        alert(
          "🎉 Sản phẩm đã được tạo lập thành công! Hệ thống AI đang sinh mô tả tự động.",
        );
        navigate("/admin/products"); // Quay về trang danh sách sản phẩm
      }
    } catch (err) {
      console.error("Lỗi tạo sản phẩm:", err);
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
      className="flex-1 bg-[#f8f9fa] min-h-screen p-6 md:p-8 font-sans text-left"
    >
      {/* TIÊU ĐỀ & BREADCRUMB */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            Thêm sản phẩm mới
          </h1>
          <div className="flex items-center gap-2 text-sm text-gray-400 mt-1 font-medium">
            <span>Dashboard</span>
            <span>❯</span>
            <span
              className="cursor-pointer hover:text-[#006c49]"
              onClick={() => navigate("/admin/products")}
            >
              Danh sách sản phẩm
            </span>
            <span>❯</span>
            <span className="text-[#006c49] font-semibold">Tạo mới</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate("/admin/products")}
          className="flex items-center justify-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition active:scale-95 shrink-0"
        >
          ❮ Quay lại
        </button>
      </div>

      {/* KHỐI FORM CONTAINER CHÍNH */}
      <div className="max-w-3xl bg-white rounded-2xl border border-gray-100 shadow-sm p-6 relative">
        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold text-center">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* HÀNG 1: TÊN SẢN PHẨM */}
          <div>
            <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-2">
              Tên sản phẩm <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Nhập tên sản phẩm (Ví dụ: Trà Đông Trai Cozy)"
              value={formData.ten_san_pham}
              onChange={(e) =>
                setFormData({ ...formData, ten_san_pham: e.target.value })
              }
              className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 placeholder-gray-400 outline-none focus:bg-white focus:border-[#006c49] transition"
            />
          </div>

          {/* HÀNG 2: DANH MỤC CON & XUẤT XỨ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ô CHỌN DANH MỤC */}
            <div>
              <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-2">
                Danh mục con <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.ma_dm_con}
                onChange={(e) =>
                  setFormData({ ...formData, ma_dm_con: e.target.value })
                }
                className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:bg-white focus:border-[#006c49] transition cursor-pointer"
              >
                <option value="">
                  --{" "}
                  {loadingCategories
                    ? "Đang tải danh mục..."
                    : "Chọn danh mục con"}{" "}
                  --
                </option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* CỘT XUẤT XỨ - Đã chuẩn hóa theo Database Enum */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">
                Xuất xứ
              </label>
              <select
                value={formData.xuat_xu || ""}
                onChange={(e) =>
                  setFormData({ ...formData, xuat_xu: e.target.value })
                }
                className="w-full p-3 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-[#006c49] transition cursor-pointer"
              >
                <option value="" disabled>
                  -- Chọn xuất xứ --
                </option>
                <option value="vn">Sản xuất nội địa (vn)</option>
                <option value="nhap-khau">Hàng nhập khẩu (nhap-khau)</option>
                <option value="jp">Nhật Bản (jp)</option>
                <option value="kr">Hàn Quốc (kr)</option>
              </select>
            </div>
          </div>

          {/* HÀNG 3: MÃ QUỐC GIA (THỊ TRƯỜNG PHÂN PHỐI) */}
          <div>
            <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-2">
              Thị trường quốc gia
            </label>
            <div className="flex items-center gap-4">
              {/* Đã sửa mảng thành VN, US, CN cho khớp đúng 100% với Database của Demi Mart */}
              {["VN", "US", "CN"].map((country) => (
                <label
                  key={country}
                  className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700"
                >
                  <input
                    type="radio"
                    name="ma_quoc_gia"
                    value={country}
                    checked={formData.ma_quoc_gia === country}
                    onChange={(e) =>
                      setFormData({ ...formData, ma_quoc_gia: e.target.value })
                    }
                    className="w-4 h-4 text-[#006c49] focus:ring-[#006c49] border-gray-300"
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

          {/* HÀNG 4: MÔ TẢ SẢN PHẨM */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
                Mô tả sản phẩm
              </label>
              <span className="text-[10px] text-[#006c49] font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
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
              className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 placeholder-gray-400 outline-none focus:bg-white focus:border-[#006c49] transition resize-none font-sans leading-relaxed"
            />
          </div>

          {/* THANH THAO TÁC GỬI FORM */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/admin/products")}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center gap-2 bg-[#006c49] hover:bg-[#00563a] disabled:bg-gray-300 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md transition active:scale-95 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Đang xử lý lưu...
                </>
              ) : (
                "Lưu sản phẩm"
              )}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
