import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
// 🌟 ĐỒNG BỘ: Sử dụng instance productApi trích xuất từ tệp cấu hình Interceptor của bạn
import { productApi } from "../../../../api/axios"; // <--- Hãy điều chỉnh đường dẫn thực tế đến file config Axios của bạn

export default function ProductList() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [countries, setCountries] = useState([]);

  // Phân trang
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Tìm kiếm & Bộ lọc
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    sort: "newest",
    market: "all",
    type: "all",
  });

  // State quản lý Checkbox chọn sản phẩm
  const [selectedIds, setSelectedIds] = useState([]);

  // Debounce tìm kiếm
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch danh sách sản phẩm via productApi
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

      // 🚀 TỐI ƯU: Gọi path tương đối ngắn gọn qua instance productApi
      if (debouncedTerm.trim() !== "") {
        response = await productApi.get("/products/search", {
          params: { keyword: debouncedTerm, ...queryParams },
        });
        if (response.data) {
          setProducts(response.data);
          setTotalItems(response.data.length);
          setTotalPages(1);
        }
      } else {
        response = await productApi.get("/products", {
          params: queryParams,
        });
        if (response.data?.products) {
          setProducts(response.data.products);
          setTotalPages(response.data.totalPages);
          setTotalItems(response.data.totalItems);
        }
      }
      setSelectedIds([]);
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

  // Fetch quốc gia via productApi
  useEffect(() => {
    const fetchNations = async () => {
      try {
        const res = await productApi.get("/nations");
        setCountries(res.data.data || []);
      } catch (err) {
        console.error("Lỗi lấy danh sách quốc gia:", err);
      }
    };
    fetchNations();
  }, []);

  // Xử lý Logic Checkbox
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = products.map((p) => p.ma_san_pham).filter(Boolean);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id, checked) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  // Làm mới bộ lọc
  const handleRefresh = () => {
    setSearchTerm("");
    setPage(1);
    setFilters({ sort: "newest", market: "all", type: "all" });
    setSelectedIds([]);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  // Xóa 1 sản phẩm
  const handleDelete = async (id, name) => {
    if (
      window.confirm(
        `⚠️ Bạn có chắc chắn muốn xóa vĩnh viễn "${name}" (Mã: ${id})?\nHành động này không thể hoàn tác!`,
      )
    ) {
      try {
        await productApi.delete(`/products/${id}`);
        setProducts(products.filter((p) => p.ma_san_pham !== id));
        setTotalItems((prev) => prev - 1);
        setSelectedIds((prev) => prev.filter((item) => item !== id));
        alert(`✅ Đã xóa vĩnh viễn sản phẩm: ${name}`);
      } catch (err) {
        const errorMsg = err.response?.data?.message || err.message || "Lỗi không xác định";
        alert("❌ Xóa thất bại!\nLỗi: " + errorMsg);
      }
    }
  };

  // Xóa hàng loạt sản phẩm đã chọn
  const handleBulkDelete = async () => {
    if (
      window.confirm(
        `⚠️ Bạn có chắc chắn muốn xóa vĩnh viễn ${selectedIds.length} sản phẩm đã chọn?`,
      )
    ) {
      try {
        await Promise.all(selectedIds.map((id) => productApi.delete(`/products/${id}`)));
        alert("✅ Đã xóa thành công các sản phẩm đã chọn!");
        fetchProducts();
      } catch (err) {
        alert("❌ Có lỗi xảy ra khi xóa hàng loạt sản phẩm!");
      }
    }
  };

  // Ẩn/Hiện nhanh trạng thái
  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await productApi.put(`/products/${id}/toggle-status`);
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
  const isAllSelected = products.length > 0 && selectedIds.length === products.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="w-full min-h-screen bg-[#fafafa] font-sans text-left text-slate-700 selection:bg-emerald-100 p-1 antialiased"
    >
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Quản lý sản phẩm
          </h1>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mt-1">
            <span>Tổng hành dinh</span>
            <span>❯</span>
            <span className="text-[#006c49] font-bold">Danh sách sản phẩm</span>
          </div>
        </div>

        {/* 🌟 ĐỒNG BỘ CHUẨN: Màu sắc, kích thước padding, gap và hiệu ứng transform */}
        <button
          onClick={() => navigate("/admin/products/create")}
          className="flex items-center justify-center gap-1.5 bg-[#006c49] hover:bg-[#005237] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:shadow transition transform active:scale-98 shrink-0 cursor-pointer whitespace-nowrap"
        >
          <svg xmlns="http://www.w3.org/2000/xl" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Thêm sản phẩm mới
        </button>
      </div>

      {/* MAIN CONTAINER */}
      <div className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm p-5 md:p-6 relative">
        
        {loading && (
          <div className="absolute top-4 right-6 text-xs font-bold text-[#006c49] flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-full animate-pulse">
            <span className="w-2 h-2 rounded-full bg-[#006c49]"></span>
            Đang đồng bộ cơ sở dữ liệu...
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-bold text-center">
            {error}
          </div>
        )}

        {/* THANH ĐIỀU KHIỂN */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-2">
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Tìm theo tên sản phẩm hoặc mã định danh..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-[#006c49] focus:ring-2 focus:ring-emerald-50 transition text-slate-800"
              />
              <span className="absolute left-3 top-2.5 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer bg-white shadow-2xs"
              >
                Làm mới
              </button>
              {/* 🌟 ĐỒNG BỘ CHUẨN: Màu nền active của bộ lọc */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-4 py-2 border rounded-xl text-xs font-bold transition cursor-pointer bg-white shadow-2xs ${showFilters ? "bg-[#006c49] text-white border-[#006c49] hover:bg-[#005237]" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              >
                Bộ lọc chuyên sâu {showFilters ? "▲" : "▼"}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {selectedIds.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm"
              >
                <span>Đã chọn <span className="text-emerald-400 font-extrabold">{selectedIds.length}</span> mục</span>
                <div className="h-4 w-[1px] bg-slate-700"></div>
                <button
                  onClick={handleBulkDelete}
                  className="text-red-400 hover:text-red-300 transition cursor-pointer"
                >
                  Xóa hàng loạt
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* MỞ RỘNG BỘ LỌC */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Sắp xếp dữ liệu</label>
                  <select
                    value={filters.sort}
                    onChange={(e) => handleFilterChange("sort", e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-[#006c49] cursor-pointer"
                  >
                    <option value="newest">Sản phẩm mới nhất</option>
                    <option value="oldest">Sản phẩm cũ nhất</option>
                    <option value="price_desc">Giá từ cao đến thấp</option>
                    <option value="price_asc">Giá từ thấp đến cao</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Phân vùng thị trường</label>
                  <select
                    value={filters.market}
                    onChange={(e) => handleFilterChange("market", e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-[#006c49] cursor-pointer"
                  >
                    <option value="all">Tất cả quốc gia</option>
                    {countries.map((c) => (
                      <option key={c.ma_quoc_gia} value={c.ma_quoc_gia}>
                        {c.bieu_tuong_co} {c.ten_quoc_gia}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Loại hình cấu trúc cấu tạo</label>
                  <select
                    value={filters.type}
                    onChange={(e) => handleFilterChange("type", e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-[#006c49] cursor-pointer"
                  >
                    <option value="all">Mọi loại hình cấu trúc</option>
                    <option value="single">Sản phẩm độc lập (Đơn)</option>
                    <option value="group">Sản phẩm phân nhóm (Biến thể)</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* BẢNG DỮ LIỆU */}
        <div className="w-full overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left border-collapse table-auto min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-[#006c49]"
                  />
                </th>
                <th className="py-3.5 px-4">Thông tin sản phẩm</th>
                <th className="py-3.5 px-4">Danh mục phân loại</th>
                <th className="py-3.5 px-4 text-center">Đặc tính cấu trúc</th>
                <th className="py-3.5 px-4 text-right">Giá trị niêm yết</th>
                <th className="py-3.5 px-4 text-center">Tồn kho hiện hữu</th>
                <th className="py-3.5 px-4 text-center">Trạng thái bán</th>
                <th className="py-3.5 px-4 text-right pr-6">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-700">
              {products.map((item, index) => {
                const isSelected = selectedIds.includes(item.ma_san_pham);
                return (
                  <tr
                    key={item.ma_san_pham || index}
                    className={`group transition hover:bg-slate-50/60 ${isSelected ? "bg-emerald-50/20 hover:bg-emerald-50/40" : ""}`}
                  >
                    <td className="py-4 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleSelectOne(item.ma_san_pham, e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-[#006c49]"
                      />
                    </td>

                    <td className="py-4 px-4 max-w-[320px]">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.hinh_anh_chinh || "https://placehold.co/100x100?text=No+Img"}
                          alt={item.ten_san_pham}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-100 shadow-2xs shrink-0 bg-slate-50"
                        />
                        <div className="flex flex-col justify-center min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p
                              className="text-xs font-bold text-slate-900 truncate hover:text-[#006c49] cursor-pointer transition"
                              onClick={() => navigate(`/admin/products/detail/${item.ma_san_pham}`)}
                              title={item.ten_san_pham}
                            >
                              {item.ten_san_pham}
                            </p>
                            {item.trang_thai === false && (
                              <span className="bg-red-50 text-red-600 border border-red-100 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">
                                Ẩn khóa
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Mã ID: {item.ma_san_pham}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-slate-500">
                      {item.ten_danh_muc_con || "Mục gốc/Chưa phân loại"}
                    </td>

                    <td className="py-4 px-4 text-center">
                      <div className="flex flex-col sm:flex-row justify-center items-center gap-1.5">
                        <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-black uppercase border border-blue-100 tracking-wide">
                          {item.ma_quoc_gia || "Mặc định"}
                        </span>
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wide ${
                            item.co_bien_the
                              ? "bg-purple-50 text-purple-600 border border-purple-100"
                              : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          }`}
                        >
                          {item.co_bien_the ? "SP Nhóm" : "SP Đơn"}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-slate-900 font-extrabold font-mono text-right text-sm">
                      {formatPrice(item.gia_ban_thap_nhat)}
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                          item.tong_ton_kho && Number(item.tong_ton_kho) > 0
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-600"
                        }`}
                      >
                        {item.tong_ton_kho ? Number(item.tong_ton_kho) : 0}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-center">
                      {/* 🌟 ĐỒNG BỘ CHUẨN: Toggle switch màu nền active */}
                      <button
                        onClick={() => handleToggleStatus(item.ma_san_pham, item.trang_thai)}
                        className={`w-10 h-5 rounded-full relative transition-colors duration-200 focus:outline-none shadow-xs cursor-pointer ${
                          item.trang_thai ? "bg-[#006c49]" : "bg-slate-300"
                        }`}
                        title={item.trang_thai ? "Bật (Click ẩn)" : "Tắt (Click mở)"}
                      >
                        <span
                          className={`absolute top-[2px] left-[2px] w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                            item.trang_thai ? "translate-x-[20px]" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </td>

                    <td className="py-4 px-4 text-right pr-6">
                      <div className="flex items-center justify-end gap-1 text-slate-400">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/products/detail/${item.ma_san_pham}`)}
                          className="p-1.5 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                          title="Xem chi tiết"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/products/edit/${item.ma_san_pham}`)}
                          className="p-1.5 hover:text-[#006c49] hover:bg-slate-100 rounded-lg transition cursor-pointer"
                          title="Chỉnh sửa thông tin"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.ma_san_pham, item.ten_san_pham)}
                          className="p-1.5 hover:text-red-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                          title="Xóa vĩnh viễn"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {products.length === 0 && !loading && (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400 font-medium">
                    Không tìm thấy sản phẩm nào khớp với bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PHÂN TRANG */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-100 text-xs font-bold text-slate-400">
          <div>
            Hiển thị <span className="text-slate-800 font-extrabold">{startItem}</span> -{" "}
            <span className="text-slate-800 font-extrabold">{endItem}</span> trong tổng số{" "}
            <span className="text-[#006c49] font-extrabold">{totalItems}</span> sản phẩm dữ liệu
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span>Trang hiện tại:</span>
              <select
                value={page}
                onChange={(e) => setPage(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-800 font-black outline-none cursor-pointer hover:border-slate-300"
              >
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer bg-white shadow-2xs"
              >
                ❮
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer bg-white shadow-2xs"
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