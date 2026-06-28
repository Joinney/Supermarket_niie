import React from "react";
import { Camera } from "lucide-react";

export default function Tabhoso({ profile, setProfile, handleSaveProfile, handleAvatarChange, getAvatarSrc }) {
  return (
    <div className="space-y-8 flex flex-col h-full">
      <div className="flex justify-between items-center border-b border-slate-50 pb-4">
        <h2 className="text-xl font-black text-slate-900 leading-tight">Hồ sơ cá nhân</h2>
        <button onClick={handleSaveProfile} className="hidden md:block bg-[#006c49] text-white px-8 py-2.5 rounded-xl font-black text-[10px] uppercase shadow-md hover:scale-105 transition-all">Lưu thay đổi</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6 text-left order-2 lg:order-1">
          <div className="grid grid-cols-3 items-center gap-4 border-b border-slate-50 pb-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tên đăng nhập</label>
            <div className="col-span-2 font-black text-slate-800 text-sm py-2">{profile.username}</div>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Họ và tên</label>
            <input type="text" value={profile.full_name || ""} onChange={(e) => setProfile({...profile, full_name: e.target.value})} className="col-span-2 bg-[#f8fafc] p-3.5 rounded-xl border border-slate-100 font-bold text-slate-800 text-sm focus:border-[#006c49] outline-none" />
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email</label>
            <input disabled type="email" value={profile.email || ""} className="col-span-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100 font-bold text-slate-400 text-sm cursor-not-allowed outline-none" />
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Số điện thoại</label>
            <input type="text" value={profile.phone_number || ""} onChange={(e) => setProfile({...profile, phone_number: e.target.value})} className="col-span-2 bg-[#f8fafc] p-3.5 rounded-xl border border-slate-100 font-bold text-slate-800 text-sm focus:border-[#006c49] outline-none" />
          </div>
          <div className="grid grid-cols-3 items-center gap-4 pt-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Giới tính</label>
            <div className="col-span-2 flex gap-6">
              {["Nam", "Nữ", "Khác"].map((gender) => (
                <label key={gender} className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600">
                  <input type="radio" name="gender" checked={profile.gender === gender} onChange={() => setProfile({...profile, gender: gender})} className="w-4 h-4 accent-[#006c49]" /> {gender}
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 items-center gap-4 pt-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ngày sinh</label>
            <input type="date" value={profile.birthday ? profile.birthday.split('T')[0] : ""} onChange={(e) => setProfile({...profile, birthday: e.target.value})} className="col-span-2 bg-[#f8fafc] p-3.5 rounded-xl border border-slate-100 font-bold text-slate-800 text-sm outline-none focus:border-[#006c49]" />
          </div>
        </div>

        <div className="flex flex-col items-center justify-start pt-2 order-1 lg:order-2">
          <div className="bg-white rounded-[32px] p-8 border-2 border-slate-100 border-dashed w-full flex flex-col items-center text-center">
            <div className="relative mb-4 group">
              <img src={getAvatarSrc(profile.avatar_url)} className="w-28 h-28 rounded-[36px] object-cover border-4 border-white shadow-xl group-hover:scale-105 transition-all" alt="Avatar" />
              <label htmlFor="avatar-up" className="absolute -bottom-1 -right-1 bg-white p-2.5 rounded-xl shadow-lg border border-slate-100 text-[#006c49] cursor-pointer hover:scale-115 transition-all"><Camera size={16} /></label>
              <input type="file" id="avatar-up" className="hidden" accept="image/*" onChange={handleAvatarChange} onClick={(e) => { e.target.value = null; }} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase">Ảnh hồ sơ cá nhân</p>
          </div>
        </div>
      </div>

      <div className="md:hidden pt-6">
        <button onClick={handleSaveProfile} className="w-full bg-[#006c49] text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-wider shadow-md">Lưu thay đổi hồ sơ</button>
      </div>
    </div>
  );
}