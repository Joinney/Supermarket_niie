import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { io } from "socket.io-client";
import Logo from "../../assets/Demi Mart.png";
import LogoMini from "../../assets/DemiMarticon.png";

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
    // Bọc lót bốc ID từ mọi nguồn có thể lưu trong dự án của bạn
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

    // Tham gia phòng riêng biệt của user
    socket.emit("join_user_room", currentUserId);

    // Lắng nghe lệnh đổi quyền live từ Admin
    socket.on("permission_matrix_changed", (newCustomPermissions) => {
      try {
        let cleanPerms = newCustomPermissions;
        if (typeof cleanPerms === "string") {
          cleanPerms = JSON.parse(cleanPerms);
        }
        const latestPerms = Array.isArray(cleanPerms) ? cleanPerms : [];

        // Đồng bộ dữ liệu mới vào tất cả bộ nhớ đệm có thể có
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

        // ⚡ Cập nhật State ép Sidebar ẩn hiện menu ngay lập tức không cần F5!
        setPermissions(latestPerms);
      } catch (err) {
        console.error("Lỗi parse real-time packet:", err);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // 🎯 3. HÀM KIỂM TRA QUYỀN TRUY CẬP (XEM) ĐỘNG THEO ID HỆ THỐNG
  const hasAccess = (idKey) => {
    // Nếu tài khoản là Admin tối cao -> Luôn luôn hiển thị đầy đủ không cần check mảng
    if (userRole === "ADMIN") return true;

    // Tìm kiếm đồng bộ theo ID gốc (dashboard, products, orders, inventory, customers, settings)
    const modulePerm = permissions.find(
      (p) =>
        String(p.id || "")
          .trim()
          .toLowerCase() === idKey.toLowerCase(),
    );

    // Nếu không tìm thấy cấu hình hoặc ô Truy cập (Xem) bị tắt -> Khóa ẩn lập tức
    if (!modulePerm) return false;

    return modulePerm.view === true || modulePerm.view === "true";
  };

  // Quản lý trạng thái đóng/mở của các mục lớn (Dropdowns)
  const [openDropdowns, setOpenDropdowns] = useState({
    dashboard: true,
    sanPham: false,
    donHang: false,
    khoHang: false,
    khachHang: false,
    settings: false,
  });

  // Mặc định kích hoạt sẵn menu con "Thống kê sản phẩm" ban đầu
  const [activeItem, setActiveItem] = useState(
    "/admin/dashboard/thongkesanpham",
  );

  // Xử lý khi click vào MỤC LỚN
  const handleMainMenuClick = (menuKey, identityPath) => {
    if (isCollapsed) {
      setIsCollapsed(false);
    }

    toggleDropdown(menuKey);

    // Tự động active mục con đầu tiên dựa trên phân quyền cấu trúc mới
    if (menuKey === "dashboard" && hasAccess("dashboard")) {
      setActiveItem("/admin/dashboard/thongkesanpham");
      navigate("/admin/dashboard/thongkesanpham");
    } else if (menuKey === "donHang" && hasAccess("orders")) {
      setActiveItem("/admin/Donhang/Danhsachdonhang");
      navigate("/admin/Donhang/Danhsachdonhang");
    } else if (menuKey === "khoHang" && hasAccess("inventory")) {
      setActiveItem("/admin/inventory/create-import");
      navigate("/admin/inventory/create-import");
    } else if (menuKey === "khachHang" && hasAccess("customers")) {
      setActiveItem("/admin/customers/list");
      navigate("/admin/customers/list");
    } else if (menuKey === "settings" && hasAccess("settings")) {
      setActiveItem("/admin/settings/quanlynoibo/danhsachnoibo");
      navigate("/admin/settings/quanlynoibo/danhsachnoibo");
    } else {
      setActiveItem(identityPath);
    }
  };

  // Xử lý khi click vào MỤC CON
  const handleSubMenuClick = (path) => {
    setActiveItem(path);
    if (path && path.startsWith("/admin")) {
      navigate(path);
    }
  };

  const toggleDropdown = (menuKey) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [menuKey]: !prev[menuKey],
    }));
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/admin/login");
  };

  // Hàm render class màu cho MỤC CHA
  const getMainMenuStyle = (path) => {
    if (
      activeItem === path ||
      (path === "/admin/dashboard" &&
        activeItem.startsWith("/admin/dashboard/")) ||
      (path === "/admin/products" &&
        activeItem.startsWith("/admin/products/")) ||
      (path === "/admin/Donhang" && activeItem.startsWith("/admin/Donhang/")) ||
      (path === "/admin/inventory" &&
        activeItem.startsWith("/admin/inventory/")) ||
      (path === "/admin/customers" &&
        activeItem.startsWith("/admin/customers/")) ||
      (path === "/admin/settings-auth" &&
        (activeItem.startsWith("/admin/settings/quanlynoibo") ||
          activeItem.startsWith("/admin/settings/quanlyvaitro")))
    ) {
      return "bg-[#006c49] text-white font-bold shadow-sm";
    }
    return "text-gray-600 hover:text-slate-900 hover:bg-gray-50/70";
  };

  // Hàm render class màu cho MỤC CON
  const getSubMenuStyle = (path) => {
    if (activeItem === path) {
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
                        className={`w-1.5 h-1.5 rounded-full ${activeItem === "/admin/dashboard/thongkesanpham" ? "bg-[#006c49]" : "bg-gray-300"}`}
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
                        className={`w-1.5 h-1.5 rounded-full ${activeItem === "/admin/dashboard/thongkedonhang" ? "bg-[#006c49]" : "bg-gray-300"}`}
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
                        className={`w-1.5 h-1.5 rounded-full ${activeItem === "/admin/dashboard/thongkekhachhang" ? "bg-[#006c49]" : "bg-gray-300"}`}
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
                    {/* 1. Tất cả sản phẩm */}
                    <button
                      onClick={() =>
                        handleSubMenuClick("/admin/products/Danhsachsanpham")
                      }
                      className={`w-full flex items-center gap-3 pl-6 pr-4 py-2.5 rounded-xl text-sm text-left transition ${getSubMenuStyle("/admin/products/Danhsachsanpham")}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${activeItem === "/admin/products/Danhsachsanpham" ? "bg-[#006c49]" : "bg-gray-300"}`}
                      ></span>
                      <span>Tất cả sản phẩm</span>
                    </button>

                    {/* 2. Danh mục cha */}
                    <button
                      onClick={() =>
                        handleSubMenuClick("/admin/products/parent-categories")
                      }
                      className={`w-full flex items-center gap-3 pl-6 pr-4 py-2.5 rounded-xl text-sm text-left transition ${getSubMenuStyle("/admin/products/parent-categories")}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${activeItem === "/admin/products/parent-categories" ? "bg-[#006c49]" : "bg-gray-300"}`}
                      ></span>
                      <span>Danh mục cha</span>
                    </button>

                    {/* 3. Danh mục con */}
                    <button
                      onClick={() =>
                        handleSubMenuClick("/admin/products/child-categories")
                      }
                      className={`w-full flex items-center gap-3 pl-6 pr-4 py-2.5 rounded-xl text-sm text-left transition ${getSubMenuStyle("/admin/products/child-categories")}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${activeItem === "/admin/products/child-categories" ? "bg-[#006c49]" : "bg-gray-300"}`}
                      ></span>
                      <span>Danh mục con</span>
                    </button>

                    {/* 4. Quy chuẩn đóng gói */}
                    <button
                      onClick={() =>
                        handleSubMenuClick("/admin/products/units")
                      }
                      className={`w-full flex items-center gap-3 pl-6 pr-4 py-2.5 rounded-xl text-sm text-left transition ${getSubMenuStyle("/admin/products/units")}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${activeItem === "/admin/products/units" ? "bg-[#006c49]" : "bg-gray-300"}`}
                      ></span>
                      <span>Quy chuẩn đóng gói</span>
                    </button>

                    {/* 5. Thị trường quốc gia */}
                    <button
                      onClick={() => handleSubMenuClick("/admin/nations/list")}
                      className={`w-full flex items-center gap-3 pl-6 pr-4 py-2.5 rounded-xl text-sm text-left transition ${getSubMenuStyle("/admin/nations/list")}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${activeItem === "/admin/nations/list" ? "bg-[#006c49]" : "bg-gray-300"}`}
                      ></span>
                      <span>Thị trường quốc gia</span>
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
                    <button
                      onClick={() =>
                        handleSubMenuClick("/admin/Donhang/Danhsachdonhang")
                      }
                      className={`w-full flex items-center gap-3 pl-6 pr-4 py-2.5 rounded-xl text-sm text-left transition ${getSubMenuStyle("/admin/Donhang/Danhsachdonhang")}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${activeItem === "/admin/Donhang/Danhsachdonhang" ? "bg-[#006c49]" : "bg-gray-300"}`}
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
                        className={`w-1.5 h-1.5 rounded-full ${activeItem === "/admin/inventory/create-import" ? "bg-[#006c49]" : "bg-gray-300"}`}
                      ></span>
                      <span> Danh sách kho hàng </span>{" "}
                      {/* 🎯 Đổi nhãn này để nhân viên kho biết đây là nơi thêm mới hàng hóa */}
                    </button>

                    <button
                      onClick={() =>
                        handleSubMenuClick("/admin/inventory/import-list")
                      }
                      className={`w-full flex items-center gap-3 pl-6 pr-4 py-2.5 rounded-xl text-sm text-left transition ${getSubMenuStyle("/admin/inventory/import-list")}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${activeItem === "/admin/inventory/import-list" ? "bg-[#006c49]" : "bg-gray-300"}`}
                      ></span>
                      <span>Danh sách phiếu nhập</span>{" "}
                      {/* 🎯 Đổi nhãn này lên đây để khớp với dữ liệu bảng */}
                    </button>

                    <button
                      onClick={() =>
                        handleSubMenuClick("/admin/inventory/batches")
                      }
                      className={`w-full flex items-center gap-3 pl-6 pr-4 py-2.5 rounded-xl text-sm text-left transition ${getSubMenuStyle("/admin/inventory/batches")}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${activeItem === "/admin/inventory/batches" ? "bg-[#006c49]" : "bg-gray-300"}`}
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
                        className={`w-1.5 h-1.5 rounded-full ${activeItem === "/admin/inventory/stock" ? "bg-[#006c49]" : "bg-gray-300"}`}
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
                        className={`w-1.5 h-1.5 rounded-full ${activeItem === "/admin/inventory/transfer" ? "bg-[#006c49]" : "bg-gray-300"}`}
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
                        className={`w-1.5 h-1.5 rounded-full ${activeItem === "/admin/customers/list" ? "bg-[#006c49]" : "bg-gray-300"}`}
                      ></span>
                      <span>Danh sách khách hàng</span>
                    </button>

                    <button
                      onClick={() =>
                        handleSubMenuClick("/admin/customers/groups")
                      }
                      className={`w-full flex items-center gap-3 pl-6 pr-4 py-2.5 rounded-xl text-sm text-left transition ${getSubMenuStyle("/admin/customers/groups")}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${activeItem === "/admin/customers/groups" ? "bg-[#006c49]" : "bg-gray-300"}`}
                      ></span>
                      <span>Nhóm khách hàng</span>
                    </button>

                    <button
                      onClick={() =>
                        handleSubMenuClick("/admin/customers/types")
                      }
                      className={`w-full flex items-center gap-3 pl-6 pr-4 py-2.5 rounded-xl text-sm text-left transition ${getSubMenuStyle("/admin/customers/types")}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${activeItem === "/admin/customers/types" ? "bg-[#006c49]" : "bg-gray-300"}`}
                      ></span>
                      <span>Loại khách hàng</span>
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
                {/* Thanh tiêu đề cha: Tài khoản & Phân quyền */}
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
                            className={`w-1.5 h-1.5 rounded-full ${activeItem === "/admin/settings/quanlynoibo/danhsachnoibo" ? "bg-[#006c49]" : "bg-gray-300"}`}
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
                            className={`w-1.5 h-1.5 rounded-full ${activeItem === "/admin/settings/quanlyvaitro/danhsachvaitro" ? "bg-[#006c49]" : "bg-gray-300"}`}
                          ></span>
                          <span>Danh sách vai trò</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Settings tổng quát - Mặc định đi kèm nếu có quyền settings */}
                {hasAccess("settings") && (
                  <button
                    onClick={() =>
                      handleSubMenuClick("/admin/settings/general")
                    }
                    className={`w-full flex items-center ${isCollapsed ? "justify-center" : "gap-3"} px-4 py-3 rounded-xl text-sm transition group mt-1 ${getMainMenuStyle("/admin/settings/general")}`}
                    title={isCollapsed ? "Settings" : ""}
                  >
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
                        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.767c-.29.222-.434.59-.374.953.003.018.006.035.006.053v.068c0 .018-.003.035-.006.053-.06.363.084.731.374.953l1.004.767a1.125 1.125 0 01.26 1.43l-1.297 2.247a1.125 1.125 0 01-1.37.49l-1.216-.456c-.356-.133-.751-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.767c.29-.222.434-.59.374-.953a.53.53 0 01-.006-.053v-.068c0-.018.003-.035.006-.053.06-.363-.084-.731-.374-.953l-1.004-.767a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.49l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {!isCollapsed && (
                      <span className="animate-fadeIn">Settings</span>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Nút Log out */}
          <div className={`${isCollapsed ? "px-1.5" : "px-3"} mt-4`}>
            <button
              onClick={handleLogout}
              className={`w-full flex items-center ${isCollapsed ? "justify-center" : "gap-3 px-3"} py-2.5 rounded-xl text-sm font-bold text-[#f06565] hover:bg-red-50/60 transition-all duration-150 group`}
              title={isCollapsed ? "Log out" : ""}
            >
              <svg
                xmlns="http://www.w3.org/2000/xl"
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
              {!isCollapsed && <span className="animate-fadeIn">Log out</span>}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
