import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from "../../../api/axios"; 

// Đồng bộ hóa Logo từ thư mục assets
import logoImg from '../../assets/Demi Mart.png';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      let browserIp = window.location.hostname;
      if (browserIp === 'localhost' || browserIp === '127.0.0.1') {
        browserIp = '127.0.0.1';
      }

      const response = await axios.post('http://localhost:5001/api/auth/signin', { 
        username: email, 
        password: password,
        browser_ip: browserIp 
      }, { withCredentials: true });

      const { token, refreshToken, user } = response.data;
      const adminRoles = ['Admin', 'Manager', 'Staff'];

      if (adminRoles.includes(user.role)) {
        localStorage.removeItem('user'); 
        localStorage.removeItem('token'); 

        localStorage.setItem('adminToken', token);
        localStorage.setItem('adminRefreshToken', refreshToken);
        localStorage.setItem('adminRole', user.role); 
        localStorage.setItem('adminInfo', JSON.stringify(user));

        navigate('/admin/dashboard/thongkesanpham');
      } else {
        setError('Tài khoản của bạn là Khách hàng, không có quyền truy cập Quản trị!');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi kết nối máy chủ!');
    }
  };

  return (
    <div className="fixed inset-0 min-h-screen w-screen flex flex-col justify-between bg-emerald-950 font-sans select-none overflow-hidden">
      
      {/* ẢNH NỀN KHÔNG CẮT: Đảm bảo phủ kín, căn giữa hoàn hảo và không vỡ hình */}
      <img 
        src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1974&auto=format&fit=crop" 
        alt="Background Supermarket" 
        className="absolute inset-0 w-full h-full object-cover z-0 object-center"
      />
      
      {/* Lớp phủ màu mờ đậm chất nguyên bản */}
      <div className="absolute inset-0 bg-emerald-950/85 backdrop-blur-[2px] z-10"></div>

      {/* HEADER BAR */}
      <header className="relative z-20 w-full px-6 py-4 md:px-8 flex items-center justify-between text-white/90 text-sm">
        <div className="flex items-center gap-2">
          <img src={logoImg} alt="Demi Mart Logo" className="h-6 w-auto object-contain" />
          <span className="font-medium tracking-wide text-sm opacity-80">Admin</span>
        </div>
        <div className="flex items-center gap-4 text-white/70">
          <button className="hover:text-white transition-colors" title="Help">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
            </svg>
          </button>
          <button className="relative hover:text-white transition-colors" title="Notifications">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>
          </button>
        </div>
      </header>

      {/* LOGIN BOX CENTRAL */}
      <main className="relative z-20 flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-[420px] bg-white rounded-[24px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] p-8 md:p-10 flex flex-col border border-gray-100">
          
          <div className="text-center mb-8">
            <h1 className="text-[24px] font-bold text-gray-900 tracking-wide uppercase">WELCOME BACK</h1>
            <p className="text-xs text-gray-500 font-medium mt-1.5 leading-relaxed px-2">
              Secure enterprise access to the administration console.
            </p>
          </div>

          {error && (
            <div className="mb-5 bg-red-50 border border-red-100 text-red-600 px-4 py-2.5 rounded-xl text-xs text-center font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Input Username */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Username / Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                </span>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-sm text-gray-800 placeholder-gray-300"
                  placeholder="admin_user"
                />
              </div>
            </div>

            {/* Input Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Security Password</label>
                <span 
                  onClick={() => alert('Chức năng khôi phục mật khẩu sẽ được triển khai sau')}
                  className="text-[10px] text-emerald-600 hover:underline font-bold cursor-pointer"
                >
                  Recovery access?
                </span>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-sm text-gray-800 placeholder-gray-300 tracking-widest"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 17.772 17.772m-1.414-1.414a3.5 3.5 0 1 1-4.949-4.95" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember Workstation checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 accent-emerald-700 cursor-pointer"
              />
              <label htmlFor="remember" className="text-xs text-gray-500 font-medium cursor-pointer select-none">
                Remember this workstation
              </label>
            </div>

            {/* Sign-in Button */}
            <button
              type="submit"
              className="w-full bg-[#005e3a] hover:bg-[#004d30] text-white py-3 mt-2 rounded-xl font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
            >
              <span>Sign In To Console</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15M12 9l3 3m0 0-3 3m3-3H2.25" />
              </svg>
            </button>
          </form>

        </div>
      </main>

      {/* FOOTER BAR */}
      <footer className="relative z-20 w-full px-6 py-4 md:px-8 flex flex-col sm:flex-row items-center justify-between text-[10px] font-semibold text-white/40 border-t border-white/5 bg-black/10 backdrop-blur-sm gap-2">
        <div className="uppercase tracking-wider text-center sm:text-left">
          © 2026 DEMI MART ENTERPRISES. RESTRICTED ADMINISTRATIVE ACCESS.
        </div>
        <div className="flex items-center gap-4 uppercase tracking-wider">
          <a href="#privacy" className="hover:text-white/70 transition-colors">Privacy</a>
          <a href="#security" className="hover:text-white/70 transition-colors">Security</a>
          <a href="#support" className="hover:text-white/70 transition-colors">Support</a>
        </div>
      </footer>
    </div>
  );
}