import React from 'react';
import { ArrowLeft, User, Phone, MapPin, CreditCard, ShoppingBag, FileText, CheckCircle2, Circle } from 'lucide-react';

const OrderDetail = () => {
  // Data giả lập theo đúng hình ảnh mẫu
  const orderInfo = {
    id: "MV000001",
    products: [
      {
        id: 1,
        name: "Thanh long ruột trắng",
        sku: "TL-W-01",
        price: 35000,
        quantity: 10,
        unit: "kg",
        total: 350000,
        image: "https://images.unsplash.com/photo-1528825871115-3581a5387919?q=80&w=100&auto=format&fit=crop" // Thay bằng ảnh thật
      },
      {
        id: 2,
        name: "Chanh leo xuất khẩu",
        sku: "CL-EX-09",
        price: 120000,
        quantity: 50,
        unit: "kg",
        total: 6000000,
        image: "https://images.unsplash.com/photo-1534531173927-aeb928d54385?q=80&w=100&auto=format&fit=crop" // Thay bằng ảnh thật
      }
    ],
    customer: {
      name: "Nguyễn Minh Anh",
      type: "Khách hàng Thân thiết",
      phone: "090 123 4567",
      address: "123 Đường Lê Lợi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh",
      paymentMethod: "Chuyển khoản ngân hàng",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop"
    },
    timeline: [
      { title: "Đơn hàng được khởi tạo", actor: "Khách hàng (Nguyễn Minh Anh)", time: "24/10/2023 14:30", completed: true },
      { title: "Xác nhận thanh toán", actor: "Hệ thống (Auto-Check)", time: "24/10/2023 14:35", completed: true },
      { title: "Đang đóng gói sản phẩm", actor: "Dự kiến thực hiện bởi: Kho trung chuyển Quận 1", time: "", completed: false, current: true }
    ],
    summary: {
      subtotal: 6350000,
      shipping: 55000,
      vat: 335000,
      total: 6740000,
      note: "Giao hàng trong giờ hành chính, vui lòng gọi trước 15 phút khi đến. Sản phẩm cần được bọc lót kỹ để tránh dập nát."
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val).replace('₫', 'đ');

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800">
      {/* Breadcrumb & Header */}
      <div className="max-w-6xl mx-auto mb-6 flex justify-between items-center">
        <div>
          <div className="text-xs text-gray-400 mb-1">
            Dashboard &gt; Đơn hàng &gt; <span className="text-gray-600">Chi tiết đơn hàng</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Chi tiết đơn hàng</h1>
            <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded font-medium">Mã: {orderInfo.id}</span>
          </div>
        </div>
        <button className="flex items-center gap-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm transition-colors shadow-sm">
          <ArrowLeft size={16} /> Quay về
        </button>
      </div>

      {/* Main Grid Layout */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card: Sản phẩm trong đơn */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex justify-between items-center mb-4 border-b border-gray-50 pb-3">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <span className="text-emerald-600"><ShoppingBag size={20} /></span> Sản phẩm trong đơn
              </h2>
              <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">{orderInfo.products.length} sản phẩm</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs font-semibold text-gray-400 uppercase border-b border-gray-100 bg-gray-50/50">
                    <th className="py-3 px-2 w-2/5">Sản phẩm</th>
                    <th className="py-3 px-2 text-center">SKU</th>
                    <th className="py-3 px-2 text-right">Giá</th>
                    <th className="py-3 px-2 text-center">Số lượng</th>
                    <th className="py-3 px-2 text-right">Tổng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {orderInfo.products.map((prod) => (
                    <tr key={prod.id} className="hover:bg-gray-50/50">
                      <td className="py-4 px-2 flex items-center gap-3">
                        <img src={prod.image} alt={prod.name} className="w-12 h-12 object-cover rounded-lg border border-gray-100" />
                        <span className="font-medium text-gray-800">{prod.name}</span>
                      </td>
                      <td className="py-4 px-2 text-center text-gray-500 font-mono text-xs whitespace-pre-line">{prod.sku}</td>
                      <td className="py-4 px-2 text-right text-gray-600">{formatCurrency(prod.price)}</td>
                      <td className="py-4 px-2 text-center">
                        <div className="inline-block bg-gray-50 border border-gray-200 rounded px-2 py-0.5 text-xs text-gray-700">
                          <div>x{prod.quantity}</div>
                          <div className="text-[10px] text-gray-400 font-medium">{prod.unit}</div>
                        </div>
                      </td>
                      <td className="py-4 px-2 text-right font-semibold text-gray-900">{formatCurrency(prod.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Card: Lịch sử đơn hàng */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-6">
              <span className="text-emerald-600"><FileText size={20} /></span> Lịch sử đơn hàng
            </h2>

            <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
              {orderInfo.timeline.map((step, index) => (
                <div key={index} className="relative flex flex-col items-start">
                  {/* Icon Node trạng thái */}
                  <div className="absolute -left-[21px] top-0.5 bg-white rounded-full">
                    {step.completed ? (
                      <CheckCircle2 size={22} className="text-emerald-600 fill-white" />
                    ) : (
                      <Circle size={22} className="text-gray-300 fill-gray-100" />
                    )}
                  </div>
                  {/* Content */}
                  <div className="ml-2">
                    <h4 className={`text-sm font-semibold ${step.completed ? 'text-gray-800' : step.current ? 'text-gray-500' : 'text-gray-400'}`}>
                      {step.title}
                    </h4>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {step.actor} {step.time && `• ${step.time}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN (1/3 width) */}
        <div className="space-y-6">
          
          {/* Card: Thông tin khách hàng */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-4 border-b border-gray-50 pb-3">
              <span className="text-emerald-600"><User size={20} /></span> Thông tin khách hàng
            </h2>
            
            {/* Profile */}
            <div className="flex items-center gap-3 mb-5">
              <img src={orderInfo.customer.avatar} alt="Avatar" className="w-12 h-12 rounded-full object-cover border border-gray-200" />
              <div>
                <h3 className="font-semibold text-gray-900 leading-tight">{orderInfo.customer.name}</h3>
                <span className="inline-block bg-emerald-50 text-emerald-600 text-[11px] font-medium px-2 py-0.5 rounded-full mt-1">
                  {orderInfo.customer.type}
                </span>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-4 text-xs text-gray-600 border-t border-gray-100 pt-4">
              <div className="flex gap-3 items-start">
                <Phone size={16} className="text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-gray-400 font-medium mb-0.5">Điện thoại</div>
                  <div className="text-gray-800 font-medium">{orderInfo.customer.phone}</div>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-gray-400 font-medium mb-0.5">Địa chỉ giao hàng</div>
                  <div className="text-gray-800 leading-relaxed font-medium">{orderInfo.customer.address}</div>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <CreditCard size={16} className="text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-gray-400 font-medium mb-0.5">Phương thức thanh toán</div>
                  <div className="text-gray-800 font-medium">{orderInfo.customer.paymentMethod}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Tổng kết đơn hàng */}
          <div className="bg-emerald-600 text-white rounded-xl shadow-md p-5 flex flex-col justify-between">
            <div>
              <h2 className="font-semibold flex items-center gap-2 mb-4 border-b border-emerald-500/40 pb-3">
                <FileText size={20} /> Tổng kết đơn hàng
              </h2>

              <div className="space-y-2.5 text-sm border-b border-emerald-500/40 pb-4">
                <div className="flex justify-between text-emerald-100">
                  <span>Tạm tính</span>
                  <span className="font-medium text-white">{formatCurrency(orderInfo.summary.subtotal)}</span>
                </div>
                <div className="flex justify-between text-emerald-100">
                  <span>Phí vận chuyển</span>
                  <span className="font-medium text-white">{formatCurrency(orderInfo.summary.shipping)}</span>
                </div>
                <div className="flex justify-between text-emerald-100">
                  <span>VAT (5%)</span>
                  <span className="font-medium text-white">{formatCurrency(orderInfo.summary.vat)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center py-4">
                <div className="text-xs font-medium uppercase tracking-wider text-emerald-100">Tổng thanh toán</div>
                <div className="text-2xl font-bold tracking-tight">{formatCurrency(orderInfo.summary.total)}</div>
              </div>
            </div>

            {/* Note block */}
            <div className="bg-emerald-700/40 rounded-lg p-3 text-xs border border-emerald-500/20 mt-2">
              <div className="font-bold mb-1 uppercase tracking-wider text-emerald-200">
                📝 Ghi chú từ khách hàng
              </div>
              <p className="italic text-emerald-50/90 leading-relaxed">
                "{orderInfo.summary.note}"
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default OrderDetail;