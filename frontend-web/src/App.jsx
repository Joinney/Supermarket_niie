import React, { useState, useEffect, useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
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
import Global from "./pages/Homeindex/global/global.jsx";
import Login from "./pages/Auth/Login";
import Signup from "./pages/Auth/Signup";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import Profile from "./pages/Profile/Profile";
import Promotion from "./pages/Promotion/PromotionPage";
import CategoryPage from "./pages/Category/CategoryPage";
import ProductDetail from "./pages/Productdetail/ProductDetail";
import Cart from "./pages/Giohang/Cart";
import SearchPage from "./pages/Search/SearchPage";
import { StoreProvider } from "./context/StoreContext";
import ChatbotAI from "./components/layout/ChatbotAI";

// --- IMPORTS GIAO DIỆN ADMIN (ĐÃ SỬA CHÍNH XÁC CHỮ HOA/THƯỜNG THEO GIT INDEX) ---
import AdminProtect from "./admindb/components/AdminProtect";
import AdminProfile from "./admindb/pages/Profile/AdminProfile.jsx";
import AdminLogin from "./admindb/pages/Auth/AdminLogin.jsx";
import SidebarAdmin from "./admindb/components/Sidebar";
import HeaderAdmin from "./admindb/components/Header";

import AdminDashboardPage from "./admindb/pages/Dashboard/AdminDashboardPage.jsx";
import Dashboard from "./admindb/pages/Dashboard/ThongKeSanPham.jsx";
import ThongKeDonHang from "./admindb/pages/Dashboard/ThongKeDonHang.jsx";
import ThongKeKhachHang from "./admindb/pages/Dashboard/ThongKeKhachHang.jsx";
import Danhsachsanpham from "./admindb/pages/Products/tatcasanpham/Danhsachsanpham.jsx";
import Danhsachdonhang from "./admindb/pages/Orders/Danhsachdonhang.jsx";
import Chitietdonhang from "./admindb/pages/Orders/OrderDetail.jsx";
import DanhsachTrackingorder from "./admindb/pages/Orders/DanhsachTrackingorder.jsx";
import Chitiettrackingorder from "./admindb/pages/Orders/chitiettrackingorder.jsx";
import AdminProductDetail from "./admindb/pages/Products/tatcasanpham/ProductDetail.jsx";
import AdminVariantDetail from "./admindb/pages/Products/tatcasanpham/bienthesanpham/VariantDetail.jsx";
import AdminCreateVariant from "./admindb/pages/Products/tatcasanpham/bienthesanpham/CreateVariant.jsx";
import ProductCreate from "./admindb/pages/Products/tatcasanpham/ProductCreate.jsx";
import ProductEdit from "./admindb/pages/Products/tatcasanpham/ProductEdit.jsx";
import ParentCategories from "./admindb/pages/Products/danhmuccha/ParentCategories.jsx";
import ParentCategoryForm from "./admindb/pages/Products/danhmuccha/ParentCategoryForm.jsx";
import ChildCategories from "./admindb/pages/Products/danhmuccon/ChildCategories.jsx";
import ChildCategoryForm from "./admindb/pages/Products/danhmuccon/ChildCategoryForm.jsx";
import Units from "./admindb/pages/Products/quychuandonggoi/Units.jsx";
import UnitForm from "./admindb/pages/Products/quychuandonggoi/UnitsForm.jsx";
import Nation from "./admindb/pages/Products/thitruongquocgia/National.jsx";
import NationalForm from "./admindb/pages/Products/thitruongquocgia/NationalForm.jsx";

// Import các Form/Page từ Warehouse
import DanhSachPhieuNhap from "./admindb/pages/Warehouse/dansachphieunhap/DanhSachPhieuNhap.jsx";
import TaoPhieuNhapForm from "./admindb/pages/Warehouse/dansachphieunhap/TaoPhieuNhapForm.jsx";
import ChiTietPhieuNhap from "./admindb/pages/Warehouse/dansachphieunhap/ChiTietPhieuNhap.jsx";

import DanhSachKho from "./admindb/pages/Warehouse/danhsachkho/DanhSachKho.jsx";
import TaoKhoForm from "./admindb/pages/Warehouse/danhsachkho/TaoKhoForm.jsx";

import LoHang from "./admindb/pages/Warehouse/Lohang.jsx";
import TonKho from "./admindb/pages/Warehouse/Tonkho.jsx";
import ChuyenKho from "./admindb/pages/Warehouse/dieuchuyenkho/Chuyenkho.jsx";

// --- IMPORTS KHÁCH HÀNG (ADMIN CONTROL) ---
import Danhsachkhachhang from "./admindb/pages/Customers/Danhsachkhachhang.jsx";
import Chitietkhachhang from "./admindb/pages/Customers/Chitietkhachhang.jsx";

// Nhóm quản lý nội bộ
import Danhsachnoibo from "./admindb/pages/Settings/Quanlynoibo/Danhsachnoibo.jsx";
import Chitietnoibo from "./admindb/pages/Settings/Quanlynoibo/Chitietnoibo.jsx";
import Danhsachvaitro from "./admindb/pages/Settings/Quanlyvaitro/Danhsachvaitro.jsx";
import VipSettings from "./admindb/pages/Settings/VipSettings";

// --- IMPORTS MODULE QUẢN LÝ KHUYẾN MÃI ---
import DanhSachGiamGia from "./admindb/pages/Promotions/DanhSachGiamGia.jsx";
import TaoGiamGia from "./admindb/pages/Promotions/TaoGiamGia.jsx";
import CreateCoupon from "./admindb/pages/Promotions/CreateCoupon.jsx";

// --- IMPORT TRANG POSTER BUILDER ---
import PosterBuilder from "./admindb/pages/quanlyposterthongbao/PosterBuilder.jsx";

/**
 * Component Giao Diện Cấu hình chung (General Settings)
 */
const SettingsGeneral = () => {
  const [isTaxIncluded, setIsTaxIncluded] = useState(true);
  const [is2FA, setIs2FA] = useState(false);

  return (
    <div className="w-full text-gray-800">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Cài đặt chung</h1>
        <p className="text-xs text-gray-400 mt-1">
          Quản lý nhận diện cốt lõi và các thông số vận hành của cửa hàng.
        </p>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
        {/* LEFT COLUMN */}
        <div className="space-y-6 lg:col-span-2">
          {/* SECTION 1: Thông tin cửa hàng & Chi nhánh */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <div className="rounded-lg bg-emerald-50 p-1.5 text-emerald-600">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-sm font-bold text-gray-900">
                Thông tin cửa hàng & Chi nhánh
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Tên cửa hàng
                </label>
                <input
                  type="text"
                  defaultValue="Demi Mart Chi nhánh chính"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Mã chi nhánh
                </label>
                <input
                  type="text"
                  defaultValue="DM-HCM-001"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Loại hình cửa hàng
                </label>
                <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none bg-white">
                  <option>Siêu thị</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Email liên hệ
                </label>
                <input
                  type="email"
                  defaultValue="admin@demimart.vn"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Số điện thoại
                </label>
                <input
                  type="text"
                  defaultValue="090 123 4567"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Mã số thuế
                </label>
                <input
                  type="text"
                  defaultValue="0312345678"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Địa chỉ cửa hàng
                </label>
                <input
                  type="text"
                  defaultValue="123 Đường Thương Mại, Quận 1, TP. Hồ Chí Minh"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Cấu hình Thuế & Hóa đơn */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <div className="rounded-lg bg-emerald-50 p-1.5 text-emerald-600">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h2 className="text-sm font-bold text-gray-900">
                Cấu hình Thuế & Hóa đơn
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 items-center">
              <div className="md:col-span-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Thuế suất mặc định (%)
                </label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    defaultValue="10"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="absolute right-3 text-xs text-gray-400">
                    %
                  </span>
                </div>
              </div>
              <div className="md:col-span-2 flex items-center justify-between rounded-xl bg-gray-50/70 p-3">
                <div>
                  <p className="text-xs font-semibold text-gray-880">
                    Giá đã bao gồm thuế
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Hiển thị giá bán cuối cùng đã tính VAT
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTaxIncluded(!isTaxIncluded)}
                  className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${isTaxIncluded ? "bg-[#007A5A]" : "bg-gray-200"}`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${isTaxIncluded ? "translate-x-5" : "translate-x-1"}`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 3: Bảo mật & Hệ thống */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <div className="rounded-lg bg-emerald-50 p-1.5 text-emerald-600">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h2 className="text-sm font-bold text-gray-900">
                Bảo mật & Hệ thống
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="md:col-span-1 flex items-center justify-between rounded-xl bg-gray-50/70 p-3">
                <div>
                  <p className="text-xs font-semibold text-gray-880">
                    Xác thực 2 lớp (2FA)
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Yêu cầu OTP khi đăng nhập
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIs2FA(!is2FA)}
                  className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${is2FA ? "bg-[#007A5A]" : "bg-gray-200"}`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${is2FA ? "translate-x-5" : "translate-x-1"}`}
                  />
                </button>
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Thời gian tự động đăng xuất
                </label>
                <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none bg-white">
                  <option>Sau 1 giờ không hoạt động</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Giới hạn IP truy cập
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: 192.168.1.1, 10.0.0.5 (Để trống để cho phép tất cả)"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none placeholder:text-gray-300"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* SECTION 5: Cài đặt Vùng & Ngôn ngữ */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <div className="rounded-lg bg-emerald-50 p-1.5 text-emerald-600">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                  />
                </svg>
              </div>
              <h2 className="text-sm font-bold text-gray-900">
                Cài đặt Vùng & Ngôn ngữ
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Tiền tệ mặc định
                </label>
                <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none bg-white">
                  <option>VND - Việt Nam Đồng (đ)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Múi giờ
                </label>
                <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none bg-white">
                  <option>(GMT+07:00) Bangkok, Hà Nội, Jakarta</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Component Guard bảo vệ Module Admin
 */
const AdminModuleGuard = ({ moduleName, children }) => {
  const userRole = localStorage.getItem("adminRole") || "";
  const adminInfo = JSON.parse(localStorage.getItem("adminInfo") || "{}");

  if (userRole === "ADMIN" || userRole === "Admin") return children;

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
      (p.module === moduleName || p.name === moduleName || p.id === moduleName) &&
      (p.view === true || p.view === "true"),
  );

  return hasAccess ? (
    children
  ) : (
    <Navigate to="/admin/dashboard/thongkesanpham" replace />
  );
};

