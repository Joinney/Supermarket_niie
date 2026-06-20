import React, { useState } from "react"; // 🌟 SỬA LỖI: Đã thêm useState vào đây
import { motion } from "framer-motion"; 

// Mock data mẫu dựa trên hình ảnh image_afed46.png
const initialProducts = [
  { id: "BT000004", name: "Cà rốt Baby Đà Lạt", category: "Rau củ quả", status: "Active", image: "https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=80&auto=format&fit=crop&q=60" }, 
  { id: "BT000005", name: "Dâu tây giống Mỹ", category: "Trái cây cao cấp", status: "Active", image: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=80&auto=format&fit=crop&q=60" },
  { id: "BT000006", name: "Súp lơ xanh", category: "Rau củ quả", status: "Active", image: "https://images.unsplash.com/photo-1515671029058-b839a928da00?w=80&auto=format&fit=crop&q=60" },
  { id: "BT000007", name: "Táo Envy", category: "Trái cây cao cấp", status: "Active", image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=80&auto=format&fit=crop&q=60" },
  { id: "BT000008", name: "Nho mẫu đơn", category: "Trái cây cao cấp", status: "Active", image: "https://images.unsplash.com/photo-1537084642907-629340c7e59c?w=80&auto=format&fit=crop&q=60" },
  { id: "BT000009", name: "Bắp cải tím", category: "Rau củ quả", status: "Active", image: "https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=80&auto=format&fit=crop&q=60" },
];

export default function ProductList() {
  const [searchTerm, setSearchTerm] = useState("");

  // TỐI ƯU: Lọc sản phẩm theo ID hoặc Tên ngay trên giao diện khi gõ ô Search
  const filteredProducts = initialProducts.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 bg-[#f8f9fa] min-h-screen p-6 md:p-8 font-sans text-left">
      
      {/* TIÊU ĐỀ & BREADCRUMB & NÚT THÊM */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Danh sách sản phẩm</h1>
          <div className="flex items-center gap-2 text-sm text-gray-400 mt-1 font-medium">
            <span>Dashboard</span>
            <span>❯</span>
            <span className="text-[#006c49] font-semibold">Danh sách sản phẩm</span>
          </div>
        </div>
        
        <button className="flex items-center justify-center gap-2 bg-[#006c49] hover:bg-[#00563a] text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition active:scale-95 shrink-0">
          <span className="text-base">+</span> Thêm
        </button>
      </div>

      {/* KHỐI CONTAINER CHÍNH */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        
        {/* THANH ĐIỀU KHIỂN: SEARCH & ACTIONS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          {/* Ô Tìm Kiếm */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search for id, name product"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-gray-300 focus:ring-4 focus:ring-emerald-500/5 transition"
            />
            <span className="absolute right-3.5 top-3 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </span>
          </div>

          {/* Nhóm nút chức năng */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
              Làm mới
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" /></svg>
              Lọc
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h10a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3V15" /></svg>
              Xuất
            </button>
          </div>
        </div>

        {/* BẢNG DỮ LIỆU SẢN PHẨM */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="py-4 px-4 w-12 text-center">
                  <input type="checkbox" className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer" />
                </th>
                <th className="py-4 px-4">Sản phẩm</th>
                <th className="py-4 px-4">Loại sản phẩm</th>
                <th className="py-4 px-4">Trạng thái</th>
                <th className="py-4 px-4 text-right pr-6">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredProducts.map((product, index) => (
                <tr key={index} className="group hover:bg-gray-50/50 transition">
                  {/* Checkbox */}
                  <td className="py-4 px-4 text-center">
                    <input type="checkbox" className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer" />
                  </td>
                  
                  {/* Sản phẩm kèm hình ảnh */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <img src={product.image} alt={product.name} className="w-12 h-12 rounded-xl object-cover border border-gray-100" />
                      <div>
                        <p className="text-sm font-bold text-slate-800">{product.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">ID: {product.id}</p>
                      </div>
                    </div>
                  </td>
                  
                  {/* Loại sản phẩm */}
                  <td className="py-4 px-4">
                    <span className="text-sm text-gray-600 font-medium whitespace-pre-line">{product.category}</span>
                  </td>
                  
                  {/* Trạng thái Badge */}
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-[#e1f7ed] text-[#10b981]">
                      {product.status}
                    </span>
                  </td>
                  
                  {/* Các nút Action thao tác */}
                  <td className="py-4 px-4 text-right pr-6">
                    <div className="flex items-center justify-end gap-3 text-gray-300 group-hover:text-gray-400 transition">
                      {/* Xem */}
                      <button className="hover:text-slate-700 transition" title="Xem chi tiết">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      </button>
                      {/* Sửa */}
                      <button className="hover:text-slate-700 transition" title="Chỉnh sửa">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
                      </button>
                      {/* Xóa */}
                      <button className="hover:text-red-500 transition" title="Xóa sản phẩm">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-gray-400 font-medium">
                    Không tìm thấy sản phẩm nào phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PHẦN PHÂN TRANG (PAGINATION) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-100 text-sm font-medium text-gray-500">
          <div>
            1 - {filteredProducts.length} of 13 Pages
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span>The page on</span>
              <div className="relative">
                <select className="appearance-none bg-[#f8f9fa] border border-gray-200 rounded-xl pl-3 pr-8 py-1.5 text-sm font-semibold text-gray-700 outline-none cursor-pointer focus:border-gray-300">
                  <option>1</option>
                  <option>2</option>
                </select>
                <span className="absolute right-2.5 top-2.5 text-gray-400 text-[10px] pointer-events-none">▼</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:bg-gray-50 transition">
                ❮
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:bg-gray-50 transition">
                ❯
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}