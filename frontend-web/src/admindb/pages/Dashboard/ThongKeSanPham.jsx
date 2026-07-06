import React from "react";
import { motion } from "framer-motion";
// 🌟 THÊM: Import bộ icon vẽ nét đồng bộ chuẩn UI Dashboard
import {
  Boxes,
  Package,
  AlertTriangle,
  Layers,
  Calendar,
  RefreshCw,
  Download,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  PieChart
} from "lucide-react";

export default function Dashboard() {
  // 1. Dữ liệu cho 4 thẻ Tổng quan trên cùng sử dụng component Icon vẽ
  const overviewCards = [
    {
      id: 1,
      title: "Tổng Sản Phẩm",
      value: "1,248",
      subText: "Hoạt động:",
      subValue: "1,102",
      icon: Boxes, // Icon vẽ nhóm hộp sản phẩm
      bgColor: "bg-emerald-50 text-emerald-700 border border-emerald-100/70",
    },
    {
      id: 2,
      title: "Giá Trị Tồn Kho",
      value: "4.5M",
      subText: "Số lượng:",
      subValue: "15,230",
      icon: Package, // Icon vẽ kiện hàng bưu kiện
      bgColor: "bg-blue-50 text-blue-600 border border-blue-100/70",
    },
    {
      id: 3,
      title: "SKU Hết Hàng",
      value: "12",
      subText: "Có hàng:",
      subValue: "3,420",
      icon: AlertTriangle, // Icon vẽ cảnh báo tam giác
      bgColor: "bg-rose-50 text-rose-600 border border-red-100/70",
    },
    {
      id: 4,
      title: "Tổng SKU",
      value: "3,432",
      subText: "Hoạt động:",
      subValue: "3,210",
      icon: Layers, // Icon vẽ các phân lớp cấu trúc dữ liệu
      bgColor: "bg-purple-50 text-purple-600 border border-purple-100/70",
    },
  ];

  // 2. Dữ liệu bảng "Top Sản Phẩm Có Nhiều SKU"
  const topProductsSku = [
    { id: 1, name: "Cà chua Beef Đà Lạt", count: 24, color: "bg-blue-50 text-blue-600" },
    { id: 2, name: "Hạt giống Dưa Lưới F1", count: 15, color: "bg-emerald-50 text-emerald-600" },
    { id: 3, name: "Phân bón vi sinh Trichoderma", count: 12, color: "bg-cyan-50 text-cyan-600" },
    { id: 4, name: "Túi bọc trái cây sinh học", count: 8, color: "bg-amber-50 text-amber-600" },
  ];

  // 3. Dữ liệu bảng lớn phía dưới "Top SKU Theo Giá Trị Tồn Kho"
  const inventorySkuTable = [
    {
      id: 1,
      name: "Cà chua Beef Đà Lạt – Thùng 20kg",
      sku: "Mã SKU: FRU-TOM-BEEF20",
      stock: "1,500",
      price: "650,000 đ",
      totalValue: "975,000,000 đ",
      isWarning: false,
    },
    {
      id: 2,
      name: "Phân bón Trichoderma BAC – Thùng 12 hộp",
      sku: "Mã SKU: MIC-TRI-T12",
      stock: "850",
      price: "840,000 đ",
      totalValue: "714,000,000 đ",
      isWarning: false,
    },
    {
      id: 3,
      name: "Hạt giống Dưa Lưới F1 – Gói 500g",
      sku: "Mã SKU: SED-MEL-G500",
      stock: "420",
      price: "1,200,000 đ",
      totalValue: "504,000,000 đ",
      isWarning: false,
    },
    {
      id: 4,
      name: "Túi bọc sinh học – Thùng 10.000 cái",
      sku: "Mã SKU: BAG-BIO-T10K",
      stock: "120",
      price: "3,500,000 đ",
      totalValue: "420,000,000 đ",
      isWarning: false,
    },
    {
      id: 5,
      name: "Cây giống Chuối cấy mô – Khay 100 bầu",
      sku: "Mã SKU: PEE-BAN-K100",
      stock: "15",
      price: "1,500,000 đ",
      totalValue: "22,500,000 đ",
      isWarning: true,
    },
  ];

  return (
    <motion.main
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="w-full min-h-screen bg-[#fafafa] font-sans text-left text-slate-700 selection:bg-emerald-100 p-1 antialiased overflow-y-auto"
    >
      <div className="w-full">
        {/* TIÊU ĐỀ TRANG & TIỆN ÍCH */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Thống kê sản phẩm</h1>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mt-1">
              <span>Tổng hành dinh</span>
              <span>❯</span>
              <span className="text-emerald-700 font-bold">Thống kê sản phẩm</span>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2 self-start sm:self-center">
            {/* Ô chọn ngày */}
            <div className="flex items-center gap-2 border border-slate-200 bg-white px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 shadow-sm cursor-pointer hover:bg-slate-50 transition">
              <Calendar className="w-3.5 h-3.5 text-slate-400 stroke-[2.2]" />
              <span>01/10/2023 - 31/10/2023</span>
              <span className="text-[8px] text-slate-400">▼</span>
            </div>
            
            {/* Nút Refresh */}
            <button className="p-2 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 transition shadow-sm text-slate-500 cursor-pointer flex items-center justify-center">
              <RefreshCw className="w-3.5 h-3.5 stroke-[2.2]" />
            </button>
            
            {/* Nút Xuất bản ghi */}
            <button className="px-4 py-1.5 border border-slate-200 bg-white rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition shadow-sm flex items-center gap-1.5 cursor-pointer">
              <Download className="w-3.5 h-3.5 text-slate-400 stroke-[2.2]" />
              <span>Xuất file</span>
            </button>
          </div>
        </div>

        {/* KHỐI 1: 4 THẺ TỔNG QUAN (OVERVIEW CARDS) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {overviewCards.map((card) => {
            const CardIcon = card.icon;
            return (
              <div key={card.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center justify-between hover:border-slate-200 hover:shadow-md transition-all duration-200">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">{card.title}</span>
                  <span className="text-2xl font-black text-slate-900 block tracking-tight">{card.value}</span>
                  <span className="text-[11px] font-bold text-slate-400 block">
                    {card.subText} <span className="text-slate-700 font-extrabold">{card.subValue}</span>
                  </span>
                </div>
                <div className={`w-11 h-11 ${card.bgColor} rounded-xl flex items-center justify-center shrink-0 shadow-sm`}>
                  <CardIcon className="w-5 h-5 stroke-[2.2]" />
                </div>
              </div>
            );
          })}
        </div>

        {/* KHỐI 2: HAI BẢNG & SVG CHART */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Cột trái: Top Sản Phẩm Có Nhiều SKU */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 md:p-6 shadow-sm lg:col-span-2 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400 stroke-[2.5]" />
                Top Sản Phẩm Có Nhiều SKU
              </h3>
              <button className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition cursor-pointer flex items-center justify-center">
                <MoreHorizontal className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-50">
              <table className="w-full text-left border-collapse table-auto">
                <thead>
                  <tr className="bg-slate-50/70 text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-100">
                    <th className="py-2.5 px-4 w-12 text-center">#</th>
                    <th className="py-2.5 px-4">Sản phẩm</th>
                    <th className="py-2.5 px-4 text-right pr-6">Số lượng SKU</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-700">
                  {topProductsSku.map((prod, idx) => (
                    <tr key={prod.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 text-center text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-3 px-4 flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-lg ${prod.color} flex items-center justify-center font-black text-[10px] shrink-0 border border-slate-100`}>
                          SP
                        </div>
                        <span className="font-bold text-slate-900">{prod.name}</span>
                      </td>
                      <td className="py-3 px-4 text-right pr-6">
                        <span className="bg-slate-50 px-2.5 py-1 rounded-lg text-slate-800 font-bold font-mono">{prod.count}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cột phải: Phân Bố Loại SP */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 md:p-6 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <PieChart className="w-3.5 h-3.5 text-slate-400 stroke-[2.5]" />
                Phân Bố Loại SP
              </h3>
              <button className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition cursor-pointer flex items-center justify-center">
                <MoreHorizontal className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Mô phỏng biểu đồ tròn SVG Doughnut Chart */}
            <div className="relative flex items-center justify-center my-4">
              <svg width="130" height="130" viewBox="0 0 36 36" className="transform -rotate-90">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f8fafc" strokeWidth="4" />
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#3b82f6" strokeWidth="4" strokeDasharray="40 100" strokeDashoffset="0" />
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10b981" strokeWidth="4" strokeDasharray="30 100" strokeDashoffset="-40" />
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f59e0b" strokeWidth="4" strokeDasharray="20 100" strokeDashoffset="-70" />
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#06b6d4" strokeWidth="4" strokeDasharray="10 100" strokeDashoffset="-90" />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-lg font-black text-slate-900 font-mono">100%</span>
              </div>
            </div>

            {/* Chú thích biểu đồ */}
            <div className="grid grid-cols-2 gap-x-2 gap-y-2 text-[10px] font-bold text-slate-500 border-t border-slate-50 pt-3">
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
        <div className="bg-white border border-slate-100 rounded-2xl p-5 md:p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-slate-400 stroke-[2.5]" />
              Top SKU Theo Giá Trị Tồn Kho
            </h3>
            <button className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition cursor-pointer flex items-center justify-center">
              <MoreHorizontal className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left border-collapse table-auto min-w-[800px]">
              <thead>
                <tr className="bg-slate-50/70 text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-100">
                  <th className="py-3.5 px-4">Thông tin cấu trúc SKU</th>
                  <th className="py-3.5 px-4 text-center w-36">Số lượng tồn</th>
                  <th className="py-3.5 px-4 text-right w-44">Đơn giá niêm yết</th>
                  <th className="py-3.5 px-4 text-right w-48 pr-6">Giá trị tồn kho</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-700">
                {inventorySkuTable.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <p className="text-slate-900 font-bold text-xs truncate max-w-[350px]">{item.name}</p>
                      <span className="text-[10px] text-slate-400 font-mono font-medium block mt-0.5">{item.sku}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs ${item.isWarning ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-800"}`}>
                        {item.stock}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-500">
                      {item.price}
                    </td>
                    <td className="py-3.5 px-4 text-right pr-6 font-mono font-black text-emerald-700 text-sm">
                      {item.totalValue}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* THANH PHÂN TRANG (PAGINATION FOOTER) */}
          <div className="border-t border-slate-100 pt-4 mt-6 flex flex-col sm:flex-row gap-4 justify-between items-center text-xs font-bold text-slate-400">
            <div>
              Hiển thị <span className="text-slate-800 font-extrabold">1</span> -{" "}
              <span className="text-slate-800 font-extrabold">5</span> trong tổng số{" "}
              <span className="text-emerald-700 font-extrabold">13</span> Trang phân vùng
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Trang hiện tại:</span>
                <select className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-800 font-black outline-none cursor-pointer hover:border-slate-300">
                  <option>1</option>
                </select>
              </div>
              <div className="flex items-center gap-1">
                <button className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer">
                  <ChevronLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
                <button className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer">
                  <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.main>
  );
}