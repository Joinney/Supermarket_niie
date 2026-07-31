import React, { useState } from "react";
import ReactDOM from "react-dom";
import { Link } from "react-router-dom";
import { X } from "lucide-react";

export default function ModalPoster({ country_code, currentStore }) {
  const [showPoster, setShowPoster] = useState(true);

  const handleClosePoster = () => {
    setShowPoster(false);
  };

  const currentPrefix = country_code
    ? `/${country_code.toLowerCase()}`
    : `/${currentStore?.code?.toLowerCase() || "vn"}`;

  // Dữ liệu 3 poster
  const posterItems = {
    leftTop: {
      image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=600&q=80",
      title: "Sản phẩm khuyến mãi",
      subtitle: "Giảm đến 50%",
      link: `${currentPrefix}/category/khuyen-mai-1`,
    },
    leftBottom: {
      image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80",
      title: "Bộ sưu tập mới",
      subtitle: "Xem chi tiết ưu đãi",
      link: `${currentPrefix}/category/san-pham-moi`,
    },
    rightMain: {
      image: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=800&q=80",
      title: "Chương trình khuyến mãi cuối năm",
      subtitle: "Áp dụng toàn bộ hệ thống",
      link: `${currentPrefix}/category/khuyen-mai-chinh`,
    },
  };

  if (!showPoster) return null;

  return ReactDOM.createPortal(
    /* Đã giảm độ mờ nền: Dùng bg-black/40 thay vì bg-black/75 và bỏ backdrop-blur hoàn toàn */
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/40 transition-all duration-300">
      
      {/* Layer nền trong suốt: Click ra ngoài để đóng modal */}
      <div
        className="absolute inset-0"
        onClick={handleClosePoster}
        aria-hidden="true"
      />

      {/* Khung Bento Grid Modal */}
      <div className="relative z-10 w-full max-w-[720px] bg-white rounded-3xl p-3 sm:p-4 shadow-2xl transition-all border border-slate-100">
        
        {/* Nút đóng X nổi bật */}
        <button
          onClick={handleClosePoster}
          className="absolute -top-3 -right-3 z-30 w-9 h-9 rounded-full bg-slate-900 hover:bg-black text-white flex items-center justify-center shadow-lg transition-all active:scale-95 border-2 border-white"
          aria-label="Đóng"
        >
          <X size={18} />
        </button>

        {/* Bố cục Bento Grid 3 ảnh */}
        <div className="grid grid-cols-12 gap-2.5 sm:gap-3 aspect-[4/3] sm:aspect-[16/10] w-full">
          
          {/* Cột trái: 2 ảnh nhỏ */}
          <div className="col-span-5 flex flex-col gap-2.5 sm:gap-3 h-full">
            
            {/* Ảnh nhỏ góc trên trái */}
            <Link
              to={posterItems.leftTop.link}
              onClick={handleClosePoster}
              className="relative flex-1 rounded-2xl overflow-hidden group bg-slate-100 border border-slate-200/60 shadow-sm hover:shadow-md transition-all"
            >
              <img
                src={posterItems.leftTop.image}
                alt={posterItems.leftTop.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-3 flex flex-col justify-end text-white">
                <span className="font-bold text-xs sm:text-sm leading-tight line-clamp-1">
                  {posterItems.leftTop.title}
                </span>
                <span className="text-[10px] sm:text-xs text-slate-200 mt-0.5">
                  {posterItems.leftTop.subtitle}
                </span>
              </div>
            </Link>

            {/* Ảnh nhỏ góc dưới trái */}
            <Link
              to={posterItems.leftBottom.link}
              onClick={handleClosePoster}
              className="relative flex-1 rounded-2xl overflow-hidden group bg-slate-100 border border-slate-200/60 shadow-sm hover:shadow-md transition-all"
            >
              <img
                src={posterItems.leftBottom.image}
                alt={posterItems.leftBottom.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-3 flex flex-col justify-end text-white">
                <span className="font-bold text-xs sm:text-sm leading-tight line-clamp-1">
                  {posterItems.leftBottom.title}
                </span>
                <span className="text-[10px] sm:text-xs text-slate-200 mt-0.5">
                  {posterItems.leftBottom.subtitle}
                </span>
              </div>
            </Link>
          </div>

          {/* Cột phải: 1 ảnh lớn chiếm trọn chiều cao */}
          <div className="col-span-7 h-full">
            <Link
              to={posterItems.rightMain.link}
              onClick={handleClosePoster}
              className="relative block h-full rounded-2xl overflow-hidden group bg-slate-100 border border-slate-200/60 shadow-sm hover:shadow-md transition-all"
            >
              <img
                src={posterItems.rightMain.image}
                alt={posterItems.rightMain.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent p-4 sm:p-5 flex flex-col justify-end text-white">
                <span className="font-black text-sm sm:text-lg leading-snug">
                  {posterItems.rightMain.title}
                </span>
                <span className="text-xs text-slate-200 mt-1">
                  {posterItems.rightMain.subtitle}
                </span>
              </div>
            </Link>
          </div>

        </div>

        {/* Nút bỏ qua nhẹ nhàng phía dưới */}
        <div className="mt-2.5 text-center">
          <button
            onClick={handleClosePoster}
            className="text-[11px] sm:text-xs text-slate-400 hover:text-slate-700 font-medium uppercase tracking-wider py-1 transition-colors"
          >
            Bỏ qua lần này
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}