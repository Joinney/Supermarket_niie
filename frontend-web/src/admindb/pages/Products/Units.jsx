import React, { useState, useEffect } from "react";
import axios from "axios";
import { Box, Plus, Edit, Trash2, Loader2 } from "lucide-react";

export default function Units() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUnits = async () => {
    try {
      const apiUrl =
        import.meta.env.VITE_API_PRODUCT_URL || "http://localhost:5002";
      const res = await axios.get(`${apiUrl}/api/products/units`);
      setUnits(res.data);
    } catch (error) {
      console.error("Lỗi tải đơn vị:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  const handleAddUnit = async () => {
    const newUnit = window.prompt(
      "Nhập tên quy chuẩn đóng gói mới (VD: Bịch, Lốc, Thùng...):",
    );
    if (newUnit && newUnit.trim()) {
      try {
        const apiUrl =
          import.meta.env.VITE_API_PRODUCT_URL || "http://localhost:5002";
        await axios.post(`${apiUrl}/api/products/units`, {
          ten_don_vi: newUnit.trim(),
        });
        fetchUnits(); // Load lại bảng sau khi thêm
      } catch (error) {
        alert("Lỗi khi thêm đơn vị mới!");
      }
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto font-sans">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Box className="text-[#006c49]" /> Quản lý Đơn vị đóng gói
          </h1>
          <p className="text-xs text-slate-500 font-bold mt-1">
            Danh sách các quy chuẩn lưu kho và bán hàng
          </p>
        </div>
        <button
          onClick={handleAddUnit}
          className="bg-[#006c49] hover:bg-[#005137] text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition active:scale-95 shadow-md"
        >
          <Plus size={16} /> Thêm đơn vị mới
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 flex justify-center text-[#006c49]">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/80 border-b border-gray-100 text-[11px] font-black text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="py-4 px-6 w-20">ID</th>
                <th className="py-4 px-6">Tên đơn vị</th>
                <th className="py-4 px-6">Mô tả</th>
                <th className="py-4 px-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm font-bold text-slate-700">
              {units.length > 0 ? (
                units.map((u, i) => (
                  <tr key={u.id || i} className="hover:bg-slate-50 transition">
                    <td className="py-4 px-6 text-slate-400">#{u.id}</td>
                    <td className="py-4 px-6 text-[#006c49]">{u.ten_don_vi}</td>
                    <td className="py-4 px-6 text-xs text-slate-500 font-medium">
                      {u.mo_ta || "---"}
                    </td>
                    <td className="py-4 px-6 flex items-center justify-end gap-2">
                      <button className="p-2 bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-700 rounded-lg transition">
                        <Edit size={14} />
                      </button>
                      <button className="p-2 bg-slate-100 text-slate-600 hover:bg-rose-100 hover:text-rose-700 rounded-lg transition">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="4"
                    className="py-8 text-center text-slate-400 text-xs"
                  >
                    Chưa có dữ liệu đơn vị.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
