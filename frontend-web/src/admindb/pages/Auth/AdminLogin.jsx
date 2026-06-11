import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    // 🎯 LOGIC ĐĂNG NHẬP LÀM MẪU (MOCK LOGIN)
    if (email === 'admin@gmail.com' && password === '123456') {
      // Lưu thông tin giả lập vào localStorage để làm mẫu dữ liệu session
      localStorage.setItem('adminToken', 'mock_token_key_demimart_2026');
      localStorage.setItem('adminRole', 'superadmin');
      
      console.log("🔑 Đăng nhập Admin mẫu thành công! Đang chuyển hướng...");
      
      // Cho phép chuyển hướng thẳng sang trang Dashboard
      navigate('/admin/dashboard');
    } else {
      // Nếu nhập bất kỳ tài khoản/mật khẩu nào khác sẽ báo lỗi này
      setError('Tài khoản hoặc mật khẩu Admin mẫu không chính xác! (Thử lại với: admin@gmail.com / 123456)');
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-slate-900 px-4 m-0 p-0 absolute inset-0 z-[99999]">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">🛡️ DemiMart Admin</h2>
          <p className="text-xs text-gray-400 mt-2 font-medium">Hệ thống quản trị nội bộ độc lập</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl text-xs font-bold text-center mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="text-left">
            <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-widest mb-1.5 ml-1">Tài khoản Admin</label>
            <input
              type="text" // Đổi sang text để bạn gõ nhanh không cần check định dạng email nếu muốn
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-gray-50"
              placeholder="admin@gmail.com"
            />
          </div>

          <div className="text-left">
            <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-widest mb-1.5 ml-1">Mật khẩu</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-gray-50"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl transition duration-200 text-sm shadow-lg uppercase tracking-wider mt-2"
          >
            Đăng Nhập Hệ Thống
          </button>
        </form>
      </div>
    </div>
  );
}