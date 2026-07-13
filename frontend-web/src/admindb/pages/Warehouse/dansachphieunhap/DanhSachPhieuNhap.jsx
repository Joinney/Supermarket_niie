import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { warehouseApi } from "../../../../api/axios";

export default function DanhSachPhieuNhap() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const filterDropdownRef = useRef(null);
  const [filterWarehouse, setFilterWarehouse] = useState("");
  const [filterPriceRange, setFilterPriceRange] = useState("");

  const [importTickets, setImportTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🌟 THÊM ĐỒNG HỒ REAL-TIME CHO BÁO CÁO PDF
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target)
      ) {
        setShowFilterDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    warehouseApi
      .get("/inventory-tickets")
      .then((res) => {
        const rawData = Array.isArray(res.data)
          ? res.data
          : res.data.data || [];
        const mappedData = rawData.map((item) => {
          let creatorName = "Hệ thống";
          if (
            item.ghi_chu &&
            typeof item.ghi_chu === "string" &&
            item.ghi_chu.includes("Người lập:")
          ) {
            const partAfterCreator = item.ghi_chu.split("Người lập:")[1];
            if (partAfterCreator) {
              creatorName = partAfterCreator.split("|")[0].trim();
            }
          } else if (item.nguoi_thuc_hien_id) {
            creatorName = `User ID: ${item.nguoi_thuc_hien_id}`;
          }

          return {
            id: item.ma_phieu,
            warehouse: item.ma_kho || "Kho Tổng",
            status: "completed",
            date:
              item.ngay_tao && item.ngay_tao !== "0001-01-01T00:00:00Z"
                ? new Date(item.ngay_tao).toLocaleString("vi-VN")
                : "N/A",
            creator: creatorName,
            total: Number(item.tong_tien) || 0,
            debt: 0,
          };
        });
        setImportTickets(mappedData);
      })
      .catch((err) => console.error("Lỗi kết nối API:", err))
      .finally(() => setLoading(false));
  }, []);

  const formatCurrency = (num) => {
    return new Intl.NumberFormat("vi-VN").format(num) + " đ";
  };

  const handleResetFilters = () => {
    setSearch("");
    setStatus("");
    setFilterWarehouse("");
    setFilterPriceRange("");
    setShowFilterDropdown(false);
  };

  const filteredTickets = importTickets.filter((row) => {
    const matchId = row.id
      ? row.id.toLowerCase().includes(search.toLowerCase())
      : false;
    const matchStatus = status === "" || row.status === status;
    const matchWarehouse =
      filterWarehouse === "" || row.warehouse === filterWarehouse;
    let matchPrice = true;
    if (filterPriceRange === "under1m") matchPrice = row.total < 1000000;
    else if (filterPriceRange === "1m-10m")
      matchPrice = row.total >= 1000000 && row.total <= 10000000;
    else if (filterPriceRange === "over10m") matchPrice = row.total > 10000000;

    return matchId && matchStatus && matchWarehouse && matchPrice;
  });

  const totalFilteredAmount = filteredTickets.reduce(
    (sum, ticket) => sum + ticket.total,
    0,
  );
  const uniqueWarehouses = [...new Set(importTickets.map((t) => t.warehouse))];

  // 🌟 GỌI LỆNH IN NATIVE CỦA TRÌNH DUYỆT
  const handleExportData = () => {
    window.print();
  };

  return (
    <>
      {/* 🌟 CSS MA THUẬT DÀNH RIÊNG CHO LỆNH PRINT */}
      <style>{`
        @media print {
          /* Ẩn toàn bộ giao diện nền web */
          body * { visibility: hidden; }
          
          /* Chỉ hiển thị template báo cáo, fix cứng font Times New Roman chống lỗi tiếng Việt */
          #pdf-report-template, #pdf-report-template * { 
            visibility: visible; 
            font-family: 'Times New Roman', Times, serif !important;
          }
          
          /* Kéo template lên góc trái cùng trang giấy */
          #pdf-report-template {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: block !important; 
          }
          
          /* Chỉnh khổ giấy A4, ẩn header/footer mặc định của trình duyệt */
          @page { size: A4 portrait; margin: 15mm; }
        }
      `}</style>

      <div className="w-full min-h-screen bg-[#fafafa] font-sans text-gray-800 antialiased p-1 text-left print:bg-white">
        {/* ========================================================= */}
        {/* KHỐI GIAO DIỆN WEB (SẼ BỊ ẨN KHI BẤM NÚT IN BẰNG print:hidden) */}
        {/* ========================================================= */}
        <div className="w-full print:hidden">
          {/* HEADER AREA */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
                Danh sách phiếu nhập
              </h1>
              <nav className="text-sm text-gray-400 mt-1">
                Dashboard &gt;{" "}
                <span className="text-[#006c49] font-medium">
                  Danh sách phiếu nhập
                </span>
              </nav>
            </div>

            <button
              onClick={() => navigate("/admin/inventory/create-import-ticket")}
              className="flex items-center justify-center gap-1.5 bg-[#006c49] hover:bg-[#005237] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:shadow transition transform active:scale-98 shrink-0 cursor-pointer"
            >
              {/* Thay đổi dấu cộng text thành icon SVG vẽ */}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Tạo Phiếu nhập
            </button>
          </div>

          {/* FILTER CONTROLS */}
          <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between gap-3 mb-6 relative">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative min-w-[300px] flex-1 max-w-sm">
                {/* Thay emoji kính lúp bằng SVG */}
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Tìm kiếm theo mã phiếu nhập..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-xl outline-none focus:border-[#006c49] transition-all font-medium text-slate-800"
                />
              </div>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-600 outline-none min-w-[150px] font-bold cursor-pointer focus:border-[#006c49]"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="completed">Hoàn thành</option>
                <option value="debt">Còn nợ</option>
              </select>

              {(search || status || filterWarehouse || filterPriceRange) && (
                <button
                  onClick={handleResetFilters}
                  className="p-2 border border-rose-200 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-100 transition cursor-pointer"
                  title="Xóa tất cả bộ lọc"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18 18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>

            <div
              className="flex items-center gap-2 relative"
              ref={filterDropdownRef}
            >
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className={`px-4 py-2 border rounded-lg text-sm font-bold transition cursor-pointer flex items-center gap-2 ${showFilterDropdown || filterWarehouse || filterPriceRange ? "bg-emerald-50 border-emerald-200 text-[#006c49]" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}
              >
                Lọc Nâng Cao
                {/* Thay thế kí tự tam giác ▼ thành icon mũi tên SVG có hiệu ứng xoay khi đóng mở */}
                <svg 
                  className={`w-3 h-3 transition-transform duration-200 ${showFilterDropdown ? "rotate-180" : ""}`} 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {showFilterDropdown && (
                <div className="absolute right-[80px] top-full mt-2 w-72 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 z-50">
                  <h3 className="text-xs font-black uppercase text-gray-400 mb-3 border-b border-gray-100 pb-2">
                    Bộ lọc chi tiết
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1.5">
                        Lọc theo Kho hàng
                      </label>
                      <select
                        value={filterWarehouse}
                        onChange={(e) => setFilterWarehouse(e.target.value)}
                        className="w-full p-2 text-xs border border-gray-200 rounded-lg outline-none cursor-pointer focus:border-[#006c49]"
                      >
                        <option value="">-- Tất cả kho --</option>
                        {uniqueWarehouses.map((w) => (
                          <option key={w} value={w}>
                            {w}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1.5">
                        Giá trị chứng từ
                      </label>
                      <select
                        value={filterPriceRange}
                        onChange={(e) => setFilterPriceRange(e.target.value)}
                        className="w-full p-2 text-xs border border-gray-200 rounded-lg outline-none cursor-pointer focus:border-[#006c49]"
                      >
                        <option value="">-- Mọi mức giá --</option>
                        <option value="under1m">Dưới 1,000,000 đ</option>
                        <option value="1m-10m">Từ 1tr - 10,000,000 đ</option>
                        <option value="over10m">Trên 10,000,000 đ</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* 🌟 NÚT XUẤT PDF ĐÃ ĐƯỢC KÍCH HOẠT */}
              <button
                onClick={handleExportData}
                className="px-4 py-2 border border-emerald-200 bg-emerald-50 rounded-lg text-sm font-bold text-emerald-700 hover:bg-emerald-100 transition cursor-pointer flex items-center gap-1.5"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.617 0-1.11-.51-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-14.326 0C3.768 7.441 3 8.376 3 9.456v6.294a2.25 2.25 0 0 0 2.25 2.25h1.091M5.25 9.75h13.5M9 21h6"
                  />
                </svg>
                Xuất PDF
              </button>
            </div>
          </div>

          {/* THỐNG KÊ NHANH */}
          {!loading && importTickets.length > 0 && (
            <div className="flex items-center gap-6 mb-4 px-2 select-none">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  Đang hiển thị:
                </span>
                <span className="text-sm font-bold text-[#006c49] bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                  {filteredTickets.length} Phiếu
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  Tổng giá trị:
                </span>
                <span className="text-sm font-mono font-black text-slate-700">
                  {formatCurrency(totalFilteredAmount)}
                </span>
              </div>
            </div>
          )}

          {/* DATA TABLE */}
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden mb-6">
            <div className="overflow-x-auto min-h-[300px]">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-[#f8fafc] border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-400 select-none">
                    <th className="py-4 px-6">Mã phiếu nhập</th>
                    <th className="py-4 px-6">Kho nhận</th>
                    <th className="py-4 px-6">Tình trạng</th>
                    <th className="py-4 px-6">Ngày nhập</th>
                    <th className="py-4 px-6">Người lập</th>
                    <th className="py-4 px-6 text-right">Tổng tiền</th>
                    <th className="py-4 px-6 text-right">Nợ</th>
                    <th className="py-4 px-6 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-semibold text-slate-600">
                  {loading ? (
                    <tr>
                      <td
                        colSpan="8"
                        className="py-20 text-center text-xs text-[#006c49] font-bold uppercase tracking-widest"
                      >
                        <div className="flex items-center justify-center gap-2 animate-pulse">
                          {/* Thay thế emoji vòng xoay thành icon SVG quay tròn mượt bằng class animate-spin */}
                          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                          </svg>
                          Đang kết nối phân hệ Kho (Inventory Service)...
                        </div>
                      </td>
                    </tr>
                  ) : filteredTickets.length === 0 ? (
                    <tr>
                      <td
                        colSpan="8"
                        className="py-20 text-center text-xs text-gray-400 font-bold uppercase"
                      >
                        Không tìm thấy chứng từ/phiếu nhập kho phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredTickets.map((row) => (
                      <tr
                        key={row.id}
                        className="hover:bg-slate-50/60 transition-colors"
                      >
                        <td
                          onClick={() =>
                            navigate(`/admin/inventory/import-detail/${row.id}`)
                          }
                          className="py-4 px-6 text-[#006c49] font-bold hover:underline cursor-pointer font-mono"
                        >
                          {row.id}
                        </td>
                        <td className="py-4 px-6 text-gray-500 font-normal">
                          {row.warehouse}
                        </td>
                        <td className="py-4 px-6">
                          {row.status === "completed" ? (
                            <span className="px-2.5 py-0.5 text-[10px] font-black rounded bg-emerald-50 text-emerald-600 uppercase">
                              Hoàn thành
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 text-[10px] font-black rounded bg-rose-50 text-rose-500 uppercase">
                              Còn nợ
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-gray-400 font-normal font-mono">
                          {row.date}
                        </td>
                        <td className="py-4 px-6 text-gray-500 font-medium">
                          {row.creator}
                        </td>
                        <td className="py-4 px-6 text-right text-gray-900 font-bold font-mono">
                          {row.total > 0 ? formatCurrency(row.total) : "---"}
                        </td>
                        <td
                          className={`py-4 px-6 text-right font-bold font-mono ${row.debt > 0 ? "text-rose-500" : "text-gray-300"}`}
                        >
                          {row.debt > 0 ? formatCurrency(row.debt) : "0 đ"}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() =>
                              navigate(
                                `/admin/inventory/import-detail/${row.id}`,
                              )
                            }
                            className="flex items-center gap-1 mx-auto text-gray-400 hover:text-[#006c49] font-bold text-xs bg-slate-50 hover:bg-emerald-50 px-2.5 py-1.5 rounded transition-all border border-gray-100 cursor-pointer"
                          >
                            Xem chi tiết
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 🌟 TEMPLATE BÁO CÁO PDF (SẼ CHỈ HIỂN THỊ KHI IN) */}
        {/* ========================================================================= */}
        <div id="pdf-report-template" className="hidden bg-white text-black">
          {/* Header Báo Cáo */}
          <div className="flex justify-between items-start mb-10 border-b-2 border-black pb-4">
            <div className="text-center">
              <h2 className="text-sm font-bold uppercase">
                CÔNG TY TNHH DEMI MART
              </h2>
              <p className="text-xs font-semibold underline decoration-solid underline-offset-4">
                HỆ THỐNG QUẢN LÝ TỒN KHO
              </p>
            </div>
            <div className="text-center">
              <h2 className="text-sm font-bold uppercase">
                CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
              </h2>
              <p className="text-xs font-bold underline decoration-solid underline-offset-4">
                Độc lập - Tự do - Hạnh phúc
              </p>
            </div>
          </div>

          {/* Tiêu đề & Thời gian */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-extrabold uppercase mb-2">
              BÁO CÁO DANH SÁCH PHIẾU NHẬP KHO
            </h1>
            <p className="text-sm italic">
              Thời điểm kết xuất: {currentTime.toLocaleTimeString("vi-VN")} -
              Ngày {currentTime.toLocaleDateDateString ? currentTime.toLocaleDateString("vi-VN") : currentTime.toLocaleDateString("vi-VN")}
            </p>
            {(search || filterWarehouse || filterPriceRange) && (
              <p className="text-xs italic mt-1 text-gray-600">
                (Dữ liệu đã được lọc theo tiêu chí tìm kiếm của người dùng)
              </p>
            )}
          </div>

          {/* Thông số tổng quan */}
          <div className="mb-6">
            <h3 className="font-bold text-lg mb-2 uppercase">
              I. Tổng hợp dữ liệu
            </h3>
            <ul className="list-disc list-inside text-sm space-y-1.5 ml-4">
              <li>
                Tổng số lượng Phiếu nhập:{" "}
                <span className="font-bold">
                  {filteredTickets.length} phiếu
                </span>
              </li>
              <li>
                Tổng giá trị chứng từ:{" "}
                <span className="font-bold">
                  {formatCurrency(totalFilteredAmount)}
                </span>
              </li>
            </ul>
          </div>

          {/* Bảng dữ liệu chi tiết */}
          <div>
            <h3 className="font-bold text-lg mb-2 uppercase">
              II. Bảng kê chi tiết chứng từ
            </h3>
            <table className="w-full border-collapse border border-black text-sm">
              <thead>
                <tr className="bg-gray-100 font-bold text-center">
                  <th className="border border-black px-2 py-2 w-10">STT</th>
                  <th className="border border-black px-2 py-2">Mã Chứng Từ</th>
                  <th className="border border-black px-2 py-2">Ngày Nhập</th>
                  <th className="border border-black px-2 py-2">Kho Nhận</th>
                  <th className="border border-black px-2 py-2">Người Lập</th>
                  <th className="border border-black px-2 py-2">
                    Tổng Tiền (VNĐ)
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-black px-2 py-2 text-center">
                      {index + 1}
                    </td>
                    <td className="border border-black px-2 py-2 font-semibold text-center">
                      {item.id}
                    </td>
                    <td className="border border-black px-2 py-2 text-center">
                      {item.date}
                    </td>
                    <td className="border border-black px-2 py-2 text-center">
                      {item.warehouse}
                    </td>
                    <td className="border border-black px-2 py-2 text-center">
                      {item.creator}
                    </td>
                    <td className="border border-black px-2 py-2 text-right font-semibold">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
                {/* Dòng Tổng cộng cuối bảng */}
                <tr className="bg-gray-50 font-bold">
                  <td
                    colSpan="5"
                    className="border border-black px-2 py-2 text-center uppercase"
                  >
                    Tổng Cộng
                  </td>
                  <td className="border border-black px-2 py-2 text-right text-red-600">
                    {formatCurrency(totalFilteredAmount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Chữ ký */}
          <div className="flex justify-between mt-12 pt-8 px-12">
            <div className="text-center">
              <p className="text-base font-bold">Thủ Kho</p>
              <p className="text-xs italic mt-1">(Ký và ghi rõ họ tên)</p>
              <div className="h-24"></div>
            </div>
            <div className="text-center">
              <p className="text-sm italic mb-1">
                TP. Hồ Chí Minh, ngày ... tháng ... năm 202...
              </p>
              <p className="text-base font-bold">Người lập báo cáo</p>
              <p className="text-xs italic mt-1">(Ký và ghi rõ họ tên)</p>
              <div className="h-24"></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}