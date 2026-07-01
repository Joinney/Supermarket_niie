import React, { useState } from "react";
import { createPortal } from "react-dom";

// Dữ liệu ban đầu cho 3 nhóm vai trò mặc định (Hình 1) sử dụng icon nét vẽ mảnh (stroke-2)
const INITIAL_ROLES = [
  {
    id: "admin",
    name: "Admin (Quản trị viên)",
    code: "SYSTEM_ADMIN",
    colorClass: "text-red-500",
    bgColorClass: "bg-red-50",
    borderColor: "border-red-100",
    icon: (
      <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center text-red-500 border border-red-100">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      </div>
    ),
    desc: "Toàn quyền kiểm soát và cấu hình hệ thống ETECHS. Có khả năng xóa dữ liệu và phân quyền cho người khác.",
    count: 1,
  },
  {
    id: "manager",
    name: "Quản lý (Manager)",
    code: "SYSTEM_MANAGER",
    colorClass: "text-blue-500",
    bgColorClass: "bg-blue-50",
    borderColor: "border-blue-100",
    icon: (
      <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 border border-blue-100">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
    ),
    desc: "Cấp quản lý cấp trung, điều phối hàng hóa, nông trại. Không có quyền xóa dữ liệu kế toán và cấu hình hệ thống lỗi.",
    count: 2,
  },
  {
    id: "user",
    name: "User (Nhân viên)",
    code: "SYSTEM_USER",
    colorClass: "text-emerald-500",
    bgColorClass: "bg-emerald-50",
    borderColor: "border-emerald-100",
    icon: (
      <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 border border-emerald-100">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    ),
    desc: "Tài khoản nhân viên vận hành bình thường. Tùy thuộc vào phòng ban sẽ được xem hoặc thao tác đơn.",
    count: 2,
  },
];

const MODULE_LIST = [
  { 
    id: "products", 
    name: "Quản lý Sản phẩm & SKU", 
    icon: (
      <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V16zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V16z" />
      </svg>
    ) 
  },
  { 
    id: "farm", 
    name: "Quản lý Nông trại & Mùa vụ", 
    icon: (
      <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ) 
  },
  { 
    id: "orders", 
    name: "Quản lý Đơn hàng", 
    icon: (
      <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ) 
  },
  { 
    id: "inventory", 
    name: "Quản lý Tồn kho", 
    icon: (
      <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ) 
  },
  { 
    id: "customers", 
    name: "Quản lý Khách hàng", 
    icon: (
      <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ) 
  },
];

export default function Danhsachvaitro() {
  const [roles, setRoles] = useState(INITIAL_ROLES);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // --- States Quản lý Đóng/Mở Dropdown bộ lọc ---
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("Tất cả Vai trò");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("Trạng thái");

  // --- States Form tạo vai trò ---
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleCode, setNewRoleCode] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [selectedColor, setSelectedColor] = useState("emerald");
  const [permissionMatrix, setPermissionMatrix] = useState(
    MODULE_LIST.map((m) => ({ id: m.id, view: true, add: false, edit: false, delete: false }))
  );

  const handleMatrixChange = (moduleId, field) => {
    setPermissionMatrix((prev) =>
      prev.map((item) => (item.id === moduleId ? { ...item, [field]: !item[field] } : item))
    );
  };

  const handleSaveRole = (e) => {
    e.preventDefault();
    if (!newRoleName || !newRoleCode) return;

    let colorClass = "text-emerald-500";
    let bgColorClass = "bg-emerald-50";
    let borderClass = "border-emerald-100";
    
    if (selectedColor === "blue") {
      colorClass = "text-blue-500"; bgColorClass = "bg-blue-50"; borderClass = "border-blue-100";
    } else if (selectedColor === "red") {
      colorClass = "text-red-500"; bgColorClass = "bg-red-50"; borderClass = "border-red-100";
    } else if (selectedColor === "orange") {
      colorClass = "text-orange-500"; bgColorClass = "bg-orange-50"; borderClass = "border-orange-100";
    } else if (selectedColor === "purple") {
      colorClass = "text-purple-500"; bgColorClass = "bg-purple-50"; borderClass = "border-purple-100";
    }

    const newRoleObj = {
      id: Date.now().toString(),
      name: newRoleName,
      code: newRoleCode.toUpperCase().replace(/\s+/g, "_"),
      colorClass,
      bgColorClass,
      borderColor: borderClass,
      icon: (
        <div className={`w-8 h-8 rounded-xl ${bgColorClass} flex items-center justify-center ${colorClass} border ${borderClass}`}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </div>
      ),
      desc: newRoleDesc || "Chưa có mô tả ngắn về vai trò này.",
      count: 0,
    };

    setRoles([...roles, newRoleObj]);
    setIsNewModalOpen(false);
    
    setNewRoleName(""); setNewRoleCode(""); setNewRoleDesc(""); setSelectedColor("emerald");
    setPermissionMatrix(MODULE_LIST.map((m) => ({ id: m.id, view: true, add: false, edit: false, delete: false })));
  };

  return (
    <div className="w-full bg-[#f8fafc] font-sans antialiased text-slate-800 text-left p-6 min-h-screen">
      
      {/* HEADER TRANG */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Danh sách vai trò</h1>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 mt-1 select-none">
            <span>Dashboard</span>
            <span className="text-slate-300">❯</span>
            <span className="text-[#006c49] font-bold">Danh sách vai trò</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-600 transition shadow-xs active:scale-95">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Xuất danh sách
          </button>
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-1.5 bg-[#006c49] text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-[#00563a] active:scale-95 transition-all"
          >
            <span className="text-base leading-none">+</span> Tạo Phiếu nhập
          </button>
        </div>
      </div>

      {/* THANH BỘ LỌC TÌM KIẾM - Đã sửa nút xổ như hình */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto relative select-none">
          
          {/* CUSTOM DROPDOWN 1: TẤT CẢ VAI TRÒ */}
          <div className="relative">
            <button 
              type="button"
              onClick={() => {
                setIsRoleDropdownOpen(!isRoleDropdownOpen);
                setIsStatusDropdownOpen(false);
              }}
              className="bg-white border border-gray-200 rounded-xl pl-4 pr-10 py-2.5 text-sm font-medium text-slate-700 outline-none flex items-center justify-between min-w-[145px] hover:bg-gray-50/80 transition active:scale-98"
            >
              <span>{selectedRoleFilter}</span>
              <svg className={`w-3.5 h-3.5 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 transition-transform duration-200 ${isRoleDropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isRoleDropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-48 bg-white border border-gray-100 rounded-xl shadow-lg z-50 py-1 overflow-hidden animate-fadeIn">
                {["Tất cả Vai trò", "Admin", "Manager", "Staff"].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setSelectedRoleFilter(item);
                      setIsRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 transition-colors ${selectedRoleFilter === item ? "text-[#006c49] bg-emerald-50/30" : "text-slate-600"}`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* CUSTOM DROPDOWN 2: TRẠNG THÁI */}
          <div className="relative">
            <button 
              type="button"
              onClick={() => {
                setIsStatusDropdownOpen(!isStatusDropdownOpen);
                setIsRoleDropdownOpen(false);
              }}
              className="bg-white border border-gray-200 rounded-xl pl-4 pr-10 py-2.5 text-sm font-medium text-slate-700 outline-none flex items-center justify-between min-w-[130px] hover:bg-gray-50/80 transition active:scale-98"
            >
              <span>{selectedStatusFilter}</span>
              <svg className={`w-3.5 h-3.5 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 transition-transform duration-200 ${isStatusDropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isStatusDropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-44 bg-white border border-gray-100 rounded-xl shadow-lg z-50 py-1 overflow-hidden animate-fadeIn">
                {["Trạng thái", "Hoạt động", "Tạm khóa"].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setSelectedStatusFilter(item);
                      setIsStatusDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 transition-colors ${selectedStatusFilter === item ? "text-[#006c49] bg-emerald-50/30" : "text-slate-600"}`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>

        <div className="relative w-full sm:w-[320px]">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.604 10.604z" />
          </svg>
          <input
            type="text"
            placeholder="Tìm theo tên, email..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-medium placeholder-gray-400 bg-gray-50/50"
          />
        </div>
      </div>

      {/* DANH SÁCH CARDS QUYỀN VAI TRÒ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
          <div key={role.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs flex flex-col justify-between hover:shadow-md transition duration-200 relative group">
            
            {/* Action Top Right */}
            <div className="absolute top-5 right-5 flex items-center gap-2 opacity-60 group-hover:opacity-100 transition">
              <button className="p-1 text-gray-400 hover:text-slate-600 transition" title="Chỉnh sửa">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button className="p-1 text-gray-400 hover:text-red-500 transition" title="Xóa">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>

            <div>
              <div className="mb-4">{role.icon}</div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">{role.name}</h3>
              <span className={`text-[11px] font-bold tracking-wider uppercase block mb-4 ${role.colorClass}`}>
                {role.code}
              </span>
              <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6 border-b border-gray-50 pb-4 min-h-[56px]">
                {role.desc}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="uppercase">{role.count} TÀI KHOẢN</span>
              </div>
              <button className="text-xs font-bold text-emerald-600 hover:text-[#00563a] flex items-center gap-1 transition">
                Cấu hình quyền 
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* ================= MODAL: TẠO VAI TRÒ MỚI ================= */}
      {isNewModalOpen && createPortal(
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[9999] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-xl border border-gray-100 overflow-hidden transform transition-all flex flex-col max-h-[92vh]">
            
            <div className="p-6 pb-4 flex items-center justify-between border-b border-gray-100">
              <div>
                <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Tạo vai trò mới</h3>
                <p className="text-xs text-gray-400 font-medium mt-1">Thiết lập giới hạn truy cập trên từng module cho tài khoản này.</p>
              </div>
              <button onClick={() => setIsNewModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 transition font-bold">✕</button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-sm font-semibold text-slate-700">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Tên vai trò <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    placeholder="VD: Nhân viên Giao hàng, Kế toán trưởng..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 font-medium text-xs transition"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Mã hệ thống (Mã CODE viết liền, không dấu) <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={newRoleCode}
                    onChange={(e) => setNewRoleCode(e.target.value)}
                    placeholder="VD: DELIVERY_STAFF"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 font-medium text-xs transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left items-end">
                <div className="sm:col-span-2 flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Mô tả nghiệp vụ ngắn</label>
                  <input
                    type="text"
                    value={newRoleDesc}
                    onChange={(e) => setNewRoleDesc(e.target.value)}
                    placeholder="Ghi chú ngắn về nhiệm vụ của vai trò này..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 font-medium text-xs transition"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Màu sắc định danh <span className="text-red-500">*</span></label>
                  <div className="flex items-center gap-2 py-2">
                    {[
                      { id: "emerald", color: "bg-emerald-500" },
                      { id: "blue", color: "bg-blue-500" },
                      { id: "red", color: "bg-red-500" },
                      { id: "orange", color: "bg-orange-500" },
                      { id: "purple", color: "bg-purple-500" },
                    ].map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedColor(c.id)}
                        className={`w-5 h-5 rounded-full ${c.color} transition-transform ${selectedColor === c.id ? "ring-2 ring-offset-2 ring-slate-400 scale-110" : "opacity-80"}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* MA TRẬN PHÂN QUYỀN MẶC ĐỊNH */}
              <div className="flex flex-col text-left gap-2 pt-2">
                <label className="text-xs font-bold text-slate-700">Quyền hạn vai trò mặc định <span className="text-red-500">*</span></label>
                <div className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-xs">
                  <table className="w-full border-collapse text-left text-[11px]">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        <th className="py-3 px-4 font-bold">MODULE HỆ THỐNG</th>
                        <th className="py-3 px-2 text-center font-bold">TRUY CẬP (XEM)</th>
                        <th className="py-3 px-2 text-center font-bold">THÊM MỚI</th>
                        <th className="py-3 px-2 text-center font-bold">CHỈNH SỬA</th>
                        <th className="py-3 px-2 text-center font-bold">XÓA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 font-semibold text-slate-700">
                      {permissionMatrix.map((item) => {
                        const currentModule = MODULE_LIST.find((m) => m.id === item.id);
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3 px-4 flex items-center gap-3 text-slate-800 font-bold">
                              {currentModule?.icon}
                              <span>{currentModule?.name}</span>
                            </td>
                            {["view", "add", "edit", "delete"].map((field) => (
                              <td key={field} className="py-2 px-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={item[field]}
                                  onChange={() => handleMatrixChange(item.id, field)}
                                  className="w-3.5 h-3.5 rounded text-[#006c49] border-gray-300 focus:ring-emerald-500 accent-[#006c49] cursor-pointer"
                                />
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-5 flex items-center justify-end gap-2.5 bg-slate-50 border-t border-gray-100 shrink-0">
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="px-5 py-2 border border-gray-200 bg-white rounded-xl text-xs font-bold text-gray-500 transition hover:bg-gray-50"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSaveRole}
                className="px-5 py-2 bg-[#006c49] text-white rounded-xl text-xs font-bold shadow-sm hover:bg-[#00563a] transition flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Tạo vai trò
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
}