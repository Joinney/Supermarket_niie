import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom"; // 🌟 Thêm useNavigate
import axios from "axios";

export default function Danhsachdonhang() {
  const navigate = useNavigate(); // 🌟 Khởi tạo hook điều hướng
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // --- STATE QUẢN LÝ PHÂN TRANG & BỘ LỌC TÌM KIẾM ---
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limit, setLimit] = useState(10);

  // 🎯 HÀM TẢI DỮ LIỆU ĐƠN HÀNG TỪ ORDER-SERVICE
  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const orderApiUrl = import.meta.env.VITE_API_ORDER_URL || "http://localhost:5005";
      
      const response = await axios.get(`${orderApiUrl}/api/orders`, {
        params: {
          page: currentPage,
          limit: limit,
          search: searchTerm || undefined
        }
      });

      if (response.data && response.data.orders) {
        setOrders(response.data.orders);
        setTotalPages(response.data.totalPages || 1);
        setTotalItems(response.data.totalItems || 0);
      } else if (Array.isArray(response.data)) {
        setOrders(response.data);
        setTotalPages(1);
        setTotalItems(response.data.length);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error("❌ Lỗi truy xuất danh sách đơn hàng:", err);
      setError("Không thể kết nối đến phân hệ Order Service (Cổng 5005)!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentPage, limit]);

  const handleSearchSubmit = (e) => {
    if (e.key === "Enter") {
      setCurrentPage(1);
      fetchOrders();
    }
  };

  const handleRefresh = () => {
    setSearchTerm("");
    setCurrentPage(1);
    fetchOrders();
  };

  // 🌟 HÀM ĐIỀU HƯỚNG SANG TRANG CHI TIẾT ĐƠN HÀNG KÈM DỮ LIỆU
  const handleViewOrderDetail = (order) => {
    navigate("/admin/Donhang/Chitietdonhang", {
      state: { 
        orderId: order.id || order.ma_don_hang,
        maDonHang: order.ma_don_hang,
        fullOrderData: order
      }
    });
  };

  const getDeliveryBadgeClass = (status) => {
    const cleanStatus = String(status || "").toLowerCase();
    switch (cleanStatus) {
      case "shipped":
      case "delivered":
      case "da_giao":
        return "bg-emerald-100 text-emerald-600";
      case "processing":
      case "pending":
      case "dang_xu_ly":
      case "cho_xu_ly":
        return "bg-amber-100 text-amber-600";
      case "cancelled":
      case "da_huy":
        return "bg-red-100 text-red-500";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getPaymentBadgeClass = (status) => {
    const cleanStatus = String(status || "").toLowerCase();
    if (cleanStatus === "completed" || cleanStatus === "da_thanh_toan") {
      return "bg-emerald-50 text-emerald-600 border border-emerald-200";
    }
    return "bg-amber-50 text-amber-600 border border-amber-200";
  };

  const formatOrderDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      }).replace(",", " AT");
    } catch {
      return dateString;
    }
  };

  return (
    <div className="w-full bg-[#fafafa] font-sans antialiased text-slate-800 text-left">
      
      {/* HEADER AREA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">Danh sách đơn hàng</h1>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 mt-1">
            <Link to="/admin/dashboard/thongkesanpham" className="hover:text-slate-600 transition-colors">
              Dashboard
            </Link>
            <span>❯</span>
            <span className="text-[#006c49]">Danh sách đơn hàng</span>
          </div>
        </div>
        <button className="flex items-center gap-2 bg-[#006c49] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-[#00563a] active:scale-95 transition-all self-start sm:self-center">
          <span className="text-lg leading-none">+</span> Thêm
        </button>
      </div>

      {/* FILTER & CONTAINER BOX */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        
        {/* TOOLBAR */}
        <div className="p-4 sm:p-5 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center border-b border-gray-50">
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Nhập mã đơn hàng, nhấn Enter để tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchSubmit}
              className="w-full pl-10 pr-4 py-2.5 bg-[#f8f9fa] border border-transparent rounded-xl text-sm outline-none focus:bg-white focus:border-gray-200 focus:ring-4 focus:ring-emerald-500/5 transition-all font-medium placeholder-gray-400"
            />
          </div>

          <div className="flex items-center gap-2.5 self-end md:self-auto">
            <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-600 transition">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              Làm mới
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-600 transition">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
              Lọc
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-600 transition">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              Xuất
            </button>
          </div>
        </div>

        {/* TABLE WRAPPER */}
        <div className="w-full overflow-x-auto min-h-0">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#fcfdfd] border-b border-gray-100 text-[10px] font-extrabold uppercase tracking-wider text-gray-500 select-none">
                <th className="py-4 px-5 w-4">
                  <input type="checkbox" className="rounded border-gray-300 accent-emerald-600 cursor-pointer" />
                </th>
                <th className="py-4 px-4 whitespace-nowrap">Mã đơn hàng</th>
                <th className="py-4 px-4 whitespace-nowrap">Phương thức</th>
                <th className="py-4 px-4 whitespace-nowrap">Trạng thái thanh toán</th>
                <th className="py-4 px-4 whitespace-nowrap">Trạng thái giao hàng</th>
                <th className="py-4 px-4 whitespace-nowrap">Tổng thanh toán</th>
                <th className="py-4 px-4 whitespace-nowrap">Ngày khởi tạo</th>
                <th className="py-4 px-5 text-center whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs font-semibold text-slate-600">
              
              {loading && (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-[#006c49] font-bold animate-pulse">
                    Đang kết nối cổng 5005 nạp danh sách dữ liệu từ Postgres...
                  </td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-red-500 font-bold bg-red-50/50">
                    ⚠️ {error}
                  </td>
                </tr>
              )}

              {!loading && !error && orders.length === 0 && (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-gray-400 font-medium italic">
                    Không tìm thấy dữ liệu hóa đơn nào phù hợp với mã cần tra cứu.
                  </td>
                </tr>
              )}

              {!loading && !error && orders.map((order, idx) => (
                <tr key={order.id || idx} className="hover:bg-gray-50/30 transition-colors">
                  <td className="py-4 px-5">
                    <input type="checkbox" className="rounded border-gray-300 accent-emerald-600 cursor-pointer" />
                  </td>
                  <td className="py-4 px-4 font-black text-slate-700 whitespace-nowrap">
                    {order.ma_don_hang}
                  </td>
                  <td className="py-4 px-4 font-bold text-slate-500 whitespace-nowrap">
                    {order.phuong_thuc_thanh_toan || "PayPal"}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase ${getPaymentBadgeClass(order.trang_thai_thanh_toan)}`}>
                      {order.trang_thai_thanh_toan || "PENDING"}
                    </span>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-black ${getDeliveryBadgeClass(order.trang_thai_don_hang)}`}>
                      {order.trang_thai_don_hang || "Chờ xử lý"}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-black text-emerald-700 whitespace-nowrap">
                    {order.tong_thanh_toan ? `${Number(order.tong_thanh_toan).toLocaleString("vi-VN")} đ` : "0 đ"}
                  </td>
                  <td className="py-4 px-4 text-gray-400 font-bold whitespace-nowrap">
                    {formatOrderDate(order.ngay_tao)}
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex items-center justify-center gap-2.5">
                      {/* 🌟 NÚT XEM CHI TIẾT: Kích hoạt hàm điều hướng */}
                      <button 
                        onClick={() => handleViewOrderDetail(order)}
                        className="text-gray-300 hover:text-emerald-600 transition" 
                        title="Xem chi tiết"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                      <button className="text-gray-300 hover:text-amber-500 transition" title="Cập nhật trạng thái">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION PANEL */}
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-gray-50 text-xs font-bold text-gray-400">
          <div>
            Hiển thị <span className="text-slate-800">{orders.length > 0 ? (currentPage - 1) * limit + 1 : 0}</span> - <span className="text-slate-800">{Math.min(currentPage * limit, totalItems)}</span> trong tổng số <span className="text-slate-800">{totalItems}</span> đơn hàng
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="font-medium">Số hàng mỗi trang:</span>
              <div className="relative">
                <select 
                  value={limit}
                  onChange={(e) => { setLimit(Number(e.target.value)); setCurrentPage(1); }}
                  className="appearance-none bg-[#f8f9fa] border border-gray-100 rounded-xl pl-3 pr-8 py-1.5 font-bold text-slate-700 outline-none cursor-pointer focus:bg-white focus:border-gray-200 transition"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none">▼</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="w-8 h-8 flex items-center justify-center border border-gray-100 rounded-xl hover:bg-gray-50 text-gray-400 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ❮
              </button>
              <div className="px-2 font-black text-slate-700">Trang {currentPage} / {totalPages}</div>
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="w-8 h-8 flex items-center justify-center border border-gray-100 rounded-xl hover:bg-gray-50 text-gray-400 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ❯navigate
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}