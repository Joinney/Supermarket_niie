import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../../../../api/axios.js";
import {
  Users,
  Shield,
  Box,
  UserCheck,
  Download,
  UserPlus,
  ChevronRight,
  SlidersHorizontal,
  Eye,
  EyeOff,
  X,
  AlertTriangle,
  LayoutDashboard,
  ShoppingBag,
  ClipboardList,
  Warehouse,
  Lock,
  FileText,
  Check,
} from "lucide-react";

const DEFAULT_PRESETS = {
  ADMIN: [
    { id: "dashboard", view: true, add: true, edit: true, delete: true },
    { id: "products", view: true, add: true, edit: true, delete: true },
    { id: "orders", view: true, add: true, edit: true, delete: true },
    { id: "inventory", view: true, add: true, edit: true, delete: true },
    { id: "customers", view: true, add: true, edit: true, delete: true },
    { id: "settings", view: true, add: true, edit: true, delete: true },
  ],
  MANAGER: [
    { id: "dashboard", view: true, add: false, edit: false, delete: false },
    { id: "products", view: true, add: true, edit: true, delete: false },
    { id: "orders", view: true, add: true, edit: true, delete: false },
    { id: "inventory", view: true, add: true, edit: true, delete: false },
    { id: "customers", view: true, add: true, edit: true, delete: false },
    { id: "settings", view: false, add: false, edit: true, delete: false },
  ],
  STAFF: [
    { id: "dashboard", view: true, add: false, edit: false, delete: false },
    { id: "products", view: true, add: false, edit: false, delete: false },
    { id: "orders", view: true, add: true, edit: true, delete: false },
    { id: "inventory", view: true, add: true, edit: true, delete: false },
    { id: "customers", view: true, add: true, edit: false, delete: false },
    { id: "settings", view: false, add: false, edit: false, delete: false },
  ],
};

