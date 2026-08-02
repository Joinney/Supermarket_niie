import React, { useState } from "react";
import ReactDOM from "react-dom";
import { Link } from "react-router-dom";
import { X, Sparkles, ArrowUpRight } from "lucide-react";
import ChromaKeyVideo from "./ChromaKeyVideo";

export default function ModalPoster({ country_code, currentStore }) {
  const [showPoster, setShowPoster] = useState(true);

  // Đường dẫn video trong thư mục public/
  const videoSrc = "/tomlizard.mp4";

  const handleClosePoster = () => {
    setShowPoster(false);
  };

  const currentPrefix = country_code
    ? `/${country_code.toLowerCase()}`
    : `/${currentStore?.code?.toLowerCase() || "vn"}`;

  // Dữ liệu 3 poster
  const posterItems = {
    leftTop: {
      image: "https://cdn.tgdd.vn/Files/2022/04/05/1424038/tu-4-4-11-4-2022-mung-gio-to-sale-du-cho-den-50-tai-bach-hoa-xanh-202204050949239955.jpg",
      title: "Sản phẩm khuyến mãi",
      subtitle: "Giảm đến 50%",
      tag: "⚡ HOT SALE",
      link: `${currentPrefix}/category/khuyen-mai-1`,
    },
    leftBottom: {
      image: "https://res.cloudinary.com/qb6mcdtq/image/upload/v1785527963/032e9180-d976-4e7d-b611-daef00665807_abqmbj.jpg",
      title: "Bộ sưu tập mới",
      subtitle: "Xem chi tiết ưu đãi",
      tag: "NEW Arrival",
      link: `${currentPrefix}/category/san-pham-moi`,
    },
    rightMain: {
      image: "https://res.cloudinary.com/qb6mcdtq/image/upload/v1785527988/aed29690-e9d4-4b06-94d7-7a3d9358b93d_etlpys.jpg",
      title: "Chương trình khuyến mãi cuối năm",
      subtitle: "Áp dụng toàn bộ hệ thống siêu thị Demi Mart",
      tag: "🎁 ĐẶC QUYỀN",
      link: `${currentPrefix}/category/khuyen-mai-chinh`,
    },
  };

  if (!showPoster) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-transparent pointer-events-none transition-all duration-300">
      
      {/* Layer nền trong suốt: Click ra ngoài để đóng modal */}
      <div
        className="absolute inset-0 pointer-events-auto"
        onClick={handleClosePoster}
        aria-hidden="true"
      />

      {/* Khung chứa tổng thể */}
      <div className="relative z-10 w-full max-w-[850px] pointer-events-auto">
        
        {/* Nút đóng X nằm bên ngoài góc trên bên phải */}
        <button
          onClick={handleClosePoster}
          className="absolute -top-12 right-0 z-50 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-slate-900/90 hover:bg-[#006c49] text-white backdrop-blur-md flex items-center justify-center shadow-2xl transition-all duration-300 hover:rotate-90 active:scale-95 border-2 border-white"
          aria-label="Đóng"
        >
          <X size={22} strokeWidth={2.5} />
        </button>

        {/* Khung Bento Grid Modal chính */}
        <div className="bg-transparent rounded-[32px] overflow-visible transition-all">
          
          {/* Bố cục Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 sm:gap-4 w-full md:h-[420px]">
            
            {/* Cột trái: 2 ảnh nhỏ */}
            <div className="col-span-12 md:col-span-5 flex flex-col gap-3.5 sm:gap-4 h-[260px] md:h-full">
              
              {/* === POSTER 1: HOT SALE (Góc trên trái) === */}
              <div className="relative flex-1 overflow-visible z-20">
                <Link
                  to={posterItems.leftTop.link}
                  onClick={handleClosePoster}
                  className="relative block h-full w-full rounded-2xl overflow-hidden group bg-white shadow-2xl border-2 border-white/90 hover:border-[#006c49] transition-all duration-300"
                >
                  <img
                    src={posterItems.leftTop.image}
                    alt={posterItems.leftTop.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                  
                  <span className="absolute top-2.5 left-2.5 z-10 bg-black/60 backdrop-blur-md text-amber-300 text-[9px] sm:text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border border-white/20 shadow-md">
                    {posterItems.leftTop.tag}
                  </span>

                  <div className="absolute inset-0 p-3 sm:p-3.5 flex flex-col justify-end text-white z-10 pr-24">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-black text-xs sm:text-sm leading-tight line-clamp-1 group-hover:text-emerald-300 transition-colors drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                        {posterItems.leftTop.title}
                      </span>
                      <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-300 flex-shrink-0 drop-shadow" />
                    </div>
                    <span className="text-[10px] sm:text-xs text-slate-100 mt-0.5 font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                      {posterItems.leftTop.subtitle}
                    </span>
                  </div>
                </Link>

                {/* TẮC KÈ ĐẶT CHUẨN TRÊN POSTER HOT SALE */}
                <ChromaKeyVideo
                  src={videoSrc}
                  className="absolute -bottom-1 right-0 w-32 h-40 sm:w-36 sm:h-44 z-30 pointer-events-none drop-shadow-[0_6px_10px_rgba(0,0,0,0.6)]"
                />
              </div>

              {/* === POSTER 2: NEW ARRIVAL (Góc dưới trái) === */}
              <Link
                to={posterItems.leftBottom.link}
                onClick={handleClosePoster}
                className="relative flex-1 rounded-2xl overflow-hidden group bg-white shadow-2xl border-2 border-white/90 hover:border-[#006c49] transition-all duration-300 block"
              >
                <img
                  src={posterItems.leftBottom.image}
                  alt={posterItems.leftBottom.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                />

                <span className="absolute top-2.5 left-2.5 z-10 bg-black/60 backdrop-blur-md text-emerald-300 text-[9px] sm:text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border border-white/20 shadow-md">
                  {posterItems.leftBottom.tag}
                </span>

                <div className="absolute inset-0 p-3 sm:p-3.5 flex flex-col justify-end text-white z-10">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-black text-xs sm:text-sm leading-tight line-clamp-1 group-hover:text-emerald-300 transition-colors drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                      {posterItems.leftBottom.title}
                    </span>
                    <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-300 flex-shrink-0 drop-shadow" />
                  </div>
                  <span className="text-[10px] sm:text-xs text-slate-100 mt-0.5 font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                    {posterItems.leftBottom.subtitle}
                  </span>
                </div>
              </Link>
            </div>

            {/* Cột phải: 1 ảnh lớn */}
            <div className="col-span-12 md:col-span-7 h-[280px] md:h-full relative">
              <Link
                to={posterItems.rightMain.link}
                onClick={handleClosePoster}
                className="relative block h-full rounded-2xl overflow-hidden group bg-white shadow-2xl border-2 border-white/90 hover:border-[#006c49] transition-all duration-300"
              >
                <img
                  src={posterItems.rightMain.image}
                  alt={posterItems.rightMain.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                />

                <span className="absolute top-3.5 left-3.5 z-10 bg-[#006c49] text-white text-[10px] sm:text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-lg border border-emerald-400/30 flex items-center gap-1">
                  <Sparkles size={12} /> {posterItems.rightMain.tag}
                </span>

                <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-end text-white z-10">
                  <div className="flex items-end justify-between gap-2">
                    <div>
                      <h3 className="font-black text-sm sm:text-xl leading-snug tracking-tight group-hover:text-emerald-300 transition-colors drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] line-clamp-2">
                        {posterItems.rightMain.title}
                      </h3>
                      <p className="text-[11px] sm:text-xs text-slate-100 mt-1 font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] line-clamp-1">
                        {posterItems.rightMain.subtitle}
                      </p>
                    </div>
                    
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-[#006c49] transition-all flex-shrink-0 shadow-md">
                      <ArrowUpRight size={18} strokeWidth={2.5} />
                    </div>
                  </div>
                </div>
              </Link>
            </div>

          </div>

          {/* Thanh chân Modal */}
          <div className="mt-4 text-center">
            <button
              onClick={handleClosePoster}
              className="text-xs text-slate-700 hover:text-slate-900 bg-white/90 hover:bg-white px-4 py-1.5 rounded-full shadow-lg font-black uppercase tracking-wider transition-all border border-slate-200"
            >
              Bỏ qua lần này
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}