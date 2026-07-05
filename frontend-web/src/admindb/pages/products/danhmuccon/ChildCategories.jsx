import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
// 🌟 ĐỒNG BỘ: Sử dụng instance productApi trích xuất từ tệp cấu hình Interceptor của bạn
import { productApi } from "../../../../api/axios"; // <--- Hãy điều chỉnh đường dẫn thực tế đến file config Axios của bạn
import {
  Layers,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Image as ImageIcon,
  RotateCcw,
  AlertTriangle,
  Search,
  Globe,
} from "lucide-react";

export default function ChildCategories() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [parentCategories, setParentCategories] = useState([]);
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // 🚀 TỐI ƯU: Gọi đồng loạt qua productApi bằng các path tương đối ngắn gọn
      const res = await productApi.get(`/categories/children?country=${selectedCountry}`);
      const resParents = await productApi.get(`/categories/parents?country=${selectedCountry}`);

      setCategories(res.data.data || []);
      setParentCategories(resParents.data.data || []);

      if (countries.length === 0) {
        const resNations = await productApi.get("/nations");
        setCountries(resNations.data.data || []);
      }
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCountry]);

  const handleGoToCreate = () => navigate("/admin/products/child-categories/create");
  const handleGoToEdit = (ma_dm_con) => navigate(`/admin/products/child-categories/edit/${ma_dm_con}`);

  const handleToggleHot = async (id, currentStatus) => {
    try {
      // 🚀 Đồng bộ luồng PUT qua productApi
      await productApi.put(`/categories/children/${id}/toggle-hot`, {
        la_danh_muc_hot: !currentStatus,
      });
      fetchData();
    } catch (error) {
      alert(
        "❌ Lỗi cập nhật trạng thái Hot: " +
          (error.response?.data?.message || "Không thể kết nối Server."),
      );
    }
  };

  // Hàm loại bỏ dấu tiếng Việt
  const removeAccents = (str) => {
    if (!str) return "";
    return str
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase();
  };

  // Lọc dữ liệu không phân biệt dấu
  const filteredCategories = categories.filter((c) => {
    const searchStr = removeAccents(searchTerm);
    const maDM = removeAccents(c.ma_dm_con);
    const tenDM = removeAccents(c.ten_danh_muc_con);

    return maDM.includes(searchStr) || tenDM.includes(searchStr);
  });

  return (
    <motion.main
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="w-full min-h-screen bg-[#fafafa] font-sans text-left text-slate-700 selection:bg-emerald-100 p-1 antialiased"
    >
      <div className="w-full">
        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Quản lý danh mục con
            </h1>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mt-1">
              <span>Tổng hành dinh</span>
              <span>❯</span>
              <span>Cấu trúc cấu tạo</span>
              <span>❯</span>
              <span className="text-emerald-700 font-bold">Danh mục phân loại (Con)</span>
            </div>
          </div>

          <div className="flex items-center flex-wrap sm:flex-nowrap gap-3 w-full sm:w-auto justify-end">
            {/* THANH TÌM KIẾM */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Tìm mã hoặc tên danh mục..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-50 transition"
              />
            </div>

            {/* BỘ LỌC QUỐC GIA */}
            <div className="relative shrink-0">
              <Globe className="absolute left-3 top-2.5 text-slate-400" size={14} />
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 shadow-sm appearance-none cursor-pointer min-w-[150px]"
              >
                <option value="ALL">🌐 Tất cả quốc gia</option>
                {countries.map((c) => (
                  <option key={c.ma_quoc_gia} value={c.ma_quoc_gia}>
                    {c.bieu_tuong_co} {c.ten_quoc_gia}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-3 pointer-events-none text-slate-400 text-[8px]">
                ▼
              </div>
            </div>

            {/* NÚT THÊM DANH MỤC CON */}
            <button
              onClick={handleGoToCreate}
              className="flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:shadow transition transform active:scale-98 shrink-0 cursor-pointer whitespace-nowrap"
            >
              <Plus size={14} />
              Thêm danh mục con
            </button>
          </div>
        </div>

        {/* CONTAINER BẢNG DỮ LIỆU FULL SCREEN */}
        <div className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 flex justify-center text-emerald-700">
              <Loader2 className="animate-spin" size={28} />
            </div>
          ) : (
            <div className="w-full overflow-x-auto rounded-xl border border-slate-50">
              <table className="w-full text-left border-collapse table-auto min-w-[1450px]">
                <thead>
                  <tr className="bg-slate-50/70 text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-100">
                    <th className="py-3.5 px-4 w-24 text-center">Hình ảnh</th>
                    <th className="py-3.5 px-4 w-32">Mã định danh</th>
                    <th className="py-3.5 px-4 w-52">Tên phân loại con</th>
                    <th className="py-3.5 px-4 w-52">Trực thuộc gốc (Cha)</th>
                    <th className="py-3.5 px-4 w-44">Đường dẫn SEO</th>
                    <th className="py-3.5 px-4 w-28 text-center">Xu hướng (Hot)</th>
                    <th className="py-3.5 px-4 w-24 text-center">Quốc gia</th>
                    <th className="py-3.5 px-4 w-36 text-center">Ngày khởi tạo</th>
                    <th className="py-3.5 px-4 w-36 text-center">Ngày cập nhật</th>
                    <th className="py-3.5 px-4 w-32 text-center">Trạng thái</th>
                    <th className="py-3.5 px-4 w-28 text-right pr-6 sticky right-0 bg-slate-50/90 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.03)]">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-700">
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map((c) => (
                      <tr key={c.ma_dm_con} className="group transition hover:bg-slate-50/60">
                        <td className="py-3 px-4 text-center">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 shadow-2xs mx-auto flex items-center justify-center shrink-0">
                            {c.hinh_anh ? (
                              <img
                                src={c.hinh_anh}
                                className="w-full h-full object-cover"
                                alt="Category thumb"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "https://placehold.co/100x100/f1f5f9/94a3b8?text=No+Img";
                                }}
                              />
                            ) : (
                              <ImageIcon size={16} className="text-slate-300" />
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                          {c.ma_dm_con}
                        </td>
                        <td
                          className="py-3 px-4 text-slate-900 font-bold group-hover:text-emerald-700 transition max-w-[200px] truncate"
                          title={c.ten_danh_muc_con}
                        >
                          {c.ten_danh_muc_con}
                        </td>
                        <td
                          className="py-3 px-4 text-slate-600 font-medium max-w-[200px] truncate"
                          title={parentCategories.find((p) => p.ma_dm_cha === c.ma_dm_cha)?.ten_danh_muc_cha}
                        >
                          {parentCategories.find((p) => p.ma_dm_cha === c.ma_dm_cha)?.ten_danh_muc_cha || "—"}
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-normal max-w-[160px] truncate" title={c.duong_dan_seo}>
                          {c.duong_dan_seo || "—"}
                        </td>

                        {/* NÚT GẠT ĐỒNG BỘ TRẠNG THÁI HOT */}
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleToggleHot(c.ma_dm_con, c.la_danh_muc_hot)}
                            className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-200 focus:outline-none shadow-xs cursor-pointer ${
                              c.la_danh_muc_hot ? "bg-emerald-700" : "bg-slate-300"
                            }`}
                            title={c.la_danh_muc_hot ? "Click để gỡ nhãn Hot" : "Click để đặt nhãn Hot"}
                          >
                            <span
                              className={`absolute top-[2px] left-[2px] w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                                c.la_danh_muc_hot ? "translate-x-[20px]" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </td>

                        <td className="py-3 px-4 text-center text-slate-500 font-bold">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-black uppercase border border-blue-100 tracking-wide">
                            {c.ma_quoc_gia || "Mặc định"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-normal text-slate-400 font-mono text-[11px]">
                          {formatDate(c.ngay_tao)}
                        </td>
                        <td className="py-3 px-4 text-center font-normal text-slate-400 font-mono text-[11px]">
                          {formatDate(c.ngay_cap_nhat)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {c.trang_thai ? (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide whitespace-nowrap">
                              Hoạt động
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide whitespace-nowrap">
                              Đã khóa ẩn
                            </span>
                          )}
                        </td>

                        {/* THAO TÁC STICKY ĐỒNG BỘ */}
                        <td className="py-3 px-4 text-right pr-6 bg-white sticky right-0 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.03)] group-hover:bg-slate-50 transition-colors">
                          <div className="flex items-center justify-end gap-1 text-slate-400">
                            {c.trang_thai ? (
                              <>
                                <button
                                  onClick={() => handleGoToEdit(c.ma_dm_con)}
                                  className="p-1.5 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                  title="Chỉnh sửa thông tin"
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  onClick={async () => {
                                    if (window.confirm(`⚠️ Bạn có chắc muốn đưa danh mục con "${c.ten_danh_muc_con}" vào lưu trữ ẩn?`)) {
                                      try {
                                        // 🚀 Thay thế xoá mềm qua productApi
                                        await productApi.delete(`/categories/children/${c.ma_dm_con}`);
                                        fetchData();
                                      } catch (e) {
                                        alert("❌ Lỗi: " + (e.response?.data?.message || e.message));
                                      }
                                    }
                                  }}
                                  className="p-1.5 hover:text-red-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                  title="Khóa ẩn danh mục"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={async () => {
                                    try {
                                      // 🚀 Thay thế khôi phục qua productApi
                                      await productApi.put(`/categories/children/${c.ma_dm_con}/restore`);
                                      fetchData();
                                    } catch (e) {
                                      alert("❌ Thao tác tái khôi phục thất bại.");
                                    }
                                  }}
                                  className="p-1.5 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                  title="Khôi phục hoạt động"
                                >
                                  <RotateCcw size={14} strokeWidth={2.5} />
                                </button>
                                <button
                                  onClick={async () => {
                                    if (window.confirm(`🚨 CẢNH BÁO: Bạn chắc chắn muốn xóa VĨNH VIỄN danh mục con "${c.ten_danh_muc_con}"?\nHành động này không thể hoàn tác!`)) {
                                      try {
                                        // 🚀 Thay thế xoá cứng qua productApi
                                        await productApi.delete(`/categories/children/${c.ma_dm_con}/hard`);
                                        fetchData();
                                      } catch (e) {
                                        alert("❌ Lỗi xóa vĩnh viễn: " + (e.response?.data?.message || e.message));
                                      }
                                    }
                                  }}
                                  className="p-1.5 hover:text-red-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                  title="Xóa vĩnh viễn dữ liệu"
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
                      <td colSpan="11" className="py-12 text-center text-slate-400 font-medium">
                        Không tìm thấy danh mục con nào khớp với hệ thống bộ lọc.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </motion.main>
  );
}