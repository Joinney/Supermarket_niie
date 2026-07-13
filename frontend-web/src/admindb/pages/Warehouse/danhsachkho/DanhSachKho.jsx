import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { warehouseApi } from "../../../../api/axios";

const DanhSachKho = () => {
  const navigate = useNavigate();

  const [warehouseData, setWarehouseData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  // Hàm gọi API lấy danh sách kho
  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      const response = await warehouseApi.get("/warehouses");
      let finalData = [];
      if (response && Array.isArray(response)) finalData = response;
      else if (response?.data && Array.isArray(response.data))
        finalData = response.data;
      else if (response?.data?.data && Array.isArray(response.data.data))
        finalData = response.data.data;

      setWarehouseData(finalData);
    } catch (error) {
      console.error("❌ Lỗi kết nối API kho hàng:", error);
      alert("Không thể tải dữ liệu kho hàng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  // 🎯 HÀM: BẬT/TẮT TRẠNG THÁI NHANH
  const handleToggleStatus = async (maKho, currentStatus) => {
    try {
      await warehouseApi.put(`/warehouses/${maKho}/toggle-status`);
      // Update local state cho mượt
      setWarehouseData((prev) =>
        prev.map((w) =>
          w.ma_kho === maKho
            ? {
                ...w,
                trang_thai: currentStatus === "active" ? "inactive" : "active",
              }
            : w,
        ),
      );
    } catch (error) {
      console.error("Lỗi cập nhật trạng thái:", error);
      alert("Cập nhật trạng thái thất bại.");
    }
  };

  // 🎯 HÀM: XÓA KHO HÀNG (Có bắt lỗi chặn xóa của Backend)
  const handleDelete = async (maKho) => {
    const isConfirm = window.confirm(
      `Bạn có chắc chắn muốn xóa vĩnh viễn kho [${maKho}] không?`,
    );
    if (!isConfirm) return;

    try {
      await warehouseApi.delete(`/warehouses/${maKho}`);
      // Xóa local state
      setWarehouseData((prev) => prev.filter((w) => w.ma_kho !== maKho));
      alert("Đã xóa kho hàng thành công!");
    } catch (error) {
      if (error.response && error.response.status === 409) {
        alert(
          error.response.data.error || "Không thể xóa kho đang chứa dữ liệu.",
        );
      } else {
        alert("Lỗi khi xóa kho hàng.");
      }
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#fafafa] font-sans text-gray-800 antialiased p-1 text-left">
      {/* ---------------- TIÊU ĐỀ ---------------- */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
            Danh sách kho
          </h1>
          <nav className="text-sm text-gray-400 mt-1">
            Dashboard &gt; Kho Hàng &gt;{" "}
            <span className="text-[#006c49] font-medium">Danh sách kho</span>
          </nav>
        </div>
        <button
          onClick={() => navigate("/admin/inventory/create-warehouse")}
          className="flex items-center justify-center gap-1.5 bg-[#006c49] hover:bg-[#005237] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition"
        >
          {/* Thay đổi dấu cộng thành icon vẽ SVG */}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Thêm kho
        </button>
      </div>

      {/* ---------------- BỘ LỌC ---------------- */}
      <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3 mb-6">
        <div className="relative min-w-[300px] flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Tìm theo mã kho, tên kho..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-[#006c49] transition-all"
          />
          {/* Icon Tìm kiếm vẽ bằng SVG */}
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </span>
        </div>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white text-gray-600 outline-none min-w-[150px] font-bold cursor-pointer focus:border-[#006c49]"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="inactive">Bảo trì</option>
        </select>

        <button
          onClick={() => {
            setSearch("");
            setStatus("");
          }}
          className="p-2 border border-gray-200 bg-slate-50 hover:bg-slate-100 rounded-xl text-gray-500 transition cursor-pointer flex items-center justify-center"
          title="Làm mới"
        >
          {/* Icon Làm mới / Đồng bộ bằng SVG */}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        </button>
      </div>

      {/* ---------------- BẢNG DỮ LIỆU ---------------- */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                <th className="py-4 px-6 text-center">Mã Kho</th>
                <th className="py-4 px-6">Tên Kho</th>
                <th className="py-4 px-6 w-[35%]">Địa Chỉ</th>
                <th className="py-4 px-6 text-center">Trạng Thái</th>
                <th className="py-4 px-6">Ngày Cập Nhật</th>
                <th className="py-4 px-6 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-semibold text-slate-600">
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="py-10 text-center text-[#006c49] font-bold animate-pulse"
                  >
                    Đang tải dữ liệu từ hệ thống kho...
                  </td>
                </tr>
              ) : warehouseData.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="py-10 text-center text-gray-400 font-medium"
                  >
                    Không có thông tin kho hàng nào được tìm thấy.
                  </td>
                </tr>
              ) : (
                warehouseData
                  .filter((row) => {
                    const matchesSearch =
                      (row.ten_kho || "")
                        .toLowerCase()
                        .includes(search.toLowerCase()) ||
                      (row.ma_kho || "")
                        .toLowerCase()
                        .includes(search.toLowerCase());
                    const matchesStatus =
                      status === "" || row.trang_thai === status;
                    return matchesSearch && matchesStatus;
                  })
                  .map((row) => (
                    <tr
                      key={row.ma_kho}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="py-4 px-6 text-center text-[#006c49] font-black font-mono">
                        {row.ma_kho}
                      </td>
                      <td className="py-4 px-6 text-gray-900 font-bold">
                        {row.ten_kho}
                      </td>
                      <td className="py-4 px-6 text-gray-500 font-medium whitespace-normal break-words">
                        {row.dia_chi}
                      </td>

                      {/* TRẠNG THÁI CLICKABLE */}
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() =>
                            handleToggleStatus(row.ma_kho, row.trang_thai)
                          }
                          className={`px-2.5 py-1 text-[10px] font-black rounded uppercase transition hover:opacity-80 active:scale-95 cursor-pointer ${
                            row.trang_thai === "active"
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                              : "bg-amber-50 text-amber-600 border border-amber-200"
                          }`}
                          title="Bấm để đổi trạng thái"
                        >
                          {row.trang_thai === "active"
                            ? "Hoạt động"
                            : "Bảo trì"}
                        </button>
                      </td>

                      <td className="py-4 px-6 text-gray-400 font-medium font-mono text-xs">
                        {row.ngay_cap_nhat}
                      </td>

                      {/* CỘT THAO TÁC */}
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() =>
                              navigate(
                                `/admin/inventory/edit-warehouse/${row.ma_kho}`,
                              )
                            }
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                            title="Sửa thông tin kho"
                          >
                            {/* Icon Sửa (Bút chì) bằng SVG */}
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(row.ma_kho)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                            title="Xóa kho hàng"
                          >
                            {/* Icon Xóa (Thùng rác) bằng SVG */}
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.184v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}
        <div className="p-4 bg-white border-t border-gray-50 flex justify-between text-xs text-gray-400 font-bold select-none">
          <div>Hiển thị tổng số {warehouseData.length} Kho</div>
        </div>
      </div>
    </div>
  );
};

export default DanhSachKho;