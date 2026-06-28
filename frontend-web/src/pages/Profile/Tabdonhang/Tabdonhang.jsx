import React, { useState } from "react";
import { Package, MapPin } from "lucide-react";
import ModalLoTrinh from "./ModalLoTrinh"; // <--- Thêm import Modal mới

export default function Tabdonhang({ orders }) {
  // 1. Thêm State lưu đơn hàng đang được bấm xem lộ trình
  const [selectedOrderForMap, setSelectedOrderForMap] = useState(null);

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 space-y-2">
        <Package className="w-12 h-12 mx-auto opacity-40"/>
        <p className="text-sm font-bold">Bạn chưa có đơn hàng mua sắm nào.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      <h2 className="text-xl font-black text-slate-900 border-b border-slate-50 pb-4">Lịch sử giao dịch vận đơn</h2>
      <div className="space-y-4">
        {orders.map((order) => {
          const firstItem = order.items && order.items[0];
          const statusText = order.trang_thai_don_hang || 'Chờ xử lý';
          
          return (
            <div key={order.id || order.ma_don_hang} className="p-5 rounded-3xl bg-white border border-slate-100 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                <div>
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider block">Mã đơn: #{order.ma_don_hang}</span>
                  <span className="text-[10px] text-slate-400 font-bold">Đặt lúc: {new Date(order.ngay_tao || order.created_at || Date.now()).toLocaleDateString('vi-VN')}</span>
                </div>
                <span className="text-[10px] px-3 py-1 rounded-full font-black uppercase bg-emerald-50 text-[#006c49] border border-emerald-100">
                  {statusText}
                </span>
              </div>

              <div className="flex gap-4 items-center">
                <img src={firstItem?.image_url || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=150"} className="w-16 h-16 rounded-2xl object-cover border border-slate-100 bg-slate-50 shrink-0" alt="prod" />
                <div className="flex-1 min-w-0 text-left">
                  <h4 className="font-bold text-slate-800 text-sm truncate">{firstItem?.product_name || "Kiện hàng Demi Mart"}</h4>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Phân loại: {firstItem?.variant_name || "Mặc định"} • <b className="text-slate-700">x{firstItem?.quantity || 1}</b>
                  </p>
                  {order.items && order.items.length > 1 && (
                    <span className="text-[10px] text-[#006c49] font-bold italic block mt-1">+ {order.items.length - 1} sản phẩm khác</span>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs text-slate-400 block font-medium">Tổng tiền</span>
                  <span className="text-base font-black text-[#006c49]">{(Number(order.tong_thanh_toan) || 0).toLocaleString('vi-VN')}đ</span>
                </div>
              </div>

              <div className="border-t border-slate-50 pt-3 flex justify-between items-center">
                <span className="text-[11px] text-slate-500 font-semibold truncate max-w-[50%]">🚀 Giao bởi: {order.don_vi_van_chuyen || 'Siêu thị Demi'}</span>
                
                {/* 2. BẤM NÚT NÀY -> NẠP OBJECT ĐƠN HÀNG VÀO STATE */}
                <button 
                  onClick={() => setSelectedOrderForMap(order)}
                  className="bg-emerald-50 hover:bg-[#006c49] text-[#006c49] hover:text-white px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border border-emerald-200/60 cursor-pointer"
                >
                  <MapPin size={12}/> Theo dõi lộ trình
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. ĐẶT MODAL NẰM DƯỚI CÙNG DANH SÁCH ĐƠN */}
      <ModalLoTrinh 
  isOpen={!!selectedOrderForMap} 
  order={selectedOrderForMap} 
  onClose={() => setSelectedOrderForMap(null)} 
/>
    </div>
  );
}