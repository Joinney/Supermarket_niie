import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

  const handleGoToCreate = () =>
    navigate("/admin/products/parent-categories/create");
  const handleGoToEdit = (ma_dm_cha) =>
    navigate(`/admin/products/parent-categories/edit/${ma_dm_cha}`);

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

  // Tạo biến lọc dữ liệu không phân biệt dấu
  const filteredCategories = categories.filter((c) => {
    const searchStr = removeAccents(searchTerm);
    const maDM = removeAccents(c.ma_dm_cha);
    const tenDM = removeAccents(c.ten_danh_muc_cha);

    return maDM.includes(searchStr) || tenDM.includes(searchStr);
  });

  return (
    <div className="p-6 w-full flex-1 font-sans relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Layers className="text-[#006c49]" /> Danh mục Cha
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Ô TÌM KIẾM */}
          <div className="relative hidden sm:block">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Tìm mã hoặc tên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-[#006c49] shadow-sm w-48 sm:w-64 transition-all"
            />
          </div>
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
          <button
            onClick={handleGoToCreate}
            className="bg-[#006c49] hover:bg-[#005137] text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition active:scale-95 shadow-md whitespace-nowrap"
          >
            <Plus size={16} /> Thêm Danh mục
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 flex justify-center text-[#006c49]">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            {/* Tăng min-w lên 1500px để tạo scroll ngang khi có nhiều cột */}
            <table className="w-full text-left border-collapse min-w-[1500px]">
              <thead className="bg-slate-50/80 border-b border-gray-100 text-[11px] font-black text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-6 w-24 text-center">Hình ảnh</th>
                  <th className="py-4 px-6 w-32">Mã DM</th>
                  <th className="py-4 px-6 w-48">Tên danh mục</th>
                  <th className="py-4 px-6 w-32">Đường dẫn SEO</th>
                  <th className="py-4 px-6 w-32 text-center">Biểu tượng</th>
                  <th className="py-4 px-6 w-24 text-center">Quốc gia</th>
                  <th className="py-4 px-6 w-32 text-center">Ngày tạo</th>
                  <th className="py-4 px-6 w-32 text-center">Ngày cập nhật</th>
                  <th className="py-4 px-6 w-28 text-center">Trạng thái</th>
                  <th className="py-4 px-6 w-28 text-right sticky right-0 bg-slate-50/80 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm font-bold text-slate-700">
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((c, i) => (
                    <tr
                      key={c.ma_dm_cha || i}
                      className="hover:bg-slate-50 transition group"
                    >
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
                      <td
                        className="py-4 px-6 text-slate-900 group-hover:text-[#006c49] transition-colors whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]"
                        title={c.ten_danh_muc_cha}
                      >
                        {c.ten_danh_muc_cha}
                      </td>
                      <td
                        className="py-4 px-6 text-slate-400 font-normal text-xs whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]"
                        title={c.duong_dan_seo}
                      >
                        {c.duong_dan_seo || "N/A"}
                      </td>
                      <td className="py-4 px-6 text-center font-normal text-xs">
                        {c.bieu_tuong || "N/A"}
                      </td>
                      <td className="py-4 px-6 text-center text-xs font-black text-slate-500">
                        {c.ma_quoc_gia}
                      </td>
                      <td className="py-4 px-6 text-center font-normal text-[11px] text-slate-500">
                        {formatDate(c.ngay_tao)}
                      </td>
                      <td className="py-4 px-6 text-center font-normal text-[11px] text-slate-500">
                        {formatDate(c.ngay_cap_nhat)}
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
                      <td className="py-4 px-6 bg-white sticky right-0 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)] group-hover:bg-slate-50 transition-colors">
                        <div className="flex items-center justify-end gap-2">
                          {c.trang_thai ? (
                            <>
                              <button
                                onClick={() => handleGoToEdit(c.ma_dm_cha)}
                                className="p-2 bg-slate-100 text-slate-600 hover:bg-sky-100 hover:text-sky-700 rounded-lg transition shadow-sm"
                                title="Chỉnh sửa"
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
                                      fetchCategories();
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
                                title="Tạm tắt"
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
                                title="Khôi phục"
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
                      colSpan="10"
                      className="py-10 text-center text-slate-400 text-xs"
                    >
                      Không có dữ liệu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
