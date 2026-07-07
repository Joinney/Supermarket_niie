import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { io } from "socket.io-client";
import Logo from "../../assets/Demi Mart.png";
import LogoMini from "../../assets/DemiMarticon.png";

const removeDiacritics = (str) => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
};

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  // Trạng thái thu gọn/mở rộng Sidebar
  const [isCollapsed, setIsCollapsed] = useState(false);

  // 🎯 1. CHUYỂN PERMISSIONS THÀNH STATE ĐỂ ÉP RE-RENDER REAL-TIME
  const adminInfo = JSON.parse(localStorage.getItem("adminInfo") || "{}");
  const userRole = String(localStorage.getItem("adminRole") || "")
    .trim()
    .toUpperCase();

  const [permissions, setPermissions] = useState(() => {
    try {
      let rawPerms = adminInfo.custom_permissions;
      if (typeof rawPerms === "string") {
        rawPerms = JSON.parse(rawPerms);
      }
      return Array.isArray(rawPerms) ? rawPerms : [];
    } catch (e) {
      console.error("Lỗi giải mã mảng phân quyền trên Sidebar Admin:", e);
      return [];
    }
  });

  // 🎯 2. REAL-TIME LISTENERS: KẾT NỐI VÀ ĐỒNG BỘ NGAY KHI ADMIN LƯU
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    const currentUserId =
      adminInfo.id || adminInfo.user_id || storedUser.id || storedUser.user_id;

    if (!currentUserId) {
      console.warn(
        "⚠️ Không tìm thấy ID người dùng để thiết lập kết nối Real-time!",
      );
      return;
    }

    const socketUrl =
      import.meta.env.VITE_API_USER_URL || "http://localhost:5001";
    const socket = io(socketUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socket.emit("join_user_room", currentUserId);

    socket.on("permission_matrix_changed", (newCustomPermissions) => {
      try {
        let cleanPerms = newCustomPermissions;
        if (typeof cleanPerms === "string") {
          cleanPerms = JSON.parse(cleanPerms);
        }
        const latestPerms = Array.isArray(cleanPerms) ? cleanPerms : [];

        if (localStorage.getItem("adminInfo")) {
          const info = JSON.parse(localStorage.getItem("adminInfo") || "{}");
          info.custom_permissions = latestPerms;
          localStorage.setItem("adminInfo", JSON.stringify(info));
        }
        if (localStorage.getItem("user")) {
          const usr = JSON.parse(localStorage.getItem("user") || "{}");
          usr.custom_permissions = latestPerms;
          localStorage.setItem("user", JSON.stringify(usr));
        }

        setPermissions(latestPerms);
      } catch (err) {
        console.error("Lỗi parse real-time packet:", err);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const hasAccess = (idKey) => {
    if (userRole === "ADMIN") return true;

    const modulePerm = permissions.find(
      (p) =>
        String(p.id || "")
          .trim()
          .toLowerCase() === idKey.toLowerCase(),
    );

    if (!modulePerm) return false;

    return modulePerm.view === true || modulePerm.view === "true";
  };

  // Set mặc định state dựa trên URL hiện tại thay vì gắn cứng
  const [activeItem, setActiveItem] = useState(location.pathname);

  const [openDropdowns, setOpenDropdowns] = useState({
    dashboard: location.pathname.includes("/admin/dashboard"),
    sanPham: location.pathname.includes("/admin/products"),
    khuyenMai: location.pathname.includes("/admin/promotions"),
    donHang: location.pathname.includes("/admin/Donhang"),
    khoHang: location.pathname.includes("/admin/inventory"),
    khachHang: location.pathname.includes("/admin/customers"),
    settings:
      location.pathname.includes("/admin/settings/quanlynoibo") ||
      location.pathname.includes("/admin/settings/quanlyvaitro"),
  });

  useEffect(() => {
    const currentPath = location.pathname;
    setActiveItem(currentPath);

    setOpenDropdowns((prev) => ({
      ...prev,
      dashboard: currentPath.includes("/admin/dashboard")
        ? true
        : prev.dashboard,
      sanPham: currentPath.includes("/admin/products") ? true : prev.sanPham,
      khuyenMai: currentPath.includes("/admin/promotions")
        ? true
        : prev.khuyenMai,
      donHang: currentPath.includes("/admin/Donhang") ? true : prev.donHang,
      khoHang: currentPath.includes("/admin/inventory") ? true : prev.khoHang,
      khachHang: currentPath.includes("/admin/customers")
        ? true
        : prev.khachHang,
      settings:
        currentPath.includes("/admin/settings/quanlynoibo") ||
        currentPath.includes("/admin/settings/quanlyvaitro")
          ? true
          : prev.settings,
    }));
  }, [location.pathname]);

  const handleMainMenuClick = (menuKey, identityPath) => {
    if (isCollapsed) {
      setIsCollapsed(false);
    }

    // Toggle menu
    setOpenDropdowns((prev) => ({
      ...prev,
      [menuKey]: !prev[menuKey],
    }));

    // Tự động active mục con đầu tiên dựa trên phân quyền cấu trúc mới
    if (menuKey === "dashboard" && hasAccess("dashboard")) {
      navigate("/admin/dashboard/thongkesanpham");
    } else if (menuKey === "khuyenMai" && hasAccess("promotions")) {
      navigate("/admin/promotions/danh-sach");
    } else if (menuKey === "donHang" && hasAccess("orders")) {
      navigate("/admin/Donhang/DanhsachTrackingorder"); // 🌟 Điều hướng mặc định đến trang Tracking
    } else if (menuKey === "khoHang" && hasAccess("inventory")) {
      navigate("/admin/inventory/create-import");
    } else if (menuKey === "khachHang" && hasAccess("customers")) {
      navigate("/admin/customers/list");
    } else if (menuKey === "settings" && hasAccess("settings")) {
      navigate("/admin/settings/quanlynoibo/danhsachnoibo");
    } else {
      navigate(identityPath);
    }
  };

  const handleSidebarSettingClick = () => {
    navigate("/admin/settings/generalsettings");
  };

  const handleSubMenuClick = (path) => {
    if (path && path.startsWith("/admin")) {
      navigate(path);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/admin/login");
  };

  const getMainMenuStyle = (path) => {
    if (
      activeItem === path ||
      (path === "/admin/dashboard" &&
        activeItem.includes("/admin/dashboard")) ||
      (path === "/admin/products" && activeItem.includes("/admin/products")) ||
      (path === "/admin/promotions" &&
        activeItem.includes("/admin/promotions")) ||
      (path === "/admin/Donhang" && activeItem.includes("/admin/Donhang")) ||
      (path === "/admin/inventory" &&
        activeItem.includes("/admin/inventory")) ||
      (path === "/admin/customers" &&
        activeItem.includes("/admin/customers")) ||
      (path === "/admin/settings-auth" &&
        (activeItem.includes("/admin/settings/quanlynoibo") ||
          activeItem.includes("/admin/settings/quanlyvaitro"))) ||
      (path === "/admin/settings/generalsettings" && 
        activeItem.includes("/admin/settings/generalsettings"))
    ) {
      return "bg-[#006c49] text-white font-bold shadow-sm";
    }
    return "text-gray-600 hover:text-slate-900 hover:bg-gray-50/70";
  };

  const getSubMenuStyle = (path) => {
    if (activeItem.includes(path) || activeItem === path) {
      return "bg-[#e6f0ed] font-bold text-[#006c49]";
    }
    return "text-[#5c6f75] hover:bg-gray-50/80 font-semibold";
  };

  return (
    <aside
      className={`${isCollapsed ? "w-16" : "w-64"} h-screen bg-white border-r border-gray-100 flex flex-col shrink-0 font-sans text-left selection:bg-emerald-100 sticky top-0 transition-all duration-300 relative`}
    >
      {/* KHỐI 1: CỐ ĐỊNH Ở TRÊN (Logo & Search) */}
      <div className="shrink-0 bg-white z-10">
        {/* LOGO AREA */}
        <div
          className={`h-20 flex items-center ${isCollapsed ? "justify-center px-2" : "justify-between px-6"} gap-3 shrink-0 relative`}
        >
          <Link
            to="/"
            className="transition-transform active:scale-95 flex-shrink-0 block"
          >
            {isCollapsed ? (
              <img
                src={LogoMini}
                alt="Demi Icon"
                width="24"
                className="h-6 w-auto object-contain drop-shadow-sm animate-fadeIn"
              />
            ) : (
              <img
                src={Logo}
                alt="Demi Mart"
                width="130"
                className="h-6 md:h-8 w-auto object-contain drop-shadow-sm animate-fadeIn"
              />
            )}
          </Link>

          {/* NÚT THU GỌN SIDEBAR */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`w-5 h-5 border border-gray-100 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-400 text-[9px] hover:text-gray-600 transition-all z-50 absolute ${isCollapsed ? "right-[-10px] top-7" : "right-6"}`}
          >
            {isCollapsed ? "❯" : "❮"}
          </button>
        </div>

        {/* SEARCH INTERNAL */}
        {!isCollapsed && (
          <div className="px-4 mb-4 shrink-0 animate-fadeIn">
            <div className="relative group">
              <span className="absolute left-3.5 top-2.5 text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 bg-[#f8f9fa] border border-transparent rounded-xl text-sm text-gray-700 placeholder-gray-400 outline-none focus:bg-white focus:border-gray-200 focus:ring-2 focus:ring-emerald-500/5 transition-all font-medium"
              />
            </div>
          </div>
        )}
      </div>

      {/* KHỐI 2: VÙNG CUỘN CHỨA CẢ MENU VÀ SETTINGS/LOGOUT */}
      <div className="flex-1 overflow-y-auto min-h-0 flex flex-col justify-between custom-scrollbar">
        {/* MAIN MENU LIST */}
        <nav className={`${isCollapsed ? "px-1.5" : "px-3"} mb-6`}>
          {!isCollapsed && (
            <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5 animate-fadeIn">
              Main Menu
            </p>
          )}
          <div className="space-y-1">
            {/* Dashboard */}
            {hasAccess("dashboard") && (
              <div>
                <button
                  onClick={() =>
                    handleMainMenuClick("dashboard", "/admin/dashboard")
                  }
                  className={`w-full flex items-center ${isCollapsed ? "justify-center" : "justify-between"} px-4 py-3 rounded-xl text-sm font-medium transition duration-150 group ${getMainMenuStyle("/admin/dashboard")}`}
                  title={isCollapsed ? "Dashboard" : ""}
                >
                  <div className="flex items-center gap-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.8}
                      stroke="currentColor"
                      className="w-5 h-5 transition-colors"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                      />
                    </svg>
                    {!isCollapsed && (
                      <span className="animate-fadeIn">Dashboard</span>
                    )}
                  </div>
                  {!isCollapsed && (
                    <span
                      className={`text-[10px] transition-transform duration-200 ${openDropdowns.dashboard ? "rotate-90" : ""}`}
                    >
                      ❯
                    </span>
                  )}
                </button>

                {openDropdowns.dashboard && !isCollapsed && (
                  <div className="mt-1 space-y-1 pl-2 animate-fadeIn">
                    <button
                      onClick={() =>
                        handleSubMenuClick("/admin/dashboard/thongkesanpham")
                      }
                      className={`w-full flex items-center gap-3 pl-6 pr-4 py-2.5 rounded-xl text-sm text-left transition ${getSubMenuStyle("/admin/dashboard/thongkesanpham")}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${activeItem.includes("/admin/dashboard/thongkesanpham") ? "bg-[#006c49]" : "bg-gray-300"}`}
                      ></span>
                      <span>Thống kê sản phẩm</span>
                    </button>

                    <button
                      onClick={() =>
                        handleSubMenuClick("/admin/dashboard/thongkedonhang")
                      }
                      className={`w-full flex items-center gap-3 pl-6 pr-4 py-2.5 rounded-xl text-sm text-left transition ${getSubMenuStyle("/admin/dashboard/thongkedonhang")}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${activeItem.includes("/admin/dashboard/thongkedonhang") ? "bg-[#006c49]" : "bg-gray-300"}`}
                      ></span>
                      <span>Thống kê đơn hàng</span>
                    </button>

                    <button
                      onClick={() =>
                        handleSubMenuClick("/admin/dashboard/thongkekhachhang")
                      }
                      className={`w-full flex items-center gap-3 pl-6 pr-4 py-2.5 rounded-xl text-sm text-left transition ${getSubMenuStyle("/admin/dashboard/thongkekhachhang")}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${activeItem.includes("/admin/dashboard/thongkekhachhang") ? "bg-[#006c49]" : "bg-gray-300"}`}
                      ></span>
                      <span>Thống kê khách hàng</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Danh sách sản phẩm */}
            {hasAccess("products") && (
              <div>
                <button
                  onClick={() =>
                    handleMainMenuClick(
                      "sanPham",
                      "/admin/products/Danhsachsanpham",
                    )
                  }
                  className={`w-full flex items-center ${isCollapsed ? "justify-center" : "justify-between"} px-4 py-3 rounded-xl text-sm transition group ${getMainMenuStyle("/admin/products")}`}
                  title={isCollapsed ? "Danh sách sản phẩm" : ""}
                >
                  <div className="flex items-center gap-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.8}
                      stroke="currentColor"
                      className="w-5 h-5 transition-colors"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                      />
                    </svg>
                    {!isCollapsed && (
                      <span className="animate-fadeIn">Danh sách sản phẩm</span>
                    )}
                  </div>
                  {!isCollapsed && (
                    <span
                      className={`text-[10px] transition-transform duration-200 ${openDropdowns.sanPham ? "rotate-90" : ""}`}
                    >
                      ❯
                    </span>
                  )}
                </button>

                {/* KHU VỰC MENU CON (SUB-MENU) */}
                {openDropdowns.sanPham && !isCollapsed && (
                  <div className="mt-1 space-y-1 pl-2 animate-fadeIn">
                    <button
                      onClick={() =>
                        handleSubMenuClick("/admin/products/Danhsachsanpham")
                      }
                      className={`w-full flex items-center gap-3 pl-6 pr-4 py-2.5 rounded-xl text-sm text-left transition ${getSubMenuStyle("/admin/products/Danhsachsanpham")}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${activeItem.includes("/admin/products") && !activeItem.includes("/categories") && !activeItem.includes("/units") ? "bg-[#006c49]" : "bg-gray-300"}`}
                      ></span>
                      <span>Tất cả sản phẩm</span>
                    </button>

                    <button
                      onClick={() =>
                        handleSubMenuClick("/admin/products/parent-categories")
                      }
                      className={`w-full flex items-center gap-3 pl-6 pr-4 py-2.5 rounded-xl text-sm text-left transition ${getSubMenuStyle("/admin/products/parent-categories")}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${activeItem.includes("/admin/products/parent-categories") ? "bg-[#006c49]" : "bg-gray-300"}`}
                      ></span>
                      <span>Danh mục cha</span>
                    </button>

                    <button
                      onClick={() =>
                        handleSubMenuClick("/admin/products/child-categories")
                      }
                      className={`w-full flex items-center gap-3 pl-6 pr-4 py-2.5 rounded-xl text-sm text-left transition ${getSubMenuStyle("/admin/products/child-categories")}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${activeItem.includes("/admin/products/child-categories") ? "bg-[#006c49]" : "bg-gray-300"}`}
                      ></span>
                      <span>Danh mục con</span>
                    </button>

                    <button
                      onClick={() =>
                        handleSubMenuClick("/admin/products/units")
                      }
                      className={`w-full flex items-center gap-3 pl-6 pr-4 py-2.5 rounded-xl text-sm text-left transition ${getSubMenuStyle("/admin/products/units")}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${activeItem.includes("/admin/products/units") ? "bg-[#006c49]" : "bg-gray-300"}`}
                      ></span>
                      <span>Đóng gói</span>
                    </button>

                    <button
                      onClick={() => handleSubMenuClick("/admin/nations/list")}
                      className={`w-full flex items-center gap-3 pl-6 pr-4 py-2.5 rounded-xl text-sm text-left transition ${getSubMenuStyle("/admin/nations/list")}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${activeItem.includes("/admin/nations/list") ? "bg-[#006c49]" : "bg-gray-300"}`}
                      ></span>
                      <span>Thị trường quốc gia</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* MODULE KHUYẾN MÃI (PROMOTIONS) */}
            {hasAccess("promotions") && (
              <div>
                <button
                  onClick={() =>
                    handleMainMenuClick(
                      "khuyenMai",
                      "/admin/promotions/danh-sach",
                    )
                  }
                  className={`w-full flex items-center ${isCollapsed ? "justify-center" : "justify-between"} px-4 py-3 rounded-xl text-sm transition group ${getMainMenuStyle("/admin/promotions")}`}
                  title={isCollapsed ? "Khuyến Mãi" : ""}
                >
                  <div className="flex items-center gap-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.8}
                      stroke="currentColor"
                      className="w-5 h-5 transition-colors"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z"
                      />
                    </svg>
                    {!isCollapsed && (
                      <span className="animate-fadeIn">Khuyến Mãi</span>
                    )}
                  </div>
                  {!isCollapsed && (
                    <span
                      className={`text-[10px] transition-transform duration-200 ${openDropdowns.khuyenMai ? "rotate-90" : ""}`}
                    >
                      ❯
                    </span>
                  )}
                </button>

                {openDropdowns.khuyenMai && !isCollapsed && (
                  <div className="mt-1 space-y-1 pl-2 animate-fadeIn">
                    <button
                      onClick={() =>
                        handleSubMenuClick("/admin/promotions/danh-sach")
                      }
                      className={`w-full flex items-center gap-3 pl-6 pr-4 py-2.5 rounded-xl text-sm text-left transition ${getSubMenuStyle("/admin/promotions/danh-sach")}`}
                    >
                      <span>Danh sách Khuyến mãi</span>
                    </button>

                    <button
                      onClick={() =>
                        handleSubMenuClick("/admin/promotions/tao-moi")
                      }
                      className={`w-full flex items-center gap-3 pl-6 pr-4 py-2.5 rounded-xl text-sm text-left transition ${getSubMenuStyle("/admin/promotions/tao-moi")}`}
                    >
                      <span>Chiến dịch Khuyến mãi</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Đơn Hàng */}
            {hasAccess("orders") && (
              <div>
                <button
                  onClick={() =>
                    handleMainMenuClick("donHang", "/admin/Donhang")
                  }
                  className={`w-full flex items-center ${isCollapsed ? "justify-center" : "justify-between"} px-4 py-3 rounded-xl text-sm transition group ${getMainMenuStyle("/admin/Donhang")}`}
                  title={isCollapsed ? "Đơn Hàng" : ""}
                >
                  <div className="flex items-center gap-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.8}
                      stroke="currentColor"
                      className="w-5 h-5 transition-colors"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                      />
                    </svg>
                    {!isCollapsed && (
                      <span className="animate-fadeIn">Đơn Hàng</span>
                    )}
                  </div>
                  {!isCollapsed && (
                    <span
                      className={`text-[10px] transition-transform duration-200 ${openDropdowns.donHang ? "rotate-90" : ""}`}
                    >
                      ❯
                    </span>
                  )}
                </button>

                {openDropdowns.donHang && !isCollapsed && (
                  <div className="mt-1 space-y-1 pl-2 animate-fadeIn">
                    {/* 🌟 NÚT TRACKING ĐƠN HÀNG MỚI */}
                    <button
                      onClick={() =>
                        handleSubMenuClick("/admin/Donhang/DanhsachTrackingorder")
                      }
                      className={`w-full flex items-center gap-3 pl-6 pr-4 py-2.5 rounded-xl text-sm text-left transition ${getSubMenuStyle("/admin/Donhang/DanhsachTrackingorder")}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${activeItem.includes("/admin/Donhang/DanhsachTrackingorder") ? "bg-[#006c49]" : "bg-gray-300"}`}
                      ></span>
                      <span>Danh sách tracking đơn hàng</span>
                    </button>

                    {/* DANH SÁCH ĐƠN HÀNG CŨ CỦA BẠN (GIỮ NGUYÊN VẸN) */}
                    <button
                      onClick={() =>
                        handleSubMenuClick("/admin/Donhang/Danhsachdonhang")
                      }
                      className={`w-full flex items-center gap-3 pl-6 pr-4 py-2.5 rounded-xl text-sm text-left transition ${getSubMenuStyle("/admin/Donhang/Danhsachdonhang")}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${activeItem.includes("/admin/Donhang/Danhsachdonhang") ? "bg-[#006c49]" : "bg-gray-300"}`}
                      ></span>
                      <span>Danh sách đơn hàng</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Kho Hàng */}
            {hasAccess("inventory") && (
              <div>
                <button
                  onClick={() =>
                    handleMainMenuClick("khoHang", "/admin/inventory")
                  }
                  className={`w-full flex items-center ${isCollapsed ? "justify-center" : "justify-between"} px-4 py-3 rounded-xl text-sm transition group ${getMainMenuStyle("/admin/inventory")}`}
                  title={isCollapsed ? "Kho Hàng" : ""}
                >
                  <div className="flex items-center gap-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.8}
                      stroke="currentColor"
                      className="w-5 h-5 transition-colors"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                      />
                    </svg>
                    {!isCollapsed && (
                      <span className="animate-fadeIn">Kho Hàng</span>
                    )}
                  </div>
                  {!isCollapsed && (
                    <span
                      className={`text-[10px] transition-transform duration-200 ${openDropdowns.khoHang ? "rotate-90" : ""}`}
                    >
                      ❯
                    </span>
                  )}
                </button>

                {openDropdowns.khoHang && !isCollapsed && (
                  <div className="mt-1 space-y-1 pl-2 animate-fadeIn">
                    <button
                      onClick={() =>
                        handleSubMenuClick("/admin/inventory/create-import")
                      }
                      className={`w-full flex items-center gap-3 pl-6 pr-4 py-2.5 rounded-xl text-sm text-left transition ${getSubMenuStyle("/admin/inventory/create-import")}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${activeItem.includes("/admin/inventory/create-import") ? "bg-[#006c49]" : "bg-gray-300"}`}
                      ></span>
                      <span> Danh sách kho hàng </span>{" "}
                    </button>

                    <button
                      onClick={() =>
                        handleSubMenuClick("/admin/inventory/import-list")
                      }
                      className={`w-full flex items-center gap-3 pl-6 pr-4 py-2.5 rounded-xl text-sm text-left transition ${getSubMenuStyle("/admin/inventory/import-list")}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${activeItem.includes("/admin/inventory/import-list") ? "bg-[#006c49]" : "bg-gray-300"}`}
                      ></span>
                      <span>Danh sách phiếu nhập</span>{" "}
                    </button>

                    <button
                      onClick={() =>
                        handleSubMenuClick("/admin/inventory/batches")
                      }
                      className={`w-full flex items-center gap-3 pl-6 pr-4 py-2.5 rounded-xl text-sm text-left transition ${getSubMenuStyle("/admin/inventory/batches")}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${activeItem.includes("/admin/inventory/batches") ? "bg-[#006c49]" : "bg-gray-300"}`}
                      ></span>
                      <span>Lô hàng</span>
                    </button>

                    <button
                      onClick={() =>
                        handleSubMenuClick("/admin/inventory/stock")
                      }
                      className={`w-full flex items-center gap-3 pl-6 pr-4 py-2.5 rounded-xl text-sm text-left transition ${getSubMenuStyle("/admin/inventory/stock")}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${activeItem.includes("/admin/inventory/stock") ? "bg-[#006c49]" : "bg-gray-300"}`}
                      ></span>
                      <span>Tồn kho</span>
                    </button>

                    <button
                      onClick={() =>
                        handleSubMenuClick("/admin/inventory/transfer")
                      }
                      className={`w-full flex items-center gap-3 pl-6 pr-4 py-2.5 rounded-xl text-sm text-left transition ${getSubMenuStyle("/admin/inventory/transfer")}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${activeItem.includes("/admin/inventory/transfer") ? "bg-[#006c49]" : "bg-gray-300"}`}
                      ></span>
                      <span>Chuyển kho</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Khách Hàng */}
            {hasAccess("customers") && (
              <div>
                <button
                  onClick={() =>
                    handleMainMenuClick("khachHang", "/admin/customers")
                  }
                  className={`w-full flex items-center ${isCollapsed ? "justify-center" : "justify-between"} px-4 py-3 rounded-xl text-sm transition group ${getMainMenuStyle("/admin/customers")}`}
                  title={isCollapsed ? "Khách Hàng" : ""}
                >
                  <div className="flex items-center gap-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.8}
                      stroke="currentColor"
                      className="w-5 h-5 transition-colors"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
                      />
                    </svg>
                    {!isCollapsed && (
                      <span className="animate-fadeIn">Khách Hàng</span>
                    )}
                  </div>
                  {!isCollapsed && (
                    <span
                      className={`text-[10px] transition-transform duration-200 ${openDropdowns.khachHang ? "rotate-90" : ""}`}
                    >
                      ❯
                    </span>
                  )}
                </button>

                {openDropdowns.khachHang && !isCollapsed && (
                  <div className="mt-1 space-y-1 pl-2 animate-fadeIn">
                    <button
                      onClick={() =>
                        handleSubMenuClick("/admin/customers/list")
                      }
                      className={`w-full flex items-center gap-3 pl-6 pr-4 py-2.5 rounded-xl text-sm text-left transition ${getSubMenuStyle("/admin/customers/list")}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${activeItem.includes("/admin/customers/list") ? "bg-[#006c49]" : "bg-gray-300"}`}
                      ></span>
                      <span>Danh sách khách hàng</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </nav>

        {/* PHẦN DƯỚI: SETTINGS & LOGOUT */}
        <div className="bg-white pt-2 pb-4 border-t border-gray-50 shrink-0">
          <div className={`${isCollapsed ? "px-1.5" : "px-3"} space-y-4`}>
            <div>
              {!isCollapsed && (
                <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5 animate-fadeIn">
                  Settings
                </p>
              )}
              <div className="space-y-1">
                {/* Tài khoản & Phân quyền */}
                {hasAccess("settings") && (
                  <div>
                    <button
                      onClick={() =>
                        handleMainMenuClick("settings", "/admin/settings-auth")
                      }
                      className={`w-full flex items-center ${isCollapsed ? "justify-center" : "justify-between"} px-4 py-3 rounded-xl text-sm transition duration-150 ${getMainMenuStyle("/admin/settings-auth")}`}
                      title={isCollapsed ? "Tài khoản & Phân quyền" : ""}
                    >
                      <div className="flex items-center gap-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="w-5 h-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751A11.956 11.956 0 0112 2.714z"
                          />
                        </svg>
                        {!isCollapsed && (
                          <span className="animate-fadeIn">
                            Tài khoản & Phân quyền
                          </span>
                        )}
                      </div>
                      {!isCollapsed && (
                        <span
                          className={`text-xs font-bold transition-transform duration-200 ${openDropdowns.settings ? "rotate-90" : ""}`}
                        >
                          ❯
                        </span>
                      )}
                    </button>

                    {/* Các menu con Dropdown */}
                    {openDropdowns.settings && !isCollapsed && (
                      <div className="mt-1 space-y-1 animate-fadeIn pl-2">
                        <button
                          onClick={() =>
                            handleSubMenuClick(
                              "/admin/settings/quanlynoibo/danhsachnoibo",
                            )
                          }
                          className={`w-full flex items-center gap-3 pl-6 pr-4 py-2.5 rounded-xl text-sm text-left transition ${getSubMenuStyle("/admin/settings/quanlynoibo/danhsachnoibo")}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${activeItem.includes("/admin/settings/quanlynoibo") ? "bg-[#006c49]" : "bg-gray-300"}`}
                          ></span>
                          <span>Danh sách quản lý nội bộ</span>
                        </button>

                        <button
                          onClick={() =>
                            handleSubMenuClick(
                              "/admin/settings/quanlyvaitro/danhsachvaitro",
                            )
                          }
                          className={`w-full flex items-center gap-3 pl-6 pr-4 py-2.5 rounded-xl text-sm text-left transition ${getSubMenuStyle("/admin/settings/quanlyvaitro/danhsachvaitro")}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${activeItem.includes("/admin/settings/quanlyvaitro") ? "bg-[#006c49]" : "bg-gray-300"}`}
                          ></span>
                          <span>Danh sách vai trò</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* MỤC CÀI ĐẶT RĂNG CƯA HIỆN ĐẠI & CHUẨN XÁC */}
            <div>
              <button
                onClick={handleSidebarSettingClick}
                className={`w-full flex items-center ${isCollapsed ? "justify-center" : "gap-3 px-4"} py-3 rounded-xl text-sm font-bold transition duration-150 group ${getMainMenuStyle("/admin/settings/generalsettings")}`}
                title={isCollapsed ? "Cài đặt" : ""}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.8}
                  stroke="currentColor"
                  className={`w-5 h-5 transition-transform duration-500 group-hover:rotate-90 ${activeItem.includes("/admin/settings/generalsettings") ? "text-white" : "text-gray-500 group-hover:text-slate-900"}`}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {!isCollapsed && (
                  <span className="animate-fadeIn">Cài đặt</span>
                )}
              </button>
            </div>

            {/* Nút Log out */}
            <div>
              <button
                onClick={handleLogout}
                className={`w-full flex items-center ${isCollapsed ? "justify-center" : "gap-3 px-4"} py-2.5 rounded-xl text-sm font-bold text-[#f06565] hover:bg-red-50/60 transition-all duration-150 group`}
                title={isCollapsed ? "Log out" : ""}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5 text-[#f06565]"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                  />
                </svg>
                {!isCollapsed && (
                  <span className="animate-fadeIn">Log out</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}