import React, { useState, useEffect } from "react";
import {
  X,
  CalendarCheck,
  Gift,
  Loader2,
  Coins,
  CheckCircle2,
} from "lucide-react";
import { authApi } from "../../api/axios";

export default function CheckInModal({ isOpen, onClose, onCheckInSuccess }) {
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const [localToast, setLocalToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const [stats, setStats] = useState({
    totalCheckIns: 0,
    monthlyCoins: 0,
    totalCoins: 0,
    currentStreak: 0,
    hasCheckedInToday: false,
  });

  const showLocalToast = (msg, type = "success") => {
    setLocalToast({ show: true, message: msg, type });
    setTimeout(() => {
      setLocalToast({ show: false, message: "", type: "success" });
    }, 3000);
  };

  const fetchCheckInStats = async () => {
    try {
      setIsLoadingStats(true);
      // 🌟 FIX: Ép gọi thẳng vào cổng 5001 của Auth Service để tránh bị lỗi Gateway 5000
      const url = import.meta.env.VITE_AUTH_URL
        ? `${import.meta.env.VITE_AUTH_URL}/api/v1/auth/loyalty/checkin-stats`
        : "http://localhost:5001/api/v1/auth/loyalty/checkin-stats";

      const res = await authApi.get(url);
      if (res.data && res.data.success) {
        const data = res.data.data;
        setStats({
          totalCheckIns: data.totalCheckIns || 0,
          monthlyCoins: data.monthlyCoins || 0,
          totalCoins: data.totalCoins || 0,
          currentStreak: data.currentStreak || 0,
          hasCheckedInToday: data.hasCheckedInToday || false,
        });
      }
    } catch (error) {
      console.error("Lỗi tải thống kê:", error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchCheckInStats();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCheckIn = async () => {
    if (stats.hasCheckedInToday) {
      showLocalToast(
        "Hôm nay bạn đã nhận thưởng rồi, quay lại vào ngày mai nhé! 🎁",
        "error",
      );
      return;
    }

    try {
      setIsCheckingIn(true);

      // 🌟 FIX: Ép gọi thẳng vào cổng 5001
      const checkinUrl = import.meta.env.VITE_AUTH_URL
        ? `${import.meta.env.VITE_AUTH_URL}/api/v1/auth/loyalty/checkin`
        : "http://localhost:5001/api/v1/auth/loyalty/checkin";

      const res = await authApi.post(checkinUrl);

      if (res.data && res.data.success) {
        showLocalToast(res.data.message, "success");
        await fetchCheckInStats();
        if (onCheckInSuccess) onCheckInSuccess(res.data.data.availablePoints);
      }
    } catch (error) {
      const msg = error.response?.data?.message || "Lỗi điểm danh!";
      showLocalToast(msg, "error");
    } finally {
      setIsCheckingIn(false);
    }
  };

  // 🌟 LOGIC TẠO VÒNG LẶP 7 NGÀY
  // Xử lý chuỗi (streak): Nếu > 7 thì chia lấy dư để quay vòng lại UI ngày 1-7
  const visualStreak =
    stats.currentStreak === 0 ? 0 : ((stats.currentStreak - 1) % 7) + 1;
  const nextReward =
    stats.currentStreak >= 6 ? 150 : 100 * (1 + stats.currentStreak * 0.1);

  const streakDays = Array.from({ length: 7 }, (_, i) => {
    const dayNum = i + 1;
    let status = "future"; // Trạng thái: 'checked' (đã nhận), 'active' (hôm nay), 'future' (chưa tới)
    let reward = dayNum === 7 ? 150 : 100 + (dayNum - 1) * 10; // Khớp với logic backend

    if (stats.hasCheckedInToday) {
      if (dayNum <= visualStreak) status = "checked";
    } else {
      if (dayNum < visualStreak + 1) status = "checked";
      else if (dayNum === visualStreak + 1) status = "active";
    }

    return { dayNum, status, reward };
  });

  return (
    <div className="fixed inset-0 z-[10010] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      {/* LOCAL TOAST */}
      {localToast.show && (
        <div className="fixed top-20 md:top-6 right-4 left-4 md:left-auto z-[10020] animate-[toastIn_0.3s_ease-out_forwards]">
          <div
            className={`bg-white border-l-4 ${localToast.type === "success" ? "border-[#006c49]" : "border-amber-500"} shadow-2xl rounded-xl p-3 flex items-center gap-3 w-full md:w-max min-w-[250px] max-w-sm`}
          >
            {localToast.type === "error" ? (
              <Gift size={18} className="text-amber-500 shrink-0" />
            ) : (
              <CheckCircle2 size={18} className="text-[#006c49] shrink-0" />
            )}
            <p className="text-xs font-bold text-slate-700 leading-tight">
              {localToast.message}
            </p>
          </div>
        </div>
      )}

      {/* MODAL CONTAINER */}
      <div className="w-full max-w-md bg-slate-50 rounded-[28px] shadow-2xl overflow-hidden relative">
        {/* NÚT TẮT */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:bg-white/20 bg-black/10 p-1.5 rounded-full transition-colors z-20"
        >
          <X size={20} />
        </button>

        {/* 🌟 PHẦN HEADER: THEME XANH LÁ GRADIENT */}
        <div className="bg-gradient-to-br from-[#006c49] to-emerald-500 pt-8 pb-12 px-6 text-center relative overflow-hidden">
          {/* Họa tiết chìm */}
          <Coins className="absolute -left-6 -bottom-6 w-32 h-32 text-white opacity-10 -rotate-12" />
          <Gift className="absolute -right-4 top-4 w-20 h-20 text-white opacity-10 rotate-12" />

          <div className="relative z-10 flex flex-col items-center">
            <div className="bg-white/20 p-2 rounded-2xl backdrop-blur-sm mb-3 shadow-inner border border-white/20">
              <Coins
                size={28}
                className="text-yellow-300 drop-shadow-md"
                fill="currentColor"
              />
            </div>
            <p className="text-emerald-100 font-bold text-sm tracking-widest uppercase mb-1">
              Tổng xu của bạn
            </p>
            <h2 className="text-4xl font-black text-white drop-shadow-md">
              {isLoadingStats ? "..." : stats.totalCoins.toLocaleString()}
            </h2>
          </div>
        </div>

        {/* 🌟 PHẦN BODY: BOX ĐIỂM DANH TRẮNG ĐÈ LÊN HEADER */}
        <div className="px-4 pb-6 -mt-8 relative z-10">
          <div className="bg-white rounded-3xl shadow-xl p-5 border border-slate-100 relative">
            {isLoadingStats && (
              <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center rounded-3xl backdrop-blur-sm">
                <Loader2 size={32} className="animate-spin text-[#006c49]" />
              </div>
            )}

            <h3 className="text-center font-black text-slate-800 text-lg mb-4 text-[#006c49]">
              ĐIỂM DANH NHẬN XU
            </h3>

            {/* TIMELINE 7 NGÀY GẦN GIỐNG SHOPEE */}
            <div className="flex justify-between items-end gap-1.5 mb-6 relative overflow-x-auto no-scrollbar pb-2">
              {streakDays.map((day, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center gap-1.5 shrink-0 w-[45px] sm:w-[50px]"
                >
                  <span
                    className={`text-[10px] font-black ${day.status === "active" || day.dayNum === 7 ? "text-[#fea619]" : "text-slate-400"}`}
                  >
                    +{day.reward}
                  </span>

                  {/* Hộp quà / Trạng thái */}
                  <div
                    className={`w-full aspect-square rounded-xl flex items-center justify-center border-2 transition-all shadow-sm
                          ${day.status === "checked" ? "bg-emerald-50 border-[#006c49]/30 text-[#006c49]" : ""}
                          ${day.status === "active" ? "bg-[#006c49] border-[#006c49] text-white shadow-md shadow-[#006c49]/40 animate-pulse" : ""}
                          ${day.status === "future" && day.dayNum !== 7 ? "bg-slate-50 border-slate-100 text-slate-300" : ""}
                          ${day.dayNum === 7 && day.status !== "checked" ? "bg-gradient-to-tr from-amber-200 to-yellow-400 border-amber-400 text-yellow-800 shadow-lg shadow-amber-500/30" : ""}
                       `}
                  >
                    {day.status === "checked" ? (
                      <CheckCircle2 size={20} strokeWidth={3} />
                    ) : day.dayNum === 7 ? (
                      <Gift
                        size={24}
                        fill="currentColor"
                        className="text-amber-500 drop-shadow-sm"
                      />
                    ) : (
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center ${day.status === "active" ? "bg-white/20" : "bg-yellow-400 text-white shadow-inner"}`}
                      >
                        <Coins
                          size={14}
                          fill="currentColor"
                          className={
                            day.status === "active"
                              ? "text-yellow-300"
                              : "text-yellow-500"
                          }
                        />
                      </div>
                    )}
                  </div>

                  {/* Text "Hôm nay" / "Ngày X" */}
                  <span
                    className={`text-[9px] font-bold tracking-tight whitespace-nowrap mt-0.5
                          ${day.status === "active" ? "text-[#006c49]" : "text-slate-400"}
                       `}
                  >
                    {day.status === "active" ? "Hôm nay" : `Ngày ${day.dayNum}`}
                  </span>
                </div>
              ))}
            </div>

            {/* NÚT BẤM CHÀ BÁ NHƯ SHOPEE */}
            <button
              onClick={handleCheckIn}
              disabled={
                stats.hasCheckedInToday || isCheckingIn || isLoadingStats
              }
              className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2
                  ${
                    stats.hasCheckedInToday
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                      : "bg-gradient-to-r from-[#006c49] to-emerald-500 text-white hover:scale-[1.02] active:scale-95 cursor-pointer shadow-emerald-500/40"
                  }
                `}
            >
              {isCheckingIn && <Loader2 size={18} className="animate-spin" />}

              {!isCheckingIn && stats.hasCheckedInToday && (
                <>
                  <CalendarCheck size={18} /> ĐÃ ĐIỂM DANH HÔM NAY
                </>
              )}

              {!isCheckingIn && !stats.hasCheckedInToday && (
                <>
                  <Coins
                    size={18}
                    fill="currentColor"
                    className="text-yellow-300"
                  />
                  NHẬN {nextReward} XU HÔM NAY!
                </>
              )}
            </button>
          </div>

          {/* THỐNG KÊ NHỎ BÊN DƯỚI */}
          <div className="flex justify-between items-center px-4 mt-5">
            <div className="text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Đã nhận tháng này
              </p>
              <p className="font-bold text-slate-700 text-sm">
                {stats.monthlyCoins.toLocaleString()} Xu
              </p>
            </div>
            <div className="w-[1px] h-8 bg-slate-200"></div>
            <div className="text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Số ngày điểm danh
              </p>
              <p className="font-bold text-[#006c49] text-sm">
                {stats.totalCheckIns} Ngày
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
