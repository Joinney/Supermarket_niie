import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

export default function Danhsachdonhang() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- STATE BỘ LỌC & TÌM KIẾM ---
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPayment, setFilterPayment] = useState("");
  const [showFilter, setShowFilter] = useState(false);

  // --- STATE PHÂN TRANG & CHỌN ĐƠN HÀNG ---
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limit, setLimit] = useState(10);
  const [selectedOrders, setSelectedOrders] = useState([]); // 🌟 State lưu ID các đơn hàng đã chọn

  // 🎯 HÀM TẢI DỮ LIỆU ĐƠN HÀNG
  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const adminToken = localStorage.getItem("adminToken");
      const apiUrl = import.meta.env.VITE_API_ORDER_URL || "http://localhost:5005";

      // 🌟 ĐÃ SỬA: Thay đổi endpoint từ '/api/orders' sang '/api/orders/admin/all-orders' để khớp với Back-end Admin Route
      const response = await axios.get(`${apiUrl}/api/orders/admin/all-orders`, {
        params: {
          page: currentPage,
          limit: limit,
          search: searchTerm || undefined,
          status: filterStatus || undefined, // 🌟 Truyền trạng thái lọc xuống
          payment: filterPayment || undefined, // 🌟 Truyền trạng thái thanh toán xuống
        },
        headers: { Authorization: adminToken ? `Bearer ${adminToken}` : "" },
      });

      if (response.data && response.data.orders) {
        setOrders(response.data.orders);
        setTotalPages(response.data.totalPages || 1);
        setTotalItems(response.data.totalItems || 0);
      } else {
        setOrders([]);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setError(
          "Phiên đăng nhập Admin đã hết hạn (401). Vui lòng đăng nhập lại!",
        );
      } else {
        setError("Không thể kết nối đến phân hệ Order Service (5005)!");
      }
    } finally {
      setLoading(false);
    }
  };

  // 🌟 TRIGGER GỌI API KHI CÁC STATE THAY ĐỔI
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, currentPage, limit, filterStatus, filterPayment]);

  // 🌟 XỬ LÝ CHỌN TẤT CẢ (CHECKBOX)
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = orders.map((o) => o.id || o.ma_don_hang);
      setSelectedOrders(allIds);
    } else {
      setSelectedOrders([]);
    }
  };

  // 🌟 XỬ LÝ CHỌN TỪNG DÒNG (CHECKBOX)
  const handleSelectOrder = (id) => {
    setSelectedOrders((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // 🌟 XỬ LÝ LÀM MỚI
  const handleRefresh = () => {
    setSearchTerm("");
    setFilterStatus("");
    setFilterPayment("");
    setCurrentPage(1);
    setSelectedOrders([]);
  };

  const handleViewOrderDetail = (order) => {
    navigate(`/admin/Donhang/Chitietdonhang/${order.ma_don_hang}`, {
      state: {
        orderId: order.id || order.ma_don_hang,
        maDonHang: order.ma_don_hang,
        fullOrderData: order,
      },
    });
  };

  // Các hàm tiện ích format (giữ nguyên)
  const getDeliveryBadgeClass = (status) => {
    const s = String(status || "").toLowerCase();
    if (["shipped", "delivered", "da_giao", "đã giao"].includes(s))
      return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    if (
      [
        "processing",
        "pending",
        "dang_xu_ly",
        "cho_xu_ly",
        "chờ xử lý",
      ].includes(s)
    )
      return "bg-amber-100 text-amber-700 border border-amber-200";
    if (["cancelled", "da_huy", "đã hủy"].includes(s))
      return "bg-rose-100 text-rose-700 border border-rose-200";
    return "bg-slate-100 text-slate-700 border border-slate-200";
  };

  const getPaymentBadgeClass = (status) => {
    const s = String(status || "").toLowerCase();
    if (["completed", "da_thanh_toan", "success"].includes(s))
      return "bg-blue-50 text-blue-600 border border-blue-200";
    return "bg-slate-50 text-slate-600 border border-slate-200";
  };

  const formatOrderDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div
      className="w-full bg-[#fafafa] font-sans antialiased text-slate-800 text-left min-h-screen pb-10"
      onClick={() => setShowFilter(false)}
    >
      {/* HEADER AREA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            Danh sách đơn hàng
          </h1>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">
            <Link
              to="/admin/dashboard/thongkesanpham"
              className="hover:text-emerald-600 transition-colors"
            >
              Dashboard
            </Link>
            <span>❯</span>{" "}
            <span className="text-emerald-700">Danh sách đơn hàng</span>
          </div>
        </div>
      </div>

      {/* TÍNH NĂNG CHỌN HÀNG LOẠT NỔI LÊN KHI CÓ ITEM ĐƯỢC CHỌN */}
      {selectedOrders.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 mb-4 flex justify-between items-center shadow-sm">
          <span className="text-sm font-bold text-emerald-700">
            Đã chọn {selectedOrders.length} đơn hàng
          </span>
          <div className="flex gap-2">
            <button className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition">
              In mã vạch
            </button>
            <button
              onClick={() => setSelectedOrders([])}
              className="px-4 py-1.5 bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition"
            >
              Hủy chọn
            </button>
          </div>
        </div>
      )}

      {/* FILTER & CONTAINER BOX */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-visible">
        <div className="p-5 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center border-b border-slate-50 relative">
          {/* Ô TÌM KIẾM */}
          <div className="relative flex-1 max-w-md flex">
            <input
              type="text"
              placeholder="Nhập mã đơn (hoặc 3 số cuối) để tìm..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-4 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-emerald-500 transition-all placeholder-slate-400 text-slate-700"
            />
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className={`w-4 h-4 ${loading ? "animate-spin text-emerald-500" : ""}`}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end md:self-auto">
            {/* 🌟 NÚT LÀM MỚI */}
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-black uppercase tracking-wider text-slate-600 transition"
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
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                />
              </svg>{" "}
              Làm mới
            </button>

            {/* 🌟 NÚT LỌC & DROPDOWN */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setShowFilter(!showFilter)}
                className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-black uppercase tracking-wider text-slate-600 transition relative"
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
                    d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
                  />
                </svg>
                Lọc
                {(filterStatus || filterPayment) && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                  </span>
                )}
              </button>

              {/* DROPDOWN LỌC */}
              {showFilter && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-100 rounded-2xl shadow-xl z-20 p-5 origin-top-right">
                  <h3 className="text-sm font-black text-slate-800 mb-4 border-b border-slate-50 pb-2">
                    Lọc dữ liệu
                  </h3>
                  <div className="mb-4">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                      Trạng thái vận chuyển
                    </label>
                    <select
                      value={filterStatus}
                      onChange={(e) => {
                        setFilterStatus(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 transition"
                    >
                      <option value="">Tất cả</option>
                      <option value="pending">Chờ xử lý</option>
                      <option value="shipped">Đang giao hàng</option>
                      <option value="delivered">Đã giao thành công</option>
                      <option value="cancelled">Đã hủy</option>
                    </select>
                  </div>
                  <div className="mb-5">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                      Trạng thái thanh toán
                    </label>
                    <select
                      value={filterPayment}
                      onChange={(e) => {
                        setFilterPayment(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 transition"
                    >
                      <option value="">Tất cả</option>
                      <option value="pending">Chờ thanh toán</option>
                      <option value="completed">Đã thanh toán</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setFilterStatus("");
                        setFilterPayment("");
                        setCurrentPage(1);
                        setShowFilter(false);
                      }}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold py-2.5 rounded-xl transition"
                    >
                      Xóa lọc
                    </button>
                    <button
                      onClick={() => setShowFilter(false)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl transition shadow-sm"
                    >
                      Áp dụng
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TABLE WRAPPER */}
        <div className="w-full overflow-x-auto min-h-[400px]">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400 select-none">
                <th className="py-4 px-5 w-4">
                  {/* 🌟 NÚT CHECKBOX CHỌN TẤT CẢ */}
                  <input
                    type="checkbox"
                    checked={
                      orders.length > 0 &&
                      selectedOrders.length === orders.length
                    }
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 accent-emerald-600 cursor-pointer w-4 h-4"
                  />
                </th>
                <th className="py-4 px-4 whitespace-nowrap">Mã đơn hàng</th>
                <th className="py-4 px-4 min-w-[280px]">Sản phẩm</th>
                <th className="py-4 px-4 whitespace-nowrap text-right">
                  Tổng tiền
                </th>
                <th className="py-4 px-4 whitespace-nowrap text-center">
                  Thanh toán
                </th>
                <th className="py-4 px-4 whitespace-nowrap text-center">
                  Trạng thái
                </th>
                <th className="py-4 px-4 whitespace-nowrap">Ngày đặt</th>
                <th className="py-4 px-5 text-center whitespace-nowrap">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-700">
              {loading && (
                <tr>
                  <td
                    colSpan="8"
                    className="py-16 text-center text-emerald-700 font-bold animate-pulse"
                  >
                    Đang tìm kiếm & nạp dữ liệu...
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td
                    colSpan="8"
                    className="py-16 text-center text-red-500 font-bold bg-red-50/30"
                  >
                    ⚠️ {error}
                  </td>
                </tr>
              )}
              {!loading && !error && orders.length === 0 && (
                <tr>
                  <td
                    colSpan="8"
                    className="py-16 text-center text-slate-400 font-medium italic"
                  >
                    Không tìm thấy dữ liệu hóa đơn nào.
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                orders.map((order, idx) => {
                  const orderItems =
                    order.danh_sach_san_pham || order.items || [];
                  const orderIdKey = order.id || order.ma_don_hang;
                  const isSelected = selectedOrders.includes(orderIdKey); // Kiểm tra xem dòng này có đang được chọn không

                  const groupedItems = {};
                  orderItems.forEach((item) => {
                    const pName =
                      item.product_name ||
                      item.ten_san_pham ||
                      "Sản phẩm không tên";
                    const vName = item.variant_name || "Mặc định";
                    const qty = Number(item.quantity || item.so_luong || 1);
                    if (!groupedItems[pName]) groupedItems[pName] = [];
                    groupedItems[pName].push(`${vName} (x${qty})`);
                  });

                  return (
                    <tr
                      key={orderIdKey || idx}
                      className={`transition-colors group ${isSelected ? "bg-emerald-50/40" : "hover:bg-slate-50/50"}`}
                    >
                      <td className="py-4 px-5 align-top pt-5">
                        {/* 🌟 NÚT CHECKBOX TỪNG DÒNG */}
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOrder(orderIdKey)}
                          className="rounded border-slate-300 accent-emerald-600 cursor-pointer w-4 h-4"
                        />
                      </td>

                      <td
                        className="py-4 px-4 font-black text-slate-800 whitespace-nowrap font-mono align-top pt-5"
                        onDoubleClick={() => handleViewOrderDetail(order)}
                      >
                        #{order.ma_don_hang}
                      </td>

                      <td
                        className="py-4 px-4 align-top"
                        onDoubleClick={() => handleViewOrderDetail(order)}
                      >
                        {Object.keys(groupedItems).length > 0 ? (
                          <div className="flex flex-col gap-2">
                            {Object.entries(groupedItems).map(
                              ([pName, variantsList], iIdx) => (
                                <div
                                  key={iIdx}
                                  className="text-[11px] leading-tight"
                                >
                                  <span className="font-bold text-slate-800">
                                    {pName}
                                  </span>
                                  <span className="text-slate-500 font-medium ml-1">
                                    [{variantsList.join(", ")}]
                                  </span>
                                </div>
                              ),
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic font-bold">
                            Không rõ kiện hàng
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 font-black text-emerald-700 whitespace-nowrap text-right align-top pt-5">
                        {order.tong_thanh_toan
                          ? `${Number(order.tong_thanh_toan).toLocaleString("vi-VN")} đ`
                          : "0 đ"}
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap text-center align-top pt-5">
                        <span
                          className={`px-2.5 py-1 rounded-[6px] text-[9px] font-black uppercase tracking-wider ${getPaymentBadgeClass(order.trang_thai_thanh_toan)}`}
                        >
                          {order.trang_thai_thanh_toan || "PENDING"}
                        </span>
                        <span className="block text-[9px] font-bold text-slate-400 mt-1 uppercase">
                          {order.phuong_thuc_thanh_toan || "COD"}
                        </span>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap text-center align-top pt-5">
                        <span
                          className={`px-2.5 py-1 rounded-[6px] text-[9px] font-black uppercase tracking-wider ${getDeliveryBadgeClass(order.trang_thai_don_hang)}`}
                        >
                          {order.trang_thai_don_hang || "Chờ xử lý"}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-slate-500 font-bold whitespace-nowrap text-[11px] align-top pt-5">
                        {formatOrderDate(order.ngay_tao)}
                      </td>

                      <td className="py-4 px-5 align-top pt-4">
                        <div className="flex items-center justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleViewOrderDetail(order)}
                            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition border border-transparent hover:border-emerald-200"
                            title="Xem chi tiết đơn hàng"
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
                                d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* PAGINATION PANEL */}
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-slate-100 text-xs font-bold text-slate-400">
          <div>
            Hiển thị{" "}
            <span className="text-slate-800 font-black">
              {orders.length > 0 ? (currentPage - 1) * limit + 1 : 0}
            </span>{" "}
            -{" "}
            <span className="text-slate-800 font-black">
              {Math.min(currentPage * limit, totalItems)}
            </span>{" "}
            trong tổng số{" "}
            <span className="text-emerald-700 font-black">{totalItems}</span>{" "}
            đơn hàng
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold">Mỗi trang:</span>
              <div className="relative">
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="appearance-none bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 font-black text-slate-700 outline-none cursor-pointer focus:bg-white focus:border-emerald-500 transition"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none">
                  ▼
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 active:scale-95 transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ❮
              </button>
              <div className="px-2 font-black text-slate-700">
                Trang {currentPage} / {totalPages}
              </div>
              <button
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 active:scale-95 transition disabled:opacity-30 disabled:cursor-not-allowed"
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