import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { authApi, cartApi, orderApi, addressApi } from "../../../api/axios";

const Chitietkhachhang = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const userId = id;

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  // State quản lý địa chỉ đang được chọn để hiển thị trên Bản đồ Google Maps
  const [selectedAddress, setSelectedAddress] = useState(null);

  // States quản lý Modal & Tìm kiếm / Bộ lọc đơn hàng
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderFilterStatus, setOrderFilterStatus] = useState("ALL");

  // 🌟 HÀM CHUẨN HÓA DỮ LIỆU SỔ ĐỊA CHỈ (Đảm bảo tương thích mọi kiểu Key từ Database)
  const formatAddresses = (rawList, userData) => {
    if (!Array.isArray(rawList) || rawList.length === 0) return [];

    return rawList.map((addr, idx) => {
      if (typeof addr === "string") {
        return {
          name: userData?.full_name || `Địa chỉ ${idx + 1}`,
          phone: userData?.phone_number || "",
          detail: addr,
          tag: idx === 0 ? "Mặc định" : "",
        };
      }

      const name =
        addr.receiver_name ||
        addr.name ||
        addr.ho_ten ||
        userData?.full_name ||
        "Khách hàng";

      const phone =
        addr.receiver_phone ||
        addr.phone ||
        addr.so_dien_thoai ||
        userData?.phone_number ||
        "";

      // Tự động ghép nối địa chỉ chi tiết từ các trường nhỏ nếu không có chuỗi đầy đủ
      const detail =
        addr.detail_address ||
        addr.detail ||
        addr.dia_chi_chi_tiet ||
        [
          addr.detail_address,
          addr.ward_name || addr.phuong_xa,
          addr.district_name || addr.quan_huyen,
          addr.province_name || addr.tinh_thanh,
        ]
          .filter(Boolean)
          .join(", ") ||
        "Chưa có địa chỉ chi tiết";

      const tag =
        addr.is_default || addr.mac_dinh || idx === 0 ? "Mặc định" : "";

      return { name, phone, detail, tag };
    });
  };

  // Hàm load dữ liệu Mẫu / Fallback khi không kết nối được API
  const loadFallbackData = () => {
    const fallback = {
      user_id: userId || "demo_id",
      full_name: "Nguyễn Văn A",
      code: "#CUS-7829",
      phone_number: "+84 901 234 567",
      email: "nguyenvana.agri@gmail.com",
      birthday: "15/01/1992",
      status: "active",
      membership_tier: "KIM CƯƠNG",
      total_orders: "12 đơn",
      total_spending: "15.800.000 đ",
      note: "Khách hàng thân thiết. Ưa thích các sản phẩm nội thất gỗ sồi.",
      addresses: [
        {
          name: "Đạt Vũ",
          phone: "(+84) 789 758 766",
          tag: "Mặc định",
          detail: "123 Lê Lợi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh.",
        },
        {
          name: "Nguyễn Vũ",
          phone: "(+84) 789 758 766",
          detail: "456 Cách Mạng Tháng Tám, Quận 3, TP. Hồ Chí Minh.",
        },
      ],
      orders: [
        {
          id: "#ORD-5521",
          date: "28/03/2024",
          status: "COMPLETED",
          amount: "2.450.000 đ",
          amountNumber: 2450000,
        },
        {
          id: "#ORD-5498",
          date: "24/03/2024",
          status: "PROCESSING",
          amount: "1.120.000 đ",
          amountNumber: 1120000,
        },
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
            { ten_thuoc_tinh: "Màu sắc", gia_tri: "Vàng Sồi" },
          ],
        },
      ],
    };

    setCustomer(fallback);
    if (fallback.addresses && fallback.addresses.length > 0) {
      setSelectedAddress(fallback.addresses[0]);
    }
    setLoading(false);
  };

  useEffect(() => {
    const fetchCustomerDetailAndCart = async () => {
      if (!userId || userId === "undefined") {
        loadFallbackData();
        return;
      }

      setLoading(true);
      try {
        // 1. Gọi Auth Service
        const userRequest = authApi.get(`/auth/internal/users/${userId}`);

        // 2. Gọi Cart Service
        const cartRequest = cartApi
          .get(`/cart/internal/${userId}`)
          .catch(() => ({ data: { items: [] } }));

        // 3. Gọi Address Service (Sử dụng route Internal vừa bổ sung)
        const addressRequest = addressApi
          ? addressApi.get(`/addresses/internal/${userId}`).catch(() => null)
          : Promise.resolve(null);

        const [userResponse, cartResponse, addressResponse] = await Promise.all([
          userRequest,
          cartRequest,
          addressRequest,
        ]);

        if (userResponse?.data) {
          const userData = userResponse.data;
          
          // Trích xuất danh sách sản phẩm giỏ hàng
          const cartItems = cartResponse.data?.items || cartResponse.data || [];

          // Trích xuất danh sách địa chỉ từ Address Service hoặc Auth Fallback
          const rawAddresses =
            addressResponse?.data?.addresses ||
            addressResponse?.data?.data ||
            addressResponse?.data ||
            userData.addresses ||
            userData.dia_chi ||
            [];

          const formattedAddresses = formatAddresses(rawAddresses, userData);

          // Trích xuất danh sách đơn hàng
          let ordersForUser = [];
          try {
            const adminToken = localStorage.getItem("adminToken")
              ? String(localStorage.getItem("adminToken"))
                  .replace(/^"|"$/g, "")
                  .trim()
              : "";
            const orderRes = await orderApi.get(
              `/admin/user-orders/${userId}`,
              {
                headers: {
                  Authorization: adminToken ? `Bearer ${adminToken}` : "",
                },
              }
            );
            if (orderRes.data?.success) {
              ordersForUser = orderRes.data.orders || [];
            }
          } catch (orderErr) {
            console.warn("⚠️ Lỗi truy vấn Order Service:", orderErr);
            ordersForUser = userData.orders || [];
          }

          // Chuẩn hóa danh sách đơn hàng
          const formattedOrders = (ordersForUser || []).map((o) => {
            const ma = o.ma_don_hang || (o.id ? String(o.id) : "");
            const date = o.ngay_tao
              ? new Date(o.ngay_tao).toLocaleString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
              : o.date || "";
            const status =
              o.trang_thai_don_hang ||
              o.trang_thai_thanh_toan ||
              (o.status ? String(o.status) : "PENDING");
            const amountNum = Number(o.tong_thanh_toan || o.total || 0) || 0;
            const amountStr = amountNum
              ? amountNum.toLocaleString("vi-VN") + " đ"
              : o.amount || "0 đ";
            return {
              id: ma,
              rawId: o.id,
              date,
              status,
              amount: amountStr,
              amountNumber: amountNum,
              items: o.danh_sach_san_pham || o.items || [],
            };
          });

          const totalSpendingNum = formattedOrders.reduce(
            (s, it) => s + (Number(it.amountNumber) || 0),
            0
          );

          setCustomer({
            ...userData,
            cart: Array.isArray(cartItems) ? cartItems : [],
            total_orders: formattedOrders.length
              ? `${formattedOrders.length} đơn`
              : "0 đơn",
            total_spending: totalSpendingNum
              ? `${totalSpendingNum.toLocaleString("vi-VN")} đ`
              : "0 đ",
            addresses: formattedAddresses,
            orders: formattedOrders,
          });

          if (formattedAddresses.length > 0) {
            setSelectedAddress(formattedAddresses[0]);
          }
        } else {
          loadFallbackData();
        }
      } catch (err) {
        console.error("❌ Lỗi gọi API thật, chuyển sang dữ liệu mẫu:", err);
        loadFallbackData();
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerDetailAndCart();
  }, [userId]);

  const getTierBadgeStyle = (tier) => {
    const name = String(tier || "BẠC").toUpperCase();
    if (name === "KIM CƯƠNG") {
      return (
        <span className="bg-indigo-50 text-indigo-600 border border-indigo-200 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
          💎 Kim Cương
        </span>
      );
    }
    if (name === "VÀNG") {
      return (
        <span className="bg-amber-50 text-amber-600 border border-amber-200 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
          👑 Vàng
        </span>
      );
    }
    return (
      <span className="bg-slate-50 text-slate-500 border border-slate-200 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
        🥈 Bạc
      </span>
    );
  };

  if (loading)
    return (
      <div className="p-8 text-center text-emerald-600 font-bold animate-pulse">
        Đang nạp chi tiết khách hàng...
      </div>
    );

  if (!customer)
    return (
      <div className="p-8 text-center text-gray-400">
        Không tìm thấy thông tin khách hàng này.
      </div>
    );

  const defaultOrders = customer.orders?.slice(0, 3) || [];

  const totalCartValue =
    customer.cart?.reduce((sum, item) => {
      const numPrice =
        parseInt(String(item.price).replace(/[^0-9]/g, "")) || 0;
      return sum + numPrice * (item.quantity || 1);
    }, 0) || 0;

  const filteredModalOrders = (customer.orders || []).filter((order) => {
    const idStr = String(order.id || "").toLowerCase();
    const matchesSearch = idStr.includes(String(orderSearch || "").toLowerCase());
    const matchesFilter =
      orderFilterStatus === "ALL" || order.status === orderFilterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="w-full min-h-screen bg-[#fafafa] font-sans text-slate-800 antialiased p-6 text-left relative pb-12">
      {/* Header & Button Back */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Chi tiết khách hàng
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Xem thông tin hồ sơ và lịch sử giao dịch toàn diện của khách hàng.
          </p>
        </div>
        <button
          onClick={() => navigate("/admin/customers/list")}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl bg-white text-xs font-bold shadow-sm hover:bg-slate-50 transition cursor-pointer"
        >
          <span>←</span> Quay về
        </button>
      </div>

      {/* Grid Bento Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* CỘT TRÁI (2/3 Screen) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-emerald-50 text-emerald-700 font-black text-xl border flex items-center justify-center overflow-hidden shrink-0">
                {customer.avatar_url ? (
                  <img
                    src={customer.avatar_url}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  customer.full_name?.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-slate-900">
                    {customer.full_name}
                  </h2>
                  {getTierBadgeStyle(customer.membership_tier)}
                  <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                    Active
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1.5 font-mono">
                  MÃ KHÁCH HÀNG: {customer.code || customer.user_id}
                </p>
              </div>
            </div>
          </div>

          {/* Widgets Thống kê */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
              <div>
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider">
                  Tổng số đơn hàng
                </p>
                <p className="text-2xl font-black text-slate-800 mt-2">
                  {customer.total_orders}
                </p>
              </div>
              <span className="text-xl bg-slate-50 p-3 rounded-xl border border-slate-100">
                🛍️
              </span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
              <div>
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider">
                  Tổng chi tiêu
                </p>
                <p className="text-2xl font-black text-slate-800 mt-2">
                  {customer.total_spending}
                </p>
              </div>
              <span className="text-xl bg-slate-50 p-3 rounded-xl border border-slate-100">
                💳
              </span>
            </div>
          </div>

          {/* Thông Tin Cá Nhân */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-xs font-black text-[#006c49] uppercase tracking-wider flex items-center gap-2 mb-5">
              <span>👤</span> Thông tin cá nhân
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-6">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  Họ và tên
                </p>
                <p className="text-sm font-bold text-slate-800 mt-1.5">
                  {customer.full_name}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  Số điện thoại
                </p>
                <p className="text-sm font-bold text-slate-800 mt-1.5 font-mono">
                  {customer.phone_number || "Trống"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  Ngày sinh
                </p>
                <p className="text-sm font-bold text-slate-800 mt-1.5">
                  {customer.birthday || "Trống"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  Địa chỉ Email
                </p>
                <p className="text-sm font-bold text-slate-800 mt-1.5 font-mono text-emerald-600">
                  {customer.email}
                </p>
              </div>
            </div>
          </div>

          {/* Ghi Chú Hệ Thống */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-xs font-black text-[#006c49] uppercase tracking-wider flex items-center gap-2 mb-3">
              <span>📄</span> Ghi chú hệ thống
            </h3>
            <div className="p-4 bg-emerald-50/30 border border-emerald-100/50 rounded-xl text-xs font-medium text-emerald-800 leading-relaxed italic">
              "{customer.note || "Không có ghi chú"}"
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (1/3 Screen) */}
        <div className="space-y-6">
          {/* Sổ Địa Chỉ */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-[#006c49] uppercase tracking-wider flex items-center gap-2">
              <span>📍</span> Sổ địa chỉ khách hàng
            </h3>
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
              {customer.addresses?.length > 0 ? (
                customer.addresses.map((addr, idx) => {
                  const isSelected = selectedAddress?.detail === addr.detail;
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedAddress(addr)}
                      className={`p-3 border rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? "bg-emerald-50/40 border-emerald-500 shadow-sm ring-1 ring-emerald-500/30"
                          : "bg-[#fafafa] border-gray-100 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex justify-between items-center font-bold text-xs text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <span>{addr.name}</span>
                          {addr.tag && (
                            <span className="bg-emerald-100 text-emerald-700 text-[9px] px-1.5 py-0.2 rounded font-semibold">
                              {addr.tag}
                            </span>
                          )}
                        </div>
                        <span className="text-gray-400 font-mono">
                          {addr.phone}
                        </span>
                      </div>
                      <p className="text-gray-500 mt-1 text-xs leading-relaxed">
                        {addr.detail}
                      </p>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-gray-400 italic py-2">
                  Chưa có địa chỉ nào
                </p>
              )}
            </div>

            {/* Google Map Viewer */}
            {selectedAddress?.detail && (
              <div className="pt-2 border-t border-gray-50">
                <div className="w-full h-36 rounded-xl border border-gray-200 overflow-hidden relative bg-[#f2efe9]">
                  <iframe
                    title="Google Maps Viewer"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(
                      selectedAddress.detail
                    )}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
                  ></iframe>
                </div>
              </div>
            )}
          </div>

          {/* Giỏ Hàng Hiện Tại */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-[#006c49] uppercase tracking-wider flex items-center gap-2">
                <span>🛒</span> Giỏ hàng hiện tại
              </h3>
              <span className="bg-[#006c49] text-white text-[10px] font-black px-2 py-0.5 rounded-md">
                {customer.cart?.length || 0} Sản phẩm
              </span>
            </div>

            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
              {customer.cart && customer.cart.length > 0 ? (
                customer.cart.map((item, idx) => {
                  const productName =
                    item.name || item.variantName || "Sản phẩm không tên";
                  const itemPrice =
                    parseInt(
                      String(item.price || 0).replace(/[^0-9]/g, "")
                    ) || 0;

                  return (
                    <div
                      key={item.variantId || idx}
                      className="p-3 bg-[#fafafa] border border-slate-100 rounded-xl text-xs space-y-2 flex flex-col hover:bg-slate-50 transition"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-white border border-slate-200 rounded-lg overflow-hidden p-1 shrink-0 flex items-center justify-center">
                          {item.image && item.image.startsWith("http") ? (
                            <img
                              src={item.image}
                              alt={productName}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <span className="text-lg">📦</span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-800 text-xs line-clamp-2">
                            {productName}
                          </p>
                          <p className="text-[10px] font-bold text-emerald-700 mt-1">
                            {itemPrice.toLocaleString()}đ ×{" "}
                            <span className="text-slate-900 font-black">
                              {item.quantity || 1}
                            </span>{" "}
                            <span className="text-gray-400 font-medium">
                              ({item.ten_don_vi || "Cái"})
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Hiển thị danh sách Thuộc tính EAV của biến thể */}
                      {item.thuoc_tinh_hop_nhat &&
                        item.thuoc_tinh_hop_nhat.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-2 border-t border-slate-200/50">
                            {item.thuoc_tinh_hop_nhat.map((attr, aIdx) => (
                              <span
                                key={aIdx}
                                className="text-[9px] font-bold text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded"
                              >
                                {attr.ten_thuoc_tinh}:{" "}
                                <b className="text-[#006c49]">
                                  {attr.gia_tri}
                                </b>
                              </span>
                            ))}
                          </div>
                        )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-gray-400 italic text-xs">
                  Giỏ hàng hiện tại trống
                </div>
              )}
            </div>

            {customer.cart?.length > 0 && (
              <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-xs font-bold">
                <span className="text-gray-400 uppercase italic">
                  Tổng tạm tính:
                </span>
                <span className="text-[#006c49] text-base font-black">
                  {totalCartValue.toLocaleString()}đ
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lịch Sử Đơn Hàng (Bảng Tóm Tắt Mới Nhất) */}
      <div className="mt-6">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 flex justify-between items-center border-b border-gray-50">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span>🛍️</span> Lịch sử đơn hàng (Mới nhất)
            </h3>
            <button
              onClick={() => setIsOrderModalOpen(true)}
              className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
            >
              Xem tất cả ({customer.orders?.length || 0}) ↗
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/70 text-gray-400 font-bold uppercase border-b border-gray-100">
                  <th className="py-3.5 px-6">Mã đơn</th>
                  <th className="py-3.5 px-6">Ngày đặt</th>
                  <th className="py-3.5 px-6">Trạng thái</th>
                  <th className="py-3.5 px-6">Tổng tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-bold text-slate-600">
                {defaultOrders.length > 0 ? (
                  defaultOrders.map((order, i) => (
                    <tr key={i} className="hover:bg-slate-50/40">
                      <td className="py-3.5 px-6 text-slate-900 font-mono">
                        {order.id}
                      </td>
                      <td className="py-3.5 px-6 text-gray-400 font-mono">
                        {order.date}
                      </td>
                      <td className="py-3.5 px-6">
                        <span
                          className={`px-2 py-0.5 rounded font-black text-[10px] uppercase ${
                            order.status === "COMPLETED"
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                              : "bg-amber-50 text-amber-600 border border-amber-100"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-emerald-700 font-black">
                        {order.amount}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      className="py-6 text-center text-gray-400 italic"
                    >
                      Chưa có lịch sử đơn hàng
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL XEM TOÀN BỘ LỊCH SỬ ĐƠN HÀNG */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b">
              <h2 className="text-base font-bold text-slate-900">
                Lịch sử tất cả đơn hàng ({customer.orders?.length || 0})
              </h2>
              <button
                onClick={() => setIsOrderModalOpen(false)}
                className="text-gray-400 hover:text-slate-800 text-lg font-black"
              >
                ✕
              </button>
            </div>

            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Tìm mã đơn hàng..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-xl text-xs focus:outline-emerald-500"
              />
              <select
                value={orderFilterStatus}
                onChange={(e) => setOrderFilterStatus(e.target.value)}
                className="px-3 py-2 border rounded-xl text-xs focus:outline-emerald-500"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="PROCESSING">PROCESSING</option>
                <option value="PENDING">PENDING</option>
              </select>
            </div>

            <div className="overflow-y-auto flex-1 custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-gray-400 font-bold uppercase border-b">
                    <th className="py-3 px-4">Mã đơn</th>
                    <th className="py-3 px-4">Ngày đặt</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4">Tổng tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-medium text-slate-700">
                  {filteredModalOrders.length > 0 ? (
                    filteredModalOrders.map((ord, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {ord.id}
                        </td>
                        <td className="py-3 px-4 font-mono text-gray-500">
                          {ord.date}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded font-black text-[10px] uppercase ${
                              ord.status === "COMPLETED"
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-amber-50 text-amber-600"
                            }`}
                          >
                            {ord.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-emerald-700">
                          {ord.amount}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="4"
                        className="py-6 text-center text-gray-400 italic"
                      >
                        Không tìm thấy đơn hàng phù hợp
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chitietkhachhang;