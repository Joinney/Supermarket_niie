import React, { useState, useEffect } from "react";

import { useNavigate } from "react-router-dom";

import { warehouseApi } from "../../../api/axios";

const Danhsachnhapkho = () => {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  // State bộ lọc

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("");

  // 🎯 GỌI API LẤY DANH SÁCH PHIẾU NHẬP

  const fetchTickets = async () => {
    setLoading(true);

    setError(null);

    try {
      // Gọi API GET /api/v1/inventory-tickets (Cổng 5006)

      const response = await warehouseApi.get("/inventory-tickets");

      if (response.data) {
        setTickets(response.data);
      }
    } catch (err) {
      console.error("Lỗi tải danh sách phiếu kho:", err);

      setError(
        "Không thể kết nối đến máy chủ quản lý Kho (Inventory Service).",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // 🎯 HÀM TIỆN ÍCH

  const formatCurrency = (num) => {
    return new Intl.NumberFormat("vi-VN").format(Number(num) || 0) + " đ";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    const d = new Date(dateString);

    return d.toLocaleString("vi-VN", {
      day: "2-digit",

      month: "2-digit",

      year: "numeric",

      hour: "2-digit",

      minute: "2-digit",
    });
  };

  // Bóc tách tên người lập từ Ghi chú (Backend Go đang lưu dạng: "Người lập: ABC | Ghi chú: XYZ")

  const getCreatorFromName = (ghiChu) => {
    if (!ghiChu) return "Hệ thống";

    if (ghiChu.includes("Người lập:")) {
      return ghiChu.split("|")[0].replace("Người lập:", "").trim();
    }

    return "Hệ thống";
  };

  // Lọc dữ liệu trên Frontend

  const filteredTickets = tickets.filter((ticket) => {
    const matchSearch =
      (ticket.ma_phieu || "").toLowerCase().includes(search.toLowerCase()) ||
      (ticket.ma_kho || "").toLowerCase().includes(search.toLowerCase());

    // Giả lập lọc trạng thái (Nếu backend có trường trạng_thái thì thay vào đây)

    const matchStatus = status === "" || true; // Hiện tại backend Go chưa trả về status nợ/hoàn thành rõ ràng

    return matchSearch && matchStatus;
  });

  // Tính toán số liệu thống kê Footer

  const totalAmount = filteredTickets.reduce(
    (sum, item) => sum + (Number(item.tong_tien) || 0),

    0,
  );

  const totalDebt = filteredTickets.reduce(
    (sum, item) => sum + (Number(item.tien_no) || 0),

    0,
  );

  return (
    <div className="w-full min-h-screen bg-[#fafafa] font-sans text-gray-800 antialiased p-1">
      {/* ---------------- TIÊU ĐỀ HOẠT ĐỘNG ---------------- */}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
            Danh sách nhập kho
          </h1>

          <nav className="text-sm text-gray-400 mt-1">
            Dashboard &gt;{" "}
            <span className="text-emerald-600 font-medium">
              Danh sách nhập kho
            </span>
          </nav>
        </div>

        <button
          onClick={() => navigate("/admin/inventory/create-import")} // Điều hướng sang trang tạo phiếu
          className="bg-[#22c55e] hover:bg-[#16a34a] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm flex items-center gap-1.5"
        >
          <span className="text-base">+</span> Tạo Phiếu nhập
        </button>
      </div>

      {/* ---------------- BLOCK TÌM KIẾM & BỘ LỌC ---------------- */}

      <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Input Search */}

          <div className="relative min-w-[260px] flex-1 max-w-xs">
            <input
              type="text"
              placeholder="Tìm theo mã phiếu, mã kho..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-3 pr-9 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 transition-all placeholder-gray-400"
            />

            <span className="absolute inset-y-0 right-3 flex items-center text-gray-400">
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
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.603 10.601Z"
                />
              </svg>
            </span>
          </div>

          {/* Trạng thái Dropdown */}

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-600 outline-none min-w-[150px] font-medium"
          >
            <option value="">Tất cả trạng thái</option>

            <option value="completed">Hoàn thành</option>

            <option value="debt">Còn nợ</option>
          </select>

          {/* Nút Reset */}

          <button
            onClick={() => {
              setSearch("");

              setStatus("");

              fetchTickets();
            }}
            className="p-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-gray-500 transition-colors"
            title="Làm mới dữ liệu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className={`w-4 h-4 ${loading ? "animate-spin text-emerald-500" : ""}`}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
          </button>
        </div>

        {/* Nút Lọc & Xuất */}

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3.5 py-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-sm text-gray-600 font-medium transition-colors">
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
                d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
              />
            </svg>
            Lọc
          </button>

          <button className="flex items-center gap-1.5 px-3.5 py-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-sm text-gray-600 font-medium transition-colors">
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
                d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
              />
            </svg>
            Xuất
          </button>
        </div>
      </div>

      {/* ---------------- BẢNG HIỂN THỊ DỮ LIỆU NHẬP KHO ---------------- */}

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                <th className="py-4 px-6">Mã phiếu nhập</th>

                <th className="py-4 px-6">Kho nhận</th>

                <th className="py-4 px-6">Loại phiếu</th>

                <th className="py-4 px-6">Ngày lập</th>

                <th className="py-4 px-6">Người lập</th>

                <th className="py-4 px-6 text-right">Tổng tiền</th>

                <th className="py-4 px-6 text-right flex items-center justify-end gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-3.5 h-3.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.854-1.106-2.24 0-3.093 1.147-.881 2.91-.881 4.058 0L15 8.5m-5-3h4.5m-4.5 13H14"
                    />
                  </svg>
                  Nợ
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
              {loading && (
                <tr>
                  <td
                    colSpan="7"
                    className="py-12 text-center text-emerald-600 font-medium animate-pulse"
                  >
                    Đang tải dữ liệu phiếu nhập...
                  </td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td
                    colSpan="7"
                    className="py-12 text-center text-rose-500 font-medium"
                  >
                    ⚠️ {error}
                  </td>
                </tr>
              )}

              {!loading && !error && filteredTickets.length === 0 && (
                <tr>
                  <td
                    colSpan="7"
                    className="py-12 text-center text-gray-400 font-medium italic"
                  >
                    Không tìm thấy chứng từ/phiếu nhập kho nào.
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                filteredTickets.map((row) => (
                  <tr
                    key={row.ma_phieu}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="py-4 px-6 text-blue-500 font-semibold cursor-pointer hover:underline">
                      {row.ma_phieu}
                    </td>

                    <td className="py-4 px-6 text-gray-600 font-normal">
                      {row.ma_kho || "Không xác định"}
                    </td>

                    <td className="py-4 px-6">
                      <span className="px-2.5 py-0.5 text-[11px] font-bold tracking-wide uppercase rounded bg-gray-100 text-gray-600">
                        {row.loai_phieu || "NHAP"}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-gray-500 font-normal">
                      {formatDate(row.ngay_tao)}
                    </td>

                    <td className="py-4 px-6 text-gray-600 font-medium">
                      {getCreatorFromName(row.ghi_chu)}
                    </td>

                    {/* Tạm thời mặc định hiển thị 0đ do API danh sách GetInventoryTickets Backend chưa Join bảng chi tiết để tính tổng */}

                    <td className="py-4 px-6 text-right text-gray-900 font-bold">
                      {formatCurrency(row.tong_tien || 0)}
                    </td>

                    <td
                      className={`py-4 px-6 text-right font-bold ${(row.tien_no || 0) > 0 ? "text-rose-500" : "text-gray-300"}`}
                    >
                      {formatCurrency(row.tien_no || 0)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* FOOTER ĐIỀU HƯỚNG & SỐ LIỆU TỔNG KPI */}

        <div className="p-5 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4 bg-white">
          <div className="flex items-center gap-8">
            <div className="text-center">
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                Tổng số phiếu
              </p>

              <p className="text-xl font-bold text-gray-900 mt-0.5 text-left">
                {filteredTickets.length}
              </p>
            </div>

            <div className="border-l border-gray-200 pl-8 text-center">
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                Tổng tiền nhập
              </p>

              <p className="text-xl font-bold text-emerald-600 mt-0.5">
                {formatCurrency(totalAmount)}
              </p>
            </div>

            <div className="border-l border-gray-200 pl-8 text-center">
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                Tổng nợ
              </p>

              <p className="text-xl font-bold text-rose-500 mt-0.5">
                {formatCurrency(totalDebt)}
              </p>
            </div>
          </div>

          {/* Cụm Phân Trang */}

          <div className="flex items-center gap-4 text-xs font-medium text-gray-400">
            <div className="flex items-center gap-2">
              <span>Trang hiển thị</span>

              <select className="border border-gray-200 rounded px-2 py-1 bg-white text-gray-700 outline-none font-bold cursor-pointer">
                <option>1</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                className="p-1.5 border border-gray-200 rounded text-gray-300 bg-white cursor-not-allowed"
                disabled
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-3.5 h-3.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 19.5 8.25 12l7.5-7.5"
                  />
                </svg>
              </button>

              <button className="p-1.5 border border-gray-200 rounded text-gray-600 bg-white hover:bg-gray-50 transition-colors cursor-pointer">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-3.5 h-3.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m8.25 4.5 7.5 7.5-7.5 7.5"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Danhsachnhapkho;
