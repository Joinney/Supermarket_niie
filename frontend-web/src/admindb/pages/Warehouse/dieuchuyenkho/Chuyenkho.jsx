import React, { useState, useEffect, useMemo } from "react";
import TaoPhieuDieuChuyenForm from "./TaoPhieuDieuChuyenForm";
import { warehouseApi } from "../../../../api/axios"; // 🌟 Đảm bảo đường dẫn import API đúng

const Dieuchuyenkho = () => {
  const [transferList, setTransferList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // States bộ lọc
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // States phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Trạng thái điều phối hiển thị màn hình
  const [isCreating, setIsCreating] = useState(false);

  // 🌟 FIX LỖI: Khai báo biến currentDate để dùng cho Template in ấn PDF
  const currentDate = new Date().toLocaleDateString("vi-VN");

  // FETCH DỮ LIỆU TỪ BACKEND
  const fetchTransfers = async () => {
    setIsLoading(true);
    try {
      const res = await warehouseApi.get("/transfers");
      setTransferList(res.data || []);
    } catch (error) {
      console.error("Lỗi khi tải danh sách phiếu chuyển:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  // XỬ LÝ LỌC DỮ LIỆU
  const filteredTransfers = useMemo(() => {
    return transferList.filter((item) => {
      const matchSearch = (item.ma_phieu || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchStatus =
        statusFilter === "" || item.trang_thai === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [transferList, searchTerm, statusFilter]);

  // THỐNG KÊ NHANH CHO BÁO CÁO IN
  const reportStats = useMemo(() => {
    let pending = 0;
    let completed = 0;
    filteredTransfers.forEach((item) => {
      if (item.trang_thai === "Chờ xét duyệt") pending++;
      else completed++;
    });
    return { total: filteredTransfers.length, pending, completed };
  }, [filteredTransfers]);

  // XỬ LÝ PHÂN TRANG
  const totalPages = Math.ceil(filteredTransfers.length / itemsPerPage) || 1;
  const currentTableData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTransfers.slice(start, start + itemsPerPage);
  }, [filteredTransfers, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // HÀM DUYỆT PHIẾU
  const handleApprove = async (maPhieu) => {
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn DUYỆT phiếu ${maPhieu}?\nHành động này sẽ trừ tồn ở kho nguồn và cộng vào kho đích ngay lập tức.`,
      )
    ) {
      return;
    }
    try {
      await warehouseApi.patch(`/transfers/${maPhieu}/approve`);
      alert("🎉 Đã duyệt phiếu điều chuyển thành công!");
      fetchTransfers();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || "Đã xảy ra lỗi khi duyệt phiếu!");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return d.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // INTERCEPT: Nếu trạng thái tạo mới được bật, gọi Form ra thay thế
  if (isCreating) {
    return (
      <TaoPhieuDieuChuyenForm
        onCancel={() => {
          setIsCreating(false);
          fetchTransfers();
        }}
      />
    );
  }

  return (
    <>
      {/* 🌟 CSS CẤP CỨU LỆNH IN PDF */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #pdf-report-template, #pdf-report-template * { visibility: visible; font-family: 'Times New Roman', Times, serif !important; }
          #pdf-report-template { position: absolute; left: 0; top: 0; width: 100%; display: block !important; }
          @page { size: A4 landscape; margin: 15mm; }
        }
      `}</style>

      <div className="w-full min-h-screen bg-[#fafafa] font-sans text-gray-800 antialiased p-1 print:bg-white">
        <div className="w-full print:hidden">
          {/* ---------------- TIÊU ĐỀ & NÚT TẠO PHIẾU + IN PDF ---------------- */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
                Danh sách điều chuyển kho
              </h1>
              <nav className="text-sm text-gray-400 mt-1">
                Dashboard &gt;{" "}
                <span className="text-[#006c49] font-medium">
                  Danh sách điều chuyển kho
                </span>
              </nav>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => window.print()}
                className="flex items-center justify-center gap-2 border border-emerald-200 rounded-xl bg-emerald-50 shadow-sm hover:bg-emerald-100 text-xs text-[#006c49] font-bold transition-all px-4 py-2 cursor-pointer"
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
                    d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.617 0-1.11-.51-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-14.326 0C3.768 7.441 3 8.376 3 9.456v6.294a2.25 2.25 0 0 0 2.25 2.25h1.091M5.25 9.75h13.5M9 21h6"
                  />
                </svg>
                Xuất PDF
              </button>

              <button
                onClick={() => setIsCreating(true)}
                className="flex items-center justify-center gap-1.5 bg-[#006c49] hover:bg-[#005237] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:shadow transition transform active:scale-98 shrink-0 cursor-pointer whitespace-nowrap"
              >
                <span className="text-sm font-bold">+</span> Tạo Phiếu Điều
                Chuyển
              </button>
            </div>
          </div>

          {/* ---------------- THANH BỘ LỌC TÌM KIẾM ---------------- */}
          <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative min-w-[280px] flex-1 max-w-xs">
                <input
                  type="text"
                  placeholder="Tìm mã phiếu điều chuyển..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-[#006c49] placeholder-gray-400 transition-all font-medium text-slate-800"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 font-bold outline-none min-w-[160px] cursor-pointer focus:border-[#006c49]"
              >
                <option value="">📁 Tất cả trạng thái</option>
                <option value="PENDING">Chờ xét duyệt</option>
                <option value="COMPLETED">Đã hoàn thành</option>
              </select>

              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("");
                  setCurrentPage(1);
                }}
                title="Làm mới bộ lọc"
                className="p-2 border border-gray-200 bg-slate-50 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
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
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                  />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                className="flex items-center gap-1.5 px-3.5 py-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-sm text-gray-600 font-medium transition-colors cursor-pointer"
                onClick={fetchTransfers}
              >
                Làm mới dữ liệu
              </button>
            </div>
          </div>

          {/* ---------------- BẢNG HIỂN THỊ PHIẾU CHUYỂN KHO ---------------- */}
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden mb-6">
            <div className="overflow-x-auto min-h-[300px]">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-[#f8fafc] border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-400 select-none">
                    <th className="py-4 px-6 text-center">Mã phiếu</th>
                    <th className="py-4 px-6">Kho nguồn (Xuất)</th>
                    <th className="py-4 px-6">Kho đích (Nhập)</th>
                    <th className="py-4 px-6 text-center">Trạng thái</th>
                    <th className="py-4 px-6">Ngày tạo</th>
                    <th className="py-4 px-6">Người tạo</th>
                    <th className="py-4 px-6 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan="7"
                        className="py-20 text-center text-xs text-[#006c49] font-bold uppercase tracking-widest animate-pulse"
                      >
                        🔄 Đang tải danh sách phiếu chuyển...
                      </td>
                    </tr>
                  ) : currentTableData.length === 0 ? (
                    <tr>
                      <td
                        colSpan="7"
                        className="py-20 text-center text-xs text-gray-400 font-bold uppercase tracking-wider"
                      >
                        Không tìm thấy dữ liệu phiếu chuyển.
                      </td>
                    </tr>
                  ) : (
                    currentTableData.map((row) => (
                      <tr
                        key={row.ma_phieu}
                        className="hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="py-4 px-6 text-center text-[#006c49] font-bold font-mono text-xs">
                          {row.ma_phieu}
                        </td>
                        <td className="py-4 px-6 text-gray-700">
                          <div className="flex items-center gap-2">
                            <span className="text-rose-400">
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
                                  d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941"
                                />
                              </svg>
                            </span>
                            {row.ten_kho_nguon || row.kho_nguon}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-gray-700">
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-400">
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
                                  d="M2.25 6 9 12.75l4.286-4.286a11.948 11.948 0 0 1 4.306 6.43l.797 3.398m0 0-5.94-2.28m5.94 2.28-2.28 5.941"
                                />
                              </svg>
                            </span>
                            {row.ten_kho_dich || row.kho_dich}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          {row.trang_thai === "PENDING" ? (
                            <span className="inline-block px-2.5 py-1 text-[11px] font-bold rounded bg-amber-50 text-amber-600 border border-amber-100 whitespace-nowrap">
                              Chờ xét duyệt
                            </span>
                          ) : (
                            <span className="inline-block px-2.5 py-1 text-[11px] font-bold rounded bg-emerald-50 text-[#006c49] border border-emerald-100 whitespace-nowrap">
                              Đã hoàn thành
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-gray-400 font-normal font-mono text-xs">
                          {formatDate(row.ngay_tao)}
                        </td>
                        <td className="py-4 px-6 text-gray-900 font-bold whitespace-pre-line text-xs">
                          {typeof row.nguoi_tao === "string"
                            ? row.nguoi_tao.split(" ")[0]
                            : "Admin"}
                          {"\n"}
                          <span className="text-gray-400 font-normal text-[10px]">
                            {typeof row.nguoi_tao === "string"
                              ? row.nguoi_tao.split(" ").slice(1).join(" ")
                              : "Kho"}
                          </span>
                        </td>

                        {/* CỘT HÀNH ĐỘNG DUYỆT PHIẾU */}
                        <td className="py-4 px-6 text-center">
                          {row.trang_thai === "PENDING" ? (
                            <button
                              onClick={() => handleApprove(row.ma_phieu)}
                              className="bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-sm"
                            >
                              Duyệt Xuất
                            </button>
                          ) : (
                            <span className="text-gray-300 text-xs italic flex items-center justify-center select-none">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="w-4 h-4 mr-1"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Đã chốt
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* PHÂN TRANG */}
            {!isLoading && filteredTransfers.length > 0 && (
              <div className="p-4 bg-white border-t border-gray-50 flex items-center justify-between text-xs text-gray-400 font-medium select-none">
                <div>
                  Đang xem {(currentPage - 1) * itemsPerPage + 1} -{" "}
                  {Math.min(
                    currentPage * itemsPerPage,
                    filteredTransfers.length,
                  )}{" "}
                  trong tổng số{" "}
                  <span className="font-bold text-gray-600">
                    {filteredTransfers.length}
                  </span>{" "}
                  phiếu
                </div>
                <div className="flex items-center gap-4 text-gray-500">
                  <span>Trang số</span>
                  <select
                    value={currentPage}
                    onChange={(e) => setCurrentPage(Number(e.target.value))}
                    className="border border-gray-200 rounded px-2 py-1 bg-white text-gray-700 outline-none font-bold cursor-pointer"
                  >
                    {Array.from({ length: totalPages }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className={`p-1 border border-gray-200 rounded ${currentPage === 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-gray-50 cursor-pointer"}`}
                    >
                      &lt;
                    </button>
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className={`p-1 border border-gray-200 rounded ${currentPage === totalPages ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-gray-50 cursor-pointer"}`}
                    >
                      &gt;
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 🌟 TEMPLATE IN BÁO CÁO PDF ĐIỀU CHUYỂN (ẨN TRÊN WEB, CHỈ HIỂN THỊ KHI IN) */}
        {/* ========================================================================= */}
        <div
          id="pdf-report-template"
          className="hidden bg-white text-black p-8"
        >
          <div className="flex justify-between items-start mb-10 border-b-2 border-black pb-4">
            <div className="text-center">
              <h2 className="text-sm font-bold uppercase">
                CÔNG TY TNHH DEMI MART
              </h2>
              <p className="text-xs font-semibold underline decoration-solid underline-offset-4">
                HỆ THỐNG QUẢN LÝ KHO VẬN
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

          <div className="text-center mb-8">
            <h1 className="text-2xl font-extrabold uppercase mb-2">
              BÁO CÁO TỔNG HỢP ĐIỀU CHUYỂN HÀNG HÓA NỘI BỘ
            </h1>
            <p className="text-sm italic">
              Thời điểm kết xuất báo cáo:{" "}
              {new Date().toLocaleTimeString("vi-VN")} - Ngày {currentDate}
            </p>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-bold text-base mb-2 uppercase">
                I. Tổng quan chứng từ
              </h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>
                  Tổng số lệnh vận hành điều phối:{" "}
                  <span className="font-bold">{reportStats.total} Lệnh</span>
                </li>
                <li>
                  Lệnh đã hoàn thành chốt sổ:{" "}
                  <span className="font-bold">
                    {reportStats.completed} Phiếu
                  </span>
                </li>
                <li>
                  Lệnh đang chờ duyệt trung chuyển:{" "}
                  <span className="font-bold text-amber-600">
                    {reportStats.pending} Phiếu
                  </span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-base mb-2 uppercase">
                II. Phạm vi kiểm kê
              </h3>
              <p className="italic ml-4 text-xs text-gray-600">
                (Dữ liệu được tổng hợp trực tiếp theo thời gian thực từ các phân
                vùng kho bãi đang hoạt động trên toàn hệ thống Demi Mart).
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-base mb-2 uppercase">
              III. Nhật ký kê chi tiết lộ trình điều phối
            </h3>
            <table className="w-full border-collapse border border-black text-xs">
              <thead>
                <tr className="bg-gray-100 font-bold text-center">
                  <th className="border border-black px-2 py-2.5 w-10">STT</th>
                  <th className="border border-black px-2 py-2.5 w-24">
                    Mã Phiếu
                  </th>
                  <th className="border border-black px-2 py-2.5">
                    Kho Nguồn (Vùng Xuất)
                  </th>
                  <th className="border border-black px-2 py-2.5">
                    Kho Đích (Vùng Nhập)
                  </th>
                  <th className="border border-black px-2 py-2.5 w-28">
                    Trạng Thái
                  </th>
                  <th className="border border-black px-2 py-2.5 w-32">
                    Ngày Lập
                  </th>
                  <th className="border border-black px-2 py-2.5 w-24">
                    Người Lập
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTransfers.map((item, index) => (
                  <tr key={item.ma_phieu} className="text-center">
                    <td className="border border-black px-2 py-2">
                      {index + 1}
                    </td>
                    <td className="border border-black px-2 py-2 font-mono font-bold">
                      {item.ma_phieu}
                    </td>
                    <td className="border border-black px-2 py-2 text-left font-semibold">
                      {item.ten_kho_nguon || item.kho_nguon}
                    </td>
                    <td className="border border-black px-2 py-2 text-left font-semibold">
                      {item.ten_kho_dich || item.kho_dich}
                    </td>
                    <td className="border border-black px-2 py-2 font-bold">
                      {item.trang_thai}
                    </td>
                    <td className="border border-black px-2 py-2 font-mono">
                      {formatDate(item.ngay_tao)}
                    </td>
                    <td className="border border-black px-2 py-2">
                      {item.nguoi_tao || "Admin"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between mt-14 pt-8 px-12">
            <div className="text-center">
              <p className="text-base font-bold">Người Lập Bảng</p>
              <p className="text-xs italic mt-1">(Ký và ghi rõ họ tên)</p>
              <div className="h-20"></div>
            </div>
            <div className="text-center">
              <p className="text-sm italic mb-1">
                TP. Hồ Chí Minh, ngày ... tháng ... năm 202...
              </p>
              <p className="text-base font-bold">Trưởng Phòng Vận Hành Kho</p>
              <p className="text-xs italic mt-1">(Ký, đóng dấu phê duyệt)</p>
              <div className="h-20"></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dieuchuyenkho;
