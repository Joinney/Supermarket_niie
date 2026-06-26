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
import ParentCategories from "./admindb/pages/Products/ParentCategories";
import ChildCategories from "./admindb/pages/Products/ChildCategories";
import Units from "./admindb/pages/Products/Units";

// --- IMPORTS KHÁCH HÀNG - NHÓM KHÁCH HÀNG - LOẠI KHÁCH HÀNG (ĐÃ SỬA CHÍNH TẢ) ---
import Danhsachkhachhang from "./admindb/pages/Customers/Danhsachkhachhang";
import Nhomkhachhang from "./admindb/pages/Customers/Nhomkhachhang";
import Loaikhachhang from "./admindb/pages/Customers/Loaikhachhang";

// Nhóm quản lý nội bộ
import Danhsachnoibo from "./admindb/pages/Settings/Quanlynoibo/Danhsachnoibo";
import Chitietnoibo from "./admindb/pages/Settings/Quanlynoibo/Chitietnoibo";
import Danhsachvaitro from "./admindb/pages/Settings/Quanlyvaitro/Danhsachvaitro";

// Các component phục vụ giao diện tĩnh cho mục Settings
const SettingsGeneral = () => (
  <div className="p-6 bg-white rounded-xl shadow-sm text-gray-700 font-bold">
    Trang Giao Diện: Cấu hình chung (General Settings)
  </div>
);

