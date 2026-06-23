import React, { useState, useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
  Navigate,
} from "react-router-dom";
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
import AdminProtect from "./admindb/components/AdminProtect";
import AdminLogin from "./admindb/pages/Auth/AdminLogin";
import SidebarAdmin from "./admindb/components/Sidebar";
import HeaderAdmin from "./admindb/components/Header";
import Dashboard from "./admindb/pages/Dashboard/ThongKeSanPham";
import ThongKeDonHang from "./admindb/pages/Dashboard/ThongKeDonHang";
import ThongKeKhachHang from "./admindb/pages/Dashboard/ThongKeKhachHang";
import Danhsachsanpham from "./admindb/pages/Products/Danhsachsanpham";
import Danhsachdonhang from "./admindb/pages/Orders/Danhsachdonhang";
import Danhsachnoibo from "./admindb/pages/AuthZ/Danhsachnoibo"; // Import trang giao diện quản lý tài khoản thật

// Các component phục vụ giao diện tĩnh cho mục Settings
const Danhsachvaitro = () => (
  <div className="p-6 bg-white rounded-xl shadow-sm text-gray-700 font-bold">
    Trang Giao Diện: Danh sách vai trò
  </div>
);
const SettingsGeneral = () => (
  <div className="p-6 bg-white rounded-xl shadow-sm text-gray-700 font-bold">
    Trang Giao Diện: Cấu hình chung (General Settings)
  </div>
);

// --- COMPONENT MOCK PHỤC VỤ CHO MỤC KHO HÀNG ---
const Danhsachnhapkho = () => (
  <div className="p-6 bg-white rounded-xl shadow-sm text-gray-700 font-bold">
    Trang Giao Diện: Danh sách nhập kho
  </div>
);
const Quanlylohang = () => (
  <div className="p-6 bg-white rounded-xl shadow-sm text-gray-700 font-bold">
    Trang Giao Diện: Quản lý lô hàng
  </div>
);
const Quanlytonkho = () => (
  <div className="p-6 bg-white rounded-xl shadow-sm text-gray-700 font-bold">
    Trang Giao Diện: Quản lý tồn kho
  </div>
);
const Dieuchuyenkho = () => (
  <div className="p-6 bg-white rounded-xl shadow-sm text-gray-700 font-bold">
    Trang Giao Diện: Điều chuyển kho
  </div>
);

// --- COMPONENT MOCK PHỤC VỤ CHO MỤC KHÁCH HÀNG (QUẢN TRỊ) ---
const GiaoDienDanhSachKhachHang = () => (
  <div className="p-6 bg-white rounded-xl shadow-sm text-gray-700 font-bold">
    Trang Giao Diện: Danh sách khách hàng
  </div>
);
const GiaoDienNhomKhachHang = () => (
  <div className="p-6 bg-white rounded-xl shadow-sm text-gray-700 font-bold">
    Trang Giao Diện: Nhóm khách hàng
  </div>
);
const GiaoDienLoaiKhachHang = () => (
  <div className="p-6 bg-white rounded-xl shadow-sm text-gray-700 font-bold">
    Trang Giao Diện: Loại khách hàng
  </div>
);

/**
 * 1. LAYOUTS (KHÁCH HÀNG & ADMIN)
 */
const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <HeaderKhachHang onOpenMenu={() => setIsSidebarOpen(true)} />
      <div
        className="flex flex-1 w-full relative bg-white"
        style={{ paddingTop: "var(--header-height, 112px)" }}
      >
        <SidebarKhachHang
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        <div className="flex-1 flex flex-col min-w-0 border-l border-gray-100 bg-white">
          <main className="flex-1 overflow-x-hidden bg-white">
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
      <ChatbotAI />
    </div>
  );
};

const AuthLayout = () => (
  <div className="min-h-screen w-full bg-white flex items-center justify-center">
    <Outlet />
  </div>
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
 * 2. CẤU HÌNH ROUTES
 */
const AppRoutes = () => (
  <Routes>
    {/* ================= ROUTES CHO KHÁCH HÀNG ================= */}
    <Route element={<MainLayout />}>
      <Route path="/" element={<Home />} />
      <Route path="/:country_code" element={<Home />} />

      <Route path="/category/:slug" element={<CategoryPage />} />
      <Route path="/category/:parentSlug/:slug" element={<CategoryPage />} />
      <Route path="/:country_code/category/:slug" element={<CategoryPage />} />
      <Route
        path="/:country_code/category/:parentSlug/:slug"
        element={<CategoryPage />}
      />

      <Route path="/search" element={<SearchPage />} />
      <Route
        path="/:country_code/product/:category_slug/:id"
        element={<ProductDetail />}
      />
      <Route path="/cart" element={<Cart />} />
      <Route
        path="/checkout"
        element={
          <ProtectedRoute>
            <Checkout />
          </ProtectedRoute>
        }
      />
      <Route path="/profile/:tab?" element={<Profile />} />
    </Route>

    <Route element={<AuthLayout />}>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
    </Route>

    {/* ================= ROUTES BIỆT LẬP CHO ADMIN ================= */}
    <Route path="/admin/login" element={<AdminLogin />} />

    {/* BỌC ADMIN PROTECT TẠI ĐÂY */}
    <Route path="/admin" element={
      <AdminProtect>
        <AdminDashboardLayout />
      </AdminProtect>
    }>

      {/* Cập nhật luôn đích Navigate mặc định khi gõ /admin gốc */}
      <Route
        index
        element={<Navigate to="dashboard/thongkesanpham" replace />}
      />

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

      {/* Nhóm: Donhang */}
      <Route path="Donhang">
        <Route index element={<Navigate to="Danhsachdonhang" replace />} />
        <Route path="Danhsachdonhang" element={<Danhsachdonhang />} />
      </Route>

      {/* Nhóm: inventory (Kho Hàng) */}
      <Route path="inventory">
        <Route index element={<Navigate to="import-list" replace />} />
        <Route path="import-list" element={<Danhsachnhapkho />} />
        <Route path="batches" element={<Quanlylohang />} />
        <Route path="stock" element={<Quanlytonkho />} />
        <Route path="transfer" element={<Dieuchuyenkho />} />
      </Route>

      {/* Nhóm: customers (Khách Hàng) */}
      <Route path="customers">
        <Route index element={<Navigate to="list" replace />} />
        <Route path="list" element={<GiaoDienDanhSachKhachHang />} />
        <Route path="groups" element={<GiaoDienNhomKhachHang />} />
        <Route path="types" element={<GiaoDienLoaiKhachHang />} />
      </Route>

      {/* Nhóm: settings */}
      <Route path="settings">
        <Route index element={<Navigate to="general" replace />} />
        <Route path="general" element={<SettingsGeneral />} />
      </Route>

      {/* Nhóm: AuthZ (Cập nhật đường dẫn chuẩn khớp với Sidebar) */}
      <Route path="AuthZ">
        <Route index element={<Navigate to="Danhsachnoibo" replace />} />
        <Route path="Danhsachnoibo" element={<Danhsachnoibo />} />
        <Route path="Danhsachvaitro" element={<Danhsachvaitro />} />
      </Route>
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
      <LanguageProvider initialLanguage={initialLanguage}>
        <StoreProvider>
          <CartProvider>
            <OrderProvider>
              <Router>
                <AppContent />
              </Router>
            </OrderProvider>
          </CartProvider>
        </StoreProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
