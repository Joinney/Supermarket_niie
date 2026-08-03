import React, { useState, useEffect } from "react";
import {
  X,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Gift,
  Loader2,
  Flame,
  CheckCircle2,
} from "lucide-react";
import { authApi } from "../../api/axios";

export default function CheckInModal({ isOpen, onClose, onCheckInSuccess }) {
  const [currentDate, setCurrentDate] = useState(new Date());
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

  const [checkedInDates, setCheckedInDates] = useState([]);

  const showLocalToast = (msg, type = "success") => {
    setLocalToast({ show: true, message: msg, type });
    setTimeout(() => {
      setLocalToast({ show: false, message: "", type: "success" });
    }, 3000);
  };

  const fetchCheckInStats = async () => {
    try {
      setIsLoadingStats(true);
      const url = import.meta.env.VITE_AUTH_URL
        ? `${import.meta.env.VITE_AUTH_URL}/api/v1/auth/loyalty/checkin-stats`
        : "http://localhost:5001/api/v1/auth/loyalty/checkin-stats";

      const res = await authApi.get(url);
      if (res.data && res.data.success) {
        const data = res.data.data;
        setCheckedInDates(data.checkedInDates);
        setStats({
          totalCheckIns: data.totalCheckIns,
          monthlyCoins: data.monthlyCoins,
          totalCoins: data.totalCoins,
          currentStreak: data.currentStreak,
          hasCheckedInToday: data.hasCheckedInToday,
        });
      }
    } catch (error) {
      console.error("Lỗi tải thống kê:", error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCheckInStats();
    }
  }, [isOpen, currentDate]);

  if (!isOpen) return null;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const formatMonth = currentDate.toLocaleString("vi-VN", {
    month: "2-digit",
    year: "numeric",
  });

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

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

  const nextReward =
    stats.currentStreak >= 6 ? 150 : 100 * (1 + stats.currentStreak * 0.1);

  return (
    <div className="fixed inset-0 z-[10010] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      {/* 🌟 ĐÃ SỬA: TOAST CỤC BỘ ĐƯỢC CHUYỂN THÀNH FIXED Ở GÓC PHẢI TRÊN MÀN HÌNH */}
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

      {/* KHUNG TRẮNG MODAL */}
      <div className="bg-white w-full max-w-lg rounded-[24px] shadow-2xl overflow-hidden relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 p-1.5 rounded-full transition-colors z-10"
        >
          <X size={20} />
        </button>

        {/* HEADER */}
        <div className="p-6 pb-0 flex justify-between items-start mt-6">
          <div className="flex gap-3">
            <div className="w-12 h-12 bg-emerald-50 text-[#006c49] rounded-2xl flex items-center justify-center shrink-0 relative overflow-hidden">
              <CalendarCheck size={24} className="relative z-10" />
              {stats.currentStreak >= 3 && (
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-200 to-transparent opacity-50 animate-pulse"></div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                Điểm danh mỗi ngày
              </h2>
              <p className="text-sm font-medium text-slate-500 mt-0.5">
                Tích lũy xu thưởng mỗi ngày cùng
                <br />
                Demi Mart!
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1 mt-1 pr-8">
            <button
              onClick={handleCheckIn}
              disabled={
                stats.hasCheckedInToday || isCheckingIn || isLoadingStats
              }
              className={`px-5 py-2 rounded-full font-black text-[13px] flex items-center gap-2 transition-all shadow-sm uppercase tracking-wider ${
                stats.hasCheckedInToday
                  ? "bg-slate-100 text-slate-400 cursor-default shadow-none"
                  : "bg-white text-[#006c49] border-2 border-[#006c49] hover:bg-emerald-50 cursor-pointer"
              }`}
            >
              {isCheckingIn && <Loader2 size={14} className="animate-spin" />}
              {!isCheckingIn && stats.hasCheckedInToday && (
                <CalendarCheck size={14} />
              )}
              {!isCheckingIn && !stats.hasCheckedInToday && <Gift size={14} />}

              {stats.hasCheckedInToday ? "Đã nhận thưởng" : "+ Check-in"}
            </button>
            {!stats.hasCheckedInToday && (
              <span className="text-[11px] font-black text-[#fea619] flex items-center gap-1 animate-pulse">
                Hôm nay +{nextReward} XU
              </span>
            )}
            {stats.hasCheckedInToday && (
              <span className="text-[10px] font-bold text-emerald-600">
                Quay lại ngày mai nhé!
              </span>
            )}
          </div>
        </div>

        {/* STATS BARS */}
        <div className="px-6 py-5">
          <div className="grid grid-cols-3 gap-2 border border-slate-100 rounded-2xl p-2 bg-slate-50/50">
            <div className="text-center py-2 border-r border-slate-200/60 relative">
              <p className="text-xl font-black text-slate-800 flex justify-center items-center gap-1">
                {stats.currentStreak}{" "}
                <Flame
                  size={16}
                  className={`${stats.currentStreak >= 3 ? "text-red-500" : "text-slate-300"}`}
                  fill="currentColor"
                />
              </p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                Chuỗi liên tiếp
                <br />
                (Streak)
              </p>
            </div>
            <div className="text-center py-2 border-r border-slate-200/60">
              <p className="text-xl font-black text-[#006c49]">
                +{stats.monthlyCoins.toLocaleString()} Xu
              </p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                Tháng này
              </p>
            </div>
            <div className="text-center py-2">
              <p className="text-xl font-black text-[#fea619]">
                {stats.totalCoins.toLocaleString()} Xu
              </p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                Tổng thưởng xu
              </p>
            </div>
          </div>
        </div>

        {/* CALENDAR */}
        <div className="px-6 pb-6 relative">
          {isLoadingStats && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-20 flex justify-center items-center">
              <Loader2 size={30} className="animate-spin text-[#006c49]" />
            </div>
          )}

          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="font-black text-slate-800 text-lg uppercase tracking-wider">
              THÁNG {formatMonth}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-y-3 mb-2 text-center">
            {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day) => (
              <div
                key={day}
                className="text-[11px] font-black text-slate-400 tracking-wider"
              >
                {day}
              </div>
            ))}

            {blanks.map((blank) => (
              <div key={`blank-${blank}`} className="w-10 h-10 mx-auto"></div>
            ))}

            {days.map((day) => {
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isCheckedIn = checkedInDates.includes(dateStr);

              const isToday =
                day === new Date().getDate() &&
                month === new Date().getMonth() &&
                year === new Date().getFullYear();

              return (
                <div key={day} className="flex justify-center relative">
                  <button
                    onClick={() => {
                      if (isToday) handleCheckIn();
                      else if (isCheckedIn)
                        showLocalToast(
                          "Ngày này bạn đã nhận thưởng rồi!",
                          "success",
                        );
                    }}
                    disabled={!isToday && !isCheckedIn}
                    className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-bold transition-all ${
                      isCheckedIn
                        ? "bg-[#006c49] text-white shadow-md shadow-[#006c49]/30"
                        : isToday
                          ? "bg-emerald-50 text-[#006c49] border-2 border-[#006c49] cursor-pointer hover:bg-emerald-100 shadow-[0_0_10px_rgba(0,108,73,0.3)] animate-pulse"
                          : "text-slate-300 cursor-not-allowed"
                    }`}
                  >
                    {day}
                  </button>
                </div>
              );
            })}
          </div>

          {/* LEGEND */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
            <div className="flex items-center gap-2">
              <Gift size={14} className="text-[#006c49]" />
              <span className="text-[11px] font-bold text-slate-500">
                Giữ chuỗi để x1.5 tiền thưởng!
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#006c49] flex items-center justify-center">
                <CalendarCheck size={8} className="text-white" />
              </div>
              <span className="text-[11px] font-bold text-slate-500">
                Đã điểm danh
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
