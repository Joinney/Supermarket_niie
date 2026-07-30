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
import Global from "./pages/Homeindex/global/global.jsx"; // 🌟 Bổ sung Import trang Global
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

// --- IMPORTS GIAO DIỆN ADMIN ---
import AdminProtect from "./admindb/components/AdminProtect";
import AdminProfile from "./admindb/pages/profile/AdminProfile.jsx";
import AdminLogin from "./admindb/pages/auth/AdminLogin.jsx";
import SidebarAdmin from "./admindb/components/Sidebar";
import HeaderAdmin from "./admindb/components/Header";
// Thêm dòng này ngay dưới import HeaderAdmin từ "./admindb/components/Header";
import AdminDashboardPage from "./admindb/pages/dashboard/AdminDashboardPage.jsx";
import Dashboard from "./admindb/pages/dashboard/ThongKeSanPham.jsx";
import ThongKeDonHang from "./admindb/pages/dashboard/ThongKeDonHang.jsx";
import ThongKeKhachHang from "./admindb/pages/dashboard/ThongKeKhachHang.jsx";
import Danhsachsanpham from "./admindb/pages/products/tatcasanpham/Danhsachsanpham.jsx";
import Danhsachdonhang from "./admindb/pages/orders/Danhsachdonhang.jsx";
import Chitietdonhang from "./admindb/pages/orders/OrderDetail.jsx";
import DanhsachTrackingorder from "./admindb/pages/orders/DanhsachTrackingorder.jsx";
import Chitiettrackingorder from "./admindb/pages/orders/chitiettrackingorder.jsx";
import AdminProductDetail from "./admindb/pages/products/tatcasanpham/ProductDetail.jsx";
import AdminVariantDetail from "./admindb/pages/products/tatcasanpham/bienthesanpham/VariantDetail.jsx";
import AdminCreateVariant from "./admindb/pages/products/tatcasanpham/bienthesanpham/CreateVariant.jsx";
import ProductCreate from "./admindb/pages/products/tatcasanpham/ProductCreate.jsx";
import ProductEdit from "./admindb/pages/products/tatcasanpham/ProductEdit.jsx";
import ParentCategories from "./admindb/pages/products/danhmuccha/ParentCategories.jsx";
import ParentCategoryForm from "./admindb/pages/products/danhmuccha/ParentCategoryForm.jsx";
import ChildCategories from "./admindb/pages/products/danhmuccon/ChildCategories.jsx";
import ChildCategoryForm from "./admindb/pages/products/danhmuccon/ChildCategoryForm.jsx";
import Units from "./admindb/pages/products/quychuandonggoi/Units.jsx";
import UnitForm from "./admindb/pages/products/quychuandonggoi/UnitsForm.jsx";
import Nation from "./admindb/pages/products/thitruongquocgia/National.jsx";
import NationalForm from "./admindb/pages/products/thitruongquocgia/NationalForm.jsx";

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
import Danhsachkhachhang from "./admindb/pages/customers/Danhsachkhachhang.jsx";
import Chitietkhachhang from "./admindb/pages/customers/Chitietkhachhang.jsx";

// Nhóm quản lý nội bộ
import Danhsachnoibo from "./admindb/pages/settings/Quanlynoibo/Danhsachnoibo.jsx";
import Chitietnoibo from "./admindb/pages/settings/Quanlynoibo/Chitietnoibo.jsx";
import Danhsachvaitro from "./admindb/pages/settings/Quanlyvaitro/Danhsachvaitro.jsx";
import VipSettings from "./admindb/pages/Settings/VipSettings";

// --- 🌟 IMPORTS MODULE QUẢN LÝ KHUYẾN MÃI TIẾNG VIỆT CHUẨN CẤU TRÚC 🌟 ---
import DanhSachGiamGia from "./admindb/pages/Promotions/DanhSachGiamGia.jsx";
import TaoGiamGia from "./admindb/pages/Promotions/TaoGiamGia.jsx";
import CreateCoupon from "./admindb/pages/Promotions/CreateCoupon.jsx";

