import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Search,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";

export default function Units() {
  const navigate = useNavigate();
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const apiUrl =
    import.meta.env.VITE_API_PRODUCT_URL || "http://localhost:5002";

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

  const fetchUnits = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${apiUrl}/api/products/units`);
      setUnits(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (error) {
      console.error("Lỗi tải đơn vị:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  // Hàm lọc không dấu
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

  const filteredUnits = units.filter((u) => {
    const search = removeAccents(searchTerm);
    return (
      removeAccents(u.ten_don_vi).includes(search) ||
      removeAccents(u.mo_ta).includes(search)
    );
  });

  const handleGoToCreate = () => navigate("/admin/products/units/create");
  const handleGoToEdit = (id) => navigate(`/admin/products/units/edit/${id}`);
  const handleDelete = async (id, name, isHardDelete = false) => {
    const confirmMsg = isHardDelete
      ? `CẢNH BÁO: Xóa vĩnh viễn "${name}"?`
      : `Đưa "${name}" vào lưu trữ?`;

    if (window.confirm(confirmMsg)) {
      try {
        const url = isHardDelete
          ? `${apiUrl}/api/products/units/${id}/hard`
          : `${apiUrl}/api/products/units/${id}`;
        await axios.delete(url);
        fetchUnits();
      } catch (error) {
        alert("❌ Lỗi: " + (error.response?.data?.message || "Có lỗi xảy ra."));
      }
    }
  };

  const handleRestore = async (id) => {
    try {
      await axios.put(`${apiUrl}/api/products/units/${id}/restore`);
      fetchUnits();
    } catch (error) {
      alert("❌ Lỗi khôi phục.");
    }
  };

  return (
    <div className="p-6 w-full flex-1 font-sans">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Box className="text-[#006c49]" /> Quy chuẩn Đóng gói
          </h1>
          <p className="text-xs text-slate-500 font-bold mt-1">
            Danh sách các đơn vị lưu kho và bán hàng (Thùng, Lốc, Lon...)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Tìm tên hoặc mô tả..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-[#006c49] shadow-sm w-56 transition-all"
            />
          </div>
          <button
            onClick={handleGoToCreate}
            className="bg-[#006c49] hover:bg-[#005137] text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition active:scale-95 shadow-md"
          >
            <Plus size={16} /> Thêm đơn vị
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
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="bg-slate-50/80 border-b border-gray-100 text-[11px] font-black text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-6 w-20">ID</th>
                  <th className="py-4 px-6 w-48">Tên đơn vị</th>
                  <th className="py-4 px-6">Mô tả</th>
                  <th className="py-4 px-6 w-32 text-center">Ngày tạo</th>
                  <th className="py-4 px-6 w-32 text-center">Ngày cập nhật</th>
                  <th className="py-4 px-6 w-28 text-center">Trạng thái</th>
                  <th className="py-4 px-6 w-28 text-right sticky right-0 bg-slate-50/80 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm font-bold text-slate-700">
                {filteredUnits.length > 0 ? (
                  filteredUnits.map((u, i) => (
                    <tr
                      key={u.id || i}
                      className="hover:bg-slate-50 transition group"
                    >
                      <td className="py-4 px-6 text-slate-400 font-mono text-xs">
                        #{u.id}
                      </td>
                      <td className="py-4 px-6 text-[#006c49] text-base">
                        {u.ten_don_vi}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-500 font-medium">
                        {u.mo_ta || "---"}
                      </td>
                      <td className="py-4 px-6 text-center font-normal text-[11px] text-slate-500">
                        {formatDate(u.ngay_tao)}
                      </td>
                      <td className="py-4 px-6 text-center font-normal text-[11px] text-slate-500">
                        {formatDate(u.ngay_cap_nhat)}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-md text-[10px] uppercase whitespace-nowrap ${u.trang_thai ? "bg-emerald-100 text-[#006c49]" : "bg-slate-100 text-slate-500"}`}
                        >
                          {u.trang_thai ? "Hoạt động" : "Đã Tắt"}
                        </span>
                      </td>
                      <td className="py-4 px-6 bg-white sticky right-0 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)] group-hover:bg-slate-50 transition-colors">
                        <div className="flex items-center justify-end gap-2">
                          {u.trang_thai ? (
                            <>
                              <button
                                onClick={() => handleGoToEdit(u.id)}
                                className="p-2 bg-slate-100 text-slate-600 hover:bg-sky-100 hover:text-sky-700 rounded-lg transition"
                                title="Sửa"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() =>
                                  handleDelete(u.id, u.ten_don_vi, false)
                                }
                                className="p-2 bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-700 rounded-lg transition"
                                title="Tạm tắt"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleRestore(u.id)}
                                className="p-2 bg-slate-100 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                                title="Khôi phục"
                              >
                                <RotateCcw size={14} />
                              </button>
                              <button
                                onClick={() =>
                                  handleDelete(u.id, u.ten_don_vi, true)
                                }
                                className="p-2 bg-slate-100 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
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
                      colSpan="7"
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
