import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { MapPin, Truck, Tag, CreditCard, Loader2 } from 'lucide-react';
import { useOrder } from '../../context/OrderContext';
import { authApi, orderApi, paymentApi } from '../../api/axios'; 
import AddressModal from '../Checkout/AddressModal'; 
import ShippingModal from '../Checkout/ShippingModal'; 
import PayPalButton from '../Checkout/PayPalButton';

export default function Checkout() {
  const { cart: contextCart, clearCart, clearPurchasedItems } = useCart(); 
  const { placeOrder, loading: orderContextLoading } = useOrder();
  const navigate = useNavigate();

  const [checkoutCart, setCheckoutCart] = useState([]);
  const [isPlacing, setIsPlacing] = useState(false);

  const mockCart = [
    {
      variantId: 'v1',
      name: 'Quay tròn 360 độ Máy dọa chim (Phiên bản âm thanh)',
      price: 203700,
      quantity: 2,
      image: 'https://images.unsplash.com/photo-1594498652286-66770e28f000?w=100'
    }
  ];

  useEffect(() => {
    const selectedItems = JSON.parse(localStorage.getItem('checkoutItems') || '[]');
    if (selectedItems && selectedItems.length > 0) {
      setCheckoutCart(selectedItems);
    } else {
      setCheckoutCart(contextCart && contextCart.length > 0 ? contextCart : mockCart);
    }
  }, [contextCart]);

  const getCleanImage = (url) => {
    if (!url) return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200';
    let cleanUrl = url.split('?')[0];
    if (cleanUrl.includes('cloudinary.com')) {
      return `${cleanUrl}?t=${Date.now()}`;
    }
    return cleanUrl;
  };

  const [address, setAddress] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [isLoadingAddress, setIsLoadingAddress] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [shippingMethods, setShippingMethods] = useState([]);
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);
  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);

  const fetchAddresses = async () => {
    try {
      const res = await authApi.get('/addresses');
      const data = res.data.data || res.data;
      setAddresses(data);
      const defaultAddr = data.find(a => a.is_default === true) || data[0];
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

  useEffect(() => {
    const fetchShippingFees = async () => {
      if (!address) return;

      const targetDistrictId = address.district_id || address.to_district_id || address.districtId;
      const targetWardCode = address.ward_code || address.to_ward_code || address.wardCode;

      if (!targetDistrictId || !targetWardCode) {
        console.warn("⚠️ Địa chỉ thiếu mã định danh GHN:", address);
        return;
      }
      
      setIsLoadingShipping(true);
      try {
        const res = await orderApi.post('/orders/shipping-fee', {
          to_district_id: Number(targetDistrictId), 
          to_ward_code: String(targetWardCode),     
          weight: 1000 
        });

        const methods = res.data.data || res.data;
        setShippingMethods(methods);
        
        if (methods && methods.length > 0) {
          setSelectedShipping(methods[0]); 
        } else {
          setSelectedShipping(null);
        }
      } catch (err) {
        console.error("Lỗi cước phí GHN, dùng fallback:", err);
        const fallback = [
          { 
            id: 'ghn-standard', 
            name: 'Giao Hàng Nhanh (Chuẩn)', 
            cost: 35000, 
            days: 'Nhận sau 2 - 3 ngày (Dự kiến)',
            logo: ''
          }
        ];
        setShippingMethods(fallback);
        setSelectedShipping(fallback[0]);
      } finally {
        setIsLoadingShipping(false);
      }
    };

    fetchShippingFees();
  }, [address]);
  
  const [selectedPayment, setSelectedPayment] = useState('COD');
  const [isEditingPayment, setIsEditingPayment] = useState(false);
  
  const itemTotal = checkoutCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingFee = selectedShipping ? selectedShipping.cost : 0;
  const xuDiscount = 500;
  const finalTotal = itemTotal + shippingFee - xuDiscount;

  const finalizeOrderCleanup = async () => {
    const boughtVariantIds = checkoutCart.map(item => item.variantId || item.variant_id);
    if (clearPurchasedItems) {
      await clearPurchasedItems(boughtVariantIds);
    } else if (clearCart) {
      await clearCart(); 
    }
    localStorage.removeItem('checkoutItems');
  };

  // ========================================================
  // 🎯 LUỒNG XỬ LÝ LƯU ĐƠN CHUNG (MICROSERVICES ĐỒNG BỘ)
  // ========================================================
  const executePlaceOrder = async (extraPaymentInfo = {}) => {
    if (!address) return alert("Vui lòng chọn địa chỉ giao hàng hợp lệ!");

    const targetDistrictId = address.district_id || address.to_district_id || address.districtId;
    const targetWardCode = address.ward_code || address.to_ward_code || address.wardCode || address.ward_id;

    const orderData = {
      thong_tin_giao_hang: {
        ten_nguoi_nhan: address.receiver_name || address.receiverName || "Khách hàng",
        so_dien_thoai: address.receiver_phone || address.receiverPhone || "0123456789",
        dia_chi_day_du: `${address.detail_address || address.detailAddress || ""}, ${address.ward_name || address.wardName || ""}, ${address.district_name || address.districtName || ""}, ${address.province_name || address.provinceName || ""}`
      },
      to_district_id: Number(targetDistrictId),
      to_ward_code: String(targetWardCode),
      weight: 1000,
      
      danh_sach_san_pham: checkoutCart.map(item => ({
        variant_id: String(item.variantId || item.variant_id), 
        quantity: Number(item.quantity),
        price: Number(item.price)
      })),
      
      don_vi_van_chuyen: selectedShipping?.name || 'Giao Hàng Nhanh (Dự phòng)',
      tong_tien_hang: itemTotal,
      phi_van_chuyen: shippingFee,
      so_tien_giam_gia: xuDiscount,
      tong_thanh_toan: finalTotal,
      phuong_thuc_thanh_toan: selectedPayment,
      ...extraPaymentInfo
    };

    try {
      // Bước 1: Khởi tạo hóa đơn thô (Pending) tại order-service
      const result = placeOrder ? await placeOrder(orderData) : await orderApi.post('/orders/place-order', orderData);
      const cleanResult = result?.data || result; 
      
      if (cleanResult && cleanResult.success) {
        const maDonHangText = cleanResult.ma_don_hang || cleanResult.data?.ma_don_hang;
        const tongThanhToanNum = cleanResult.tong_thanh_toan || finalTotal;

        // 🚀 Luồng 1: Nếu người dùng chọn thanh toán VNPay
        if (selectedPayment === 'VNPay') {
          const boughtVariantIds = checkoutCart.map(item => item.variantId || item.variant_id);
          localStorage.setItem('vnpay_pending_variants', JSON.stringify(boughtVariantIds));

          const paymentRes = await paymentApi.post('/payments/create-transaction', {
            ma_don_hang: maDonHangText,
            tong_thanh_toan: tongThanhToanNum,
            phuong_thuc_thanh_toan: 'VNPay'
          });

          if (paymentRes.data && paymentRes.data.paymentUrl) {
            window.location.href = `${paymentRes.data.paymentUrl}&vnp_BrowserNonce=${new Date().getTime()}`;
            return true;
          } else {
            throw new Error("Không lấy được link từ cổng thanh toán Payment Service!");
          }
        }

        // 🚀 Luồng 2: Trả về mã đơn hàng phục vụ cho việc nạp dữ liệu PayPal
        return maDonHangText;
      } else {
        alert("Có sự cố từ máy chủ đơn hàng, Demi kiểm tra lại nhé!");
        return false;
      }
    } catch (error) {
      console.error("🔥 Lỗi đặt đơn hoặc thanh toán tại Checkout:", error.response?.data || error.message);
      alert(error.response?.data?.message || "Xử lý đơn hàng thất bại. Vui lòng kiểm tra lại hệ thống!");
      return false;
    }
  };

  const handlePlaceOrder = async () => {
    if (!address) return alert("Vui lòng chọn địa chỉ giao hàng!");
    if (!selectedShipping) return alert("Vui lòng chọn phương thức vận chuyển!");
    if (checkoutCart.length === 0) return alert("Giỏ hàng thanh toán đang trống!");

    setIsPlacing(true);
    const orderSuccess = await executePlaceOrder();
    if (orderSuccess && selectedPayment === 'COD') {
      alert("🎉 Đặt hàng thành công! Đơn hàng thanh toán khi nhận hàng (COD) đã ghi nhận.");
      await finalizeOrderCleanup();
      navigate('/profile/orders');
    }
    setIsPlacing(false);
  };

  // Luồng xử lý bất đồng bộ sau khi SDK PayPal phản hồi Captures thành công
  const handlePayPalSuccess = async (details) => {
    try {
      setIsPlacing(true);
      const transactionId = details.purchase_units?.[0]?.payments?.captures?.[0]?.id || details.id;

      // 1. Lưu thông tin đơn hàng thô lên order-service, nhận về ma_don_hang tương ứng
      const maDonHangText = await executePlaceOrder({
        trang_thai_thanh_toan: "completed",
        paypal_transaction_id: transactionId,
        paypal_order_id: details.id
      });

      if (maDonHangText) {
        // 2. Gọi đồng bộ chéo sang payment-service để ghi dữ liệu bảng payment_transactions
        await paymentApi.post('/payments/create-transaction', {
          ma_don_hang: maDonHangText,
          tong_thanh_toan: finalTotal,
          phuong_thuc_thanh_toan: 'PayPal',
          gateway_transaction_id: transactionId,
          gateway_order_id: details.id,
          trang_thai: 'completed'
        });

        alert(`🎉 Đặt hàng thành công! Mã đơn hàng Demi Mart: ${maDonHangText}`);
        await finalizeOrderCleanup();
        navigate('/profile/orders');
      }
    } catch (err) {
      console.error("Lỗi callback xử lý hậu PayPal:", err);
      alert("Giao dịch PayPal thành công nhưng ghi nhận lịch sử hệ thống thất bại!");
    } finally {
      setIsPlacing(false);
    }
  };

  const isGlobalLoading = orderContextLoading || isPlacing;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-10">
      <div className="max-w-[1200px] mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* CỘT TRÁI: THÔNG TIN CHI TIẾT ĐƠN HÀNG */}
        <div className="lg:col-span-8 space-y-6 text-left">
          
          {/* 1. ĐỊA CHỈ */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-l-[#006c49]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[#006c49] flex items-center gap-2 font-black text-sm uppercase tracking-wider"><MapPin size={18} /> Địa chỉ nhận hàng</h2>
              <button onClick={() => setIsModalOpen(true)} className="text-[#006c49] font-black text-xs uppercase hover:underline">Thay đổi</button>
            </div>
            
            {isLoadingAddress ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 font-bold">
                <Loader2 className="animate-spin text-[#006c49]" size={16} /> Đang tải thông tin giao nhận...
              </div>
            ) : address ? (
              <div className="text-sm font-bold flex flex-wrap items-center gap-3">
                <div className="text-slate-900">{address.receiver_name || address.receiverName} <span className="font-mono text-[#006c49] bg-emerald-50 px-1.5 py-0.5 rounded text-xs ml-1">(+84) {address.receiver_phone || address.receiverPhone}</span></div>
                <p className="text-gray-500 font-medium">{address.detail_address || address.detailAddress}, {address.ward_name || address.wardName}, {address.district_name || address.districtName}, {address.province_name || address.provinceName}</p>
                {address.is_default && <span className="text-[10px] bg-red-50 text-red-500 font-black px-2 py-0.5 rounded uppercase tracking-wider">Mặc định</span>}
              </div>
            ) : (
              <div className="text-sm font-bold flex items-center justify-between">
                <p className="text-red-500">Bạn chưa có địa chỉ nhận hàng nào trong hệ thống.</p>
                <button onClick={() => navigate('/profile/address')} className="bg-[#006c49] text-white px-4 py-2 rounded-xl text-xs font-black uppercase">Thêm địa chỉ</button>
              </div>
            )}
          </section>

          {/* 2. SẢN PHẨM */}
          <section className="bg-white p-6 rounded-2xl shadow-sm">
            <div className="grid grid-cols-12 text-gray-400 text-xs font-black uppercase tracking-wider border-b pb-3 mb-4">
              <div className="col-span-6">Kiện hàng sản phẩm ({checkoutCart.length})</div>
              <div className="col-span-2 text-center">Đơn giá</div>
              <div className="col-span-2 text-center">Số lượng</div>
              <div className="col-span-2 text-right">Thành tiền</div>
            </div>
            {checkoutCart.map(item => (
              <div key={item.variantId || item.variant_id} className="grid grid-cols-12 items-center py-4 border-b border-gray-100 last:border-b-0">
                <div className="col-span-6 flex items-center gap-3 font-bold text-slate-800 text-sm">
                  <img src={getCleanImage(item.image)} className="w-12 h-12 rounded-xl object-cover border" alt={item.name} />
                  <span className="truncate pr-4">{item.name}</span>
                </div>
                <div className="col-span-2 text-center font-semibold text-slate-600 text-sm">{item.price.toLocaleString()}đ</div>
                <div className="col-span-2 text-center font-bold text-slate-800 text-sm">{item.quantity}</div>
                <div className="col-span-2 text-right font-black text-[#006c49] text-sm">{(item.price * item.quantity).toLocaleString()}đ</div>
              </div>
            ))}
          </section>

          {/* 3. ĐƠN VỊ VẬN CHUYỂN */}
          <section className="bg-white p-6 rounded-2xl shadow-sm space-y-4">
            <div className="flex justify-between items-center font-black text-sm uppercase text-[#006c49] border-b pb-3">
              <div className="flex gap-2"><Truck size={18} /> Gói cước vận chuyển</div>
              <button disabled={isLoadingShipping || !address} onClick={() => setIsShippingModalOpen(true)} className="text-xs hover:underline disabled:opacity-30 disabled:no-underline">Thay đổi</button>
            </div>

            {isLoadingShipping ? (
              <div className="flex items-center gap-2 text-sm text-amber-600 font-bold py-2">
                <Loader2 className="animate-spin" size={16} /> Đang kết nối định tuyến cước phí GHN...
              </div>
            ) : selectedShipping ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-50 border rounded-xl flex items-center justify-center p-1 shadow-sm">
                    {selectedShipping.logo ? <img src={selectedShipping.logo} className="w-full h-full object-contain" alt="logo" /> : <Truck className="text-[#006c49]" size={20} />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{selectedShipping.name}</p>
                    <p className="text-gray-400 text-xs font-semibold">{selectedShipping.days}</p>
                  </div>
                </div>
                <span className="font-black text-slate-900 text-sm">{selectedShipping.cost.toLocaleString()}đ</span>
              </div>
            ) : (
              <p className="text-xs text-gray-400 font-bold py-2">Vui lòng chọn địa chỉ hợp lệ để bốc báo giá từ đối tác.</p>
            )}

            <div className="border-t pt-4 flex justify-between items-center font-bold">
              <div className="flex gap-2 text-[#006c49] text-sm uppercase tracking-wider"><Tag size={18} /> Demi Mart Voucher</div>
              <button className="border border-[#006c49] text-[#006c49] px-4 py-1.5 rounded-xl hover:bg-emerald-50 text-xs font-black uppercase">Chọn mã giảm</button>
            </div>
          </section>

          {/* 4. PHƯƠNG THỨC THANH TOÁN */}
          <section className="bg-white p-6 rounded-2xl shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-[#006c49] flex items-center gap-2 font-black text-sm uppercase tracking-wider"><CreditCard size={18} /> Phương thức thanh toán</h2>
              <button onClick={() => setIsEditingPayment(!isEditingPayment)} className="text-[#006c49] font-black text-xs uppercase hover:underline">{isEditingPayment ? 'Xong' : 'Thay đổi'}</button>
            </div>
            {!isEditingPayment ? (
              <div className="px-5 py-2.5 rounded-xl border-2 border-[#006c49] bg-emerald-50/50 text-[#006c49] text-xs font-black uppercase tracking-wider inline-block">
                {selectedPayment === 'COD' ? 'Thanh toán khi nhận hàng (COD)' : selectedPayment}
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {['COD', 'PayPal', 'VNPay', 'MoMo', 'Banking'].map(method => (
                  <button key={method} onClick={() => { setSelectedPayment(method); setIsEditingPayment(false); }} className={`px-5 py-2.5 rounded-xl border-2 text-xs font-black uppercase tracking-wider transition-all ${selectedPayment === method ? 'border-[#006c49] bg-emerald-50/40 text-[#006c49]' : 'border-gray-200 text-gray-500'}`}>
                    {method === 'COD' ? 'Thanh toán khi nhận hàng' : method}
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* CỘT PHẢI: KẾT QUẢ TỔNG THÀNH TOÁN HÓA ĐƠN */}
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-24 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-left space-y-5">
            <h2 className="font-black italic text-slate-900 border-b pb-2 tracking-tight">TỔNG THANH TOÁN</h2>
            <div className="space-y-3 font-bold text-sm text-slate-600">
              <div className="flex justify-between"><span>Tổng tiền hàng</span> <span className="text-slate-900 font-semibold">{itemTotal.toLocaleString()}đ</span></div>
              <div className="flex justify-between"><span>Phí vận chuyển</span> <span className="text-slate-900 font-semibold">{shippingFee.toLocaleString()}đ</span></div>
              <div className="flex justify-between text-red-500"><span>Shopee Xu ưu đãi</span> <span>-{xuDiscount.toLocaleString()}đ</span></div>
              <div className="flex justify-between text-lg font-black text-[#006c49] border-t pt-3">
                <span>TỔNG ĐƠN</span> <span>{finalTotal.toLocaleString()}đ</span>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 text-center leading-relaxed">Nhấn "Đặt hàng" đồng nghĩa với việc bạn đồng ý tuân thủ theo các chính sách bảo mật và Điều khoản mua sắm của Demi Mart.</p>
            
            {/* KHỐI HIỂN THỊ NÚT THANH TOÁN ĐỘNG */}
            {selectedPayment === 'PayPal' ? (
              <div className="w-full pt-2">
                <PayPalButton 
                  amount={finalTotal} 
                  onSuccess={handlePayPalSuccess}
                  onError={() => alert("Giao dịch PayPal bị gián đoạn, Demi vui lòng kiểm tra lại cấu hình Client ID nhé!")}
                />
              </div>
            ) : (
              <button 
                onClick={handlePlaceOrder}
                disabled={isGlobalLoading || isLoadingShipping || !address || checkoutCart.length === 0}
                className="w-full bg-[#006c49] text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-[#005a3d] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm shadow-lg shadow-[#006c49]/20"
              >
                {isGlobalLoading && <Loader2 className="animate-spin" size={16} />}
                {isGlobalLoading ? 'Đang xử lý đơn...' : selectedPayment === 'VNPay' ? 'Thanh toán qua VNPay' : 'Xác nhận đặt hàng'}
              </button>
            )}
          </div>
        </div>
      </div>

      <AddressModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSelect={(addr) => setAddress(addr)} currentAddresses={addresses} selectedAddressId={address?.address_id || address?.id} onRefresh={fetchAddresses} />
      <ShippingModal isOpen={isShippingModalOpen} onClose={() => setIsShippingModalOpen(false)} onSelect={(method) => setSelectedShipping(method)} shippingMethods={shippingMethods} selectedMethodId={selectedShipping?.id} />
    </div>
  );
}