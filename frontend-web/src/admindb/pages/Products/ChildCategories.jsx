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
  RotateCcw,
  AlertTriangle,
  Search,
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
      const apiUrl =
        import.meta.env.VITE_API_PRODUCT_URL || "http://localhost:5002";

      const res = await axios.get(
        `${apiUrl}/api/categories/children?country=${selectedCountry}`,
      );
      const resParents = await axios.get(
        `${apiUrl}/api/categories/parents?country=${selectedCountry}`,
      );

      setCategories(res.data.data || []);
      setParentCategories(resParents.data.data || []);

      if (countries.length === 0) {
        const resNations = await axios.get(`${apiUrl}/api/nations`);

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

  const handleGoToCreate = () =>
    navigate("/admin/products/child-categories/create");
  const handleGoToEdit = (ma_dm_con) =>
    navigate(`/admin/products/child-categories/edit/${ma_dm_con}`);

  // ==========================================
  // HÀM XỬ LÝ KHI BẤM NÚT GẠT (TOGGLE HOT)
  // ==========================================
  const handleToggleHot = async (id, currentStatus) => {
    try {
      const apiUrl =
        import.meta.env.VITE_API_PRODUCT_URL || "http://localhost:5002";
      // Đảo ngược trạng thái hiện tại (true thành false, false thành true)
      await axios.put(`${apiUrl}/api/categories/children/${id}/toggle-hot`, {
        la_danh_muc_hot: !currentStatus,
      });
      // Tải lại bảng để cập nhật màu sắc
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

  // Tạo biến lọc dữ liệu không phân biệt dấu
  const filteredCategories = categories.filter((c) => {
    const searchStr = removeAccents(searchTerm);
    const maDM = removeAccents(c.ma_dm_con);
    const tenDM = removeAccents(c.ten_danh_muc_con);

    return maDM.includes(searchStr) || tenDM.includes(searchStr);
  });

  return (
    <div className="p-6 w-full flex-1 font-sans">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <Layers className="text-[#006c49]" /> Danh mục Con
        </h1>
        <div className="flex gap-3">
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
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="py-2.5 px-4 bg-white border border-gray-200 rounded-xl text-xs font-bold shadow-sm outline-none cursor-pointer"
          >
            <option value="ALL">🌐 Tất cả quốc gia</option>
            {countries.map((c) => (
              <option key={c.ma_quoc_gia} value={c.ma_quoc_gia}>
                {c.bieu_tuong_co} {c.ten_quoc_gia}
              </option>
            ))}
          </select>
          <button
            onClick={handleGoToCreate}
            className="bg-[#006c49] hover:bg-[#005137] text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-2 shadow-md transition active:scale-95"
          >
            <Plus size={16} /> Thêm Danh mục Con
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
            <table className="w-full text-left min-w-[1600px]">
              <thead className="bg-slate-50 text-[11px] font-black text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-6 w-24 text-center">Hình ảnh</th>
                  <th className="py-4 px-6 w-32">Mã DM Con</th>
                  <th className="py-4 px-6 w-48">Tên Danh mục</th>
                  <th className="py-4 px-6 w-48">Thuộc Cha</th>
                  <th className="py-4 px-6 w-32">Đường dẫn SEO</th>
                  {/* Cột Danh Mục Hot */}
                  <th className="py-4 px-6 w-24 text-center">DM Hot</th>
                  <th className="py-4 px-6 w-24 text-center">Quốc gia</th>
                  <th className="py-4 px-6 w-32 text-center">Ngày tạo</th>
                  <th className="py-4 px-6 w-32 text-center">Ngày cập nhật</th>
                  <th className="py-4 px-6 w-28 text-center">Trạng thái</th>
                  <th className="py-4 px-6 w-28 text-right sticky right-0 bg-slate-50/80 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm font-bold text-slate-700">
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((c) => (
                    <tr
                      key={c.ma_dm_con}
                      className="hover:bg-slate-50 transition duration-200 group"
                    >
                      <td className="py-3 px-6">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 mx-auto flex items-center justify-center">
                          {c.hinh_anh ? (
                            <img
                              src={c.hinh_anh}
                              className="w-full h-full object-cover"
                              alt="img"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src =
                                  "https://placehold.co/40x40/f1f5f9/94a3b8?text=Loi";
                              }}
                            />
                          ) : (
                            <ImageIcon size={16} className="text-slate-300" />
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-400 font-mono text-xs">
                        {c.ma_dm_con}
                      </td>
                      <td
                        className="py-4 px-6 text-slate-900 group-hover:text-[#006c49] transition-colors whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]"
                        title={c.ten_danh_muc_con}
                      >
                        {c.ten_danh_muc_con}
                      </td>
                      <td
                        className="py-4 px-6 text-xs text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]"
                        title={
                          parentCategories.find(
                            (p) => p.ma_dm_cha === c.ma_dm_cha,
                          )?.ten_danh_muc_cha
                        }
                      >
                        {parentCategories.find(
                          (p) => p.ma_dm_cha === c.ma_dm_cha,
                        )?.ten_danh_muc_cha || "N/A"}
                      </td>
                      <td
                        className="py-4 px-6 text-slate-400 font-normal text-xs whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]"
                        title={c.duong_dan_seo}
                      >
                        {c.duong_dan_seo || "N/A"}
                      </td>

                      {/* GIAO DIỆN NÚT GẠT (TOGGLE SWITCH) CHUẨN */}
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() =>
                            handleToggleHot(c.ma_dm_con, c.la_danh_muc_hot)
                          }
                          className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none shadow-inner ${
                            c.la_danh_muc_hot ? "bg-[#006c49]" : "bg-slate-200"
                          }`}
                          title={
                            c.la_danh_muc_hot
                              ? "Tắt danh mục Hot"
                              : "Bật danh mục Hot"
                          }
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${
                              c.la_danh_muc_hot
                                ? "translate-x-5"
                                : "translate-x-1"
                            }`}
                          />
                        </button>
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
                        <span
                          className={`px-2.5 py-1 rounded-md text-[10px] uppercase whitespace-nowrap ${c.trang_thai ? "bg-emerald-100 text-[#006c49]" : "bg-slate-100 text-slate-500"}`}
                        >
                          {c.trang_thai ? "Hoạt động" : "Đã tắt"}
                        </span>
                      </td>
                      <td className="py-4 px-6 bg-white sticky right-0 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)] group-hover:bg-slate-50 transition-colors">
                        <div className="flex items-center justify-end gap-2">
                          {c.trang_thai ? (
                            <>
                              <button
                                onClick={() => handleGoToEdit(c.ma_dm_con)}
                                className="p-2 bg-slate-100 hover:bg-sky-100 text-slate-600 hover:text-sky-700 rounded-lg transition"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={async () => {
                                  if (
                                    window.confirm(
                                      `Đưa "${c.ten_danh_muc_con}" vào lưu trữ?`,
                                    )
                                  ) {
                                    try {
                                      const apiUrl =
                                        import.meta.env.VITE_API_PRODUCT_URL ||
                                        "http://localhost:5002";
                                      await axios.delete(
                                        `${apiUrl}/api/categories/children/${c.ma_dm_con}`,
                                      );
                                      fetchData();
                                    } catch (e) {
                                      alert(
                                        "Lỗi: " +
                                          (e.response?.data?.message ||
                                            e.message),
                                      );
                                    }
                                  }
                                }}
                                className="p-2 bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-700 rounded-lg transition"
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
                                      `${apiUrl}/api/categories/children/${c.ma_dm_con}/restore`,
                                    );
                                    fetchData();
                                  } catch (e) {
                                    alert("Lỗi khôi phục.");
                                  }
                                }}
                                className="p-2 bg-slate-100 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-lg transition"
                                title="Khôi phục"
                              >
                                <RotateCcw size={14} />
                              </button>
                              <button
                                onClick={async () => {
                                  if (
                                    window.confirm(
                                      `Xóa VĨNH VIỄN "${c.ten_danh_muc_con}"?`,
                                    )
                                  ) {
                                    try {
                                      const apiUrl =
                                        import.meta.env.VITE_API_PRODUCT_URL ||
                                        "http://localhost:5002";
                                      await axios.delete(
                                        `${apiUrl}/api/categories/children/${c.ma_dm_con}/hard`,
                                      );
                                      fetchData();
                                    } catch (e) {
                                      alert(
                                        "Lỗi: " +
                                          (e.response?.data?.message ||
                                            e.message),
                                      );
                                    }
                                  }
                                }}
                                className="p-2 bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition"
                                title="Xóa vĩnh viễn"
                              >
                                <AlertTriangle size={14} />
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
                      colSpan="11"
                      className="py-10 text-center text-slate-400 text-xs"
                    >
                      Chưa có danh mục con nào.
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
