import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// 🌟 Sử dụng warehouseApi để auto-detect môi trường & gắn Token
import { warehouseApi } from "../../../../api/axios";

export default function DanhSachPhieuNhap() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const [importTickets, setImportTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🌟 Fetch danh sách từ backend bằng instance an toàn
    warehouseApi
      .get("/inventory-tickets")
      .then((res) => {
        const rawData = Array.isArray(res.data)
          ? res.data
          : res.data.data || [];

        const mappedData = rawData.map((item) => {
          let creatorName = "Hệ thống";

          // 🛡️ FIX LỖI CRASH: Đảm bảo item.ghi_chu phải là chuỗi (string) thì mới dùng hàm includes và split
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
            total: Number(item.tong_tien) || 0, // Đảm bảo total luôn là số
            debt: 0,
          };
        });

        setImportTickets(mappedData);
      })
      .catch((err) => {
        console.error("Lỗi kết nối API danh sách phiếu nhập:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const formatCurrency = (num) => {
    return new Intl.NumberFormat("vi-VN").format(num) + " đ";
  };

  // 📊 TÍNH TOÁN DỮ LIỆU ĐÃ LỌC CHO GIAO DIỆN
  const filteredTickets = importTickets.filter((row) => {
    const matchId = row.id
      ? row.id.toLowerCase().includes(search.toLowerCase())
      : false;
    const matchStatus = status === "" || row.status === status;
    return matchId && matchStatus;
  });

  const totalFilteredAmount = filteredTickets.reduce(
    (sum, ticket) => sum + ticket.total,
    0,
  );

  return (
    <div className="w-full min-h-screen bg-[#fafafa] font-sans text-gray-800 antialiased p-1 text-left">
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
          className="flex items-center justify-center gap-1.5 bg-[#006c49] hover:bg-[#005237] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:shadow transition transform active:scale-98 shrink-0 cursor-pointer whitespace-nowrap"
        >
          <span className="text-sm font-bold">+</span> Tạo Phiếu nhập
        </button>
      </div>

      {/* FILTER CONTROLS */}
      <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[260px] flex-1 max-w-xs">
            <input
              type="text"
              placeholder="Tìm kiếm theo mã phiếu nhập..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-3 pr-9 py-2 text-xs border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-[#006c49] focus:ring-2 focus:ring-emerald-50 transition-all placeholder-gray-400 font-medium text-slate-800"
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
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 border border-gray-200 bg-white rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition cursor-pointer">
            Lọc
          </button>
          <button className="px-4 py-2 border border-gray-200 bg-white rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition cursor-pointer">
            Xuất
          </button>
        </div>
      </div>

      {/* THÔNG KÊ NHANH (FOOTER MINI LÊN ĐẦU) */}
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
                    className="py-20 text-center text-xs text-[#006c49] font-bold uppercase tracking-widest animate-pulse"
                  >
                    🔄 Đang kết nối phân hệ Kho (Inventory Service)...
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
                        <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-50 text-emerald-600">
                          Hoàn thành
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-rose-50 text-rose-500">
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
                        type="button"
                        onClick={() =>
                          navigate(`/admin/inventory/import-detail/${row.id}`)
                        }
                        className="flex items-center gap-1 mx-auto text-gray-400 hover:text-[#006c49] font-bold text-xs bg-slate-50 hover:bg-emerald-50 px-2.5 py-1 rounded transition-all border border-gray-100 cursor-pointer"
                      >
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
                            d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                          />
                        </svg>
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
  );
}
