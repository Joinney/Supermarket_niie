import React, { useState, useEffect, useMemo } from "react";
import { warehouseApi, productApi } from "../../../api/axios";

// Hàm hỗ trợ: Loại bỏ dấu tiếng Việt để tìm kiếm
const removeVietnameseTones = (str) => {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
};

const Quanlytonkho = () => {
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  // State cấu trúc Danh mục Cha -> [Danh mục Con]
  const [categoryHierarchy, setCategoryHierarchy] = useState({});

  // States Bộ Lọc
  const [searchTerm, setSearchTerm] = useState("");
  const [parentCatFilter, setParentCatFilter] = useState(""); // Lọc Cha
  const [childCatFilter, setChildCatFilter] = useState(""); // Lọc Con
  const [timeFilter, setTimeFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const currentDate = new Date().toLocaleDateString("vi-VN");

  // 1. FETCH VÀ MIX DỮ LIỆU ĐA DỊCH VỤ (KẾT NỐI CHÍNH XÁC 100% QUA MẢNG VARIANTS)
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [inventoryRes, productsRes] = await Promise.all([
        warehouseApi.get("/inventory").catch(() => ({ data: [] })),
        productApi
          .get("/products?page=1&limit=2000")
          .catch(() => ({ data: { products: [] } })),
      ]);

      const rawInventory = inventoryRes.data || [];
      const rawProducts = productsRes.data?.products || productsRes.data || [];

      const hierarchy = {};
      const productMap = {}; // 🌟 Đã xoá bỏ từ điển đoán tên, chỉ dùng 1 bộ map chuẩn xác

      rawProducts.forEach((p) => {
        // Lấy đúng tên danh mục cha và con từ API mới
        const dmCha = p.ten_danh_muc_cha || "Danh Mục Tổng";
        const dmCon = p.ten_danh_muc_con || "Chưa phân loại";

        // Xây dựng cây thư mục Cha -> Con
        if (!hierarchy[dmCha]) hierarchy[dmCha] = new Set();
        if (dmCon !== "Chưa phân loại") hierarchy[dmCha].add(dmCon);

        const info = { parentCat: dmCha, childCat: dmCon };

        // Lưu thông tin vào map theo mã sản phẩm gốc
        productMap[p.ma_san_pham] = info;

        // 🌟 BẮT CHÍNH XÁC TỪNG SKU BÊN TRONG MẢNG VARIANTS
        if (p.variants && Array.isArray(p.variants)) {
          p.variants.forEach((v) => {
            if (v.sku) productMap[v.sku] = info;
          });
        }
      });

      // Format lại Set thành Array cho Dropdown
      const formattedHierarchy = {};
      Object.keys(hierarchy).forEach((key) => {
        formattedHierarchy[key] = Array.from(hierarchy[key]);
      });
      setCategoryHierarchy(formattedHierarchy);

      // Nối dữ liệu siêu tốc bằng ID trực tiếp
      const mixedData = rawInventory.map((item) => {
        // Chỉ cần tìm đích danh item.id (chính là SKU) trong Từ điển Map
        const extraInfo = productMap[item.id] || {};

        return {
          ...item,
          parentCategory: extraInfo.parentCat || "Danh mục khác",
          childCategory: extraInfo.childCat || "Chưa phân loại",
        };
      });

      // Sắp xếp mặc định: Update mới nhất lên đầu
      mixedData.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      setInventoryData(mixedData);
    } catch (error) {
      console.error("Lỗi đồng bộ dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const formatNumber = (num) => new Intl.NumberFormat("vi-VN").format(num);

  // 2. XỬ LÝ LỌC DỮ LIỆU ĐA CHIỀU
  const filteredData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return inventoryData.filter((item) => {
      // 1. Lọc Tìm kiếm (Không dấu)
      const query = removeVietnameseTones(searchTerm.toLowerCase());
      const matchSearch =
        removeVietnameseTones((item.id || "").toLowerCase()).includes(query) ||
        removeVietnameseTones((item.name || "").toLowerCase()).includes(query);

      // 2. Lọc Danh Mục Cha -> Con
      const matchParentCat =
        parentCatFilter === "" || item.parentCategory === parentCatFilter;
      const matchChildCat =
        childCatFilter === "" || item.childCategory === childCatFilter;

      // 3. Lọc Thời Gian & Vòng đời
      let matchTime = true;
      const createdDate = new Date(item.createdAt);
      const updatedDate = new Date(item.updatedAt);

      const daysSinceCreated = Math.floor(
        (today - createdDate) / (1000 * 60 * 60 * 24),
      );
      const daysSinceUpdated = Math.floor(
        (today - updatedDate) / (1000 * 60 * 60 * 24),
      );

      if (timeFilter === "inStock") matchTime = item.quantity > 0;
      else if (timeFilter === "firstTime")
        matchTime = daysSinceCreated <= 3 && item.quantity > 0;
      else if (timeFilter === "restocked")
        matchTime =
          daysSinceCreated > 3 && daysSinceUpdated <= 3 && item.quantity > 0;
      else if (timeFilter === "stagnant")
        matchTime = daysSinceUpdated >= 30 && item.quantity > 0;

      return matchSearch && matchParentCat && matchChildCat && matchTime;
    });
  }, [inventoryData, searchTerm, parentCatFilter, childCatFilter, timeFilter]);

  // 3. TÍNH TOÁN KPI THỐNG KÊ
  const stats = useMemo(() => {
    let totalQuantity = 0,
      totalCost = 0,
      totalValue = 0;
    filteredData.forEach((item) => {
      totalQuantity += item.quantity || 0;
      totalCost += item.costPrice || 0;
      totalValue += item.totalValue || 0;
    });
    return { totalQuantity, totalCost, totalValue };
  }, [filteredData]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const currentTableData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, parentCatFilter, childCatFilter, timeFilter]);

  const handleResetFilters = () => {
    setSearchTerm("");
    setParentCatFilter("");
    setChildCatFilter("");
    setTimeFilter("all");
    setCurrentPage(1);
    fetchAllData();
  };

  const getStatusBadge = (createdAt, updatedAt, quantity) => {
    if (quantity === 0) return null;
    const today = new Date();
    const daysSinceCreated = Math.floor(
      (today - new Date(createdAt)) / (1000 * 60 * 60 * 24),
    );
    const daysSinceUpdated = Math.floor(
      (today - new Date(updatedAt)) / (1000 * 60 * 60 * 24),
    );

    if (daysSinceCreated <= 3)
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-blue-100 text-blue-700 uppercase">
          {/* Icon Mới nhập vẽ bằng SVG */}
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Mới nhập
        </span>
      );
    if (daysSinceUpdated <= 3)
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-700 uppercase">
          {/* Icon Cập nhật vẽ bằng SVG */}
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
          </svg>
          Update
        </span>
      );
    if (daysSinceUpdated >= 30)
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-700 uppercase">
          {/* Icon Tồn đọng vẽ bằng SVG */}
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          Tồn đọng
        </span>
      );
    return null;
  };

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #pdf-report-template, #pdf-report-template * { visibility: visible; font-family: 'Times New Roman', Times, serif !important; }
          #pdf-report-template { position: absolute; left: 0; top: 0; width: 100%; display: block !important; }
          @page { size: A4 landscape; margin: 15mm; }
        }
      `}</style>

      <div className="w-full bg-[#fafafa] min-h-screen font-sans antialiased text-gray-800 print:bg-white">
        <div className="w-full print:hidden">
          {/* HEADER */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-semibold text-gray-800">
                Quản lý tồn kho
              </h1>
              <div className="text-sm text-gray-500 mt-1">
                Dashboard &gt;{" "}
                <span className="text-[#006c49] font-medium">
                  Quản lý tồn kho
                </span>
              </div>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 border border-emerald-200 rounded-lg bg-emerald-50 shadow-sm hover:bg-emerald-100 text-sm text-[#006c49] font-bold transition-all cursor-pointer"
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
                  d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.617 0-1.11-.51-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-14.326 0C3.768 7.441 3 8.376 3 9.456v6.294a2.25 2.25 0 0 0 2.25 2.25h1.091M5.25 9.75h13.5M9 21h6"
                />
              </svg>
              Xuất PDF
            </button>
          </div>

          {/* FILTER BAR SECTION */}
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-wrap items-center gap-3 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
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
                    d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.603 10.601Z"
                  />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Tên hoặc mã sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#006c49] transition-all font-medium text-slate-700"
              />
            </div>

            {/* 🌟 DROPDOWN 1: DANH MỤC CHA (Đã xóa emoji thô) */}
            <select
              value={parentCatFilter}
              onChange={(e) => {
                setParentCatFilter(e.target.value);
                setChildCatFilter(""); // Đổi Cha thì phải reset Con
              }}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 font-bold focus:outline-none w-[180px] cursor-pointer focus:border-[#006c49] truncate"
            >
              <option value="">Tất cả Danh mục Cha</option>
              {Object.keys(categoryHierarchy).map((dmCha) => (
                <option key={dmCha} value={dmCha}>
                  {dmCha}
                </option>
              ))}
            </select>

            {/* 🌟 DROPDOWN 2: DANH MỤC CON (Đã xóa emoji thô) */}
            <select
              value={childCatFilter}
              onChange={(e) => setChildCatFilter(e.target.value)}
              disabled={!parentCatFilter}
              className={`px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 font-bold focus:outline-none w-[180px] truncate ${!parentCatFilter ? "opacity-50 cursor-not-allowed" : "cursor-pointer focus:border-[#006c49]"}`}
            >
              <option value="">Phân loại Chi tiết</option>
              {parentCatFilter &&
                categoryHierarchy[parentCatFilter]?.map((dmCon) => (
                  <option key={dmCon} value={dmCon}>
                    {dmCon}
                  </option>
                ))}
            </select>

            {/* DROPDOWN 3: VÒNG ĐỜI KHO (Đã xóa các kí tự emoji trong option) */}
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 font-bold focus:outline-none min-w-[200px] focus:border-[#006c49] cursor-pointer"
            >
              <option value="all">Tất cả trạng thái kho</option>
              <option value="inStock">Chỉ lấy hàng còn tồn</option>
              <option value="firstTime">Lần đầu thêm (trong 3 ngày)</option>
              <option value="restocked">Mới nhập/update (trong 3 ngày)</option>
              <option value="stagnant">Tồn đọng lâu năm (&ge; 30 ngày)</option>
            </select>

            <button
              onClick={handleResetFilters}
              title="Làm mới bộ lọc"
              className="bg-slate-100 text-slate-600 p-2 rounded-lg hover:bg-slate-200 transition-all cursor-pointer border border-slate-200 flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                />
              </svg>
            </button>

            <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm">
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
                  d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                />
              </svg>
              Xuất Excel
            </button>
          </div>

          {/* KPI STATISTICS CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-5 rounded-xl border-b-[4px] border-emerald-500 shadow-sm flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                  Ngày lập báo cáo
                </p>
                <p className="text-xl font-black text-emerald-600 mt-1">
                  {currentDate}
                </p>
              </div>
              <div className="p-3 rounded-full bg-emerald-50 text-emerald-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border-b-[4px] border-blue-500 shadow-sm flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                  Tổng SL Tồn kho
                </p>
                <p className="text-xl font-black text-blue-600 mt-1">
                  {formatNumber(stats.totalQuantity)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-50 text-blue-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581a1.125 1.125 0 0 0 1.591 0l4.318-4.318a1.125 1.125 0 0 0 0-1.591l-9.581-9.581c-.422-.422-.994-.659-1.591-.659ZM5.25 6h.008v.008H5.25V6Z"
                  />
                </svg>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border-b-[4px] border-orange-500 shadow-sm flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                  Tổng vốn tồn kho
                </p>
                <p className="text-xl font-black text-orange-600 mt-1">
                  {formatNumber(stats.totalCost)}{" "}
                  <span className="text-xs">đ</span>
                </p>
              </div>
              <div className="p-3 rounded-full bg-orange-50 text-orange-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879-.659c1.171-.879 3.07-.879 4.242 0 1.172.879 1.172 2.303 0 3.182s-3.07.879-4.242 0a1.75 1.75 0 01-.424-.53m0-10.607l.879-.659c1.171-.879 3.07-.879 4.242 0 1.172.879 1.172 2.303 0 3.182s-3.07.879-4.242 0a1.75 1.75 0 01-.424-.53M12 3v3m0 12v3" />
                </svg>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border-b-[4px] border-pink-500 shadow-sm flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                  Tổng giá trị dự kiến
                </p>
                <p className="text-xl font-black text-pink-600 mt-1">
                  {formatNumber(stats.totalValue)}{" "}
                  <span className="text-xs">đ</span>
                </p>
              </div>
              <div className="p-3 rounded-full bg-pink-50 text-pink-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* DATA TABLE SECTION */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-6">
            <div className="overflow-x-auto min-h-[300px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f8fafc] border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    <th className="py-4 px-6 w-[20%]">Mã hàng (SKU)</th>
                    <th className="py-4 px-6 w-[35%]">
                      Tên sản phẩm & Danh mục
                    </th>
                    <th className="py-4 px-6 text-right text-emerald-700 w-[10%]">
                      SL Tồn Kho
                    </th>
                    <th className="py-4 px-6 text-right w-[15%]">
                      Vốn tồn kho
                    </th>
                    <th className="py-4 px-6 text-right text-[#006c49] w-[20%]">
                      Giá trị dự kiến
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm text-gray-700 font-medium">
                  {loading ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="py-20 text-center text-xs text-[#006c49] font-bold uppercase tracking-widest"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                          </svg>
                          Đang tổng hợp dữ liệu kho...
                        </div>
                      </td>
                    </tr>
                  ) : filteredData.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="py-20 text-center text-xs text-gray-400 font-bold uppercase tracking-wider"
                      >
                        Không tìm thấy sản phẩm phù hợp.
                      </td>
                    </tr>
                  ) : (
                    currentTableData.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <p className="font-bold text-gray-600 font-mono text-[11px]">
                            {item.id}
                          </p>
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {getStatusBadge(
                              item.createdAt,
                              item.updatedAt,
                              item.quantity,
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-gray-800 font-bold max-w-xs break-words">
                            {item.name}
                          </p>
                          <div className="text-[10px] mt-1 text-slate-500 font-medium flex items-center gap-1">
                            <span className="text-indigo-500">
                              {item.parentCategory}
                            </span>{" "}
                            {/* SVG mũi tên sang phải chuyên nghiệp */}
                            <svg className="w-2.5 h-2.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                            </svg>{" "}
                            <span>{item.childCategory}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span
                            className={`font-black text-base px-2 py-1 rounded-md ${item.quantity === 0 ? "text-gray-400 bg-gray-100" : "text-emerald-700 bg-emerald-50"}`}
                          >
                            {formatNumber(item.quantity)}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right font-mono text-gray-500">
                          {formatNumber(item.costPrice)}{" "}
                          <span className="text-[10px]">đ</span>
                        </td>
                        <td className="py-4 px-6 text-right font-mono font-bold text-slate-800">
                          {formatNumber(item.totalValue)}{" "}
                          <span className="text-[10px]">đ</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION SECTION */}
            {!loading && filteredData.length > 0 && (
              <div className="p-4 bg-white border-t border-gray-50 flex flex-wrap items-center justify-between text-xs text-gray-400 font-medium">
                <div>
                  Đang xem {(currentPage - 1) * itemsPerPage + 1} -{" "}
                  {Math.min(currentPage * itemsPerPage, filteredData.length)}{" "}
                  trong tổng số{" "}
                  <span className="font-bold text-gray-600">
                    {filteredData.length}
                  </span>{" "}
                  mã hàng
                </div>
                <div className="flex items-center gap-4 text-gray-500">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Trang số</span>
                    <select
                      value={currentPage}
                      onChange={(e) => setCurrentPage(Number(e.target.value))}
                      className="border border-gray-200 rounded px-2 py-1 bg-white text-gray-700 outline-none font-semibold cursor-pointer"
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
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className={`p-1.5 border border-gray-200 rounded transition-colors ${currentPage === 1 ? "text-gray-300 bg-white cursor-not-allowed" : "text-gray-600 bg-white hover:bg-gray-50 cursor-pointer"}`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                        className="w-3.5 h-3.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.75 19.5 8.25 12l7.5-7.5"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className={`p-1.5 border border-gray-200 rounded transition-colors ${currentPage === totalPages ? "text-gray-300 bg-white cursor-not-allowed" : "text-gray-600 bg-white hover:bg-gray-50 cursor-pointer"}`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                        className="w-3.5 h-3.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m8.25 4.5 7.5 7.5-7.5 7.5"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 🌟 TEMPLATE BÁO CÁO PDF */}
        {/* ========================================================================= */}
        <div
          id="pdf-report-template"
          className="hidden bg-white text-black p-8"
        >
          <div className="flex justify-between items-start mb-10 border-b-2 border-black pb-4">
            <div className="text-center">
              <h2 className="text-sm font-bold uppercase">
                CÔNG TY TNHH DEMI MART
              </h2>
              <p className="text-xs font-semibold underline decoration-solid underline-offset-4">
                HỆ THỐNG QUẢN LÝ TỒN KHO
              </p>
            </div>
            <div className="text-center">
              <h2 className="text-sm font-bold uppercase">
                CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
              </h2>
              <p className="text-xs font-bold underline decoration-solid underline-offset-4">
                Độc lập - Tự do - Hạnh phúc
              </p>
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-extrabold uppercase mb-2">
              BÁO CÁO KIỂM KÊ TÀI SẢN KHO
            </h1>
            <p className="text-sm italic">
              Kỳ báo cáo: Thời điểm kết xuất{" "}
              {new Date().toLocaleTimeString("vi-VN")} - Ngày {currentDate}
            </p>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-bold text-base mb-2 uppercase">
                I. Tổng hợp số lượng
              </h3>
              <ul className="list-disc list-inside text-sm space-y-1.5 ml-4">
                <li>
                  Tổng mã hàng (Đã lọc):{" "}
                  <span className="font-bold">{filteredData.length} Mã</span>
                </li>
                <li>
                  Tổng sản phẩm lưu kho:{" "}
                  <span className="font-bold">
                    {formatNumber(stats.totalQuantity)} Đơn vị
                  </span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-base mb-2 uppercase">
                II. Tổng hợp tài sản
              </h3>
              <ul className="list-disc list-inside text-sm space-y-1.5 ml-4">
                <li>
                  Tổng giá trị vốn:{" "}
                  <span className="font-bold">
                    {formatNumber(stats.totalCost)} VNĐ
                  </span>
                </li>
                <li>
                  Tổng giá trị dự kiến:{" "}
                  <span className="font-bold">
                    {formatNumber(stats.totalValue)} VNĐ
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-base mb-2 uppercase">
              III. Bảng kê chi tiết tài sản
            </h3>
            <table className="w-full border-collapse border border-black text-sm">
              <thead>
                <tr className="bg-gray-100 font-bold text-center">
                  <th className="border border-black px-2 py-2 w-10">STT</th>
                  <th className="border border-black px-2 py-2 w-28">Mã SKU</th>
                  <th className="border border-black px-2 py-2 w-[35%]">
                    Tên Sản Phẩm
                  </th>
                  <th className="border border-black px-2 py-2 w-16">SL</th>
                  <th className="border border-black px-2 py-2">
                    Tổng Vốn (VNĐ)
                  </th>
                  <th className="border border-black px-2 py-2">
                    Giá Trị Dự Kiến (VNĐ)
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, index) => (
                  <tr key={item.id}>
                    <td className="border border-black px-2 py-2 text-center">
                      {index + 1}
                    </td>
                    <td className="border border-black px-2 py-2 text-center font-mono text-xs">
                      {item.id}
                    </td>
                    <td className="border border-black px-2 py-2 font-semibold">
                      {item.name}
                      <div className="text-[10px] font-normal italic text-gray-600 mt-1 flex items-center gap-1">
                        <span>({item.parentCategory}</span>
                        {/* SVG mũi tên sang phải trong mẫu in PDF */}
                        <svg className="w-2 h-2 text-gray-500 inline" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                        <span>{item.childCategory})</span>
                      </div>
                    </td>
                    <td className="border border-black px-2 py-2 text-center font-bold">
                      {formatNumber(item.quantity)}
                    </td>
                    <td className="border border-black px-2 py-2 text-right">
                      {formatNumber(item.costPrice)}
                    </td>
                    <td className="border border-black px-2 py-2 text-right font-bold">
                      {formatNumber(item.totalValue)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-bold">
                  <td
                    colSpan="3"
                    className="border border-black px-2 py-2 text-right uppercase"
                  >
                    Tổng Cộng Bảng Kê:
                  </td>
                  <td className="border border-black px-2 py-2 text-center text-lg">
                    {formatNumber(stats.totalQuantity)}
                  </td>
                  <td className="border border-black px-2 py-2 text-right text-lg">
                    {formatNumber(stats.totalCost)}
                  </td>
                  <td className="border border-black px-2 py-2 text-right text-lg">
                    {formatNumber(stats.totalValue)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex justify-between mt-12 pt-8 px-12">
            <div className="text-center">
              <p className="text-base font-bold">Thủ Kho / Kế Toán</p>
              <p className="text-xs italic mt-1">(Ký và ghi rõ họ tên)</p>
              <div className="h-24"></div>
            </div>
            <div className="text-center">
              <p className="text-sm italic mb-1">
                TP. Hồ Chí Minh, ngày ... tháng ... năm 202...
              </p>
              <p className="text-base font-bold">Giám Đốc Phê duyệt</p>
              <p className="text-xs italic mt-1">(Ký và đóng dấu)</p>
              <div className="h-24"></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Quanlytonkho;