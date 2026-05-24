import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { MapPin, Truck, Tag, CreditCard } from 'lucide-react';

export default function Checkout() {
  const { cart: contextCart } = useCart();
  
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
  const navigate = useNavigate();
  
  // State quản lý thanh toán
  const [selectedPayment, setSelectedPayment] = useState('COD');
  const [isEditingPayment, setIsEditingPayment] = useState(false);
  
  const itemTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingFee = 78500;
  const xuDiscount = 500;
  const finalTotal = itemTotal + shippingFee - xuDiscount;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-10">
      <div className="max-w-[1200px] mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* CỘT TRÁI: THÔNG TIN CHI TIẾT */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* 1. ĐỊA CHỈ NHẬN HÀNG */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-[#006c49]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[#006c49] flex items-center gap-2 font-black"><MapPin size={20} /> ĐỊA CHỈ NHẬN HÀNG</h2>
              <button className="text-[#006c49] font-bold text-sm hover:underline">Thay đổi</button>
            </div>
            <div className="text-sm font-bold flex items-center gap-4">
              <p>Đạt Vũ (+84) 979 758 744</p>
              <p className="text-gray-600 font-normal">Thôn 1 Hòa Bình, Xã Đắk Liêng, Tỉnh Đắk Lắk</p>
              <span className="border border-[#006c49] text-[#006c49] px-2 rounded text-xs">Mặc định</span>
            </div>
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
                    onClick={() => {
                      setSelectedPayment(method);
                      setIsEditingPayment(false);
                    }}
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

        {/* CỘT PHẢI: TỔNG THANH TOÁN (STICKY) */}
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
            <button className="w-full mt-4 bg-[#006c49] text-white py-4 rounded-xl font-black uppercase hover:bg-[#005a3d] transition-all">Đặt hàng</button>
          </div>
        </div>
        
      </div>
    </div>
  );
}