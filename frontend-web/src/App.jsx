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
import VnpayReturn from "./pages/Checkout/VnpayReturn";
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
import AdminProfile from "./admindb/pages/Profile/AdminProfile";
import AdminLogin from "./admindb/pages/Auth/AdminLogin";
import SidebarAdmin from "./admindb/components/Sidebar";
import HeaderAdmin from "./admindb/components/Header";
import Dashboard from "./admindb/pages/Dashboard/ThongKeSanPham";
import ThongKeDonHang from "./admindb/pages/Dashboard/ThongKeDonHang";
import ThongKeKhachHang from "./admindb/pages/Dashboard/ThongKeKhachHang";
import Danhsachsanpham from "./admindb/pages/Products/Danhsachsanpham";
import Danhsachdonhang from "./admindb/pages/Orders/Danhsachdonhang";
import AdminProductDetail from "./admindb/pages/Products/ProductDetail";
import AdminVariantDetail from "./admindb/pages/products/VariantDetail";
import AdminCreateVariant from "./admindb/pages/Products/CreateVariant";
import ProductCreate from "./admindb/pages/Products/ProductCreate";
import ProductEdit from "./admindb/pages/Products/ProductEdit";
import ParentCategories from "./admindb/pages/Products/ParentCategories";
import ParentCategoryForm from "./admindb/pages/Products/ParentCategoryForm";
import ChildCategories from "./admindb/pages/Products/ChildCategories";
import ChildCategoryForm from "./admindb/pages/Products/ChildCategoryForm";
import Units from "./admindb/pages/Products/Units";
import UnitForm from "./admindb/pages/Products/UnitsForm";
import Nation from "./admindb/pages/Products/National";
import NationalForm from "./admindb/pages/Products/NationalForm";

// Import các Form/Page thực tế từ Warehouse
import DanhSachPhieuNhap from "./admindb/pages/Warehouse/dansachphieunhap/DanhSachPhieuNhap.jsx";
import TaoPhieuNhapForm from "./admindb/pages/Warehouse/dansachphieunhap/TaoPhieuNhapForm.jsx";
import ChiTietPhieuNhap from "./admindb/pages/Warehouse/dansachphieunhap/ChiTietPhieuNhap.jsx";
import NhapKhoForm from "./admindb/pages/Warehouse/danhsachkho/NhapKhoForm.jsx";
import TaoKhoForm from "./admindb/pages/Warehouse/danhsachkho/TaoKhoForm.jsx";
import LoHang from "./admindb/pages/Warehouse/LoHang.jsx";
import TonKho from "./admindb/pages/Warehouse/TonKho.jsx";
import ChuyenKho from "./admindb/pages/Warehouse/dieuchuyenkho/Chuyenkho.jsx";

// --- IMPORTS KHÁCH HÀNG - NHÓM KHÁCH HÀNG - LOẠI KHÁCH HÀNG ---
import Danhsachkhachhang from "./admindb/pages/Customers/Danhsachkhachhang";
import Nhomkhachhang from "./admindb/pages/Customers/Nhomkhachhang";
import Loaikhachhang from "./admindb/pages/Customers/Loaikhachhang";

// Nhóm quản lý nội bộ
import Danhsachnoibo from "./admindb/pages/Settings/Quanlynoibo/Danhsachnoibo";
import Chitietnoibo from "./admindb/pages/Settings/Quanlynoibo/Chitietnoibo";
import Danhsachvaitro from "./admindb/pages/Settings/Quanlyvaitro/Danhsachvaitro";

// Component tĩnh phục vụ giao diện Settings
const SettingsGeneral = () => (
  <div className="p-6 bg-white rounded-xl shadow-sm text-gray-700 font-bold">
    Trang Giao Diện: Cấu hình chung (General Settings)
  </div>
);

/**
 * 🎯 ĐOẠN NÀY ĐỂ ĐỌC QUYỀN VÀ KHÓA CHẶT ROUTE GỐC
 */
