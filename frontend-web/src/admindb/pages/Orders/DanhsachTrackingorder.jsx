import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function DanhsachTrackingorder() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- STATE BỘ LỌC & TÌM KIẾM ---
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCarrier, setFilterCarrier] = useState("");
  const [showFilter, setShowFilter] = useState(false);

  // --- STATE PHÂN TRANG & STATS ---
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(5);
  const [limit, setLimit] = useState(10);
  const [selectedOrders, setSelectedOrders] = useState([]);

  // 🎯 MẢNG DỮ LIỆU MOCK TĨNH CỐ ĐỊNH - KHỚP HOÀN TOÀN VỚI HÌNH ẢNH MẪU
  const mockTrackingOrders = [
    {
      id: "S2D-88291022",
      ma_van_don: "FLE-88291",
      ten_khach_hang: "Công ty May Mặc ABC",
      dia_chi_tinh: "Hà Nội, Việt Nam",
      nha_van_chuyen: "DHL",
      dich_vu_giao: "DHL Express",
      tram_hien_tai: "Kho HN01 - Bắc Từ Liêm",
      trang_thai_don_hang: "đang giao",
      ngay_du_kien: "24/10/2023"
    },
    {
      id: "S2D-88291023",
      ma_van_don: "FLE-88292",
      ten_khach_hang: "Nguyễn Văn An",
      dia_chi_tinh: "TP. Hồ Chí Minh",
      nha_van_chuyen: "FX",
      dich_vu_giao: "FedEx",
      tram_hien_tai: "Kho SG05 - Quận 7",
      trang_thai_don_hang: "đã giao",
      ngay_du_kien: "22/10/2023"
    },
    {
      id: "S2D-88291024",
      ma_van_don: "FLE-88293",
      ten_khach_hang: "Tập đoàn TechFlow",
      dia_chi_tinh: "Đà Nẵng, Việt Nam",
      nha_van_chuyen: "VP",
      dich_vu_giao: "Viettel Post",
      tram_hien_tai: "Trung tâm trung chuyển Miền Trung",
      trang_thai_don_hang: "chậm trễ",
      ngay_du_kien: "20/10/2023"
    },
    {
      id: "S2D-88291025",
      ma_van_don: "FLE-88294",
      ten_khach_hang: "Cửa hàng Gia dụng Xanh",
      dia_chi_tinh: "Cần Thơ, Việt Nam",
      nha_van_chuyen: "GHN",
      dich_vu_giao: "Giao Hàng Nhanh",
      tram_hien_tai: "Đang chờ lấy hàng",
      trang_thai_don_hang: "pending",
      ngay_du_kien: "28/10/2023"
    },
    {
      id: "S2D-88291026",
      ma_van_don: "FLE-88295",
      ten_khach_hang: "Logistics Miền Nam",
      dia_chi_tinh: "Đồng Nai, Việt Nam",
      nha_van_chuyen: "DHL",
      dich_vu_giao: "DHL Express",
      tram_hien_tai: "Kho SG01 - Quận 9",
      trang_thai_don_hang: "đang giao",
      ngay_du_kien: "25/10/2023"
    }
  ];

  // Khởi tạo state orders nhận thẳng dữ liệu mock tĩnh
  const [orders, setOrders] = useState(mockTrackingOrders);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = orders.map((o) => o.id || o.ma_van_don);
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
    setFilterCarrier("");
    setCurrentPage(1);
    setSelectedOrders([]);
  };

  // 🌟 ĐIỀU HƯỚNG TĨNH: Trỏ trực tiếp đến cấu hình Route động đã sửa ở App.jsx
  const handleViewOrderDetail = (order) => {
    const orderIdKey = order.id || "S2D-88291022";
    navigate(`/admin/Donhang/Chitiettracking/${orderIdKey}`, {
      state: {
        orderId: orderIdKey,
        maDonHang: order.ma_van_don,
        fullOrderData: null // Để trang chi nhánh tự bung dữ liệu mock tĩnh ra
      },
    });
  };

  const getTrackingBadgeClass = (status) => {
    const s = String(status || "").toLowerCase();
    if (["shipped", "dang_giao", "đang giao"].includes(s))
      return "bg-[#fff7ed] text-[#ea580c] border border-[#ffedd5]";
    if (["delivered", "da_giao", "đã giao"].includes(s))
      return "bg-[#f0fdf4] text-[#16a34a] border border-[#dcfce7]";
    if (["delayed", "cham_tre", "chậm trễ", "chậm trả"].includes(s))
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
            <Link to="/admin/dashboard" className="hover:text-[#006c49] transition-colors">
              Dashboard
            </Link>
            <span>❯</span>{" "}
            <span className="text-[#006c49]">Danh sách tracking đơn hàng</span>
          </div>
        </div>
      </div>

      {/* TOP COUNTER CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Tất cả</div>
          <div className="text-2xl font-black text-[#006c49] mt-1">1284</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Đang giao</div>
          <div className="text-2xl font-black text-amber-600 mt-1">412</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Đã giao</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">815</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Chậm trễ</div>
          <div className="text-2xl font-black text-rose-600 mt-1">12</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Chờ xử lý</div>
          <div className="text-2xl font-black text-blue-600 mt-1">45</div>
        </div>
      </div>

      {/* BÀN ĐIỀU KHIỂN CHỌN HÀNG LOẠT */}
      {selectedOrders.length > 0 && (
        <div className="bg-[#f0fdf4] border border-[#dcfce7] rounded-2xl p-3 mb-4 flex justify-between items-center shadow-sm">
          <span className="text-sm font-bold text-[#006c49]">
            Đã chọn {selectedOrders.length} vận đơn
          </span>
          <div className="flex gap-2">
            <button className="px-4 py-1.5 bg-[#006c49] hover:bg-[#005338] text-white rounded-lg text-xs font-bold transition">
              Xuất file dữ liệu
            </button>
            <button
              onClick={() => setSelectedOrders([])}
              className="px-4 py-1.5 bg-white border border-[#006c49] text-[#006c49] hover:bg-[#f0fdf4] rounded-lg text-xs font-bold transition"
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
              placeholder="Nhập mã vận đơn để định vị hành trình..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-4 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-[#006c49] transition-all placeholder-slate-400 text-slate-700"
            />
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-[#006c49]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end md:self-auto">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-black uppercase tracking-wider text-slate-600 transition"
            >
              Làm mới
            </button>

            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setShowFilter(!showFilter)}
                className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-black uppercase tracking-wider text-slate-600 transition relative"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                </svg>
                Áp dụng bộ lọc
                {selectedOrders.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600"></span>
                  </span>
                )}
              </button>

              {showFilter && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-100 rounded-2xl shadow-xl z-20 p-5 origin-top-right">
                  <h3 className="text-sm font-black text-slate-800 mb-4 border-b border-slate-50 pb-2">Lọc thông tin vận trình</h3>
                  <div className="mb-4">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Trạng thái tracking</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => { setFilterStatus(e.target.value); }}
                      className="w-full text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-[#006c49] transition"
                    >
                      <option value="">Tất cả trạng thái</option>
                      <option value="pending">Chờ xử lý</option>
                      <option value="shipped">Đang giao hàng</option>
                      <option value="delivered">Đã giao thành công</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setFilterStatus(""); setFilterCarrier(""); setShowFilter(false); }}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold py-2.5 rounded-xl transition"
                    >
                      Xóa bộ lọc
                    </button>
                    <button onClick={() => setShowFilter(false)} className="flex-1 bg-[#006c49] hover:bg-[#005338] text-white text-xs font-bold py-2.5 rounded-xl transition shadow-sm">
                      Áp dụng
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CẤU TRÚC BẢNG LƯỚI TRACKING */}
        <div className="w-full overflow-x-auto min-h-[400px]">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400 select-none">
                <th className="py-4 px-5 w-4">
                  <input
                    type="checkbox"
                    checked={orders.length > 0 && selectedOrders.length === orders.length}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 checked:bg-[#006c49] accent-[#006c49] cursor-pointer w-4 h-4"
                  />
                </th>
                <th className="py-4 px-4 whitespace-nowrap">Mã vận đơn</th>
                <th className="py-4 px-4 min-w-[200px]">Khách hàng / Đối tác</th>
                <th className="py-4 px-4 whitespace-nowrap">Nhà vận chuyển</th>
                <th className="py-4 px-4 min-w-[220px]">Trạm hiện tại / Kho trung chuyển</th>
                <th className="py-4 px-4 whitespace-nowrap text-center">Trạng thái</th>
                <th className="py-4 px-4 whitespace-nowrap">Ngày dự kiến</th>
                <th className="py-4 px-5 text-center whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-700">
              {orders.map((order, idx) => {
                const orderIdKey = order.id || order.ma_van_don;
                const isSelected = selectedOrders.includes(orderIdKey);

                return (
                  <tr key={orderIdKey || idx} className={`transition-colors group ${isSelected ? "bg-emerald-50/20" : "hover:bg-slate-50/50"}`}>
                    <td className="py-4 px-5 align-middle">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectOrder(orderIdKey)}
                        className="rounded border-slate-300 accent-[#006c49] cursor-pointer w-4 h-4"
                      />
                    </td>

                    <td className="py-4 px-4 font-black text-slate-800 whitespace-nowrap font-mono align-middle" onDoubleClick={() => handleViewOrderDetail(order)}>
                      #{order.ma_van_don}
                    </td>

                    <td className="py-4 px-4 align-middle" onDoubleClick={() => handleViewOrderDetail(order)}>
                      <div className="font-bold text-slate-900">{order.ten_khach_hang}</div>
                      <div className="text-[10px] text-slate-400 font-medium">{order.dia_chi_tinh}</div>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap align-middle">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                          {order.nha_van_chuyen}
                        </span>
                        <span className="text-[11px] font-bold text-slate-600">{order.dich_vu_giao}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 align-middle">
                      <div className="text-[11px] font-bold text-slate-700">
                        {order.tram_hien_tai}
                      </div>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap text-center align-middle">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${getTrackingBadgeClass(order.trang_thai_don_hang)}`}>
                        {order.trang_thai_don_hang}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-slate-500 font-bold whitespace-nowrap text-[11px] align-middle">
                      {order.ngay_du_kien}
                    </td>

                    <td className="py-4 px-5 align-middle text-center">
                      <button
                        onClick={() => handleViewOrderDetail(order)}
                        className="text-[#006c49] hover:text-[#005338] font-black text-xs hover:underline transition-all"
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* THANH PHÂN TRANG */}
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-slate-100 text-xs font-bold text-slate-400">
          <div>
            Hiển thị <span className="text-slate-800 font-black">1</span> -{" "}
            <span className="text-slate-800 font-black">5</span> trong tổng số{" "}
            <span className="text-[#006c49] font-black">5</span> vận đơn
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold">Mỗi trang:</span>
              <div className="relative">
                <select
                  value={limit}
                  onChange={(e) => { setLimit(Number(e.target.value)); }}
                  className="appearance-none bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 font-black text-slate-700 outline-none cursor-pointer focus:bg-white focus:border-[#006c49] transition"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none">▼</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button disabled className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg text-slate-300 cursor-not-allowed">❮</button>
              <div className="px-2 font-black text-slate-700">Trang 1 / 1</div>
              <button disabled className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg text-slate-300 cursor-not-allowed">❯</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}