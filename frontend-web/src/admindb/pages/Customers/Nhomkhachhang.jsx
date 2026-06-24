import React, { useState } from "react";

const Nhomkhachhang = () => {
  // Dữ liệu giả lập chuẩn theo hình ảnh thiết kế "Nhóm khách hàng"
  const MOCK_GROUPS = [
    { id: "BT000004", name: "Nhóm a1", description: "Thanh long Xuân Hạ", createdAt: "28/03/26\nat 8:25 PM", updatedAt: "28/03/26\nat 8:25 PM" },
    { id: "BT000005", name: "Nhóm a1", description: "Thanh long Xuân Hạ", createdAt: "28/03/26\nat 8:25 PM", updatedAt: "28/03/26\nat 8:25 PM" },
    { id: "BT000006", name: "Nhóm a1", description: "Thanh long Xuân Hạ", createdAt: "28/03/26\nat 8:25 PM", updatedAt: "28/03/26\nat 8:25 PM" },
    { id: "BT000007", name: "Nhóm a1", description: "Thanh long Xuân Hạ", createdAt: "28/03/26\nat 8:25 PM", updatedAt: "28/03/26\nat 8:25 PM" },
    { id: "BT000007_2", displayId: "BT000007", name: "Nhóm a1", description: "Thanh long Xuân Hạ", createdAt: "28/03/26\nat 8:25 PM", updatedAt: "28/03/26\nat 8:25 PM" },
  ];

  const [selectedIds, setSelectedIds] = useState(["BT000004"]); // Mặc định tick dòng đầu như ảnh

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(MOCK_GROUPS.map((g) => g.id));
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

  return (
    <div className="w-full min-h-screen bg-[#fafafa] font-sans text-gray-800 antialiased">
      {/* Tiêu đề & Nút thêm */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Nhóm khách hàng</h1>
          <nav className="text-sm text-gray-400 mt-1">
            Dashboard &gt; <span className="text-emerald-600 font-medium">Nhóm khách hàng</span>
          </nav>
        </div>
        <button className="bg-[#16a34a] hover:bg-[#15803d] text-white px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-1 shadow-sm transition-colors">
          <span className="text-lg leading-none">+</span> Thêm
        </button>
      </div>

      {/* Thanh công cụ tìm kiếm và lọc */}
      <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="w-full pl-3 pr-10 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 transition-colors placeholder-gray-400"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.604 10.604z" />
              </svg>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Icon Làm mới */}
          <button className="px-4 py-2 border border-gray-200 bg-white rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-2 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 text-gray-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Làm mới
          </button>
          
          {/* Icon Lọc */}
          <button className="px-4 py-2 border border-gray-200 bg-white rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-2 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 text-gray-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
            </svg>
            Lọc
          </button>
          
          {/* Icon Xuất */}
          <button className="px-4 py-2 border border-gray-200 bg-white rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-2 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 text-gray-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            Xuất
          </button>
        </div>
      </div>

      {/* Bảng hiển thị danh sách */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                <th className="py-4 px-6 w-12 text-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    onChange={handleSelectAll}
                    checked={selectedIds.length === MOCK_GROUPS.length}
                  />
                </th>
                <th className="py-4 px-6">Tên nhóm</th>
                <th className="py-4 px-6">Mô tả</th>
                <th className="py-4 px-6 text-center">Ngày tạo</th>
                <th className="py-4 px-6 text-center">Cập nhật</th>
                <th className="py-4 px-6 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
              {MOCK_GROUPS.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-4 px-6 text-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                      checked={selectedIds.includes(row.id)}
                      onChange={() => handleSelectRow(row.id)}
                    />
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-gray-800 font-semibold">{row.name}</div>
                    <div className="text-xs text-blue-400 font-normal mt-0.5">ID: {row.displayId || row.id}</div>
                  </td>
                  <td className="py-4 px-6 text-gray-500 font-normal">{row.description}</td>
                  <td className="py-4 px-6 text-center text-gray-500 font-normal whitespace-pre-line leading-relaxed">
                    {row.createdAt}
                  </td>
                  <td className="py-4 px-6 text-center text-gray-500 font-normal whitespace-pre-line leading-relaxed">
                    {row.updatedAt}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex items-center justify-center gap-4 text-gray-300">
                      {/* Icon Sửa - Pencil Outline Line */}
                      <button className="hover:text-amber-500 transition-colors" title="Sửa">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                      </button>

                      {/* Icon Xóa - Trash Outline Line */}
                      <button className="hover:text-rose-500 transition-colors" title="Xóa">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
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
        <div className="p-4 bg-white border-t border-gray-50 flex items-center justify-between text-xs text-gray-400 font-medium flex-wrap gap-4">
          <div>1 - 10 of 13 Pages</div>
          <div className="flex items-center gap-4 text-gray-500">
            <div className="flex items-center gap-2">
              <span>The page on</span>
              <div className="relative">
                <select className="appearance-none border border-gray-200 rounded pl-3 pr-8 py-1 bg-white text-gray-700 outline-none font-medium cursor-pointer">
                  <option>1</option>
                </select>
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-[10px]">▼</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button className="p-1.5 border border-gray-200 rounded hover:bg-gray-50 text-gray-300 cursor-not-allowed flex items-center justify-center" disabled>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button className="p-1.5 border border-gray-200 rounded hover:bg-gray-50 text-gray-600 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Nhomkhachhang;