const AdminModuleGuard = ({ moduleName, children }) => {
  const userRole = localStorage.getItem("adminRole") || "";
  const adminInfo = JSON.parse(localStorage.getItem("adminInfo") || "{}");

  if (userRole === "Admin") return children;

  let permissions = [];
  try {
    let rawPerms = adminInfo.custom_permissions;
    if (typeof rawPerms === "string") rawPerms = JSON.parse(rawPerms);
    permissions = Array.isArray(rawPerms) ? rawPerms : [];
  } catch (e) {
    console.error("Lỗi xác thực Guard:", e);
  }

  const hasAccess = permissions.some(
    (p) =>
      (p.module === moduleName || p.name === moduleName) &&
      (p.view === true || p.view === "true"),
  );

  return hasAccess ? (
    children
  ) : (
    <Navigate to="/admin/dashboard/thongkesanpham" replace />
  );
};

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
        path="/:country_code/product/:category_slug/:id/:variantId?"
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
      <Route path="/checkout/vnpay-return" element={<VnpayReturn />} />
      <Route path="/profile/:tab?" element={<Profile />} />
    </Route>

    <Route element={<AuthLayout />}>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
    </Route>

    {/* ================= ROUTES BIỆT LẬP CHO ADMIN ================= */}
    <Route path="/admin/login" element={<AdminLogin />} />
    <Route
      path="/admin"
      element={
        <AdminProtect>
          <AdminDashboardLayout />
        </AdminProtect>
      }
    >
      <Route path="profile" element={<AdminProfile />} />
      <Route
        index
        element={<Navigate to="dashboard/thongkesanpham" replace />}
      />

      {/* 🏠 Bọc Bảng điều khiển */}
      <Route
        path="dashboard"
        element={
          <AdminModuleGuard moduleName="Bảng điều khiển (Dashboard)">
            <Outlet />
          </AdminModuleGuard>
        }
      >
        <Route index element={<Navigate to="thongkesanpham" replace />} />
        <Route path="thongkesanpham" element={<Dashboard />} />
        <Route path="thongkedonhang" element={<ThongKeDonHang />} />
        <Route path="thongkekhachhang" element={<ThongKeKhachHang />} />
      </Route>

      {/* 🛒 Bọc Danh sách sản phẩm */}
      <Route
        path="products"
        element={
          <AdminModuleGuard moduleName="Danh sách sản phẩm">
            <Outlet />
          </AdminModuleGuard>
        }
      >
        <Route index element={<Navigate to="Danhsachsanpham" replace />} />
        <Route path="create" element={<ProductCreate />} />
        <Route path="edit/:id" element={<ProductEdit />} />
        <Route path="Danhsachsanpham" element={<Danhsachsanpham />} />
        <Route path="detail/:id" element={<AdminProductDetail />} />
        <Route
          path="variant-detail/:variantId"
          element={<AdminVariantDetail />}
        />
        <Route
          path="create-variant/:id/:variantId?"
          element={<AdminCreateVariant />}
        />
        <Route path="parent-categories" element={<ParentCategories />} />
        <Route
          path="/admin/products/parent-categories/create"
          element={<ParentCategoryForm />}
        />
        <Route
          path="/admin/products/parent-categories/edit/:id"
          element={<ParentCategoryForm />}
        />
        <Route path="child-categories" element={<ChildCategories />} />
        <Route
          path="/admin/products/child-categories/create"
          element={<ChildCategoryForm />}
        />
        <Route
          path="/admin/products/child-categories/edit/:id"
          element={<ChildCategoryForm />}
        />
        <Route path="units" element={<Units />} />
        <Route path="/admin/products/units/create" element={<UnitForm />} />
        <Route path="/admin/products/units/edit/:id" element={<UnitForm />} />
      </Route>

      {/* 🌍 Bọc Quản Lý Cửa Hàng / Quốc Gia */}
      <Route
        path="nations"
        element={
          <AdminModuleGuard moduleName="Quốc Gia">
            <Outlet />
          </AdminModuleGuard>
        }
      >
        <Route index element={<Navigate to="list" replace />} />
        <Route path="list" element={<Nation />} />
        <Route path="create" element={<NationalForm />} />
        <Route path="edit/:id" element={<NationalForm />} />
      </Route>

      {/* 📄 Bọc Đơn Hàng */}
      <Route
        path="Donhang"
        element={
          <AdminModuleGuard moduleName="Đơn Hàng">
            <Outlet />
          </AdminModuleGuard>
        }
      >
        <Route index element={<Navigate to="Danhsachdonhang" replace />} />
        <Route path="Danhsachdonhang" element={<Danhsachdonhang />} />
      </Route>

      {/* 📦 Bọc Kho Hàng */}
      <Route
        path="inventory"
        element={
          <AdminModuleGuard moduleName="Kho Hàng">
            <Outlet />
          </AdminModuleGuard>
        }
      >
        <Route index element={<Navigate to="import-list" replace />} />
        <Route path="create-import" element={<NhapKhoForm />} />
        <Route path="create-warehouse" element={<TaoKhoForm />} />
        <Route path="import-list" element={<DanhSachPhieuNhap />} />
        <Route path="create-import-ticket" element={<TaoPhieuNhapForm />} />
        <Route path="import-detail/:id" element={<ChiTietPhieuNhap />} />{" "}
        {/* 👈 Đã thêm route xem chi tiết động bằng ID tại đây */}
        <Route path="batches" element={<LoHang />} />
        <Route path="stock" element={<TonKho />} />
        <Route path="transfer" element={<ChuyenKho />} />
      </Route>

      {/* 👥 Bọc Khách Hàng */}
      <Route
        path="customers"
        element={
          <AdminModuleGuard moduleName="Khách Hàng">
            <Outlet />
          </AdminModuleGuard>
        }
      >
        <Route index element={<Navigate to="list" replace />} />
        <Route path="list" element={<Danhsachkhachhang />} />
        <Route path="groups" element={<Nhomkhachhang />} />
        <Route path="types" element={<Loaikhachhang />} />
      </Route>

      {/* 🛡️ Bọc Tài khoản & Phân quyền */}
      <Route
        path="settings"
        element={
          <AdminModuleGuard moduleName="Tài khoản & Phân quyền">
            <Outlet />
          </AdminModuleGuard>
        }
      >
        <Route index element={<Navigate to="general" replace />} />
        <Route path="general" element={<SettingsGeneral />} />
        <Route path="quanlynoibo">
          <Route index element={<Navigate to="danhsachnoibo" replace />} />
          <Route path="danhsachnoibo" element={<Danhsachnoibo />} />
          <Route path="danhsachnoibo/:email" element={<Chitietnoibo />} />
          <Route path="danhsachnoibo/chitietnoibo" element={<Chitietnoibo />} />
        </Route>
        <Route path="quanlyvaitro">
          <Route index element={<Navigate to="danhsachvaitro" replace />} />
          <Route path="danhsachvaitro" element={<Danhsachvaitro />} />
        </Route>
      </Route>
    </Route>

    <Route
      path="/admin/settings/quanlynoibo/chitietnoibo/:id"
      element={<Chitietnoibo />}
    />

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
