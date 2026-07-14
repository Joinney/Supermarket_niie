import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { warehouseApi } from "../../../../api/axios";

export default function ChiTietPhieuNhap() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [showAllOrderHistory, setShowAllOrderHistory] = useState(false);
  const [showAllPaymentHistory, setShowAllPaymentHistory] = useState(false);

  // STATE DỮ LIỆU THỰC TẾ TỪ DATABASE
  const [ticketInfo, setTicketInfo] = useState(null);
  const [importItems, setImportItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // ĐỒNG BỘ REAL-TIME DATA TỪ BACKEND WAREHOUSE-SERVICE
  useEffect(() => {
    setLoading(true);

    warehouseApi
      .get(`/inventory-import/${id}`)
      .then((res) => {
        const data = res.data;

        // Tính toán số nợ còn lại
        const total = data.tong_tien || 0;
        const paid = data.da_thanh_toan || 0;
        const currentDebt = total - paid > 0 ? total - paid : 0;

        // 1. Gán thông tin chung của phiếu kho (Đọc live các cột tài chính mới)
        setTicketInfo({
          id: data.ma_phieu,
          warehouse:
            data.ma_kho === "KHO-001" || data.ma_kho === "1"
              ? "Kho Tổng (Quận 1)"
              : data.ma_kho,
          supplier: data.nha_cung_cap || "Chưa xác định nhà cung cấp", // 🌟 LẤY NHÀ CUNG CẤP THẬT
          status: data.trang_thai_thanh_toan || "UNPAID", // 🌟 LẤY TRẠNG THÁI CÔNG NỢ THẬT
          date: data.ngay_tao,
          creator:
            data.nguoi_thuc_hien_id === 1
              ? "Admin"
              : `Nhân viên kho #${data.nguoi_thuc_hien_id}`,
          note:
            data.loai_phieu === "NHAP"
              ? "Mua Hàng Từ Nhà Cung Cấp"
              : data.loai_phieu,
          ghiChuText: data.ghi_chu || "Nhập kho định kỳ hệ thống",
          total: total,
          paid: paid, // 🌟 SỐ TIỀN ĐÃ TRẢ THẬT
          debt: currentDebt, // 🌟 SỐ TIỀN CÒN NỢ THẬT
        });

        // 2. Gán thông tin chi tiết sản phẩm
        if (data.products && Array.isArray(data.products)) {
          const mappedItems = data.products.map((item) => ({
            name: item.name || "Sản phẩm Demi Mart",
            sku: item.sku,
            lot: item.ma_lo_hang,
            qty: `${item.so_luong} Cái`,
            price: item.gia_nhap,
            total: item.total,
            img: "📦",
          }));
          setImportItems(mappedItems);
        }
      })
      .catch((err) => {
        console.error("❌ Lỗi truy xuất dữ liệu thật từ Database kho:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  // Nhật ký xử lý chứng từ vận hành kho
  const mockOrderHistory = [
    {
      date: ticketInfo?.date || "Vừa xong",
      action: "Đã xác nhận lưu kho & đồng bộ số lượng thành công",
      actor: ticketInfo?.creator || "Hệ thống",
    },
    {
      date: "Hệ thống tự động",
      action: "Khởi tạo chứng từ phiếu nhập thành công",
      actor: "Thủ kho",
    },
  ];

  // 🌟 ĐỒNG BỘ LỊCH SỬ DÒNG TIỀN THEO DỮ LIỆU ĐÃ THANH TOÁN
  const mockPaymentHistory = [
    {
      date: ticketInfo?.date || "Vừa xong",
      amount: ticketInfo?.paid || 0,
      method: "Thanh toán tạm ứng lúc lập chứng từ",
      status:
        ticketInfo?.status === "PAID"
          ? "Đã trả đủ"
          : ticketInfo?.status === "PARTIAL"
            ? "Trả một phần"
            : "Chưa thanh toán",
    },
  ];

  const visibleOrderHistory = showAllOrderHistory
    ? mockOrderHistory
    : mockOrderHistory.slice(0, 3);
  const visiblePaymentHistory = showAllPaymentHistory
    ? mockPaymentHistory
    : mockPaymentHistory.slice(0, 3);

  const formatCurrency = (num) => {
    return new Intl.NumberFormat("vi-VN").format(num) + " đ";
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#f4f6f8] flex items-center justify-center">
        <p className="text-xs font-black uppercase text-gray-400 tracking-widest animate-pulse">
          🔄 Đang kết xuất dữ liệu thực tế cho phiếu {id} từ Database...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#f4f6f8] font-sans text-slate-700 antialiased p-4 text-left">
      {/* HEADER BAR */}
      <div className="flex justify-between items-start mb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Chi tiết phiếu nhập
          </h1>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1 font-medium">
            <span>Dashboard</span> <span>❯</span>{" "}
            <span>Danh sách nhập kho</span> <span>❯</span>{" "}
            <span className="text-emerald-600 font-semibold">
              Chi tiết nhập kho
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/admin/inventory/import-list")}
            className="flex items-center gap-1 bg-white border border-gray-200 text-gray-600 px-3 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-gray-50 transition active:scale-95 cursor-pointer"
          >
            ↩ Quay về danh sách
          </button>
        </div>
      </div>

      {/* WHITE CARD CONTAINER */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
        {/* TOP SECTION: TICKET ID & BANNER TOTAL */}
        <div className="flex flex-wrap justify-between items-center gap-4 border-b border-gray-50 pb-5">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {ticketInfo?.id}
              </h2>
              <p className="text-xs text-gray-400 mt-1 font-medium">
                Ngày lập chứng từ: {ticketInfo?.date}
              </p>
            </div>

            {/* 🌟 THÊM BADGE TRẠNG THÁI CÔNG NỢ CHI TIẾT */}
            {ticketInfo?.status === "PAID" ? (
              <span className="px-2.5 py-1 text-[10px] font-black rounded bg-emerald-50 border border-emerald-200 text-emerald-700 uppercase tracking-wider">
                Đã trả đủ
              </span>
            ) : ticketInfo?.status === "PARTIAL" ? (
              <span className="px-2.5 py-1 text-[10px] font-black rounded bg-amber-50 border border-amber-200 text-amber-700 uppercase tracking-wider">
                Nợ một phần
              </span>
            ) : (
              <span className="px-2.5 py-1 text-[10px] font-black rounded bg-rose-50 border border-rose-200 text-rose-700 uppercase tracking-wider">
                Chưa trả tiền
              </span>
            )}
          </div>

          {/* BANNER TÀI CHÍNH BÓC TÁCH BAO GỒM TỔNG - ĐÃ TRẢ - NỢ */}
          <div className="flex items-center gap-3 select-none flex-wrap">
            <div className="bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-right min-w-[150px]">
              <span className="text-[9px] uppercase tracking-wider font-bold text-gray-400 block">
                Đã thanh toán:
              </span>
              <span className="text-sm font-black font-mono text-emerald-700">
                {formatCurrency(ticketInfo?.paid)}
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-right min-w-[150px]">
              <span className="text-[9px] uppercase tracking-wider font-bold text-gray-400 block">
                Còn dư nợ lại:
              </span>
              <span
                className={`text-sm font-black font-mono ${ticketInfo?.debt > 0 ? "text-rose-600" : "text-gray-500"}`}
              >
                {formatCurrency(ticketInfo?.debt)}
              </span>
            </div>
            <div className="bg-[#006c49] text-white px-5 py-3 rounded-xl shadow-sm min-w-[220px] flex justify-between items-center">
              <span className="text-[9px] uppercase tracking-wider font-bold text-emerald-200">
                TỔNG CHỨNG TỪ:
              </span>
              <span className="text-xl font-black font-mono">
                {formatCurrency(ticketInfo?.total)}
              </span>
            </div>
          </div>
        </div>

        {/* INFO BLOCKS: TWO COLUMNS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* THÔNG TIN NHÀ CUNG CẤP (KHÔNG CÒN GÁN CỨNG) */}
          <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/20 space-y-3">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block select-none">
              Thông tin đối tác cung cấp
            </span>
            <h4 className="text-lg font-black text-slate-800">
              {ticketInfo?.supplier}
            </h4>
            <div className="text-xs text-gray-400 space-y-1.5 font-medium italic">
              <p>
                Hệ thống tự động đồng bộ công nợ cho nhà cung cấp dựa trên mã
                phiếu nhập kho.
              </p>
            </div>
          </div>

          {/* THÔNG TIN NHẬP KHO */}
          <div className="border border-emerald-100/50 rounded-2xl p-5 bg-emerald-50/5 space-y-3">
            <span className="text-[10px] font-black text-emerald-700/60 uppercase tracking-wider block select-none">
              Thông tin nhận hàng lưu kho
            </span>
            <h4 className="text-lg font-bold text-emerald-900">
              {ticketInfo?.warehouse}
            </h4>
            <div className="text-xs text-slate-600 space-y-2.5 font-semibold">
              <p className="flex items-center gap-2">
                📊{" "}
                <span className="text-gray-400 font-normal">
                  Hình thức kiểm duyệt:
                </span>{" "}
                {ticketInfo?.note}
              </p>
              <p className="flex items-center gap-2">
                👤{" "}
                <span className="text-gray-400 font-normal">
                  Người thực hiện lập:
                </span>{" "}
                {ticketInfo?.creator}
              </p>
              <p className="flex items-center gap-2">
                📝{" "}
                <span className="text-gray-400 font-normal">
                  Ghi chú vận hành:
                </span>{" "}
                <span className="text-slate-500 font-medium">
                  {ticketInfo?.ghiChuText}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* PROGRESS FLOWBAR (TIMELINE) */}
        <div className="py-4 border-t border-b border-gray-50 select-none">
          <div className="flex items-center justify-between max-w-3xl mx-auto relative">
            <div className="absolute left-0 right-0 top-3.5 h-0.5 bg-emerald-600 -z-10"></div>
            {[
              { label: "Tạo phiếu", done: true },
              { label: "Phê duyệt", done: true },
              { label: "Vận chuyển", done: true },
              { label: "Đã nhập kho", done: true },
            ].map((step, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center bg-white px-4"
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${step.done ? "bg-emerald-600" : "bg-gray-200"}`}
                >
                  ✓
                </div>
                <span
                  className={`text-[11px] font-bold mt-2 ${step.done ? "text-emerald-600" : "text-gray-400"}`}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* LIST ITEM TABLE */}
        <div className="w-full overflow-x-auto border border-gray-50 rounded-xl">
          <table className="w-full border-collapse text-left text-xs font-semibold">
            <thead>
              <tr className="bg-slate-50 text-[10px] text-gray-400 uppercase tracking-wider border-b border-gray-100 select-none">
                <th className="py-3 px-4">Sản Phẩm / SKU</th>
                <th className="py-3 px-4 text-center">Mã LOT hệ thống</th>
                <th className="py-3 px-4 text-center">Số lượng nhập</th>
                <th className="py-3 px-4 text-right">Đơn Giá Nhập</th>
                <th className="py-3 px-4 text-right">Thành Tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-slate-600">
              {importItems.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="py-6 text-center text-gray-400 font-bold uppercase"
                  >
                    Không tìm thấy chi tiết mặt hàng của chứng từ kho này.
                  </td>
                </tr>
              ) : (
                importItems.map((item, index) => (
                  <tr
                    key={index}
                    className="hover:bg-slate-50/30 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-lg shadow-inner select-none">
                          {item.img}
                        </div>
                        <div>
                          <p className="text-slate-800 font-bold">
                            {item.name}
                          </p>
                          <p className="text-[10px] text-gray-400 font-mono font-medium">
                            {item.sku}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-100/40 font-mono">
                        {item.lot}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center font-mono font-bold text-slate-700">
                      {item.qty}
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-gray-400">
                      {formatCurrency(item.price)}
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-black text-slate-800">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* LỊCH SỬ LOG CHỨNG TỪ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-gray-50">
          <div className="space-y-3">
            <div className="flex justify-between items-center select-none">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                Nhật ký xử lý chứng từ
              </span>
            </div>
            <div className="border border-gray-100 rounded-xl divide-y divide-gray-50 overflow-hidden text-xs">
              {visibleOrderHistory.map((log, index) => (
                <div
                  key={index}
                  className="p-3 bg-slate-50/30 flex justify-between items-center gap-2 hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <p className="font-bold text-slate-800">{log.action}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Bởi: {log.actor}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-gray-400 shrink-0">
                    {log.date}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center select-none">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                Lịch sử thanh toán công nợ
              </span>
            </div>
            <div className="border border-gray-100 rounded-xl divide-y divide-gray-50 overflow-hidden text-xs">
              {ticketInfo?.paid === 0 ? (
                <p className="p-4 text-center text-gray-400 font-bold italic">
                  Chưa phát sinh giao dịch thanh toán cho phiếu nhập này.
                </p>
              ) : (
                visiblePaymentHistory.map((pay, index) => (
                  <div
                    key={index}
                    className="p-3 bg-slate-50/30 flex justify-between items-center gap-2 hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <p className="font-black text-emerald-700 font-mono">
                        {formatCurrency(pay.amount)}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {pay.method}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="bg-emerald-50 text-emerald-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-emerald-100/30 block mb-1">
                        {pay.status}
                      </span>
                      <span className="text-[10px] font-mono text-gray-400 block">
                        {pay.date}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
