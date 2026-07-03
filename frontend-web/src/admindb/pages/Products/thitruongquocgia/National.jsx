import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import {
  Globe,
  Plus,
  Edit,
  Trash2,
  Loader2,
  RotateCcw,
  AlertTriangle,
  Search,
  Filter,
} from "lucide-react";

export default function Nation() {
  const navigate = useNavigate();

  const [nations, setNations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, ACTIVE, INACTIVE

  const apiUrl = import.meta.env.VITE_API_PRODUCT_URL || "http://localhost:5002";

  // Gọi API lấy danh sách quốc gia
  const fetchNations = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${apiUrl}/api/nations`);
      if (res.data && res.data.success) {
        setNations(res.data.data);
      } else {
        setNations([]);
      }
    } catch (error) {
      console.error("❌ Lỗi tải danh sách quốc gia:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNations();
  }, []);

  const handleGoToCreate = () => navigate("/admin/nations/create");
  const handleGoToEdit = (ma_quoc_gia) => navigate(`/admin/nations/edit/${ma_quoc_gia}`);

  // Hàm loại bỏ dấu tiếng Việt để tìm kiếm
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

  // Lọc dữ liệu theo Tìm kiếm và Trạng thái
  const filteredNations = nations.filter((n) => {
    // 1. Lọc theo trạng thái
    if (statusFilter === "ACTIVE" && !n.trang_thai) return false;
    if (statusFilter === "INACTIVE" && n.trang_thai) return false;

    // 2. Lọc theo từ khóa
    const searchStr = removeAccents(searchTerm);
    const maQG = removeAccents(n.ma_quoc_gia);
    const tenQG = removeAccents(n.ten_quoc_gia);
    const maGS1 = removeAccents(n.ma_dinh_danh_sp || "");

    return (
      maQG.includes(searchStr) ||
      tenQG.includes(searchStr) ||
      maGS1.includes(searchStr)
    );
  });

  // Bật/Tắt trạng thái (Xóa mềm / Khôi phục)
  const handleToggleStatus = async (ma_quoc_gia, ten_quoc_gia, currentStatus) => {
    const actionText = currentStatus ? "tạm khóa" : "khôi phục";
    if (window.confirm(`⚠️ Bạn có chắc muốn ${actionText} quốc gia "${ten_quoc_gia}"?`)) {
      try {
        await axios.patch(`${apiUrl}/api/nations/${ma_quoc_gia}/toggle`);
        fetchNations(); // Load lại danh sách
      } catch (error) {
        alert(
          "❌ Lỗi: " +
            (error.response?.data?.message || "Không thể thay đổi trạng thái.")
        );
      }
    }
  };

  // Xóa vĩnh viễn (Xóa cứng)
  const handleHardDelete = async (ma_quoc_gia, ten_quoc_gia) => {
    if (
      window.confirm(
        `🚨 CẢNH BÁO NGUY HIỂM: Bạn đang thực hiện XÓA VĨNH VIỄN quốc gia "${ten_quoc_gia}".\nHành động này không thể hoàn tác. Bạn có chắc chắn?`
      )
    ) {
      try {
        await axios.delete(`${apiUrl}/api/nations/${ma_quoc_gia}`);
        alert(`✅ Đã xóa vĩnh viễn quốc gia ${ten_quoc_gia}.`);
        fetchNations();
      } catch (error) {
        alert(
          "❌ Từ chối xóa: " +
            (error.response?.data?.message || "Lỗi hệ thống.")
        );
      }
    }
  };

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
              Thị trường quốc gia
            </h1>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mt-1">
              <span>Tổng hành dinh</span>
              <span>❯</span>
              <span>Cấu trúc cấu tạo</span>
              <span>❯</span>
              <span className="text-emerald-700 font-bold">Thị trường quốc gia</span>
            </div>
          </div>

          <div className="flex items-center flex-wrap sm:flex-nowrap gap-3 w-full sm:w-auto justify-end">
            {/* THANH TÌM KIẾM */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Tìm mã, tên hoặc mã GS1..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-50 transition"
              />
            </div>

            {/* LỌC TRẠNG THÁI */}
            <div className="relative shrink-0">
              <Filter className="absolute left-3 top-2.5 text-slate-400" size={14} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-600 shadow-sm appearance-none cursor-pointer min-w-[150px]"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="INACTIVE">Đã khóa ẩn</option>
              </select>
              <div className="absolute right-3 top-3 pointer-events-none text-slate-400 text-[8px]">
                ▼
              </div>
            </div>

            {/* NÚT THÊM CỬA HÀNG */}
            <button
              onClick={handleGoToCreate}
              className="flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:shadow transition transform active:scale-98 shrink-0 cursor-pointer whitespace-nowrap"
            >
              <Plus size={14} strokeWidth={2.5} />
              Thêm cửa hàng mới
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
              <table className="w-full text-left border-collapse table-auto min-w-[1050px]">
                <thead>
                  <tr className="bg-slate-50/70 text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-100 select-none">
                    <th className="py-3.5 px-4 w-20 text-center">Cờ</th>
                    <th className="py-3.5 px-4 w-28">Mã QG</th>
                    <th className="py-3.5 px-4 w-28">Mã GS1</th>
                    <th className="py-3.5 px-4">Tên cửa hàng thị trường</th>
                    <th className="py-3.5 px-4 w-36">Định dạng vùng</th>
                    <th className="py-3.5 px-4 w-36">Hệ tiền tệ</th>
                    <th className="py-3.5 px-4 w-28 text-right">Tỷ giá quy đổi</th>
                    <th className="py-3.5 px-4 w-32 text-center">Trạng thái</th>
                    <th className="py-3.5 px-4 w-28 text-right pr-6 sticky right-0 bg-slate-50/90 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.03)]">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-700">
                  {filteredNations.length > 0 ? (
                    filteredNations.map((n, i) => (
                      <tr key={n.ma_quoc_gia || i} className="group transition hover:bg-slate-50/60">
                        <td className="py-3 px-4 text-center text-xl shrink-0 select-none">
                          {n.bieu_tuong_co || "🌐"}
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-mono font-medium text-[11px]">
                          {n.ma_quoc_gia}
                        </td>
                        <td className="py-3 px-4 text-purple-700 font-mono font-bold text-[11px]">
                          {n.ma_dinh_danh_sp || "—"}
                        </td>
                        <td className="py-3 px-4 text-slate-900 font-bold group-hover:text-emerald-700 transition">
                          {n.ten_quoc_gia}
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-normal">
                          {n.dinh_dang_vung || "—"}
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {n.ma_tien_te}{" "}
                          <span className="text-slate-400 font-normal font-mono">
                            ({n.bieu_tuong_tien || "—"})
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-blue-600 font-bold">
                          {Number(n.ty_gia || 0).toLocaleString("vi-VN")}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {n.trang_thai ? (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide whitespace-nowrap">
                              Hoạt động
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide whitespace-nowrap">
                              Đã khóa ẩn
                            </span>
                          )}
                        </td>

                        {/* 🌟 ĐÃ SỬA CHUẨN: Phần logic hoàn chỉnh của các nút thao tác */}
                        <td className="py-3 px-4 text-right pr-6 bg-white sticky right-0 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.03)] group-hover:bg-slate-50 transition-colors">
                          <div className="flex items-center justify-end gap-1 text-slate-400">
                            <button
                              onClick={() => handleGoToEdit(n.ma_quoc_gia)}
                              className="p-1.5 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                              title="Chỉnh sửa thông số"
                            >
                              <Edit size={14} />
                            </button>

                            {n.trang_thai ? (
                              <button
                                onClick={() => handleToggleStatus(n.ma_quoc_gia, n.ten_quoc_gia, n.trang_thai)}
                                className="p-1.5 hover:text-red-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                title="Tạm dừng hoạt động"
                              >
                                <Trash2 size={14} />
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleToggleStatus(n.ma_quoc_gia, n.ten_quoc_gia, n.trang_thai)}
                                  className="p-1.5 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                  title="Tái kích hoạt"
                                >
                                  <RotateCcw size={14} strokeWidth={2.5} />
                                </button>
                                <button
                                  onClick={() => handleHardDelete(n.ma_quoc_gia, n.ten_quoc_gia)}
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
                      <td colSpan="9" className="py-12 text-center text-slate-400 font-medium">
                        Không tìm thấy thị trường quốc gia nào khớp với bộ lọc.
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