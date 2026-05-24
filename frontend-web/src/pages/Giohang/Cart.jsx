import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag, ArrowLeft, ChevronRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function Cart() {
  const { cart, loading, removeFromCart, addToCart } = useCart();
  const navigate = useNavigate();

  // Tính tổng tiền an toàn: sử dụng || 0 để tránh NaN
  const totalPrice = cart.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);

  const handleUpdateQuantity = (item, type) => {
    // Truyền dữ liệu đầy đủ cho addToCart để Context xử lý
    addToCart({
      ...item,
      quantity: type === 'plus' ? 1 : -1
    });
  };

  // Hiển thị loading khi đang tải dữ liệu
  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#006c49]/20 border-t-[#006c49] rounded-full animate-spin"></div>
          <p className="text-slate-600 font-semibold">Đang tải giỏ hàng...</p>
        </div>
      </div>
    );
  }

  if (!cart || cart.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
        <div className="bg-slate-50 p-8 rounded-full mb-6">
          <ShoppingBag size={80} className="text-slate-200" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tight">Giỏ hàng trống</h2>
        <p className="text-slate-400 mt-2 font-medium">Demi Mart chưa thấy sản phẩm nào trong giỏ của bạn.</p>
        <Link to="/" className="mt-8 bg-[#006c49] text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest hover:bg-[#005a3d] transition-all shadow-lg shadow-emerald-100">
          Mua sắm ngay
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="w-full max-w-[1150px] 2xl:max-w-[1400px] mx-auto px-2 sm:px-6 lg:px-10 pt-4 lg:pt-10">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl lg:text-3xl font-black text-[#1a1a1a] uppercase italic tracking-tighter">
            Giỏ hàng của bạn <span className="text-[#006c49] font-black not-italic">({cart.length})</span>
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-4">
            {cart.map((item) => {
              // Cấu trúc URL an toàn: Kiểm tra nếu thiếu thông tin thì dùng giá trị mặc định
              const productDetailUrl = item.id ? `/${item.countryCode || 'vn'}/product/${item.categorySlug || 'san-pham'}/${item.id}` : '#';
              
              return (
                <div key={item.variantId} className="flex items-center gap-4 bg-white border border-slate-100 p-3 lg:p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <Link to={productDetailUrl} className="w-20 h-20 lg:w-28 lg:h-28 bg-[#f9f9f9] rounded-xl overflow-hidden flex-shrink-0 group">
                    <img src={item.image || 'https://via.placeholder.com/150'} alt={item.name} className="w-full h-full object-contain p-2" />
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-black text-slate-800 text-sm lg:text-base uppercase truncate italic">
                        {item.name || "Sản phẩm"}
                      </h3>
                      <button onClick={() => removeFromCart(item.variantId)} className="text-slate-300 hover:text-red-500 transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                      <span className="font-black text-[#006c49] text-base lg:text-lg italic">
                        {(item.price || 0).toLocaleString()}đ
                      </span>
                      
                      <div className="flex items-center bg-slate-50 border border-slate-100 rounded-lg p-0.5">
                        <button onClick={() => handleUpdateQuantity(item, 'minus')} className="w-7 h-7 flex items-center justify-center hover:bg-white rounded-md transition-all shadow-sm">
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center font-black text-sm">{item.quantity || 1}</span>
                        <button onClick={() => handleUpdateQuantity(item, 'plus')} className="w-7 h-7 flex items-center justify-center hover:bg-white rounded-md transition-all shadow-sm">
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-4 lg:sticky lg:top-24">
            <div className="bg-[#fcfcfc] border border-slate-100 rounded-[32px] p-6 lg:p-8 shadow-xl shadow-slate-200/40 space-y-6">
              <h2 className="text-lg font-black text-slate-800 uppercase italic border-b border-slate-100 pb-4">Tóm tắt đơn hàng</h2>
              <div className="flex justify-between items-baseline pt-4">
                <span className="font-black text-slate-800 uppercase italic">Tổng tiền</span>
                <span className="text-2xl font-black text-[#006c49] tracking-tighter">
                  {totalPrice.toLocaleString()}đ
                </span>
              </div>
              <button 
                onClick={() => navigate('/checkout')}
                className="w-full bg-[#ffb800] text-black py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-[#e6a600] transition-all"
              >
                Thanh toán ngay
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}