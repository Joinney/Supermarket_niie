import React from "react";
import { ShieldCheck, ChevronRight, Mail, Lock } from "lucide-react";

export default function Tabbaomat({
  securityStep, setSecurityStep, currentPassword, setCurrentPassword, handleVerifyCurrentPassword,
  profile, handleSendOTP, otpCode, setOtpCode, handleVerifyOTP, newPassword, setNewPassword,
  confirmNewPassword, setConfirmNewPassword, handleResetPassword
}) {
  return (
    <div className="animate-fadeIn space-y-6 text-left">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-xl font-black text-slate-900">Bảo mật tài khoản</h2>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Quản lý cấu trúc mã khóa mật mã hệ thống</p>
      </div>

      <div className="max-w-xl mx-auto pt-4">
        <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm relative overflow-hidden text-center">
          {securityStep === "verify-password" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="w-16 h-16 bg-[#e6f0ed] rounded-3xl flex items-center justify-center text-[#006c49] mx-auto"><ShieldCheck size={32} /></div>
              <div>
                <h3 className="font-black text-slate-800 text-lg">Xác nhận danh tính</h3>
                <p className="text-xs text-slate-500 font-medium">Nhập mật khẩu hiện tại để tiếp tục thiết lập chuỗi bảo mật.</p>
              </div>
              <div className="space-y-4">
                <input type="password" placeholder="••••••••" className="w-full bg-[#f8fafc] border border-slate-100 p-4 rounded-2xl text-center text-sm font-bold outline-none focus:border-[#006c49]" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                <button onClick={handleVerifyCurrentPassword} className="w-full bg-[#006c49] text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-md">Tiếp tục bước kế</button>
                <button onClick={() => setSecurityStep("forgot-password")} className="w-full text-[10px] font-black text-[#006c49] uppercase hover:underline">Bạn quên mật khẩu bảo mật?</button>
              </div>
            </div>
          )}

          {securityStep === "forgot-password" && (
            <div className="space-y-6 animate-fadeIn">
              <button onClick={() => setSecurityStep("verify-password")} className="absolute top-6 left-6 text-slate-300 hover:text-slate-900"><ChevronRight size={20} className="rotate-180" /></button>
              <div className="w-16 h-16 bg-[#e6f0ed] rounded-3xl flex items-center justify-center text-[#006c49] mx-auto"><Mail size={32} /></div>
              <div>
                <h3 className="font-black text-slate-800 text-lg">Khôi phục mật mã</h3>
                <p className="text-xs text-slate-500 font-medium">Mã OTP bảo mật sẽ được gửi về hòm thư Email đăng ký:<br /><b className="text-slate-900">{profile.email}</b></p>
              </div>
              <button onClick={handleSendOTP} className="w-full bg-[#006c49] text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-md">Bắn mã OTP về Email</button>
            </div>
          )}

          {securityStep === "otp-verify" && (
            <div className="space-y-6 animate-fadeIn">
              <button onClick={() => setSecurityStep("forgot-password")} className="absolute top-6 left-6 text-slate-300 hover:text-slate-900"><ChevronRight size={20} className="rotate-180" /></button>
              <div>
                <h3 className="font-black text-slate-800 text-lg">Xác thực mã OTP</h3>
                <p className="text-xs text-slate-500 font-medium">Nhập mã xác thực 6 chữ số vừa nhận được</p>
              </div>
              <div className="flex justify-center">
                <input maxLength={6} className="w-44 bg-[#f8fafc] border border-slate-100 p-4 rounded-2xl text-center text-2xl font-black tracking-[0.5em] outline-none focus:border-[#006c49]" value={otpCode} onChange={e => setOtpCode(e.target.value)} />
              </div>
              <button onClick={handleVerifyOTP} className="w-full bg-[#006c49] text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-md">Xác thực Token</button>
            </div>
          )}

          {securityStep === "reset-password" && (
            <div className="space-y-6 animate-fadeIn text-left">
              <button onClick={() => otpCode ? setSecurityStep("otp-verify") : setSecurityStep("verify-password")} className="flex items-center gap-2 text-slate-300 hover:text-slate-900 mb-2"><ChevronRight size={18} className="rotate-180" /><span className="text-[10px] font-black uppercase tracking-widest">Trở lại</span></button>
              <div>
                <h3 className="font-black text-slate-800 text-lg">Đặt lại chuỗi khóa mật mã</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mật khẩu mới</label>
                  <input type="password" placeholder="Tối thiểu 8 ký tự" className="w-full bg-[#f8fafc] border border-slate-100 p-4 rounded-2xl text-sm font-bold outline-none focus:border-[#006c49]" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nhập lại chuỗi ký tự</label>
                  <input type="password" placeholder="Xác nhận mã bảo mật" className="w-full bg-[#f8fafc] border border-slate-100 p-4 rounded-2xl text-sm font-bold outline-none focus:border-[#006c49]" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} />
                </div>
                <button onClick={handleResetPassword} className="w-full bg-[#006c49] text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-md">Lưu mật mã mới</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}