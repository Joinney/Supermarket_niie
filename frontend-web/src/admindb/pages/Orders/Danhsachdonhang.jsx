import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function Danhsachdonhang() {
  // Dữ liệu mẫu khởi tạo chuẩn theo UI ảnh mockup image_64b341.png của bạn
  const [orders] = useState([
    { id: "ORD-2023-1042", paymentStatus: "Paypal", deliveryStatus: "Shipped", status: "Active", total: "120,330VND", date: "28/03/26 AT 8:25 PM", customer: "NGUYỄN VĂN A", itemsCount: 13, address: "123 NGUYỄN HUỆ..." },
    { id: "ORD-2023-1042", paymentStatus: "Paypal", deliveryStatus: "Processing", status: "Active", total: "120,330VND", date: "28/03/26 AT 8:25 PM", customer: "NGUYỄN VĂN A", itemsCount: 13, address: "123 NGUYỄN HUỆ..." },
    { id: "ORD-2023-1042", paymentStatus: "Paypal", deliveryStatus: "Shipped", status: "Active", total: "120,330VND", date: "28/03/26 AT 8:25 PM", customer: "NGUYỄN VĂN A", itemsCount: 13, address: "123 NGUYỄN HUỆ..." },
    { id: "ORD-2023-1042", paymentStatus: "Paypal", deliveryStatus: "Processing", status: "Active", total: "120,330VND", date: "28/03/26 AT 8:25 PM", customer: "NGUYỄN VĂN A", itemsCount: 13, address: "123 NGUYỄN HUỆ..." },
    { id: "ORD-2023-1042", paymentStatus: "Paypal", deliveryStatus: "Shipped", status: "Active", total: "120,330VND", date: "28/03/26 AT 8:25 PM", customer: "NGUYỄN VĂN A", itemsCount: 13, address: "123 NGUYỄN HUỆ..." },
    { id: "ORD-2023-1042", paymentStatus: "Paypal", deliveryStatus: "Cancelled", status: "Inactive", total: "120,330VND", date: "28/03/26 AT 8:25 PM", customer: "NGUYỄN VĂN A", itemsCount: 13, address: "123 NGUYỄN HUỆ..." },
    { id: "ORD-2023-1042", paymentStatus: "Paypal", deliveryStatus: "Shipped", status: "Active", total: "120,330VND", date: "28/03/26 AT 8:25 PM", customer: "NGUYỄN VĂN A", itemsCount: 13, address: "123 NGUYỄN HUỆ..." },
  ]);

  // Hàm helper sinh màu cho trạng thái giao hàng
  const getDeliveryBadgeClass = (status) => {
    switch (status) {
      case "Shipped":
        return "bg-emerald-100 text-emerald-600";
      case "Processing":
        return "bg-amber-100 text-amber-600";
      case "Cancelled":
        return "bg-red-100 text-red-500";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  // Hàm helper sinh màu cho tình trạng (Active/Inactive)
  const getStatusBadgeClass = (status) => {
    return status === "Active" 
      ? "bg-emerald-100 text-emerald-600" 
      : "bg-red-100 text-red-500";
  };

  return (
    <div className="w-full bg-[#fafafa] font-sans antialiased text-slate-800 text-left">
      {/* HEADER AREA KÈM BREADCRUMB KẾT NỐI DASHBOARD */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">Danh sách đơn hàng</h1>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 mt-1">
            {/* Click vào chữ Dashboard sẽ điều hướng mượt mà quay lại trang Thống kê chính */}
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
        
        {/* TOOLBAR (SEARCH & CONTROLS) */}
        <div className="p-4 sm:p-5 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center border-b border-gray-50">
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search for id, name product"
              className="w-full pl-10 pr-4 py-2.5 bg-[#f8f9fa] border border-transparent rounded-xl text-sm outline-none focus:bg-white focus:border-gray-200 focus:ring-4 focus:ring-emerald-500/5 transition-all font-medium placeholder-gray-400"
            />
          </div>

          <div className="flex items-center gap-2.5 self-end md:self-auto">
            <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-600 transition">
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

        {/* TABLE RESPONSIVE WRAPPER */}
        <div className="w-full overflow-x-auto min-h-0">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#fcfdfd] border-b border-gray-100 text-[10px] font-extrabold uppercase tracking-wider text-gray-500 select-none">
                <th className="py-4 px-5 w-4">
                  <input type="checkbox" className="rounded border-gray-300 accent-emerald-600 cursor-pointer" />
                </th>
                <th className="py-4 px-4 whitespace-nowrap cursor-pointer hover:bg-gray-50/50">Mã đơn <span className="text-[9px] text-gray-400 ml-0.5">↕</span></th>
                <th className="py-4 px-4 whitespace-nowrap cursor-pointer hover:bg-gray-50/50">Trạng thái thanh toán <span className="text-[9px] text-gray-400 ml-0.5">↕</span></th>
                <th className="py-4 px-4 whitespace-nowrap cursor-pointer hover:bg-gray-50/50">Trạng thái giao hàng <span className="text-[9px] text-gray-400 ml-0.5">↕</span></th>
                <th className="py-4 px-4 whitespace-nowrap cursor-pointer hover:bg-gray-50/50">Tình trạng <span className="text-[9px] text-gray-400 ml-0.5">↕</span></th>
                <th className="py-4 px-4 whitespace-nowrap cursor-pointer hover:bg-gray-50/50">Tổng tiền <span className="text-[9px] text-gray-400 ml-0.5">↕</span></th>
                <th className="py-4 px-4 whitespace-nowrap cursor-pointer hover:bg-gray-50/50">Ngày tạo <span className="text-[9px] text-gray-400 ml-0.5">↕</span></th>
                <th className="py-4 px-4 whitespace-nowrap cursor-pointer hover:bg-gray-50/50">Khách hàng <span className="text-[9px] text-gray-400 ml-0.5">↕</span></th>
                <th className="py-4 px-4 whitespace-nowrap text-center cursor-pointer hover:bg-gray-50/50">SP/Đơn <span className="text-[9px] text-gray-400 ml-0.5">↕</span></th>
                <th className="py-4 px-4 whitespace-nowrap cursor-pointer hover:bg-gray-50/50">Địa chỉ giao <span className="text-[9px] text-gray-400 ml-0.5">↕</span></th>
                <th className="py-4 px-5 text-center whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs font-semibold text-slate-600">
              {orders.map((order, idx) => (
                <tr key={idx} className="hover:bg-gray-50/30 transition-colors">
                  <td className="py-4 px-5">
                    <input type="checkbox" className="rounded border-gray-300 accent-emerald-600 cursor-pointer" />
                  </td>
                  <td className="py-4 px-4 font-bold text-slate-700 whitespace-nowrap">{order.id}</td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-md text-[11px] font-bold">
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${getDeliveryBadgeClass(order.deliveryStatus)}`}>
                      {order.deliveryStatus}
                    </span>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${getStatusBadgeClass(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-bold text-slate-800 whitespace-nowrap">{order.total}</td>
                  <td className="py-4 px-4 text-gray-400 font-medium whitespace-nowrap">{order.date}</td>
                  <td className="py-4 px-4 text-slate-700 font-bold whitespace-nowrap">{order.customer}</td>
                  <td className="py-4 px-4 text-center text-slate-700 font-bold">{order.itemsCount}</td>
                  <td className="py-4 px-4 text-gray-400 font-medium whitespace-nowrap max-w-[150px] truncate" title={order.address}>
                    {order.address}
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex items-center justify-center gap-2.5">
                      <button className="text-gray-300 hover:text-emerald-600 transition" title="Xem chi tiết">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                      <button className="text-gray-300 hover:text-amber-500 transition" title="Sửa">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                        </svg>
                      </button>
                      <button className="text-gray-300 hover:text-red-500 transition" title="Xóa">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
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
            <span className="text-slate-800">1</span> - 10 of 13 Pages
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="font-medium">The page on</span>
              <div className="relative">
                <select className="appearance-none bg-[#f8f9fa] border border-gray-100 rounded-xl pl-3 pr-8 py-1.5 font-bold text-slate-700 outline-none cursor-pointer focus:bg-white focus:border-gray-200 transition">
                  <option>1</option>
                  <option>2</option>
                  <option>3</option>
                </select>
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none">▼</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button className="w-8 h-8 flex items-center justify-center border border-gray-100 rounded-xl hover:bg-gray-50 text-gray-400 active:scale-95 transition">❮</button>
              <button className="w-8 h-8 flex items-center justify-center border border-gray-100 rounded-xl hover:bg-gray-50 text-gray-400 active:scale-95 transition">❯</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}