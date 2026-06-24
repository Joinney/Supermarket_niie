import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";

export default function Chitietnoibo() {
  // 🎯 FIX AN TOÀN TUYỆT ĐỐI: Bốc linh hoạt mọi biến thể đặt tên trên cấu hình Route
  const params = useParams();
  const id = params.id || params.user_id || params.userId; 
  
  const navigate = useNavigate();
  const location = useLocation();

  // 1. STATE QUẢN LÝ ĐỒNG BỘ CSDL THẬT
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Dữ liệu Nhân sự nội bộ map khớp 100% các cột của bảng public.users
  const [userInfo, setUserInfo] = useState({
    userId: "",
    username: "",
    email: "",
    fullName: "",
    phoneNumber: "",
    address: "",
    gender: "",
    birthday: "",
    role: "Staff",
    status: "active",
    avatarUrl: ""
  });

  // Ma trận phân quyền hệ thống (Giữ nguyên nghiệp vụ Enterprise)
  const [matrixPermissions, setMatrixPermissions] = useState([
    { id: "dashboard", name: "Bảng điều khiển (Dashboard)", type: "dashboard", view: true, add: false, edit: false, delete: false, approve: false },
    { id: "products", name: "Quản lý Sản phẩm & SKU", type: "products", view: false, add: false, edit: false, delete: false, approve: false },
    { id: "farm", name: "Quản lý Nông trại & Mùa vụ", type: "farm", view: false, add: false, edit: false, delete: false, approve: false },
    { id: "orders", name: "Quản lý Đơn hàng", type: "orders", view: false, add: false, edit: false, delete: false, approve: false },
    { id: "inventory", name: "Quản lý Tồn kho", type: "inventory", view: false, add: false, edit: false, delete: false, approve: false },
    { id: "customers", name: "Quản lý Khách hàng", type: "customers", view: false, add: false, edit: false, delete: false, approve: false },
    { id: "settings", name: "Cấu hình Hệ thống", type: "settings", view: false, add: false, edit: false, delete: false, approve: false },
  ]);

  // Danh sách đồng nghiệp cùng nhóm quyền tải động từ DB
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // =========================================================================
  // 📥 TIẾN TRÌNH LẤY DỮ LIỆU THẬT TỪ BẢNG PUBLIC.USERS
  // =========================================================================
  const fetchUserData = async () => {
    setLoading(true);
    setError("");
    try {
      const apiUrl = import.meta.env.VITE_API_USER_URL || "http://localhost:5001";
      // Ưu tiên targetId từ URL params bốc được, phòng hờ fallback sang state truyền trang
      const targetId = id || (location.state?.user?.user_id ? String(location.state.user.user_id) : null) || location.state?.user?.id || "1";

      console.log("🎯 ID nhân sự thực tế đang được gọi lên API:", targetId);

      // Khớp nối gọi API lấy thông tin chi tiết user và đồng nghiệp cùng vai trò
      const [userRes, groupRes] = await Promise.all([
        axios.get(`${apiUrl}/api/auth/internal/users/${targetId}`),
        axios.get(`${apiUrl}/api/auth/internal/users/role-group/${targetId}`)
      ]);

      if (userRes.data) {
        const dbUser = userRes.data;
        console.log("👉 Dữ liệu thô từ API Users:", dbUser);

        setUserInfo({
          userId: dbUser.user_id !== undefined ? dbUser.user_id : dbUser.userId,
          username: dbUser.username || "",
          email: dbUser.email || "",
          fullName: dbUser.full_name !== undefined ? dbUser.full_name : dbUser.fullName || "",
          phoneNumber: dbUser.phone_number !== undefined ? dbUser.phone_number : dbUser.phoneNumber || "",
          address: dbUser.address || "",
          gender: dbUser.gender || "Nam",
          birthday: dbUser.birthday ? dbUser.birthday.substring(0, 10) : "",
          role: dbUser.role || "Staff",
          status: dbUser.status || "active",
          avatarUrl: dbUser.avatar_url !== undefined ? dbUser.avatar_url : dbUser.avatarUrl || ""
        });

        if (dbUser.custom_permissions) {
          setMatrixPermissions(dbUser.custom_permissions);
        }
      }

      if (groupRes.data && Array.isArray(groupRes.data)) {
        setAssignedUsers(groupRes.data.map(item => ({
          name: item.full_name || item.username,
          department: item.address || "Hệ thống Demi Mart",
          avatar: item.avatar_url || "",
          initial: (item.full_name || "NV").split(" ").pop().substring(0, 2).toUpperCase()
        })));
      }
    } catch (err) {
      console.error("Lỗi đồng bộ dữ liệu người dùng thật:", err);
      setError("Đang chạy ở chế độ kết nối nội bộ hoặc chưa mở cổng API Gateway.");
    } finally {
      setLoading(false);
    }
  };

  // 🎯 FIX DEPDENDENCY: Lắng nghe chính xác sự thay đổi của biến id bốc từ params
  useEffect(() => {
    fetchUserData();
  }, [id, location.pathname]);

  // =========================================================================
  // 💾 TIẾN TRÌNH CẬP NHẬT DỮ LIỆU XUỐNG BẢNG PUBLIC.USERS
  // =========================================================================
  const handleSaveChanges = async () => {
    setSubmitting(true);
    try {
      const apiUrl = import.meta.env.VITE_API_USER_URL || "http://localhost:5001";
      const targetId = userInfo.userId || id || "1";

      const payload = {
        full_name: userInfo.fullName,
        phone_number: userInfo.phoneNumber,
        address: userInfo.address,
        gender: userInfo.gender,
        birthday: userInfo.birthday,
        role: userInfo.role,
        status: userInfo.status,
        avatar_url: userInfo.avatarUrl,
        custom_permissions: matrixPermissions 
      };

      await axios.put(`${apiUrl}/api/auth/internal/users/${targetId}`, payload);
      
      setIsEditing(false);
      alert("Hệ thống Demi Mart: Đã đồng bộ cập nhật xuống PostgreSQL thành công!");
      
      fetchUserData();
    } catch (err) {
      console.error("Lỗi ghi đè CSDL:", err);
      alert("Lỗi ghi dữ liệu! Vui lòng kiểm tra log API.");
      setIsEditing(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckboxChange = (id, field) => {
    if (!isEditing) return;
    setMatrixPermissions(prev =>
      prev.map(item => (item.id === id ? { ...item, [field]: !item[field] } : item))
    );
  };

  const filteredAssignedUsers = assignedUsers.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderModuleIcon = (type) => {
    const iconClass = "w-[18px] h-[18px] text-slate-500/80 shrink-0";
    switch (type) {
      case "dashboard": return <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>;
      case "products": return <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>;
      case "farm": return <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>;
      case "orders": return <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2-2V6.75a2.25 2.25 0 0 0-2-2h-2.25m-3 0H7.5a2.25 2.25 0 0 0-2 2v12a2.25 2.25 0 0 0 2 2h2.25m3.75-16.5a1.5 1.5 0 0 0-3 0v1.5a1.5 1.5 0 0 0 3 0v-1.5Z" /></svg>;
      case "inventory": return <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6"><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-5.25v9" /></svg>;
      case "customers": return <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.265 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>;
      case "settings": return <svg className="w-[18px] h-[18px] text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 3v6m0 4v8M4 9h4M12 3v2m0 4v12M10 5h4M18 3v10m0 4v4M16 13h4" /></svg>;
      default: return null;
    }
  };

  if (loading) return <div className="p-8 text-center text-sm text-[#006c49] font-bold animate-pulse">🔌 Đang tải hồ sơ nhân sự...</div>;

  return (
    <div className="w-full bg-[#fafafa] font-sans antialiased text-slate-800 text-left p-1 relative">
      
      <div className="absolute top-2 right-4 text-[10px] font-bold text-gray-400">
        {submitting ? "⏳ Đồng bộ Database..." : `🆔 Mã số: ${userInfo.userId || "Đang tải"}`}
      </div>

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[26px] font-bold text-slate-800 tracking-tight">
            Quản trị hồ sơ: {userInfo.fullName || "Loading..."}
          </h1>
          <div className="flex items-center gap-2 text-xs font-medium text-gray-400 mt-1.5">
            <span>Hệ thống quản trị</span><span>❯</span><span>Quản lý nội bộ</span><span>❯</span><span className="text-[#006c49] font-semibold">Chi tiết nhân sự</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <button
            onClick={() => navigate("/admin/settings/quanlynoibo/danhsachnoibo")}
            className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-600 transition shadow-sm"
          >
            <span>↩</span> Trở về danh sách
          </button>
          
          {isEditing ? (
            <button
              onClick={handleSaveChanges}
              disabled={submitting}
              className="flex items-center gap-1.5 bg-[#22c55e] hover:bg-emerald-600 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0Z" />
              </svg>
              {submitting ? "Đang đẩy lên..." : "Lưu vào DB"}
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 bg-[#006c49] hover:bg-[#00563a] text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
              </svg>
              Sửa đổi thông tin
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* CỘT TRÁI (CHIẾM 2 PHẦN) */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <svg className="w-[18px] h-[18px] text-[#006c49]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 111.063.852l-.708 2.836a.75.75 0 001.063.852l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0Zm-9-3.75h.008v.008H12V8.25Z" /></svg>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Thông tin hồ sơ nhân viên (`public.users`)</h3>
            </div>

            <div className="flex items-center gap-4">
              {/* 🎯 FIX AVATAR ĐỘNG THEO USER_ID ĐÚNG NGHĨA */}
              {userInfo.avatarUrl ? (
                <img src={userInfo.avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full object-cover border border-emerald-100 shadow-sm bg-slate-50" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-[#006c49] font-black text-xl flex items-center justify-center border border-emerald-100 shadow-sm">
                  {(userInfo.fullName || "NV").split(" ").pop().substring(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <h4 className="text-base font-bold text-slate-800 uppercase">{userInfo.fullName || "Đang kết nối..."}</h4>
                <p className="text-xs text-gray-400 mt-0.5">Vai trò hệ thống: <strong className="text-[#006c49] uppercase font-mono">{userInfo.role}</strong></p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Họ và Tên (`full_name`)</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={userInfo.fullName}
                  onChange={(e) => setUserInfo({ ...userInfo, fullName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white disabled:bg-gray-50/50 text-sm font-bold border border-gray-200 rounded-xl outline-none focus:border-emerald-500 transition text-slate-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tên tài khoản (`username`)</label>
                <input
                  type="text"
                  disabled
                  value={userInfo.username}
                  className="w-full px-4 py-2.5 bg-gray-50 text-sm font-mono font-bold border border-gray-200 rounded-xl text-slate-500 cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Thư điện tử (`email`)</label>
                <input
                  type="email"
                  disabled
                  value={userInfo.email}
                  className="w-full px-4 py-2.5 bg-gray-50 text-sm font-bold border border-gray-200 rounded-xl text-slate-500 cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Số điện thoại (`phone_number`)</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={userInfo.phoneNumber}
                  onChange={(e) => setUserInfo({ ...userInfo, phoneNumber: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white disabled:bg-gray-50/50 text-sm font-bold border border-gray-200 rounded-xl outline-none focus:border-emerald-500 transition text-slate-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Giới tính (`gender`)</label>
                <select
                  disabled={!isEditing}
                  value={userInfo.gender}
                  onChange={(e) => setUserInfo({ ...userInfo, gender: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white disabled:bg-gray-50/50 text-sm font-bold border border-gray-200 rounded-xl outline-none focus:border-emerald-500 transition text-slate-800"
                >
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ngày sinh (`birthday`)</label>
                <input
                  type="date"
                  disabled={!isEditing}
                  value={userInfo.birthday}
                  onChange={(e) => setUserInfo({ ...userInfo, birthday: e.target.value })}
                  className="w-full px-4 py-2 bg-white disabled:bg-gray-50/50 text-sm font-bold border border-gray-200 rounded-xl outline-none focus:border-emerald-500 transition text-slate-800"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Địa chỉ liên hệ (`address`)</label>
              <textarea
                rows="2"
                disabled={!isEditing}
                value={userInfo.address}
                onChange={(e) => setUserInfo({ ...userInfo, address: e.target.value })}
                className="w-full px-4 py-3 bg-white disabled:bg-gray-50/50 text-xs font-semibold border border-gray-200 rounded-xl outline-none focus:border-emerald-500 transition text-gray-700 leading-relaxed resize-none"
              />
            </div>
          </div>

          {/* MA TRẬN PHÂN QUYỀN HỆ THỐNG */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <svg className="w-[18px] h-[18px] text-[#006c49]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.745 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 0121 12Z" /></svg>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Live Permission Matrix</h3>
            </div>

            <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm bg-white">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-100 text-[10px] font-extrabold uppercase tracking-wider text-gray-400 select-none">
                    <th className="py-3 px-5 w-1/2 text-left">Mô-đun chức năng</th>
                    <th className="py-3 px-2 text-center">Xem</th>
                    <th className="py-3 px-2 text-center">Thêm</th>
                    <th className="py-3 px-2 text-center">Sửa</th>
                    <th className="py-3 px-2 text-center">Xóa</th>
                    <th className="py-3 px-2 text-center">Duyệt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-bold text-slate-700">
                  {matrixPermissions.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="py-4 px-5 flex items-center gap-3 text-slate-800 font-extrabold">
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

        {/* CỘT PHẢI (CHIẾM 1 PHẦN) */}
        <div className="space-y-6">
          
          {/* WIDGET NHÂN SỰ CÙNG NHÓM QUYỀN */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-50 pb-3">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                <span>Nhân sự cùng nhóm ({userInfo.role})</span>
              </h4>
              <span className="bg-emerald-50 text-[#006c49] font-black px-2 py-0.5 rounded-full text-[10px]">
                {assignedUsers.length}
              </span>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Tìm đồng nghiệp..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-transparent rounded-xl text-xs outline-none focus:bg-white focus:border-gray-200 transition-all font-bold"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.636z" /></svg>
            </div>

            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
              {filteredAssignedUsers.map((u, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl border border-gray-50 bg-slate-50/40">
                  <div className="flex items-center gap-2.5">
                    {u.avatar ? (
                      <img src={u.avatar} alt="" className="w-8 h-8 rounded-full object-cover border border-gray-100 bg-white" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-black text-[10px] flex items-center justify-center border border-blue-100">
                        {u.initial}
                      </div>
                    )}
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-black text-slate-800">{u.name}</span>
                      <span className="text-[10px] text-gray-400 font-semibold mt-0.5 max-w-[150px] truncate" title={u.department}>{u.department}</span>
                    </div>
                  </div>
                </div>
              ))}
              {filteredAssignedUsers.length === 0 && (
                <p className="text-[11px] text-gray-400 italic text-center py-4">Không tìm thấy tài khoản cùng vai trò</p>
              )}
            </div>
          </div>

          {/* TRẠNG THÁI VẬN HÀNH TÀI KHOẢN */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div className="text-left">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Trạng thái vận hành (`status`)</span>
              <span className={`font-black text-sm tracking-wide mt-1 flex items-center gap-1.5 uppercase font-mono ${
                userInfo.status === "active" ? "text-emerald-500" : "text-amber-500"
              }`}>
                <span className={`w-2 h-2 rounded-full ${userInfo.status === "active" ? "bg-emerald-500 animate-pulse" : "bg-amber-400"}`}></span>
                {userInfo.status}
              </span>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border shadow-inner ${
              userInfo.status === "active" ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-amber-50 border-amber-100 text-amber-600"
            }`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}