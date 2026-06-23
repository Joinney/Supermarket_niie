import React, { useState, useEffect } from "react";
import { User, Mail, Shield, Key, Camera, Check } from "lucide-react";

export default function AdminProfile() {
  const [profile, setProfile] = useState({
    id: "",
    username: "",
    full_name: "",
    email: "",
    role: "Staff",
    status: "Đang hoạt động"
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

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
          role: data.role || "Staff",
          status: data.status === "inactive" ? "Tạm ngưng" : "Đang hoạt động"
        });
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleUpdate = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      // Lưu tạm đè vào LocalStorage để Header tự cập nhật theo
      const updated = { ...JSON.parse(localStorage.getItem("adminInfo")), full_name: profile.full_name, email: profile.email };
      localStorage.setItem("adminInfo", JSON.stringify(updated));
      setSaving(false);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 2500);
      window.dispatchEvent(new Event("storage")); // Đánh thức Header render lại tên mới
    }, 800);
  };

  return (
    <div className="p-6 xl:p-10 max-w-4xl mx-auto space-y-8 animate-fadeIn text-left font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* Tiêu đề */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl xl:text-3xl font-black text-slate-900 tracking-tight">Hồ sơ cá nhân</h1>
          <p className="text-xs xl:text-sm text-slate-400 font-medium mt-1">Quản lý thông tin định danh và bảo mật tài khoản</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
          <Shield size={14} className="text-[#006c49]" /> Vai trò: <span className="text-[#006c49] font-black">{profile.role}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Cột trái: Card Avatar */}
        <div className="md:col-span-1 flex flex-col items-center p-6 bg-white rounded-3xl border border-slate-100 shadow-sm text-center h-fit">
          <div className="relative group cursor-pointer mb-4">
            <div className="w-28 h-28 rounded-full bg-[#006c49] text-white font-black flex items-center justify-center text-4xl shadow-lg ring-4 ring-emerald-50">
              {profile.full_name.charAt(0).toUpperCase() || "A"}
            </div>
            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
              <Camera size={24} />
            </div>
          </div>
          <h3 className="font-black text-slate-800 text-lg max-w-full truncate">{profile.full_name}</h3>
          <p className="text-xs text-slate-400 font-medium mt-0.5 max-w-full truncate">{profile.email}</p>
          
          <div className="mt-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black bg-emerald-50 text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Trạng thái: {profile.status}
          </div>
        </div>

        {/* Cột phải: Form chỉnh sửa */}
        <div className="md:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 xl:p-8">
          
          {successMsg && (
            <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-black flex items-center gap-2">
              <Check size={16} /> Cập nhật thông tin hồ sơ thành công!
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-5">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mã định danh (ID)</label>
                <input type="text" disabled value={`DEMI-UID-${profile.id}`} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 font-mono text-xs cursor-not-allowed" />
              </div>

              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tên đăng nhập</label>
                <div className="relative flex items-center">
                  <User size={16} className="absolute left-3.5 text-slate-400" />
                  <input type="text" disabled value={profile.username} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 font-bold text-xs cursor-not-allowed" />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Họ và Tên hiển thị</label>
              <input 
                type="text" 
                value={profile.full_name} 
                onChange={e => setProfile({...profile, full_name: e.target.value})}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 font-bold text-xs focus:border-[#006c49] focus:ring-2 focus:ring-[#006c49]/10 outline-none transition-all" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Địa chỉ Email</label>
              <div className="relative flex items-center">
                <Mail size={16} className="absolute left-3.5 text-slate-400" />
                <input 
                  type="email" 
                  value={profile.email} 
                  onChange={e => setProfile({...profile, email: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 font-bold text-xs focus:border-[#006c49] focus:ring-2 focus:ring-[#006c49]/10 outline-none transition-all" 
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button 
                type="submit" 
                disabled={saving}
                className="bg-[#006c49] hover:bg-[#004d34] text-white px-6 py-3 rounded-xl font-black text-xs shadow-md active:scale-95 transition-all disabled:opacity-50"
              >
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>

          </form>

        </div>

      </div>

    </div>
  );
}