import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function Danhsachnoibo() {
  // Trạng thái ẩn/hiện Modal Thêm tài khoản mới
  const [isModalOpen, setIsCollapsedModal] = useState(false);
  
  // Trạng thái ẩn/hiện Modal Phân quyền chi tiết (Mới tích hợp từ ảnh)
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  // Lưu tên user đang được phân quyền để hiển thị lên tiêu đề modal
  const [selectedUserPermission, setSelectedUserPermission] = useState("Trần Đức Huy");

  // Form state phục vụ cho dữ liệu tạo tài khoản mới
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "1234567890",
    role: "User (Nhân viên)",
    department: "",
    sendEmailNotification: true,
  });

  // Dữ liệu danh sách tài khoản nội bộ gốc từ image_668973.png
  const [users, setUsers] = useState([
    { name: "Lê Hồng Phong", email: "admin.phong@etechs.vn", role: "ADMIN", roleColor: "bg-red-50 text-red-500 border-red-100", department: "Ban Giám Đốc", status: "Hoạt động", statusColor: "text-emerald-500 bg-emerald-50", lastLogin: "Vừa xong", ip: "IP: 192.168.1.1", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60" },
    { name: "Trần Đức Huy", email: "huy.tran@etechs.vn", role: "QUẢN LÝ", roleColor: "bg-blue-50 text-blue-600 border-blue-100", department: "Kho & Nông Trại", status: "Hoạt động", statusColor: "text-emerald-500 bg-emerald-50", lastLogin: "2 giờ trước", ip: "Trình duyệt Chrome", avatar: "" },
    { name: "Phạm Mai Lan", email: "lan.pham@etechs.vn", role: "QUẢN LÝ", roleColor: "bg-blue-50 text-blue-600 border-blue-100", department: "Kinh doanh B2B", status: "Hoạt động", statusColor: "text-emerald-500 bg-emerald-50", lastLogin: "Hôm qua, 14:30", ip: "App Di động", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=60" },
    { name: "Nguyễn Đình Duy", email: "duy.nguyen@etechs.vn", role: "USER", roleColor: "bg-slate-50 text-slate-600 border-slate-200", department: "Nhân viên Kho", status: "Hoạt động", statusColor: "text-emerald-500 bg-emerald-50", lastLogin: "3 ngày trước", ip: "Máy quét mã vạch", avatar: "" },
    { name: "Đỗ Vạn Thành", email: "thanh.do@etechs.vn", role: "USER", roleColor: "bg-slate-50 text-slate-600 border-slate-200", department: "Kế toán", status: "Bị Khóa", statusColor: "text-orange-500 bg-amber-50", lastLogin: "Không có dữ liệu", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60" },
  ]);

  // Khởi tạo danh sách các module phân quyền chi tiết hệ thống
  const [permissions, setPermissions] = useState([
    { id: "dashboard", name: "Bảng điều khiển (Dashboard)", icon: "🏠", view: true, add: false, edit: false, delete: false },
    { id: "products", name: "Quản lý Sản phẩm & SKU", icon: "📦", view: true, add: true, edit: true, delete: true },
    { id: "farm", name: "Quản lý Nông trại & Mùa vụ", icon: "🌐", view: true, add: true, edit: true, delete: true },
    { id: "orders", name: "Quản lý Đơn hàng", icon: "🛍️", view: true, add: true, edit: true, delete: true },
    { id: "inventory", name: "Quản lý Tồn kho", icon: "📦", view: true, add: true, edit: true, delete: true },
    { id: "customers", name: "Quản lý Khách hàng", icon: "👥", view: true, add: true, edit: true, delete: true },
    { id: "settings", name: "Quản lý Phân quyền & Cài đặt", icon: "🛡️", view: true, add: true, edit: true, delete: true },
  ]);

  // Xử lý ẩn/hiện mật khẩu
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Thay đổi trạng thái checkbox phân quyền từng ô lẻ
  const handlePermissionChange = (moduleId, field) => {
    setPermissions(prev =>
      prev.map(item => (item.id === moduleId ? { ...item, [field]: !item[field] } : item))
    );
  };

  // Chọn tất cả quyền
  const handleSelectAllPermissions = () => {
    setPermissions(prev => prev.map(item => ({ ...item, view: true, add: true, edit: true, delete: true })));
  };

  // Bỏ chọn tất cả quyền
  const handleToggleClearAllPermissions = () => {
    setPermissions(prev => prev.map(item => ({ ...item, view: false, add: false, edit: false, delete: false })));
  };

  // Hàm xử lý lưu thông tin tài khoản mới gửi lên hệ thống
  const handleCreateAccount = (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email) return;

    const newUser = {
      name: formData.fullName,
      email: formData.email,
      role: formData.role.split(" ")[0].toUpperCase(),
      roleColor: formData.role.includes("ADMIN") ? "bg-red-50 text-red-500 border-red-100" : "bg-slate-50 text-slate-600 border-slate-200",
      department: formData.department || "Chưa xếp phòng",
      status: "Hoạt động",
      statusColor: "text-emerald-500 bg-emerald-50",
      lastLogin: "Không có dữ liệu",
      ip: "Tài khoản mới tạo",
      avatar: "",
    };

    setUsers([newUser, ...users]);
    setIsCollapsedModal(false); 
    setFormData({ fullName: "", email: "", password: "1234567890", role: "User (Nhân viên)", department: "", sendEmailNotification: true });
  };

  // Xử lý lưu dữ liệu phân quyền chi tiết
  const handleSavePermissions = () => {
    console.log("Đã lưu bộ phân quyền chi tiết của:", selectedUserPermission, permissions);
    setIsPermissionModalOpen(false);
  };

  return (
    <div className="w-full bg-[#fafafa] font-sans antialiased text-slate-800 text-left relative">
      
      {/* HEADER BREADCRUMB AREA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">Quản lý tài khoản nội bộ</h1>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 mt-1">
            <Link to="/admin/dashboard/thongkesanpham" className="hover:text-slate-600 transition-colors">Dashboard</Link>
            <span>❯</span>
            <span className="text-[#006c49]">Quản lý tài khoản nội bộ</span>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-600 transition shadow-sm">
            Xuất danh sách
          </button>
          <button 
            onClick={() => setIsCollapsedModal(true)}
            className="flex items-center gap-2 bg-[#006c49] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-[#00563a] active:scale-95 transition-all"
          >
            <span className="text-lg leading-none">+</span> Tạo tài khoản mới
          </button>
        </div>
      </div>

      {/* TOP STATS CARD GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 text-lg">👥</div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tổng tài khoản</p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">42</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-500 text-lg">🛡️</div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Admin (Quản trị)</p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">3</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 text-lg">💼</div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Quản lý (Manager)</p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">8</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 text-lg">👤</div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Users (Nhân viên)</p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">31</p>
          </div>
        </div>
      </div>

      {/* FILTER & CONTAINER TABLE BOX */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        
        {/* TOOLBAR CONTROLS */}
        <div className="p-4 sm:p-5 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center border-b border-gray-50">
          <div className="flex flex-wrap items-center gap-2.5">
            <select className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-600 outline-none cursor-pointer hover:bg-gray-50 transition">
              <option>Tất cả Vai trò</option>
            </select>
            <select className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-600 outline-none cursor-pointer hover:bg-gray-50 transition">
              <option>Trạng thái</option>
            </select>
          </div>

          <div className="relative flex-1 max-w-md">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Tìm theo tên, email..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#f8f9fa] border border-transparent rounded-xl text-sm outline-none focus:bg-white focus:border-gray-200 focus:ring-4 focus:ring-emerald-500/5 transition-all font-medium placeholder-gray-400"
            />
          </div>
        </div>

        {/* DATA TABLE */}
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
              {users.map((user, idx) => (
                <tr key={idx} className="hover:bg-gray-50/30 transition-colors">
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover border border-gray-100 shadow-sm shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center shrink-0 border border-blue-100 shadow-sm">
                          {user.name.split(" ").pop().substring(0,2).toUpperCase()}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                          {user.name} 
                          {user.role === "ADMIN" && <span className="text-blue-500 text-[10px]">✔</span>}
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
                      <span className="w-1 h-1 rounded-full mr-1.5 bg-current"></span>
                      {user.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-slate-700 font-bold">{user.lastLogin}</span>
                      <span className="text-[10px] text-gray-400 font-medium mt-0.5">{user.ip}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-center gap-3 text-gray-300">
                      <button className="hover:text-emerald-600 transition">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
                      </button>
                      
                      {/* Click vào Icon Phân quyền chi tiết này để mở Modal mới từ ảnh */}
                      <button 
                        onClick={() => {
                          setSelectedUserPermission(user.name);
                          setIsPermissionModalOpen(true);
                        }} 
                        className="hover:text-blue-500 transition"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /></svg>
                      </button>
                      
                      <button className={`${user.status === "Bị Khóa" ? "text-emerald-600 hover:text-emerald-700" : "hover:text-orange-500"} transition`}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FOOTER PAGINATION */}
        <div className="p-4 sm:p-5 flex justify-between items-center border-t border-gray-50 text-xs font-bold text-gray-400">
          <div><span className="text-slate-800">1</span> - 10 of 13 Pages</div>
          <div className="flex items-center gap-1.5">
            <button className="w-8 h-8 flex items-center justify-center border border-gray-100 rounded-xl hover:bg-gray-50 text-gray-400 transition">❮</button>
            <button className="w-8 h-8 flex items-center justify-center border border-gray-100 rounded-xl hover:bg-gray-50 text-gray-400 transition">❯</button>
          </div>
        </div>
      </div>

      {/* ================= MODAL: THÊM TÀI KHOẢN MỚI ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[999] flex items-center justify-center p-4 select-none animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-xl border border-gray-100 overflow-hidden transform transition-all duration-300">
            <div className="p-6 pb-4 flex items-center justify-between border-b border-gray-50">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Thêm tài khoản mới</h3>
                <p className="text-xs text-gray-400 font-medium mt-1">Điền thông tin để tạo tài khoản nhân viên mới trên hệ thống.</p>
              </div>
              <button 
                onClick={() => setIsCollapsedModal(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="p-6 space-y-4 text-sm font-semibold text-slate-700">
              <div className="flex items-center gap-4 bg-[#fafafa]/50 p-3 rounded-2xl border border-dashed border-gray-200">
                <div className="w-14 h-14 rounded-full border border-dashed border-gray-300 bg-white flex items-center justify-center text-gray-400 font-light text-xl cursor-pointer hover:bg-gray-50">
                  +
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-bold text-slate-800">Ảnh đại diện (Avatar)</span>
                  <span className="text-[10px] text-gray-400 font-medium mt-0.5">Định dạng JPG, PNG. Tối đa 2MB.</span>
                  <button type="button" className="text-xs text-emerald-600 font-bold mt-1 text-left w-max hover:underline">Tải ảnh lên</button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-bold text-slate-700">Họ và tên nhân viên <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="VD: Nguyễn Văn A" 
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 font-medium transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Địa chỉ Email <span className="text-red-500">*</span></label>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="VD: email@etechs.vn" 
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 font-medium transition"
                  />
                </div>
                <div className="flex flex-col gap-1.5 relative">
                  <label className="text-xs font-bold text-slate-700">Mật khẩu mặc định <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 font-medium transition pr-10"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-slate-600 text-xs"
                    >
                      {showPassword ? "🙈" : "👁"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Vai trò (Role) <span className="text-red-500">*</span></label>
                  <select 
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none bg-white font-medium focus:border-emerald-500 cursor-pointer"
                  >
                    <option>User (Nhân viên)</option>
                    <option>Quản lý (Manager)</option>
                    <option>Admin (Quản trị)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Phòng ban</label>
                  <select 
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none bg-white font-medium focus:border-emerald-500 cursor-pointer text-gray-500"
                  >
                    <option value="">Chọn phòng ban...</option>
                    <option value="Ban Giám Đốc">Ban Giám Đốc</option>
                    <option value="Kho & Nông Trại">Kho & Nông Trại</option>
                    <option value="Kinh doanh B2B">Kinh doanh B2B</option>
                    <option value="Kế toán">Kế toán</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 text-left">
                <input 
                  type="checkbox" 
                  id="sendEmailNotification"
                  name="sendEmailNotification"
                  checked={formData.sendEmailNotification}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-emerald-600 accent-emerald-600 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="sendEmailNotification" className="text-xs text-slate-600 font-semibold cursor-pointer select-none">
                  Gửi thông tin đăng nhập (Email & Mật khẩu) qua email cho nhân viên
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-50">
                <button 
                  type="button"
                  onClick={() => setIsCollapsedModal(false)}
                  className="px-5 py-2.5 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-500 transition"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 bg-[#006c49] text-white rounded-xl text-xs font-bold shadow-sm hover:bg-[#00563a] transition flex items-center gap-1.5"
                >
                  <span>+</span> Tạo tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL MỚI: PHÂN QUYỀN CHI TIẾT (TỪ ẢNH image_708584.png) ================= */}
      {isPermissionModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-[4px] z-[999] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-6 pb-4 flex items-center justify-between border-b border-gray-100 shrink-0">
              <div>
                <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Phân quyền chi tiết</h3>
                <p className="text-xs text-gray-400 font-medium mt-1">Thiết lập giới hạn truy cập trên từng module cho tài khoản này.</p>
              </div>
              <button 
                onClick={() => setIsPermissionModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-gray-400 hover:bg-slate-100 hover:text-gray-600 transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Body Scroll Area */}
            <div className="p-6 overflow-y-auto space-y-5 text-sm">
              
              {/* User Profile Info In Modal */}
              <div className="flex items-center justify-between bg-slate-50/60 p-4 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center border border-blue-200">
                    {selectedUserPermission.split(" ").pop().substring(0,2).toUpperCase()}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-extrabold text-slate-900 text-base">{selectedUserPermission}</span>
                    <span className="w-max px-2 py-0.5 rounded bg-red-50 text-red-500 font-black text-[9px] uppercase tracking-wide border border-red-100 mt-1">ADMIN</span>
                  </div>
                </div>
                
                {/* Nút bấm chọn nhanh */}
                <div className="flex items-center gap-2">
                  <button 
                    type="button" 
                    onClick={handleSelectAllPermissions}
                    className="px-4 py-2 border border-emerald-200 text-[#006c49] bg-emerald-50/30 rounded-xl text-xs font-bold hover:bg-emerald-50 transition"
                  >
                    Chọn tất cả
                  </button>
                  <button 
                    type="button" 
                    onClick={handleToggleClearAllPermissions}
                    className="px-4 py-2 border border-gray-200 text-gray-500 bg-white rounded-xl text-xs font-bold hover:bg-gray-50 transition"
                  >
                    Bỏ chọn tất cả
                  </button>
                </div>
              </div>

              {/* System Note Cảnh báo nghiệp vụ hệ thống */}
              <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 flex gap-3 text-left">
                <span className="text-amber-600 text-lg leading-none mt-0.5">⚠️</span>
                <div className="text-xs leading-relaxed text-amber-800 font-medium">
                  <p className="font-bold text-amber-900 mb-0.5">Lưu ý chuẩn nghiệp vụ hệ thống:</p>
                  Quyền <span className="text-red-600 font-bold">XÓA</span> sẽ loại bỏ vĩnh viễn dữ liệu vật lý (ảnh hưởng đến truy xuất kế toán/tồn kho). Khuyến nghị chỉ cấp cho Admin. Cấp Quản lý/Nhân viên chỉ nên sử dụng tính năng Đổi trạng thái (Khóa/Hủy) trong quá trình vận hành.
                </div>
              </div>

              {/* Bảng Danh sách Phân quyền Module */}
              <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm bg-white">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-100 text-[10px] font-black uppercase tracking-wider text-slate-400 select-none">
                      <th className="py-3.5 px-5">Module hệ thống</th>
                      <th className="py-3.5 px-3 text-center">Truy cập (Xem)</th>
                      <th className="py-3.5 px-3 text-center">Thêm mới</th>
                      <th className="py-3.5 px-3 text-center">Chỉnh sửa</th>
                      <th className="py-3.5 px-3 text-center text-red-500 flex items-center justify-center gap-1">
                        Xóa <span className="bg-red-100 text-red-600 rounded-full w-3.5 h-3.5 inline-flex items-center justify-center text-[9px] font-bold">!</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 font-bold text-slate-700">
                    {permissions.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                        {/* Tên Module */}
                        <td className="py-3.5 px-5 flex items-center gap-2.5 text-slate-800 font-semibold">
                          <span className="text-base text-gray-400">{item.icon}</span>
                          <span className={item.id === "settings" ? "text-red-500 font-bold" : ""}>{item.name}</span>
                        </td>
                        
                        {/* Checkbox Xem */}
                        <td className="py-3.5 px-3 text-center">
                          <input 
                            type="checkbox"
                            checked={item.view}
                            onChange={() => handlePermissionChange(item.id, "view")}
                            className="w-4 h-4 rounded text-emerald-600 bg-white border-gray-300 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                          />
                        </td>
                        
                        {/* Checkbox Thêm mới */}
                        <td className="py-3.5 px-3 text-center">
                          <input 
                            type="checkbox"
                            checked={item.add}
                            onChange={() => handlePermissionChange(item.id, "add")}
                            disabled={item.id === "dashboard"} // Dashboard không có Thêm/Sửa/Xóa giống ảnh mẫu
                            className="w-4 h-4 rounded text-emerald-600 bg-white border-gray-300 focus:ring-emerald-500 accent-emerald-600 cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
                          />
                        </td>
                        
                        {/* Checkbox Chỉnh sửa */}
                        <td className="py-3.5 px-3 text-center">
                          <input 
                            type="checkbox"
                            checked={item.edit}
                            onChange={() => handlePermissionChange(item.id, "edit")}
                            disabled={item.id === "dashboard"}
                            className="w-4 h-4 rounded text-emerald-600 bg-white border-gray-300 focus:ring-emerald-500 accent-emerald-600 cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
                          />
                        </td>
                        
                        {/* Checkbox Xóa */}
                        <td className="py-3.5 px-3 text-center">
                          <input 
                            type="checkbox"
                            checked={item.delete}
                            onChange={() => handlePermissionChange(item.id, "delete")}
                            disabled={item.id === "dashboard"}
                            className="w-4 h-4 rounded text-emerald-600 bg-white border-gray-300 focus:ring-emerald-500 accent-emerald-600 cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>

            {/* Modal Footer Hành động */}
            <div className="p-5 flex items-center justify-end gap-3 bg-slate-50/50 border-t border-gray-100 shrink-0">
              <button 
                type="button" 
                onClick={() => setIsPermissionModalOpen(false)}
                className="px-6 py-2.5 border border-gray-200 bg-white hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-500 transition shadow-sm"
              >
                Hủy bỏ
              </button>
              <button 
                type="button" 
                onClick={handleSavePermissions}
                className="px-6 py-2.5 bg-[#006c49] text-white rounded-xl text-xs font-bold shadow-sm hover:bg-[#00563a] transition flex items-center gap-1.5"
              >
                <span>✓</span> Lưu phân quyền
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}