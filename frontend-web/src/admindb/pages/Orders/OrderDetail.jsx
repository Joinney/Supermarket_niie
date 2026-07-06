import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { orderApi } from "../../../api/axios";
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  CreditCard,
  ShoppingBag,
  FileText,
  CheckCircle2,
  Circle,
} from "lucide-react";

const OrderDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();

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
        const adminToken = localStorage.getItem("adminToken");

        const response = await orderApi.get(`/orders/${orderId}`, {
          headers: {
            Authorization: adminToken ? `Bearer ${adminToken}` : "",
          },
        });

        if (response.data && response.data.success) {
          const order = response.data.data;
          setOrderData(order);
          setProducts(order.danh_sach_san_pham || []);
        } else {
          setErrorMsg("Không thể tải thông tin đơn hàng từ hệ thống.");
        }
      } catch (err) {
        console.error("Lỗi khi kết nối API:", err);
        if (err.response?.status === 401) {
          setErrorMsg(
            "Phiên làm việc hết hạn hoặc bạn không có quyền xem chi tiết hóa đơn (401 Unauthorized).",
          );
        } else {
          setErrorMsg("Lỗi kết nối đến dịch vụ đơn hàng.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetail();
  }, [orderId]);

  // 🌟 THUẬT TOÁN GOM NHÓM SẢN PHẨM CHUẨN MICROSERVICES
  const groupedProducts = useMemo(() => {
    const groups = {};
    products.forEach((prod) => {
      // Dùng ma_san_pham làm key gốc, nếu không có thì lấy tên sản phẩm
      const key =
        prod.ma_san_pham || prod.product_name || prod.ten_san_pham || "unknown";

      if (!groups[key]) {
        groups[key] = {
          ma_san_pham: prod.ma_san_pham || "",
          product_name:
            prod.product_name || prod.ten_san_pham || "Sản phẩm Demi",
          image_url:
            prod.image_url ||
            prod.image ||
            "https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=100",
          items: [], // Mảng chứa các biến thể (variants) của sản phẩm này
        };
      }

      groups[key].items.push({
        variant_name: prod.variant_name || "Mặc định",
        sku: prod.sku || "Chưa cập nhật",
        price: Number(prod.price || prod.gia_ban || 0),
        quantity: Number(prod.quantity || prod.so_luong || 1),
      });
    });
    return Object.values(groups);
  }, [products]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    })
      .format(val || 0)
      .replace("₫", "đ");
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "Chưa cập nhật";
    return new Date(dateString)
      .toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      .replace(",", " AT");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-sans">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-emerald-700 font-bold animate-pulse text-sm">
          Đang tải chi tiết đơn hàng từ database...
        </p>
      </div>
    );
  }

  if (errorMsg || !orderData) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-sans p-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full text-center">
          <div className="text-amber-500 text-4xl mb-3">⚠️</div>
          <h3 className="font-bold text-gray-800 mb-2">Thông báo hệ thống</h3>
          <p className="text-gray-500 text-xs leading-relaxed mb-5">
            {errorMsg || "Vui lòng chọn đơn hàng từ danh sách để xem."}
          </p>
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

  const customerName = orderData.user_info?.full_name || "Khách mua hàng";
  const customerPhone =
    orderData.user_info?.phone_number || "Chưa cập nhật SĐT";
  const customerEmail = orderData.user_info?.email || "Chưa cập nhật Email";
  const customerAddress = orderData.address || "Nhận tại siêu thị Demi Mart";
  const customerAvatar =
    orderData.user_info?.avatar_url ||
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop";
  const paymentMethod =
    orderData.phuong_thuc_thanh_toan || "Thanh toán khi nhận hàng (COD)";

  const rawPaymentStatus = orderData.trang_thai_thanh_toan
    ? String(orderData.trang_thai_thanh_toan).toUpperCase()
    : "PENDING";
  const isPaid =
    rawPaymentStatus === "COMPLETED" ||
    rawPaymentStatus === "DA_THANH_TOAN" ||
    rawPaymentStatus === "SUCCESS";

  const rawDeliveryStatus = orderData.trang_thai_don_hang
    ? String(orderData.trang_thai_don_hang).toLowerCase()
    : "pending";
  const isDelivered =
    rawDeliveryStatus === "delivered" ||
    rawDeliveryStatus === "da_giao" ||
    rawDeliveryStatus === "đã giao";

  const timelineSteps = [
    {
      title: "Đơn hàng được khởi tạo thành công",
      actor: `Khách hàng`,
      time: formatDateTime(orderData.ngay_tao),
      completed: true,
    },
    {
      title: "Trạng thái thanh toán",
      actor: `Hình thức: ${paymentMethod}`,
      time: isPaid ? "Đã xác nhận thanh toán" : "Chờ xử lý giao dịch",
      completed: isPaid,
    },
    {
      title: `Trạng thái vận chuyển: ${orderData.trang_thai_don_hang || "Chờ xử lý"}`,
      actor: "Cập nhật từ hệ thống",
      time: "",
      completed: isDelivered,
      current: !isDelivered,
    },
  ];

  const totalAmount = Number(orderData.tong_thanh_toan || 0);
  const shippingFee = Number(orderData.phi_van_chuyen || 0);
  const subtotal = totalAmount - shippingFee;

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800 text-left">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6 flex justify-between items-center">
        <div>
          <div className="text-xs text-gray-400 mb-1 font-bold uppercase tracking-wider">
            Dashboard ❯ Đơn hàng ❯{" "}
            <span className="text-emerald-700">Chi tiết đơn hàng</span>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Chi tiết đơn hàng
            </h1>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2.5 py-1 rounded font-black font-mono shadow-sm">
              Mã: {orderData.ma_don_hang || `DH-${orderData.id}`}
            </span>
          </div>
        </div>
        <button
          onClick={() => navigate("/admin/Donhang")}
          className="flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 px-4 py-2 rounded-xl text-xs font-black uppercase transition-all shadow-sm"
        >
          <ArrowLeft size={16} /> Quay về
        </button>
      </div>

      {/* Grid Layout */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
            <div className="flex justify-between items-center mb-4 border-b border-slate-50 pb-4">
              <h2 className="font-black text-slate-800 flex items-center gap-2 text-lg">
                <span className="text-emerald-600">
                  <ShoppingBag size={22} />
                </span>{" "}
                Danh mục sản phẩm
              </h2>
              <span className="bg-slate-50 border border-slate-100 text-slate-500 text-xs px-3 py-1 rounded-full font-bold">
                {products.length} mặt hàng
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
                    <th className="py-3.5 px-4 w-2/5">Sản phẩm / Phân loại</th>
                    <th className="py-3.5 px-4 text-center">Mã SKU</th>
                    <th className="py-3.5 px-4 text-right">Đơn giá</th>
                    <th className="py-3.5 px-4 text-center">Số lượng</th>
                    <th className="py-3.5 px-4 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm font-semibold">
                  {/* 🌟 VÒNG LẶP RENDER DỮ LIỆU ĐÃ ĐƯỢC GOM NHÓM */}
                  {groupedProducts.map((group, gIdx) => (
                    <React.Fragment key={gIdx}>
                      {/* Dòng Header Sản phẩm chính */}
                      <tr className="bg-slate-50/30">
                        <td colSpan="5" className="py-3.5 px-4">
                          <div className="flex items-center gap-4">
                            <img
                              src={group.image_url}
                              alt="prod"
                              className="w-12 h-12 object-cover rounded-xl border border-slate-200 bg-white shrink-0"
                            />
                            <div>
                              <p className="font-bold text-slate-800 text-sm">
                                {group.product_name}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5 font-bold uppercase">
                                Mã SP: {group.ma_san_pham || "Chưa đồng bộ"}
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                      {/* Dòng Chi tiết từng Biến thể (SKU) */}
                      {group.items.map((item, iIdx) => (
                        <tr
                          key={iIdx}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="py-3.5 px-4 pl-20">
                            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2.5 py-1 rounded border border-emerald-100/60 shadow-sm uppercase tracking-wide">
                              PL: {item.variant_name}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center text-slate-400 font-mono text-[11px] font-bold">
                            {item.sku}
                          </td>
                          <td className="py-3.5 px-4 text-right text-slate-500 text-xs font-mono">
                            {formatCurrency(item.price)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="font-black text-slate-700 bg-slate-100 px-2 py-1 rounded-md text-xs font-mono">
                              x{item.quantity}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-black text-emerald-700 text-[13px] font-mono">
                            {formatCurrency(item.price * item.quantity)}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
            <h2 className="font-black text-slate-800 flex items-center gap-2 mb-6 text-lg">
              <span className="text-emerald-600">
                <FileText size={22} />
              </span>{" "}
              Tiến trình xử lý đơn hàng
            </h2>
            <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
              {timelineSteps.map((step, index) => (
                <div key={index} className="relative flex flex-col items-start">
                  <div className="absolute -left-[21px] top-0.5 bg-white rounded-full">
                    {step.completed ? (
                      <CheckCircle2
                        size={22}
                        className="text-emerald-600 fill-white"
                      />
                    ) : (
                      <Circle
                        size={22}
                        className="text-slate-200 fill-slate-50"
                      />
                    )}
                  </div>
                  <div className="ml-2 font-semibold">
                    <h4
                      className={`text-sm ${step.completed ? "text-slate-800 font-bold" : step.current ? "text-amber-600 font-bold" : "text-slate-400"}`}
                    >
                      {step.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1 font-bold">
                      {step.actor}{" "}
                      {step.time && (
                        <span className="font-mono bg-slate-50 px-1.5 py-0.5 rounded text-slate-500 ml-1">
                          • {step.time}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
            <h2 className="font-black text-slate-800 flex items-center gap-2 mb-4 border-b border-slate-50 pb-4 text-lg">
              <span className="text-emerald-600">
                <User size={22} />
              </span>{" "}
              Thông tin Khách hàng
            </h2>
            <div className="flex items-center gap-4 mb-6">
              <img
                src={customerAvatar}
                alt="Avatar"
                className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-100 shadow-sm"
              />
              <div>
                <h3 className="font-black text-slate-900 leading-tight text-base">
                  {customerName}
                </h3>
                <span className="inline-block bg-emerald-50 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded-full mt-1.5 uppercase tracking-wider border border-emerald-100 shadow-sm">
                  Thành viên Demi
                </span>
              </div>
            </div>

            <div className="space-y-5 text-xs text-slate-600 border-t border-slate-50 pt-5 font-semibold">
              <div className="flex gap-3 items-start">
                <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 text-slate-400">
                  <Phone size={14} />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-black text-slate-400 mb-0.5 tracking-wider">
                    Điện thoại
                  </div>
                  <div className="text-slate-800 font-mono text-sm font-bold">
                    {customerPhone}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 text-slate-400">
                  ✉️
                </div>
                <div>
                  <div className="text-[10px] uppercase font-black text-slate-400 mb-0.5 tracking-wider">
                    Email liên hệ
                  </div>
                  <div className="text-slate-800 break-all">
                    {customerEmail}
                  </div>
                </div>
              </div>

              {orderData.user_info?.birthday && (
                <div className="flex gap-3 items-start">
                  <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 text-slate-400">
                    🎂
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-black text-slate-400 mb-0.5 tracking-wider">
                      Ngày sinh / Giới tính
                    </div>
                    <div className="text-slate-800 font-mono">
                      {new Date(
                        orderData.user_info.birthday,
                      ).toLocaleDateString("vi-VN")}
                      {orderData.user_info.gender && (
                        <span className="font-sans ml-1 text-emerald-600">
                          ({orderData.user_info.gender})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 items-start">
                <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 text-slate-400">
                  <MapPin size={14} />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-black text-slate-400 mb-0.5 tracking-wider">
                    Địa chỉ giao hàng
                  </div>
                  <div className="text-slate-800 leading-relaxed font-bold">
                    {customerAddress}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 text-slate-400">
                  <CreditCard size={14} />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-black text-slate-400 mb-0.5 tracking-wider">
                    Thanh toán
                  </div>
                  <div className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 text-xs inline-block mt-0.5">
                    {paymentMethod}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Hóa đơn */}
          <div className="bg-gradient-to-br from-emerald-800 to-[#006c49] text-white rounded-3xl shadow-lg p-6 flex flex-col justify-between relative overflow-hidden">
            {/* Decal Background */}
            <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12">
              <FileText size={100} />
            </div>

            <div className="relative z-10">
              <h2 className="font-black flex items-center gap-2 mb-5 border-b border-emerald-600/50 pb-4 text-lg">
                <FileText size={22} /> Tổng kết hóa đơn
              </h2>
              <div className="space-y-3.5 text-xs font-bold border-b border-emerald-600/50 pb-5">
                <div className="flex justify-between text-emerald-100/90 items-center">
                  <span>Tạm tính mặt hàng</span>
                  <span className="text-white font-mono text-sm">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-100/90 items-center">
                  <span>Phí giao hàng</span>
                  <span className="text-white font-mono text-sm">
                    {formatCurrency(shippingFee)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-end py-5">
                <div className="text-[10px] font-black uppercase tracking-wider text-emerald-200 leading-tight">
                  Tổng thanh toán
                  <br />
                  Thực tế
                </div>
                <div className="text-2xl font-black tracking-tight font-mono">
                  {formatCurrency(totalAmount)}
                </div>
              </div>
            </div>

            <div className="relative z-10 bg-emerald-900/40 rounded-xl p-4 text-xs border border-emerald-500/30 mt-2 font-medium backdrop-blur-sm">
              <div className="font-black mb-1.5 uppercase tracking-wider text-emerald-300 text-[10px]">
                Ghi chú đơn hàng
              </div>
              <p className="italic text-emerald-50 leading-relaxed">
                "
                {orderData.ghi_chu ||
                  "Không có ghi chú nào đi kèm từ khách hàng."}
                "
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
