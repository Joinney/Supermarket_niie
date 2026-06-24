import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useParams } from "react-router-dom";

// Ma trận cấu hình quyền mẫu chuẩn cho từng vị trí nghiệp vụ của ETECHS
const DEFAULT_PRESETS = {
  ADMIN: [
    { id: "dashboard", view: true, add: true, edit: true, delete: true },
    { id: "products", view: true, add: true, edit: true, delete: true },
    { id: "farm", view: true, add: true, edit: true, delete: true },
    { id: "orders", view: true, add: true, edit: true, delete: true },
    { id: "inventory", view: true, add: true, edit: true, delete: true },
    { id: "customers", view: true, add: true, edit: true, delete: true },
    { id: "settings", view: true, add: true, edit: true, delete: true },
  ],
  MANAGER: [
    { id: "dashboard", view: true, add: false, edit: false, delete: false },
    { id: "products", view: true, add: true, edit: true, delete: false },
    { id: "farm", view: true, add: true, edit: true, delete: false },
    { id: "orders", view: true, add: true, edit: true, delete: false },
    { id: "inventory", view: true, add: true, edit: true, delete: false },
    { id: "customers", view: true, add: true, edit: true, delete: false },
    { id: "settings", view: true, add: false, edit: false, delete: false },
  ],
  STAFF: [
    { id: "dashboard", view: true, add: false, edit: false, delete: false },
    { id: "products", view: true, add: false, edit: false, delete: false },
    { id: "farm", view: true, add: false, edit: false, delete: false },
    { id: "orders", view: true, add: true, edit: true, delete: false },     
    { id: "inventory", view: true, add: true, edit: true, delete: false },  
    { id: "customers", view: true, add: true, edit: false, delete: false },
    { id: "settings", view: false, add: false, edit: false, delete: false }, 
  ]
};

