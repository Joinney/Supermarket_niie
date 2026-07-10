import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { orderApi } from "../../../api/axios"; // Thực thể kết nối axios instance tập trung của dự án
import { Loader2 } from "lucide-react"; 

export default function DanhsachTrackingorder() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- STATE BỘ LỌC & TÌM KIẾM ---
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showFilter, setShowFilter] = useState(false);

  // --- STATE PHÂN TRANG & STATS ---
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limit, setLimit] = useState(10);
  const [selectedOrders, setSelectedOrders] = useState([]);

  // --- STATE THỐNG KÊ COUNTER DASHBOARD ---
  const [stats, setStats] = useState({
    total_orders: 0,
    delivered_orders: 0,
    pending_orders: 0,
    today_orders: 0,
    total_revenue: 0
  });

  // 🔄 TRUY VẤN LIVE DỮ LIỆU TỪ BACKEND DATABASE (SỬA LỖI ĐỒNG BỘ 401 THEO ADMIN TOKEN)
  const fetchTrackingOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      // 🌟 ĐỒNG BỘ CHUẨN: Lấy chính xác biến adminToken như trang Danhsachdonhang
      let authToken = localStorage.getItem("adminToken");

      if (authToken) {
        authToken = String(authToken).replace(/^"|"$/g, '').trim();
      }

      // Cấu hình tham số và header mang theo Token xác thực admin
      const requestConfig = {
        params: {
          page: currentPage,
          limit: limit,
          search: searchTerm || undefined,
          status: filterStatus || undefined
        },
        headers: {
          'Authorization': authToken ? `Bearer ${authToken}` : ""
        }
      };

      // 1. Gọi API lấy danh sách đơn hàng phân trang bóc kèm trạm hiện tại
      const response = await orderApi.get("/orders/admin/all-orders", requestConfig);

      if (response.data?.success) {
        setOrders(response.data.orders || []);
        setTotalPages(response.data.totalPages || 1);
        setTotalItems(response.data.totalItems || 0);
      }

      // 2. Gọi API lấy số liệu thống kê Counter hiển thị thẻ card
      const statsResponse = await orderApi.get("/orders/admin/statistics", {
        headers: { 'Authorization': authToken ? `Bearer ${authToken}` : "" }
      });
      if (statsResponse.data?.success) {
        setStats(statsResponse.data.data.overview || {});
      }
    } catch (err) {
      console.error("🔥 Lỗi kết nối API hệ thống đơn hàng:", err);
      if (err.response?.status === 401) {
        setError("Phiên đăng nhập Admin đã hết hạn (401). Vui lòng đăng nhập lại!");
      } else {
        setError("Không thể kết nối phân hệ máy chủ dịch vụ đơn hàng nội bộ!");
      }
    } finally {
      setLoading(false);
    }
  };

  // Kích hoạt Effect nạp lại lưới dữ liệu khi có biến động trang hoặc bộ lọc
  useEffect(() => {
    fetchTrackingOrders();
  }, [currentPage, limit, filterStatus]);

  // Cơ chế Debounce xử lý hoãn request tránh spam khi đang gõ phím ô tìm kiếm
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (currentPage !== 1) setCurrentPage(1);
      else fetchTrackingOrders();
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = orders.map((o) => o.id);
      setSelectedOrders(allIds);
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOrder = (id) => {
    setSelectedOrders((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleRefresh = () => {
    setSearchTerm("");
    setFilterStatus("");
    setCurrentPage(1);
    setSelectedOrders([]);
    fetchTrackingOrders();
  };

  // 🌟 ĐIỀU HƯỚNG SANG PANEL BẢN ĐỒ CHI TIẾT: Sử dụng mã đơn hàng ma_don_hang trên URL đại diện
  const handleViewOrderDetail = (order) => {
    navigate(`/admin/Donhang/Chitiettracking/${order.ma_don_hang}`, {
      state: {
        orderId: order.id, // Vẫn gửi ngầm ID gốc để trang chi tiết query DB nếu cần
        maDonHang: order.ma_don_hang
      },
    });
  };

  const getTrackingBadgeClass = (status) => {
    const s = String(status || "").toLowerCase().trim();
    if (["shipped", "dang_giao", "đang giao", "delivering"].includes(s))
      return "bg-[#fff7ed] text-[#ea580c] border border-[#ffedd5]";
    if (["delivered", "da_giao", "đã giao", "thành công"].includes(s))
      return "bg-[#f0fdf4] text-[#16a34a] border border-[#dcfce7]";
    if (["delayed", "cham_tre", "chậm trễ", "đã hủy", "canceled", "đã hủy đơn"].includes(s))
      return "bg-[#fef2f2] text-[#dc2626] border border-[#fee2e2]";
    return "bg-[#eff6ff] text-[#2563eb] border border-[#dbeafe]";
  };

  return (
    <div className="w-full bg-[#fafafa] font-sans antialiased text-slate-800 text-left min-h-screen pb-10" onClick={() => setShowFilter(false)}>
      
      {/* HEADER AREA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            Danh sách tracking đơn hàng
          </h1>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">
            <Link to="/admin/dashboard/thongkesanpham" className="hover:text-emerald-600 transition-colors">
              Dashboard
            </Link>
            <span>❯</span>{" "}
            <span className="text-emerald-700">Danh sách tracking đơn hàng</span>
          </div>
        </div>
      </div>

      {/* TOP COUNTER CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Tất cả</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{stats.total_orders || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Chờ xử lý</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{stats.pending_orders || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Đã hoàn thành</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{stats.delivered_orders || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Hôm nay</div>
          <div className="text-2xl font-black text-blue-600 mt-1">{stats.today_orders || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Doanh thu đối soát</div>
          <div className="text-lg font-black text-slate-700 mt-2 truncate">{(stats.total_revenue || 0).toLocaleString("vi-VN")} đ</div>
        </div>
      </div>

      {/* BÀN ĐIỀU KHIỂN CHỌN HÀNG LOẠT */}
      {selectedOrders.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 mb-4 flex justify-between items-center shadow-sm">
          <span className="text-sm font-bold text-emerald-700">
            Đã chọn {selectedOrders.length} vận đơn trong danh sách
          </span>
          <div className="flex gap-2">
            <button className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition">
              Xuất file dữ liệu
            </button>
            <button
              onClick={() => setSelectedOrders([])}
              className="px-4 py-1.5 bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-lg text-xs font-bold transition"
            >
              Hủy chọn
            </button>
          </div>
        </div>
      )}

      {/* CONTAINER CHỨA BỘ LỌC VÀ BẢNG THÔNG TIN */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-visible">
        <div className="p-5 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center border-b border-slate-50 relative">
          
          <div className="relative flex-1 max-w-md flex">
            <input
              type="text"
              placeholder="Nhập mã vận đơn để tìm hành trình..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-emerald-500 transition-all placeholder-slate-400 text-slate-700"
            />
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-emerald-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end md:self-auto">
            <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-black uppercase tracking-wider text-slate-600 transition">
              Làm mới
            </button>

            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowFilter(!showFilter)} className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-black uppercase tracking-wider text-slate-600 transition relative">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /></svg>
                Trạng thái đơn
              </button>

              {showFilter && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-100 rounded-2xl shadow-xl z-20 p-5 origin-top-right">
                  <h3 className="text-sm font-black text-slate-800 mb-4 border-b border-slate-50 pb-2">Lọc thông tin vận trình</h3>
                  <div className="mb-4">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Trạng thái xử lý</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 transition"
                    >
                      <option value="">Tất cả trạng thái</option>
                      <option value="Chờ xử lý">Chờ xử lý</option>
                      <option value="Đang giao">Đang giao hàng</option>
                      <option value="Đã giao">Đã giao thành công</option>
                      <option value="Đã hủy">Đã hủy bỏ</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setFilterStatus(""); setShowFilter(false); }} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold py-2.5 rounded-xl transition">Xóa bộ lọc</button>
                    <button onClick={() => setShowFilter(false)} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl transition shadow-sm">Áp dụng</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* LƯỚI BẢNG TRUY VẤN ĐỘNG CỦA DATABASE */}
        <div className="w-full overflow-x-auto min-h-[400px] relative">
          {loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-xs flex items-center justify-center z-10">
              <Loader2 className="animate-spin text-emerald-600 w-8 h-8" />
            </div>
          )}

          {error && <div className="text-center p-8 text-sm font-black text-rose-500">{error}</div>}

          {!loading && orders.length === 0 && (
            <div className="text-center py-12 text-xs font-bold text-slate-400">Hệ thống chưa ghi nhận dữ liệu kiện hàng nào khớp bộ lọc.</div>
          )}

          {orders.length > 0 && (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400 select-none">
                  <th className="py-4 px-5 w-4">
                    <input
                      type="checkbox"
                      checked={orders.length > 0 && selectedOrders.length === orders.length}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 checked:bg-emerald-600 accent-emerald-600 cursor-pointer w-4 h-4"
                    />
                  </th>
                  <th className="py-4 px-4 whitespace-nowrap">Mã vận đơn</th>
                  <th className="py-4 px-4 min-w-[240px]">Hình thức nhận hàng (Thanh toán)</th>
                  <th className="py-4 px-4 min-w-[220px]">Trạm hiện tại / Kho trung chuyển</th>
                  <th className="py-4 px-4 text-center whitespace-nowrap">Tổng tiền hàng</th>
                  <th className="py-4 px-4 text-center whitespace-nowrap">Trạng thái đơn</th>
                  <th className="py-4 px-4 whitespace-nowrap">Ngày khởi tạo</th>
                  <th className="py-4 px-5 text-center whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-700">
                {orders.map((order, idx) => {
                  const isSelected = selectedOrders.includes(order.id);

                  return (
                    <tr key={order.id || idx} className={`transition-colors group ${isSelected ? "bg-emerald-50/20" : "hover:bg-slate-50/50"}`}>
                      <td className="py-4 px-5 align-middle">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOrder(order.id)}
                          className="rounded border-slate-300 accent-emerald-600 cursor-pointer w-4 h-4"
                        />
                      </td>

                      <td className="py-4 px-4 font-black text-emerald-700 font-mono whitespace-nowrap align-middle cursor-pointer hover:underline" onClick={() => handleViewOrderDetail(order)}>
                        #{order.ma_don_hang}
                      </td>

                      <td className="py-4 px-4 align-middle">
                        <div className="font-bold text-slate-900">{order.phuong_thuc_thanh_toan || "Ví điện tử / COD"}</div>
                        <div className="text-[10px] text-slate-400 font-medium">Đối soát: {order.trang_thai_thanh_toan}</div>
                      </td>

                      <td className="py-4 px-4 align-middle font-medium text-slate-600">
                        <div className="truncate max-w-[210px] text-[11px] font-bold text-slate-700" title={order.tram_hien_tai}>
                          {order.tram_hien_tai}
                        </div>
                      </td>

                      <td className="py-4 px-4 font-bold text-slate-800 whitespace-nowrap text-center align-middle">
                        {(Number(order.tong_thanh_toan) || 0).toLocaleString("vi-VN")} đ
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap text-center align-middle">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${getTrackingBadgeClass(order.trang_thai_don_hang)}`}>
                          {order.trang_thai_don_hang || "Chờ xử lý"}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-slate-400 font-bold whitespace-nowrap text-[11px] align-middle">
                        {new Date(order.ngay_tao).toLocaleDateString("vi-VN")}
                      </td>

                      <td className="py-4 px-5 align-middle text-center">
                        <button
                          onClick={() => handleViewOrderDetail(order)}
                          className="px-3 py-1.5 border border-slate-200 group-hover:border-emerald-600 bg-white group-hover:bg-emerald-600 text-slate-600 group-hover:text-white rounded-xl font-black text-[10px] uppercase tracking-wider transition-all"
                        >
                          Xem Vận Trình
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* PHÂN TRANG */}
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-slate-100 text-xs font-bold text-slate-400">
          <div>
            Hiển thị kiện thứ <span className="text-slate-800 font-black">{totalItems === 0 ? 0 : (currentPage - 1) * limit + 1}</span> đến{" "}
            <span className="text-slate-800 font-black">{Math.min(currentPage * limit, totalItems)}</span> trong số{" "}
            <span className="text-emerald-700 font-black">{totalItems}</span> vận đơn hành trình.
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold">Mỗi trang:</span>
              <div className="relative">
                <select
                  value={limit}
                  onChange={(e) => { setLimit(Number(e.target.value)); setCurrentPage(1); }}
                  className="appearance-none bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 font-black text-slate-700 outline-none cursor-pointer focus:bg-white focus:border-emerald-500 transition"
                >
                  <option value={5}>5 dòng</option>
                  <option value={10}>10 dòng</option>
                  <option value={20}>20 dòng</option>
                </select>
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none">▼</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className={`w-8 h-8 flex items-center justify-center border rounded-lg transition-all ${currentPage === 1 ? "border-slate-100 text-slate-300 cursor-not-allowed" : "border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"}`}
              >
                ❮
              </button>
              <div className="px-2 font-black text-slate-700">Trang {currentPage} / {totalPages}</div>
              <button 
                disabled={currentPage === totalPages} 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className={`w-8 h-8 flex items-center justify-center border rounded-lg transition-all ${currentPage === totalPages ? "border-slate-100 text-slate-300 cursor-not-allowed" : "border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"}`}
              >
                ❯
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}