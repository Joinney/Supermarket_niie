import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
// 🌟 SỬA BƯỚC 1: Thay thế import "axios" trần bằng instance "productApi" từ file config của bạn
import { productApi } from "../../../../api/axios"; // <--- Thay bằng đường dẫn thực tế đến file config Axios của bạn
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
  Search,
} from "lucide-react";

export default function ParentCategories() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Hàm format ngày tháng
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

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        // 🌟 SỬA BƯỚC 2: Gọi qua productApi với endpoint tương đối
        const res = await productApi.get("/nations");

        if (res.data && res.data.success) {
          setCountries(res.data.data);
        } else if (Array.isArray(res.data)) {
          setCountries(res.data);
        } else {
          setCountries([]);
        }
      } catch (error) {
        console.error("Lỗi tải danh sách quốc gia:", error);
        setCountries([]);
      }
    };
    fetchCountries();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      // 🌟 SỬA BƯỚC 3: Thay thế axios bằng productApi để tự động phân phối URL theo môi trường
      const res = await productApi.get(`/categories/parents?country=${selectedCountry}`);
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

  const handleGoToCreate = () => navigate("/admin/products/parent-categories/create");
  const handleGoToEdit = (ma_dm_cha) => navigate(`/admin/products/parent-categories/edit/${ma_dm_cha}`);

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
    const maDM = removeAccents(c.ma_dm_cha);
    const tenDM = removeAccents(c.ten_danh_muc_cha);

    return maDM.includes(searchStr) || tenDM.includes(searchStr);
  });

  return (
    <motion.div
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
              Quản lý danh mục cha
            </h1>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mt-1">
              <span>Tổng hành dinh</span>
              <span>❯</span>
              <span>Cấu trúc cấu tạo</span>
              <span>❯</span>
              <span className="text-emerald-700 font-bold">Danh mục gốc (Cha)</span>
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

            {/* PHÂN VÙNG QUỐC GIA */}
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

            {/* NÚT THÊM DANH MỤC */}
            <button
              onClick={handleGoToCreate}
              className="flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:shadow transition transform active:scale-98 shrink-0 cursor-pointer whitespace-nowrap"
            >
              <Plus size={14} />
              Thêm danh mục mới
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
              <table className="w-full text-left border-collapse table-auto min-w-[1300px]">
                <thead>
                  <tr className="bg-slate-50/70 text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-100">
                    <th className="py-3.5 px-4 w-24 text-center">Hình ảnh</th>
                    <th className="py-3.5 px-4 w-32">Mã định danh</th>
                    <th className="py-3.5 px-4 w-56">Tên phân loại gốc</th>
                    <th className="py-3.5 px-4 w-44">Đường dẫn SEO</th>
                    <th className="py-3.5 px-4 w-28 text-center">Biểu tượng</th>
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
                    filteredCategories.map((c, i) => (
                      <tr
                        key={c.ma_dm_cha || i}
                        className="group transition hover:bg-slate-50/60"
                      >
                        <td className="py-3 px-4 text-center">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 shadow-2xs mx-auto flex items-center justify-center shrink-0">
                            {c.hinh_anh ? (
                              <img
                                src={c.hinh_anh}
                                alt="Category logo"
                                className="w-full h-full object-cover"
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
                          {c.ma_dm_cha}
                        </td>
                        <td
                          className="py-3 px-4 text-slate-900 font-bold group-hover:text-emerald-700 transition max-w-[220px] truncate"
                          title={c.ten_danh_muc_cha}
                        >
                          {c.ten_danh_muc_cha}
                        </td>
                        <td
                          className="py-3 px-4 text-slate-400 font-normal max-w-[180px] truncate"
                          title={c.duong_dan_seo}
                        >
                          {c.duong_dan_seo || "—"}
                        </td>
                        <td className="py-3 px-4 text-center font-normal text-slate-500">
                          {c.bieu_tuong || "—"}
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
                        {/* CỘT THAO TÁC STICKY ĐỒNG BỘ */}
                        <td className="py-3 px-4 text-right pr-6 bg-white sticky right-0 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.03)] group-hover:bg-slate-50 transition-colors">
                          <div className="flex items-center justify-end gap-1 text-slate-400">
                            {c.trang_thai ? (
                              <>
                                <button
                                  onClick={() => handleGoToEdit(c.ma_dm_cha)}
                                  className="p-1.5 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                  title="Chỉnh sửa cấu trúc"
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  onClick={async () => {
                                    if (window.confirm(`⚠️ Bạn có chắc chắn muốn khóa lưu trữ danh mục gốc "${c.ten_danh_muc_cha}"?`)) {
                                      try {
                                        // 🌟 SỬA BƯỚC 4: Chuyển các lệnh thao tác xóa/khôi phục tương ứng sang productApi
                                        await productApi.delete(`/categories/parents/${c.ma_dm_cha}`);
                                        fetchCategories();
                                      } catch (error) {
                                        alert("❌ Lỗi: " + (error.response?.data?.message || "Hành động thất bại."));
                                      }
                                    }
                                  }}
                                  className="p-1.5 hover:text-red-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                  title="Đưa vào kho lưu trữ"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={async () => {
                                    try {
                                      await productApi.put(`/categories/parents/${c.ma_dm_cha}/restore`);
                                      fetchCategories();
                                    } catch (error) {
                                      alert("❌ Lỗi: Tái khôi phục hoạt động thất bại.");
                                    }
                                  }}
                                  className="p-1.5 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                  title="Khôi phục trạng thái"
                                >
                                  <RotateCcw size={14} strokeWidth={2.5} />
                                </button>
                                <button
                                  onClick={async () => {
                                    if (window.confirm(`🚨 CẢNH BÁO NGUY HIỂM: Bạn có chắc muốn xóa VĨNH VIỄN danh mục "${c.ten_danh_muc_cha}"?\nHành động này sẽ xóa sạch dữ liệu và không thể hoàn tác!`)) {
                                      try {
                                        await productApi.delete(`/categories/parents/${c.ma_dm_cha}/hard`);
                                        fetchCategories();
                                      } catch (error) {
                                        alert("❌ Lỗi: " + (error.response?.data?.message || "Hành động thất bại."));
                                      }
                                    }
                                  }}
                                  className="p-1.5 hover:text-red-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
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
                      <td colSpan="10" className="py-12 text-center text-slate-400 font-medium">
                        Không tìm thấy danh mục gốc nào khớp với phân vùng bộ lọc.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}