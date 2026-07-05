import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// 🌟 ĐỒNG BỘ: Sử dụng cấu hình instance axios tập trung đã gán sẵn BaseURL bảo mật
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

      // 🚀 TỐI ƯU: Loại bỏ URL gán cứng, truyền endpoint tương đối sạch sẽ qua instance axios
      const response = await axios.post('/auth/signin', { 
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
    <div className="fixed inset-0 min-h-screen w-screen flex flex-col justify-between bg-emerald-950 font-sans select-none overflow-hidden text-left">
      
      {/* ẢNH NỀN KHÔNG CẮT */}
      <img 
        src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1974&auto=format&fit=crop" 
        alt="Background Supermarket" 
        className="absolute inset-0 w-full h-full object-cover z-0 object-center"
      />
      
      {/* Lớp phủ mờ nhẹ phía sau để ảnh nền vẫn giữ được màu sắc rõ ràng */}
      <div className="absolute inset-0 bg-black/15 z-10"></div>

      {/* HEADER BAR */}
      <header className="relative z-20 w-full px-6 py-4 md:px-8 flex items-center justify-between text-white text-sm bg-gradient-to-b from-black/40 via-black/20 to-transparent backdrop-blur-[1px] shadow-sm">
        <div className="flex items-center gap-3 bg-black/20 px-3 py-1.5 rounded-full border border-white/5 backdrop-blur-md">
          <img 
            src={logoImg} 
            alt="Demi Mart Logo" 
            className="h-7 w-auto object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] brightness-0 invert" 
          />
          <div className="h-4 w-[1px] bg-white/30"></div>
          <span className="font-bold tracking-wider text-xs uppercase text-emerald-400 drop-shadow-sm">Admin</span>
        </div>
        
        <div className="flex items-center gap-4 text-white/80">
          <button className="hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full cursor-pointer" title="Help">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
            </svg>
          </button>
          <button className="relative hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full cursor-pointer" title="Notifications">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>
          </button>
        </div>
      </header>

      {/* LOGIN BOX CENTRAL */}
      <main className="relative z-20 flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-[400px] bg-emerald-950/45 backdrop-blur-md rounded-[20px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-8 md:p-9 flex flex-col border border-white/10">
          
          <div className="text-center mb-6">
            <h1 className="text-[26px] font-bold text-white tracking-wide">Login</h1>
          </div>

          {error && (
            <div className="mb-4 bg-red-500/20 border border-red-500/30 text-red-200 px-4 py-2.5 rounded-xl text-xs text-center font-medium backdrop-blur-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Input Username */}
            <div>
              <label className="block text-xs font-semibold text-white/90 mb-1.5 pl-1">Email</label>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-blue-50/95 border border-transparent rounded-lg focus:outline-none focus:bg-white text-sm text-gray-800 placeholder-gray-400 font-normal shadow-inner"
                placeholder="Username"
              />
            </div>

            {/* Input Password */}
            <div>
              <label className="block text-xs font-semibold text-white/90 mb-1.5 pl-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-blue-50/95 border border-transparent rounded-lg focus:outline-none focus:bg-white text-sm text-gray-800 placeholder-gray-400 font-normal shadow-inner"
                  placeholder="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 cursor-pointer"
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

            {/* Sign-in Button */}
            <button
              type="submit"
              className="w-full bg-[#40966d] hover:bg-[#35825d] text-white py-2.5 mt-2 rounded-lg font-medium text-sm transition-all active:scale-[0.99] shadow-md cursor-pointer"
            >
              Login
            </button>
          </form>

          {/* Bottom Links */}
          <div className="text-center mt-5 space-y-2">
            <a href="#forgot" className="block text-xs text-white/80 hover:underline italic">
              Forgot password?
            </a>
            <div className="text-xs text-white/50">
              Wglaye <span className="font-semibold text-white/90">password</span>?{' '}
              <a href="#password" className="text-[#48a97b] hover:underline font-medium">Password</a>
            </div>
          </div>

        </div>
      </main>

      {/* FOOTER BAR */}
      <footer className="relative z-20 w-full px-6 py-4 md:px-8 flex flex-col sm:flex-row items-center justify-between text-[11px] font-medium text-white/60 border-t border-white/10 bg-emerald-950/40 backdrop-blur-md gap-3 tracking-wide">
        <div className="uppercase text-center sm:text-left drop-shadow-sm select-none">
          © 2026 <span className="text-white font-semibold">Demi Mart Enterprises</span>. Restricted Administrative Access.
        </div>
        <div className="flex items-center gap-6 uppercase font-semibold">
          <a href="#privacy" className="hover:text-emerald-400 transition-colors duration-200">Privacy</a>
          <a href="#security" className="hover:text-emerald-400 transition-colors duration-200">Security</a>
          <a href="#support" className="hover:text-emerald-400 transition-colors duration-200">Support</a>
        </div>
      </footer>
    </div>
  );
}