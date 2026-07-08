import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
// 🌟 Import instance API quản lý kho hàng từ file cấu hình axios của bạn
import { warehouseApi } from "../../../../api/axios"; // Hãy điều chỉnh lại đường dẫn file cho đúng thực tế

const NhapKhoForm = () => {
  const navigate = useNavigate(); 
  
  // 📦 Quản lý dữ liệu kho hàng động lấy từ database
  const [warehouseData, setWarehouseData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  // ==========================================
  // KHỞI TẠO DỮ LIỆU QUA PRODUCTAPI INTERCEPTOR
  // ==========================================
  const fetchUnits = async () => {
    setLoading(true);
    warehouseApi.get("/warehouses")
      .then((response) => {
        console.log("=== KIỂM TRA PHẢN HỒI AXIOS ===");
        console.log("Gốc (response):", response);

        // 🌟 TỰ ĐỘNG NHẬN DIỆN TẦNG DỮ LIỆU CHỐNG LỖI INTERCEPTOR
        let finalData = [];
        
        if (response && Array.isArray(response)) {
          // Trường hợp 1: Axios Interceptor đã bóc sẵn response thành mảng dữ liệu
          finalData = response;
        } else if (response && response.data && Array.isArray(response.data)) {
          // Trường hợp 2: Axios trả về Object Response nguyên bản, chứa mảng trong .data
          finalData = response.data;
        } else if (response && response.data && response.data.data && Array.isArray(response.data.data)) {
          // Trường hợp 3: Dữ liệu bị bọc sâu trong response.data.data
          finalData = response.data.data;
        }

        console.log("Mảng dữ liệu sau khi lọc tầng:", finalData);
        setWarehouseData(finalData);
      })
      .catch((error) => {
        console.error("❌ Lỗi kết nối API kho hàng:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  // Hàm xử lý xóa nhanh bộ lọc (Reset)
  const handleResetFilters = () => {
    setSearch("");
    setStatus("");
  };

  return (
    <div className="w-full min-h-screen bg-[#fafafa] font-sans text-gray-800 antialiased p-1 text-left">
      
      {/* ---------------- TIÊU ĐỀ HOẠT ĐỘNG ---------------- */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Danh sách kho</h1>
          <nav className="text-sm text-gray-400 mt-1">
            Dashboard &gt; Kho Hàng &gt; <span className="text-emerald-600 font-medium">Danh sách kho</span>
          </nav>
        </div>

        {/* 🌟 ĐỒNG BỘ CHUẨN: Màu sắc, kích thước padding (px-4 py-2), gap-1.5, text-xs font-bold và hiệu ứng active */}
        <button 
          onClick={() => navigate("/admin/inventory/create-warehouse")}
          className="flex items-center justify-center gap-1.5 bg-[#006c49] hover:bg-[#005237] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:shadow transition transform active:scale-98 shrink-0 cursor-pointer whitespace-nowrap"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Thêm kho
        </button>
      </div>

      {/* ---------------- BLOCK TÌM KIẾM & BỘ LỌC ---------------- */}
      <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Input Search */}
          <div className="relative min-w-[260px] flex-1 max-w-xs">
            <input
              type="text"
              placeholder="Tìm theo mã kho, tên kho..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-3 pr-9 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#006c49] transition-all placeholder-gray-400 font-medium"
            />
            <span className="absolute inset-y-0 right-3 flex items-center text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.603 10.601Z" />
              </svg>
            </span>
          </div>

          {/* Trạng thái Dropdown */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-600 outline-none min-w-[150px] font-bold cursor-pointer focus:border-[#006c49]"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="maintenance">Bảo trì</option>
          </select>

          {/* Nút Reset Bộ Lọc */}
          <button 
            onClick={handleResetFilters}
            title="Xóa bộ lọc"
            className="p-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-gray-500 transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
        </div>

        {/* Nút Lọc & Xuất báo cáo */}
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3.5 py-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-sm text-gray-600 font-bold transition cursor-pointer">Lọc</button>
          <button className="flex items-center gap-1.5 px-3.5 py-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-sm text-gray-600 font-bold transition cursor-pointer">Xuất</button>
        </div>
      </div>

      {/* ---------------- BẢNG HIỂN THỊ DANH SÁCH CÁC KHO HÀNG ---------------- */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-400 select-none">
                <th className="py-4 px-6 text-center">Mã Kho</th>
                <th className="py-4 px-6">Tên Kho</th>
                <th className="py-4 px-6 w-[35%]">Địa Chỉ</th>
                <th className="py-4 px-6 text-center">Trạng Thái</th>
                <th className="py-4 px-6">Ngày Tạo</th>
                <th className="py-4 px-6">Ngày Cập Nhật</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-semibold text-slate-600">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-sm text-[#006c49] font-bold">
                    <div className="flex items-center justify-center gap-2 animate-pulse">
                      <span>Đang tải dữ liệu từ hệ thống kho...</span>
                    </div>
                  </td>
                </tr>
              ) : !Array.isArray(warehouseData) || warehouseData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-sm text-gray-400 font-medium">
                    Không có thông tin kho hàng nào được tìm thấy.
                  </td>
                </tr>
              ) : (
                warehouseData
                  .filter((row) => {
                    const tenKho = row.ten_kho || "";
                    const maKho = row.ma_kho || "";
                    const trangThai = row.trang_thai || "";

                    const matchesSearch = 
                      tenKho.toLowerCase().includes(search.toLowerCase()) || 
                      maKho.toLowerCase().includes(search.toLowerCase());
                    const matchesStatus = status === "" || trangThai === status;
                    return matchesSearch && matchesStatus;
                  })
                  .map((row) => (
                    <tr key={row.ma_kho} className="hover:bg-slate-50/60 transition-colors">
                      {/* Mã Kho */}
                      <td className="py-4 px-6 text-center text-[#006c49] font-black font-mono">
                        {row.ma_kho}
                      </td>
                      {/* Tên Kho */}
                      <td className="py-4 px-6 text-gray-900 font-bold">
                        {row.ten_kho}
                      </td>
                      {/* Địa Chỉ */}
                      <td className="py-4 px-6 text-gray-500 font-medium whitespace-normal break-words">
                        {row.dia_chi}
                      </td>
                      {/* Trạng Thái */}
                      <td className="py-4 px-6 text-center">
                        {row.trang_thai === "active" ? (
                          <span className="px-2.5 py-0.5 text-[11px] font-bold rounded bg-emerald-50 text-emerald-600 uppercase">
                            Hoạt động
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 text-[11px] font-bold rounded bg-amber-50 text-amber-600 uppercase">
                            Bảo trì
                          </span>
                        )}
                      </td>
                      {/* Ngày Tạo */}
                      <td className="py-4 px-6 text-gray-400 font-medium font-mono text-xs">
                        {row.ngay_tao}
                      </td>
                      {/* Ngày Cập Nhật */}
                      <td className="py-4 px-6 text-gray-400 font-medium font-mono text-xs">
                        {row.ngay_cap_nhat}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER ĐIỀU HƯỚNG PHÂN TRANG GỌN GÀNG */}
        <div className="p-4 bg-white border-t border-gray-50 flex items-center justify-between text-xs text-gray-400 font-bold select-none">
          <div>Hiển thị 1 - {warehouseData.length} trên tổng số {warehouseData.length} Kho</div>
          <div className="flex items-center gap-4 text-xs font-medium text-gray-400">
            <div className="flex items-center gap-2">
              <span>The page on</span>
              <select className="border border-gray-200 rounded px-2 py-1 bg-white text-gray-700 outline-none font-bold">
                <option>1</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-1.5 border border-gray-200 rounded text-gray-300 bg-white cursor-not-allowed" disabled>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button className="p-1.5 border border-gray-200 rounded text-gray-300 bg-white cursor-not-allowed" disabled>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NhapKhoForm;