import React, { useState } from "react"; // 👈 Thêm useState để quản lý trạng thái ẩn/hiện
import { useParams, useNavigate } from "react-router-dom";

export default function ChiTietPhieuNhap() {
  const { id } = useParams();
  const navigate = useNavigate();

  // State quản lý việc xem toàn bộ lịch sử đơn hàng và thanh toán
  const [showAllOrderHistory, setShowAllOrderHistory] = useState(false);
  const [showAllPaymentHistory, setShowAllPaymentHistory] = useState(false);

  // Từ điển mock data
  const mockTicketsPool = {
    "PN2401-08": { id: "PN2401-08", warehouse: "Kho Tổng (Quận 1)", status: "completed", date: "28/01/2024 08:00", creator: "admin", total: 120000000 },
    "PN2401-07": { id: "PN2401-07", warehouse: "Kho Nông Sản Cầu Đất", status: "debt", date: "27/01/2024 15:30", creator: "nv_kho_01", total: 45500000 },
    "PN2401-06": { id: "PN2401-06", warehouse: "Kho Vật TW", status: "completed", date: "27/01/2024 10:15", creator: "admin", total: 89000000 },
    "PN2401-05": { id: "PN2401-05", warehouse: "Kho Tổng (Quận 1)", status: "debt", date: "26/01/2024 14:20", creator: "nv_kho_02", total: 210000000 }
  };

  const currentTicket = mockTicketsPool[id] || mockTicketsPool["PN2401-08"];

  const mockItems = [
    { name: "Táo Đỏ Loại A", sku: "SKU-APPLE-A", lot: "LOT-APL-2401", qty: "200 kg", price: 350000, total: 70000000, img: "🍎" },
    { name: "Hạt giống Dưa Lưới F1", sku: "SKU-SEED-MELON", lot: "LOT-NEW-999", qty: "500 Gói", price: 100000, total: 50000000, img: "🌱" }
  ];

  // 1. Giả lập dữ liệu Lịch sử Đơn hàng (Nhiều hơn 3 dòng để test)
  const mockOrderHistory = [
    { date: "28/01/2024 08:00", action: "Nhập kho thành công", actor: "admin" },
    { date: "27/01/2024 14:00", action: "Hàng đến kho - Kiểm đếm", actor: "nv_kho_01" },
    { date: "27/01/2024 09:30", action: "Đang vận chuyển", actor: "Đơn vị vận chuyển" },
    { date: "26/01/2024 16:00", action: "Đã phê duyệt phiếu", actor: "manager_01" },
    { date: "26/01/2024 10:00", action: "Tạo mới phiếu nhập", actor: "admin" }
  ];

  // 2. Giả lập dữ liệu Lịch sử Thanh toán (Nhiều hơn 3 dòng để test)
  const mockPaymentHistory = [
    { date: "28/01/2024 08:30", amount: 50000000, method: "Chuyển khoản (Đợt 2)", status: "Thành công" },
    { date: "26/01/2024 11:00", amount: 40000000, method: "Chuyển khoản (Tạm ứng đợt 1)", status: "Thành công" },
    { date: "25/01/2024 15:00", amount: 10000000, method: "Tiền mặt (Đặt cọc)", status: "Thành công" },
    { date: "24/01/2024 09:00", amount: 20000000, method: "Chuyển khoản thử nghiệm", status: "Thành công" }
  ];

  // Hàm cắt dữ liệu: Nếu chưa bấm "Xem tất cả" thì chỉ lấy 3 phần tử đầu tiên
  const visibleOrderHistory = showAllOrderHistory ? mockOrderHistory : mockOrderHistory.slice(0, 3);
  const visiblePaymentHistory = showAllPaymentHistory ? mockPaymentHistory : mockPaymentHistory.slice(0, 3);

  const formatCurrency = (num) => {
    return new Intl.NumberFormat("vi-VN").format(num) + " đ";
  };

  return (
    <div className="w-full min-h-screen bg-[#f4f6f8] font-sans text-slate-700 antialiased p-4 text-left animate-fadeIn">
      
      {/* HEADER BAR */}
      <div className="flex justify-between items-start mb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Chi tiết phiếu nhập</h1>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1 font-medium">
            <span>Dashboard</span> <span>❯</span> <span>Danh sách nhập kho</span> <span>❯</span> <span className="text-emerald-600 font-semibold">Chi tiết nhập kho</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1 bg-white border border-gray-200 text-gray-600 px-3 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-gray-50 transition cursor-pointer">
            📤 Xuất
          </button>
          <button 
            onClick={() => navigate("/admin/inventory/import-list")}
            className="flex items-center gap-1 bg-white border border-gray-200 text-gray-600 px-3 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-gray-50 transition active:scale-95 cursor-pointer"
          >
            ↩ Quay về
          </button>
        </div>
      </div>

      {/* WHITE CARD CONTAINER */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
        
        {/* TOP SECTION: TICKET ID & BANNER TOTAL */}
        <div className="flex flex-wrap justify-between items-center gap-4 border-b border-gray-50 pb-5">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">{currentTicket.id}</h2>
            <p className="text-xs text-gray-400 mt-1 font-medium">Ngày lập: {currentTicket.date}</p>
          </div>
          <div className="bg-[#006c49] text-white px-6 py-4 rounded-xl shadow-sm min-w-[280px] flex justify-between items-center select-none">
            <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-200">TỔNG CỘNG:</span>
            <span className="text-2xl font-black font-mono">{formatCurrency(currentTicket.total)}</span>
          </div>
        </div>

        {/* INFO BLOCKS: TWO COLUMNS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* THÔNG TIN NHÀ CUNG CẤP */}
          <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/20 space-y-3">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block select-none">Thông tin nhà cung cấp</span>
            <h4 className="text-lg font-bold text-slate-800">Công ty TNHH Nông Sản Xanh</h4>
            <div className="text-xs text-gray-500 space-y-2 font-medium">
              <p className="flex items-center gap-2">📍 Lô 12, KCN Tân Bình, Phường Tây Thạnh, Quận Tân Phú, TP. HCM</p>
              <p className="flex items-center gap-2">📞 0988 123 456</p>
              <p className="flex items-center gap-2">✉ contact@nongsanxanh.com</p>
            </div>
          </div>

          {/* THÔNG TIN NHẬP KHO */}
          <div className="border border-emerald-100/50 rounded-2xl p-5 bg-emerald-50/5 space-y-3">
            <span className="text-[10px] font-black text-emerald-700/60 uppercase tracking-wider block select-none">Thông tin nhập kho</span>
            <h4 className="text-lg font-bold text-emerald-900">{currentTicket.warehouse}</h4>
            <div className="text-xs text-slate-600 space-y-2.5 font-semibold">
              <p className="flex items-center gap-2">📊 <span className="text-gray-400 font-normal">Loại nhập:</span> Mua Hàng</p>
              <p className="flex items-center gap-2">👤 <span className="text-gray-400 font-normal">Người phụ trách:</span> {currentTicket.creator}</p>
              <p className="flex items-center gap-2">📝 <span className="text-gray-400 font-normal">Ghi chú:</span> Nhập kho định kỳ</p>
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
              { label: "Đã nhập kho", done: currentTicket.status === "completed" }
            ].map((step, idx) => (
              <div key={idx} className="flex flex-col items-center bg-white px-4">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${step.done ? "bg-emerald-600" : "bg-gray-200"}`}>
                  {step.done ? "✓" : idx + 1}
                </div>
                <span className={`text-[11px] font-bold mt-2 ${step.done ? "text-emerald-600" : "text-gray-400"}`}>{step.label}</span>
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
                <th className="py-3 px-4 text-center">Mã LOT</th>
                <th className="py-3 px-4 text-center">SL Chuẩn</th>
                <th className="py-3 px-4 text-right">Đơn Giá</th>
                <th className="py-3 px-4 text-right">Thành Tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-slate-600">
              {mockItems.map((item, index) => (
                <tr key={index} className="hover:bg-slate-50/30 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-lg shadow-inner select-none">{item.img}</div>
                      <div>
                        <p className="text-slate-800 font-bold">{item.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono font-medium">{item.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-100/40 font-mono">{item.lot}</span>
                  </td>
                  <td className="py-4 px-4 text-center font-mono font-bold text-slate-700">{item.qty}</td>
                  <td className="py-4 px-4 text-right font-mono text-gray-400">{formatCurrency(item.price)}</td>
                  <td className="py-4 px-4 text-right font-mono font-black text-slate-800">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 🛠️ PHẦN THÊM MỚI: LỊCH SỬ ĐƠN HÀNG VÀ THANH TOÁN (HAI CỘT) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-gray-50">
          
          {/* LỊCH SỬ ĐƠN HÀNG */}
          <div className="space-y-3">
            <div className="flex justify-between items-center select-none">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Lịch sử đơn hàng</span>
              {mockOrderHistory.length > 3 && (
                <button 
                  onClick={() => setShowAllOrderHistory(!showAllOrderHistory)}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer transition"
                >
                  {showAllOrderHistory ? "Thu gọn ↩" : `Xem tất cả (${mockOrderHistory.length}) ❯`}
                </button>
              )}
            </div>
            <div className="border border-gray-100 rounded-xl divide-y divide-gray-50 overflow-hidden text-xs">
              {visibleOrderHistory.map((log, index) => (
                <div key={index} className="p-3 bg-slate-50/30 flex justify-between items-center gap-2 hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="font-bold text-slate-800">{log.action}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Bởi: {log.actor}</p>
                  </div>
                  <span className="text-[10px] font-mono text-gray-400 shrink-0">{log.date}</span>
                </div>
              ))}
            </div>
          </div>

          {/* LỊCH SỬ THANH TOÁN */}
          <div className="space-y-3">
            <div className="flex justify-between items-center select-none">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Lịch sử thanh toán</span>
              {mockPaymentHistory.length > 3 && (
                <button 
                  onClick={() => setShowAllPaymentHistory(!showAllPaymentHistory)}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer transition"
                >
                  {showAllPaymentHistory ? "Thu gọn ↩" : `Xem tất cả (${mockPaymentHistory.length}) ❯`}
                </button>
              )}
            </div>
            <div className="border border-gray-100 rounded-xl divide-y divide-gray-50 overflow-hidden text-xs">
              {visiblePaymentHistory.map((pay, index) => (
                <div key={index} className="p-3 bg-slate-50/30 flex justify-between items-center gap-2 hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="font-black text-emerald-700 font-mono">{formatCurrency(pay.amount)}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{pay.method}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="bg-emerald-50 text-emerald-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-emerald-100/30 block mb-1">{pay.status}</span>
                    <span className="text-[10px] font-mono text-gray-400 block">{pay.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}