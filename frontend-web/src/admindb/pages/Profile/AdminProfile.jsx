import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Shield,
  Camera,
  Check,
  Clock,
  LogIn,
  LogOut,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { authApi } from "../../../api/axios";

export default function AdminProfile() {
  const [profile, setProfile] = useState({
    id: "",
    username: "",
    full_name: "",
    email: "",
    avatar_url: null,
    role: "Staff",
    status: "Đang hoạt động",
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  // 🌟 STATE CHO CHỨC NĂNG CHẤM CÔNG
  const [currentTime, setCurrentTime] = useState(new Date());
  const [attendance, setAttendance] = useState({
    status: "LOADING", // 'LOADING', 'NOT_CHECKED_IN', 'CHECKED_IN', 'COMPLETED'
    record: null,
  });
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // 1. Lấy thông tin Profile từ LocalStorage
  useEffect(() => {
    const raw = localStorage.getItem("adminInfo");
    if (raw) {
      try {
        const data = JSON.parse(raw);
        setProfile({
          id: data.id || data.user_id || "N/A",
          username: data.username || "",
          full_name: data.full_name || data.username || "",
          email: data.email || "",
          avatar_url: data.avatar_url || null,
          role: data.role || "Staff",
          status: data.status === "inactive" ? "Tạm ngưng" : "Đang hoạt động",
        });
      } catch (e) {
        console.error("Lỗi parse cấu trúc dữ liệu Profile:", e);
      }
    }
  }, []);

  // 2. Đồng hồ chạy Real-time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 3. API Gọi trạng thái chấm công hôm nay
  const fetchTodayAttendance = async () => {
    try {
      const url = import.meta.env.VITE_AUTH_URL
        ? `${import.meta.env.VITE_AUTH_URL}/api/v1/auth/attendance/today`
        : "http://localhost:5001/api/v1/auth/attendance/today";

      const res = await authApi.get(url);
      if (res.data && res.data.success) {
        setAttendance({
          status: res.data.data.status,
          record: res.data.data.record || null,
        });
      }
    } catch (error) {
      console.error("Lỗi tải dữ liệu chấm công:", error);
      setAttendance({ status: "NOT_CHECKED_IN", record: null });
    }
  };

  useEffect(() => {
    fetchTodayAttendance();
  }, []);

  // 4. Xử lý sự kiện bấm Check-in / Check-out
  const handleAttendanceAction = async () => {
    setIsActionLoading(true);
    try {
      // 🌟 FIX: Gọi chính xác vào cổng 5001 và thêm /auth vào URL
      const actionUrl = import.meta.env.VITE_AUTH_URL
        ? `${import.meta.env.VITE_AUTH_URL}/api/v1/auth/attendance/action`
        : "http://localhost:5001/api/v1/auth/attendance/action";

      const res = await authApi.post(actionUrl);
      if (res.data && res.data.success) {
        setToastMsg(res.data.message);
        setTimeout(() => setToastMsg(null), 3500);
        await fetchTodayAttendance();
      }
    } catch (error) {
      const msg = error.response?.data?.message || "Lỗi xử lý chấm công!";
      setToastMsg(msg);
      setTimeout(() => setToastMsg(null), 3500);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      const currentInfo = JSON.parse(localStorage.getItem("adminInfo") || "{}");
      const updated = {
        ...currentInfo,
        full_name: profile.full_name,
        email: profile.email,
      };
      localStorage.setItem("adminInfo", JSON.stringify(updated));
      setSaving(false);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 2500);
      window.dispatchEvent(new Event("storage"));
    }, 800);
  };

  // Helper chuyển đổi format giờ
  const formatTime = (isoString) => {
    if (!isoString) return "--:--";
    const date = new Date(isoString);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6 xl:p-10 max-w-5xl mx-auto space-y-8 animate-fadeIn text-left font-['Plus_Jakarta_Sans',sans-serif] relative">
      {/* Thông báo Toast Cục bộ */}
      {toastMsg && (
        <div className="fixed top-24 right-10 z-50 animate-[toastIn_0.3s_ease-out_forwards] bg-slate-800 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 font-bold text-sm">
          <CheckCircle2 size={18} className="text-emerald-400" />
          {toastMsg}
        </div>
      )}

      {/* Tiêu đề */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl xl:text-3xl font-black text-slate-900 tracking-tight">
            Hồ sơ cá nhân
          </h1>
          <p className="text-xs xl:text-sm text-slate-400 font-medium mt-1">
            Quản lý thông tin định danh và chấm công hàng ngày
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
          <Shield size={14} className="text-[#006c49]" /> Vai trò:{" "}
          <span className="text-[#006c49] font-black">{profile.role}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CỘT TRÁI: AVATAR & WIDGET CHẤM CÔNG */}
        <div className="lg:col-span-1 space-y-6">
          {/* Card Avatar */}
          <div className="flex flex-col items-center p-6 bg-white rounded-3xl border border-slate-100 shadow-sm text-center">
            <div className="relative group cursor-pointer mb-4">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile Avatar"
                  className="w-28 h-28 rounded-full object-cover shadow-lg ring-4 ring-emerald-50"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                />
              ) : null}

              <div
                className="w-28 h-28 rounded-full bg-[#006c49] text-white font-black flex items-center justify-center text-4xl shadow-lg ring-4 ring-emerald-50 select-none uppercase"
                style={{ display: profile.avatar_url ? "none" : "flex" }}
              >
                {(profile.full_name || profile.username || "A").charAt(0)}
              </div>

              <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                <Camera size={24} />
              </div>
            </div>
            <h3 className="font-black text-slate-800 text-lg max-w-full truncate">
              {profile.full_name}
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5 max-w-full truncate">
              {profile.email}
            </p>

            <div className="mt-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black bg-emerald-50 text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Trạng thái: {profile.status}
            </div>
          </div>

          {/* 🌟 WIDGET CHẤM CÔNG */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col items-center text-center relative overflow-hidden">
            {/* Trang trí nền */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-50 rounded-full opacity-50"></div>

            <div className="flex items-center gap-2 text-[#006c49] mb-3 relative z-10">
              <Clock size={16} />
              <span className="font-black text-xs uppercase tracking-widest">
                Thời gian thực
              </span>
            </div>

            <h2
              className="text-3xl lg:text-4xl font-black text-slate-800 mb-6 tracking-tighter relative z-10"
              translate="no"
            >
              {currentTime.toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </h2>

            <div className="w-full space-y-3 relative z-10">
              {attendance.status === "LOADING" ? (
                <div className="py-4 flex justify-center">
                  <Loader2 className="animate-spin text-[#006c49]" />
                </div>
              ) : attendance.status === "NOT_CHECKED_IN" ? (
                <button
                  onClick={handleAttendanceAction}
                  disabled={isActionLoading}
                  className="w-full bg-[#006c49] hover:bg-[#005439] text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition-all active:scale-95 disabled:opacity-70 cursor-pointer"
                >
                  {isActionLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <LogIn size={16} />
                  )}
                  Vào ca (Check-in)
                </button>
              ) : attendance.status === "CHECKED_IN" ? (
                <>
                  <div className="flex justify-between items-center bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100 mb-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Giờ vào ca
                    </span>
                    <span className="text-xs font-black text-slate-700">
                      {formatTime(attendance.record?.check_in_time)}
                    </span>
                  </div>
                  <button
                    onClick={handleAttendanceAction}
                    disabled={isActionLoading}
                    className="w-full bg-rose-500 hover:bg-rose-600 text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-rose-500/30 transition-all active:scale-95 disabled:opacity-70 cursor-pointer"
                  >
                    {isActionLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <LogOut size={16} />
                    )}
                    Ra ca (Check-out)
                  </button>
                </>
              ) : (
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex flex-col items-center gap-2">
                  <div className="w-10 h-10 bg-[#006c49] rounded-full flex items-center justify-center text-white mb-1 shadow-sm">
                    <CheckCircle2 size={20} />
                  </div>
                  <p className="text-xs font-black text-[#006c49] uppercase tracking-wider">
                    Đã hoàn thành ca
                  </p>
                  <p className="text-[10px] font-bold text-emerald-600 mt-1">
                    Tổng giờ làm: {attendance.record?.work_hours || 0} giờ
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: FORM CHỈNH SỬA THÔNG TIN */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 xl:p-8 h-fit">
          {successMsg && (
            <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-black flex items-center gap-2 animate-fadeIn">
              <Check size={16} /> Cập nhật thông tin hồ sơ thành công!
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Mã định danh (ID)
                </label>
                <input
                  type="text"
                  disabled
                  value={`DEMI-UID-${profile.id}`}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 font-mono text-xs cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Tên đăng nhập
                </label>
                <div className="relative flex items-center">
                  <User
                    size={16}
                    className="absolute left-3.5 text-slate-400"
                  />
                  <input
                    type="text"
                    disabled
                    value={profile.username}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 font-bold text-xs cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Họ và Tên hiển thị
              </label>
              <input
                type="text"
                value={profile.full_name}
                onChange={(e) =>
                  setProfile({ ...profile, full_name: e.target.value })
                }
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 font-bold text-xs focus:border-[#006c49] focus:ring-2 focus:ring-[#006c49]/10 outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Địa chỉ Email
              </label>
              <div className="relative flex items-center">
                <Mail size={16} className="absolute left-3.5 text-slate-400" />
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) =>
                    setProfile({ ...profile, email: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 font-bold text-xs focus:border-[#006c49] focus:ring-2 focus:ring-[#006c49]/10 outline-none transition-all"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="bg-[#006c49] hover:bg-[#004d34] text-white px-6 py-3 rounded-xl font-black text-xs shadow-md active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
              >
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes toastIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
      `,
        }}
      />
    </div>
  );
}
