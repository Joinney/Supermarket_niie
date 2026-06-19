import React from "react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

export default function Dashboard() {
  // 1. Dữ liệu cho 4 thẻ Tổng quan trên cùng
  const overviewCards = [
    {
      id: 1,
      title: "Tổng Sản Phẩm",
      value: "1,248",
      subText: "0 Hoạt động:",
      subValue: "1,102",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      ),
      bgColor: "bg-[#eaf9f3] text-[#2ac38a]",
    },
    {
      id: 2,
      title: "Giá Trị Tồn Kho",
      value: "4.5M",
      subText: "Số lượng:",
      subValue: "15,230",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.214.016a5.5 5.5 0 005.717-3.41 4.5 4.5 0 00-4.723-5.323H11.55a4.5 4.5 0 00-4.723 5.322 5.5 5.5 0 005.717 3.411h.111zm-4.135-4.33a4.5 4.5 0 013.882-3.881M14.65 14.65a4.5 4.5 0 01-3.881 3.88" />
        </svg>
      ),
      bgColor: "bg-[#e8f6fc] text-[#29b0ed]",
    },
    {
      id: 3,
      title: "SKU Hết Hàng",
      value: "12",
      subText: "Có hàng:",
      subValue: "3,420",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
      ),
      bgColor: "bg-[#fdf0f0] text-[#f25959]",
    },
    {
      id: 4,
      title: "Tổng SKU",
      value: "3,432",
      subText: "Hoạt động:",
      subValue: "3,210",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
        </svg>
      ),
      bgColor: "bg-[#eff2f9] text-[#4d73db]",
    },
  ];

  // 2. Dữ liệu bảng "Top Sản Phẩm Có Nhiều SKU"
  const topProductsSku = [
    { id: 1, name: "Cà chua Beef Đà Lạt", count: 24, color: "bg-blue-100" },
    { id: 2, name: "Hạt giống Dưa Lưới F1", count: 15, color: "bg-emerald-100" },
    { id: 3, name: "Phân bón vi sinh Trichoderma", count: 12, color: "bg-cyan-100" },
    { id: 4, name: "Túi bọc trái cây sinh học", count: 8, color: "bg-amber-100" },
  ];

  // 3. Dữ liệu bảng lớn phía dưới "Top SKU Theo Giá Trị Tồn Kho"
  const inventorySkuTable = [
    {
      id: 1,
      name: "Cà chua Beef Đà Lạt – Thùng 20kg",
      sku: "SKU: FRU-TOM-BEEF20",
      stock: "1,500",
      price: "650,000 đ",
      totalValue: "975,000,000 đ",
      isWarning: false,
    },
    {
      id: 2,
      name: "Phân bón Trichoderma BAC – Thùng 12 hộp",
      sku: "SKU: MIC-TRI-T12",
      stock: "850",
      price: "840,000 đ",
      totalValue: "714,000,000 đ",
      isWarning: false,
    },
    {
      id: 3,
      name: "Hạt giống Dưa Lưới F1 – Gói 500g",
      sku: "SKU: SED-MEL-G500",
      stock: "420",
      price: "1,200,000 đ",
      totalValue: "504,000,000 đ",
      isWarning: false,
    },
    {
      id: 4,
      name: "Túi bọc sinh học – Thùng 10.000 cái",
      sku: "SKU: BAG-BIO-T10K",
      stock: "120",
      price: "3,500,000 đ",
      totalValue: "420,000,000 đ",
      isWarning: false,
    },
    {
      id: 5,
      name: "Cây giống Chuối cấy mô – Khay 100 bầu",
      sku: "SKU: PEE-BAN-K100",
      stock: "15",
      price: "1,500,000 đ",
      totalValue: "22,500,000 đ",
      isWarning: true, // Số lượng ít (chữ màu đỏ)
    },
  ];

  return (
    <div className="flex h-screen w-screen bg-[#fafafa] overflow-hidden font-sans">
      {/* 1. THANH SIDEBAR BÊN TRÁI */}
      <Sidebar />

      {/* KHU VỰC CHỨA CẢ HEADER VÀ NỘI DUNG CHÍNH */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* 2. THANH HEADER LÊN TOP */}
        <Header />

        {/* 3. VÙNG HIỂN THỊ NỘI DUNG CHÍNH (MAIN SCREEN CONTENT) */}
        <main className="flex-1 overflow-y-auto p-6 text-left custom-scrollbar">
          
          {/* TIÊU ĐỀ TRANG & TIỆN ÍCH */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-black text-gray-800 tracking-tight">Thống kê sản phẩm</h1>
              <p className="text-xs font-semibold text-gray-400 mt-1">
                Tổng quan về sản phẩm và hiệu suất bán hàng
              </p>
            </div>
            
            <div className="flex items-center gap-2 self-end sm:self-center">
              {/* Ô chọn ngày */}
              <div className="flex items-center gap-2 border bg-white px-3 py-1.5 rounded-xl text-xs font-bold text-gray-500 shadow-sm">
                <span>📅 01/10/2023 - 31/10/2023</span>
                <span className="text-[10px] text-gray-400">▼</span>
              </div>
              {/* Nút Refresh */}
              <button className="p-2 border bg-white rounded-xl hover:bg-gray-50 transition shadow-sm text-gray-500">
                🔄
              </button>
              {/* Nút Xuất bản ghi */}
              <button className="px-4 py-1.5 border bg-white rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition shadow-sm flex items-center gap-1.5">
                📤 Xuất
              </button>
            </div>
          </div>

          {/* KHỐI 1: 4 THẺ TỔNG QUAN (OVERVIEW CARDS) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {overviewCards.map((card) => (
              <div key={card.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-gray-400 block">{card.title}</span>
                  <span className="text-2xl font-black text-gray-800 block tracking-tight">{card.value}</span>
                  <span className="text-[11px] font-semibold text-gray-400 block">
                    {card.subText} <span className="text-gray-600 font-bold">{card.subValue}</span>
                  </span>
                </div>
                <div className={`w-11 h-11 ${card.bgColor} rounded-2xl flex items-center justify-center`}>
                  {card.icon}
                </div>
              </div>
            ))}
          </div>

          {/* KHỐI 2: HAI BIỂU ĐỒ & BẢNG PHỤ (TOP SKU & PHÂN BỐ LOẠI SP) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            
            {/* Cột trái (Chiếm 2/3 phần): Top Sản Phẩm Có Nhiều SKU */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm lg:col-span-2 flex flex-col justify-between">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">Top Sản Phẩm Có Nhiều SKU</h3>
                <button className="text-gray-400 hover:text-gray-600 font-bold text-sm">•••</button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-gray-400 text-[10px] font-bold uppercase tracking-wider border-b border-gray-50 pb-2">
                      <th className="pb-3 w-12">#</th>
                      <th className="pb-3">Sản phẩm</th>
                      <th className="pb-3 text-right">Số lượng SKU</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-xs font-bold text-gray-700">
                    {topProductsSku.map((prod, idx) => (
                      <tr key={prod.id} className="hover:bg-gray-50/50 transition">
                        <td className="py-4 text-gray-400">{idx + 1}</td>
                        <td className="py-4 flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl ${prod.color} shrink-0`}></div>
                          <span className="font-semibold text-gray-800">{prod.name}</span>
                        </td>
                        <td className="py-4 text-right">
                          <span className="bg-gray-50 px-2.5 py-1 rounded-lg text-gray-600">{prod.count}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cột phải (Chiếm 1/3 phần): Phân Bố Loại SP */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">Phân Bố Loại SP</h3>
                <button className="text-gray-400 hover:text-gray-600 font-bold text-sm">•••</button>
              </div>

              {/* Mô phỏng biểu đồ tròn SVG Doughnut Chart */}
              <div className="relative flex items-center justify-center my-4">
                <svg width="150" height="150" viewBox="0 0 36 36" className="transform -rotate-90">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f3f4f6" strokeWidth="3.5" />
                  {/* Đoạn Trái cây 40% */}
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#3b82f6" strokeWidth="3.5" strokeDasharray="40 100" strokeDashoffset="0" />
                  {/* Đoạn Hạt giống 30% */}
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10b981" strokeWidth="3.5" strokeDasharray="30 100" strokeDashoffset="-40" />
                  {/* Đoạn Vật tư 20% */}
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f59e0b" strokeWidth="3.5" strokeDasharray="20 100" strokeDashoffset="-70" />
                  {/* Đoạn Vi sinh 10% */}
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#06b6d4" strokeWidth="3.5" strokeDasharray="10 100" strokeDashoffset="-90" />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-xl font-black text-gray-800">100%</span>
                </div>
              </div>

              {/* Chú thích biểu đồ */}
              <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[10px] font-bold text-gray-500">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500 block"></span> Trái cây (40%)
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 block"></span> Hạt giống (30%)
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 block"></span> Vật tư (20%)
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-500 block"></span> Vi sinh (10%)
                </div>
              </div>
            </div>

          </div>

          {/* KHỐI 3: BẢNG LỚN PHÍA DƯỚI (TOP SKU THEO GIÁ TRỊ TỒN KHO) */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">Top SKU Theo Giá Trị Tồn Kho</h3>
              <button className="text-gray-400 hover:text-gray-600 font-bold text-sm">•••</button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-gray-400 text-[10px] font-bold uppercase tracking-wider border-b border-gray-100 pb-2">
                    <th className="pb-3">Sản phẩm</th>
                    <th className="pb-3 text-right">Số lượng tồn</th>
                    <th className="pb-3 text-right">Đơn giá</th>
                    <th className="pb-3 text-right">Giá trị tồn kho</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs font-bold text-gray-700">
                  {inventorySkuTable.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/40 transition">
                      <td className="py-4">
                        <p className="text-gray-800 font-bold text-sm">{item.name}</p>
                        <span className="text-[10px] text-gray-400 font-semibold block mt-0.5">{item.sku}</span>
                      </td>
                      <td className={`py-4 text-right text-sm ${item.isWarning ? "text-red-500" : "text-gray-800"}`}>
                        {item.stock}
                      </td>
                      <td className="py-4 text-right text-gray-500 text-sm font-medium">
                        {item.price}
                      </td>
                      <td className="py-4 text-right text-emerald-600 text-sm font-extrabold">
                        {item.totalValue}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* THANH PHÂN TRANG (PAGINATION FOOTER) */}
            <div className="border-t border-gray-50 pt-4 mt-4 flex flex-col sm:flex-row gap-3 justify-between items-center text-xs font-bold text-gray-400">
              <span>1 - 10 of 13 Pages</span>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">The page on</span>
                  <select className="border border-gray-200 px-2 py-1 rounded-lg text-gray-600 bg-white outline-none">
                    <option>1</option>
                  </select>
                </div>
                <div className="flex gap-1">
                  <button className="w-7 h-7 border border-gray-200 rounded-lg flex items-center justify-center text-gray-400 bg-white hover:bg-gray-50">
                    ❮
                  </button>
                  <button className="w-7 h-7 border border-gray-200 rounded-lg flex items-center justify-center text-gray-400 bg-white hover:bg-gray-50">
                    ❯
                  </button>
                </div>
              </div>
            </div>

          </div>

        </main>
      </div>
    </div>
  );
}