import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { orderApi } from "../../../api/axios";

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
  const [selectedOrders, setSelectedOrders] = useState([]);

  // --- STATE DROPDOWN THAO TÁC TRẠNG THÁI NHANH ---
  const [openStatusMenuId, setOpenStatusMenuId] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // 🎯 HÀM TẢI DỮ LIỆU ĐƠN HÀNG TỪ DATABASE
  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await orderApi.get("/admin/all-orders", {
        params: {
          page: currentPage,
          limit: limit,
          search: searchTerm || undefined,
          status: filterStatus || undefined,
          payment: filterPayment || undefined,
        },
      });

      if (response.data && response.data.orders) {
        setOrders(response.data.orders);
        setTotalPages(response.data.totalPages || 1);
        setTotalItems(response.data.totalItems || 0);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error("Lỗi fetch đơn hàng:", err);
      if (err.response?.status === 401) {
        setError("Phiên đăng nhập hết hạn (401). Vui lòng đăng nhập lại!");
      } else {
        setError("Không thể kết nối đến phân hệ Order Service!");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, currentPage, limit, filterStatus, filterPayment]);

  // ⚡ HÀM CẬP NHẬT TRẠNG THÁI ĐƠN LẺ
  const handleUpdateStatus = async (order, newStatus) => {
    const maDonHang = order.ma_don_hang || order.id;
    setUpdatingOrderId(maDonHang);
    setOpenStatusMenuId(null);

    // 🌟 Cập nhật UI local trước để phản hồi mượt mà
    setOrders((prevOrders) =>
      prevOrders.map((o) =>
        (o.ma_don_hang || o.id) === maDonHang
          ? { ...o, trang_thai_don_hang: newStatus, status: newStatus }
          : o
      )
    );

    try {
      if (newStatus === "cancelled" || newStatus === "da_huy") {
        await orderApi.put(`/admin/orders/${maDonHang}/cancel`);
      } else {
        await orderApi.put(`/admin/orders/${maDonHang}/status`, {
          trang_thai_don_hang: newStatus,
          status: newStatus,
        });
      }

      // Nạp lại dữ liệu từ CSDL
      await fetchOrders();
    } catch (err) {
      console.error("Lỗi cập nhật trạng thái:", err.response || err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Cập nhật trạng thái thất bại!";
      alert(`⚠️ Lỗi: ${msg}`);
      // Lỗi thì fetch lại để hoàn tác UI
      fetchOrders();
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // ⚡ HÀM XÁC NHẬN TẤT CẢ ĐƠN ĐÃ CHỌN
  const handleConfirmAllSelected = async () => {
    if (selectedOrders.length === 0) return;

    const pendingSelectedOrders = orders.filter((o) => {
      const orderKey = o.ma_don_hang || o.id;
      const statusStr = String(o.trang_thai_don_hang || o.status || "").toLowerCase().trim();
      const isPending = [
        "pending",
        "dang_xu_ly",
        "cho_xu_ly",
        "chờ xử lý",
        "cho_xac_nhan",
        "chờ xác nhận",
      ].includes(statusStr);
      return selectedOrders.includes(orderKey) && isPending;
    });

    if (pendingSelectedOrders.length === 0) {
      alert("Không có đơn hàng nào đang ở trạng thái Chờ xác nhận trong số đơn đã chọn!");
      return;
    }

    if (!window.confirm(`Xác nhận duyệt ${pendingSelectedOrders.length} đơn hàng đang chờ?`)) {
      return;
    }

    setIsBulkUpdating(true);

    try {
      await Promise.all(
        pendingSelectedOrders.map((o) => {
          const maDonHang = o.ma_don_hang || o.id;
          return orderApi.put(`/admin/orders/${maDonHang}/status`, {
            trang_thai_don_hang: "da_xac_nhan",
            status: "da_xac_nhan",
          });
        })
      );

      setSelectedOrders([]);
      await fetchOrders();
    } catch (err) {
      console.error("Lỗi xác nhận hàng loạt:", err);
      alert("Có lỗi xảy ra khi xác nhận một số đơn hàng!");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = orders.map((o) => o.id || o.ma_don_hang);
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

  // 🌟 KHÔNG GIAO BADGE CLASS CHO TRẠNG THÁI
  const getDeliveryBadgeClass = (status) => {
    const s = String(status || "").toLowerCase().trim();
    if (["da_xac_nhan", "đã xác nhận", "xac_nhan", "xác nhận", "processing", "shipped", "delivered", "da_giao", "đã giao"].includes(s))
      return "bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-bold";
    if (["pending", "dang_xu_ly", "cho_xu_ly", "chờ xử lý", "cho_xac_nhan", "chờ xác nhận"].includes(s))
      return "bg-amber-50 text-amber-700 border border-amber-200/60 font-bold";
    if (["cancelled", "da_huy", "đã hủy"].includes(s))
      return "bg-rose-50 text-rose-700 border border-rose-200/60 font-bold";
    return "bg-slate-50 text-slate-700 border border-slate-200/60 font-bold";
  };

  // 🌟 HIỂN THỊ CHỮ DỰA TRÊN CSDL
  const renderDeliveryBadgeText = (status) => {
    const s = String(status || "").toLowerCase().trim();
    if (["da_xac_nhan", "đã xác nhận", "xac_nhan", "xác nhận"].includes(s)) return "XÁC NHẬN";
    if (["shipped", "da_giao", "đã giao"].includes(s)) return "SHIPPED";
    if (["cancelled", "da_huy", "đã hủy"].includes(s)) return "ĐÃ HỦY";
    return String(status || "CHỜ XỬ LÝ").toUpperCase();
  };

  const getPaymentBadgeClass = (status, method) => {
    const s = String(status || "").toLowerCase().trim();
    const m = String(method || "").toLowerCase().trim();

    const isCompleted = [
      "completed",
      "da_thanh_toan",
      "đã thanh toán",
      "success",
      "paid",
    ].includes(s);

    if (isCompleted) {
      if (m === "demipay") return "bg-emerald-50 text-emerald-600 border border-emerald-200/60";
      if (m === "vnpay") return "bg-orange-50 text-orange-500 border border-orange-200/60";
      return "bg-blue-50 text-blue-600 border border-blue-200/60";
    }

    return "bg-slate-50 text-slate-600 border border-slate-200/60";
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
      onClick={() => {
        setShowFilter(false);
        setOpenStatusMenuId(null);
      }}
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
            <span>❯</span>
            <span className="text-emerald-700">Danh sách đơn hàng</span>
          </div>
        </div>
      </div>

      {/* BAR THAO TÁC HÀNG LOẠT KHI TICK CÁC BẢNG */}
      {selectedOrders.length > 0 && (
        <div className="bg-emerald-50/80 backdrop-blur border border-emerald-200 rounded-2xl p-3 mb-4 flex flex-col sm:flex-row justify-between items-center gap-3 shadow-sm animate-in fade-in zoom-in-95 duration-150">
          <span className="text-sm font-bold text-emerald-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Đã chọn <strong className="font-black">{selectedOrders.length}</strong> đơn hàng
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={isBulkUpdating}
              onClick={handleConfirmAllSelected}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              {isBulkUpdating ? (
                <span className="flex items-center gap-1">
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Đang xử lý...
                </span>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  Xác nhận tất cả
                </>
              )}
            </button>

            <button className="px-4 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition">
              In mã vạch
            </button>

            <button
              onClick={() => setSelectedOrders([])}
              className="px-4 py-1.5 bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-bold transition"
            >
              Hủy chọn
            </button>
          </div>
        </div>
      )}

      {/* CONTAINER CHÍNH */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-visible">
        {/* BAR TÌM KIẾM & BỘ LỌC */}
        <div className="p-5 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center border-b border-slate-100 relative">
          <div className="relative flex-1 max-w-md flex">
            <input
              type="text"
              placeholder="Nhập mã đơn để tìm..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-4 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder-slate-400 text-slate-700"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
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
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-black uppercase tracking-wider text-slate-600 transition active:scale-95"
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
              </svg>
              Làm mới
            </button>

            {/* DROPDOWN LỌC */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setShowFilter(!showFilter)}
                className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-xs font-black uppercase tracking-wider transition relative ${
                  filterStatus || filterPayment
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 hover:bg-slate-50 text-slate-600"
                }`}
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
                  <span className="flex h-2 w-2 rounded-full bg-emerald-600"></span>
                )}
              </button>

              {showFilter && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-100 rounded-2xl shadow-xl z-30 p-5 animate-in fade-in zoom-in-95 duration-100">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                    Bộ lọc tìm kiếm
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
                      <option value="">Tất cả trạng thái</option>
                      <option value="pending">Chờ xử lý</option>
                      <option value="da_xac_nhan">Đã xác nhận</option>
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
                      <option value="">Tất cả phương thức</option>
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
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400 select-none">
                <th className="py-4 px-5 w-4">
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
                <th className="py-4 px-4 min-w-[260px]">Sản phẩm</th>
                <th className="py-4 px-4 whitespace-nowrap text-right">Tổng tiền</th>
                <th className="py-4 px-4 whitespace-nowrap text-center">Thanh toán</th>
                <th className="py-4 px-4 whitespace-nowrap text-center">Trạng thái</th>
                <th className="py-4 px-4 whitespace-nowrap">Ngày đặt</th>
                <th className="py-4 px-5 text-center whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {loading && (
                <tr>
                  <td colSpan="8" className="py-16 text-center text-emerald-600 font-bold animate-pulse">
                    Đang nạp dữ liệu đơn hàng...
                  </td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td colSpan="8" className="py-16 text-center text-rose-500 font-bold bg-rose-50/20">
                    ⚠️ {error}
                  </td>
                </tr>
              )}

              {!loading && !error && orders.length === 0 && (
                <tr>
                  <td colSpan="8" className="py-16 text-center text-slate-400 font-medium italic">
                    Không tìm thấy đơn hàng nào.
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                orders.map((order, idx) => {
                  const orderItems = order.danh_sach_san_pham || order.items || [];
                  const orderIdKey = order.ma_don_hang || order.id;
                  const isSelected = selectedOrders.includes(orderIdKey);

                  const groupedItems = {};
                  orderItems.forEach((item) => {
                    const pName = item.product_name || item.ten_san_pham || "Sản phẩm không tên";
                    const vName = item.variant_name || "Mặc định";
                    const qty = Number(item.quantity || item.so_luong || 1);
                    if (!groupedItems[pName]) groupedItems[pName] = [];
                    groupedItems[pName].push(`${vName} (x${qty})`);
                  });

                  const currentStatusStr = String(order.trang_thai_don_hang || order.status || "").toLowerCase().trim();

                  // 🌟 SỬA ĐIỀU KIỆN PENDING CHUẨN: CHỈ HIỂN THỊ NÚT CHO ĐƠN THỰC SỰ ĐANG CHỜ
                  const isPending = [
                    "pending",
                    "dang_xu_ly",
                    "cho_xu_ly",
                    "cho_xac_nhan",
                    "chờ xử lý",
                    "chờ xác nhận"
                  ].includes(currentStatusStr);

                  return (
                    <tr
                      key={orderIdKey || idx}
                      className={`transition-colors group ${isSelected ? "bg-emerald-50/30" : "hover:bg-slate-50/60"}`}
                    >
                      <td className="py-4 px-5 align-top pt-5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOrder(orderIdKey)}
                          className="rounded border-slate-300 accent-emerald-600 cursor-pointer w-4 h-4"
                        />
                      </td>

                      <td
                        className="py-4 px-4 font-black text-slate-900 whitespace-nowrap font-mono align-top pt-5 cursor-pointer hover:text-emerald-600"
                        onClick={() => handleViewOrderDetail(order)}
                      >
                        #{order.ma_don_hang}
                      </td>

                      <td
                        className="py-4 px-4 align-top pt-5 cursor-pointer"
                        onClick={() => handleViewOrderDetail(order)}
                      >
                        {Object.keys(groupedItems).length > 0 ? (
                          <div className="flex flex-col gap-1.5">
                            {Object.entries(groupedItems).map(([pName, variantsList], iIdx) => (
                              <div key={iIdx} className="text-[11px] leading-snug">
                                <span className="font-bold text-slate-800">{pName}</span>
                                <span className="text-slate-400 font-medium ml-1">
                                  [{variantsList.join(", ")}]
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Không có chi tiết</span>
                        )}
                      </td>

                      <td className="py-4 px-4 font-black text-emerald-700 whitespace-nowrap text-right align-top pt-5">
                        {order.tong_thanh_toan
                          ? `${Number(order.tong_thanh_toan).toLocaleString("vi-VN")} đ`
                          : "0 đ"}
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap text-center align-top pt-5">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${getPaymentBadgeClass(
                            order.trang_thai_thanh_toan,
                            order.phuong_thuc_thanh_toan
                          )}`}
                        >
                          {["completed", "da_thanh_toan", "đã thanh toán", "success", "paid"].includes(
                            String(order.trang_thai_thanh_toan || "").toLowerCase().trim()
                          )
                            ? "COMPLETED"
                            : order.trang_thai_thanh_toan || "PENDING"}
                        </span>
                        <span className="block text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                          {order.phuong_thuc_thanh_toan || "COD"}
                        </span>
                      </td>

                      {/* 🌟 CỘT TRẠNG THÁI HIỂN THỊ CHUẨN */}
                      <td className="py-4 px-4 whitespace-nowrap text-center align-top pt-4">
                        {isPending ? (
                          <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
                            <button
                              disabled={updatingOrderId === orderIdKey}
                              onClick={() => setOpenStatusMenuId(openStatusMenuId === orderIdKey ? null : orderIdKey)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200/80 shadow-sm hover:bg-amber-100 transition active:scale-95 disabled:opacity-50"
                            >
                              {updatingOrderId === orderIdKey ? (
                                <span className="flex items-center gap-1 text-amber-600">
                                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                  </svg>
                                  Đang lưu...
                                </span>
                              ) : (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                                  ⏳ Chờ xác nhận
                                  <svg className="w-3 h-3 text-amber-600 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                  </svg>
                                </>
                              )}
                            </button>

                            {/* DROPDOWN MENU CON */}
                            {openStatusMenuId === orderIdKey && (
                              <div className="absolute right-1/2 translate-x-1/2 top-full mt-1.5 w-44 bg-white border border-slate-100 rounded-2xl shadow-xl z-40 p-1.5 animate-in fade-in zoom-in-95 duration-100">
                                <button
                                  onClick={() => handleUpdateStatus(order, "da_xac_nhan")}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-bold text-emerald-700 hover:bg-emerald-50 rounded-xl transition text-left"
                                >
                                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                  </svg>
                                  Xác nhận đơn
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(order, "cancelled")}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition text-left"
                                >
                                  <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                  Hủy đơn hàng
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-block ${getDeliveryBadgeClass(order.trang_thai_don_hang || order.status)}`}>
                            {renderDeliveryBadgeText(order.trang_thai_don_hang || order.status)}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-slate-400 font-bold whitespace-nowrap text-[11px] align-top pt-5">
                        {formatOrderDate(order.ngay_tao)}
                      </td>

                      <td className="py-4 px-5 align-top pt-4">
                        <div className="flex items-center justify-center gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleViewOrderDetail(order)}
                            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition border border-transparent hover:border-emerald-200"
                            title="Xem chi tiết đơn hàng"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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
            Hiển thị <span className="text-slate-800 font-black">{orders.length > 0 ? (currentPage - 1) * limit + 1 : 0}</span> - <span className="text-slate-800 font-black">{Math.min(currentPage * limit, totalItems)}</span> trong tổng số <span className="text-emerald-700 font-black">{totalItems}</span> đơn hàng
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
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none">▼</span>
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
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
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