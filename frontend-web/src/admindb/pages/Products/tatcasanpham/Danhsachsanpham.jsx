import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function ProductList() {
  const navigate = useNavigate();
  const apiUrl =
    import.meta.env.VITE_API_PRODUCT_URL || "http://localhost:5002";

  // 1. State lưu trữ dữ liệu từ Backend
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [countries, setCountries] = useState([]);

  // 2. State Phân trang (Pagination)
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // 3. State Tìm kiếm (Debounced Search)
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");

  // 🌟 4. STATE BỘ LỌC ĐÃ ĐƯỢC CẬP NHẬT
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    sort: "newest", // newest, oldest, price_desc, price_asc
    market: "all", // all, VN, US, CN
    type: "all", // 🌟 all, single (Đơn), group (Nhóm)
  });

  // Bộ đếm Debounce: Ngừng gõ 500ms mới bắn request lên server
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // =========================================================================
  // 🚀 HÀM GỌI API LẤY DANH SÁCH & TÌM KIẾM
  // =========================================================================
  const fetchProducts = async () => {
    setLoading(true);
    setError("");

    try {
      let response;

      const queryParams = {
        page,
        limit,
        sort: filters.sort,
        market: filters.market !== "all" ? filters.market : undefined,
        type: filters.type !== "all" ? filters.type : undefined,
      };

      if (debouncedTerm.trim() !== "") {
        response = await axios.get(`${apiUrl}/api/products/search`, {
          params: { keyword: debouncedTerm, ...queryParams },
        });

        if (response.data) {
          setProducts(response.data);
          setTotalItems(response.data.length);
          setTotalPages(1);
        }
      } else {
        response = await axios.get(`${apiUrl}/api/products`, {
          params: queryParams,
        });

        if (response.data?.products) {
          setProducts(response.data.products);
          setTotalPages(response.data.totalPages);
          setTotalItems(response.data.totalItems);
        }
      }
    } catch (err) {
      console.error("Lỗi tải sản phẩm:", err);
      setError("Sự cố khi nạp danh sách sản phẩm từ máy chủ!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, limit, debouncedTerm, filters]);

  // =========================================================================
  // 🛠️ HÀM THAO TÁC (ACTIONS)
  // =========================================================================
  const handleRefresh = () => {
    setSearchTerm("");
    setPage(1);
    setFilters({ sort: "newest", market: "all", type: "all" });
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleDelete = async (id, name) => {
    if (
      window.confirm(
        `⚠️ Bạn có chắc chắn muốn xóa vĩnh viễn "${name}" (Mã: ${id})?\n\nHành động này sẽ xóa dữ liệu khỏi Database và không thể hoàn tác!`,
      )
    ) {
      try {
        await axios.delete(`${apiUrl}/api/products/${id}`);
        setProducts(products.filter((p) => p.ma_san_pham !== id));
        setTotalItems((prev) => prev - 1);
        alert(`✅ Đã xóa vĩnh viễn sản phẩm: ${name}`);
      } catch (err) {
        const errorMsg =
          err.response?.data?.message || err.message || "Lỗi không xác định";
        alert("❌ Xóa thất bại!\n\nLỗi từ Database: " + errorMsg);
      }
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await axios.put(`${apiUrl}/api/products/${id}/toggle-status`);
      setProducts(
        products.map((p) =>
          p.ma_san_pham === id ? { ...p, trang_thai: !currentStatus } : p,
        ),
      );
    } catch (error) {
      alert("❌ Lỗi khi thay đổi trạng thái sản phẩm!");
    }
  };

  const formatPrice = (price) => {
    return Number(price || 0).toLocaleString("vi-VN") + " đ";
  };

  const startItem = totalItems === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalItems);

  useEffect(() => {
    const fetchNations = async () => {
      try {
        const res = await axios.get(`${apiUrl}/api/nations`);
        setCountries(res.data.data || []);
      } catch (err) {
        console.error("Lỗi lấy danh sách quốc gia:", err);
      }
    };
    fetchNations();
  }, [apiUrl]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex-1 bg-[#f8f9fa] min-h-screen p-6 md:p-8 font-sans text-left"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            Danh sách sản phẩm
          </h1>
          <div className="flex items-center gap-2 text-sm text-gray-400 mt-1 font-medium">
            <span>Dashboard</span>
            <span>❯</span>
            <span className="text-[#006c49] font-semibold">
              Danh sách sản phẩm
            </span>
          </div>
        </div>

        <button
          onClick={() => navigate("/admin/products/create")}
          className="flex items-center justify-center gap-2 bg-[#006c49] hover:bg-[#00563a] text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md transition active:scale-95 shrink-0"
        >
          <span className="text-base font-black">+</span> Thêm mới
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 relative">
        {loading && (
          <div className="absolute top-2 right-6 text-xs font-bold text-[#006c49] flex items-center gap-1.5 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-[#006c49]"></span> Đang
            đồng bộ DB...
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold text-center">
            {error}
          </div>
        )}

        {/* THANH ĐIỀU KHIỂN: SEARCH & ACTIONS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Nhập tên hoặc mã sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 placeholder-gray-400 outline-none focus:bg-white focus:border-[#006c49] transition"
            />
            <span className="absolute right-3.5 top-2.5 text-gray-400">
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
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-emerald-50 hover:text-[#006c49] hover:border-emerald-200 transition"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-3.5 h-3.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                />
              </svg>
              Làm mới
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3.5 py-2 border rounded-xl text-xs font-bold transition ${showFilters ? "bg-[#006c49] text-white border-[#006c49]" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-3.5 h-3.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"
                />
              </svg>
              Bộ lọc {showFilters ? "▲" : "▼"}
            </button>
          </div>
        </div>

        {/* 🌟 KHU VỰC BỘ LỌC MỞ RỘNG */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">
                    Sắp xếp theo
                  </label>
                  <select
                    value={filters.sort}
                    onChange={(e) => handleFilterChange("sort", e.target.value)}
                    className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-[#006c49]"
                  >
                    <option value="newest">Sản phẩm mới nhất</option>
                    <option value="oldest">Sản phẩm cũ nhất</option>
                    <option value="price_desc">Giá cao nhất</option>
                    <option value="price_asc">Giá thấp nhất</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">
                    Thị trường quốc gia
                  </label>
                  <select
                    value={filters.market}
                    onChange={(e) =>
                      handleFilterChange("market", e.target.value)
                    }
                    className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-[#006c49]"
                  >
                    <option value="all">Tất cả thị trường</option>
                    {countries.map((c) => (
                      <option key={c.ma_quoc_gia} value={c.ma_quoc_gia}>
                        {c.bieu_tuong_co} {c.ten_quoc_gia}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">
                    Phân loại sản phẩm
                  </label>
                  <select
                    value={filters.type}
                    onChange={(e) => handleFilterChange("type", e.target.value)}
                    className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-[#006c49]"
                  >
                    <option value="all">Tất cả cấu trúc</option>
                    <option value="single">Chỉ Sản phẩm Đơn</option>
                    <option value="group">
                      Chỉ Sản phẩm Nhóm (Có biến thể)
                    </option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* BẢNG DỮ LIỆU SẢN PHẨM */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] font-extrabold text-gray-400 uppercase tracking-wider bg-white">
                <th className="py-3 px-4">Sản phẩm</th>
                <th className="py-3 px-4">Danh mục con</th>
                <th className="py-3 px-4 text-center">Phân loại</th>
                <th className="py-3 px-4 font-mono text-right">Giá bán</th>
                {/* 🌟 1. THÊM TIÊU ĐỀ KHO */}
                <th className="py-3 px-4 text-center">Kho</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right pr-6">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs font-bold text-gray-700">
              {products.map((item, index) => (
                <tr
                  key={item.ma_san_pham || index}
                  className="group hover:bg-emerald-50/30 transition"
                >
                  <td className="py-4 px-4 max-w-[280px]">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          item.hinh_anh_chinh ||
                          "https://placehold.co/100x100?text=No+Img"
                        }
                        alt={item.ten_san_pham}
                        className="w-12 h-12 rounded-xl object-cover border border-gray-100 shadow-sm shrink-0 bg-gray-50"
                      />
                      <div className="flex flex-col justify-center min-w-0">
                        <div className="flex items-center gap-2">
                          <p
                            className="text-xs font-black text-slate-900 truncate hover:text-[#006c49] cursor-pointer"
                            onClick={() =>
                              navigate(
                                `/admin/products/detail/${item.ma_san_pham}`,
                              )
                            }
                            title={item.ten_san_pham}
                          >
                            {item.ten_san_pham}
                          </p>

                          {item.trang_thai === false && (
                            <span className="bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded text-[9px] font-black uppercase whitespace-nowrap">
                              Tạm khóa
                            </span>
                          )}
                        </div>

                        <p className="text-[10px] text-gray-400 font-mono mt-0.5 truncate">
                          Mã: {item.ma_san_pham}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-4 text-gray-600 font-semibold">
                    {item.ten_danh_muc_con || "Chưa phân loại"}
                  </td>

                  <td className="py-4 px-4 text-center">
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="inline-block px-2.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-black uppercase border border-blue-100">
                        {item.ma_quoc_gia || "N/A"}
                      </span>
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                          item.co_bien_the
                            ? "bg-indigo-50 text-indigo-600 border border-indigo-100"
                            : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        }`}
                      >
                        {item.co_bien_the ? "SP Nhóm" : "SP Đơn"}
                      </span>
                    </div>
                  </td>

                  <td className="py-4 px-4 text-slate-900 font-black font-mono text-right">
                    {formatPrice(item.gia_ban_thap_nhat || item.gia_ban)}
                  </td>

                  {/* 🌟 2. HIỂN THỊ TỒN KHO TỪ DATA GỬI LÊN HOẶC FALLBACK */}
                  <td className="py-4 px-4 text-center">
                    <span
                      className={`px-2 py-1 rounded text-[10px] font-bold ${
                        item.tong_ton_kho && Number(item.tong_ton_kho) > 0
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {item.tong_ton_kho ? Number(item.tong_ton_kho) : 0}
                    </span>
                  </td>

                  <td className="py-4 px-4 text-center">
                    <button
                      onClick={() =>
                        handleToggleStatus(item.ma_san_pham, item.trang_thai)
                      }
                      className={`w-10 h-5.5 rounded-full relative transition-colors duration-300 focus:outline-none shadow-inner ${
                        item.trang_thai ? "bg-[#006c49]" : "bg-gray-300"
                      }`}
                      title={
                        item.trang_thai
                          ? "Đang mở bán (Click để tắt)"
                          : "Đang tạm ẩn (Click để mở)"
                      }
                    >
                      <span
                        className={`absolute top-[2px] left-[2px] w-4.5 h-4.5 bg-white rounded-full shadow transition-transform duration-300 ${
                          item.trang_thai
                            ? "translate-x-[18px]"
                            : "translate-x-0"
                        }`}
                      />
                    </button>
                  </td>

                  <td className="py-4 px-4 text-right pr-6">
                    <div className="flex items-center justify-end gap-2 text-gray-400">
                      <button
                        onClick={() =>
                          navigate(`/admin/products/detail/${item.ma_san_pham}`)
                        }
                        className="p-1.5 hover:text-slate-800 hover:bg-white rounded-lg shadow-sm transition"
                        title="Xem chi tiết"
                      >
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
                            d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() =>
                          navigate(`/admin/products/edit/${item.ma_san_pham}`)
                        }
                        className="p-1.5 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg shadow-sm transition"
                        title="Chỉnh sửa thông tin"
                      >
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
                            d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() =>
                          handleDelete(item.ma_san_pham, item.ten_san_pham)
                        }
                        className="p-1.5 hover:text-red-600 hover:bg-red-50 rounded-lg shadow-sm transition"
                        title="Xóa vĩnh viễn"
                      >
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
                            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {products.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan="7"
                    className="py-12 text-center text-gray-400 font-medium"
                  >
                    Không tìm thấy sản phẩm nào khớp với bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PHÂN TRANG */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-100 text-xs font-bold text-gray-400">
          <div>
            Hiển thị{" "}
            <span className="text-slate-800 font-black">{startItem}</span> -{" "}
            <span className="text-slate-800 font-black">{endItem}</span> trong
            tổng <span className="text-[#006c49] font-black">{totalItems}</span>{" "}
            sản phẩm
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span>Trang:</span>
              <select
                value={page}
                onChange={(e) => setPage(Number(e.target.value))}
                className="bg-slate-50 border border-gray-200 rounded-lg px-2.5 py-1 text-slate-800 font-black outline-none cursor-pointer hover:border-gray-300"
              >
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-slate-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                ❮
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-slate-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                ❯
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
