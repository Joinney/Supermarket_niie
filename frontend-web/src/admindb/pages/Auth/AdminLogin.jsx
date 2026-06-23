import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from "../../../api/axios"; 

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post('http://localhost:5001/api/auth/signin', { 
        username: email, 
        password: password 
      }, { withCredentials: true });

      const { token, refreshToken, user } = response.data;
      const adminRoles = ['Admin', 'Manager', 'Staff'];

      if (adminRoles.includes(user.role)) {
        
        // BƯỚC QUAN TRỌNG: Xóa sạch tàn dư của tài khoản Khách hàng trước đó
        localStorage.removeItem('user'); 
        localStorage.removeItem('token'); // Nếu sau này bên Khách hàng có lưu token riêng

        // Sau đó mới lưu bộ key của Admin
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
    <div className="min-h-screen w-screen flex overflow-hidden bg-slate-950">
      {/* Left Panel - Green */}
      <div className="hidden lg:flex w-5/12 bg-emerald-600 relative flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
            🛒
          </div>
          <span className="text-white text-2xl font-bold tracking-tight">DemiMart</span>
        </div>

        <div>
          <h1 className="text-white text-6xl font-bold leading-tight mb-4">
            Welcome Back!
          </h1>
          <p className="text-emerald-100 text-xl">
            Đăng nhập để tiếp tục quản trị hệ thống
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-12 right-12 w-80 h-80 border-[20px] border-white/10 rounded-full"></div>
        <div className="absolute -bottom-10 -right-10 w-64 h-64 border-[15px] border-white/10 rounded-full"></div>
        
        <div className="text-white/30 text-sm absolute bottom-8 left-12">
          DemiMart Admin © 2026
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="lg:hidden flex justify-center mb-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-600 rounded-3xl flex items-center justify-center text-4xl">
                🛒
              </div>
              <span className="text-3xl font-bold text-slate-800">DemiMart</span>
            </div>
          </div>

          <div className="text-center lg:text-left mb-10">
            <h2 className="text-4xl font-bold text-slate-900">Welcome Back!</h2>
            <p className="text-slate-600 mt-3 text-lg">
              Đăng nhập để tiếp tục quản trị hệ thống
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-8">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-6 py-4 bg-slate-100 border border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 text-lg"
                placeholder="admin@gmail.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-6 py-4 bg-slate-100 border border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 text-lg"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xl font-semibold rounded-2xl transition-all duration-200 shadow-lg active:scale-[0.985]"
            >
              LOGIN
            </button>
          </form>

          <div className="text-center mt-8">
            <span 
              className="text-emerald-600 hover:text-emerald-700 cursor-pointer text-sm font-medium"
              onClick={() => alert('Chức năng khôi phục mật khẩu sẽ được triển khai sau')}
            >
              Quên mật khẩu? <span className="underline">Khôi phục</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}