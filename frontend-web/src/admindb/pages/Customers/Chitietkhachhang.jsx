import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

const Chitietkhachhang = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Lấy userId được truyền ngầm từ danh sách qua state của router
  const userId = location.state?.userId;

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  const userApiUrl = import.meta.env.VITE_API_USER_URL || "http://localhost:5001";

  useEffect(() => {
    const fetchCustomerDetail = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const response = await axios.get(`${userApiUrl}/api/auth/internal/users/${userId}`);
        if (response.data) {
          setCustomer({
            ...response.data,
            // Giữ lại hoặc bổ sung thêm mock data cho các trường giao dịch phức tạp chưa có ở DB
            code: response.data.code || `#CUS-${String(userId).substring(0,4).toUpperCase() || "7829"}`,
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
          });
        }
      } catch (err) {
        console.error("❌ Lỗi nạp chi tiết khách hàng:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerDetail();
  }, [userId]);

  // Fallback data khi test UI trực tiếp trên url mà không truyền state
  const loadFallbackData = () => {
    setCustomer({
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
    });
    setLoading(false);
  };

  useEffect(() => {
    if (!userId && loading) {
      loadFallbackData();
    }
  }, [userId]);

  if (loading) return <div className="p-8 text-center text-emerald-600 font-bold animate-pulse">Đang nạp chi tiết khách hàng...</div>;
  if (!customer) return <div className="p-8 text-center text-gray-400">Không tìm thấy thông tin khách hàng này.</div>;

  return (
    <div className="w-full min-h-screen bg-[#fafafa] font-sans text-slate-800 antialiased p-6 text-left">
      
      {/* Tiêu đề & Nút back */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Chi tiết khách hàng</h1>
          <p className="text-xs text-gray-400 mt-1">Quản lý thông tin và lịch sử giao dịch của khách hàng cá nhân.</p>
        </div>
        <button 
          onClick={() => navigate("/admin/customers/list")} 
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl bg-white text-xs font-bold shadow-sm hover:bg-slate-50 transition"
        >
          <span>←</span> Quay về
        </button>
      </div>

      {/* Grid Bento Box Hệ Thống */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* KHỐI TRÁI + KHỐI GIỮA (2/3 chiều rộng) */}
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
                <p className="text-xs text-gray-400 mt-1 font-mono">MÃ : {customer.code}</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-[#006c49] hover:bg-[#005137] text-white font-bold text-xs rounded-xl shadow-sm transition">
              Chỉnh sửa Profile
            </button>
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
              <span>📄</span> Ghi chú
            </h3>
            <div className="p-4 bg-emerald-50/30 border border-emerald-100/50 rounded-xl text-xs font-medium text-emerald-800 leading-relaxed italic">
              "{customer.note}"
            </div>
          </div>

        </div>

        {/* KHỐI BÊN PHẢI (1/3 chiều rộng) */}
        <div className="space-y-6">
          
          {/* Phân Loại */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-4">Phân loại</h3>
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-gray-400">Trạng thái</span>
              <span className="text-emerald-600 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span> Active
              </span>
            </div>
          </div>

          {/* Danh Sách Địa Chỉ Giao Nhận */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-[#006c49] uppercase tracking-wider flex items-center gap-2">
              <span>📍</span> Thông tin địa chỉ
            </h3>
            
            <div className="space-y-3">
              {customer.addresses?.map((addr, idx) => (
                <div key={idx} className="p-3 border border-gray-100 rounded-xl bg-[#fafafa] relative text-xs">
                  <div className="flex justify-between items-center font-bold text-slate-800">
                    <div className="flex items-center gap-2">
                      <span>{addr.name}</span>
                      <span className="text-gray-400 font-mono font-normal">{addr.phone}</span>
                    </div>
                    {addr.tag && (
                      <span className="bg-[#006c49] text-white text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wide">
                        {addr.tag}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 mt-2 font-medium leading-relaxed">{addr.detail}</p>
                </div>
              ))}
            </div>

            <button className="w-full py-2.5 border border-dashed border-gray-200 hover:border-emerald-500 rounded-xl text-xs font-bold text-gray-400 hover:text-[#006c49] bg-white transition flex items-center justify-center gap-1">
              <span>+</span> Thêm địa chỉ mới
            </button>
          </div>

        </div>

      </div>

      {/* SECTION BẢNG THỐNG KÊ LỊCH SỬ GIAO DỊCH (Chiều rộng đầy đủ phía dưới) */}
      <div className="mt-6 space-y-6">
        
        {/* Bảng đơn đặt hàng */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 flex justify-between items-center border-b border-gray-50">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span>🛍️</span> Lịch sử đơn hàng
            </h3>
            <span className="text-xs font-bold text-blue-500 hover:underline cursor-pointer">Xem tất cả ↗</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/70 text-gray-400 font-bold uppercase border-b border-gray-100">
                  <th className="py-3.5 px-6">Mã đơn</th>
                  <th className="py-3.5 px-6">Ngày đặt</th>
                  <th className="py-3.5 px-6">Trạng thái</th>
                  <th className="py-3.5 px-6">Tổng tiền</th>
                  <th className="py-3.5 px-6 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-bold text-slate-600">
                {customer.orders?.map((order, i) => (
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
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bảng lịch sử thanh toán */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 flex justify-between items-center border-b border-gray-50">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span>💳</span> Lịch sử thanh toán
            </h3>
            <span className="text-xs font-bold text-blue-500 hover:underline cursor-pointer">Xem tất cả ↗</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/70 text-gray-400 font-bold uppercase border-b border-gray-100">
                  <th className="py-3.5 px-6">Mã giao dịch</th>
                  <th className="py-3.5 px-6">Ngày thanh toán</th>
                  <th className="py-3.5 px-6">Phương thức</th>
                  <th className="py-3.5 px-6">Trạng thái</th>
                  <th className="py-3.5 px-6">Số tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-bold text-slate-600">
                {customer.payments?.map((pay, i) => (
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
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Chitietkhachhang;