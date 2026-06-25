import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag, ArrowLeft, CreditCard } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function Cart() {
  const { cart, loading, removeFromCart, addToCart } = useCart();
  const navigate = useNavigate();
  const [selectedItems, setSelectedItems] = useState([]);

  // Đồng bộ danh sách các item được chọn mặc định khi giỏ hàng thay đổi
  useEffect(() => {
    if (cart && cart.length > 0) {
      setSelectedItems(cart.map(item => item.variantId));
    } else {
      setSelectedItems([]);
    }
  }, [cart]);

  const toggleSelectItem = (variantId) => {
    setSelectedItems(prev => 
      prev.includes(variantId) ? prev.filter(id => id !== variantId) : [...prev, variantId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedItems(selectedItems.length === cart.length ? [] : cart.map(item => item.variantId));
  };

  const handleUpdateQuantity = (item, type) => {
    if (type === 'minus' && (item.quantity || 1) <= 1) return;
    // Cập nhật số lượng chênh lệch (+1 hoặc -1) thông qua hàm context
    addToCart({ ...item, quantity: type === 'plus' ? 1 : -1 });
  };

  const selectedCartItems = cart.filter(item => selectedItems.includes(item.variantId));
  const totalPrice = selectedCartItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);

  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      alert("Vui lòng chọn ít nhất một sản phẩm để tiến hành thanh toán!");
      return;
    }
    // Lưu các sản phẩm được chọn mua vào bộ nhớ tạm trước khi chuyển hướng checkout
    localStorage.setItem('checkoutItems', JSON.stringify(selectedCartItems));
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-white">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-[#006c49]/10 border-t-[#006c49] rounded-full animate-spin"></div>
          <ShoppingBag size={24} className="absolute text-[#006c49] animate-pulse" />
        </div>
        <p className="text-slate-500 font-bold tracking-wide mt-4 uppercase italic text-xs">Đang đồng bộ túi hàng...</p>
      </div>
    );
  }

  if (!cart || cart.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 bg-slate-50/40">
        <div className="bg-white border border-slate-100 p-8 rounded-[40px] shadow-xl shadow-slate-100/30 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag size={36} className="text-[#006c49]" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tight">Giỏ hàng trống</h2>
          <p className="text-slate-400 mt-2 font-medium text-sm leading-relaxed">
            Không gian giỏ hàng của bạn đang trống. Hãy quay lại trang chủ và chọn những sản phẩm ưng ý nhất nhé!
          </p>
          <Link to="/" className="mt-8 inline-block w-full bg-[#006c49] text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-[#005a3d] transition-all shadow-lg shadow-emerald-700/10 active:scale-[0.98]">
            Quay lại mua sắm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/40 pb-24 text-left">
      <div className="w-full max-w-[1250px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 lg:pt-12">
        
        {/* Nút quay lại và Tiêu đề */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate(-1)} className="p-3 bg-white border border-slate-100 hover:bg-slate-50 rounded-2xl transition-all shadow-sm active:scale-95">
            <ArrowLeft size={18} className="text-slate-700" />
          </button>
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 uppercase italic tracking-tighter flex items-center gap-3">
              Giỏ hàng của bạn 
              <span className="bg-emerald-50 text-[#006c49] font-black not-italic text-xs lg:text-sm px-3 py-1 rounded-xl border border-emerald-100">
                {cart.length} mục
              </span>
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* CỘT DANH SÁCH SẢN PHẨM */}
          <div className="lg:col-span-8 space-y-4">
            {/* Thanh chọn tất cả */}
            <div className="flex items-center justify-between bg-white border border-slate-100 px-5 py-4 rounded-2xl shadow-sm">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={selectedItems.length === cart.length && cart.length > 0} 
                  onChange={toggleSelectAll} 
                  className="w-5 h-5 rounded-md accent-[#006c49] cursor-pointer border-slate-300 transition-all" 
                />
                <span className="font-black text-slate-700 text-xs lg:text-sm uppercase tracking-wide">
                  Chọn tất cả ({selectedItems.length}/{cart.length})
                </span>
              </label>
              {selectedItems.length > 0 && (
                <span className="text-xs font-bold text-[#006c49] bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">
                  Đã chọn {selectedItems.length} sản phẩm
                </span>
              )}
            </div>

            {/* Loop danh sách giỏ hàng */}
            <div className="space-y-4">
              {cart.map((item) => {
                const isSelected = selectedItems.includes(item.variantId);
                
                // Chuẩn hóa cấu trúc Route quốc tế: /:countryCode/product/:categorySlug/:productId
                const country = item.countryCode || 'vn';
                const category = item.categorySlug || 'san-pham';
                const pId = item.productId || item.id; 
                const productDetailUrl = pId ? `/${country.toLowerCase()}/product/${category}/${pId}` : '#';
                
                return (
                  <div 
                    key={item.variantId} 
                    className={`flex items-center gap-4 bg-white border p-4 rounded-3xl shadow-sm transition-all duration-300 ${
                      isSelected ? 'border-[#006c49]/30 bg-emerald-50/5' : 'border-slate-100'
                    }`}
                  >
                    <input 
                      type="checkbox" 
                      checked={isSelected} 
                      onChange={() => toggleSelectItem(item.variantId)} 
                      className="w-5 h-5 rounded-md accent-[#006c49] cursor-pointer border-slate-300" 
                    />

                    <Link to={productDetailUrl} className="w-20 h-20 lg:w-24 lg:h-24 bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center p-2 group transition-all hover:bg-slate-100/60">
                      <img src={item.image || 'https://via.placeholder.com/150'} alt={item.name} className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-102" />
                    </Link>

                    <div className="flex-1 min-w-0 py-1 text-left">
                      <div className="flex justify-between items-start gap-4">
                        <div className="min-w-0 flex-1">
                          {/* Tên sản phẩm gốc */}
                          <Link to={productDetailUrl} className="font-black text-slate-800 text-sm lg:text-base uppercase truncate italic hover:text-[#006c49] transition-colors block">
                            {item.name || "Sản phẩm"}
                          </Link>
                          {/* Hiển thị chi tiết nhãn biến thể (Vị, kích thước, quy chuẩn...) */}
                          {item.variantName && (
                            <span className="inline-block mt-1 text-[11px] font-bold tracking-wide text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                              Phân loại: {item.variantName}
                            </span>
                          )}
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.variantId)} 
                          className="text-slate-300 hover:text-red-500 transition-colors p-1.5 hover:bg-red-50 rounded-xl flex-shrink-0"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-black text-[#006c49] text-base lg:text-lg italic tracking-tight">
                            {(item.price || 0).toLocaleString()}đ
                          </span>
                        </div>
                        
                        <div className="flex items-center bg-slate-50 border border-slate-100 rounded-xl p-1 shadow-inner">
                          <button 
                            onClick={() => handleUpdateQuantity(item, 'minus')} 
                            disabled={(item.quantity || 1) <= 1}
                            className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                          >
                            <Minus size={12} strokeWidth={2.5} />
                          </button>
                          <span className="w-10 text-center font-black text-slate-800 text-sm">{item.quantity || 1}</span>
                          <button 
                            onClick={() => handleUpdateQuantity(item, 'plus')} 
                            className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg transition-all"
                          >
                            <Plus size={12} strokeWidth={2.5} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CỘT TÓM TẮT HÓA ĐƠN */}
          <div className="lg:col-span-4 lg:sticky lg:top-24">
            <div className="bg-white border border-slate-100 rounded-[32px] p-6 lg:p-8 shadow-xl shadow-slate-200/20 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/40 rounded-full blur-2xl -z-10"></div>
              
              <h2 className="text-sm font-black text-slate-800 uppercase italic tracking-wider border-b border-slate-100 pb-4 flex items-center gap-2">
                <CreditCard size={16} className="text-[#006c49]" /> Tóm tắt hóa đơn
              </h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs lg:text-sm font-bold text-slate-500">
                  <span>Mục sản phẩm lựa chọn</span>
                  <span className="font-mono text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-lg text-xs">{selectedItems.length} dòng</span>
                </div>
                
                <div className="flex justify-between items-baseline pt-3 border-t border-dashed border-slate-100">
                  <span className="font-black text-slate-800 uppercase italic text-xs lg:text-sm">Tổng tiền tạm tính</span>
                  <span className="text-xl lg:text-2xl font-black text-[#006c49] tracking-tighter">
                    {totalPrice.toLocaleString()}đ
                  </span>
                </div>
              </div>

              <button 
                onClick={handleCheckout}
                disabled={selectedItems.length === 0}
                className="w-full bg-[#ffb800] text-slate-900 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-[#e6a600] transition-all shadow-lg shadow-amber-500/5 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#ffb800]"
              >
                Thanh toán ngay ({selectedItems.length})
              </button>
              
              <p className="text-[11px] text-slate-400 text-center font-semibold leading-relaxed pt-1">
                Tỷ lệ chiết khấu giảm giá, voucher và các loại cước phí vận chuyển GHN sẽ được tính chéo chính xác tại trang checkout.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}