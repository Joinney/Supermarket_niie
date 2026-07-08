import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// 🌟 ĐỒNG BỘ: Sử dụng instance authApi đã bọc sẵn Interceptor Token và nhận diện môi trường
import { authApi } from "../../../api/axios";

const Danhsachkhachhang = () => {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limit] = useState(10);

  const [selectedIds, setSelectedIds] = useState([]);

  // --- STATES PHỤC VỤ CHỈNH SỬA VÀ XÓA ---
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Cơ chế hoãn (Debounce) khi gõ tìm kiếm
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Hàm tải dữ liệu khách hàng Buyer via authApi
  const fetchBuyers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.get("/auth/buyers", {
        params: {
          page: currentPage,
          limit: limit,
          search: debouncedSearch || undefined,
        },
      });

      if (response.data && response.data.users) {
        setCustomers(response.data.users);
        setTotalPages(response.data.totalPages || 1);
        setTotalItems(response.data.totalItems || 0);
      } else {
        setCustomers([]);
      }
    } catch (err) {
      console.error("❌ Lỗi nạp danh sách khách hàng Buyer:", err);
      setError("Không thể kết nối với dịch vụ Demi Auth Service.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuyers();
  }, [currentPage, debouncedSearch]);

  // --- HÀM XỬ LÝ LỆNH LƯU CẬP NHẬT (EDIT) ---
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      await authApi.put(`/auth/internal/users/${editingUser.user_id}`, {
        full_name: editingUser.full_name,
        phone_number: editingUser.phone_number,
        gender: editingUser.gender,
        status: editingUser.status,
        role: "Buyer",
        avatar_url: editingUser.avatar_url,
        birthday: editingUser.birthday,
      });

      alert("Cập nhật thông tin khách hàng thành công! 🎉");
      setEditingUser(null);
      fetchBuyers();
    } catch (err) {
      console.error("❌ Lỗi khi cập nhật khách hàng:", err);
      alert(
        err.response?.data?.message ||
          "Không thể cập nhật thông tin khách hàng.",
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  // --- HÀM XỬ LÝ LỆNH XÓA TÀI KHOẢN (DELETE) ---
  const handleConfirmDelete = async () => {
    setSubmitLoading(true);
    try {
      await authApi.delete(`/auth/internal/users/${deletingUserId}`);
      alert("Đã xóa tài khoản khách hàng thành công. 🎉");
      setDeletingUserId(null);

      if (customers.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      } else {
        fetchBuyers();
      }
    } catch (err) {
      console.error("❌ Lỗi khi xóa khách hàng:", err);
      alert(
        err.response?.data?.message ||
          "Không thể thực hiện lệnh xóa tài khoản này.",
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(customers.map((c) => c.user_id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleRefresh = () => {
    setSearch("");
    setDebouncedSearch("");
    setCurrentPage(1);
    fetchBuyers();
  };

  const formatLastLogin = (dateString) => {
    if (!dateString)
      return (
        <span className="text-gray-300 italic font-normal text-xs">
          Chưa đăng nhập
        </span>
      );
    const date = new Date(dateString);
    return (
      <div className="font-mono text-xs">
        <p className="text-slate-700 font-bold">
          {date.toLocaleDateString("vi-VN")}
        </p>
        <p className="text-gray-400 text-[10px] mt-0.5">
          {date.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    );
  };

  // 🌟 HÀM TIỆN ÍCH QUYẾT ĐỊNH MÀU SẮC HUY HIỆU VIP
  const getTierBadgeStyle = (tier) => {
    const name = String(tier || "BẠC").toUpperCase();
    if (name === "KIM CƯƠNG")
      return "bg-indigo-50 text-indigo-600 border border-indigo-100";
    if (name === "VÀNG")
      return "bg-amber-50 text-amber-600 border border-amber-100";
    return "bg-slate-50 text-slate-500 border border-slate-200";
  };

  const handleViewDetail = (userId) => {
    navigate(`/admin/customers/list/Chitietkhachhang/${userId}`);
  };

  return (
    <div className="w-full min-h-screen bg-[#fafafa] font-sans text-gray-800 antialiased p-1 text-left relative">
      {/* Tiêu đề */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Danh sách khách hàng
          </h1>
          <nav className="text-sm text-gray-400 mt-1">
            Dashboard &gt;{" "}
            <span className="text-emerald-600 font-medium">
              Danh sách khách hàng
            </span>
          </nav>
        </div>
      </div>

      {/* Thanh công cụ tìm kiếm */}
      <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm khách hàng..."
              className="w-full pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none transition-all font-medium placeholder-gray-400 text-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
            />
            {/* 🔄 Thay thế icon kính lúp emoji 🔍 */}
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.604 10.604Z"
                />
              </svg>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="px-4 py-2 border border-gray-100 hover:bg-gray-50 bg-white rounded-xl text-xs font-bold text-gray-600 flex items-center gap-2 transition shadow-sm"
          >
            Làm mới
          </button>
        </div>
      </div>

      {/* BẢNG DỮ LIỆU */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-400 select-none">
                <th className="py-4 px-6 w-12 text-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                    onChange={handleSelectAll}
                    checked={
                      customers.length > 0 &&
                      selectedIds.length === customers.length
                    }
                  />
                </th>
                <th className="py-4 px-6">Khách hàng</th>
                <th className="py-4 px-6">Liên hệ (Email)</th>
                <th className="py-4 px-6 text-center">Số điện thoại</th>
                <th className="py-4 px-6 text-center">Giới tính</th>
                <th className="py-4 px-6 text-center">Hạng VIP</th>{" "}
                {/* 🌟 THÊM CỘT NÀY */}
                <th className="py-4 px-6 text-center">Lần cuối truy cập</th>
                <th className="py-4 px-6 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-semibold text-slate-600">
              {loading && (
                <tr>
                  {/* 🌟 CẬP NHẬT colSpan thành 8 */}
                  <td
                    colSpan="8"
                    className="py-8 text-center text-[#006c49] font-bold animate-pulse"
                  >
                    🔄 Đang nạp dữ liệu khách hàng Buyer từ hệ thống...
                  </td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td
                    colSpan="8"
                    className="py-8 text-center text-red-500 font-bold bg-red-50/50"
                  >
                    ⚠️ {error}
                  </td>
                </tr>
              )}

              {!loading && !error && customers.length === 0 && (
                <tr>
                  <td
                    colSpan="8"
                    className="py-8 text-center text-gray-400 italic"
                  >
                    Không có tài khoản khách hàng Buyer nào.
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                customers.map((row) => (
                  <tr
                    key={row.user_id}
                    className="hover:bg-slate-50/40 transition-colors"
                  >
                    <td className="py-4 px-6 text-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                        checked={selectedIds.includes(row.user_id)}
                        onChange={() => handleSelectRow(row.user_id)}
                      />
                    </td>

                    <td
                      className="py-4 px-6 cursor-pointer group"
                      onClick={() => handleViewDetail(row.user_id)}
                    >
                      <div className="flex items-center gap-3">
                        {row.avatar_url ? (
                          <img
                            src={row.avatar_url}
                            alt="avatar"
                            className="w-9 h-9 rounded-full object-cover border border-gray-100 shadow-sm"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center text-sm border border-emerald-100">
                            {(row.full_name || "K").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">
                            {row.full_name || "Chưa cập nhật"}
                          </div>
                          <div className="text-[10px] text-blue-500 font-mono mt-0.5">
                            ID: {row.user_id}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6 text-slate-600 font-medium font-mono text-xs">
                      {row.email}
                    </td>

                    <td className="py-4 px-6 text-center text-slate-600 font-medium font-mono text-xs">
                      {row.phone_number || (
                        <span className="text-gray-300 italic font-normal">
                          Trống
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-6 text-center text-gray-700 font-medium">
                      {row.gender === "Male" || row.gender === "Nam" ? (
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-xs font-bold">
                          Nam
                        </span>
                      ) : row.gender === "Female" || row.gender === "Nữ" ? (
                        <span className="px-2 py-0.5 rounded-md bg-pink-50 text-pink-600 text-xs font-bold">
                          Nữ
                        </span>
                      ) : (
                        <span className="text-gray-400 font-normal text-xs">
                          {row.gender || "Khác"}
                        </span>
                      )}
                    </td>

                    {/* 🌟 CỘT MỚI: HIỂN THỊ HẠNG THÀNH VIÊN */}
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded text-[10px] font-black inline-block border uppercase tracking-wide shadow-sm ${getTierBadgeStyle(row.membership_tier)}`}
                      >
                        {row.membership_tier || "BẠC"}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-center">
                      {formatLastLogin(row.last_login)}
                    </td>

                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => handleViewDetail(row.user_id)}
                          className="text-slate-400 hover:text-emerald-600 transition p-1.5 hover:bg-slate-50 rounded-lg"
                          title="Xem chi tiết khách hàng"
                        >
                          👁️
                        </button>

                        <button
                          onClick={() => setEditingUser({ ...row })}
                          className="text-slate-300 hover:text-amber-500 transition p-1.5 hover:bg-slate-50 rounded-lg"
                          title="Sửa thông tin"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.2}
                            stroke="currentColor"
                            className="w-5 h-5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                            />
                          </svg>
                        </button>

                        <button
                          onClick={() => setDeletingUserId(row.user_id)}
                          className="text-slate-300 hover:text-rose-500 transition p-1.5 hover:bg-slate-50 rounded-lg"
                          title="Xóa tài khoản"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.2}
                            stroke="currentColor"
                            className="w-5 h-5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        <div className="p-4 bg-white border-t border-gray-50 flex items-center justify-between text-xs text-gray-400 font-bold flex-wrap gap-4 select-none">
          <div>
            Hiển thị{" "}
            <span className="text-slate-800">
              {customers.length > 0 ? (currentPage - 1) * limit + 1 : 0}
            </span>{" "}
            -{" "}
            <span className="text-slate-800">
              {Math.min(currentPage * limit, totalItems)}
            </span>{" "}
            trên tổng số <span className="text-slate-800">{totalItems}</span>{" "}
            khách hàng
          </div>
          <div className="flex items-center gap-4 text-gray-500">
            <div className="flex items-center gap-2">
              <span>Trang:</span>
              <select
                value={currentPage}
                onChange={(e) => setCurrentPage(Number(e.target.value))}
                className="border border-gray-200 rounded-xl px-2 py-1 bg-gray-50 text-slate-700 font-bold outline-none cursor-pointer"
              >
                {Array.from({ length: totalPages }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="p-1.5 border border-gray-100 rounded-xl disabled:opacity-30"
              >
                ❮
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="p-1.5 border border-gray-100 rounded-xl disabled:opacity-30"
              >
                ❯
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- MODAL CHỈNH SỬA THÔNG TIN KHÁCH HÀNG ---------------- */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-md w-full p-6 animate-scaleUp text-left">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-4">
              {/* 🔄 Thay thế icon bút viết emoji 📝 */}
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-4 h-4 text-emerald-600"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
                  />
                </svg>
                Cập nhật thông tin khách hàng
              </h3>
              {/* 🔄 Thay thế icon nút hủy đóng emoji ✕ */}
              <button
                onClick={() => setEditingUser(null)}
                className="text-gray-400 hover:text-gray-600 flex items-center justify-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider">
                  Họ và tên
                </label>
                <input
                  type="text"
                  required
                  value={editingUser.full_name || ""}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      full_name: e.target.value,
                    })
                  }
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border rounded-lg text-xs font-bold outline-none focus:bg-white focus:border-emerald-500 text-slate-800"
                />
              </div>

              <div>
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider">
                  Số điện thoại
                </label>
                <input
                  type="text"
                  value={editingUser.phone_number || ""}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      phone_number: e.target.value,
                    })
                  }
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border rounded-lg text-xs font-bold outline-none focus:bg-white focus:border-emerald-500 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider">
                    Giới tính
                  </label>
                  <select
                    value={editingUser.gender || "Nam"}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, gender: e.target.value })
                    }
                    className="w-full mt-1 px-2 py-2 bg-slate-50 border rounded-lg text-xs font-bold outline-none cursor-pointer"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider">
                    Trạng thái
                  </label>
                  <select
                    value={editingUser.status || "active"}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, status: e.target.value })
                    }
                    className="w-full mt-1 px-2 py-2 bg-slate-50 border rounded-lg text-xs font-bold outline-none cursor-pointer"
                  >
                    <option value="active">Hoạt động</option>
                    <option value="locked">Khóa</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-4 py-2 bg-[#006c49] text-white rounded-xl text-xs font-bold hover:bg-[#005137] disabled:opacity-50"
                >
                  {submitLoading ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- MODAL XÁC NHẬN XÓA TÀI KHOẢN KHÁCH HÀNG ---------------- */}
      {deletingUserId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-sm w-full p-6 animate-scaleUp text-center">
            {/* 🔄 Thay thế icon cảnh báo tam giác emoji ⚠️ */}
            <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.008v.008H12v-.008Z"
                />
              </svg>
            </div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
              Xác nhận xóa tài khoản
            </h3>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản khách hàng này khỏi
              hệ thống Demi Mart? Hành động này không thể hoàn tác.
            </p>

            <div className="pt-4 mt-4 flex justify-center gap-3 border-t border-gray-50">
              <button
                type="button"
                onClick={() => setDeletingUserId(null)}
                className="px-4 py-2 border rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={submitLoading}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 shadow-sm disabled:opacity-50"
              >
                {submitLoading ? "Đang xóa..." : "Đồng ý xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Danhsachkhachhang;
