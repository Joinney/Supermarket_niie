import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { MapPin, Truck, Tag, CreditCard, Loader2 } from 'lucide-react';
import { useOrder } from '../../context/OrderContext';
import { authApi } from '../../api/axios';
import AddressModal from '../Checkout/AddressModal'; // Đảm bảo đường dẫn import chính xác

export default function Checkout() {
  const { cart: contextCart } = useCart();
  const { placeOrder, loading } = useOrder();
  const navigate = useNavigate();

  // State mới bổ sung phục vụ cho logic địa chỉ động & Modal
  const [address, setAddress] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [isLoadingAddress, setIsLoadingAddress] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Hook lấy danh sách địa chỉ thực từ auth-service
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const res = await authApi.get('/addresses');
        const data = res.data.data || res.data;
        setAddresses(data);
        // Ưu tiên tìm địa chỉ có thuộc tính mặc định bằng true, nếu không có lấy cái đầu tiên
        const defaultAddr = data.find(a => a.is_default === true) || data[0];
        setAddress(defaultAddr);
      } catch (err) {
        console.error("Lỗi fetch địa chỉ:", err);
      } finally {
        setIsLoadingAddress(false);
      }
    };
    fetchAddresses();
  }, []);

  // Dữ liệu sản phẩm giả để test giao diện
  const mockCart = [
    {
      variantId: 'v1',
      name: 'Quay tròn 360 độ Máy dọa chim (Phiên bản âm thanh)',
      price: 203700,
      quantity: 2,
      image: 'https://images.unsplash.com/photo-1594498652286-66770e28f000?w=100'
    },
    {
      variantId: 'v2',
      name: 'Bảo hiểm bảo vệ người tiêu dùng (Mới)',
      price: 2999,
      quantity: 2,
      image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=100'
    }
  ];

  const cart = contextCart && contextCart.length > 0 ? contextCart : mockCart;
  
  // State quản lý thanh toán
  const [selectedPayment, setSelectedPayment] = useState('COD');
  const [isEditingPayment, setIsEditingPayment] = useState(false);
  
  const itemTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingFee = 78500;
  const xuDiscount = 500;
  const finalTotal = itemTotal + shippingFee - xuDiscount;

  // Hàm xử lý đặt hàng kết hợp dữ liệu địa chỉ động
  const handlePlaceOrder = async () => {
    if (!address) return alert("Vui lòng cập nhật hoặc chọn địa chỉ giao hàng trước khi đặt!");

    const orderData = {
      thong_tin_giao_hang: {
        ten_nguoi_nhan: address.receiver_name,
        so_dien_thoai: address.receiver_phone,
        dia_chi_day_du: `${address.detail_address}, ${address.ward_name}, ${address.district_name}, ${address.province_name}`
      },
      danh_sach_san_pham: cart,
      tong_tien_hang: itemTotal,
      phi_van_chuyen: shippingFee,
      so_tien_giam_gia: xuDiscount,
      tong_thanh_toan: finalTotal,
      phuong_thuc_thanh_toan: selectedPayment
    };

    try {
      const result = await placeOrder(orderData);
      if (result && result.ma_don_hang) {
        alert(`Đặt hàng thành công! Mã đơn hàng: ${result.ma_don_hang}`);
        // navigate('/orders'); // Điều hướng tới trang lịch sử đơn hàng
      }
    } catch (error) {
      alert("Đặt hàng thất bại, vui lòng thử lại!");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-10">
      <div className="max-w-[1200px] mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* CỘT TRÁI: THÔNG TIN CHI TIẾT */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* 1. ĐỊA CHỈ NHẬN HÀNG */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-[#006c49]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[#006c49] flex items-center gap-2 font-black"><MapPin size={20} /> ĐỊA CHỈ NHẬN HÀNG</h2>
              <button 
                onClick={() => setIsModalOpen(true)} 
                className="text-[#006c49] font-bold text-sm hover:underline"
              >
                Thay đổi
              </button>
            </div>
            
            {isLoadingAddress ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 font-bold">
                <Loader2 className="animate-spin text-[#006c49]" size={16} />
                Đang tải dữ liệu địa chỉ...
              </div>
            ) : address ? (
              <div className="text-sm font-bold flex items-center gap-4">
                <p>{address.receiver_name} (+84) {address.receiver_phone}</p>
                <p className="text-gray-600 font-normal">
                  {address.detail_address}, {address.ward_name}, {address.district_name}, {address.province_name}
                </p>
                {address.is_default && (
                  <span className="border border-[#006c49] text-[#006c49] px-2 rounded text-xs">Mặc định</span>
                )}
              </div>
            ) : (
              <div className="text-sm font-bold flex items-center justify-between">
                <p className="text-red-500">Bạn chưa thiết lập địa chỉ giao hàng nhận hàng nào.</p>
                <button 
                  onClick={() => navigate('/profile/addresses')} 
                  className="bg-[#006c49] text-white px-4 py-1.5 rounded-xl text-xs hover:bg-[#005a3d] transition-all"
                >
                  Thêm địa chỉ ngay
                </button>
              </div>
            )}
          </section>

          {/* 2. DANH SÁCH SẢN PHẨM */}
          <section className="bg-white p-6 rounded-2xl shadow-sm">
            <div className="grid grid-cols-12 text-gray-500 text-sm font-bold mb-4">
              <div className="col-span-6">Sản phẩm</div>
              <div className="col-span-2 text-center">Đơn giá</div>
              <div className="col-span-2 text-center">Số lượng</div>
              <div className="col-span-2 text-right">Thành tiền</div>
            </div>
            {cart.map(item => (
              <div key={item.variantId} className="grid grid-cols-12 items-center py-4 border-b border-gray-100">
                <div className="col-span-6 flex items-center gap-3 font-bold">
                  <img src={item.image} className="w-12 h-12 rounded object-cover" alt={item.name} />
                  {item.name}
                </div>
                <div className="col-span-2 text-center">{item.price.toLocaleString()}đ</div>
                <div className="col-span-2 text-center">{item.quantity}</div>
                <div className="col-span-2 text-right font-black text-[#006c49]">{(item.price * item.quantity).toLocaleString()}đ</div>
              </div>
            ))}
          </section>

          {/* 3. VẬN CHUYỂN & VOUCHER */}
          <section className="bg-white p-6 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center font-black mb-4 text-[#006c49]">
              <div className="flex gap-3"><Truck size={20} /> Phương thức vận chuyển</div>
              <button className="text-sm hover:underline">Thay đổi</button>
            </div>
            <div className="pl-9 flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                  <Truck className="text-[#006c49]" size={24} />
                </div>
                <div>
                  <p className="font-bold">Nhanh</p>
                  <p className="text-gray-500 text-xs font-normal">Nhận từ 28 Th05 - 30 Th05</p>
                </div>
              </div>
              <span className="font-bold">{shippingFee.toLocaleString()}đ</span>
            </div>
            <div className="border-t pt-4 flex justify-between items-center font-bold pl-9">
              <div className="flex gap-3 text-[#006c49]"><Tag size={20} /> Demi Mart Voucher</div>
              <button className="border border-[#006c49] text-[#006c49] px-4 py-1 rounded hover:bg-emerald-50 text-sm">Chọn Voucher</button>
            </div>
          </section>

          {/* 4. THANH TOÁN */}
          <section className="bg-white p-6 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[#006c49] flex items-center gap-2 font-black uppercase">
                <CreditCard size={20} /> Phương thức thanh toán
              </h2>
              <button 
                onClick={() => setIsEditingPayment(!isEditingPayment)}
                className="text-[#006c49] font-bold text-sm hover:underline"
              >
                {isEditingPayment ? 'Xong' : 'Thay đổi'}
              </button>
            </div>
            {!isEditingPayment ? (
              <div className="px-6 py-3 rounded-xl border-2 border-[#006c49] bg-emerald-50 text-[#006c49] font-bold inline-block">
                {selectedPayment === 'COD' ? 'Thanh toán khi nhận hàng' : selectedPayment}
              </div>
            ) : (
              <div className="flex gap-4">
                {['COD', 'MoMo', 'Banking'].map(method => (
                  <button 
                    key={method}
                    onClick={() => { setSelectedPayment(method); setIsEditingPayment(false); }}
                    className={`px-6 py-3 rounded-xl border-2 font-bold transition-all ${
                      selectedPayment === method 
                        ? 'border-[#006c49] bg-emerald-50 text-[#006c49]' 
                        : 'border-gray-200 text-gray-700'
                    }`}
                  >
                    {method === 'COD' ? 'Thanh toán khi nhận hàng' : method}
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* CỘT PHẢI: TỔNG THANH TOÁN */}
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-24 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="font-black italic mb-6">TỔNG THANH TOÁN</h2>
            <div className="space-y-4 font-bold text-sm">
              <div className="flex justify-between"><span>Tổng tiền hàng</span> <span>{itemTotal.toLocaleString()}đ</span></div>
              <div className="flex justify-between"><span>Phí vận chuyển</span> <span>{shippingFee.toLocaleString()}đ</span></div>
              <div className="flex justify-between text-red-500"><span>Shopee Xu</span> <span>-{xuDiscount.toLocaleString()}đ</span></div>
              <div className="flex justify-between text-xl font-black text-[#006c49] border-t pt-4">
                <span>TỔNG</span> <span>{finalTotal.toLocaleString()}đ</span>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-6 text-center">Nhấn "Đặt hàng" đồng nghĩa với việc bạn đồng ý tuân theo Điều khoản Demi Mart.</p>
            <button 
              onClick={handlePlaceOrder}
              disabled={loading}
              className="w-full mt-4 bg-[#006c49] text-white py-4 rounded-xl font-black uppercase hover:bg-[#005a3d] transition-all disabled:opacity-50"
            >
              {loading ? 'Đang xử lý...' : 'Đặt hàng'}
            </button>
          </div>
        </div>
      </div>

      {/* RENDER MODAL POPUP QUẢN LÝ ĐỊA CHỈ */}
      <AddressModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={(addr) => setAddress(addr)}
        currentAddresses={addresses}
        selectedAddressId={address?.address_id}
      />
    </div>
  );
}