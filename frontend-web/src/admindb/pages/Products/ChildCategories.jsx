import React, { useState, useEffect } from "react";
import axios from "axios";
import { Layers, Plus, Edit, Trash2, Loader2 } from "lucide-react";

export default function ParentCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const apiUrl =
          import.meta.env.VITE_API_PRODUCT_URL || "http://localhost:5002";
        // Điều chỉnh lại URL API theo đúng backend của bạn
        const res = await axios.get(`${apiUrl}/api/products/categories`);
        // Lọc lấy danh mục cha (Giả sử danh mục cha không có parent_id hoặc theo logic DB của bạn)
        const parentData = res.data.filter((c) => !c.ma_danh_muc_cha);
        setCategories(parentData.length > 0 ? parentData : res.data);
      } catch (error) {
        console.error("Lỗi tải danh mục cha:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto font-sans">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Layers className="text-[#006c49]" /> Danh mục Cha
          </h1>
          <p className="text-xs text-slate-500 font-bold mt-1">
            Phân loại sản phẩm cấp 1
          </p>
        </div>
        <button className="bg-[#006c49] hover:bg-[#005137] text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition active:scale-95 shadow-md">
          <Plus size={16} /> Thêm Danh mục
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
                <th className="py-4 px-6 w-32">Mã DM</th>
                <th className="py-4 px-6">Tên danh mục</th>
                <th className="py-4 px-6 text-center">Trạng thái</th>
                <th className="py-4 px-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm font-bold text-slate-700">
              {categories.map((c, i) => (
                <tr key={i} className="hover:bg-slate-50 transition">
                  <td className="py-4 px-6 text-slate-400 font-mono text-xs">
                    {c.ma_danh_muc || `DM00${i + 1}`}
                  </td>
                  <td className="py-4 px-6 text-slate-900">
                    {c.ten_danh_muc || c.name}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="bg-emerald-100 text-[#006c49] px-2.5 py-1 rounded-md text-[10px] uppercase">
                      Hoạt động
                    </span>
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
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
