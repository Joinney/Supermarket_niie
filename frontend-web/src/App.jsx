import React, { useState, useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from "react-router-dom";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { OrderProvider } from "./context/OrderContext";
import { LanguageProvider } from "./context/LanguageContext";
import { ProtectedRoute } from "./components/Auth/ProtectedRoute";

// --- IMPORTS GIAO DIỆN KHÁCH HÀNG ---
import Checkout from "./pages/Checkout/Checkout";
import HeaderKhachHang from "./components/Header";
import SidebarKhachHang from "./components/Sidebar";
import Footer from "./components/Footer";
import Home from "./pages/Homeindex/Home";
import Login from "./pages/Auth/Login";
import Signup from "./pages/Auth/Signup";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import Profile from "./pages/Profile/Profile";
import CategoryPage from "./pages/Category/CategoryPage";
import ProductDetail from "./pages/Productdetail/ProductDetail";
import Cart from "./pages/Giohang/Cart"; 
import SearchPage from "./pages/Search/SearchPage";
import { StoreProvider } from "./context/StoreContext";
import ChatbotAI from "./components/chatbotai/ChatbotAI";

// --- IMPORTS GIAO DIỆN ADMIN ---
import AdminLogin from "./admindb/pages/Auth/AdminLogin";
import SidebarAdmin from "./admindb/components/Sidebar"; 
import HeaderAdmin from "./admindb/components/Header";   
import Dashboard from "./admindb/pages/Dashboard/ThongKeSanPham"; 
import ThongKeDonHang from "./admindb/pages/Dashboard/ThongKeDonHang"; 
import ThongKeKhachHang from "./admindb/pages/Dashboard/ThongKeKhachHang"; 
import Danhsachsanpham from "./admindb/pages/Products/Danhsachsanpham";

// Các component tạm thời phục vụ giao diện tĩnh cho mục Settings
const Danhsachquanlynoibo = () => <div className="p-6 bg-white rounded-xl shadow-sm text-gray-700 font-bold">Trang Giao Diện: Danh sách quản lý nội bộ</div>;
const Danhsachvaitro = () => <div className="p-6 bg-white rounded-xl shadow-sm text-gray-700 font-bold">Trang Giao Diện: Danh sách vai trò</div>;
const SettingsGeneral = () => <div className="p-6 bg-white rounded-xl shadow-sm text-gray-700 font-bold">Trang Giao Diện: Cấu hình chung (General Settings)</div>;

/**
 * 1. LAYOUTS (KHÁCH HÀNG & ADMIN)
 */
const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <HeaderKhachHang onOpenMenu={() => setIsSidebarOpen(true)} />
      <div className="flex flex-1 w-full relative bg-white" style={{ paddingTop: "var(--header-height, 112px)" }}> 
        <SidebarKhachHang isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0 border-l border-gray-100 bg-white"> 
          <main className="flex-1 overflow-x-hidden bg-white"><Outlet /></main>
          <Footer />
        </div>
      </div>
      <ChatbotAI />
    </div>
  );
};

const AuthLayout = () => (
  <div className="min-h-screen w-full bg-white flex items-center justify-center"><Outlet /></div>
);

const AdminDashboardLayout = () => {
  return (
    <div className="flex h-screen w-screen bg-[#fafafa] overflow-hidden font-sans">
      <SidebarAdmin /> 
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <HeaderAdmin /> 
        <main className="flex-1 overflow-y-auto p-6 bg-[#fafafa]">
          <Outlet /> 
        </main>
      </div>
    </div>
  );
};

/**
 * 2. CẤU HÌNH ROUTES (Quy hoạch toàn bộ cụm quản trị về AuthZ)
 */
const AppRoutes = () => (
  <Routes>
    {/* ================= ROUTES CHO KHÁCH HÀNG ================= */}
    <Route element={<MainLayout />}>
      <Route path="/" element={<Home />} />
      <Route path="/category/:slug" element={<CategoryPage />} />
      <Route path="/category/:parentSlug/:slug" element={<CategoryPage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/:country_code/product/:category_slug/:id" element={<ProductDetail />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} /> 
      <Route path="/profile/:tab?" element={<Profile />} />
    </Route>

    <Route element={<AuthLayout />}>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
    </Route>

    {/* ================= ROUTES BIỆT LẬP CHO ADMIN ================= */}
    <Route path="/admin/login" element={<AdminLogin />} />
    
    <Route path="/admin" element={<AdminDashboardLayout />}>
      {/* Tự động nhảy vào trang thống kê khi vào /admin gốc */}
      <Route index element={<Navigate to="dashboard/thongkesanpham" replace />} />
      
      {/* Nhóm: dashboard */}
      <Route path="dashboard">
        <Route index element={<Navigate to="thongkesanpham" replace />} />
        <Route path="thongkesanpham" element={<Dashboard />} />
        <Route path="thongkedonhang" element={<ThongKeDonHang />} /> 
        <Route path="thongkekhachhang" element={<ThongKeKhachHang />} /> 
      </Route>

      {/* Nhóm: products */}
      <Route path="products">
        <Route index element={<Navigate to="Danhsachsanpham" replace />} />
        <Route path="Danhsachsanpham" element={<Danhsachsanpham />} />
      </Route>

      {/* 🌟 ĐÃ ĐỔI: Toàn bộ mục thiết lập tài khoản & phân quyền gom hết vào cụm AuthZ */}
      <Route path="AuthZ">
        {/* URL: /admin/AuthZ -> tự nhảy vào trang danh sách quản lý nội bộ trước */}
        <Route index element={<Navigate to="InternalList" replace />} />
        
        {/* URL thực tế: http://localhost:5173/admin/AuthZ/InternalList */}
        <Route path="InternalList" element={<Danhsachquanlynoibo />} />
        
        {/* URL thực tế: http://localhost:5173/admin/AuthZ/Danhsachvaitro */}
        <Route path="Danhsachvaitro" element={<Danhsachvaitro />} />
      </Route>

      {/* Settings tổng quát giữ nguyên */}
      <Route path="settings/general" element={<SettingsGeneral />} />
    </Route>

    {/* Điều hướng dự phòng */}
    <Route path="/admin/*" element={<Navigate to="/admin/login" replace />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

/**
 * 3. COMPONENT ĐIỀU PHỐI
 */
const AppContent = () => {
  const { loading } = useContext(AuthContext);
  if (loading) {
    return (
      <div className="fixed inset-0 bg-white z-[9999] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  return <AppRoutes />;
};

/**
 * 4. FINAL APP
 */
function App({ initialLanguage }) {
  return (
    <AuthProvider>
      <StoreProvider>
        <CartProvider>
          <OrderProvider>
            <LanguageProvider initialLanguage={initialLanguage}>
              <Router>
                <AppContent />
              </Router>
            </LanguageProvider>
          </OrderProvider>
        </CartProvider>
      </StoreProvider>
    </AuthProvider>
  );
}

export default App;