// --- MODULE: DANH SÁCH NHẬP KHO ---
const Danhsachnhapkho = () => {
  const MOCK_IMPORT_DATA = [
    {
      id: "PN2401-08",
      warehouse: "Kho Tổng (Quận 1)",
      status: "completed",
      date: "28/01/2024 08:00",
      creator: "admin",
      total: 120000000,
      debt: 0,
    },
    {
      id: "PN2401-07",
      warehouse: "Kho Nông Sản Cầu Đất",
      status: "debt",
      date: "27/01/2024 15:30",
      creator: "nv_kho_01",
      total: 45500000,
      debt: 15000000,
    },
    {
      id: "PN2401-06",
      warehouse: "Kho Vật TW",
      status: "completed",
      date: "27/01/2024 10:15",
      creator: "admin",
      total: 89000000,
      debt: 0,
    },
    {
      id: "PN2401-05",
      warehouse: "Kho Tổng (Quận 1)",
      status: "debt",
      date: "26/01/2024 14:20",
      creator: "nv_kho_02",
      total: 210000000,
      debt: 50000000,
    },
    {
      id: "PN2401-04",
      warehouse: "Kho Nông Sản Cầu Đất",
      status: "completed",
      date: "25/01/2024 09:00",
      creator: "admin",
      total: 32400000,
      debt: 0,
    },
    {
      id: "PN2401-03",
      warehouse: "Kho Vật TW",
      status: "completed",
      date: "24/01/2024 16:45",
      creator: "nv_kho_01",
      total: 15600000,
      debt: 0,
    },
    {
      id: "PN2401-02",
      warehouse: "Kho Tổng (Quận 1)",
      status: "debt",
      date: "23/01/2024 11:10",
      creator: "admin",
      total: 75000000,
      debt: 25000000,
    },
    {
      id: "PN2401-01",
      warehouse: "Kho Nông Sản Cầu Đất",
      status: "completed",
      date: "22/01/2024 08:30",
      creator: "nv_kho_02",
      total: 12800000,
      debt: 0,
    },
  ];
  const formatCurrency = (num) =>
    new Intl.NumberFormat("vi-VN").format(num) + " đ";

  return (
    <div className="w-full min-h-screen bg-[#fafafa] font-sans text-gray-800 antialiased">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
            Danh sách nhập kho
          </h1>
          <nav className="text-sm text-gray-400 mt-1">
            Dashboard &gt;{" "}
            <span className="text-emerald-600 font-medium">
              Danh sách nhập kho
            </span>
          </nav>
        </div>
        <button className="bg-[#22c55e] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#16a34a] transition-colors shadow-sm">
          + Tạo Phiếu nhập
        </button>
      </div>

      <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <input
            type="text"
            placeholder="Search for id, name product"
            className="flex-1 max-w-xs pl-3 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
          />
          <select className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-600 outline-none font-medium">
            <option>Tất cả trạng thái</option>
          </select>
          <div className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-400 font-medium">
            2024-01-21 đến 2024-01-27
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3.5 py-2 border border-gray-200 bg-white rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
            Lọc
          </button>
          <button className="px-3.5 py-2 border border-gray-200 bg-white rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
            Xuất
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                <th className="py-4 px-6">Mã phiếu nhập</th>
                <th className="py-4 px-6">Kho nhận</th>
                <th className="py-4 px-6">Tình trạng</th>
                <th className="py-4 px-6">Ngày nhập</th>
                <th className="py-4 px-6">Người lập</th>
                <th className="py-4 px-6 text-right">Tổng tiền</th>
                <th className="py-4 px-6 text-right">Nợ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
              {MOCK_IMPORT_DATA.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-slate-50/60 transition-colors"
                >
                  <td className="py-4 px-6 text-blue-500 font-semibold">
                    {row.id}
                  </td>
                  <td className="py-4 px-6 text-gray-600 font-normal">
                    {row.warehouse}
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${row.status === "completed" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"}`}
                    >
                      {row.status === "completed" ? "Hoàn thành" : "Còn nợ"}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-400 font-normal">
                    {row.date}
                  </td>
                  <td className="py-4 px-6 text-gray-500 font-normal">
                    {row.creator}
                  </td>
                  <td className="py-4 px-6 text-right text-gray-900 font-bold">
                    {formatCurrency(row.total)}
                  </td>
                  <td
                    className={`py-4 px-6 text-right font-bold ${row.debt > 0 ? "text-rose-500" : "text-gray-300"}`}
                  >
                    {formatCurrency(row.debt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-5 border-t border-gray-100 flex items-center justify-between bg-white flex-wrap gap-4">
          <div className="flex items-center gap-8">
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400">
                Tổng số phiếu
              </p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">8</p>
            </div>
            <div className="border-l border-gray-200 pl-8">
              <p className="text-[10px] uppercase font-bold text-gray-400">
                Tổng tiền nhập
              </p>
              <p className="text-xl font-bold text-emerald-600 mt-0.5">
                {formatCurrency(520200000)}
              </p>
            </div>
            <div className="border-l border-gray-200 pl-8">
              <p className="text-[10px] uppercase font-bold text-gray-400">
                Tổng nợ
              </p>
              <p className="text-xl font-bold text-rose-500 mt-0.5">
                {formatCurrency(90000000)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>The page on</span>
            <select className="border border-gray-200 rounded px-2 py-1 bg-white text-gray-700 outline-none">
              <option>1</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MODULE: QUẢN LÝ LÔ HÀNG ---
const Quanlylohang = () => {
  const MOCK_LOT_DATA = [
    {
      id: "1",
      lotCode: "LOT-APL-2601",
      productName: "Táo Đỏ Loại A",
      mfgDate: "01/01/2026",
      expDate: "30/06/2026",
      stock: "150 Thùng",
      status: "active",
    },
    {
      id: "2",
      lotCode: "LOT-APL-2601",
      productName: "Táo Đỏ Loại A",
      mfgDate: "01/05/2026",
      expDate: "15/05/2026",
      stock: "50 Thùng",
      status: "warning",
    },
    {
      id: "3",
      lotCode: "LOT-APL-2601",
      productName: "Rau Cải Xanh Hữu Cơ",
      mfgDate: "01/05/2026",
      expDate: "08/05/2026",
      stock: "12 Kg",
      status: "expired",
    },
  ];

  return (
    <div className="w-full min-h-screen bg-[#fafafa] font-sans text-gray-800 antialiased">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
            Quản lý lô hàng
          </h1>
          <nav className="text-sm text-gray-400 mt-1">
            Dashboard &gt;{" "}
            <span className="text-emerald-600 font-medium">
              Quản lý lô hàng
            </span>
          </nav>
        </div>
        <button className="px-4 py-2 border border-gray-200 bg-white rounded-lg shadow-sm text-sm text-gray-600 font-medium hover:bg-gray-50 transition-colors">
          Xuất
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <div className="bg-white p-6 rounded-xl border-l-[5px] border-emerald-500 shadow-sm">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Tổng Lot đang lưu
          </p>
          <p className="text-3xl font-bold text-gray-800 mt-0.5">124</p>
        </div>
        <div className="bg-white p-6 rounded-xl border-l-[5px] border-amber-500 shadow-sm">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Lot cận date (dưới 30 ngày)
          </p>
          <p className="text-3xl font-bold text-gray-800 mt-0.5">5</p>
        </div>
        <div className="bg-white p-6 rounded-xl border-l-[5px] border-rose-500 shadow-sm">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Lot hết hạn
          </p>
          <p className="text-3xl font-bold text-gray-800 mt-0.5">2</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 mb-6">
        <input
          type="text"
          placeholder="Tìm mã LOT, SKU..."
          className="flex-1 pl-4 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
        />
        <select className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-600 outline-none">
          <option>Trạng thái HSD</option>
        </select>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                <th className="py-4 px-6 text-center">Mã LOT</th>
                <th className="py-4 px-6">Sản phẩm</th>
                <th className="py-4 px-6 text-center">Ngày SX</th>
                <th className="py-4 px-6 text-center">HSD</th>
                <th className="py-4 px-6 text-center">Tồn hiện tại</th>
                <th className="py-4 px-6 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
              {MOCK_LOT_DATA.map((lot) => (
                <tr
                  key={lot.id}
                  className="hover:bg-slate-50/60 transition-colors"
                >
                  <td className="py-4 px-6 text-center text-emerald-600 font-bold">
                    {lot.lotCode}
                  </td>
                  <td className="py-4 px-6 text-gray-900 font-semibold">
                    {lot.productName}
                  </td>
                  <td className="py-4 px-6 text-center text-gray-400">
                    {lot.mfgDate}
                  </td>
                  <td className="py-4 px-6 text-center font-bold">
                    <span
                      className={
                        lot.status === "active"
                          ? "text-gray-900"
                          : lot.status === "warning"
                            ? "text-amber-500"
                            : "text-rose-500"
                      }
                    >
                      {lot.expDate}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center text-gray-900 font-bold">
                    {lot.stock}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full ${lot.status === "active" ? "bg-emerald-50 text-emerald-600" : lot.status === "warning" ? "bg-amber-50 text-amber-500" : "bg-rose-50 text-rose-600"}`}
                    >
                      {lot.status === "active"
                        ? "Còn hạn"
                        : lot.status === "warning"
                          ? "Cận date"
                          : "Hết hạn"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-white border-t border-gray-50 flex items-center justify-between text-xs text-gray-400 font-medium">
          <div>1 - 10 of 13 Pages</div>
          <div className="flex items-center gap-2 text-gray-500">
            <span>The page on</span>
            <select className="border border-gray-200 rounded px-2 py-1 bg-white text-gray-700 outline-none">
              <option>1</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MODULE: QUẢN LÝ TỒN KHO ---
const Quanlytonkho = () => {
  const MOCK_INVENTORY_DATA = [
    {
      id: "SP000006",
      name: "Product Test",
      quantity: 40,
      costPrice: 60000000,
      totalValue: 76000000,
    },
    {
      id: "SP000006_2",
      displayId: "SP000006",
      name: "Đồng hồ thể thao nữ Sport watch samda",
      quantity: 1997,
      costPrice: 299550000,
      totalValue: 599100000,
    },
    {
      id: "SP000005",
      name: "Laptop Xiaomi Mi Notebook Pro 15.6inch i5 8G (Xám) computer",
      quantity: 49,
      costPrice: 980000000,
      totalValue: 1078000000,
    },
    {
      id: "SP000004",
      name: "Smart Tivi Samsung 50 inch 4K UHD - Model UA50NU7090KXXV",
      quantity: 53,
      costPrice: 742000000,
      totalValue: 895700000,
    },
  ];

  const formatNumber = (value) => new Intl.NumberFormat("vi-VN").format(value);

  return (
    <div className="w-full min-h-screen bg-[#fafafa] font-sans text-gray-800 antialiased">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
            Quản lý tồn kho
          </h1>
          <nav className="text-sm text-gray-400 mt-1">
            Dashboard &gt;{" "}
            <span className="text-emerald-600 font-medium">
              Quản lý tồn kho
            </span>
          </nav>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white rounded-lg shadow-sm text-sm text-gray-600 font-medium hover:bg-gray-50 transition-colors">
          Xuất
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-wrap items-center gap-3 mb-6">
        <input
          type="text"
          placeholder="Nhập tên hoặc mã sản phẩm để tìm kiếm"
          className="flex-1 min-w-[280px] pl-4 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 transition-all"
        />
        <select className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-600 outline-none">
          <option>Chọn danh mục</option>
        </select>
        <select className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-600 outline-none">
          <option>Chọn nhà sản xuất</option>
        </select>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">
          Xem
        </button>
        <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          Xuất Excel
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl border-b-[4px] border-emerald-400 shadow-sm flex justify-between items-center">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Ngày lập
            </p>
            <p className="text-2xl font-bold text-emerald-500 mt-1">
              25/01/2024
            </p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border-b-[4px] border-blue-500 shadow-sm flex justify-between items-center">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              SL Tồn kho
            </p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {formatNumber(3963)}
            </p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border-b-[4px] border-orange-400 shadow-sm flex justify-between items-center">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Tổng vốn tồn kho
            </p>
            <p className="text-2xl font-bold text-orange-500 mt-1">
              {formatNumber(2597950000)}
            </p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border-b-[4px] border-pink-400 shadow-sm flex justify-between items-center">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Tổng giá trị tồn kho
            </p>
            <p className="text-2xl font-bold text-pink-500 mt-1">
              {formatNumber(3444750000)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                <th className="py-3.5 px-6">Mã hàng</th>
                <th className="py-3.5 px-6 w-[45%]">Tên sản phẩm</th>
                <th className="py-3.5 px-6 text-center">SL</th>
                <th className="py-3.5 px-6 text-right">Vốn tồn kho</th>
                <th className="py-3.5 px-6 text-right">Giá trị tồn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
              {MOCK_INVENTORY_DATA.map((product) => (
                <tr
                  key={product.id}
                  className="hover:bg-slate-50/60 transition-colors"
                >
                  <td className="py-4 px-6 text-gray-500 font-semibold">
                    {product.displayId || product.id}
                  </td>
                  <td className="py-4 px-6 text-gray-600 font-normal max-w-sm whitespace-normal break-words">
                    {product.name}
                  </td>
                  <td className="py-4 px-6 text-center text-gray-900 font-bold">
                    {formatNumber(product.quantity)}
                  </td>
                  <td className="py-4 px-6 text-right text-gray-500">
                    {formatNumber(product.costPrice)}
                  </td>
                  <td className="py-4 px-6 text-right text-gray-900 font-bold">
                    {formatNumber(product.totalValue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-white border-t border-gray-50 flex items-center justify-between text-xs text-gray-400 font-medium">
          <div>1 - 10 of 13 Pages</div>
          <div className="flex items-center gap-2 text-gray-500">
            <span>The page on</span>
            <select className="border border-gray-200 rounded px-2 py-1 bg-white text-gray-700 outline-none">
              <option>1</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MODULE: DANH SÁCH ĐIỀU CHUYỂN KHO ---
const Dieuchuyenkho = () => {
  const MOCK_TRANSFER_DATA = [
    {
      id: "DC2405-02",
      fromWarehouse: "Kho Tổng (Quận 1)",
      toWarehouse: "Kho Vật TW",
      status: "pending",
      createdAt: "10/05/2026 14:00",
      creator: "Admin Kho",
    },
    {
      id: "DC2405-01",
      fromWarehouse: "Kho Nông Sản Cầu Đất",
      toWarehouse: "Kho Tổng (Quận 1)",
      status: "completed",
      createdAt: "08/05/2026 09:15",
      creator: "User NV Kho",
    },
  ];

  return (
    <div className="w-full min-h-screen bg-[#fafafa] font-sans text-gray-800 antialiased">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
            Danh sách điều chuyển kho
          </h1>
          <nav className="text-sm text-gray-400 mt-1">
            Dashboard &gt;{" "}
            <span className="text-emerald-600 font-medium">
              Danh sách điều chuyển kho
            </span>
          </nav>
        </div>
        <button className="bg-[#16a34a] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#15803d] shadow-sm transition-colors">
          + Tạo Phiếu Điều Chuyển
        </button>
      </div>

      <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <input
            type="text"
            placeholder="Tìm mã phiếu điều chuyển..."
            className="flex-1 max-w-xs pl-3 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
          />
          <select className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-600 outline-none font-medium">
            <option>Tất cả trạng thái</option>
          </select>
          <div className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-400 font-medium">
            2024-01-21 đến 2024-01-27
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3.5 py-2 border border-gray-200 bg-white rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
            Lọc
          </button>
          <button className="px-3.5 py-2 border border-gray-200 bg-white rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
            Xuất
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                <th className="py-4 px-6 text-center">Mã phiếu</th>
                <th className="py-4 px-6">Kho nguồn (Xuất)</th>
                <th className="py-4 px-6">Kho đích (Nhập)</th>
                <th className="py-4 px-6 text-center">Trạng thái</th>
                <th className="py-4 px-6">Ngày tạo</th>
                <th className="py-4 px-6">Người tạo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
              {MOCK_TRANSFER_DATA.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-slate-50/60 transition-colors"
                >
                  <td className="py-4 px-6 text-center text-emerald-600 font-bold">
                    {row.id}
                  </td>
                  <td className="py-4 px-6 text-gray-700">
                    {row.fromWarehouse}
                  </td>
                  <td className="py-4 px-6 text-gray-700">{row.toWarehouse}</td>
                  <td className="py-4 px-6 text-center">
                    <span
                      className={`inline-block px-2.5 py-1 text-xs font-bold rounded ${row.status === "pending" ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"}`}
                    >
                      {row.status === "pending"
                        ? "Chờ xét duyệt"
                        : "Đã hoàn thành"}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-400 font-normal">
                    {row.createdAt}
                  </td>
                  <td className="py-4 px-6 text-gray-900 font-bold whitespace-pre-line">
                    {row.creator.split(" ")[0]} {"\n"}
                    <span className="text-gray-400 font-normal text-xs">
                      {row.creator.split(" ").slice(1).join(" ")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-white border-t border-gray-50 flex items-center justify-between text-xs text-gray-400 font-medium">
          <div>1 - 10 of 13 Pages</div>
          <div className="flex items-center gap-2 text-gray-500">
            <span>The page on</span>
            <select className="border border-gray-200 rounded px-2 py-1 bg-white text-gray-700 outline-none">
              <option>1</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
// 🎯 THÊM ĐOẠN NÀY ĐỂ ĐỌC QUYỀN VÀ KHÓA CHẶT ROUTE GỐC
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
        {/* Route tạo sản phẩm mới bắt buộc phải khớp với mã navigate */}
        <Route path="/admin/products/create" element={<ProductCreate />} />

        <Route path="Danhsachsanpham" element={<Danhsachsanpham />} />
        <Route path="detail/:id" element={<AdminProductDetail />} />
        <Route
          path="variant-detail/:variantId"
          element={<AdminVariantDetail />}
        />
        <Route
          path="/admin/products/create-variant/:id/:variantId?"
          element={<AdminCreateVariant />}
        />

        {/* 🌟 3 ROUTE MỚI BỔ SUNG CHO MASTER DATA */}
        <Route path="parent-categories" element={<ParentCategories />} />
        <Route path="child-categories" element={<ChildCategories />} />
        <Route path="units" element={<Units />} />
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
        <Route path="import-list" element={<Danhsachnhapkho />} />
        <Route path="batches" element={<Quanlylohang />} />
        <Route path="stock" element={<Quanlytonkho />} />
        <Route path="transfer" element={<Dieuchuyenkho />} />
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