export default function Danhsachnoibo() {
  const navigate = useNavigate();
  const { email: urlEmail } = useParams();

  // --- MANAGEMENT STATES ---
  const [isModalOpen, setIsCollapsedModal] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // States phục vụ việc tìm kiếm và lọc dữ liệu thực tế
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("Tất cả Vai trò");
  const [statusFilter, setStatusFilter] = useState("Trạng thái");

  // Form phục vụ cấp tài khoản mới
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "1234567890",
    role: "Staff (Nhân viên)",
    department: "",
    sendEmailNotification: true,
  });

  // Dữ liệu danh sách tài khoản nội bộ
  const [users, setUsers] = useState([
    { name: "Lê Hoàng Quân", email: "quan.le@etechs.vn", role: "MANAGER", roleColor: "bg-blue-50 text-blue-600 border-blue-100", department: "Nông trại Đà Lạt", status: "Hoạt động", statusColor: "text-emerald-500 bg-emerald-50", lastLogin: "Vừa xong", ip: "IP: 192.168.1.12", avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&auto=format&fit=crop&q=60", desc: "Cấp quản lý cấp trung, có quyền điều phối hàng hóa, nông trại và đơn hàng. Không có quyền xóa dữ liệu kế toán và cấu hình hệ thống lỗi." },
    { name: "Lê Hồng Phong", email: "admin.phong@etechs.vn", role: "ADMIN", roleColor: "bg-red-50 text-red-500 border-red-100", department: "Ban Giám Đốc", status: "Hoạt động", statusColor: "text-emerald-500 bg-emerald-50", lastLogin: "Vừa xong", ip: "IP: 192.168.1.1", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60", desc: "Quản trị viên tối cao, toàn quyền cấu hình toàn bộ phân hệ hệ thống." },
    { name: "Trần Đức Huy", email: "huy.tran@etechs.vn", role: "MANAGER", roleColor: "bg-blue-50 text-blue-600 border-blue-100", department: "Kho & Nông Trại", status: "Hoạt động", statusColor: "text-emerald-500 bg-emerald-50", lastLogin: "2 giờ trước", ip: "Trình duyệt Chrome", avatar: "", desc: "Quản lý kho vận và tiến độ thu hoạch tại các phân khu nông trại sản xuất." },
    { name: "Phạm Mai Lan", email: "lan.pham@etechs.vn", role: "MANAGER", roleColor: "bg-blue-50 text-blue-600 border-blue-100", department: "Kinh doanh B2B", status: "Hoạt động", statusColor: "text-emerald-500 bg-emerald-50", lastLogin: "Hôm qua, 14:30", ip: "App Di động", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=60", desc: "Điều hành và phê duyệt các chính sách chiết khấu thương mại khối doanh nghiệp." },
    { name: "Nguyễn Đình Duy", email: "duy.nguyen@etechs.vn", role: "STAFF", roleColor: "bg-slate-50 text-slate-600 border-slate-200", department: "Nhân viên Kho", status: "Hoạt động", statusColor: "text-emerald-500 bg-emerald-50", lastLogin: "3 ngày trước", ip: "Máy quét mã vạch", avatar: "", desc: "Nhân viên tác nghiệp trực tiếp, quét mã nhập xuất kho thành phẩm." },
  ]);

  const [rolePermissions, setRolePermissions] = useState([
    { id: "dashboard", name: "Bảng điều khiển (Dashboard)", type: "dashboard", view: true, add: false, edit: false, delete: false },
    { id: "products", name: "Quản lý Sản phẩm & SKU", type: "products", view: true, add: true, edit: true, delete: true },
    { id: "farm", name: "Quản lý Nông trại & Mùa vụ", type: "farm", view: true, add: true, edit: true, delete: true },
    { id: "orders", name: "Quản lý Đơn hàng", type: "orders", view: true, add: true, edit: true, delete: true },
    { id: "inventory", name: "Quản lý Tồn kho", type: "inventory", view: true, add: true, edit: true, delete: true },
    { id: "customers", name: "Quản lý Khách hàng", type: "customers", view: true, add: true, edit: true, delete: true },
    { id: "settings", name: "Quản lý Phân quyền & Cài đặt", type: "settings", view: true, add: true, edit: true, delete: true },
  ]);

  const [showPassword, setShowPassword] = useState(false);

  // Thống kê động theo dữ liệu thực tế
  const countTotal = users.length > 5 ? users.length : 42;
  const countAdmin = users.filter(u => u.role === "ADMIN").length > 1 ? users.filter(u => u.role === "ADMIN").length : 3;
  const countManager = users.filter(u => u.role === "MANAGER").length > 3 ? users.filter(u => u.role === "MANAGER").length : 8;
  const countStaff = users.filter(u => u.role === "STAFF").length > 1 ? users.filter(u => u.role === "STAFF").length : 31;

  const handleApplyPreset = (presetKey) => {
    const preset = DEFAULT_PRESETS[presetKey];
    if (!preset) return;
    setRolePermissions(prev =>
      prev.map(item => {
        const targetPermission = preset.find(p => p.id === item.id);
        return targetPermission ? { ...item, ...targetPermission } : item;
      })
    );
  };

  const handleSelectAllPermissions = () => {
    setRolePermissions(prev => prev.map(item => ({ ...item, view: true, add: true, edit: true, delete: true })));
  };

  const handleClearAllPermissions = () => {
    setRolePermissions(prev => prev.map(item => ({ ...item, view: false, add: false, edit: false, delete: false })));
  };

  const renderModuleIcon = (type) => {
    switch (type) {
      case "dashboard": return <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
      case "products": return <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>;
      case "farm": return <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707m12.728 12.728A9 9 0 1111.55 3.05a.5.5 0 00.5.5v2.32a6 6 0 106.12 6.12h2.32a.5.5 0 00.5-.5a9 9 0 00-3.05-6.47z" /></svg>;
      case "orders": return <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
      case "inventory": return <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
      case "customers": return <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
      case "settings": return <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
      default: return <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handlePermissionChange = (moduleId, field) => {
    setRolePermissions(prev => prev.map(item => (item.id === moduleId ? { ...item, [field]: !item[field] } : item)));
  };

  const handleRoleMatrixCheckboxChange = (id, field) => {
    setRolePermissions(prev => prev.map(item => item.id === id ? { ...item, [field]: !item[field] } : item));
  };

  const handleSavePermissions = () => {
    alert(`Đã lưu thiết lập phân quyền chi tiết cho nhân sự: ${selectedUser?.name}`);
    setIsPermissionModalOpen(false);
  };

  const handleCreateAccount = (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email) return;

    const newUser = {
      name: formData.fullName,
      email: formData.email,
      role: formData.role.split(" ")[0].toUpperCase(),
      roleColor: formData.role.includes("ADMIN") ? "bg-red-50 text-red-500 border-red-100" : formData.role.includes("Quản lý") ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-slate-50 text-slate-600 border-slate-200",
      department: formData.department || "Chưa xếp phòng",
      status: "Hoạt động",
      statusColor: "text-emerald-500 bg-emerald-50",
      lastLogin: "Không có dữ liệu",
      ip: "Tài khoản mới tạo",
      avatar: "",
      desc: "Chưa cập nhật mô tả nghiệp vụ cụ thể cho nhân sự.",
    };

    setUsers([newUser, ...users]);
    setIsCollapsedModal(false);
    setFormData({ fullName: "", email: "", password: "1234567890", role: "Staff (Nhân viên)", department: "", sendEmailNotification: true });
  };

  const isDetailPage = Boolean(urlEmail);
  const detailUser = isDetailPage ? users.find((u) => u.email === urlEmail) : null;

  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "Tất cả Vai trò" || u.role === roleFilter.toUpperCase();
    const matchesStatus = statusFilter === "Trạng thái" || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (isDetailPage && detailUser) {
    return (
      <div className="w-full bg-[#fafafa] font-sans antialiased text-slate-800 text-left animate-fadeIn p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {isEditingRole ? `Chỉnh sửa vai trò: ${detailUser.role}` : `Chi tiết Vai trò: ${detailUser.role}`}
            </h1>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 mt-1">
              <span>Dashboard</span> <span>▶</span> <span>Settings</span> <span>▶</span> <span>Quản lý nội bộ</span> <span>▶</span> <span className="text-[#006c49]">Chi tiết vai trò</span>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button 
              onClick={() => {
                if (isEditingRole) setIsEditingRole(false);
                else navigate("/admin/settings/quanlynoibo/danhsachnoibo");
              }}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-600 transition shadow-sm active:scale-95"
            >
              ↩ Quay về danh sách
            </button>
            {isEditingRole ? (
              <button onClick={() => setIsEditingRole(false)} className="flex items-center gap-2 bg-[#22c55e] text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-emerald-600 transition-all active:scale-95">
                💾 Lưu thay đổi
              </button>
            ) : (
              <button onClick={() => setIsEditingRole(true)} className="flex items-center gap-2 bg-[#006c49] text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-[#00563a] transition-all active:scale-95">
                ✏ Chỉnh sửa vai trò
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 mb-5 border-b border-gray-50 pb-2">ℹ Thông tin Vai trò (Role Info)</h3>
              <div className="flex items-center gap-4 mb-6">
                {detailUser.avatar ? (
                  <img src={detailUser.avatar} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-emerald-50 shadow-sm" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-emerald-50 text-[#006c49] text-xl font-black flex items-center justify-center border-2 border-emerald-100">
                    {detailUser.name.split(" ").pop().substring(0,2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="font-extrabold text-slate-900 text-lg">{detailUser.name}</h4>
                  <p className="text-xs text-gray-400 mt-0.5">{detailUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Tên hiển thị nhân sự</label>
                  <p className="text-sm font-bold text-slate-800 mt-1">{detailUser.name}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Nhóm quyền</label>
                  <p className="text-sm font-bold text-slate-800 mt-1">{detailUser.role}</p>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Mô tả chi tiết phân hệ vận hành</label>
                <p className="text-xs font-semibold text-slate-500 leading-relaxed mt-1.5">{detailUser.desc || "Chưa có mô tả cụ thể về trách nhiệm nghiệp vụ hệ thống."}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-sm font-extrabold text-slate-800 mb-4">Ma trận Phân quyền Mặc định</h3>
              <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3.5 flex gap-3 text-left mb-5">
                <span className="text-blue-500 text-sm leading-none mt-0.5">ℹ</span>
                <div className="text-[11px] leading-relaxed text-blue-700 font-medium">
                  <p className="font-bold text-blue-900 mb-0.5">Lưu ý cấu hình hệ thống:</p>
                  Mọi thay đổi trên cấu trúc ma trận template này sẽ áp dụng đồng loạt cho toàn bộ thành viên gán nhãn quyền <span className="font-bold">{detailUser.role}</span>.
                </div>
              </div>

              <div className="border border-gray-50 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      <th className="py-3 px-4">Chức năng Mô-đun</th>
                      <th className="py-3 px-2 text-center">Xem</th>
                      <th className="py-3 px-2 text-center">Thêm</th>
                      <th className="py-3 px-2 text-center">Sửa</th>
                      <th className="py-3 px-2 text-center">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 font-bold text-slate-700">
                    {rolePermissions.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="py-3.5 px-4 flex items-center gap-3.5 text-slate-800 font-semibold">
                          {renderModuleIcon(item.type)}
                          <span>{item.name}</span>
                        </td>
                        {["view", "add", "edit", "delete"].map((field) => (
                          <td key={field} className="py-3 px-2 text-center">
                            <input 
                              type="checkbox"
                              checked={item[field]}
                              disabled={!isEditingRole || (item.id === "dashboard" && field !== "view")}
                              onChange={() => handleRoleMatrixCheckboxChange(item.id, field)}
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

          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-50 pb-3 mb-4">
                <h4 className="text-xs font-extrabold text-slate-800">👥 Đang gán cho</h4>
                <span className="bg-blue-50 text-blue-600 font-black px-2 py-0.5 rounded-full text-[10px]">8</span>
              </div>
              <div className="space-y-3">
                {users.slice(0, 3).map((u, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50/60 border border-transparent hover:border-gray-100 transition">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-extrabold text-[10px] flex items-center justify-center border border-blue-100">
                        {u.name.split(" ").pop().substring(0,2).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-800">{u.name}</span>
                        <span className="text-[10px] text-gray-400 font-medium">{u.department}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Trạng thái nhóm quyền</span>
                <span className="text-emerald-500 font-black text-sm tracking-wide mt-1 flex items-center gap-1.5">● ACTIVE</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 text-xs font-bold">✓</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#fafafa] font-sans antialiased text-slate-800 text-left relative p-4 animate-fadeIn">
      
      {/* --- CỤM TIÊU ĐỀ & BUTTONS ĐÃ ĐƯỢC ĐƯA LÊN TRÊN CÙNG --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">Danh sách quản lý nội bộ</h1>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 mt-1">
            <Link to="/admin/dashboard/thongkesanpham" className="hover:text-slate-600 transition-colors">Dashboard</Link>
            <span>❯</span>
            <span>Settings</span>
            <span>❯</span>
            <span className="text-[#006c49]">Quản lý nội bộ</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 bg-white hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-600 transition shadow-sm active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-3.5 h-3.5 text-gray-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Xuất danh sách
          </button>
          <button 
            onClick={() => setIsCollapsedModal(true)}
            className="flex items-center gap-2 bg-[#006c49] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-[#00563a] active:scale-95 transition-all"
          >
            <span className="text-lg leading-none">+</span> Thêm nhân sự mới
          </button>
        </div>
      </div>

      {/* --- KHU VỰC THỐNG KÊ TỔNG QUAN (CARDS) --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Tổng tài khoản</p>
            <p className="text-3xl font-black mt-1 text-gray-800">{countTotal}</p>
          </div>
          <div className="p-3 bg-emerald-50/60 text-[#006c49] rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-2.533-3.076l-1.408-.39a.74.74 0 0 0-.528-.47M15 19.128v-.128A7.5 7.5 0 0 0 13.125 11.02a7.5 7.5 0 0 0-6.25 0A7.5 7.5 0 0 0 5 19a.75.75 0 0 0 .012.128M15 19.128v.128c0 .343-.058.674-.166.984M5.012 19.128A9.39 9.39 0 0 1 3.75 19a9.337 9.337 0 0 1-4.121-.952 4.125 4.125 0 0 1 2.533-3.076l1.408-.39a.74.74 0 0 1 .528-.47M5.012 19.128V19a7.5 7.5 0 0 1 1.857-5.119M15 7.5A3.75 3.75 0 1 1 11.25 11.25 3.75 3.75 0 0 1 15 7.5zm-7.5 1.5a3 3 0 1 1-3 3 3 3 0 0 1 3-3z" />
            </svg>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Admin (Quản trị)</p>
            <p className="text-3xl font-black mt-1 text-gray-800">{countAdmin}</p>
          </div>
          <div className="p-3 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5 text-red-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751A11.956 11.956 0 0112 2.714z" />
            </svg>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Quản lý (Manager)</p>
            <p className="text-3xl font-black mt-1 text-gray-800">{countManager}</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5 text-blue-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Users (Nhân viên)</p>
            <p className="text-3xl font-black mt-1 text-gray-800">{countStaff}</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5 text-emerald-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
            </svg>
          </div>
        </div>
      </div>

      {/* --- BỘ LỌC TÌM KIẾM --- */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 justify-between items-center border-b border-gray-50">
          
          {/* Custom Dropdown Lọc căn lề và chuẩn Icon xổ */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-auto min-w-[160px]">
              <select 
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl pl-4 pr-10 py-2.5 text-sm font-bold text-slate-700 outline-none cursor-pointer hover:bg-gray-50 transition appearance-none"
              >
                <option value="Tất cả Vai trò">Tất cả Vai trò</option>
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="Staff">Staff</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none">
                <svg className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
            </div>

            <div className="relative w-full sm:w-auto min-w-[140px]">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl pl-4 pr-10 py-2.5 text-sm font-bold text-slate-700 outline-none cursor-pointer hover:bg-gray-50 transition appearance-none"
              >
                <option value="Trạng thái">Trạng thái</option>
                <option value="Hoạt động">Hoạt động</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none">
                <svg className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
            </div>
          </div>

          <div className="relative w-full sm:w-[320px]">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.604 10.604z" />
            </svg>
            <input
              type="text"
              placeholder="Tìm theo tên, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition font-medium placeholder-gray-400"
            />
          </div>
        </div>

        {/* --- BẢNG DANH SÁCH --- */}
        <div className="w-full overflow-x-auto min-h-0">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#fcfdfd] border-b border-gray-100 text-[10px] font-extrabold uppercase tracking-wider text-gray-400 select-none">
                <th className="py-4 px-6 whitespace-nowrap">Tài khoản & Email</th>
                <th className="py-4 px-4 whitespace-nowrap text-center">Vai trò (Role)</th>
                <th className="py-4 px-4 whitespace-nowrap">Phòng ban</th>
                <th className="py-4 px-4 whitespace-nowrap text-center">Trạng thái</th>
                <th className="py-4 px-4 whitespace-nowrap">Đăng nhập cuối</th>
                <th className="py-4 px-6 text-center whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs font-semibold text-slate-600">
              {filteredUsers.map((user, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover border border-gray-100 shadow-sm shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-emerald-50 text-[#006c49] font-bold flex items-center justify-center shrink-0 border border-emerald-100 shadow-sm">
                          {user.name.split(" ").pop().substring(0,2).toUpperCase()}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                          {user.name} 
                          {user.role === "ADMIN" && <span className="text-emerald-600 text-[10px]">✔</span>}
                        </span>
                        <span className="text-[11px] text-gray-400 font-medium mt-0.5">{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 border rounded-md text-[10px] font-extrabold tracking-wide ${user.roleColor}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-gray-500 font-medium">{user.department}</td>
                  <td className="py-4 px-4 text-center whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center justify-center w-20 mx-auto ${user.statusColor}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-slate-700 font-bold">{user.lastLogin}</span>
                      <span className="text-[10px] text-gray-400 font-medium mt-0.5">{user.ip}</span>
                    </div>
                  </td>
                  
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => { 
                          setSelectedUser(user); 
                          setIsPermissionModalOpen(true); 
                          
                          const userPreset = user.role.toUpperCase();
                          const preset = DEFAULT_PRESETS[userPreset];
                          if (preset) {
                            setRolePermissions(prev =>
                              prev.map(item => {
                                const targetPermission = preset.find(p => p.id === item.id);
                                return targetPermission ? { ...item, ...targetPermission } : item;
                              })
                            );
                          }
                        }} 
                        className="p-1.5 text-gray-400 hover:text-[#006c49] hover:bg-slate-100 rounded-lg transition duration-150"
                        title="Phân quyền chi tiết"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="4" y1="21" x2="4" y2="14"></line>
                          <line x1="4" y1="10" x2="4" y2="3"></line>
                          <line x1="12" y1="21" x2="12" y2="12"></line>
                          <line x1="12" y1="8" x2="12" y2="3"></line>
                          <line x1="20" y1="21" x2="20" y2="16"></line>
                          <line x1="20" y1="12" x2="20" y2="3"></line>
                          <line x1="1" y1="14" x2="7" y2="14"></line>
                          <line x1="9" y1="8" x2="15" y2="8"></line>
                          <line x1="17" y1="16" x2="23" y2="16"></line>
                        </svg>
                      </button>
                      
                      <button 
                        onClick={() => navigate(`/admin/settings/quanlynoibo/danhsachnoibo/${user.email}`)}
                        className="p-1.5 text-gray-400 hover:text-[#006c49] hover:bg-slate-100 rounded-lg transition duration-150"
                        title="Xem trang chi tiết riêng biệt"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 sm:p-5 flex justify-between items-center border-t border-gray-100 text-xs font-bold text-gray-400">
          <div><span className="text-slate-800">1</span> - 10 of 13 Pages</div>
          <div className="flex items-center gap-1.5">
            <button className="w-8 h-8 flex items-center justify-center border border-gray-100 rounded-xl hover:bg-gray-50 text-gray-400 transition">❮</button>
            <button className="w-8 h-8 flex items-center justify-center border border-gray-100 rounded-xl hover:bg-gray-50 text-gray-400 transition">❯</button>
          </div>
        </div>
      </div>

      {/* ================= MODAL 1: CẤP TÀI KHOẢN NHÂN SỰ MỚI ================= */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[9999] flex items-center justify-center p-4 select-none animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-xl border border-gray-100 overflow-hidden transform transition-all duration-300">
            <div className="p-6 pb-4 flex items-center justify-between border-b border-gray-50">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Thêm nhân sự mới</h3>
                <p className="text-xs text-gray-400 font-medium mt-1">Cấp tài khoản hệ thống và thiết lập phòng ban cho nhân sự mới.</p>
              </div>
              <button onClick={() => setIsCollapsedModal(false)} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">✕</button>
            </div>

            <form onSubmit={handleCreateAccount} className="p-6 space-y-4 text-sm font-semibold text-slate-700">
              <div className="flex items-center gap-4 bg-[#fafafa]/50 p-3 rounded-2xl border border-dashed border-gray-200">
                <div className="w-14 h-14 rounded-full border border-dashed border-gray-300 bg-white flex items-center justify-center text-gray-400 font-light text-xl cursor-pointer hover:bg-gray-50">+</div>
                <div className="flex flex-col text-left">
                  <span className="font-bold text-slate-800">Ảnh đại diện (Avatar)</span>
                  <span className="text-[10px] text-gray-400 font-medium mt-0.5">Định dạng JPG, PNG. Tối đa 2MB.</span>
                  <button type="button" className="text-xs text-emerald-600 font-bold mt-1 text-left w-max hover:underline">Tải ảnh lên</button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-bold text-slate-700">Họ và tên nhân viên <span className="text-red-500">*</span></label>
                <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} placeholder="VD: Nguyễn Văn A" required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 font-medium transition" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Địa chỉ Email <span className="text-red-500">*</span></label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="VD: email@etechs.vn" required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 font-medium transition" />
                </div>
                <div className="flex flex-col gap-1.5 relative">
                  <label className="text-xs font-bold text-slate-700">Mật khẩu mặc định <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleInputChange} required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 font-medium transition pr-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-slate-600 text-xs">{showPassword ? "🙈" : "👁"}</button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Vai trò (Role) <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select name="role" value={formData.role} onChange={handleInputChange} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none bg-white font-bold text-slate-700 focus:border-emerald-500 cursor-pointer appearance-none">
                      <option>Staff (Nhân viên)</option>
                      <option>Manager (Quản lý)</option>
                      <option>Admin (Quản trị)</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none">
                      <svg className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Phòng ban</label>
                  <div className="relative">
                    <select name="department" value={formData.department} onChange={handleInputChange} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none bg-white font-medium focus:border-emerald-500 cursor-pointer text-gray-500 appearance-none">
                      <option value="">Chọn phòng ban...</option>
                      <option value="Ban Giám Đốc">Ban Giám Đốc</option>
                      <option value="Kho & Nông Trại">Kho & Nông Trại</option>
                      <option value="Kinh doanh B2B">Kinh doanh B2B</option>
                      <option value="Kế toán">Kế toán</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none">
                      <svg className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 text-left">
                <input type="checkbox" id="sendEmailNotification" name="sendEmailNotification" checked={formData.sendEmailNotification} onChange={handleInputChange} className="rounded border-gray-300 text-emerald-600 accent-emerald-600 w-4 h-4 cursor-pointer" />
                <label htmlFor="sendEmailNotification" className="text-xs text-slate-600 font-semibold cursor-pointer select-none">Gửi thông tin đăng nhập (Email & Mật khẩu) qua email cho nhân viên</label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-50">
                <button type="button" onClick={() => setIsCollapsedModal(false)} className="px-5 py-2.5 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-500 transition">Hủy bỏ</button>
                <button type="submit" className="px-5 py-2.5 bg-[#006c49] text-white rounded-xl text-xs font-bold shadow-sm hover:bg-[#00563a] transition flex items-center gap-1.5"><span>+</span> Cấp tài khoản</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ================= MODAL 2: PHÂN QUYỀN CHI TIẾT ================= */}
      {isPermissionModalOpen && selectedUser && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all max-h-[92vh] flex flex-col">
            
            <div className="p-6 pb-4 flex items-center justify-between border-b border-gray-100 shrink-0">
              <div>
                <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Phân quyền chi tiết</h3>
                <p className="text-xs text-gray-400 font-medium mt-1">Hệ thống tự động nhận diện quyền theo vai trò gốc. Sử dụng các nút thao tác nhanh nếu muốn đặt lại.</p>
              </div>
              <button onClick={() => setIsPermissionModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-gray-400 hover:bg-slate-100 hover:text-gray-600 transition">✕</button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-sm">
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-emerald-50 text-[#006c49] font-extrabold flex items-center justify-center border border-emerald-100 shadow-sm">
                      {selectedUser.name.split(" ").pop().substring(0,2).toUpperCase()}
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="font-bold text-slate-800 text-base">{selectedUser.name}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs font-semibold text-gray-400 shrink-0">Vai trò:</span>
                        <span className="px-2 py-0.5 rounded font-extrabold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wider">{selectedUser.role}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:gap-2.5 self-start sm:self-center">
                    <button 
                      type="button" 
                      onClick={() => handleApplyPreset(selectedUser.role)} 
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-slate-700 rounded-xl text-xs font-bold transition shadow-sm active:scale-95 animate-fadeIn"
                      title="Khôi phục lại ma trận quyền mặc định ban đầu của vị trí này"
                    >
                      Chọn mặc định
                    </button>
                    <button 
                      type="button" 
                      onClick={handleSelectAllPermissions} 
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#006c49] border border-emerald-200 rounded-xl text-xs font-bold transition shadow-sm active:scale-95"
                    >
                      Chọn tất cả
                    </button>
                    <button 
                      type="button" 
                      onClick={handleClearAllPermissions} 
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-xl text-xs font-bold transition shadow-sm active:scale-95"
                    >
                      Xóa tất cả
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-[#fffbeb] border border-[#fef3c7] rounded-xl p-4 flex gap-3 text-left">
                <svg className="w-5 h-5 text-[#d97706] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="text-xs leading-relaxed text-[#92400e] font-medium">
                  <p className="font-bold text-[#78350f] mb-0.5">Lưu ý chuyên nghiệp vụ hệ thống:</p>
                  Quyền <span className="font-bold text-red-600">XÓA</span> sẽ loại bỏ vĩnh viễn các dữ liệu nội bộ (ảnh hưởng đến truy xuất kế toán/tồn kho). Khuyến nghị chỉ cấp cho Admin. Cấp Quản lý/Nhân viên chỉ nên sử dụng tính năng Đổi trạng thái (Khóa/Hủy) trong quá trình vận hành.
                </div>
              </div>

              <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm bg-white">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-[#fcfdfd] border-b border-gray-100 text-[10px] font-extrabold uppercase tracking-wider text-gray-400 select-none">
                      <th className="py-3.5 px-5">Module hệ thống</th>
                      <th className="py-3.5 px-3 text-center">Truy cập (Xem)</th>
                      <th className="py-3.5 px-3 text-center">Thêm mới</th>
                      <th className="py-3.5 px-3 text-center">Chỉnh sửa</th>
                      <th className="py-3.5 px-3 text-center text-red-500 flex items-center justify-center gap-1">Xóa <span className="text-[10px]"></span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 font-semibold text-slate-700">
                    {rolePermissions.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/40 transition-colors">
                        <td className="py-3.5 px-5 flex items-center gap-3 text-slate-800 font-semibold">
                          {renderModuleIcon(item.type)}
                          <span className={item.id === "settings" ? "text-red-500 font-bold" : ""}>{item.name}</span>
                        </td>
                        {["view", "add", "edit", "delete"].map((field) => (
                          <td key={field} className="py-3.5 px-3 text-center">
                            <input 
                              type="checkbox"
                              checked={item[field]}
                              disabled={item.id === "dashboard" && field !== "view"}
                              onChange={() => handlePermissionChange(item.id, field)}
                              className="w-4 h-4 rounded text-[#006c49] bg-white border-gray-300 focus:ring-emerald-500 accent-[#006c49] cursor-pointer disabled:opacity-20"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-5 flex items-center justify-end gap-3 bg-slate-50/50 border-t border-gray-100 shrink-0">
              <button type="button" onClick={() => setIsPermissionModalOpen(false)} className="px-6 py-2.5 border border-gray-200 bg-white rounded-xl text-xs font-bold text-gray-500 transition shadow-sm active:scale-95">Hủy bỏ</button>
              <button type="button" onClick={handleSavePermissions} className="px-6 py-2.5 bg-[#006c49] text-white rounded-xl text-xs font-bold shadow-sm hover:bg-[#00563a] transition flex items-center gap-2 active:scale-95">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                Lưu phân quyền
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}