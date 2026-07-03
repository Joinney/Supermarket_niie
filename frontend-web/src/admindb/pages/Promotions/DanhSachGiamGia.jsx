import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Edit,
  Trash2,
  Power,
  Clock,
  Search,
  Zap,
  AlertCircle,
} from "lucide-react";
import { promotionApi, productApi } from "../../../api/axios.js";
export default function FlashSaleList() {
  const [flashSales, setFlashSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFlashSales = async () => {
    try {
      setLoading(true);
      const response = await promotionApi.get("/admin/flash-sale");
      if (response.data.success) {
        setFlashSales(response.data.data);
      }
    } catch (err) {
      setError("Không thể tải danh sách Khuyến mãi.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlashSales();
  }, []);

  // Hàm thay đổi trạng thái (Bật/Tắt) nhanh
  const toggleStatus = async (ma_khuyen_mai, currentStatus) => {
    try {
      const response = await promotionApi.put(
        `/admin/flash-sale/${ma_khuyen_mai}`,
        {
          trang_thai: !currentStatus,
        },
      );
      if (response.data.success) {
        fetchFlashSales(); // Load lại data
      }
    } catch (err) {
      alert("Lỗi khi cập nhật trạng thái!");
    }
  };

  // Hàm xóa chương trình
  const handleDelete = async (ma_khuyen_mai) => {
    if (
      window.confirm(
        "Bạn có chắc chắn muốn xóa vĩnh viễn chương trình này? Mọi sản phẩm trong chương trình cũng sẽ bị xóa khỏi đợt giảm giá.",
      )
    ) {
      try {
        const response = await promotionApi.delete(
          `/admin/flash-sale/${ma_khuyen_mai}`,
        );
        if (response.data.success) {
          fetchFlashSales();
        }
      } catch (err) {
        alert("Lỗi khi xóa chương trình!");
      }
    }
  };

  // Hàm check trạng thái chương trình dựa trên thời gian thực tế
  const getStatusBadge = (fs) => {
    if (!fs.trang_thai)
      return (
        <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-xs font-bold">
          Đã tắt
        </span>
      );

    const now = new Date();
    const start = new Date(fs.thoi_gian_bat_dau);
    const end = new Date(fs.thoi_gian_ket_thuc);

    if (now < start) {
      return (
        <span className="px-2.5 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1 w-max">
          <Clock size={12} /> Sắp diễn ra
        </span>
      );
    } else if (now >= start && now <= end) {
      return (
        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1 w-max">
          <Zap size={12} className="fill-emerald-600" /> Đang chạy
        </span>
      );
    } else {
      return (
        <span className="px-2.5 py-1 bg-red-50 text-red-500 border border-red-200 rounded-lg text-xs font-bold flex items-center gap-1 w-max">
          Đã kết thúc
        </span>
      );
    }
  };

  return (
    <div className="w-full text-gray-800">
      {/* HEADER */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Zap className="text-orange-500 fill-orange-500" /> Quản lý Flash
            Sale
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            Tạo và quản lý các chiến dịch giảm giá siêu tốc.
          </p>
        </div>
        <Link
          to="/admin/promotions/tao-moi"
          className="bg-[#007A5A] hover:bg-[#006349] text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-sm"
        >
          <Plus size={18} /> Tạo chiến dịch mới
        </Link>
      </div>

      {/* TÌM KIẾM & BỘ LỌC */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Tìm theo mã hoặc tên chiến dịch..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#007A5A] transition-colors"
          />
        </div>
      </div>

      {/* BẢNG DỮ LIỆU */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/80 text-gray-500">
              <tr>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px]">
                  Thông tin chiến dịch
                </th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px]">
                  Thời gian diễn ra
                </th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px] text-center">
                  Số sản phẩm
                </th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px]">
                  Trạng thái
                </th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px] text-right">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan="5"
                    className="p-8 text-center text-gray-400 font-medium"
                  >
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan="5"
                    className="p-8 text-center text-red-500 font-medium flex items-center justify-center gap-2"
                  >
                    <AlertCircle size={18} /> {error}
                  </td>
                </tr>
              ) : flashSales.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="p-12 text-center text-gray-400 font-medium"
                  >
                    Chưa có chiến dịch nào được tạo.
                  </td>
                </tr>
              ) : (
                flashSales.map((fs) => (
                  <tr
                    key={fs.ma_khuyen_mai}
                    className="hover:bg-gray-50/50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900 text-[13px]">
                        {fs.ten_chuong_trinh}
                      </p>
                      <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                        {fs.ma_khuyen_mai}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[12px] font-medium text-gray-600">
                        <span className="text-gray-400">Từ:</span>{" "}
                        {new Date(fs.thoi_gian_bat_dau).toLocaleString("vi-VN")}
                      </div>
                      <div className="text-[12px] font-medium text-gray-600 mt-1">
                        <span className="text-gray-400">Đến:</span>{" "}
                        {new Date(fs.thoi_gian_ket_thuc).toLocaleString(
                          "vi-VN",
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full font-bold text-xs">
                        {fs.tong_san_pham} SKU
                      </span>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(fs)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() =>
                            toggleStatus(fs.ma_khuyen_mai, fs.trang_thai)
                          }
                          className={`p-2 rounded-lg transition-colors ${fs.trang_thai ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                          title={
                            fs.trang_thai ? "Tắt chiến dịch" : "Bật chiến dịch"
                          }
                        >
                          <Power size={16} />
                        </button>
                        <Link
                          to={`/admin/promotions/flash-sale/edit/${fs.ma_khuyen_mai}`}
                          className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                          title="Chỉnh sửa & Thêm sản phẩm"
                        >
                          <Edit size={16} />
                        </Link>
                        <button
                          onClick={() => handleDelete(fs.ma_khuyen_mai)}
                          className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                          title="Xóa chiến dịch"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
