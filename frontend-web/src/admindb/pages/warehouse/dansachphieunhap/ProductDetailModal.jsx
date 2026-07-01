import React from "react";
import { createPortal } from "react-dom";

export default function ProductDetailModal({ isOpen, onClose, product }) {
  if (!isOpen || !product) return null;

  // Định dạng tiền tệ hiển thị nội bộ
  const formatVnCurrency = (num) => {
    if (typeof num === "string") return num;
    return new Intl.NumberFormat("vi-VN").format(num) + " đ";
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-[4px] p-4 font-sans antialiased">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden text-left animate-fadeIn">
        
        {/* MODAL HEADER */}
        <div className="p-6 pb-4 flex items-center justify-between border-b border-gray-50">
          <h2 className="text-xl font-bold text-gray-800 tracking-tight">Chi tiết Sản Phẩm</h2>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition text-2xl font-semibold leading-none cursor-pointer p-1"
          >
            &times;
          </button>
        </div>

        {/* MODAL BODY (Layout Grid chuẩn như ảnh figma image_292c64.png) */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* BÊN TRÁI: KHỐI ẢNH MẪU LỚN */}
          <div className="md:col-span-5 flex justify-center">
            <div className="w-full aspect-square rounded-xl bg-orange-50 border border-orange-100/50 shadow-inner flex items-center justify-center text-7xl select-none overflow-hidden p-4 min-h-[200px]">
              {/* Icon đại diện tạm thời hoặc ảnh thực tế */}
              <span className="transform hover:scale-110 transition-transform duration-300">
                {product.icon || "🍎"}
              </span>
            </div>
          </div>

          {/* BÊN PHẢI: KHỐI THÔNG TIN CHI TIẾT */}
          <div className="md:col-span-7 space-y-4">
            <div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Tên sản phẩm</span>
              <h3 className="text-2xl font-black text-gray-900 mt-0.5 leading-tight">{product.name}</h3>
            </div>

            <div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Mã SKU</span>
              <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-700 font-mono font-bold rounded-md text-xs select-all border border-emerald-100/30">
                {product.sku}
              </span>
            </div>

            {/* Grid thông tin thứ cấp */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-4 pt-2 border-t border-gray-50">
              <div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Danh mục</span>
                <p className="text-sm font-bold text-gray-800 mt-0.5">{product.category || "Trái cây"}</p>
              </div>

              <div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">ĐV Chuẩn</span>
                <p className="text-sm font-bold text-gray-800 mt-0.5">{product.unit || "kg"}</p>
              </div>

              <div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Tổng kho hiện tại</span>
                <p className="text-sm font-black text-emerald-600 mt-0.5">1.500 {product.unit || "kg"}</p>
              </div>

              <div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Giá nhập tham khảo</span>
                <p className="text-sm font-black text-gray-800 mt-0.5">{formatVnCurrency(product.price)}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-50">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Quy cách mặc định</span>
              <p className="text-sm font-bold text-gray-800 mt-0.5">
                1 {product.tradeUnit || "Thùng"} = {product.ratio || 20} {product.unit || "kg"}
              </p>
            </div>
          </div>

        </div>

        {/* MODAL FOOTER CHỨA NÚT ĐÓNG */}
        <div className="p-4 bg-slate-50 border-t border-gray-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-sm transition active:scale-95 cursor-pointer"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}