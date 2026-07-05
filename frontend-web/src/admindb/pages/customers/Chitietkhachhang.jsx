import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
// 🌟 SỬA BƯỚC 1: Import đúng các instance api đã cấu hình để gánh Token tự động và hoán đổi Local / DevOps
import { authApi, cartApi } from "../../../api/axios"; // <--- Điều chỉnh đường dẫn thực tế đến file config Axios của bạn

const Chitietkhachhang = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const userId = location.state?.userId;

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  // State quản lý địa chỉ đang được chọn để hiển thị trên bản đồ (Mặc định chọn item đầu tiên)
  const [selectedAddress, setSelectedAddress] = useState(null);

  // States quản lý Modal xem lịch sử giao dịch
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // States phục vụ Tìm kiếm & Bộ lọc trong các Modal
  const [orderSearch, setOrderSearch] = useState("");
  const [orderFilterStatus, setOrderFilterStatus] = useState("ALL");
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentFilterStatus, setPaymentFilterStatus] = useState("ALL");

  useEffect(() => {
    const fetchCustomerDetailAndCart = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        // 🌟 SỬA BƯỚC 2: Gọi thông tin Profile qua authApi bằng đường dẫn tương đối ngắn sạch
        const userRequest = authApi.get(`/auth/internal/users/${userId}`);
        
        // 🌟 SỬA BƯỚC 3: Gọi thông tin Giỏ hàng nội bộ qua đúng phân hệ cartApi (Cổng 5003 hoặc Render DevOps)
        const cartRequest = cartApi.get(`/cart/internal/${userId}`).catch(err => {
          console.warn("⚠️ Không lấy được giỏ hàng từ API, có thể do User chưa có giỏ hoặc sai Route:", err.message);
          return { data: { items: [] } };
        });

        // Kích hoạt song song đồng thời cả 2 API Microservices
        const [userResponse, cartResponse] = await Promise.all([userRequest, cartRequest]);

        if (userResponse.data) {
          const userData = userResponse.data;
          const cartItems = cartResponse.data?.items || [];

          const mergedData = {
            ...userData,
            code: userData.code || `#CUS-${String(userId).substring(0, 4).toUpperCase()}`, 
            
            total_orders: userData.orders ? `${userData.orders.length} đơn` : "0 đơn",
            total_spending: userData.orders && userData.orders.length > 0
              ? `${(userData.orders.reduce((sum, o) => sum + (parseInt(String(o.amount).replace(/[^0-9]/g, '')) || 0), 0) / 1000000).toFixed(1)}M VND`
              : "0M VND",
            
            note: userData.note || "Khách hàng thân thiết từ năm 2020. Ưa thích các sản phẩm phân hữu cơ vi sinh. Thường xuyên đặt hàng vào cuối tháng. Cần tư vấn thêm về hệ thống tưới tự động cho farm mới tại Ba Việc.", 
            
            addresses: userData.addresses || [
              { name: "Đạt Vũ", phone: "(+84) 789 758 766", tag: "Mặc định", detail: "123 Lê Lợi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh." } 
            ],

            orders: userData.orders || [],
            payments: userData.payments || [],
            cart: cartItems 
          };

          setCustomer(mergedData); 
          if (mergedData.addresses && mergedData.addresses.length > 0) {
            setSelectedAddress(mergedData.addresses[0]); 
          }
        }
      } catch (err) {
        console.error("❌ Lỗi nghiêm trọng khi nạp chi tiết khách hàng và giỏ hàng:", err); 
      } finally {
        setLoading(false); 
      }
    };

    fetchCustomerDetailAndCart();
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
        { name: "Nguyễn Vũ", phone: "(+84) 789 758 766", detail: "456 Cách Mạng Tháng Tám, Quận 3, TP. Hồ Chí Minh." }
      ],
      orders: [
        { id: "#ORD-5521", date: "28/03/24", status: "COMPLETED", amount: "2,450,000 VND" },
        { id: "#ORD-5498", date: "24/03/24", status: "PROCESSING", amount: "1,120,000 VND" }
      ],
      payments: [
        { id: "TX-5521", date: "28/03/24", method: "Thẻ ATM", status: "THÀNH CÔNG", amount: "2,450,000 VND" }
      ],
      cart: [
        { 
          variantId: "v-101", 
          productId: "p-101",
          name: "Bàn làm việc gỗ sồi tự nhiên G3TD", 
          quantity: 1, 
          price: 3500000, 
          image: "https://via.placeholder.com/150",
          ten_don_vi: "Cái",
          thuoc_tinh_hop_nhat: [
            { ten_thuoc_tinh: "Kích thước", gia_tri: "120x60cm" },
            { ten_thuoc_tinh: "Màu sắc", gia_tri: "Vàng Sồi" }
          ]
        }
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

  const totalCartValue = customer.cart?.reduce((sum, item) => {
    const numPrice = parseInt(String(item.price).replace(/[^0-9]/g, '')) || 0;
    return sum + (numPrice * (item.quantity || 1));
  }, 0) || 0;

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
        
        {/* KHỐI TRÁI + KHỐI GIỮA */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Avatar Profile */}
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

        {/* KHỐI BÊN PHẢI */}
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
            <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1">
              {customer.addresses?.map((addr, idx) => {
                const isSelected = selectedAddress?.detail === addr.detail;
                return (
                  <div 
                    key={idx} 
                    onClick={() => setSelectedAddress(addr)} 
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
                    </div>
                    <p className="text-gray-500 mt-2 font-medium leading-relaxed">{addr.detail}</p>
                  </div>
                );
              })}
            </div>

            {/* LIVE GOOGLE MAPS DETECT */}
            {selectedAddress && (
              <div className="pt-2 border-t border-gray-50 space-y-2 animate-fadeIn">
                <div className="w-full h-36 rounded-xl border border-gray-200 overflow-hidden relative shadow-inner bg-[#f2efe9]">
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
              </div>
            )}
          </div>

          {/* GIỎ HÀNG THẬT LẤY TỪ HÀM GETCARTBYUSERID VIA CARTAPI */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center select-none">
              <h3 className="text-xs font-black text-[#006c49] uppercase tracking-wider flex items-center gap-2">
                <span>🛒</span> Giỏ hàng hiện tại
              </h3>
              <span className="bg-[#006c49] text-white text-[10px] font-black px-2 py-0.5 rounded-md">
                {customer.cart?.length || 0} Loại mặt hàng
              </span>
            </div>

            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
              {customer.cart && customer.cart.length > 0 ? (
                customer.cart.map((item, idx) => (
                  <div key={item.variantId || idx} className="p-3 bg-[#fafafa] border border-slate-100 rounded-xl text-xs space-y-2 flex flex-col">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-white border border-slate-200/60 rounded-lg overflow-hidden p-1 shadow-sm shrink-0 flex items-center justify-center">
                        {item.image && item.image.startsWith("http") ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-lg">{item.image || "📦"}</span>
                        )}
                      </div>
                      
                      <div className="min-w-0 flex-1 text-left">
                        <p className="font-black text-slate-800 text-xs tracking-tight line-clamp-2 uppercase italic" title={item.name}>
                          {item.name}
                        </p>
                        <p className="text-[10px] font-bold text-emerald-700 mt-1">
                          {parseInt(String(item.price).replace(/[^0-9]/g, '') || "0").toLocaleString()}đ × <span className="text-slate-900 font-black">{item.quantity || 1}</span>
                          <span className="text-gray-400 font-medium ml-1">({item.ten_don_vi || "Cái"})</span>
                        </p>
                      </div>
                    </div>

                    {item.thuoc_tinh_hop_nhat && item.thuoc_tinh_hop_nhat.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-2 border-t border-slate-200/50">
                        {item.thuoc_tinh_hop_nhat.map((attr, aIdx) => (
                          <span key={aIdx} className="text-[9px] font-bold text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-xs">
                            {attr.ten_thuoc_tinh}: <b className="text-[#006c49] font-black">{attr.gia_tri}</b>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-400 italic text-xs font-medium">
                  Giỏ hàng hiện tại trống
                </div>
              )}
            </div>

            {customer.cart && customer.cart.length > 0 && (
              <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-xs font-bold">
                <span className="text-gray-400 uppercase italic">Tổng tạm tính:</span>
                <span className="text-[#006c49] text-base font-black tracking-tight">{totalCartValue.toLocaleString()}đ</span>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ================= SECTION BẢNG THỐNG KÊ LỊCH SỬ GIAO DỊCH CHÍNH ================= */}
      <div className="mt-6 space-y-6">
        {/* Bảng Đơn Hàng */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 flex justify-between items-center border-b border-gray-50 select-none">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span>🛍️</span> Lịch sử đơn hàng (Mới nhất)
            </h3>
            <button onClick={() => setIsOrderModalOpen(true)} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer">
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
                          order.status === "COMPLETED" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                        }`}>{order.status}</span>
                      </td>
                      <td className="py-3.5 px-6 text-slate-800">{order.amount}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-6 text-center text-gray-400 italic font-medium">Chưa có lịch sử đơn hàng</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Chitietkhachhang;