/**
 * 🎯 ĐÃ THAY THẾ: Component Giao Diện Cấu hình chung (General Settings) thực tế theo hình mẫu
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

          {/* SECTION 4: Tích hợp & API */}
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
                    d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
                  />
                </svg>
              </div>
              <h2 className="text-sm font-bold text-gray-900">
                Tích hợp & API
              </h2>
            </div>
            <div>
              {/* Webhook URL (Đồng bộ kho hàng) */}
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                Webhook URL (Đồng bộ kho hàng)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  defaultValue="https://api.demimart.vn/v1/webhooks/inventory-sync"
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none text-gray-600"
                />
                <button
                  type="button"
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Kiểm tra kết nối
                </button>
              </div>
              <p className="mt-2 text-[11px] text-gray-400">
                Dùng để đồng bộ tồn kho thời gian thực với các hệ thống bên
                ngoài.
              </p>
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
                {/* Tiền tệ mặc định */}
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Tiền tệ mặc định
                </label>
                <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none bg-white">
                  <option>VND - Việt Nam Đồng (đ)</option>
                </select>
              </div>
              <div>
                {/* Múi giờ */}
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Múi giờ
                </label>
                <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none bg-white">
                  <option>(GMT+07:00) Bangkok, Hà Nội, Jakarta</option>
                </select>
              </div>
              <div>
                {/* Ngôn ngữ hệ thống */}
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Ngôn ngữ hệ thống
                </label>
                <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none bg-white">
                  <option>Tiếng Việt</option>
                </select>
              </div>
              <div>
                {/* Định dạng ngày tháng */}
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Định dạng ngày tháng
                </label>
                <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none bg-white">
                  <option>DD/MM/YYYY (31/12/2023)</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 6: Giờ hoạt động */}
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-sm font-bold text-gray-900">Giờ hoạt động</h2>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-600">T2 - T6</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    defaultValue="08:00"
                    className="w-14 rounded-lg border border-gray-200 px-2 py-1 text-center text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <span>-</span>
                  <input
                    type="text"
                    defaultValue="22:00"
                    className="w-14 rounded-lg border border-gray-200 px-2 py-1 text-center text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-600">Thứ Bảy</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    defaultValue="09:00"
                    className="w-14 rounded-lg border border-gray-200 px-2 py-1 text-center text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <span>-</span>
                  <input
                    type="text"
                    defaultValue="23:00"
                    className="w-14 rounded-lg border border-gray-200 px-2 py-1 text-center text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-600">Chủ Nhật</span>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-500 uppercase tracking-wide">
                    Đóng cửa
                  </span>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <button
                type="button"
                className="mt-4 w-full rounded-xl border border-dashed border-emerald-500 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-50/40 transition"
              >
                + Thêm ngày nghỉ Lễ
              </button>
            </div>
          </div>

          {/* SECTION 7: Tài sản thương hiệu */}
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
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h2 className="text-sm font-bold text-gray-900">
                Tài sản thương hiệu
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                {/* Logo cửa hàng */}
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Logo cửa hàng
                </label>
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-5 text-center cursor-pointer hover:bg-gray-50 transition">
                  <div className="rounded-full bg-emerald-50 p-2 text-emerald-600 mb-2">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                  </div>
                  <p className="text-xs font-bold text-gray-700">
                    Tải lên Logo mới
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    SVG, PNG, WEBP, JPG (Tối đa 800x800px)
                  </p>
                </div>
              </div>

              <div>
                {/* Màu sắc thương hiệu */}
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Màu sắc thương hiệu
                </label>
                <div className="flex items-center gap-3">
                  <div
                    className="h-7 w-7 rounded-lg bg-[#007A5A] shadow-inner cursor-pointer border border-black/5"
                    title="#007A5A"
                  />
                  <div
                    className="h-7 w-7 rounded-lg bg-white shadow-inner cursor-pointer border border-gray-200"
                    title="#FFFFFF"
                  />
                  <button
                    type="button"
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-600 transition text-sm"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM ACTION BAR */}
      <div className="mt-6 flex items-center justify-between rounded-xl bg-white p-4 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 text-[11px] text-emerald-600 font-semibold">
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
          <span>
            Đã bật đồng bộ hóa tự động cho tất cả các thiết bị đầu cuối.
          </span>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            className="rounded-lg px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 transition"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            className="rounded-lg bg-[#007A5A] px-4 py-2 text-xs font-bold text-white hover:bg-[#006349] transition shadow-sm"
          >
            Cập nhật cài đặt
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * 💡 ĐOẠN NÀY ĐỂ ĐỌC QUYỀN VÀ KHÓA CHẶT ROUTE GỐC
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
      <Route path="/global" element={<Global />} /> {/* 🌟 Bổ sung Route trang Global khớp cấu hình */}
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

      {/* 🏠 Bọc Bảng điều khiển */}
      <Route
        path="dashboard"
        element={
          <AdminModuleGuard moduleName="Bảng điều khiển (Dashboard)">
            <Outlet />
          </AdminModuleGuard>
        }
      >
        {/* ❌ DÒNG CŨ: <Route index element={<Navigate to="thongkesanpham" replace />} /> */}
  {/*  SỬA THÀNH: */}
  <Route index element={<Navigate to="tongquan" replace />} />
  
  {/* 🌟 BỔ SUNG ROUTE CON CHO TRANG TỔNG QUAN KINH DOANH MỚI: */}
  <Route path="tongquan" element={<AdminDashboardPage />} />
  
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

      {/* Quản Lý Khuyến Mãi (Promotion & Flash Sale & Coupon) */}
      <Route
        path="promotions"
        element={
          <AdminModuleGuard moduleName="Quản lý khuyến mãi">
            <Outlet />
          </AdminModuleGuard>
        }
      >
        <Route index element={<Navigate to="danh-sach" replace />} />

        {/* Trang danh sách tổng hợp */}
        <Route path="danh-sach" element={<DanhSachGiamGia />} />

        {/* 1. flash sale */}
        <Route path="tao-moi" element={<TaoGiamGia />} />
        {/* Edit Flash Sale */}
        <Route path="sua-flashsale/:id" element={<TaoGiamGia />} />

        {/* Mã Coupon/Voucher */}
        <Route path="tao-coupon" element={<CreateCoupon />} />
        {/* Edit Coupon */}
        <Route path="sua-coupon/:id" element={<CreateCoupon />} />
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

      {/* 🌟 ĐƯA RA NGOÀI GUARD: Trang chi tiết tracking mock tĩnh nằm độc lập ở đây để không bị đá ra login */}
      <Route
        path="Donhang/Chitiettracking/:id"
        element={<Chitiettrackingorder />}
      />
      {/* 📄 Bọc Đơn Hàng */}
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

      {/* 📦 Bọc Kho Hàng */}
      <Route
        path="inventory"
        element={
          <AdminModuleGuard moduleName="Kho Hàng">
            <Outlet />
          </AdminModuleGuard>
        }
      >
        {/* Chuyển hướng mặc định */}
        <Route index element={<Navigate to="warehouse-list" replace />} />
        {/* ---- Nhóm 1: Quản lý Kho Vật Lý ---- */}
        <Route path="warehouse-list" element={<DanhSachKho />} />
        <Route path="create-warehouse" element={<TaoKhoForm />} />
        <Route path="edit-warehouse/:id" element={<TaoKhoForm />} />{" "}
        {/* ---- Nhóm 2: Quản lý Chứng từ (Phiếu Nhập) ---- */}
        <Route path="import-list" element={<DanhSachPhieuNhap />} />
        <Route path="import-detail/:id" element={<ChiTietPhieuNhap />} />
        <Route path="create-import-ticket" element={<TaoPhieuNhapForm />} />
        {/* ---- Nhóm 3: Quản lý Hàng Hóa bên trong ---- */}
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
        <Route
          path="list/Chitietkhachhang/:id"
          element={<Chitietkhachhang />}
        />{" "}
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

  return (
    <>
      {/* 🔔 BỔ SUNG CONTAINER TOASTER ĐỂ HIỂN THỊ THÔNG BÁO POPUP TOÀN MÀN HÌNH */}
      <Toaster 
          position="top-right" 
          reverseOrder={false}
          containerStyle={{
            top: 20,
            zIndex: 999999, // Nổi lên trên toàn bộ Header
          }}
        />
      <AppRoutes />
    </>
  );
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