import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, User, Phone, MapPin, CreditCard, ShoppingBag, FileText, CheckCircle2, Circle } from 'lucide-react';

const OrderDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Nhận ID đơn hàng được truyền sang từ trang danh sách
  const orderId = location.state?.orderId;

  const [orderData, setOrderData] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchOrderDetail = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }
      try {
        // 🔥 Gọi API lên cổng 5005 để lấy dữ liệu đã JOIN từ 2 bảng
        const response = await axios.get(`http://localhost:5005/api/orders/${orderId}`);
        if (response.data && response.data.success) {
          const order = response.data.data;
          setOrderData(order);
          setProducts(order.danh_sach_san_pham || []);
        } else {
          setErrorMsg("Không thể tải thông tin đơn hàng từ hệ thống.");
        }
      } catch (err) {
        console.error("Lỗi khi kết nối API:", err);
        setErrorMsg("Lỗi kết nối đến dịch vụ đơn hàng (Cổng 5005).");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetail();
  }, [orderId]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
      .format(val || 0)
      .replace('₫', 'đ');
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "Chưa cập nhật";
    return new Date(dateString).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-sans">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-emerald-700 font-bold animate-pulse text-sm">Đang tải chi tiết đơn hàng từ database...</p>
      </div>
    );
  }

  if (errorMsg || !orderData) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-sans p-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full text-center">
          <div className="text-amber-500 text-4xl mb-3">⚠️</div>
          <h3 className="font-bold text-gray-800 mb-2">Thông báo hệ thống</h3>
          <p className="text-gray-500 text-xs leading-relaxed mb-5">{errorMsg || "Vui lòng chọn đơn hàng từ danh sách để xem."}</p>
          <button 
            onClick={() => navigate("/admin/Donhang")}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition"
          >
            <ArrowLeft size={14} /> Quay về danh sách đơn hàng
          </button>
        </div>
      </div>
    );
  }

  // --- MAPPING CÁC THÔNG TIN KHÁC ---
  const customerName = orderData.user_info?.full_name || "Khách mua hàng";
  const customerPhone = orderData.user_info?.phone_number || "Chưa cập nhật SĐT";
  const customerEmail = orderData.user_info?.email || "Chưa cập nhật Email";
  const customerAddress = orderData.address || "Nhận tại siêu thị Demi Mart"; // Địa chỉ giao hàng giữ nguyên từ bảng orders
  const customerAvatar = orderData.user_info?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop";
  const paymentMethod = orderData.phuong_thuc_thanh_toan || "Thanh toán khi nhận hàng (COD)";

  const rawPaymentStatus = orderData.trang_thai_thanh_toan ? String(orderData.trang_thai_thanh_toan).toUpperCase() : "PENDING";
  const isPaid = rawPaymentStatus === 'COMPLETED' || rawPaymentStatus === 'DA_THANH_TOAN' || rawPaymentStatus === 'SUCCESS';

  const rawDeliveryStatus = orderData.trang_thai_don_hang ? String(orderData.trang_thai_don_hang).toLowerCase() : "pending";
  const isDelivered = rawDeliveryStatus === 'delivered' || rawDeliveryStatus === 'da_giao';

  const timelineSteps = [
    { title: "Đơn hàng được khởi tạo thành công", actor: `Khách hàng`, time: formatDateTime(orderData.ngay_tao), completed: true },
    { title: "Trạng thái thanh toán", actor: `Hình thức: ${paymentMethod}`, time: isPaid ? "Đã thanh toán" : "Chờ xử lý giao dịch", completed: isPaid },
    { title: `Trạng thái vận chuyển: ${orderData.trang_thai_don_hang || "Chờ xử lý"}`, actor: "Cập nhật từ hệ thống", time: "", completed: isDelivered, current: true }
  ];

  const totalAmount = Number(orderData.tong_thanh_toan || 0);
  const shippingFee = Number(orderData.phi_van_chuyen || 0);
  const subtotal = totalAmount - shippingFee; 

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800 text-left">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6 flex justify-between items-center">
        <div>
          <div className="text-xs text-gray-400 mb-1">
            Dashboard &gt; Đơn hàng &gt; <span className="text-gray-600">Chi tiết đơn hàng</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Chi tiết đơn hàng</h1>
            <span className="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-1 rounded font-extrabold">
              Mã: {orderData.ma_don_hang || `DH-${orderData.id}`}
            </span>
          </div>
        </div>
        <button 
          onClick={() => navigate("/admin/Donhang")}
          className="flex items-center gap-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm transition-all shadow-sm font-bold"
        >
          <ArrowLeft size={16} /> Quay về
        </button>
      </div>

      {/* Grid Layout */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex justify-between items-center mb-4 border-b border-gray-50 pb-3">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <span className="text-emerald-600"><ShoppingBag size={20} /></span> Sản phẩm trong đơn
              </h2>
              <span className="bg-gray-100 text-gray-500 text-xs px-2.5 py-0.5 rounded-full font-bold">{products.length} mặt hàng</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs font-bold text-gray-400 uppercase border-b border-gray-100 bg-gray-50/50">
                    <th className="py-3 px-2 w-2/5">Sản phẩm</th>
                    <th className="py-3 px-2 text-center">SKU</th>
                    <th className="py-3 px-2 text-right">Giá</th>
                    <th className="py-3 px-2 text-center">Số lượng</th>
                    <th className="py-3 px-2 text-right">Tổng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm font-semibold">
                  {products.map((prod, index) => {
                    const itemPrice = Number(prod.price || prod.gia_ban || 0);
                    const itemQuantity = Number(prod.quantity || prod.so_luong || 1);
                    return (
                      <tr key={prod.id || index} className="hover:bg-gray-50/50">
                        <td className="py-4 px-2 flex items-center gap-3">
                          <img 
                            src={prod.image_url || "https://images.unsplash.com/photo-1610348725531-843dff563e2c?q=80&w=100&auto=format&fit=crop"} 
                            alt={prod.product_name || prod.ten_san_pham} 
                            className="w-12 h-12 object-cover rounded-lg border border-gray-100" 
                          />
                          <span className="font-bold text-slate-700">{prod.product_name || prod.ten_san_pham}</span>
                        </td>
                        <td className="py-4 px-2 text-center text-gray-500 font-mono text-xs">{prod.sku || "N/A"}</td>
                        <td className="py-4 px-2 text-right text-gray-400">{formatCurrency(itemPrice)}</td>
                        <td className="py-4 px-2 text-center">
                          <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded text-xs font-bold">
                            x{itemQuantity}
                          </span>
                        </td>
                        <td className="py-4 px-2 text-right font-black text-slate-800">
                          {formatCurrency(itemPrice * itemQuantity)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-6">
              <span className="text-emerald-600"><FileText size={20} /></span> Tiến trình xử lý đơn hàng
            </h2>
            <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
              {timelineSteps.map((step, index) => (
                <div key={index} className="relative flex flex-col items-start">
                  <div className="absolute -left-[21px] top-0.5 bg-white rounded-full">
                    {step.completed ? <CheckCircle2 size={22} className="text-emerald-600 fill-white" /> : <Circle size={22} className="text-gray-300 fill-gray-100" />}
                  </div>
                  <div className="ml-2 font-semibold">
                    <h4 className={`text-sm ${step.completed ? 'text-gray-800' : step.current ? 'text-amber-600' : 'text-gray-400'}`}>{step.title}</h4>
                    <p className="text-xs text-gray-400 mt-0.5 font-medium">{step.actor} {step.time && `• ${step.time}`}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-4 border-b border-gray-50 pb-3">
              <span className="text-emerald-600"><User size={20} /></span> Thông tin người mua hàng
            </h2>
            <div className="flex items-center gap-3 mb-5">
              <img src={customerAvatar} alt="Avatar" className="w-12 h-12 rounded-full object-cover border border-gray-200" />
              <div>
                <h3 className="font-black text-slate-800 leading-tight text-sm">{customerName}</h3>
                <span className="inline-block bg-emerald-50 text-emerald-600 text-[10px] font-extrabold px-2 py-0.5 rounded-full mt-1 uppercase">
                  Thành viên hệ thống
                </span>
              </div>
            </div>

            <div className="space-y-4 text-xs text-gray-600 border-t border-gray-100 pt-4 font-semibold">
              <div className="flex gap-3 items-start">
                <Phone size={16} className="text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-gray-400 font-medium mb-0.5">Điện thoại</div>
                  <div className="text-slate-800">{customerPhone}</div>
                </div>
              </div>
              {/* 🚀 HIỂN THỊ THÊM EMAIL */}
  <div className="flex gap-3 items-start">
    <span className="text-gray-400 mt-0.5 shrink-0">✉️</span>
    <div>
      <div className="text-gray-400 font-medium mb-0.5">Email liên hệ</div>
      <div className="text-slate-800">{customerEmail}</div>
    </div>
  </div>

  {/* 🚀 HIỂN THỊ THÊM NGÀY SINH & GIỚI TÍNH NẾU CÓ */}
  {orderData.user_info?.birthday && (
    <div className="flex gap-3 items-start">
      <span className="text-gray-400 mt-0.5 shrink-0">🎂</span>
      <div>
        <div className="text-gray-400 font-medium mb-0.5">Ngày sinh / Giới tính</div>
        <div className="text-slate-800">
          {new Date(orderData.user_info.birthday).toLocaleDateString('vi-VN')} 
          {orderData.user_info.gender && ` (${orderData.user_info.gender})`}
        </div>
      </div>
    </div>
  )}

  
              <div className="flex gap-3 items-start">
                <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-gray-400 font-medium mb-0.5">Địa chỉ giao hàng</div>
                  <div className="text-slate-800 leading-relaxed font-bold">{customerAddress}</div>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <CreditCard size={16} className="text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-gray-400 font-medium mb-0.5">Phương thức thanh toán</div>
                  <div className="text-emerald-700 font-bold">{paymentMethod}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Hóa đơn */}
          <div className="bg-emerald-700 text-white rounded-xl shadow-md p-5 flex flex-col justify-between">
            <div>
              <h2 className="font-bold flex items-center gap-2 mb-4 border-b border-emerald-600 pb-3"><FileText size={20} /> Tổng kết hóa đơn</h2>
              <div className="space-y-2.5 text-xs font-bold border-b border-emerald-600 pb-4">
                <div className="flex justify-between text-emerald-100">
                  <span>Tạm tính mặt hàng</span>
                  <span className="text-white">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-emerald-100">
                  <span>Phí giao hàng</span>
                  <span className="text-white">{formatCurrency(shippingFee)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center py-4">
                <div className="text-[10px] font-black uppercase tracking-wider text-emerald-100">Tổng thanh toán thực tế</div>
                <div className="text-2xl font-black tracking-tight">{formatCurrency(totalAmount)}</div>
              </div>
            </div>

            <div className="bg-emerald-800/60 rounded-lg p-3 text-xs border border-emerald-600/30 mt-2 font-medium">
              <div className="font-black mb-1 uppercase tracking-wider text-emerald-200 text-[10px]">Ghi chú đơn hàng</div>
              <p className="italic text-emerald-50/90 leading-relaxed">
                "{orderData.ghi_chu || "Không có ghi chú nào đi kèm."}"
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default OrderDetail;