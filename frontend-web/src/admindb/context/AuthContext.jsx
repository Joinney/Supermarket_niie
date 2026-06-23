import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Giả lập check token khi tải trang (Sau này kết nối với API Backend của bạn)
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Hàm đăng nhập giả lập cho Khách hàng
 const login = async (username, password) => {
    // Giả lập hoặc gọi API thật cho Khách hàng tại đây
    if (username && password) {
      
      // BƯỚC QUAN TRỌNG: Xóa sạch sành sanh tàn dư của bộ khung Admin cũ
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminRefreshToken');
      localStorage.removeItem('adminRole');
      localStorage.removeItem('adminInfo');

      // Sau đó mới lưu thông tin Khách hàng mới
      const mockUser = { name: username, role: "user" };
      localStorage.setItem("user", JSON.stringify(mockUser));
      setUser(mockUser);
      
      return { success: true };
    }
    return { success: false, message: "Sai tài khoản hoặc mật khẩu" };
  };

  // Hàm đăng xuất
  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};