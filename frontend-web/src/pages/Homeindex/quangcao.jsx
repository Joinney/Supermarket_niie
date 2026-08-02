import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { ArrowRight, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { promotionApi } from '../../api/axios'; 

export default function QuangCao({ t }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Ref và State phục vụ trượt từng banner + Nhấn giữ kéo chuột
  const catScrollRef = useRef(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Chỉ số slider SNAP EBT
  const [ebtCurrentIndex, setEbtCurrentIndex] = useState(0);

  // 1. TẢI CẤU HÌNH BAN ĐẦU & KẾT NỐI REALTIME SOCKET.IO
  useEffect(() => {
    let isMounted = true;

    // Fetch dữ liệu khởi tạo qua promotionApi
    const fetchAds = async () => {
      try {
        const res = await promotionApi.get('/homeposters');
        if (isMounted && res.data?.success && res.data?.data) {
          setData(res.data.data);
        }
      } catch (err) {
        // Giữ UI mặc định mượt mà khi backend không có data
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAds();

    // Trích xuất tự động Origin Domain từ promotionApi (Gateway 5000 / Production)
    const apiBaseUrl = promotionApi.defaults.baseURL || "";
    let socketUrl = "http://localhost:5000";

    try {
      if (apiBaseUrl) {
        socketUrl = new URL(apiBaseUrl).origin;
      }
    } catch (e) {
      socketUrl = window.location.origin;
    }

    // Khởi tạo Socket.IO kết nối linh hoạt
    const socket = io(socketUrl, {
      reconnectionAttempts: 5,
      timeout: 10000,
      transports: ['websocket', 'polling']
    });

    socket.on('homeposter_updated', (updatedData) => {
      if (isMounted) setData(updatedData);
    });

    return () => {
      isMounted = false;
      socket.off('homeposter_updated');
      setTimeout(() => {
        if (socket.connected) {
          socket.disconnect();
        }
      }, 100);
    };
  }, []);

  // 2. AUTOPLAY SLIDE BANNER DANH MỤC
  useEffect(() => {
    if (!data || !data.catAutoPlay || !data.categoryBanners || data.categoryBanners.length <= 4) return;
    const timer = setInterval(() => {
      if (catScrollRef.current) {
        const container = catScrollRef.current;
        const cardWidth = container.firstElementChild?.offsetWidth || 260;
        const gap = 16;
        const maxScrollLeft = container.scrollWidth - container.clientWidth;

        if (container.scrollLeft >= maxScrollLeft - 5) {
          container.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          container.scrollBy({ left: cardWidth + gap, behavior: 'smooth' });
        }
      }
    }, (data.catInterval || 4) * 1000);

    return () => clearInterval(timer);
  }, [data]);

  // 3. AUTOPLAY SLIDE SNAP EBT
  useEffect(() => {
    if (!data || !data.ebtAutoPlay || (data.ebtList && data.ebtList.length <= 1)) return;
    const timer = setInterval(() => {
      setEbtCurrentIndex((prev) => (prev + 1) % data.ebtList.length);
    }, (data.ebtInterval || 5) * 1000);
    return () => clearInterval(timer);
  }, [data]);

  // HÀM XỬ LÝ BẤM MŨI TÊN TRƯỢT TỪNG BANNER
  const handleScrollCategory = (direction) => {
    if (!catScrollRef.current) return;
    const container = catScrollRef.current;
    const cardWidth = container.firstElementChild?.offsetWidth || 260;
    const gap = 16;
    const scrollAmount = cardWidth + gap;

    if (direction === 'left') {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // CÁC HÀM XỬ LÝ NHẤN GIỮ KÉO CHUỘT
  const handleMouseDown = (e) => {
    setIsMouseDown(true);
    setStartX(e.pageX - catScrollRef.current.offsetLeft);
    setScrollLeft(catScrollRef.current.scrollLeft);
  };

  const handleMouseLeaveOrUp = () => {
    setIsMouseDown(false);
  };

  const handleMouseMove = (e) => {
    if (!isMouseDown || !catScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - catScrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    catScrollRef.current.scrollLeft = scrollLeft - walk;
  };

  // Dữ liệu giao diện mặc định (Fallback UI)
  const heroBanner = data?.heroBanner || {
    titleMain: 'Chợ Việt Nam & Châu Á',
    titleHighlight: 'trực tuyến lớn nhất Mỹ',
    offerBadge: '🚚 Giao hàng miễn phí cho 5 đơn đầu tiên',
    offerSub: '*Giá trị tối thiểu $35, thay đổi theo từng khu vực',
    giftBadgeValue: '$25',
    giftBadgeText: 'Trị giá*',
    truckImage: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80',
    qrImage: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://demimart.com/app',
    qrText: 'Quét mã để tải app',
    appReviewCount: 'Hơn 1 triệu lượt review'
  };

  const categoryBanners = data?.categoryBanners?.length > 0 ? data.categoryBanners : [
    { id: 1, tag: 'Đặc sản', title: 'Xôi Chè\nViệt Nam', subtitle: 'Dẻo thơm hương nếp ngọt thanh vị chè!', image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=400&h=300&q=80', gradient: 'from-pink-950/95 via-pink-700/60 to-pink-600/20', btnColor: 'text-pink-600', imageOnly: false, showButton: true },
    { id: 2, tag: 'Thực phẩm thiết yếu', title: 'Món chay\nViệt Nam', subtitle: 'Nguyên liệu thanh đạm, bữa ăn hài hòa', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&h=300&q=80', gradient: 'from-emerald-950/95 via-emerald-800/60 to-transparent', btnColor: 'text-emerald-800', imageOnly: false, showButton: true },
    { id: 3, tag: 'Thực phẩm thiết yếu', title: 'Cà phê & Trà', subtitle: 'Cho mỗi ngày đều tràn năng lượng!', image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=400&h=300&q=80', gradient: 'from-teal-950/95 via-teal-600/50 to-transparent', btnColor: 'text-teal-600', imageOnly: false, showButton: true },
    { id: 4, tag: 'Đặc sản', title: 'Bánh Mì', subtitle: 'Khám phá nguyên bản Bánh Mì Việt Nam', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&h=300&q=80', gradient: 'from-amber-950/95 via-amber-700/50 to-transparent', btnColor: 'text-amber-700', imageOnly: false, showButton: true }
  ];

  const ebtList = data?.ebtList?.length > 0 ? data.ebtList : [
    { id: 1, useBannerImage: false, bannerImageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1200&h=120&q=80', title: 'Chúng tôi hiện chấp nhận thanh toán SNAP EBT', subtitle: 'Sắm thực phẩm Việt & được giao hàng miễn phí', note: '*Điều kiện EBT khác nhau theo từng tiểu bang.' }
  ];

  const currentEbt = ebtList[ebtCurrentIndex] || ebtList[0];

  return (
    <div className="w-full space-y-6 text-left selection:bg-emerald-100">
      {/* 1. TOP HERO BANNER */}
      <div className="px-6 md:px-10 pt-4 flex flex-col lg:flex-row items-center justify-between gap-6 bg-gradient-to-r from-[#f4faf7] via-white to-orange-50/20 rounded-[40px] pb-6 border border-[#e6f0ed]">
        <div className="space-y-4 max-w-xl">
          <h1 className="text-4xl md:text-[46px] font-black text-[#161b22] tracking-tight leading-[1.1]">
            {heroBanner.titleMain}<br />
            <span className="text-[#006c49]">{heroBanner.titleHighlight}</span>
          </h1>
          
          <div className="inline-flex flex-col items-start gap-1">
            <div className="bg-[#fea619] text-[#684000] px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wide shadow-sm flex items-center gap-1.5">
              {heroBanner.offerBadge}
            </div>
            <p className="text-[10px] text-slate-400 font-bold ml-3">
              {heroBanner.offerSub}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-10">
          <div className="relative flex items-center gap-4 pl-4">
            <div className="relative w-20 h-20 flex items-center justify-center filter drop-shadow-md select-none rotate-[-5deg]">
              <div className="absolute inset-0 bg-white rounded-xl transform rotate-0 scale-105"></div>
              <div className="absolute inset-0 bg-white rounded-xl transform rotate-12 scale-105"></div>
              <div className="absolute inset-0 bg-white rounded-xl transform rotate-45 scale-105"></div>
              <div className="absolute inset-0 bg-white rounded-xl transform rotate-75 scale-105"></div>
              
              <div className="absolute inset-1 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl transform rotate-0"></div>
              <div className="absolute inset-1 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl transform rotate-12"></div>
              <div className="absolute inset-1 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl transform rotate-45"></div>
              <div className="absolute inset-1 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl transform rotate-75"></div>
              
              <div className="relative z-10 text-center text-white flex flex-col items-center justify-center -space-y-1">
                <span className="text-xl font-black tracking-tight">{heroBanner.giftBadgeValue}</span>
                <span className="text-[10px] font-bold tracking-tight">{heroBanner.giftBadgeText}</span>
              </div>
            </div>

            <div className="w-16 h-16 rounded-full bg-sky-200/70 border border-sky-100 flex items-center justify-center p-1 shadow-inner relative overflow-hidden transform translate-y-2">
              <img 
                src="https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=80&h=80&q=80" 
                className="w-11 h-11 object-contain drop-shadow-sm rotate-[10deg]" 
                alt="Bưởi da xanh" 
              />
            </div>

            <div className="w-14 h-14 rounded-full bg-purple-100/80 border border-purple-50 flex items-center justify-center p-1 shadow-inner absolute -top-8 left-20 z-0">
              <img 
                src="https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=80&h=80&q=80" 
                className="w-9 h-9 object-contain drop-shadow-sm rotate-[-15deg]" 
                alt="Nước giải khát" 
              />
            </div>

            <div className="relative z-10 ml-1 w-24 sm:w-28 md:w-32 lg:w-36 flex-shrink-0 flex flex-col items-center">
              <img 
                src={heroBanner.truckImage} 
                className="w-full h-auto object-contain rounded-lg"
                alt="Delivery Truck"
                onError={(e) => {
                  e.target.src = "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80";
                }}
              />
              <span className="absolute -bottom-1 bg-[#006c49] text-white font-black text-[8px] px-2 py-0.5 rounded shadow uppercase tracking-wider scale-90 whitespace-nowrap">
                Demi Mart
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-100 shadow-md">
            <div className="w-28 h-28 bg-white rounded-xl flex items-center justify-center p-1.5 border border-[#d6ede4] shadow-inner overflow-hidden flex-shrink-0">
              {heroBanner.qrImage ? (
                <img src={heroBanner.qrImage} alt="QR Code" className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full bg-[radial-gradient(#006c49_3px,transparent_3px)] [background-size:6px_6px]"></div>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-700 flex items-center gap-1">
                {heroBanner.qrText} <span className="text-[#006c49]">&rarr;</span>
              </p>
              <div className="flex gap-1 text-[#fea619]">
                {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
              </div>
              <p className="text-[10px] text-[#006c49] font-black uppercase tracking-tight">{heroBanner.appReviewCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. BANNER DANH MỤC TRƯỢT TỪNG BANNER */}
      <div className="px-6 md:px-10 relative group select-none">
        <button
          type="button"
          onClick={() => handleScrollCategory('left')}
          className="absolute -left-3 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white text-slate-900 border-2 border-slate-800 shadow-2xl flex items-center justify-center hover:bg-[#006c49] hover:text-white opacity-0 group-hover:opacity-100 transition-all duration-300 active:scale-95"
          title="Xem banner trước"
        >
          <ChevronLeft size={26} strokeWidth={3} />
        </button>

        <button
          type="button"
          onClick={() => handleScrollCategory('right')}
          className="absolute -right-3 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white text-slate-900 border-2 border-slate-800 shadow-2xl flex items-center justify-center hover:bg-[#006c49] hover:text-white opacity-0 group-hover:opacity-100 transition-all duration-300 active:scale-95"
          title="Xem banner tiếp theo"
        >
          <ChevronRight size={26} strokeWidth={3} />
        </button>

        <div
          ref={catScrollRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeaveOrUp}
          onMouseUp={handleMouseLeaveOrUp}
          onMouseMove={handleMouseMove}
          className={`flex gap-4 overflow-x-auto scrollbar-none scroll-smooth pb-2 pt-1 ${
            isMouseDown ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categoryBanners.map((item, idx) => (
            <div
              key={item.id || item._id || idx}
              className="w-[calc(100%/1-12px)] sm:w-[calc(100%/2-12px)] lg:w-[calc(100%/4-12px)] flex-shrink-0 h-[220px] rounded-[28px] p-5 relative overflow-hidden text-white flex flex-col justify-between group/card cursor-pointer shadow-sm hover:shadow-lg transition-all duration-500"
            >
              <img 
                src={item.image} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105 pointer-events-none" 
                alt={item.title} 
              />
              
              {!item.imageOnly && (
                <>
                  <div className={`absolute inset-0 bg-gradient-to-t ${item.gradient || 'from-pink-950/95 via-pink-700/60 to-pink-600/20'} transition-opacity duration-300`}></div>
                  
                  <div className="space-y-1 relative z-10 pointer-events-none">
                    <span className="bg-white/20 backdrop-blur-md text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {item.tag}
                    </span>
                    <h3 className="text-xl font-black tracking-tight drop-shadow-sm whitespace-pre-line leading-tight">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-pink-100 font-medium max-w-[160px] leading-tight drop-shadow-sm opacity-90">
                      {item.subtitle}
                    </p>
                  </div>

                  {item.showButton && (
                    <button className={`w-7 h-7 rounded-full bg-white ${item.btnColor || 'text-pink-600'} flex items-center justify-center shadow-md transition-transform group-hover/card:scale-110 relative z-10 self-end`}>
                      <ArrowRight size={14} strokeWidth={3} />
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 3. THANH THÔNG BÁO SNAP EBT */}
      <div className="mx-6 md:mx-10 relative group">
        {ebtList.length > 1 && (
          <button
            type="button"
            onClick={() => setEbtCurrentIndex((prev) => (prev === 0 ? ebtList.length - 1 : prev - 1))}
            className="absolute -left-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white text-slate-900 border-2 border-slate-800 shadow-2xl flex items-center justify-center hover:bg-[#00875a] hover:text-white opacity-0 group-hover:opacity-100 transition-all duration-300 active:scale-95"
            title="Slide EBT trước"
          >
            <ChevronLeft size={26} strokeWidth={3} />
          </button>
        )}

        {ebtList.length > 1 && (
          <button
            type="button"
            onClick={() => setEbtCurrentIndex((prev) => (prev === ebtList.length - 1 ? 0 : prev + 1))}
            className="absolute -right-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white text-slate-900 border-2 border-slate-800 shadow-2xl flex items-center justify-center hover:bg-[#00875a] hover:text-white opacity-0 group-hover:opacity-100 transition-all duration-300 active:scale-95"
            title="Slide EBT tiếp theo"
          >
            <ChevronRight size={26} strokeWidth={3} />
          </button>
        )}

        <div className="transition-all duration-500 ease-in-out">
          {currentEbt?.useBannerImage ? (
            <div className="rounded-2xl overflow-hidden shadow-sm relative group cursor-pointer border border-slate-200">
              <img src={currentEbt.bannerImageUrl} className="w-full h-auto object-cover transition-transform duration-500" alt="SNAP EBT Banner" />
            </div>
          ) : (
            <div className="bg-[#00875a] text-white rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-emerald-600 shadow-sm relative overflow-hidden group cursor-pointer">
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0 border border-emerald-100 shadow-inner">
                  <span className="text-[#00875a] font-black text-xs tracking-tight">SNAP</span>
                </div>
                <div>
                  <h4 className="text-base md:text-lg font-black tracking-tight flex items-center gap-2 flex-wrap">
                    {currentEbt?.title}
                  </h4>
                  <p className="text-[11px] text-emerald-100 font-medium">
                    {currentEbt?.subtitle} <span className="opacity-60 text-[9px] font-normal ml-1">{currentEbt?.note}</span>
                  </p>
                </div>
              </div>
              
              <div className="w-8 h-8 rounded-full bg-white text-[#00875a] flex items-center justify-center shadow-sm group-hover:translate-x-1 transition-transform flex-shrink-0">
                <ArrowRight size={16} strokeWidth={3} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}