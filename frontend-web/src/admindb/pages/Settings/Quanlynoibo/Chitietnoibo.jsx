import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Chitietnoibo() {
  const navigate = useNavigate();
  const location = useLocation();

  // 1. NGHIỆP VỤ: Nhận diện dữ liệu từ trang danh sách truyền sang hoặc dùng fallback mặc định
  const passedUser = location.state?.user;

  // Trạng thái bật/tắt chế độ chỉnh sửa (Edit Mode)
  const [isEditing, setIsEditing] = useState(false);

  // Dữ liệu Vai trò & Nhân sự (Được map chuẩn theo hình ảnh tham chiếu)
  const [roleInfo, setRoleInfo] = useState({
    roleName: passedUser?.role || "MANAGER",
    displayName: passedUser?.name || "LÊ HOÀNG QUÂN",
    title: passedUser?.role === "ADMIN" ? "Quản trị viên" : passedUser?.role === "MANAGER" ? "Quản lý" : "Nhân viên",
    description: passedUser?.desc || "Cấp quản lý cấp trung, có quyền điều phối hàng hóa, nông trại và đơn hàng. Không có quyền xóa dữ liệu kế toán và cấu hình hệ thống lỗi.",
    status: passedUser?.status === "Hoạt động" ? "ACTIVE" : "ACTIVE",
    avatar: passedUser?.avatar || "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&auto=format&fit=crop&q=60"
  });

  // Ma trận phân quyền đầy đủ 5 cột quyền: XEM, THÊM, SỬA, XÓA, DUYỆT (Nghiệp vụ Enterprise)
  const [matrixPermissions, setMatrixPermissions] = useState([
    { id: "dashboard", name: "Bảng điều khiển (Dashboard)", type: "dashboard", view: true, add: false, edit: false, delete: false, approve: false },
    { id: "products", name: "Quản lý Sản phẩm & SKU", type: "products", view: true, add: true, edit: true, delete: false, approve: false },
    { id: "farm", name: "Quản lý Nông trại & Mùa vụ", type: "farm", view: true, add: true, edit: true, delete: false, approve: false },
    { id: "orders", name: "Quản lý Đơn hàng", type: "orders", view: true, add: true, edit: true, delete: false, approve: false },
    { id: "inventory", name: "Quản lý Tồn kho", type: "inventory", view: true, add: true, edit: true, delete: false, approve: false },
    { id: "customers", name: "Quản lý Khách hàng", type: "customers", view: true, add: true, edit: true, delete: false, approve: false },
    { id: "settings", name: "Cấu hình Hệ thống", type: "settings", view: true, add: false, edit: false, delete: false, approve: false },
  ]);

  // Danh sách nhân sự đang được gán cho Vai trò này (Hiển thị ở Widget bên phải)
  const [assignedUsers, setAssignedUsers] = useState([
    { name: "Trần Đức Huy", department: "Kho & Nông Trại", avatar: "", initial: "TH" },
    { name: "Phạm Mai Lan", department: "Kinh doanh B2B", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=60", initial: "ML" },
    { name: "Lê Hoàng Quân", department: "Nông trại Đà Lạt", avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&auto=format&fit=crop&q=60", initial: "HQ" },
  ]);

  const [searchQuery, setSearchQuery] = useState("");

  // Tự động cập nhật ma trận quyền dựa trên vai trò đầu vào để tăng tính thực tế
  useEffect(() => {
    if (roleInfo.roleName === "ADMIN") {
      setMatrixPermissions(prev => prev.map(item => ({ ...item, view: true, add: true, edit: true, delete: true, approve: true })));
    } else if (roleInfo.roleName === "STAFF") {
      setMatrixPermissions(prev => prev.map(item => ({
        ...item,
        view: true,
        add: item.id === "orders" || item.id === "inventory",
        edit: item.id === "orders" || item.id === "inventory",
        delete: false,
        approve: false
      })));
    }
  }, [roleInfo.roleName]);

  const handleCheckboxChange = (id, field) => {
    if (!isEditing) return; // Chỉ cho sửa khi bật chế độ chỉnh sửa
    setMatrixPermissions(prev =>
      prev.map(item => (item.id === id ? { ...item, [field]: !item[field] } : item))
    );
  };

  const handleSaveChanges = () => {
    setIsEditing(false);
    alert("Hệ thống Demi Mart: Đã cập nhật ma trận phân quyền vai trò thành công!");
  };

  const filteredAssignedUsers = assignedUsers.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ĐỒNG BỘ ICON CHUYÊN NGHIỆP: Render các icon mô-đun vẽ mảnh tinh tế theo image_41f966.png
  const renderModuleIcon = (type) => {
    const iconClass = "w-[18px] h-[18px] text-slate-500/80 shrink-0";
    switch (type) {
      case "dashboard": 
        return (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
        );
      case "products": 
        return (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          </svg>
        );
      case "farm": 
        return (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        );
      case "orders": 
        return (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2-2V6.75a2.25 2.25 0 0 0-2-2h-2.25m-3 0H7.5a2.25 2.25 0 0 0-2 2v12a2.25 2.25 0 0 0 2 2h2.25m3.75-16.5a1.5 1.5 0 0 0-3 0v1.5a1.5 1.5 0 0 0 3 0v-1.5Z" />
          </svg>
        );
      case "inventory": 
        return (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-5.25v9" />
          </svg>
        );
      case "customers": 
        return (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.265 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
          </svg>
        );
      case "settings": 
        return (
          <svg className="w-[18px] h-[18px] text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 3v6m0 4v8M4 9h4M12 3v2m0 4v12M10 5h4M18 3v10m0 4v4M16 13h4" />
          </svg>
        );
      default: 
        return (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
        );
    }
  };

  return (
    <div className="w-full bg-[#fafafa] font-sans antialiased text-slate-800 text-left p-1 animate-fadeIn">
      
      {/* HEADER: Tiêu đề trang & các nút tác vụ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[26px] font-bold text-slate-800 tracking-tight">
            Chỉnh sửa vai trò: {roleInfo.title} ({roleInfo.roleName === "MANAGER" ? "Manager" : roleInfo.roleName})
          </h1>
          <div className="flex items-center gap-2 text-xs font-medium text-gray-400 mt-1.5">
            <span className="hover:text-slate-600 cursor-pointer">Dashboard</span>
            <span>❯</span>
            <span className="hover:text-slate-600 cursor-pointer">Quản lý tài khoản nội bộ</span>
            <span>❯</span>
            <span className="text-[#006c49] font-semibold">Chi tiết vai trò</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <button
            onClick={() => navigate("/admin/settings/quanlynoibo/danhsachnoibo")}
            className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-600 transition shadow-sm"
          >
            <span className="text-sm">↩</span> Quay về
          </button>
          
          {isEditing ? (
            <button
              onClick={handleSaveChanges}
              className="flex items-center gap-1.5 bg-[#22c55e] hover:bg-emerald-600 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              {/* ĐÃ CẬP NHẬT: Icon lưu thay đổi (Check tích nằm trong vòng tròn/ổ đĩa vẽ mảnh) */}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0Z" />
              </svg>
              Lưu thay đổi
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 bg-[#006c49] hover:bg-[#00563a] text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              {/* ĐÃ CẬP NHẬT: Icon nút chỉnh sửa vai trò chính (Cây bút chì Line-Art mảnh vuốt dài chuẩn tỉ lệ) */}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
              </svg>
              Chỉnh sửa vai trò
            </button>
          )}
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* CỘT TRÁI */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* CARD 1: Thông tin Vai trò (Role Info) */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <svg className="w-[18px] h-[18px] text-[#006c49]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 111.063.852l-.708 2.836a.75.75 0 001.063.852l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0Zm-9-3.75h.008v.008H12V8.25Z" />
              </svg>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Thông tin Vai trò (Role Info)</h3>
            </div>

            {/* Avatar & Tên định danh */}
            <div className="flex items-center gap-4 relative">
              <div className="relative group">
                <img
                  src={roleInfo.avatar}
                  alt="Avatar"
                  className="w-16 h-16 rounded-full object-cover border border-gray-200 shadow-sm"
                />
                <div className="absolute bottom-0 right-0 w-5 h-5 bg-white rounded-full border border-gray-200 flex items-center justify-center cursor-pointer shadow-sm hover:bg-gray-50 transition">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    strokeWidth={1.8} 
                    stroke="currentColor" 
                    className="w-3.5 h-3.5 text-slate-400"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" 
                    />
                  </svg>
                </div>
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-800">{roleInfo.displayName}</h4>
                <p className="text-xs text-gray-400 mt-0.5">{roleInfo.title}</p>
              </div>
            </div>

            {/* Inputs hàng ngang */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tên hiển thị</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={roleInfo.displayName}
                  onChange={(e) => setRoleInfo({ ...roleInfo, displayName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white disabled:bg-gray-50/50 text-sm font-medium border border-gray-200 rounded-xl outline-none focus:border-emerald-500 transition text-slate-800"
                />
              </div>
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Vai trò</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={roleInfo.title}
                  onChange={(e) => setRoleInfo({ ...roleInfo, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white disabled:bg-gray-50/50 text-sm font-medium border border-gray-200 rounded-xl outline-none focus:border-emerald-500 transition text-slate-800"
                />
              </div>
            </div>

            {/* Mô tả nghiệp vụ */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mô tả nghiệp vụ</label>
              <textarea
                rows="3"
                disabled={!isEditing}
                value={roleInfo.description}
                onChange={(e) => setRoleInfo({ ...roleInfo, description: e.target.value })}
                className="w-full px-4 py-3 bg-white disabled:bg-gray-50/50 text-xs font-medium border border-gray-200 rounded-xl outline-none focus:border-emerald-500 transition text-gray-500 leading-relaxed resize-none"
              />
            </div>
          </div>

          {/* CARD 2: Ma trận Phân quyền Mặc định */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <svg className="w-[18px] h-[18px] text-[#006c49]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.745 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12Z" />
              </svg>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Ma trận Phân quyền Mặc định</h3>
            </div>

            <div className="bg-[#eff6ff] border border-[#dbeafe] rounded-xl p-4 flex gap-3 text-left">
              <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a3 3 0 1 0-3-3M12 12.75a3 3 0 1 1 3-3M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <div className="text-xs leading-relaxed text-blue-700 font-medium">
                <p className="font-bold text-blue-900 mb-0.5">Lưu ý cấu hình Role Template:</p>
                Các quyền dưới đây tự động áp dụng cho tất cả tài khoản thuộc nhóm {roleInfo.title}. Nếu bạn muốn cấu hình riêng cho 1 người, hãy sử dụng tính năng "Phân quyền chi tiết" ở bảng danh sách tài khoản.
              </div>
            </div>

            <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm bg-white">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-100 text-[10px] font-extrabold uppercase tracking-wider text-gray-400 select-none">
                    <th className="py-3 px-5 w-1/2">Chức năng / Mô-đun</th>
                    <th className="py-3 px-2 text-center">Xem</th>
                    <th className="py-3 px-2 text-center">Thêm</th>
                    <th className="py-3 px-2 text-center">Sửa</th>
                    <th className="py-3 px-2 text-center">Xóa</th>
                    <th className="py-3 px-2 text-center">Duyệt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-semibold text-slate-700">
                  {matrixPermissions.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="py-4 px-5 flex items-center gap-3 text-slate-800 font-bold">
                        {renderModuleIcon(item.type)}
                        <span>{item.name}</span>
                      </td>
                      {["view", "add", "edit", "delete", "approve"].map((field) => (
                        <td key={field} className="py-3 px-2 text-center">
                          <input
                            type="checkbox"
                            checked={item[field]}
                            disabled={!isEditing || (item.id === "dashboard" && field !== "view")}
                            onChange={() => handleCheckboxChange(item.id, field)}
                            className="w-4 h-4 rounded text-[#006c49] border-gray-300 focus:ring-emerald-500 accent-[#006c49] cursor-pointer disabled:opacity-40"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI */}
        <div className="space-y-6">
          
          {/* WIDGET 1: Danh sách nhân sự */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-50 pb-3">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.265 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                </svg>
                <span>Đang gán cho</span>
              </h4>
              <span className="bg-blue-50 text-blue-600 font-black px-2 py-0.5 rounded-full text-[10px]">
                {assignedUsers.length}
              </span>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Tìm tài khoản..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-transparent rounded-xl text-xs outline-none focus:bg-white focus:border-gray-200 transition-all font-medium"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.636z" />
              </svg>
            </div>

            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {filteredAssignedUsers.map((u, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-gray-50 hover:border-gray-100 hover:bg-gray-50/50 transition cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    {u.avatar ? (
                      <img src={u.avatar} alt="" className="w-8 h-8 rounded-full object-cover border border-gray-100" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-extrabold text-[10px] flex items-center justify-center border border-blue-100">
                        {u.initial}
                      </div>
                    )}
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-slate-800">{u.name}</span>
                      <span className="text-[10px] text-gray-400 font-medium mt-0.5">{u.department}</span>
                    </div>
                  </div>
                  <svg className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              ))}
            </div>

            <button className="w-full text-center text-xs font-bold text-[#006c49] hover:underline pt-1 block">
              Xem tất cả {assignedUsers.length} tài khoản
            </button>
          </div>

          {/* WIDGET 2: Trạng thái nhóm quyền */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div className="text-left">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Trạng thái nhóm</span>
              <span className="text-emerald-500 font-black text-sm tracking-wide mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {roleInfo.status}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}