/**
 * LAYOUTS
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
 * CẤU HÌNH ROUTES
 */
const AppRoutes = () => (
  <Routes>
    {/* ================= ROUTES CHO KHÁCH HÀNG ================= */}
    <Route element={<MainLayout />}>
      <Route path="/" element={<Home />} />
      <Route path="/global" element={<Global />} />
      <Route path="/:country_code/:tabSlug?" element={<Home />} />
      <Route
        path="/:country_code/category/khuyen-mai"
        element={<Promotion />}
      />
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

      {/* 🏠 Bảng điều khiển */}
      <Route
        path="dashboard"
        element={
          <AdminModuleGuard moduleName="Bảng điều khiển (Dashboard)">
            <Outlet />
          </AdminModuleGuard>
        }
      >
        <Route index element={<Navigate to="tongquan" replace />} />
        <Route path="tongquan" element={<AdminDashboardPage />} />
        <Route path="thongkesanpham" element={<Dashboard />} />
        <Route path="thongkedonhang" element={<ThongKeDonHang />} />
        <Route path="thongkekhachhang" element={<ThongKeKhachHang />} />
      </Route>

      {/* 🛒 Danh sách sản phẩm */}
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

      {/* 🎁 Quản Lý Khuyến Mãi */}
      <Route
        path="promotions"
        element={
          <AdminModuleGuard moduleName="Quản lý khuyến mãi">
            <Outlet />
          </AdminModuleGuard>
        }
      >
        <Route index element={<Navigate to="danh-sach" replace />} />
        <Route path="danh-sach" element={<DanhSachGiamGia />} />
        <Route path="tao-moi" element={<TaoGiamGia />} />
        <Route path="sua-flashsale/:id" element={<TaoGiamGia />} />
        <Route path="tao-coupon" element={<CreateCoupon />} />
        <Route path="sua-coupon/:id" element={<CreateCoupon />} />
      </Route>

      {/* 🌟 QUẢN LÝ POSTER VÀ THÔNG BÁO 🌟 */}
      <Route
        path="posters-notifications"
        element={
          <AdminModuleGuard moduleName="posters">
            <Outlet />
          </AdminModuleGuard>
        }
      >
        <Route index element={<Navigate to="poster" replace />} />
        <Route path="poster" element={<PosterBuilder />} />
        <Route
          path="thong-bao"
          element={
            <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <h2 className="text-xl font-bold text-slate-800">
                Quản Lý Thông Báo Hệ Thống
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Gửi thông báo đẩy (Push Notifications) và tin nhắn khuyến mãi
                tới khách hàng.
              </p>
            </div>
          }
        />
      </Route>

      {/* 🌍 Quốc Gia */}
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

      <Route
        path="Donhang/Chitiettracking/:id"
        element={<Chitiettrackingorder />}
      />

      {/* 📄 Đơn Hàng */}
      <Route
        path="Donhang"
        element={
          <AdminModuleGuard moduleName="Đơn Hàng">
            <Outlet />
          </AdminModuleGuard>
        }
      >
        <Route
          index
          element={<Navigate to="DanhsachTrackingorder" replace />}
        />
        <Route
          path="DanhsachTrackingorder"
          element={<DanhsachTrackingorder />}
        />
        <Route path="Danhsachdonhang" element={<Danhsachdonhang />} />
        <Route path="Chitietdonhang/:id" element={<Chitietdonhang />} />
      </Route>

      {/* 📦 Kho Hàng */}
      <Route
        path="inventory"
        element={
          <AdminModuleGuard moduleName="Kho Hàng">
            <Outlet />
          </AdminModuleGuard>
        }
      >
        <Route index element={<Navigate to="warehouse-list" replace />} />
        <Route path="warehouse-list" element={<DanhSachKho />} />
        <Route path="create-warehouse" element={<TaoKhoForm />} />
        <Route path="edit-warehouse/:id" element={<TaoKhoForm />} />
        <Route path="import-list" element={<DanhSachPhieuNhap />} />
        <Route path="import-detail/:id" element={<ChiTietPhieuNhap />} />
        <Route path="create-import-ticket" element={<TaoPhieuNhapForm />} />
        <Route path="batches" element={<LoHang />} />
        <Route path="stock" element={<TonKho />} />
        <Route path="transfer" element={<ChuyenKho />} />
      </Route>

      {/* 👥 Khách Hàng */}
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
        <Route
          path="list/Chitietkhachhang/:id"
          element={<Chitietkhachhang />}
        />
      </Route>

      {/* 🛡️ Cài đặt & Phân quyền */}
      <Route
        path="settings"
        element={
          <AdminModuleGuard moduleName="Tài khoản & Phân quyền">
            <Outlet />
          </AdminModuleGuard>
        }
      >
        <Route index element={<Navigate to="generalsettings" replace />} />
        <Route path="generalsettings" element={<SettingsGeneral />} />
        <Route path="vip-tiers" element={<VipSettings />} />

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
 * COMPONENT ĐIỀU PHỐI
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

  return (
    <>
      <Toaster
        position="top-right"
        reverseOrder={false}
        containerStyle={{
          top: 20,
          zIndex: 999999,
        }}
      />
      <AppRoutes />
    </>
  );
};

/**
 * FINAL APP
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