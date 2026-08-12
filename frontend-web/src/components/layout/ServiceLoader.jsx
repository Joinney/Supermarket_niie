import React, { useState, useEffect } from "react";
import logoDemiMart from "../../assets/Demi Mart.png";

// 1. NHÓM DỊCH VỤ CỐT LÕI (BẮT BUỘC SẴN SÀNG)
const PRIORITY_SERVICES = [
  { step: "Đang kiểm tra xác thực hệ thống...", url: "https://authservice-sz4p.onrender.com" },
  { step: "Đang tải danh mục sản phẩm...", url: "https://productservice-n87v.onrender.com" },
  { step: "Đang kết nối giỏ hàng...", url: "https://cartservice-i6s1.onrender.com" },
  { step: "Hoàn tất chuẩn bị chương trình ưu đãi...", url: "https://promotion-service-r5zx.onrender.com" },
];

// 2. NHÓM DỊCH VỤ PHỤ (KÍCH HOẠT NGẦM)
const BACKGROUND_SERVICES = [
  "https://payment-service-opea.onrender.com",
  "https://orderservice-n0z1.onrender.com",
  "https://inventory-service-mjzr.onrender.com",
  "https://ai-service-0zyu.onrender.com",
  "https://notification-service-w3tg.onrender.com",
];

const SLATS = Array.from({ length: 28 }); // 28 nan cửa mỏng

export default function ServiceLoader({ onFinish }) {
  const [progress, setProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState("Đang kiểm tra kết nối hệ thống...");
  const [isExpanding, setIsExpanding] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [isLocalOrCached, setIsLocalOrCached] = useState(false);

  useEffect(() => {
    // 1. KIỂM TRA MÔI TRƯỜNG & SESSION CACHE
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    const isWarmedUp = sessionStorage.getItem("demimart_services_warmed");

    // Nếu ở Localhost HOẶC các service đã được kích hoạt sống trước đó -> Bỏ qua loading
    if (isLocalhost || isWarmedUp === "true") {
      setIsLocalOrCached(true);
      if (onFinish) onFinish();
      return;
    }

    // 2. KÍCH HOẠT NGẦM BACKGROUND SERVICES
    BACKGROUND_SERVICES.forEach((url) => {
      fetch(url, { mode: "no-cors" }).catch(() => {});
    });

    // 3. THEO DÕI BẰNG THỜI GIAN THẬT DỰA TRÊN KẾT QUẢ RESPONSE
    const totalPriority = PRIORITY_SERVICES.length;
    let completedCount = 0;

    PRIORITY_SERVICES.forEach((service) => {
      fetch(service.url, { mode: "no-cors" })
        .then(() => {})
        .catch(() => {})
        .finally(() => {
          completedCount += 1;
          
          // Tính % chính xác tuyệt đối theo số lượng service hoàn thành
          const exactPercent = Math.round((completedCount / totalPriority) * 100);
          setProgress(exactPercent);
          setCurrentStatus(service.step);

          // Khi TOÀN BỘ 4 SERVICES CỐT LÕI ĐÃ CHẠY XONG
          if (completedCount === totalPriority) {
            setCurrentStatus("Hệ thống đã sẵn sàng!");

            // Đánh dấu vào Session Storage để không hiển thị lại ở các lượt truy cập sau
            sessionStorage.setItem("demimart_services_warmed", "true");

            // BƯỚC 1: Hở khe thoáng li ti
            setTimeout(() => {
              setIsExpanding(true);
            }, 300);

            // BƯỚC 2: Cuộn trượt toàn bộ cửa lên đỉnh
            setTimeout(() => {
              setIsRolling(true);
            }, 850);

            // BƯỚC 3: Mở hoàn toàn giao diện
            setTimeout(() => {
              if (onFinish) onFinish();
            }, 1850);
          }
        });
    });
  }, [onFinish]);

  // Không hiển thị component nếu ở Localhost hoặc khi Dịch vụ đã ấm
  if (isLocalOrCached) return null;

  return (
    <div
      className={`fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-[#111827] text-slate-800 select-none origin-top transition-transform duration-1000 ease-[cubic-bezier(0.7,0,0.3,1)] ${
        isRolling ? "-translate-y-full pointer-events-none" : "translate-y-0"
      }`}
    >
      {/* KHỐI NAN CỬA CUỐN MỎNG MỊN */}
      <div className="absolute inset-0 flex flex-col justify-between overflow-hidden pointer-events-none">
        {SLATS.map((_, index) => (
          <div
            key={index}
            className="w-full flex-1 bg-gradient-to-b from-[#ffffff] via-[#f3f4f6] to-[#e5e7eb] border-b border-slate-300/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] relative transition-all duration-500 ease-out flex items-center justify-center"
            style={{
              marginBottom: isExpanding ? "3px" : "0px",
              transitionDelay: isExpanding ? `${(SLATS.length - index) * 18}ms` : "0ms",
            }}
          >
            {/* LỖ THOÁNG LI TI HIỆN RA KHI DÃN NAN */}
            <div
              className={`absolute -bottom-[4px] left-0 right-0 h-[3px] flex justify-around items-center transition-opacity duration-300 ${
                isExpanding ? "opacity-100" : "opacity-0"
              }`}
            >
              <div className="w-full h-full bg-[radial-gradient(circle_at_center,_rgba(0,0,0,0.85)_0%,_transparent_60%)] bg-[length:10px_3px] bg-repeat-x" />
            </div>
          </div>
        ))}
      </div>

      {/* PHỦ BÓNG ĐỔ KHỐI */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/15 pointer-events-none" />

      {/* LOGO DEMI MART NỔI BẬT */}
      <div
        className={`relative z-10 flex flex-col items-center justify-center mb-6 bg-white/90 backdrop-blur-md p-5 px-8 rounded-3xl border border-white shadow-2xl transition-all duration-500 ${
          isRolling ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}
      >
        <img
          src={logoDemiMart}
          alt="Demi Mart Logo"
          className="h-16 w-auto object-contain drop-shadow-sm mb-1"
        />
        <p className="text-[10px] sm:text-xs text-slate-600 uppercase tracking-[0.35em] font-bold">
          Siêu thị trực tuyến cao cấp
        </p>
      </div>

      {/* THANH TIẾN TRÌNH REAL-TIME % */}
      <div
        className={`relative z-10 w-full max-w-xs sm:max-w-sm bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-300 shadow-2xl transition-all duration-500 ${
          isRolling ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}
      >
        <div className="flex items-center justify-between text-xs text-slate-700 mb-2 font-semibold">
          <span className="truncate max-w-[220px] sm:max-w-[260px]">
            {currentStatus}
          </span>
          <span className="font-extrabold text-[#007a5a]">{progress}%</span>
        </div>

        {/* Track & Progress Bar */}
        <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden p-[2px] border border-slate-300 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-[#007a5a] via-emerald-500 to-teal-400 rounded-full transition-all duration-500 ease-out shadow-xs"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <p
        className={`relative z-10 text-[11px] text-slate-600 mt-6 font-semibold text-center bg-white/80 px-4 py-1 rounded-full backdrop-blur-xs border border-white shadow-xs transition-opacity duration-500 ${
          isRolling ? "opacity-0" : "opacity-100"
        }`}
      >
        Đang khởi tạo các dịch vụ server...
      </p>

      {/* CHÂN NẸP NHÔM CỬA CUỐN */}
      <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-b from-slate-400 via-slate-300 to-slate-500 border-t border-white/80 shadow-[0_8px_20px_rgba(0,0,0,0.4)] z-20" />
    </div>
  );
}