import React, { useState, useEffect } from "react";
import logoDemiMart from "../../assets/Demi Mart.png";

// 1. NHÓM DỊCH VỤ CỐT LÕI (BẮT BUỘC CHẠY TUẦN TỰ KHỈ BỊ NGỦ ĐÔNG)
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
  const [currentStatus, setCurrentStatus] = useState("Đang kiểm tra trạng thái dịch vụ...");
  const [isExpanding, setIsExpanding] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Hàm nhích % mượt mà
  const animateProgress = (start, target, duration = 600) => {
    return new Promise((resolve) => {
      const startTime = performance.now();
      const step = (currentTime) => {
        const elapsed = currentTime - startTime;
        const p = Math.min(elapsed / duration, 1);
        const currentVal = Math.round(start + (target - start) * p);
        setProgress(currentVal);

        if (p < 1) {
          requestAnimationFrame(step);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(step);
    });
  };

  // Hàm ping gửi request
  const pingService = async (url) => {
    try {
      await fetch(url, { mode: "no-cors" });
    } catch (e) {
      // Bỏ qua lỗi CORS
    }
  };

  useEffect(() => {
    // 1. Bỏ qua nếu chạy ở Localhost
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (isLocalhost) {
      setIsVisible(false);
      if (onFinish) onFinish();
      return;
    }

    // 2. Kích hoạt ngầm 5 dịch vụ phụ
    BACKGROUND_SERVICES.forEach((url) => pingService(url));

    // 3. KIỂM TRA XEM CÁC DỊCH VỤ CÓ ĐANG NGỦ ĐÔNG KHÔNG (FAST HEALTH CHECK)
    const checkAndRun = async () => {
      // Đặt timeout 1.5 giây để kiểm tra xem cả 4 service có thức sẵn hay không
      const checkFastResponse = Promise.all(
        PRIORITY_SERVICES.map((s) => pingService(s.url))
      );

      const timeoutPromise = new Promise((resolve) =>
        setTimeout(() => resolve("SLEEPING"), 1500)
      );

      const result = await Promise.race([checkFastResponse, timeoutPromise]);

      // NẾU CẢ 4 SERVICE ĐỀU THỨC SẴN (Phản hồi < 1.5s) -> Bỏ qua Loading ngay!
      if (result !== "SLEEPING") {
        setIsVisible(false);
        if (onFinish) onFinish();
        return;
      }

      // NẾU CÓ SERVICE BỊ NGỦ ĐÔNG -> Chạy giao diện Loading cửa cuốn từng bước!
      let currentP = 0;

      for (let i = 0; i < PRIORITY_SERVICES.length; i++) {
        const service = PRIORITY_SERVICES[i];
        const nextTargetP = (i + 1) * 25;

        setCurrentStatus(service.step);

        // Nhích mượt nửa chặng
        const midTargetP = currentP + 12;
        await animateProgress(currentP, midTargetP, 400);

        // Chờ service thực sự tỉnh dậy (nếu đang ngủ Render sẽ mất 10-30s)
        await pingService(service.url);

        // Nhích mượt đến mốc 25%, 50%, 75%, 100%
        await animateProgress(midTargetP, nextTargetP, 500);
        currentP = nextTargetP;
      }

      // KHI ĐÃ HOÀN THÀNH 100%
      setCurrentStatus("Hệ thống đã sẵn sàng!");

      // BƯỚC 1: Dãn khe thoáng li ti
      setTimeout(() => {
        setIsExpanding(true);
      }, 300);

      // BƯỚC 2: Cuộn trượt cửa lên
      setTimeout(() => {
        setIsRolling(true);
      }, 850);

      // BƯỚC 3: Mở hoàn toàn giao diện
      setTimeout(() => {
        setIsVisible(false);
        if (onFinish) onFinish();
      }, 1850);
    };

    checkAndRun();
  }, [onFinish]);

  if (!isVisible) return null;

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
            {/* DÃY LỖ THOÁNG LI TI HIỆN RA KHI CỬA DÃN */}
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

      {/* ĐỔ BÓNG KHỐI TOÀN MÀN HÌNH */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/15 pointer-events-none" />

      {/* KHỐI LOGO DEMI MART */}
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

      {/* THANH TIẾN TRÌNH % REAL-TIME */}
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
            className="h-full bg-gradient-to-r from-[#007a5a] via-emerald-500 to-teal-400 rounded-full transition-all duration-300 ease-out shadow-xs"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <p
        className={`relative z-10 text-[11px] text-slate-600 mt-6 font-semibold text-center bg-white/80 px-4 py-1 rounded-full backdrop-blur-xs border border-white shadow-xs transition-opacity duration-500 ${
          isRolling ? "opacity-0" : "opacity-100"
        }`}
      >
        Đang khởi động hệ thống Microservices...
      </p>

      {/* CHÂN NẸP NHÔM DƯỚI ĐÁY CỬA CUỐN */}
      <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-b from-slate-400 via-slate-300 to-slate-500 border-t border-white/80 shadow-[0_8px_20px_rgba(0,0,0,0.4)] z-20" />
    </div>
  );
}