export default function Danhsachnoibo() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    admin: 0,
    manager: 0,
    staff: 0,
  });

  const [isModalOpen, setIsCollapsedModal] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("Tất cả Vai trò");
  const [statusFilter, setStatusFilter] = useState("Trạng thái");

  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "1234567890",
    role: "Staff (Nhân viên)",
    department: "",
    sendEmailNotification: true,
  });

  const [rolePermissions, setRolePermissions] = useState([
    {
      id: "dashboard",
      name: "Bảng điều khiển (Dashboard)",
      type: "dashboard",
      view: true,
      add: false,
      edit: false,
      delete: false,
    },
    {
      id: "products",
      name: "Danh sách sản phẩm",
      type: "products",
      view: true,
      add: true,
      edit: true,
      delete: true,
    },
    {
      id: "orders",
      name: "Đơn Hàng",
      type: "orders",
      view: true,
      add: true,
      edit: true,
      delete: true,
    },
    {
      id: "inventory",
      name: "Kho Hàng",
      type: "inventory",
      view: true,
      add: true,
      edit: true,
      delete: true,
    },
    {
      id: "customers",
      name: "Khách Hàng",
      type: "customers",
      view: true,
      add: true,
      edit: true,
      delete: true,
    },
    {
      id: "settings",
      name: "Tài khoản & Phân quyền",
      type: "settings",
      view: true,
      add: true,
      edit: true,
      delete: true,
    },
  ]);

  const [showPassword, setShowPassword] = useState(false);

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      const response = await authApi.get("/auth/internal/users");

      if (response.data && Array.isArray(response.data)) {
        const dataFromDB = response.data;
        setUsers(dataFromDB);

        const adminCount = dataFromDB.filter(
          (u) => u.role?.toUpperCase() === "ADMIN",
        ).length;
        const managerCount = dataFromDB.filter(
          (u) => u.role?.toUpperCase() === "MANAGER",
        ).length;
        const staffCount = dataFromDB.filter(
          (u) =>
            u.role?.toUpperCase() === "STAFF" ||
            u.role?.toUpperCase() === "USER",
        ).length;

        setStats({
          total: dataFromDB.length,
          admin: adminCount,
          manager: managerCount,
          staff: staffCount,
        });
      }
    } catch (err) {
      console.error("❌ Lỗi nạp CSDL nhân sự:", err);
      setError("Không thể tải danh sách tài khoản.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const handleApplyPreset = (presetKey) => {
    const formattedKey = String(presetKey).toUpperCase().split(" ")[0];
    const preset = DEFAULT_PRESETS[formattedKey];
    if (!preset) return;
    setRolePermissions((prev) =>
      prev.map((item) => {
        const targetPermission = preset.find((p) => p.id === item.id);
        return targetPermission ? { ...item, ...targetPermission } : item;
      }),
    );
  };

  const handleSelectAllPermissions = () => {
    setRolePermissions((prev) =>
      prev.map((item) => ({
        ...item,
        view: true,
        add: true,
        edit: true,
        delete: true,
      })),
    );
  };

  const handleClearAllPermissions = () => {
    setRolePermissions((prev) =>
      prev.map((item) => ({
        ...item,
        view: false,
        add: false,
        edit: false,
        delete: false,
      })),
    );
  };

  // 🌟 CẬP NHẬT: Thay thế toàn bộ SVG thô thành các icon vẽ sắc nét trong table phân quyền
  const renderModuleIcon = (type) => {
    const iconClass = "w-4 h-4 text-slate-400 stroke-[2.2]";
    switch (type) {
      case "dashboard":
        return <LayoutDashboard className={iconClass} />;
      case "products":
        return <ShoppingBag className={iconClass} />;
      case "orders":
        return <ClipboardList className={iconClass} />;
      case "inventory":
        return <Warehouse className={iconClass} />;
      case "customers":
        return <Users className={iconClass} />;
      case "settings":
        return <Lock className="w-4 h-4 text-red-400 stroke-[2.2]" />;
      default:
        return <FileText className={iconClass} />;
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handlePermissionChange = (moduleId, field) => {
    setRolePermissions((prev) =>
      prev.map((item) =>
        item.id === moduleId ? { ...item, [field]: !item[field] } : item,
      ),
    );
  };

  const handleSavePermissions = async () => {
    try {
      const targetId = selectedUser?.user_id || selectedUser?.id;

      if (!targetId) {
        alert("Lỗi: Không tìm thấy ID nhân sự để thực hiện lưu phân quyền.");
        return;
      }

      // Chuẩn hóa quyền về dạng boolean sạch sẽ
      const cleanPermissions = rolePermissions.map((item) => ({
        module: item.name,
        id: item.id,
        type: item.type,
        view: !!item.view,
        add: !!item.add,
        edit: !!item.edit,
        delete: !!item.delete,
      }));

      const payload = {
        role: selectedUser.role,
        fullName: selectedUser.name,
        avatarUrl: selectedUser.avatar_url,
        custom_permissions: cleanPermissions,
      };

      // ✅ Dùng authApi.put (Tự động trỏ đến /api/v1/auth/... và đính kèm Token)
      const response = await authApi.put(
        `/auth/internal/users/${targetId}`,
        payload,
      );

      if (response.status === 200 || response.data.success) {
        alert(
          `Hệ thống Demi Mart: Đã đồng bộ lưu ma trận phân quyền mới cho ${selectedUser.name} thành công!`,
        );

        // Cập nhật localStorage nếu admin đang sửa chính mình
        const adminInfo = JSON.parse(localStorage.getItem("adminInfo") || "{}");
        if (adminInfo.id === targetId || adminInfo.user_id === targetId) {
          adminInfo.custom_permissions = cleanPermissions;
          localStorage.setItem("adminInfo", JSON.stringify(adminInfo));
        }

        // Cập nhật State danh sách Users
        setUsers((prevUsers) =>
          prevUsers.map((u) =>
            u.user_id === targetId
              ? { ...u, custom_permissions: cleanPermissions }
              : u,
          ),
        );

        setIsPermissionModalOpen(false);
      }
    } catch (err) {
      console.error("❌ Lỗi kích hoạt gửi ma trận quyền:", err);
      alert(
        "Không thể truyền gói tin lưu phân quyền xuống Database (Lỗi kết nối v1).",
      );
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email) return;

    try {
      const rawRole = formData.role.split(" ")[0].toUpperCase();

      const dataToSend = new FormData();
      dataToSend.append("email", formData.email);
      dataToSend.append("password", formData.password);
      dataToSend.append("fullName", formData.fullName);
      dataToSend.append("role", rawRole);
      dataToSend.append(
        "department",
        formData.department || "Hệ thống Demi Mart",
      );

      if (avatarFile) {
        dataToSend.append("avatar", avatarFile);
      }

      await authApi.post("/signup", dataToSend);

      setIsCollapsedModal(false);
      setAvatarPreview("");
      setAvatarFile(null);
      setFormData({
        fullName: "",
        email: "",
        password: "1234567890",
        role: "Staff (Nhân viên)",
        department: "",
        sendEmailNotification: true,
      });
      fetchAllUsers();
    } catch (err) {
      console.error("Lỗi cấp tài khoản:", err);
      alert("Đăng ký nhân sự thất bại! Vui lòng kiểm tra lại kết nối.");
    }
  };

  const filteredUsers = users.filter((u) => {
    const nameMatch = (u.full_name || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const emailMatch = (u.email || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesSearch = nameMatch || emailMatch;

    const matchesRole =
      roleFilter === "Tất cả Vai trò" ||
      (u.role || "").toUpperCase() === roleFilter.toUpperCase();
    const matchesStatus =
      statusFilter === "Trạng thái" ||
      (statusFilter === "Hoạt động" &&
        (u.status || "").toLowerCase() === "active");
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleColors = (role) => {
    const r = String(role).toUpperCase();
    if (r === "ADMIN")
      return { class: "bg-red-50 text-red-500 border-red-100", label: "ADMIN" };
    if (r === "MANAGER")
      return {
        class: "bg-blue-50 text-blue-600 border-blue-100",
        label: "MANAGER",
      };
    return {
      class: "bg-slate-50 text-slate-600 border-slate-200",
      label: "STAFF",
    };
  };

  if (loading)
    return (
      <div className="p-8 text-center text-sm text-[#006c49] font-bold animate-pulse">
        🔌 Đang kết nối ma trận CSDL...
      </div>
    );

  return (
    <div className="w-full bg-[#fafafa] font-sans antialiased text-slate-800 text-left relative p-4 animate-fadeIn">
      {/* --- TIÊU ĐỀ & BUTTONS --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">
            Danh sách quản lý nội bộ
          </h1>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 mt-1 select-none">
            <Link
              to="/admin/dashboard/thongkesanpham"
              className="hover:text-slate-600 transition-colors"
            >
              Dashboard
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-300 stroke-[2.5]" />
            <span>Settings</span>
            <ChevronRight className="w-3 h-3 text-slate-300 stroke-[2.5]" />
            <span className="text-[#006c49]">Quản lý nội bộ</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <button className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 bg-white hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-600 transition shadow-sm cursor-pointer">
            <Download className="w-3.5 h-3.5 stroke-[2.2]" />
            <span>Xuất danh sách</span>
          </button>
          <button
            onClick={() => setIsCollapsedModal(true)}
            className="flex items-center gap-1.5 bg-[#006c49] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-[#00563a] transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4 stroke-[2.2]" />
            <span>Thêm nhân sự mới</span>
          </button>
        </div>
      </div>

      {/* --- THỐNG KÊ --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Tổng tài khoản
            </p>
            <p className="text-3xl font-black mt-1 text-gray-800">
              {stats.total}
            </p>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-[#006c49] rounded-xl flex items-center justify-center shadow-sm">
            <Users className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Admin (Quản trị)
            </p>
            <p className="text-3xl font-black mt-1 text-gray-800">
              {stats.admin}
            </p>
          </div>
          <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center shadow-sm">
            <Shield className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Quản lý (Manager)
            </p>
            <p className="text-3xl font-black mt-1 text-gray-800">
              {stats.manager}
            </p>
          </div>
          <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center shadow-sm">
            <Box className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Users (Nhân viên)
            </p>
            <p className="text-3xl font-black mt-1 text-gray-800">
              {stats.staff}
            </p>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center shadow-sm">
            <UserCheck className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>
      </div>

      {/* --- BỘ LỌC TÌM KIẾM --- */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 justify-between items-center border-b border-gray-50">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="Tất cả Vai trò">Tất cả Vai trò</option>
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="Staff">Staff</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="Trạng thái">Trạng thái</option>
              <option value="Hoạt động">Hoạt động</option>
            </select>
          </div>
          <input
            type="text"
            placeholder="Tìm theo tên, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-[320px] px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none"
          />
        </div>

        {/* --- BẢNG ĐỒNG BỘ --- */}
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse text-left min-w-[900px]">
            <thead>
              <tr className="bg-[#fcfdfd] border-b border-gray-100 text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                <th className="py-4 px-6">Tài khoản & Email</th>
                <th className="py-4 px-4 text-center">Vai trò (Role)</th>
                <th className="py-4 px-4">Khu vực / Phòng ban</th>
                <th className="py-4 px-4 text-center">Trạng thái</th>
                <th className="py-4 px-4">Đăng nhập cuối</th>
                <th className="py-4 px-6 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs font-semibold text-slate-600">
              {filteredUsers.map((user, idx) => {
                const roleMeta = getRoleColors(user.role);
                return (
                  <tr
                    key={user.user_id || idx}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt="Avatar"
                            className="w-9 h-9 rounded-full object-cover border border-emerald-100 shadow-sm"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-emerald-50 text-[#006c49] font-bold flex items-center justify-center border border-emerald-100 shadow-sm">
                            {(user.full_name || "NV")
                              .split(" ")
                              .pop()
                              .substring(0, 2)
                              .toUpperCase()}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">
                            {user.full_name || "Chưa cập nhật"}
                          </span>
                          <span className="text-[11px] text-gray-400 font-medium mt-0.5">
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 border rounded-md text-[10px] font-extrabold tracking-wide ${roleMeta.class}`}
                      >
                        {roleMeta.label}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-500 font-medium">
                      {user.address || "Hệ thống Demi Mart"}
                    </td>
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center justify-center w-20 mx-auto text-emerald-500 bg-emerald-50">
                        Hoạt động
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col text-left">
                        <span className="text-slate-700 font-bold">
                          {user.last_login ? (
                            (() => {
                              const d = new Date(user.last_login);
                              return d.toLocaleString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                                day: "2-digit",
                                month: "2-digit",
                              });
                            })()
                          ) : (
                            <span className="text-gray-400 font-normal italic">
                              Chưa đăng nhập
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium mt-0.5">
                          {user.last_login_device
                            ? user.last_login_device
                            : "Hệ thống Demi Mart"}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser({
                              user_id: user.user_id,
                              name: user.full_name,
                              role: roleMeta.label,
                              avatar_url: user.avatar_url,
                            });
                            setIsPermissionModalOpen(true);

                            if (user.custom_permissions) {
                              try {
                                const parsed =
                                  typeof user.custom_permissions === "string"
                                    ? JSON.parse(user.custom_permissions)
                                    : user.custom_permissions;

                                const filteredAndMapped = parsed
                                  .filter((p) => p.id !== "farm")
                                  .map((p) => {
                                    let finalName = p.name || p.module;
                                    if (p.id === "products")
                                      finalName = "Danh sách sản phẩm";
                                    if (p.id === "orders")
                                      finalName = "Đơn Hàng";
                                    if (p.id === "inventory")
                                      finalName = "Kho Hàng";
                                    if (p.id === "customers")
                                      finalName = "Khách Hàng";
                                    if (p.id === "settings")
                                      finalName = "Tài khoản & Phân quyền";
                                    return { ...p, name: finalName };
                                  });

                                setRolePermissions(filteredAndMapped);
                              } catch (e) {
                                console.error("Lỗi parse JSON quyền:", e);
                                handleApplyPreset(user.role);
                              }
                            } else {
                              handleApplyPreset(user.role);
                            }
                          }}
                          className="p-1.5 text-gray-400 hover:text-[#006c49] hover:bg-slate-100 rounded-lg transition flex items-center justify-center cursor-pointer"
                          title="Phân quyền chi tiết"
                        >
                          <SlidersHorizontal className="w-4 h-4 stroke-[2.2]" />
                        </button>

                        <button
                          onClick={() =>
                            navigate(
                              `/admin/settings/quanlynoibo/chitietnoibo/${user.user_id}`,
                            )
                          }
                          className="p-1.5 text-gray-400 hover:text-[#006c49] hover:bg-slate-100 rounded-lg transition flex items-center justify-center cursor-pointer"
                          title="Xem trang chi tiết"
                        >
                          <Eye className="w-4 h-4 stroke-[2.2]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL 1: CẤP TÀI KHOẢN NHÂN SỰ MỚI ================= */}
      {isModalOpen &&
        createPortal(
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[9999] flex items-center justify-center p-4 select-none animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-xl border border-gray-100 overflow-hidden transform transition-all duration-300">
              <div className="p-6 pb-4 flex items-center justify-between border-b border-gray-50">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">
                    Thêm nhân sự mới
                  </h3>
                  <p className="text-xs text-gray-400 font-medium mt-1">
                    Cấp tài khoản hệ thống và thiết lập phòng ban cho nhân sự
                    mới.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsCollapsedModal(false);
                    setAvatarPreview("");
                    setAvatarFile(null);
                  }}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition cursor-pointer"
                >
                  <X className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>

              <form
                onSubmit={handleCreateAccount}
                className="p-6 space-y-4 text-sm font-semibold text-slate-700"
              >
                <div className="flex items-center gap-4 bg-[#fafafa]/50 p-3 rounded-2xl border border-dashed border-gray-200">
                  <input
                    type="file"
                    id="modalAvatarInput"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        if (file.size > 2 * 1024 * 1024) {
                          alert("Kích thước ảnh không được vượt quá 2MB!");
                          return;
                        }
                        setAvatarFile(file);
                        setAvatarPreview(URL.createObjectURL(file));
                      }
                    }}
                  />

                  <div
                    onClick={() =>
                      document.getElementById("modalAvatarInput").click()
                    }
                    className="w-14 h-14 rounded-full border border-dashed border-gray-300 bg-white flex items-center justify-center text-gray-400 font-light text-xl cursor-pointer hover:bg-gray-50 overflow-hidden shrink-0 shadow-sm transition-all"
                  >
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      "+"
                    )}
                  </div>

                  <div className="flex flex-col text-left">
                    <span className="font-bold text-slate-800">
                      Ảnh đại diện (Avatar)
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium mt-0.5">
                      Định dạng JPG, PNG. Tối đa 2MB.
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        document.getElementById("modalAvatarInput").click()
                      }
                      className="text-xs text-emerald-600 font-bold mt-1 text-left w-max hover:underline cursor-pointer"
                    >
                      Tải ảnh lên
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs font-bold text-slate-700">
                    Họ và tên nhân viên <span className="text-red-500">*</span>
                  </label>
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
                    <label className="text-xs font-bold text-slate-700">
                      Địa chỉ Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="VD: email@demimart.vn"
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 font-medium transition"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 relative">
                    <label className="text-xs font-bold text-slate-700">
                      Mật khẩu mặc định <span className="text-red-500">*</span>
                    </label>
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
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-slate-600 flex items-center justify-center cursor-pointer p-1 rounded-md"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4 stroke-[2.2]" />
                        ) : (
                          <Eye className="w-4 h-4 stroke-[2.2]" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Vai trò (Role) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none bg-white font-bold text-slate-700 focus:border-emerald-500 cursor-pointer appearance-none"
                      >
                        <option>Staff (Nhân viên)</option>
                        <option>Manager (Quản lý)</option>
                        <option>Admin (Quản trị)</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none">
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 stroke-[3] rotate-90" />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Phòng ban
                    </label>
                    <div className="relative">
                      <select
                        name="department"
                        value={formData.department}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none bg-white font-medium focus:border-emerald-500 cursor-pointer text-gray-500 appearance-none"
                      >
                        <option value="">Chọn phòng ban...</option>
                        <option value="Ban Giám Đốc">Ban Giám Đốc</option>
                        <option value="Hệ Thống Bán Lẻ">Hệ Thống Bán Lẻ</option>
                        <option value="Kho & Tồn Kho">Kho & Tồn Kho</option>
                        <option value="Kế toán">Kế toán</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none">
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 stroke-[3] rotate-90" />
                      </div>
                    </div>
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
                  <label
                    htmlFor="sendEmailNotification"
                    className="text-xs text-slate-600 font-semibold cursor-pointer select-none"
                  >
                    Gửi thông tin đăng nhập (Email & Mật khẩu) qua email cho
                    nhân viên
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-50">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCollapsedModal(false);
                      setAvatarPreview("");
                      setAvatarFile(null);
                    }}
                    className="px-5 py-2.5 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-500 transition cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#006c49] text-white rounded-xl text-xs font-bold shadow-sm hover:bg-[#00563a] transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>+</span> Cấp tài khoản
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}

      {/* ================= MODAL 2: PHÂN QUYỀN CHI TIẾT ================= */}
      {isPermissionModalOpen &&
        selectedUser &&
        createPortal(
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all max-h-[92vh] flex flex-col">
              <div className="p-6 pb-4 flex items-center justify-between border-b border-gray-100 shrink-0">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
                    Phân quyền chi tiết
                  </h3>
                  <p className="text-xs text-gray-400 font-medium mt-1">
                    Hệ thống tự động nhận diện quyền theo vai trò gốc. Sử dụng
                    các nút thao tác nhanh nếu muốn đặt lại.
                  </p>
                </div>
                <button
                  onClick={() => setIsPermissionModalOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-gray-400 hover:bg-slate-100 hover:text-gray-600 transition cursor-pointer"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4 text-sm">
                <div className="bg-slate-50/50 p-4 rounded-2xl border border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {selectedUser.avatar_url ? (
                        <img
                          src={selectedUser.avatar_url}
                          alt="Avatar"
                          className="w-11 h-11 rounded-full object-cover border border-emerald-100 shadow-sm"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-emerald-50 text-[#006c49] font-extrabold flex items-center justify-center border border-emerald-100 shadow-sm">
                          {(selectedUser.name || "NV")
                            .split(" ")
                            .pop()
                            .substring(0, 2)
                            .toUpperCase()}
                        </div>
                      )}

                      <div className="flex flex-col text-left">
                        <span className="font-bold text-slate-800 text-base">
                          {selectedUser.name}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs font-semibold text-gray-400 shrink-0">
                            Vai trò:
                          </span>
                          <span className="px-2 py-0.5 rounded font-extrabold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wider">
                            {selectedUser.role}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 lg:gap-2.5 self-start sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleApplyPreset(selectedUser.role)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-slate-700 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                      >
                        Chọn mặc định
                      </button>
                      <button
                        type="button"
                        onClick={handleSelectAllPermissions}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#006c49] border border-emerald-200 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                      >
                        Chọn tất cả
                      </button>
                      <button
                        type="button"
                        onClick={handleClearAllPermissions}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                      >
                        Xóa tất cả
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-[#fffbeb] border border-[#fef3c7] rounded-xl p-4 flex gap-3 text-left">
                  <AlertTriangle className="w-5 h-5 text-[#d97706] shrink-0 mt-0.5 stroke-[2.2]" />
                  <div className="text-xs leading-relaxed text-[#92400e] font-medium">
                    <p className="font-bold text-[#78350f] mb-0.5">
                      Lưu ý chuyên nghiệp vụ hệ thống:
                    </p>
                    Quyền <span className="font-bold text-red-600">XÓA</span> sẽ
                    loại bỏ vĩnh viễn các dữ liệu nội bộ (ảnh hưởng đến truy
                    xuất kế toán/tồn kho). Khuyến nghị chỉ cấp cho Admin. Cấp
                    Quản lý/Nhân viên chỉ nên sử dụng tính năng Đổi trạng thái
                    (Khóa/Hủy) trong quá trình vận hành.
                  </div>
                </div>

                <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm bg-white">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-[#fcfdfd] border-b border-gray-100 text-[10px] font-extrabold uppercase tracking-wider text-gray-400 select-none">
                        <th className="py-3.5 px-5">Module hệ thống</th>
                        <th className="py-3.5 px-3 text-center">
                          Truy cập (Xem)
                        </th>
                        <th className="py-3.5 px-3 text-center">Thêm mới</th>
                        <th className="py-3.5 px-3 text-center">Chỉnh sửa</th>
                        <th className="py-3.5 px-3 text-center text-red-500">
                          Xóa
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 font-semibold text-slate-700">
                      {rolePermissions.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-gray-50/40 transition-colors"
                        >
                          <td className="py-3.5 px-5 flex items-center gap-3 text-slate-800 font-semibold">
                            {renderModuleIcon(item.type)}
                            <span
                              className={
                                item.id === "settings"
                                  ? "text-red-500 font-bold"
                                  : ""
                              }
                            >
                              {item.name}
                            </span>
                          </td>
                          {["view", "add", "edit", "delete"].map((field) => (
                            <td key={field} className="py-3.5 px-3 text-center">
                              <input
                                type="checkbox"
                                checked={
                                  item[field] === true || item[field] === "true"
                                }
                                disabled={
                                  item.id === "dashboard" && field !== "view"
                                }
                                onChange={() =>
                                  handlePermissionChange(item.id, field)
                                }
                                className="w-4 h-4 rounded text-[#006c49] bg-white border-gray-300 focus:ring-emerald-500 accent-[#006c49] cursor-pointer"
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
                <button
                  type="button"
                  onClick={() => setIsPermissionModalOpen(false)}
                  className="px-6 py-2.5 border border-gray-200 bg-white rounded-xl text-xs font-bold text-gray-500 transition shadow-sm cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleSavePermissions}
                  className="px-6 py-2.5 bg-[#006c49] text-white rounded-xl text-xs font-bold shadow-sm hover:bg-[#00563a] transition flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Lưu phân quyền</span>
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
