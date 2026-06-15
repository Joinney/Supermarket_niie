import React, { useState, useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from "react-router-dom";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { OrderProvider } from "./context/OrderContext";
import { LanguageProvider } from "./context/LanguageContext";
import { ProtectedRoute } from "./components/ProtectedRoute"; // Bảo vệ route khách hàng

// --- IMPORTS GIAO DIỆN KHÁCH HÀNG ---
import Checkout from "./pages/Checkout/Checkout";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Login from "./pages/Auth/Login";
import Signup from "./pages/Auth/Signup";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import Profile from "./pages/Profile/Profile";
import CategoryPage from "./pages/Category/CategoryPage";
import ProductDetail from "./pages/Productdetail/ProductDetail";
import Cart from "./pages/Giohang/Cart";
import SearchPage from "./pages/Search/SearchPage";

// --- IMPORTS GIAO DIỆN ADMIN (ĐÃ SỬA CHUẨN ĐƯỜNG DẪN) ---
import AdminLogin from "./admindb/pages/Auth/AdminLogin";
import Dashboard from "./admindb/pages/Dashboard"; // SỬA: Đúng vị trí src/admindb/pages/Dashboard.jsx
import AdminProtect from "./admindb/components/AdminProtect"; // Bộ lọc bảo vệ admin

/**
 * 1. LAYOUTS (KHÁCH HÀNG)
 */
const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header onOpenMenu={() => setIsSidebarOpen(true)} />
      <div className="flex flex-1 pt-[112px] w-full relative bg-white"> 
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0 border-l border-gray-100 bg-white"> 
          <main className="flex-1 overflow-x-hidden bg-white"><Outlet /></main>
          <Footer />
        </div>
      </div>
    </div>
  );
};

const AuthLayout = () => (
  <div className="min-h-screen w-full bg-white flex items-center justify-center"><Outlet /></div>
);

/**
 * NEW: LAYOUTS (ADMIN BIỆT LẬP)
 */
const AdminLayout = () => (
  <div className="min-h-screen w-full bg-gray-100 text-gray-900">
    <Outlet />
  </div>
);

/**
 * 2. CẤU HÌNH ROUTES
 */
const AppRoutes = () => (
  <Routes>
    {/* ================= ROUTES CHO KHÁCH HÀNG ================= */}
    <Route element={<MainLayout />}>
      <Route path="/" element={<Home />} />
      <Route path="/category/:slug" element={<CategoryPage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/:country_code/product/:category_slug/:id/:variantId?" element={<ProductDetail />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={
        <ProtectedRoute>
          <Checkout />
        </ProtectedRoute>
      } /> 
      <Route path="/profile/:tab?" element={<Profile />} />
    </Route>

    <Route element={<AuthLayout />}>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
    </Route>

    {/* ================= ROUTES BIỆT LẬP CHO ADMIN ================= */}
    <Route element={<AdminLayout />}>
      {/* Trang đăng nhập của Admin */}
      <Route path="/admin/login" element={<AdminLogin />} />
      
      {/* Trang quản trị Dashboard */}
      {/* MẸO: Tạm thời bỏ bọc <AdminProtect> để test xem ứng dụng có hết trắng trang không */}
      <Route path="/admin/dashboard" element={<Dashboard />} />

      {/* Điều hướng an toàn */}
      <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
    </Route>
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
      <CartProvider>
        <OrderProvider>
          <LanguageProvider initialLanguage={initialLanguage}>
            <Router>
              <AppContent />
            </Router>
          </LanguageProvider>
        </OrderProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;