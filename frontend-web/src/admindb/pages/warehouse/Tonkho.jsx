import React, { useState } from "react";

// Dữ liệu mẫu (Mock Data) khớp với hình ảnh mô tả
const MOCK_INVENTORY_DATA = [
  {
    id: "SP000006",
    name: "Product Test",
    quantity: 40,
    costPrice: 60000000,
    totalValue: 76000000,
  },
  {
    id: "SP000006-2", // Phân biệt key nếu trùng mã sản phẩm như ảnh mẫu
    realId: "SP000006",
    name: "Đồng hồ thể thao nữ Sport watch samda",
    quantity: 1997,
    costPrice: 299550000,
    totalValue: 599100000,
  },
  {
    id: "SP000005",
    name: "Laptop Xiaomi Mi Notebook Pro 15.6inch i5 8G (Xám) computer",
    quantity: 49,
    costPrice: 980000000,
    totalValue: 1078000000,
  },
  {
    id: "SP000004",
    name: "Smart Tivi Samsung 50 inch 4K UHD - Model UA50NU7090KXXV",
    quantity: 53,
    costPrice: 742000000,
    totalValue: 895700000,
  },
];

const Quanlytonkho = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [stockStatus, setStockStatus] = useState("");

  // Hàm định dạng số/tiền tệ Việt Nam VNĐ
  const formatNumber = (num) => {
    return new Intl.NumberFormat("vi-VN").format(num);
  };

  return (
    <div className="w-full bg-[#fafafa] min-h-screen font-sans antialiased text-gray-800">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-800">Quản lý tồn kho</h1>
          <div className="text-sm text-gray-500 mt-1">
            Dashboard &gt; <span className="text-emerald-600 font-medium">Quản lý tồn kho</span>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg bg-white shadow-sm hover:bg-gray-50 text-sm text-gray-600 font-medium transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
          </svg>
          Xuất
        </button>
      </div>

      {/* FILTER BAR SECTION */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[240px]">
          <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.603 10.601Z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Nhập tên hoặc mã sản phẩm để tìm kiếm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 placeholder-gray-400 transition-all"
          />
        </div>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-600 focus:outline-none min-w-[150px]"
        >
          <option value="">Chọn danh mục</option>
        </select>

        <select
          value={manufacturer}
          onChange={(e) => setManufacturer(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-600 focus:outline-none min-w-[160px]"
        >
          <option value="">Chọn nhà sản xuất</option>
        </select>

        <select
          value={stockStatus}
          onChange={(e) => setStockStatus(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-600 focus:outline-none min-w-[140px]"
        >
          <option value="">Chỉ lấy hàng tồn</option>
        </select>

        <button className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.603 10.601Z" />
          </svg>
          Xem
        </button>

        <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-all flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
          Xuất Excel
        </button>
      </div>

      {/* KPI STATISTICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* CARD 1: NGÀY LẬP */}
        <div className="bg-white p-5 rounded-xl border-b-[4px] border-emerald-500 shadow-sm flex justify-between items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Ngày lập</p>
            <p className="text-xl font-bold text-emerald-600 mt-1">25/01/2024</p>
          </div>
          <div className="p-3 rounded-full bg-emerald-50 text-emerald-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
        </div>

        {/* CARD 2: SL TỒN KHO */}
        <div className="bg-white p-5 rounded-xl border-b-[4px] border-blue-500 shadow-sm flex justify-between items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">SL Tồn kho</p>
            <p className="text-xl font-bold text-blue-600 mt-1">{formatNumber(3963)}</p>
          </div>
          <div className="p-3 rounded-full bg-blue-50 text-blue-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581a1.125 1.125 0 0 0 1.591 0l4.318-4.318a1.125 1.125 0 0 0 0-1.591l-9.581-9.581c-.422-.422-.994-.659-1.591-.659ZM5.25 6h.008v.008H5.25V6Z" />
            </svg>
          </div>
        </div>

        {/* CARD 3: TỔNG VỐN TỒN KHO */}
        <div className="bg-white p-5 rounded-xl border-b-[4px] border-orange-500 shadow-sm flex justify-between items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Tổng vốn tồn kho</p>
            <p className="text-xl font-bold text-orange-600 mt-1">{formatNumber(2597950000)}</p>
          </div>
          <div className="p-3 rounded-full bg-orange-50 text-orange-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </div>
        </div>

        {/* CARD 4: TỔNG GIÁ TRỊ TỒN KHO */}
        <div className="bg-white p-5 rounded-xl border-b-[4px] border-pink-500 shadow-sm flex justify-between items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Tổng giá trị tồn kho</p>
            <p className="text-xl font-bold text-pink-600 mt-1">{formatNumber(3444750000)}</p>
          </div>
          <div className="p-3 rounded-full bg-pink-50 text-pink-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
            </svg>
          </div>
        </div>
      </div>

      {/* DATA TABLE SECTION */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                <th className="py-4 px-6 p-4">Mã hàng</th>
                <th className="py-4 px-6 w-[45%]">Tên sản phẩm</th>
                <th className="py-4 px-6 text-right">SL</th>
                <th className="py-4 px-6 text-right">Vốn tồn kho</th>
                <th className="py-4 px-6 text-right">Giá trị tồn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm text-gray-700 font-medium">
              {MOCK_INVENTORY_DATA.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-gray-500">
                    {item.realId ? item.realId : item.id}
                  </td>
                  <td className="py-4 px-6 text-gray-600 font-normal max-w-xs break-words">
                    {item.name}
                  </td>
                  <td className="py-4 px-6 text-right font-bold text-gray-800">
                    {formatNumber(item.quantity)}
                  </td>
                  <td className="py-4 px-6 text-right text-gray-500">
                    {formatNumber(item.costPrice)}
                  </td>
                  <td className="py-4 px-6 text-right font-bold text-gray-800">
                    {formatNumber(item.totalValue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION SECTION */}
        <div className="p-4 bg-white border-t border-gray-50 flex items-center justify-between text-sm text-gray-500">
          <div>1 - 10 of 13 Pages</div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span>The page on</span>
              <select className="border border-gray-200 rounded px-2 py-1 bg-white text-gray-700 outline-none">
                <option>1</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-1.5 border border-gray-200 rounded hover:bg-gray-50 text-gray-400 cursor-not-allowed" disabled>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button className="p-1.5 border border-gray-200 rounded hover:bg-gray-50 text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quanlytonkho;