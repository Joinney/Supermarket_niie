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
  Ticket,
  CheckCircle2,
} from "lucide-react";
import { promotionApi, couponApi, authApi } from "../../../api/axios.js";

const removeVietnameseTones = (str) => {
  if (!str) return "";
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  return str.toLowerCase();
};

export default function FlashSaleList() {
  // 🌟 STATE QUẢN LÝ TAB
  const [activeTab, setActiveTab] = useState("flashsale"); // 'flashsale' hoặc 'coupon'

  // State cho Flash Sale
  const [flashSales, setFlashSales] = useState([]);
  const [loadingFS, setLoadingFS] = useState(true);
  const [errorFS, setErrorFS] = useState(null);

  // 🌟 State cho Coupon
  const [coupons, setCoupons] = useState([]);
  const [loadingCoupon, setLoadingCoupon] = useState(true);
  const [errorCoupon, setErrorCoupon] = useState(null);

  const [searchKeyword, setSearchKeyword] = useState("");

  // ==========================================
  // LOGIC FLASH SALE
  // ==========================================
  const fetchFlashSales = async () => {
    try {
      setLoadingFS(true);
      const response = await promotionApi.get("/admin/flash-sale");
      if (response.data.success) setFlashSales(response.data.data);
    } catch (err) {
      setErrorFS("Không thể tải danh sách Flash Sale.");
    } finally {
      setLoadingFS(false);
    }
  };

  const toggleStatusFS = async (ma_khuyen_mai, currentStatus) => {
    try {
      const response = await promotionApi.put(
        `/admin/flash-sale/${ma_khuyen_mai}`,
        { trang_thai: !currentStatus },
      );
      if (response.data.success) fetchFlashSales();
    } catch (err) {
      alert("Lỗi khi cập nhật trạng thái Flash Sale!");
    }
  };

  const handleDeleteFS = async (ma_khuyen_mai) => {
    if (
      window.confirm(
        "Bạn có chắc chắn muốn xóa vĩnh viễn chương trình Flash Sale này?",
      )
    ) {
      try {
        const response = await promotionApi.delete(
          `/admin/flash-sale/${ma_khuyen_mai}`,
        );
        if (response.data.success) fetchFlashSales();
      } catch (err) {
        alert("Lỗi khi xóa Flash Sale!");
      }
    }
  };

  // ==========================================
  // 🌟 LOGIC COUPON
  // ==========================================
  const fetchCoupons = async () => {
    try {
      setLoadingCoupon(true);
      const response = await couponApi.get("/");
      if (response.data.success) setCoupons(response.data.data);
    } catch (err) {
      setErrorCoupon("Không thể tải danh sách Mã giảm giá.");
    } finally {
      setLoadingCoupon(false);
    }
  };

  const toggleStatusCoupon = async (id, currentStatus) => {
    try {
      const response = await couponApi.put(`/toggle/${id}`, {
        is_active: !currentStatus,
      });
      if (response.data.success) fetchCoupons();
    } catch (err) {
      alert("Lỗi khi cập nhật trạng thái Coupon!");
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa vĩnh viễn mã Voucher này?")) {
      try {
        const response = await couponApi.delete(`/${id}`);
        if (response.data.success) fetchCoupons();
      } catch (err) {
        alert("Lỗi khi xóa Voucher!");
      }
    }
  };

  // Fetch dữ liệu khi load trang
  useEffect(() => {
    fetchFlashSales();
    fetchCoupons();
  }, []);

  // ==========================================
  // HELPERS
  // ==========================================
  const getStatusBadgeFS = (fs) => {
    if (!fs.trang_thai)
      return (
        <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-xs font-bold">
          Đã tắt
        </span>
      );
    const now = new Date().getTime();
    const start = new Date(fs.thoi_gian_bat_dau).getTime();
    const end = new Date(fs.thoi_gian_ket_thuc).getTime();

    if (now < start)
      return (
        <span className="px-2.5 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1 w-max">
          <Clock size={12} /> Sắp diễn ra
        </span>
      );
    if (now >= start && now <= end)
      return (
        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1 w-max">
          <Zap size={12} className="fill-emerald-600" /> Đang chạy
        </span>
      );
    return (
      <span className="px-2.5 py-1 bg-red-50 text-red-500 border border-red-200 rounded-lg text-xs font-bold flex items-center gap-1 w-max">
        Đã kết thúc
      </span>
    );
  };

  const getStatusBadgeCoupon = (coupon) => {
    if (!coupon.is_active)
      return (
        <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-xs font-bold">
          Đã khóa
        </span>
      );
    const now = new Date().getTime();
    const start = new Date(coupon.start_date).getTime();
    const end = new Date(coupon.end_date).getTime();

    if (coupon.used_count >= coupon.usage_limit)
      return (
        <span className="px-2.5 py-1 bg-orange-50 text-orange-600 border border-orange-200 rounded-lg text-xs font-bold">
          Hết lượt
        </span>
      );
    if (now < start)
      return (
        <span className="px-2.5 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1 w-max">
          <Clock size={12} /> Sắp mở
        </span>
      );
    if (now >= start && now <= end)
      return (
        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1 w-max">
          <CheckCircle2 size={12} /> Đang chạy
        </span>
      );
    return (
      <span className="px-2.5 py-1 bg-red-50 text-red-500 border border-red-200 rounded-lg text-xs font-bold">
        Đã hết hạn
      </span>
    );
  };

  // Logic lọc dữ liệu
  const filteredFlashSales = flashSales.filter((fs) => {
    if (!searchKeyword) return true;
    const kw = removeVietnameseTones(searchKeyword);
    return (
      removeVietnameseTones(fs.ten_chuong_trinh).includes(kw) ||
      removeVietnameseTones(fs.ma_khuyen_mai).includes(kw)
    );
  });

  const filteredCoupons = coupons.filter((c) => {
    if (!searchKeyword) return true;
    const kw = removeVietnameseTones(searchKeyword);
    return (
      removeVietnameseTones(c.code).includes(kw) ||
      removeVietnameseTones(c.description).includes(kw)
    );
  });

  return (
    <div className="w-full text-gray-800 animate-fadeIn">
      {/* HEADER */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Zap className="text-[#006c49] fill-[#006c49]" /> Trung tâm Khuyến
            mãi
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            Quản lý Flash Sale và Mã giảm giá (Coupon/Voucher).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/admin/promotions/tao-moi"
            className="bg-white border-2 border-[#006c49] text-[#006c49] hover:bg-emerald-50 px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-sm"
          >
            <Zap size={16} className="fill-[#006c49]" /> Tạo Flash Sale
          </Link>
          <Link
            to="/admin/promotions/tao-coupon"
            className="bg-[#006c49] hover:bg-[#005237] text-white px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-sm"
          >
            <Ticket size={16} /> Tạo Mã Coupon
          </Link>
        </div>
      </div>

      {/* 🌟 TAB NAVIGATION */}
      <div className="flex items-center gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("flashsale")}
          className={`px-6 py-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${activeTab === "flashsale" ? "border-[#006c49] text-[#006c49]" : "border-transparent text-gray-400 hover:text-gray-600"}`}
        >
          <Zap
            size={18}
            className={activeTab === "flashsale" ? "fill-[#006c49]" : ""}
          />{" "}
          Flash Sale (Sản phẩm)
        </button>
        <button
          onClick={() => setActiveTab("coupon")}
          className={`px-6 py-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${activeTab === "coupon" ? "border-[#006c49] text-[#006c49]" : "border-transparent text-gray-400 hover:text-gray-600"}`}
        >
          <Ticket size={18} /> Mã Giảm Giá (Coupon)
        </button>
      </div>

      {/* TÌM KIẾM */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder={`Tìm theo tên hoặc mã ${activeTab === "flashsale" ? "Flash Sale" : "Coupon"}...`}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#006c49] transition-colors font-bold text-slate-700"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
        </div>
      </div>

      {/* BẢNG DỮ LIỆU */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-black uppercase tracking-wider text-[11px]">
                  Thông tin chiến dịch
                </th>
                {activeTab === "flashsale" ? (
                  <th className="px-6 py-4 font-black uppercase tracking-wider text-[11px] text-center">
                    Số sản phẩm
                  </th>
                ) : (
                  <th className="px-6 py-4 font-black uppercase tracking-wider text-[11px]">
                    Chi tiết giảm
                  </th>
                )}
                <th className="px-6 py-4 font-black uppercase tracking-wider text-[11px]">
                  Thời gian
                </th>
                {activeTab === "coupon" && (
                  <th className="px-6 py-4 font-black uppercase tracking-wider text-[11px] text-center">
                    Lượt dùng
                  </th>
                )}
                <th className="px-6 py-4 font-black uppercase tracking-wider text-[11px]">
                  Trạng thái
                </th>
                <th className="px-6 py-4 font-black uppercase tracking-wider text-[11px] text-right">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {/* RENDERING DỰA TRÊN TAB ĐANG MỞ */}
              {activeTab === "flashsale" ? (
                // ==================================
                // TAB FLASH SALE
                // ==================================
                loadingFS ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="p-8 text-center text-gray-400 font-medium"
                    >
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : errorFS ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="p-8 text-center text-red-500 font-medium"
                    >
                      <AlertCircle size={18} className="inline mr-2" />
                      {errorFS}
                    </td>
                  </tr>
                ) : filteredFlashSales.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="p-12 text-center text-gray-400 font-medium"
                    >
                      Chưa có chiến dịch Flash Sale nào.
                    </td>
                  </tr>
                ) : (
                  filteredFlashSales.map((fs) => (
                    <tr
                      key={fs.ma_khuyen_mai}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-black text-slate-800">
                          {fs.ten_chuong_trinh}
                        </p>
                        <p className="text-[11px] text-slate-400 font-bold mt-0.5">
                          {fs.ma_khuyen_mai}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg font-bold text-xs">
                          {fs.tong_san_pham} SKU
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-[11px] font-bold text-slate-600">
                          <span className="text-slate-400">Từ:</span>{" "}
                          {new Date(fs.thoi_gian_bat_dau).toLocaleString(
                            "vi-VN",
                          )}
                        </div>
                        <div className="text-[11px] font-bold text-slate-600 mt-1">
                          <span className="text-slate-400">Đến:</span>{" "}
                          {new Date(fs.thoi_gian_ket_thuc).toLocaleString(
                            "vi-VN",
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadgeFS(fs)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* 🌟 THÊM NÚT CHỈNH SỬA FLASH SALE */}
                          <Link
                            to={`/admin/promotions/sua-flashsale/${fs.ma_khuyen_mai}`}
                            className="p-2 bg-amber-50 text-amber-500 rounded-lg hover:bg-amber-100 transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit size={16} />
                          </Link>
                          <button
                            onClick={() =>
                              toggleStatusFS(fs.ma_khuyen_mai, fs.trang_thai)
                            }
                            className={`p-2 rounded-lg transition-colors ${fs.trang_thai ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}
                            title="Bật/Tắt"
                          >
                            <Power size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteFS(fs.ma_khuyen_mai)}
                            className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"
                            title="Xóa vĩnh viễn"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )
              ) : // ==================================
              // TAB COUPON
              // ==================================
              loadingCoupon ? (
                <tr>
                  <td
                    colSpan="6"
                    className="p-8 text-center text-gray-400 font-medium"
                  >
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : errorCoupon ? (
                <tr>
                  <td
                    colSpan="6"
                    className="p-8 text-center text-red-500 font-medium"
                  >
                    <AlertCircle size={18} className="inline mr-2" />
                    {errorCoupon}
                  </td>
                </tr>
              ) : filteredCoupons.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="p-12 text-center text-gray-400 font-medium"
                  >
                    Chưa có mã Coupon nào được tạo.
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((coupon) => (
                  <tr
                    key={coupon.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-black text-[#006c49] text-sm uppercase">
                        {coupon.code}
                      </p>
                      <p
                        className="text-[11px] text-slate-500 font-bold mt-1 line-clamp-1"
                        title={coupon.description}
                      >
                        {coupon.description}
                      </p>
                      {Number(coupon.min_lifetime_spent) > 0 && (
                        <span className="inline-block mt-1 text-[9px] font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase">
                          VIP Độc Quyền
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-black text-slate-800">
                        Giảm {Number(coupon.discount_value).toLocaleString()}đ
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                        Đơn tối thiểu:{" "}
                        {Number(coupon.min_order_value).toLocaleString()}đ
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[11px] font-bold text-slate-600">
                        <span className="text-slate-400">Từ:</span>{" "}
                        {new Date(coupon.start_date).toLocaleString("vi-VN")}
                      </div>
                      <div className="text-[11px] font-bold text-slate-600 mt-1">
                        <span className="text-slate-400">Đến:</span>{" "}
                        {new Date(coupon.end_date).toLocaleString("vi-VN")}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-1 w-full max-w-[100px] mx-auto">
                        <div className="flex justify-between w-full text-[10px] font-black text-slate-600">
                          <span>{coupon.used_count}</span>
                          <span>/ {coupon.usage_limit}</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[#006c49] h-full"
                            style={{
                              width: `${Math.min((coupon.used_count / coupon.usage_limit) * 100, 100)}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadgeCoupon(coupon)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* 🌟 THÊM NÚT CHỈNH SỬA COUPON */}
                        <Link
                          to={`/admin/promotions/sua-coupon/${coupon.id}`}
                          className="p-2 bg-amber-50 text-amber-500 rounded-lg hover:bg-amber-100 transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit size={16} />
                        </Link>
                        <button
                          onClick={() =>
                            toggleStatusCoupon(coupon.id, coupon.is_active)
                          }
                          className={`p-2 rounded-lg transition-colors ${coupon.is_active ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}
                          title="Bật/Tắt mã"
                        >
                          <Power size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteCoupon(coupon.id)}
                          className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"
                          title="Xóa vĩnh viễn"
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
