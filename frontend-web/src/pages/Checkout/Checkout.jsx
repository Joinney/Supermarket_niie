import React, { useState, useEffect, useMemo, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { AuthContext } from "../../context/AuthContext";
import {
  MapPin,
  Truck,
  Tag,
  CreditCard,
  Loader2,
  X,
  Ticket,
} from "lucide-react";
import { useOrder } from "../../context/OrderContext";
import { authApi, orderApi, paymentApi } from "../../api/axios";
import AddressModal from "../Checkout/AddressModal";
import ShippingModal from "../Checkout/ShippingModal";
import PaymentModal from "../Checkout/PaymentModal";
import PayPalButton from "../Checkout/PayPalButton";
import MoMoButton from "./MoMoButton";
import VNPAYButton from "./VNPAYButton";
import CODButton from "./CODButton";
import VietQRButton from "./VietQRButton";

export default function Checkout() {
  const { cart: contextCart, clearCart, clearPurchasedItems } = useCart();
  const { placeOrder, loading: orderContextLoading } = useOrder();
  const { getMembershipTier } = useContext(AuthContext);
  const tier = getMembershipTier ? getMembershipTier() : "BẠC";
  const navigate = useNavigate();

  const [checkoutCart, setCheckoutCart] = useState([]);
  const [isPlacing, setIsPlacing] = useState(false);

  // 🌟 KHỞI TẠO STATE QUẢN LÝ COUPON
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMessage, setCouponMessage] = useState({ text: "", type: "" });
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // 🌟 STATE CHO POPUP CHỌN VOUCHER
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [availableVouchers, setAvailableVouchers] = useState([]);
  const [isLoadingVouchers, setIsLoadingVouchers] = useState(false);

  const mockCart = [
    {
      variantId: "v1",
      name: "Quay tròn 360 độ Máy dọa chim (Phiên bản âm thanh)",
      price: 203700,
      quantity: 2,
      image:
        "https://images.unsplash.com/photo-1594498652286-66770e28f000?w=100",
    },
  ];

  useEffect(() => {
    const selectedItems = JSON.parse(
      localStorage.getItem("checkoutItems") || "[]",
    );
    if (selectedItems && selectedItems.length > 0) {
      setCheckoutCart(selectedItems);
    } else {
      setCheckoutCart(
        contextCart && contextCart.length > 0 ? contextCart : mockCart,
      );
    }
  }, [contextCart]);

  const getCleanImage = (url) => {
    if (!url)
      return "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200";
    let cleanUrl = url.split("?")[0];
    if (cleanUrl.includes("cloudinary.com"))
      return `${cleanUrl}?t=${Date.now()}`;
    return cleanUrl;
  };

  const groupedCheckoutCart = useMemo(() => {
    const groups = {};
    checkoutCart.forEach((item) => {
      const pId = item.productId || item.id || "unknown";
      if (!groups[pId]) {
        groups[pId] = {
          productId: pId,
          name: item.name,
          image: item.image,
          subVariants: [],
        };
      }
      groups[pId].subVariants.push(item);
    });
    return Object.values(groups);
  }, [checkoutCart]);

  const [address, setAddress] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [isLoadingAddress, setIsLoadingAddress] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [shippingMethods, setShippingMethods] = useState([]);
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);

  const [selectedPayment, setSelectedPayment] = useState("COD");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const [shippingInfo, setShippingInfo] = useState({
    fee: 0,
    timeText: "",
    storeName: "",
    distanceKm: 0,
    estimatedMinutes: 0,
    loading: false,
  });

  const itemTotal = checkoutCart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const shippingFee = shippingInfo.fee;

  const discountAmount = appliedCoupon ? appliedCoupon.discount_amount : 0;
  const finalTotal = Math.max(0, itemTotal + shippingFee - discountAmount);

  useEffect(() => {
    const fetchDistanceShipping = async () => {
      if (!address || !address.latitude || !address.longitude) return;

      setShippingInfo((prev) => ({ ...prev, loading: true }));
      try {
        const response = await orderApi.post("/orders/shipping/calc", {
          userLat: address.latitude,
          userLng: address.longitude,
        });

        if (response.data && response.data.success) {
          const { shippingFee, estimatedMinutes, distanceKm, nearestStore } =
            response.data.data;
          const timeStr = `${estimatedMinutes} phút (${distanceKm}km)`;
          const storeNameStr = nearestStore?.name || "Siêu thị DemiMart";

          setShippingInfo({
            fee: shippingFee,
            timeText: timeStr,
            storeName: storeNameStr,
            distanceKm: Number(distanceKm || 0),
            estimatedMinutes: Number(estimatedMinutes || 0),
            loading: false,
          });

          const demiExpressOption = {
            id: "demi-store-express",
            name: `🚀 Giao từ: ${storeNameStr}`,
            cost: shippingFee,
            days: `Dự kiến nhận sau ${timeStr}`,
            logo: "",
          };

          setShippingMethods([demiExpressOption]);
          setSelectedShipping(demiExpressOption);
        }
      } catch (error) {
        setShippingInfo((prev) => ({ ...prev, loading: false }));
      }
    };
    fetchDistanceShipping();
  }, [address]);

  const fetchAddresses = async () => {
    try {
      const res = await authApi.get("/addresses");
      const data = res.data.data || res.data;
      setAddresses(data);
      const defaultAddr = data.find((a) => a.is_default === true) || data[0];
      setAddress(defaultAddr);
    } catch (err) {
      console.error("Lỗi fetch địa chỉ:", err);
    } finally {
      setIsLoadingAddress(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  // 🌟 LẤY DANH SÁCH VOUCHER KHI MỞ POPUP
  useEffect(() => {
    if (showVoucherModal && availableVouchers.length === 0) {
      const fetchVouchers = async () => {
        setIsLoadingVouchers(true);
        try {
          const res = await authApi.get("http://localhost:5007/api/coupons");
          if (res.data.success) {
            // Chỉ lấy các mã đang active
            setAvailableVouchers(res.data.data.filter((c) => c.is_active));
          }
        } catch (err) {
          console.error("Lỗi tải voucher:", err);
        } finally {
          setIsLoadingVouchers(false);
        }
      };
      fetchVouchers();
    }
  }, [showVoucherModal, availableVouchers.length]);

  // 🌟 HÀM KIỂM TRA & ÁP DỤNG MÃ (Hỗ trợ áp dụng tự động)
  const handleApplyCoupon = async (codeToApply = couponCodeInput) => {
    const finalCode =
      typeof codeToApply === "string"
        ? codeToApply.trim()
        : couponCodeInput.trim();

    if (!finalCode) {
      setCouponMessage({
        text: "Vui lòng chọn hoặc nhập mã khuyến mãi",
        type: "error",
      });
      return;
    }

    setCouponCodeInput(finalCode);
    setIsValidatingCoupon(true);
    setCouponMessage({ text: "", type: "" });

    try {
      const token = localStorage.getItem("token");
      const res = await authApi.post(
        "http://localhost:5007/api/coupons/validate",
        {
          code: finalCode,
          order_amount: itemTotal,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.data.success) {
        setAppliedCoupon(res.data.data);
        setCouponMessage({
          text: res.data.message || "Áp dụng mã thành công!",
          type: "success",
        });
        setShowVoucherModal(false); // Ẩn modal nếu đang mở
      }
    } catch (err) {
      setAppliedCoupon(null);
      setCouponMessage({
        text: err.response?.data?.message || "Mã không hợp lệ hoặc đã hết hạn",
        type: "error",
      });
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCodeInput("");
    setCouponMessage({ text: "", type: "" });
  };

  const finalizeOrderCleanup = async () => {
    const boughtVariantIds = checkoutCart.map(
      (item) => item.variantId || item.variant_id,
    );
    if (clearPurchasedItems) {
      await clearPurchasedItems(boughtVariantIds);
    } else if (clearCart) {
      await clearCart();
    }
    localStorage.removeItem("checkoutItems");
  };

  const executePlaceOrder = async (extraPaymentInfo = {}) => {
    if (!address) return alert("Vui lòng chọn địa chỉ giao hàng hợp lệ!");

    const targetDistrictId =
      address.district_id || address.to_district_id || address.districtId;
    const targetWardCode =
      address.ward_code ||
      address.to_ward_code ||
      address.wardCode ||
      address.ward_id;

    const orderData = {
      thong_tin_giao_hang: {
        ten_nguoi_nhan:
          address.receiver_name || address.receiverName || "Khách hàng",
        so_dien_thoai:
          address.receiver_phone || address.receiverPhone || "0123456789",
        dia_chi_day_du: `${address.detail_address || address.detailAddress || ""}, ${address.ward_name || address.wardName || ""}, ${address.district_name || address.districtName || ""}, ${address.province_name || address.provinceName || ""}`,
      },
      to_district_id: Number(targetDistrictId || 1454),
      to_ward_code: String(targetWardCode || "21211"),
      weight: 1000,
      danh_sach_san_pham: checkoutCart.map((item) => {
        const vId = String(
          item.variant_id ||
            item.variantId ||
            item.ma_bien_the ||
            item.productId ||
            item.ma_san_pham ||
            "",
        );

        return {
          variant_id: vId,
          quantity: Number(item.quantity),
          price: Number(item.price),
          name: String(item.name || item.productName || "Sản phẩm Demi Mart"),
          variant_name: String(item.variantName || item.variant_name || ""),
          image: String(item.image || item.imageUrl || item.image_url || ""),
          ma_san_pham: String(item.ma_san_pham || item.productId || ""),
        };
      }),
      don_vi_van_chuyen: shippingInfo.storeName
        ? `Siêu thị ${shippingInfo.storeName}`
        : "Siêu thị DemiMart Express",
      to_lat: address.latitude,
      to_lng: address.longitude,
      tong_khoang_cach_km: shippingInfo.distanceKm || 0,
      thoi_gian_du_kien_phut: shippingInfo.estimatedMinutes || 0,
      tong_thoi_gian_du_kien_phut: shippingInfo.estimatedMinutes || 0,
      tong_tien_hang: itemTotal,
      phi_van_chuyen: shippingFee,

      so_tien_giam_gia: discountAmount,
      coupon_code: appliedCoupon ? appliedCoupon.code : null,
      tong_thanh_toan: finalTotal,

      phuong_thuc_thanh_toan: selectedPayment,
      ...extraPaymentInfo,
    };

    try {
      console.log(
        "Đang kiểm tra giỏ hàng gửi đi:",
        orderData.danh_sach_san_pham,
      );
      const result = placeOrder
        ? await placeOrder(orderData)
        : await orderApi.post("/orders/place-order", orderData);
      const cleanResult = result?.data || result;

      if (cleanResult && cleanResult.success) {
        const maDonHangText =
          cleanResult.ma_don_hang || cleanResult.data?.ma_don_hang;
        const tongThanhToanNum = cleanResult.tong_thanh_toan || finalTotal;

        if (selectedPayment === "VNPay") {
          const boughtVariantIds = checkoutCart.map(
            (item) => item.variantId || item.variant_id,
          );
          localStorage.setItem(
            "vnpay_pending_variants",
            JSON.stringify(boughtVariantIds),
          );
          const paymentRes = await paymentApi.post("/create-transaction", {
            ma_don_hang: maDonHangText,
            tong_thanh_toan: tongThanhToanNum,
            phuong_thuc_thanh_toan: "VNPay",
          });
          if (paymentRes.data && paymentRes.data.paymentUrl) {
            window.location.href = `${paymentRes.data.paymentUrl}&vnp_BrowserNonce=${new Date().getTime()}`;
            return true;
          } else {
            throw new Error("Không lấy được link từ cổng thanh toán VNPay!");
          }
        }
        return maDonHangText;
      } else {
        alert("Có sự cố từ máy chủ đơn hàng, Demi kiểm tra lại nhé!");
        return false;
      }
    } catch (error) {
      console.error(
        "🔥 Lỗi đặt đơn hoặc thanh toán tại Checkout:",
        error.response?.data || error.message,
      );
      alert(
        error.response?.data?.message ||
          "Xử lý đơn hàng thất bại. Vui lòng kiểm tra lại hệ thống!",
      );
      return false;
    }
  };

  const handlePlaceOrder = async () => {
    if (!address) return alert("Vui lòng chọn địa chỉ giao hàng!");
    if (!selectedShipping)
      return alert("Vui lòng đợi hệ thống tính toán phí vận chuyển!");
    if (checkoutCart.length === 0)
      return alert("Giỏ hàng thanh toán đang trống!");

    setIsPlacing(true);
    const orderSuccess = await executePlaceOrder();
    if (orderSuccess && selectedPayment === "COD") {
      alert(
        "🎉 Đặt hàng thành công! Đơn hàng thanh toán khi nhận hàng (COD) đã ghi nhận.",
      );
      await finalizeOrderCleanup();
      navigate("/profile/orders");
    }
    setIsPlacing(false);
  };

  const handlePayPalSuccess = async (details) => {
    try {
      setIsPlacing(true);
      const transactionId =
        details.purchase_units?.[0]?.payments?.captures?.[0]?.id || details.id;
      const maDonHangText = await executePlaceOrder({
        trang_thai_thanh_toan: "completed",
        paypal_transaction_id: String(transactionId),
        paypal_order_id: String(details.id),
      });

      if (maDonHangText) {
        try {
          await paymentApi.post("/paypal-capture", {
            ma_don_hang: String(maDonHangText),
            paypal_order_id: String(details.id),
            so_tien: Number(finalTotal),
            capture_data: {
              status: String(details.status || "COMPLETED"),
              id: String(transactionId),
              intent: String(details.intent || "CAPTURE"),
            },
          });
        } catch (syncErr) {
          console.warn(
            "⚠️ Ghi nhận lịch sử payment_transactions chạy ngầm gặp độ trễ:",
            syncErr.response?.data || syncErr.message,
          );
        }
        alert(
          `🎉 Đặt hàng thành công! Mã đơn hàng Demi Mart của bạn là: ${maDonHangText}`,
        );
        await finalizeOrderCleanup();
        navigate("/profile/orders");
      }
    } catch (err) {
      alert(
        "Giao dịch PayPal thành công nhưng ghi nhận lịch sử hệ thống thất bại!",
      );
    } finally {
      setIsPlacing(false);
    }
  };

  const isGlobalLoading = orderContextLoading || isPlacing;

  const getPaymentName = (id) => {
    if (id === "COD") return "Thanh toán khi nhận hàng (COD)";
    if (id === "PayPal") return "PayPal System";
    if (id === "VNPay") return "VNPay Cổng Chính";
    return id;
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-10 text-left selection:bg-[#006c49] selection:text-white">
      <div className="max-w-[1250px] mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* CỘT TRÁI: THÔNG TIN CHI TIẾT ĐƠN HÀNG */}
        <div className="lg:col-span-8 space-y-4">
          {/* 1. ĐỊA CHỈ */}
          <section className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-l-[#006c49]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[#006c49] flex items-center gap-2 font-black text-sm uppercase tracking-wider">
                <MapPin size={18} /> Địa chỉ nhận hàng
              </h2>
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-[#006c49] font-black text-xs uppercase hover:underline"
              >
                Thay đổi
              </button>
            </div>
            {isLoadingAddress ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 font-bold">
                <Loader2 className="animate-spin text-[#006c49]" size={16} />{" "}
                Đang tải thông tin giao nhận...
              </div>
            ) : address ? (
              <div className="text-sm font-bold flex flex-wrap items-center gap-3">
                <div className="text-slate-900">
                  {address.receiver_name || address.receiverName}{" "}
                  <span className="font-mono text-[#006c49] bg-emerald-50 px-1.5 py-0.5 rounded text-xs ml-1">
                    (+84) {address.receiver_phone || address.receiverPhone}
                  </span>
                </div>
                <p className="text-gray-500 font-medium">
                  {address.detail_address || address.detailAddress},{" "}
                  {address.ward_name || address.wardName},{" "}
                  {address.district_name || address.districtName},{" "}
                  {address.province_name || address.provinceName}
                </p>
                {address.is_default && (
                  <span className="text-[10px] bg-red-50 text-red-500 font-black px-2 py-0.5 rounded uppercase tracking-wider">
                    Mặc định
                  </span>
                )}
              </div>
            ) : (
              <div className="text-sm font-bold flex items-center justify-between">
                <p className="text-red-500">
                  Bạn chưa có địa chỉ nhận hàng nào trong hệ thống.
                </p>
                <button
                  onClick={() => navigate("/profile/address")}
                  className="bg-[#006c49] text-white px-4 py-2 rounded-xl text-xs font-black uppercase"
                >
                  Thêm địa chỉ
                </button>
              </div>
            )}
          </section>

          {/* 2. SẢN PHẨM */}
          <section className="bg-white p-5 rounded-2xl shadow-sm space-y-4">
            <h2 className="text-gray-700 font-black text-xs lg:text-sm uppercase tracking-wide border-b border-slate-100 pb-3 mb-2">
              Kiện hàng sản phẩm ({checkoutCart.length} loại phân loại)
            </h2>
            <div className="space-y-4">
              {groupedCheckoutCart.map((group) => {
                const hasMultipleVariants = group.subVariants.length > 1;
                if (!hasMultipleVariants) {
                  const item = group.subVariants[0];
                  return (
                    <div
                      key={item.variantId || item.variant_id}
                      className="flex items-center gap-4 bg-white border border-slate-100 p-4 rounded-2xl shadow-sm"
                    >
                      <div className="w-16 h-16 bg-slate-50 border border-slate-200/60 rounded-xl overflow-hidden p-1.5 shadow-sm flex-shrink-0 flex items-center justify-center">
                        <img
                          src={getCleanImage(item.image)}
                          className="w-full h-full object-contain"
                          alt={item.name}
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
                        <div className="min-w-0 flex-1 text-left">
                          <span className="font-black text-slate-800 text-sm lg:text-base uppercase truncate italic block">
                            {item.name}
                          </span>
                          {item.thuoc_tinh_hop_nhat &&
                          item.thuoc_tinh_hop_nhat.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {item.thuoc_tinh_hop_nhat.map((attr, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center text-[10px] font-bold tracking-wide text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-100/60 shadow-sm"
                                >
                                  {attr.ten_thuoc_tinh}:{" "}
                                  <b className="text-slate-700 ml-1 font-black">
                                    {attr.gia_tri}
                                  </b>
                                </span>
                              ))}
                            </div>
                          ) : (
                            item.variantName && (
                              <span className="inline-block mt-1.5 text-[10px] font-bold tracking-wide text-slate-400 bg-slate-50 px-2.5 py-0.5 rounded border border-slate-100">
                                Phân loại: {item.variantName}
                              </span>
                            )
                          )}
                        </div>
                        <div className="flex items-center gap-6 flex-shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                          <div className="text-center">
                            <span className="text-xs text-gray-400 font-bold block">
                              Đơn giá
                            </span>
                            <span className="font-semibold text-slate-600 text-sm">
                              {(item.price || 0).toLocaleString()}đ
                            </span>
                          </div>
                          <div className="text-center">
                            <span className="text-xs text-gray-400 font-bold block">
                              Số lượng
                            </span>
                            <span className="font-bold text-slate-800 text-sm">
                              x{item.quantity}
                            </span>
                          </div>
                          <div className="text-right min-w-[80px]">
                            <span className="text-xs text-gray-400 font-bold block">
                              Thành tiền
                            </span>
                            <span className="font-black text-[#006c49] text-sm">
                              {(item.price * item.quantity).toLocaleString()}đ
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
                return (
                  <div
                    key={group.productId}
                    className="bg-white border rounded-2xl shadow-sm overflow-hidden border-slate-100"
                  >
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-slate-50 via-slate-50/30 to-white border-b border-slate-100">
                      <div className="w-16 h-16 bg-white border border-slate-200/60 rounded-xl overflow-hidden p-1.5 shadow-sm flex-shrink-0 flex items-center justify-center">
                        <img
                          src={group.image}
                          alt={group.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="min-w-0 text-left">
                        <span className="font-black text-slate-800 text-sm lg:text-base uppercase truncate italic block">
                          {group.name}
                        </span>
                        <p className="text-[11px] text-gray-400 mt-1 font-bold">
                          Kiện hàng gom:{" "}
                          <span className="text-[#006c49] font-black bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 shadow-inner">
                            {group.subVariants.length} loại phân loại
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="divide-y divide-slate-100 bg-white">
                      {group.subVariants.map((subItem) => (
                        <div
                          key={subItem.variantId}
                          className="flex items-center gap-4 p-4 pl-6 transition-all duration-200"
                        >
                          <div className="w-12 h-14 bg-slate-50 border border-slate-100 rounded-lg overflow-hidden p-1 flex-shrink-0 flex items-center justify-center shadow-sm">
                            <img
                              src={getCleanImage(subItem.image)}
                              alt={subItem.variantName}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="flex-1 min-w-0 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
                            <div className="min-w-0 flex-1 text-left">
                              {subItem.thuoc_tinh_hop_nhat &&
                              subItem.thuoc_tinh_hop_nhat.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {subItem.thuoc_tinh_hop_nhat.map(
                                    (attr, idx) => (
                                      <span
                                        key={idx}
                                        className="inline-flex items-center text-[9px] font-black tracking-wide text-emerald-800 bg-emerald-50/80 px-2 py-0.5 rounded border border-emerald-100/40 shadow-inner"
                                      >
                                        {attr.ten_thuoc_tinh}:{" "}
                                        <span className="text-slate-600 ml-1 font-bold">
                                          {attr.gia_tri}
                                        </span>
                                      </span>
                                    ),
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs font-bold text-slate-500">
                                  {subItem.variantName}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-6 flex-shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                              <div className="text-center">
                                <span className="text-xs text-gray-400 font-bold block">
                                  Đơn giá
                                </span>
                                <span className="font-semibold text-slate-600 text-xs">
                                  {subItem.price.toLocaleString()}đ
                                </span>
                              </div>
                              <div className="text-center">
                                <span className="text-xs text-gray-400 font-bold block">
                                  Số lượng
                                </span>
                                <span className="font-bold text-slate-800 text-xs">
                                  x{subItem.quantity}
                                </span>
                              </div>
                              <div className="text-right min-w-[80px]">
                                <span className="text-xs text-gray-400 font-bold block">
                                  Thành tiền
                                </span>
                                <span className="font-black text-[#006c49] text-xs">
                                  {(
                                    subItem.price * subItem.quantity
                                  ).toLocaleString()}
                                  đ
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 3. ĐƠN VỊ VẬN CHUYỂN VÀ COUPON */}
          <section className="bg-white p-5 rounded-2xl shadow-sm space-y-4">
            <div className="flex justify-between items-center font-black text-sm uppercase text-[#006c49] border-b pb-3">
              <div className="flex gap-2">
                <Truck size={18} /> Gói cước vận chuyển
              </div>
              <button
                disabled={shippingInfo.loading || !address}
                onClick={() => setIsShippingModalOpen(true)}
                className="text-xs hover:underline disabled:opacity-30 disabled:no-underline"
              >
                Thay đổi
              </button>
            </div>

            {shippingInfo.loading ? (
              <div className="flex items-center gap-2 text-sm text-[#006c49] font-bold py-2">
                <Loader2 className="animate-spin" size={16} /> Đang định tuyến
                kho hàng gần nhất...
              </div>
            ) : selectedShipping ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-50 border rounded-xl flex items-center justify-center p-1 shadow-sm">
                    {selectedShipping.logo ? (
                      <img
                        src={selectedShipping.logo}
                        className="w-full h-full object-contain"
                        alt="logo"
                      />
                    ) : (
                      <Truck className="text-[#006c49]" size={20} />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">
                      {selectedShipping.name}
                    </p>
                    <p className="text-gray-400 text-xs font-semibold">
                      {selectedShipping.days}
                    </p>
                  </div>
                </div>
                <span className="font-black text-slate-900 text-sm">
                  {selectedShipping.cost.toLocaleString()}đ
                </span>
              </div>
            ) : (
              <p className="text-xs text-gray-400 font-bold py-2">
                Vui lòng chọn địa chỉ hợp lệ để hệ thống tính toán lộ trình.
              </p>
            )}

            {/* 🌟 KHU VỰC VOUCHER MỚI (CHỌN TỪ POPUP) */}
            <div className="border-t pt-5 mt-4 flex flex-col gap-3">
              <div className="flex justify-between items-center font-bold mb-1">
                <div className="flex gap-2 text-[#006c49] text-sm uppercase tracking-wider">
                  <Tag size={18} /> Mã Giảm Giá / Voucher
                </div>
              </div>

              {!appliedCoupon ? (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-3 relative group">
                    <input
                      type="text"
                      readOnly // Không cho nhập tay nữa
                      onClick={() => setShowVoucherModal(true)} // Nhấn vào là mở Modal
                      placeholder="Nhấn để chọn mã khuyến mãi..."
                      value={couponCodeInput}
                      className="border-2 border-slate-200 rounded-xl px-4 py-2 flex-1 outline-none font-bold text-slate-700 uppercase cursor-pointer group-hover:border-[#006c49]/50 transition-colors bg-white"
                    />
                    <button
                      onClick={() => setShowVoucherModal(true)}
                      className="bg-[#006c49] text-white px-5 py-2 rounded-xl font-black uppercase text-xs hover:bg-[#005237] transition-all flex items-center gap-2"
                    >
                      <Ticket size={16} /> Chọn Mã
                    </button>
                  </div>
                  {couponMessage.text && (
                    <p
                      className={`text-xs font-bold ${couponMessage.type === "error" ? "text-red-500" : "text-[#006c49]"}`}
                    >
                      {couponMessage.text}
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-emerald-50 border border-[#006c49] rounded-xl p-3 flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[#006c49] font-black uppercase text-sm">
                      Đã áp dụng mã: {appliedCoupon.code}
                    </span>
                    <span className="text-emerald-700 text-xs font-bold">
                      Giảm ngay {discountAmount.toLocaleString()}đ
                    </span>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-red-500 hover:text-red-600 bg-white p-1.5 rounded-lg border border-red-100 shadow-sm transition-transform active:scale-95"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* 4. PHƯƠNG THỨC THANH TOÁN */}
          <section className="bg-white p-5 rounded-2xl shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-[#006c49] flex items-center gap-2 font-black text-sm uppercase tracking-wider">
                <CreditCard size={18} /> Phương thức thanh toán
              </h2>
              <button
                onClick={() => setIsPaymentModalOpen(true)}
                className="text-[#006c49] font-black text-xs uppercase hover:underline"
              >
                Thay đổi
              </button>
            </div>
            <div className="px-5 py-2.5 rounded-xl border-2 border-[#006c49] bg-emerald-50/50 text-[#006c49] text-xs font-black uppercase tracking-wider inline-block">
              {getPaymentName(selectedPayment)}
            </div>
          </section>
        </div>

        {/* CỘT PHẢI: KẾT QUẢ TỔNG THANH TOÁN HÓA ĐƠN */}
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-24 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-left space-y-5">
            <h2 className="font-black italic text-slate-900 border-b pb-2 tracking-tight">
              TỔNG THANH TOÁN
            </h2>
            <div className="space-y-3 font-bold text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Tổng tiền hàng</span>{" "}
                <span className="text-slate-900 font-semibold">
                  {itemTotal.toLocaleString()}đ
                </span>
              </div>
              <div className="flex flex-col gap-1 border-b border-slate-100 pb-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-bold">
                    Phí vận chuyển
                  </span>
                  <span className="text-slate-900 font-black">
                    {shippingInfo.loading ? (
                      <Loader2 className="animate-spin inline w-4 h-4 text-[#006c49]" />
                    ) : (
                      `${shippingInfo.fee.toLocaleString()}đ`
                    )}
                  </span>
                </div>
                {shippingInfo.storeName && !shippingInfo.loading && (
                  <span className="text-[11px] text-[#006c49] font-black italic text-right block bg-emerald-50/60 px-2 py-1 rounded-lg border border-emerald-100/40">
                    🚀 Giao từ: {shippingInfo.storeName} (
                    {shippingInfo.timeText})
                  </span>
                )}
              </div>

              {/* 🌟 HIỂN THỊ SỐ TIỀN COUPON ĐƯỢC GIẢM */}
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                  <span>Mã Giảm Giá</span>{" "}
                  <span>-{discountAmount.toLocaleString()}đ</span>
                </div>
              )}

              <div className="flex justify-between text-lg font-black text-[#006c49] border-t pt-3">
                <span>TỔNG ĐƠN</span>{" "}
                <span>{finalTotal.toLocaleString()}đ</span>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 text-center leading-relaxed">
              Nhấn "Đặt hàng" đồng nghĩa với việc bạn đồng ý tuân thủ theo các
              chính sách bảo mật và Điều khoản mua sắm của Demi Mart.
            </p>

            <div className="w-full pt-2">
              {selectedPayment === "PayPal" && (
                <PayPalButton
                  amount={finalTotal}
                  onSuccess={handlePayPalSuccess}
                  onError={() => alert("Giao dịch PayPal bị gián đoạn!")}
                />
              )}
              {selectedPayment === "VNPay" && (
                <VNPAYButton
                  amount={finalTotal}
                  onClick={handlePlaceOrder}
                  disabled={
                    isGlobalLoading ||
                    shippingInfo.loading ||
                    !address ||
                    checkoutCart.length === 0
                  }
                />
              )}
              {selectedPayment === "MoMo" && (
                <MoMoButton
                  amount={finalTotal}
                  onClick={() => alert("Chức năng đang bảo trì")}
                  disabled={
                    isGlobalLoading ||
                    shippingInfo.loading ||
                    !address ||
                    checkoutCart.length === 0
                  }
                />
              )}
              {selectedPayment === "Banking" && (
                <VietQRButton
                  amount={finalTotal}
                  onClick={() => alert("Chức năng đang bảo trì")}
                  disabled={
                    isGlobalLoading ||
                    shippingInfo.loading ||
                    !address ||
                    checkoutCart.length === 0
                  }
                />
              )}
              {selectedPayment === "COD" && (
                <CODButton
                  amount={finalTotal}
                  onClick={handlePlaceOrder}
                  disabled={
                    isGlobalLoading ||
                    shippingInfo.loading ||
                    !address ||
                    checkoutCart.length === 0
                  }
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <AddressModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={(addr) => setAddress(addr)}
        currentAddresses={addresses}
        selectedAddressId={address?.address_id || address?.id}
        onRefresh={fetchAddresses}
      />
      <ShippingModal
        isOpen={isShippingModalOpen}
        onClose={() => setIsShippingModalOpen(false)}
        onSelect={(method) => setSelectedShipping(method)}
        shippingMethods={shippingMethods}
        selectedMethodId={selectedShipping?.id}
      />
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSelect={(methodId) => setSelectedPayment(methodId)}
        selectedMethod={selectedPayment}
      />

      {/* 🌟 MODAL CHỌN VOUCHER HIỂN THỊ KHI ĐƯỢC KÍCH HOẠT */}
      {showVoucherModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fadeIn">
            {/* Header Modal */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                <Ticket className="text-[#006c49]" /> Chọn Mã Khuyến Mãi
              </h3>
              <button
                onClick={() => setShowVoucherModal(false)}
                className="text-gray-400 hover:text-red-500"
              >
                <X size={24} />
              </button>
            </div>

            {/* Body Danh sách Voucher */}
            <div className="p-4 max-h-[60vh] min-h-[300px] overflow-y-auto bg-gray-50/80 space-y-3">
              {isLoadingVouchers ? (
                <div className="text-center py-10 flex flex-col items-center gap-2">
                  <Loader2 className="animate-spin text-[#006c49]" size={28} />
                  <span className="text-sm font-bold text-gray-400">
                    Đang tìm mã phù hợp...
                  </span>
                </div>
              ) : availableVouchers.length === 0 ? (
                <div className="text-center py-10 text-gray-500 font-bold">
                  Hiện không có mã giảm giá nào đang chạy.
                </div>
              ) : (
                availableVouchers.map((coupon) => {
                  // 1. TÍNH TOÁN ĐIỀU KIỆN
                  const reqSpent = Number(coupon.min_lifetime_spent);
                  const reqOrderValue = Number(coupon.min_order_value);

                  // Kiểm tra Hạng (KIM CƯƠNG, VÀNG, hoặc mã 0đ)
                  const isTierEligible =
                    tier === "KIM CƯƠNG" ||
                    reqSpent === 0 ||
                    (tier === "VÀNG" && reqSpent <= 5000000);

                  // Kiểm tra Giá trị đơn hàng tối thiểu
                  const isValueEligible = itemTotal >= reqOrderValue;

                  // Phải thỏa mãn cả 2 điều kiện
                  const isEligible = isTierEligible && isValueEligible;

                  // 2. TẠO CÂU THÔNG BÁO LÝ DO BỊ KHÓA
                  let disableReason = "";
                  if (!isTierEligible) disableReason = "Cần hạng cao hơn";
                  else if (!isValueEligible)
                    disableReason = `Mua thêm ${(reqOrderValue - itemTotal).toLocaleString()}đ`;

                  return (
                    <div
                      key={coupon.id}
                      className={`border-2 p-4 rounded-xl flex items-center justify-between relative overflow-hidden transition-all duration-300 ${
                        isEligible
                          ? "bg-white border-emerald-100 cursor-pointer hover:border-[#006c49] group shadow-sm"
                          : "bg-slate-50 border-slate-200 opacity-60 grayscale-[50%] pointer-events-none" // Hiệu ứng mờ và cấm bấm
                      }`}
                    >
                      <div
                        className={`absolute left-0 top-0 bottom-0 w-2 ${isEligible ? "bg-[#006c49]" : "bg-slate-400"}`}
                      ></div>

                      <div className="pl-2 flex-1">
                        <div
                          className={`font-black text-lg ${isEligible ? "text-[#006c49]" : "text-slate-500"}`}
                        >
                          {coupon.code}
                        </div>
                        <div className="text-sm font-bold text-gray-700 mt-0.5 line-clamp-1">
                          {coupon.description ||
                            `Giảm ${Number(coupon.discount_value).toLocaleString()}đ`}
                        </div>
                        <div
                          className={`text-[11px] font-bold mt-1 ${!isValueEligible && isTierEligible ? "text-red-500" : "text-gray-400"}`}
                        >
                          Đơn tối thiểu{" "}
                          {Number(coupon.min_order_value).toLocaleString()}đ
                        </div>
                      </div>

                      {/* 3. HIỂN THỊ NÚT HOẶC CẢNH BÁO */}
                      {isEligible ? (
                        <button
                          onClick={() => handleApplyCoupon(coupon.code)}
                          disabled={isValidatingCoupon}
                          className="bg-[#006c49] text-white px-4 py-1.5 rounded-lg text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity active:scale-95 disabled:opacity-50 shrink-0"
                        >
                          {isValidatingCoupon && couponCodeInput === coupon.code
                            ? "..."
                            : "Dùng Ngay"}
                        </button>
                      ) : (
                        <div className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1.5 rounded-lg border border-amber-100 text-right shrink-0">
                          {disableReason}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-white text-center">
              <button
                onClick={() => setShowVoucherModal(false)}
                className="text-sm font-bold text-gray-400 hover:text-gray-600"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
