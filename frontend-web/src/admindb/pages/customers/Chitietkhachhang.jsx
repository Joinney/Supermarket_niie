import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

const Chitietkhachhang = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const userId = location.state?.userId;

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🛠️ State quản lý địa chỉ đang được chọn để hiển thị trên bản đồ (Mặc định chọn item đầu tiên)
  const [selectedAddress, setSelectedAddress] = useState(null);

  // States quản lý Modal xem lịch sử giao dịch
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // States phục vụ Tìm kiếm & Bộ lọc trong các Modal
  const [orderSearch, setOrderSearch] = useState("");
  const [orderFilterStatus, setOrderFilterStatus] = useState("ALL");
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentFilterStatus, setPaymentFilterStatus] = useState("ALL");

  const userApiUrl = import.meta.env.VITE_API_USER_URL || "http://localhost:5001";

useEffect(() => {
    const fetchCustomerDetail = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const response = await axios.get(`${userApiUrl}/api/auth/internal/users/${userId}`); // 
        if (response.data) {
          const dataData = {
            ...response.data,
            code: response.data.code || `#CUS-${String(userId).substring(0,4).toUpperCase() || "7829"}`, // [cite: 132, 133]
            
            // 🌟 Đọc số lượng đơn và chi tiêu động dựa trên mảng dữ liệu thật từ API trả về
            total_orders: response.data.orders ? `${response.data.orders.length} đơn` : "0 đơn",
            total_spending: response.data.orders && response.data.orders.length > 0
              ? `${(response.data.orders.reduce((sum, o) => sum + (parseInt(String(o.amount).replace(/[^0-9]/g, '')) || 0), 0) / 1000000).toFixed(1)}M VND`
              : "0M VND",
            
            note: response.data.note || "Khách hàng thân thiết từ năm 2020. Ưa thích các sản phẩm phân hữu cơ vi sinh. Thường xuyên đặt hàng vào cuối tháng. Cần tư vấn thêm về hệ thống tưới tự động cho farm mới tại Ba Vì.", // [cite: 133, 134]
            
            addresses: response.data.addresses || [
              { name: "Đạt Vũ", phone: "(+84) 789 758 766", tag: "Mặc định", detail: "123 Lê Lợi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh." } // [cite: 134]
            ],

            // 🌟 Hứng dữ liệu thật từ API, nếu không có thì mặc định là mảng rỗng []
            orders: response.data.orders || [],
            payments: response.data.payments || []
          };

          setCustomer(dataData); // [cite: 140]
          if (dataData.addresses && dataData.addresses.length > 0) {
            setSelectedAddress(dataData.addresses[0]); // [cite: 140]
          }
        }
      } catch (err) {
        console.error("❌ Lỗi nạp chi tiết khách hàng:", err); // [cite: 141]
      } finally {
        setLoading(false); // [cite: 142]
      }
    };

    fetchCustomerDetail();
  }, [userId]);

  const loadFallbackData = () => {
    const fallback = {
      user_id: "demo_id",
      full_name: "Nguyễn Văn A",
      code: "#CUS-7829",
      phone_number: "+84 901 234 567",
      email: "nguyenvana.agri@gmail.com",
      birthday: "January 15, 1992",
      status: "active",
      total_orders: "12 đơn",
      total_spending: "15.8M VND",
      note: "Khách hàng thân thiết từ năm 2020. Ưa thích các sản phẩm phân hữu cơ vi sinh. Thường xuyên đặt hàng vào cuối tháng. Cần tư vấn thêm về hệ thống tưới tự động cho farm mới tại Ba Vì.",
      addresses: [
        { name: "Đạt Vũ", phone: "(+84) 789 758 766", tag: "Mặc định", detail: "123 Lê Lợi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh." },
        { name: "Nguyễn Vũ", phone: "(+84) 789 758 766", detail: "456 Cách Mạng Tháng Tám, Quận 3, TP. Hồ Chí Minh." },
        { name: "Mai Vũ", phone: "(+84) 789 758 766", detail: "789 Trần Hưng Đạo, Quận 5, TP. Hồ Chí Minh." }
      ],
      orders: [
        { id: "#ORD-5521", date: "28/03/24", status: "COMPLETED", amount: "2,450,000 VND" },
        { id: "#ORD-5498", date: "24/03/24", status: "PROCESSING", amount: "1,120,000 VND" },
        { id: "#ORD-5321", date: "15/03/24", status: "COMPLETED", amount: "4,500,000 VND" },
        { id: "#ORD-5288", date: "02/03/24", status: "CANCELLED", amount: "850,000 VND" },
        { id: "#ORD-5182", date: "28/02/24", status: "COMPLETED", amount: "3,200,000 VND" }
      ],
      payments: [
        { id: "TX-5521", date: "28/03/24", method: "Thẻ ATM", status: "THÀNH CÔNG", amount: "2,450,000 VND" },
        { id: "TX-5498", date: "24/03/24", method: "Tiền mặt", status: "THANH TOÁN LỖI", amount: "1,120,000 VND" },
        { id: "TX-5321", date: "15/03/24", method: "Ví điện tử", status: "THÀNH CÔNG", amount: "4,500,000 VND" },
        { id: "TX-5288", date: "02/03/24", method: "Tiền mặt", status: "THẤT BẠI", amount: "850,000 VND" },
        { id: "TX-5182", date: "28/02/24", method: "Thẻ ATM", status: "THÀNH CÔNG", amount: "3,200,000 VND" }
      ]
    };
    setCustomer(fallback);
    if (fallback.addresses && fallback.addresses.length > 0) {
      setSelectedAddress(fallback.addresses[0]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!userId && loading) {
      loadFallbackData();
    }
  }, [userId]);

  if (loading) return <div className="p-8 text-center text-emerald-600 font-bold animate-pulse">Đang nạp chi tiết khách hàng...</div>;
  if (!customer) return <div className="p-8 text-center text-gray-400">Không tìm thấy thông tin khách hàng này.</div>;

  const defaultOrders = customer.orders?.slice(0, 3) || [];
  const defaultPayments = customer.payments?.slice(0, 3) || [];

  const filteredModalOrders = (customer.orders || []).filter((order) => {
    const matchesSearch = order.id.toLowerCase().includes(orderSearch.toLowerCase());
    const matchesFilter = orderFilterStatus === "ALL" || order.status === orderFilterStatus;
    return matchesSearch && matchesFilter;
  });

  const filteredModalPayments = (customer.payments || []).filter((pay) => {
    const matchesSearch = pay.id.toLowerCase().includes(paymentSearch.toLowerCase());
    const matchesFilter = paymentFilterStatus === "ALL" || pay.status === paymentFilterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="w-full min-h-screen bg-[#fafafa] font-sans text-slate-800 antialiased p-6 text-left relative">
      
      {/* Tiêu đề & Nút back */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Chi tiết khách hàng</h1>
          <p className="text-xs text-gray-400 mt-1">Xem thông tin hồ sơ và lịch sử giao dịch toàn diện của khách hàng.</p>
        </div>
        <button 
          onClick={() => navigate("/admin/customers/list")} 
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl bg-white text-xs font-bold shadow-sm hover:bg-slate-50 transition cursor-pointer"
        >
          <span>←</span> Quay về
        </button>
      </div>

      {/* Grid Bento Box Hệ Thống */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* KHỐI TRÁI + KHỐI GIỮA (Thông tin Profile) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Avatar Profile (Chỉ hiển thị thông tin, không sửa) */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-emerald-50 text-emerald-700 font-black text-xl border flex items-center justify-center overflow-hidden">
                {customer.avatar_url ? (
                  <img src={customer.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  customer.full_name?.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">{customer.full_name}</h2>
                  <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Active</span>
                </div>
                <p className="text-xs text-gray-400 mt-1 font-mono">MÃ KHÁCH HÀNG: {customer.code}</p>
              </div>
            </div>
          </div>

          {/* Widgets Thống kê Tài chính */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
              <div>
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Tổng số đơn hàng</p>
                <p className="text-2xl font-black text-slate-800 mt-2">{customer.total_orders}</p>
              </div>
              <span className="text-xl bg-slate-50 p-3 rounded-xl">🛍️</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
              <div>
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Tổng chi tiêu</p>
                <p className="text-2xl font-black text-slate-800 mt-2">{customer.total_spending}</p>
              </div>
              <span className="text-xl bg-slate-50 p-3 rounded-xl">💳</span>
            </div>
          </div>

          {/* Form Chi Tiết Thông Tin Cá Nhân */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-xs font-black text-[#006c49] uppercase tracking-wider flex items-center gap-2 mb-5">
              <span>👤</span> Thông tin cá nhân
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-6">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Họ và tên</p>
                <p className="text-sm font-bold text-slate-800 mt-1.5">{customer.full_name}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Số điện thoại</p>
                <p className="text-sm font-bold text-slate-800 mt-1.5 font-mono">{customer.phone_number || "Trống"}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Ngày sinh</p>
                <p className="text-sm font-bold text-slate-800 mt-1.5">{customer.birthday || "Trống"}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Địa chỉ Email</p>
                <p className="text-sm font-bold text-slate-800 mt-1.5 font-mono text-emerald-600">{customer.email}</p>
              </div>
            </div>
          </div>

          {/* Khối Ghi Chú */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-xs font-black text-[#006c49] uppercase tracking-wider flex items-center gap-2 mb-3">
              <span>📄</span> Ghi chú hệ thống
            </h3>
            <div className="p-4 bg-emerald-50/30 border border-emerald-100/50 rounded-xl text-xs font-medium text-emerald-800 leading-relaxed italic">
              "{customer.note}"
            </div>
          </div>
        </div>

        {/* KHỐI BÊN PHẢI (Địa chỉ + Bản đồ tương tác) */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-4">Phân loại tài khoản</h3>
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-gray-400">Trạng thái hệ thống</span>
              <span className="text-emerald-600 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span> Hoạt động
              </span>
            </div>
          </div>

          {/* Danh Sách Địa Chỉ Giao Nhận */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-[#006c49] uppercase tracking-wider flex items-center gap-2 select-none">
              <span>📍</span> Sổ địa chỉ khách hàng <span className="text-[10px] font-normal normal-case text-gray-400">(Nhấn để xem Map)</span>
            </h3>
            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
              {customer.addresses?.map((addr, idx) => {
                const isSelected = selectedAddress?.detail === addr.detail;
                return (
                  <div 
                    key={idx} 
                    onClick={() => setSelectedAddress(addr)} // 👈 Cập nhật map ngay khi nhấn
                    className={`p-3 border rounded-xl relative text-xs cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? "bg-emerald-50/40 border-emerald-500 shadow-sm ring-1 ring-emerald-500/30" 
                        : "bg-[#fafafa] border-gray-100 hover:bg-slate-50 hover:border-gray-200"
                    }`}
                  >
                    <div className="flex justify-between items-center font-bold text-slate-800">
                      <div className="flex items-center gap-2">
                        <span className={isSelected ? "text-emerald-700 font-bold" : ""}>{addr.name}</span>
                        <span className="text-gray-400 font-mono font-normal">{addr.phone}</span>
                      </div>
                      {addr.tag && (
                        <span className="bg-[#006c49] text-white text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wide shrink-0">
                          {addr.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 mt-2 font-medium leading-relaxed">{addr.detail}</p>
                    
                    {/* Icon định vị nhỏ báo hiệu địa chỉ này đang xem trên map */}
                    {isSelected && (
                      <span className="absolute bottom-2 right-2 text-emerald-600 text-sm animate-bounce">📍</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 🗺️ KHU VỰC LIVE GOOGLE MAPS ĐỒNG BỘ CHÍNH XÁC THEO ĐỊA CHỈ ĐƯỢC CHỌN */}
            {selectedAddress && (
              <div className="pt-2 border-t border-gray-50 space-y-2 animate-fadeIn">
                <div className="flex justify-between items-center text-[10px] select-none">
                  <span className="text-gray-400 font-black uppercase tracking-tight">Định vị điểm nhận:</span>
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedAddress.detail)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-600 hover:text-emerald-700 font-black flex items-center gap-0.5 hover:underline cursor-pointer"
                  >
                    Mở bằng Google Maps ↗
                  </a>
                </div>
                
                <div className="w-full h-44 rounded-xl border border-gray-200 overflow-hidden relative shadow-inner bg-[#f2efe9]">
                  <iframe
                    title="Google Maps Admin Viewer"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedAddress.detail)}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
                  ></iframe>
                </div>
                <p className="text-[10px] text-gray-400 text-center font-medium leading-tight">
                  Bản đồ đang hiển thị cho vị trí của: <span className="text-slate-600 font-semibold">{selectedAddress.name}</span>
                </p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ================= SECTION BẢNG THỐNG KÊ LỊCH SỬ GIAO DỊCH CHÍNH (Chỉ hiện tối đa 3 đơn) ================= */}
      <div className="mt-6 space-y-6">
        
        {/* Bảng Đơn Hàng (Main UI) */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 flex justify-between items-center border-b border-gray-50 select-none">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span>🛍️</span> Lịch sử đơn hàng (Mới nhất)
            </h3>
            <button 
              onClick={() => setIsOrderModalOpen(true)} 
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer transition"
            >
              Xem tất cả ({customer.orders?.length || 0}) ↗
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/70 text-gray-400 font-bold uppercase border-b border-gray-100 select-none">
                  <th className="py-3.5 px-6">Mã đơn</th>
                  <th className="py-3.5 px-6">Ngày đặt</th>
                  <th className="py-3.5 px-6">Trạng thái</th>
                  <th className="py-3.5 px-6">Tổng tiền</th>
                  <th className="py-3.5 px-6 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-bold text-slate-600">
                {defaultOrders.length > 0 ? (
                  defaultOrders.map((order, i) => (
                    <tr key={i} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-3.5 px-6 text-slate-900 font-mono">{order.id}</td>
                      <td className="py-3.5 px-6 text-gray-400 font-mono">{order.date}</td>
                      <td className="py-3.5 px-6">
                        <span className={`px-2 py-0.5 rounded font-black text-[10px] ${
                          order.status === "COMPLETED" ? "bg-emerald-50 text-emerald-600" :
                          order.status === "PROCESSING" ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
                        }`}>{order.status}</span>
                      </td>
                      <td className="py-3.5 px-6 text-slate-800">{order.amount}</td>
                      <td className="py-3.5 px-6 text-center text-slate-400 hover:text-slate-600 cursor-pointer">👁️</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-6 text-center text-gray-400 italic font-medium">Chưa có lịch sử đơn hàng</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bảng Thanh Toán (Main UI) */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 flex justify-between items-center border-b border-gray-50 select-none">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span>💳</span> Lịch sử thanh toán (Mới nhất)
            </h3>
            <button 
              onClick={() => setIsPaymentModalOpen(true)} 
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer transition"
            >
              Xem tất cả ({customer.payments?.length || 0}) ↗
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/70 text-gray-400 font-bold uppercase border-b border-gray-100 select-none">
                  <th className="py-3.5 px-6">Mã giao dịch</th>
                  <th className="py-3.5 px-6">Ngày thanh toán</th>
                  <th className="py-3.5 px-6">Phương thức</th>
                  <th className="py-3.5 px-6">Trạng thái</th>
                  <th className="py-3.5 px-6">Số tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-bold text-slate-600">
                {defaultPayments.length > 0 ? (
                  defaultPayments.map((pay, i) => (
                    <tr key={i} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-3.5 px-6 text-slate-800 font-mono">{pay.id}</td>
                      <td className="py-3.5 px-6 text-gray-400 font-mono">{pay.date}</td>
                      <td className="py-3.5 px-6 text-gray-500 font-medium">🏦 {pay.method}</td>
                      <td className="py-3.5 px-6">
                        <span className={`px-2 py-0.5 rounded font-black text-[10px] ${
                          pay.status === "THÀNH CÔNG" ? "bg-emerald-50 text-emerald-600" :
                          pay.status === "THANH TOÁN LỖI" ? "bg-amber-50 text-amber-500" : "bg-rose-50 text-rose-600"
                        }`}>{pay.status}</span>
                      </td>
                      <td className="py-3.5 px-6 text-slate-800">{pay.amount}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-6 text-center text-gray-400 italic font-medium">Chưa có lịch sử thanh toán</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ============================================================================================== */}
      {/* ========================= 1. MODAL XEM TOÀN BỘ LỊCH SỬ ĐƠN HÀNG ========================= */}
      {/* ============================================================================================== */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl border border-gray-100 flex flex-col max-h-[85vh] overflow-hidden">
            
            {/* Header Modal */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">🛍️</span>
                <h3 className="text-base font-bold text-slate-900">Toàn bộ lịch sử đơn hàng</h3>
              </div>
              <button 
                onClick={() => { setIsOrderModalOpen(false); setOrderSearch(""); setOrderFilterStatus("ALL"); }}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-slate-100 text-gray-500 font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Bộ lọc và Tìm kiếm */}
            <div className="p-4 bg-slate-50/50 border-b border-gray-100 flex flex-wrap gap-3 items-center justify-between shrink-0">
              <div className="flex items-center gap-2 w-full sm:w-72 relative">
                <span className="absolute left-3 text-gray-400 text-xs">🔍</span>
                <input 
                  type="text" 
                  placeholder="Tìm kiếm mã đơn hàng..." 
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full bg-white border border-gray-200 text-xs font-semibold rounded-xl pl-8 pr-3 py-2 outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="text-gray-400">Trạng thái:</span>
                <select 
                  value={orderFilterStatus}
                  onChange={(e) => setOrderFilterStatus(e.target.value)}
                  className="bg-white border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 cursor-pointer transition text-slate-700"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
            </div>

            {/* Nội dung Bảng Đầy Đủ */}
            <div className="overflow-y-auto flex-1">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm text-gray-400 font-bold uppercase select-none">
                  <tr>
                    <th className="py-3 px-6">Mã đơn</th>
                    <th className="py-3 px-6">Ngày đặt</th>
                    <th className="py-3 px-6">Trạng thái</th>
                    <th className="py-3 px-6">Tổng tiền</th>
                    <th className="py-3 px-6 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-semibold text-slate-600">
                  {filteredModalOrders.length > 0 ? (
                    filteredModalOrders.map((order, i) => (
                      <tr key={i} className="hover:bg-slate-50/40 transition-colors">
                        <td className="py-3.5 px-6 text-slate-900 font-bold font-mono">{order.id}</td>
                        <td className="py-3.5 px-6 text-gray-400 font-mono">{order.date}</td>
                        <td className="py-3.5 px-6">
                          <span className={`px-2 py-0.5 rounded font-black text-[10px] ${
                            order.status === "COMPLETED" ? "bg-emerald-50 text-emerald-600" :
                            order.status === "PROCESSING" ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
                          }`}>{order.status}</span>
                        </td>
                        <td className="py-3.5 px-6 font-bold text-slate-800">{order.amount}</td>
                        <td className="py-3.5 px-6 text-center text-slate-400 hover:text-slate-600 cursor-pointer">👁️</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-gray-400 italic font-medium">Không tìm thấy đơn hàng phù hợp</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Footer Modal */}
            <div className="p-4 border-t border-gray-100 text-right bg-slate-50/20 shrink-0 text-[11px] font-bold text-gray-400 select-none">
              Hiển thị {filteredModalOrders.length} trên tổng số {customer.orders?.length || 0} kết quả.
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================================== */}
      {/* ========================= 2. MODAL XEM TOÀN BỘ LỊCH SỬ THANH TOÁN ========================= */}
      {/* ============================================================================================== */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl border border-gray-100 flex flex-col max-h-[85vh] overflow-hidden">
            
            {/* Header Modal */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">💳</span>
                <h3 className="text-base font-bold text-slate-900">Toàn bộ lịch sử thanh toán</h3>
              </div>
              <button 
                onClick={() => { setIsPaymentModalOpen(false); setPaymentSearch(""); setPaymentFilterStatus("ALL"); }}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-slate-100 text-gray-500 font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Bộ lọc và Tìm kiếm */}
            <div className="p-4 bg-slate-50/50 border-b border-gray-100 flex flex-wrap gap-3 items-center justify-between shrink-0">
              <div className="flex items-center gap-2 w-full sm:w-72 relative">
                <span className="absolute left-3 text-gray-400 text-xs">🔍</span>
                <input 
                  type="text" 
                  placeholder="Tìm kiếm mã giao dịch..." 
                  value={paymentSearch}
                  onChange={(e) => setPaymentSearch(e.target.value)}
                  className="w-full bg-white border border-gray-200 text-xs font-semibold rounded-xl pl-8 pr-3 py-2 outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="text-gray-400">Trạng thái:</span>
                <select 
                  value={paymentFilterStatus}
                  onChange={(e) => setPaymentFilterStatus(e.target.value)}
                  className="bg-white border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 cursor-pointer transition text-slate-700"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="THÀNH CÔNG">THÀNH CÔNG</option>
                  <option value="THANH TOÁN LỖI">THANH TOÁN LỖI</option>
                  <option value="THẤT BẠI">THẤT BẠI</option>
                </select>
              </div>
            </div>

            {/* Nội dung Bảng Đầy Đủ */}
            <div className="overflow-y-auto flex-1">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm text-gray-400 font-bold uppercase select-none">
                  <tr>
                    <th className="py-3 px-6">Mã giao dịch</th>
                    <th className="py-3 px-6">Ngày thanh toán</th>
                    <th className="py-3 px-6">Phương thức</th>
                    <th className="py-3 px-6">Trạng thái</th>
                    <th className="py-3 px-6">Số tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-semibold text-slate-600">
                  {filteredModalPayments.length > 0 ? (
                    filteredModalPayments.map((pay, i) => (
                      <tr key={i} className="hover:bg-slate-50/40 transition-colors">
                        <td className="py-3.5 px-6 text-slate-900 font-bold font-mono">{pay.id}</td>
                        <td className="py-3.5 px-6 text-gray-400 font-mono">{pay.date}</td>
                        <td className="py-3.5 px-6 text-gray-500 font-medium">🏦 {pay.method}</td>
                        <td className="py-3.5 px-6">
                          <span className={`px-2 py-0.5 rounded font-black text-[10px] ${
                            pay.status === "THÀNH CÔNG" ? "bg-emerald-50 text-emerald-600" :
                            pay.status === "THANH TOÁN LỖI" ? "bg-amber-50 text-amber-500" : "bg-rose-50 text-rose-600"
                          }`}>{pay.status}</span>
                        </td>
                        <td className="py-3.5 px-6 font-bold text-slate-800">{pay.amount}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-gray-400 italic font-medium">Không tìm thấy giao dịch phù hợp</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Footer Modal */}
            <div className="p-4 border-t border-gray-100 text-right bg-slate-50/20 shrink-0 text-[11px] font-bold text-gray-400 select-none">
              Hiển thị {filteredModalPayments.length} trên tổng số {customer.payments?.length || 0} kết quả.
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Chitietkhachhang;