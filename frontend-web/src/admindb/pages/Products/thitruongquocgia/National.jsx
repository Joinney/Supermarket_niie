import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

  const apiUrl =
    import.meta.env.VITE_API_PRODUCT_URL || "http://localhost:5002";

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
  const handleGoToEdit = (ma_quoc_gia) =>
    navigate(`/admin/nations/edit/${ma_quoc_gia}`);

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
  const handleToggleStatus = async (
    ma_quoc_gia,
    ten_quoc_gia,
    currentStatus,
  ) => {
    const actionText = currentStatus ? "tạm khóa" : "khôi phục";
    if (
      window.confirm(
        `⚠️ Bạn có chắc muốn ${actionText} quốc gia "${ten_quoc_gia}"?`,
      )
    ) {
      try {
        await axios.patch(`${apiUrl}/api/nations/${ma_quoc_gia}/toggle`);
        fetchNations(); // Load lại danh sách
      } catch (error) {
        alert(
          "❌ Lỗi: " +
            (error.response?.data?.message || "Không thể thay đổi trạng thái."),
        );
      }
    }
  };

  // Xóa vĩnh viễn (Xóa cứng)
  const handleHardDelete = async (ma_quoc_gia, ten_quoc_gia) => {
    if (
      window.confirm(
        `CẢNH BÁO: Bạn đang thực hiện XÓA VĨNH VIỄN quốc gia "${ten_quoc_gia}".\nHành động này không thể hoàn tác. Bạn có chắc chắn?`,
      )
    ) {
      try {
        await axios.delete(`${apiUrl}/api/nations/${ma_quoc_gia}`);
        alert(`✅ Đã xóa vĩnh viễn quốc gia ${ten_quoc_gia}.`);
        fetchNations();
      } catch (error) {
        alert(
          "❌ Từ chối xóa: " +
            (error.response?.data?.message || "Lỗi hệ thống."),
        );
      }
    }
  };

  return (
    <div className="p-6 w-full flex-1 font-sans relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Globe className="text-[#006c49]" /> Thị Trường Quốc Gia
          </h1>
          <p className="text-xs font-bold text-slate-400 mt-1">
            Quản lý các khu vực phân phối sản phẩm
          </p>
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

          {/* LỌC TRẠNG THÁI */}
          <div className="relative">
            <Filter
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-[#006c49] shadow-sm appearance-none cursor-pointer min-w-[160px]"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="INACTIVE">Đã khóa</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
              ▼
            </div>
          </div>

          {/* NÚT TẠO MỚI */}
          <button
            onClick={handleGoToCreate}
            className="bg-[#006c49] hover:bg-[#005137] text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition active:scale-95 shadow-md whitespace-nowrap"
          >
            <Plus size={16} strokeWidth={3} /> Thêm Cửa Hàng
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
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="bg-slate-50/80 border-b border-gray-100 text-[11px] font-black text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-6 w-20 text-center">Cờ</th>
                  <th className="py-4 px-6 w-24">Mã QG</th>
                  <th className="py-4 px-6 w-24">Mã GS1</th>
                  <th className="py-4 px-6 w-48">Tên Cửa Hàng</th>
                  <th className="py-4 px-6 w-32">Định Dạng Vùng</th>
                  <th className="py-4 px-6 w-32">Tiền Tệ</th>
                  <th className="py-4 px-6 w-24 text-right">Tỷ Giá</th>
                  <th className="py-4 px-6 w-32 text-center">Trạng thái</th>
                  <th className="py-4 px-6 w-32 text-right sticky right-0 bg-slate-50/80 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm font-bold text-slate-700">
                {filteredNations.length > 0 ? (
                  filteredNations.map((n, i) => (
                    <tr
                      key={n.ma_quoc_gia || i}
                      className="hover:bg-slate-50 transition group"
                    >
                      {/* BIEU TUONG CO */}
                      <td className="py-3 px-6 text-center text-2xl">
                        {n.bieu_tuong_co || "🌐"}
                      </td>

                      {/* MA QUOC GIA */}
                      <td className="py-4 px-6 text-slate-400 font-mono text-xs">
                        {n.ma_quoc_gia}
                      </td>

                      {/* MA DINH DANH SP (GS1) */}
                      <td className="py-4 px-6 text-indigo-600 font-mono text-xs font-bold">
                        {n.ma_dinh_danh_sp || "---"}
                      </td>

                      {/* TEN QUOC GIA */}
                      <td className="py-4 px-6 text-slate-900 group-hover:text-[#006c49] transition-colors">
                        {n.ten_quoc_gia}
                      </td>

                      {/* DINH DANG VUNG */}
                      <td className="py-4 px-6 text-slate-500 font-normal text-xs">
                        {n.dinh_dang_vung || "N/A"}
                      </td>

                      {/* TIEN TE */}
                      <td className="py-4 px-6 text-slate-600">
                        {n.ma_tien_te}{" "}
                        <span className="text-slate-400 font-normal">
                          ({n.bieu_tuong_tien})
                        </span>
                      </td>

                      {/* TY GIA */}
                      <td className="py-4 px-6 text-right font-mono text-xs text-sky-600">
                        {Number(n.ty_gia).toLocaleString()}
                      </td>

                      {/* TRANG THAI */}
                      <td className="py-4 px-6 text-center">
                        {n.trang_thai ? (
                          <span className="bg-emerald-100 text-[#006c49] px-2.5 py-1 rounded-md text-[10px] uppercase whitespace-nowrap">
                            Hoạt động
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-500 px-2.5 py-1 rounded-md text-[10px] uppercase whitespace-nowrap">
                            Đã Tắt
                          </span>
                        )}
                      </td>

                      {/* THAO TAC */}
                      <td className="py-4 px-6 bg-white sticky right-0 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)] group-hover:bg-slate-50 transition-colors">
                        <div className="flex items-center justify-end gap-2">
                          {/* NÚT SỬA */}
                          <button
                            onClick={() => handleGoToEdit(n.ma_quoc_gia)}
                            className="p-2 bg-slate-100 text-slate-600 hover:bg-sky-100 hover:text-sky-700 rounded-lg transition shadow-sm"
                            title="Chỉnh sửa"
                          >
                            <Edit size={14} />
                          </button>

                          {n.trang_thai ? (
                            <button
                              onClick={() =>
                                handleToggleStatus(
                                  n.ma_quoc_gia,
                                  n.ten_quoc_gia,
                                  n.trang_thai,
                                )
                              }
                              className="p-2 bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-700 rounded-lg transition shadow-sm"
                              title="Tạm tắt cửa hàng"
                            >
                              <Trash2 size={14} />
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() =>
                                  handleToggleStatus(
                                    n.ma_quoc_gia,
                                    n.ten_quoc_gia,
                                    n.trang_thai,
                                  )
                                }
                                className="p-2 bg-slate-100 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition shadow-sm"
                                title="Khôi phục hoạt động"
                              >
                                <RotateCcw size={14} strokeWidth={2.5} />
                              </button>
                              <button
                                onClick={() =>
                                  handleHardDelete(
                                    n.ma_quoc_gia,
                                    n.ten_quoc_gia,
                                  )
                                }
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
                      colSpan="8"
                      className="py-10 text-center text-slate-400 text-xs"
                    >
                      Không tìm thấy dữ liệu quốc gia nào.
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
