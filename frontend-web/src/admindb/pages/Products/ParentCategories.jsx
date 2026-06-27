import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Layers,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Image as ImageIcon,
  Globe,
  RotateCcw,
  AlertTriangle,
  X,
  UploadCloud,
} from "lucide-react";

export default function ParentCategories() {
  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState("ALL");
  const [loading, setLoading] = useState(true);

  // ==========================================
  //  MODAL POPUP
  // ==========================================
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("CREATE"); // 'CREATE' hoặc 'EDIT'
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formData, setFormData] = useState({
    ma_dm_cha: "",
    ten_danh_muc_cha: "",
    ma_quoc_gia: "VN",
    hinh_anh: "",
    bieu_tuong: "",
  });

  // 1. LẤY DANH SÁCH QUỐC GIA
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const apiUrl =
          import.meta.env.VITE_API_PRODUCT_URL || "http://localhost:5002";
        const res = await axios.get(`${apiUrl}/api/categories/countries`);
        setCountries(res.data);
      } catch (error) {
        console.error("Lỗi tải danh sách quốc gia:", error);
      }
    };
    fetchCountries();
  }, []);

  // 2. LẤY DANH SÁCH DANH MỤC CHA
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const apiUrl =
        import.meta.env.VITE_API_PRODUCT_URL || "http://localhost:5002";
      const res = await axios.get(
        `${apiUrl}/api/categories/parents?country=${selectedCountry}`,
      );
      if (res.data && res.data.success) {
        setCategories(res.data.data);
      } else if (Array.isArray(res.data)) {
        setCategories(res.data);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error("❌ Lỗi tải danh mục:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [selectedCountry]);

  // ==========================================
  // (THÊM / SỬA)
  // ==========================================
  const handleOpenCreateModal = () => {
    setModalMode("CREATE");
    setFormData({
      ma_dm_cha: "", // Bỏ trống để Backend tự sinh hoặc cho người dùng tự nhập
      ten_danh_muc_cha: "",
      ma_quoc_gia: selectedCountry === "ALL" ? "VN" : selectedCountry,
      hinh_anh: "",
      bieu_tuong: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (category) => {
    setModalMode("EDIT");
    setFormData({
      ma_dm_cha: category.ma_dm_cha,
      ten_danh_muc_cha: category.ten_danh_muc_cha,
      ma_quoc_gia: category.ma_quoc_gia,
      hinh_anh: category.hinh_anh || "",
      bieu_tuong: category.bieu_tuong || "",
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // ==========================================
  // LOGIC GỬI DỮ LIỆU FORM (LƯU LÊN DATABASE)
  // ==========================================
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);

    try {
      const apiUrl =
        import.meta.env.VITE_API_PRODUCT_URL || "http://localhost:5002";

      if (modalMode === "CREATE") {
        // GỌI API THÊM MỚI (Cần đảm bảo Backend đã có route POST /api/categories/parents)
        await axios.post(`${apiUrl}/api/categories/parents`, {
          ...formData,
          duong_dan_seo: formData.ten_danh_muc_cha
            .toLowerCase()
            .replace(/ /g, "-")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, ""), // Tạo slug tự động
        });
        alert("✅ Thêm danh mục thành công!");
      } else {
        // GỌI API CẬP NHẬT (Cần đảm bảo Backend đã có route PUT /api/categories/parents/:id)
        // await axios.put(`${apiUrl}/api/categories/parents/${formData.ma_dm_cha}`, formData);
        alert(
          "🚧 API Cập nhật cần được khai báo thêm ở Backend. Giao diện đã sẵn sàng!",
        );
      }

      setIsModalOpen(false);
      fetchCategories(); // Load lại bảng ngay lập tức
    } catch (error) {
      alert(
        "❌ Lỗi: " +
          (error.response?.data?.message || "Không thể lưu danh mục."),
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="p-6 w-full flex-1 font-sans relative">
      {/* HEADER TILE & BUTTONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Layers className="text-[#006c49]" /> Danh mục Cha
          </h1>
          <p className="text-xs text-slate-500 font-bold mt-1">
            Phân loại sản phẩm cấp 1 (Nhóm ngành hàng lớn)
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* BỘ LỌC QUỐC GIA */}
          <div className="relative">
            <Globe
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-[#006c49] shadow-sm appearance-none cursor-pointer min-w-[160px]"
            >
              <option value="ALL">🌐 Tất cả Quốc gia</option>
              {countries.map((c) => (
                <option key={c.ma_quoc_gia} value={c.ma_quoc_gia}>
                  {c.bieu_tuong_co} {c.ten_quoc_gia}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
              ▼
            </div>
          </div>

          {/* 🌟 NÚT THÊM DANH MỤC -> GỌI HÀM MỞ MODAL */}
          <button
            onClick={handleOpenCreateModal}
            className="bg-[#006c49] hover:bg-[#005137] text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition active:scale-95 shadow-md whitespace-nowrap"
          >
            <Plus size={16} /> Thêm Danh mục
          </button>
        </div>
      </div>

      {/* BẢNG DATA */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 flex justify-center text-[#006c49]">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead className="bg-slate-50/80 border-b border-gray-100 text-[11px] font-black text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-6 w-24 text-center">Hình ảnh</th>
                  <th className="py-4 px-6 w-40">Mã DM</th>
                  <th className="py-4 px-6 flex-1">Tên danh mục</th>
                  <th className="py-4 px-6 w-28 text-center">Quốc gia</th>
                  <th className="py-4 px-6 w-32 text-center">Trạng thái</th>
                  <th className="py-4 px-6 w-28 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm font-bold text-slate-700">
                {categories.length > 0 ? (
                  categories.map((c, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition group">
                      <td className="py-3 px-6">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 mx-auto flex items-center justify-center">
                          {c.hinh_anh ? (
                            <img
                              src={c.hinh_anh}
                              alt="img"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src =
                                  "https://placehold.co/100x100/f1f5f9/94a3b8?text=Loi+Anh";
                              }}
                            />
                          ) : (
                            <ImageIcon size={18} className="text-slate-300" />
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-400 font-mono text-xs">
                        {c.ma_dm_cha}
                      </td>
                      <td className="py-4 px-6 text-slate-900 group-hover:text-[#006c49] transition-colors line-clamp-2">
                        {c.ten_danh_muc_cha}
                      </td>
                      <td className="py-4 px-6 text-center text-xs font-black text-slate-500">
                        {c.ma_quoc_gia}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {c.trang_thai ? (
                          <span className="bg-emerald-100 text-[#006c49] px-2.5 py-1 rounded-md text-[10px] uppercase whitespace-nowrap">
                            Hoạt động
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-500 px-2.5 py-1 rounded-md text-[10px] uppercase whitespace-nowrap">
                            Đã Tắt
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-2">
                          {c.trang_thai ? (
                            <>
                              {/* 🌟 NÚT SỬA -> GỌI HÀM MỞ MODAL */}
                              <button
                                onClick={() => handleOpenEditModal(c)}
                                className="p-2 bg-slate-100 text-slate-600 hover:bg-sky-100 hover:text-sky-700 rounded-lg transition shadow-sm"
                                title="Chỉnh sửa danh mục"
                              >
                                <Edit size={14} />
                              </button>

                              <button
                                onClick={async () => {
                                  if (
                                    window.confirm(
                                      `⚠️ Đưa "${c.ten_danh_muc_cha}" vào lưu trữ?`,
                                    )
                                  ) {
                                    try {
                                      const apiUrl =
                                        import.meta.env.VITE_API_PRODUCT_URL ||
                                        "http://localhost:5002";
                                      await axios.delete(
                                        `${apiUrl}/api/categories/parents/${c.ma_dm_cha}`,
                                      );
                                      fetchCategories(); // Load lại bảng không cần F5
                                    } catch (error) {
                                      alert(
                                        "❌ " +
                                          (error.response?.data?.message ||
                                            "Lỗi xóa."),
                                      );
                                    }
                                  }
                                }}
                                className="p-2 bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-700 rounded-lg transition shadow-sm"
                                title="Tạm tắt danh mục"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={async () => {
                                  try {
                                    const apiUrl =
                                      import.meta.env.VITE_API_PRODUCT_URL ||
                                      "http://localhost:5002";
                                    await axios.put(
                                      `${apiUrl}/api/categories/parents/${c.ma_dm_cha}/restore`,
                                    );
                                    fetchCategories();
                                  } catch (error) {
                                    alert("❌ Lỗi khôi phục.");
                                  }
                                }}
                                className="p-2 bg-slate-100 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition shadow-sm"
                                title="Khôi phục hoạt động"
                              >
                                <RotateCcw size={14} strokeWidth={2.5} />
                              </button>

                              <button
                                onClick={async () => {
                                  if (
                                    window.confirm(
                                      `CẢNH BÁO: Xóa vĩnh viễn "${c.ten_danh_muc_cha}"?`,
                                    )
                                  ) {
                                    try {
                                      const apiUrl =
                                        import.meta.env.VITE_API_PRODUCT_URL ||
                                        "http://localhost:5002";
                                      await axios.delete(
                                        `${apiUrl}/api/categories/parents/${c.ma_dm_cha}/hard`,
                                      );
                                      fetchCategories();
                                    } catch (error) {
                                      alert(
                                        "❌ " +
                                          (error.response?.data?.message ||
                                            "Lỗi xóa vĩnh viễn."),
                                      );
                                    }
                                  }
                                }}
                                className="p-2 bg-slate-100 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition shadow-sm"
                                title="Xóa vĩnh viễn"
                              >
                                <AlertTriangle size={14} strokeWidth={2.5} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      className="py-10 text-center text-slate-400 text-xs"
                    >
                      Không có dữ liệu danh mục cho quốc gia này.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ==========================================
          🌟 GIAO DIỆN MODAL POPUP (THÊM/SỬA)
          ========================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-fadeIn">
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-black text-slate-800">
                {modalMode === "CREATE"
                  ? "Thêm Danh Mục Mới"
                  : "Cập Nhật Danh Mục"}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body Form */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-5">
              {/* Tên Danh Mục */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-1.5">
                  Tên danh mục <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Đồ uống nhập khẩu"
                  value={formData.ten_danh_muc_cha}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ten_danh_muc_cha: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-[#006c49] transition"
                />
              </div>

              {/* Quốc Gia */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-1.5">
                  Thị trường Quốc gia
                </label>
                <select
                  value={formData.ma_quoc_gia}
                  onChange={(e) =>
                    setFormData({ ...formData, ma_quoc_gia: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-[#006c49] transition cursor-pointer"
                >
                  {countries.map((c) => (
                    <option key={c.ma_quoc_gia} value={c.ma_quoc_gia}>
                      {c.bieu_tuong_co} {c.ten_quoc_gia}
                    </option>
                  ))}
                </select>
              </div>

              {/* URL Hình ảnh */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-1.5">
                  Đường dẫn Hình ảnh (URL)
                </label>
                <div className="relative">
                  <UploadCloud
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                  />
                  <input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={formData.hinh_anh}
                    onChange={(e) =>
                      setFormData({ ...formData, hinh_anh: e.target.value })
                    }
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-[#006c49] transition"
                  />
                </div>
              </div>

              {/* Mã Danh mục (Chỉ dùng khi Thêm mới có nhu cầu tự định danh, Sửa thì khóa lại) */}
              {modalMode === "CREATE" && (
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-1.5">
                    Mã danh mục (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    placeholder="Để trống hệ thống sẽ tự cấp mã (VD: DMC001)"
                    value={formData.ma_dm_cha}
                    onChange={(e) =>
                      setFormData({ ...formData, ma_dm_cha: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-[#006c49] transition placeholder:font-normal"
                  />
                </div>
              )}

              {/* Nút Submit */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-6 py-2.5 bg-[#006c49] hover:bg-[#005137] text-white text-sm font-bold rounded-xl shadow-md transition active:scale-95 flex items-center gap-2"
                >
                  {submitLoading && (
                    <Loader2 size={16} className="animate-spin" />
                  )}
                  {modalMode === "CREATE" ? "Tạo Danh Mục" : "Lưu Thay Đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
