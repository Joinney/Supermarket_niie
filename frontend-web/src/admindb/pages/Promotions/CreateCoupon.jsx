import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Ticket,
  Save,
  ArrowLeft,
  Loader2,
  Info,
  AlertTriangle,
} from "lucide-react";
import { authApi } from "../../../api/axios";

export default function CreateCoupon() {
  const navigate = useNavigate();
  const { id } = useParams();

  // 🌟 Biến xác định đang ở chế độ TẠO MỚI hay CHỈNH SỬA
  const isEditMode = !!id;

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditMode);
  const [usedCount, setUsedCount] = useState(0); // Để check xem mã đã có ai dùng chưa

  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discount_amount: 0,
    min_order_value: 0,
    min_lifetime_spent: 0,
    usage_limit: 1000,
    user_usage_limit: 1,
    start_date: new Date().toISOString().slice(0, 16),
    end_date: "",
  });

  // 🌟 NẾU LÀ CHẾ ĐỘ CHỈNH SỬA -> FETCH DỮ LIỆU CŨ TỪ BACKEND
  useEffect(() => {
    if (isEditMode) {
      const fetchCouponDetail = async () => {
        try {
          const res = await authApi.get(
            `http://localhost:5007/api/coupons/${id}`,
          );
          if (res.data.success) {
            const data = res.data.data;

            // Hàm convert thời gian chuẩn cho thẻ input datetime-local
            const formatTime = (timeStr) => {
              if (!timeStr) return "";
              const date = new Date(timeStr);
              const offset = date.getTimezoneOffset() * 60000;
              return new Date(date - offset).toISOString().slice(0, 16);
            };

            setFormData({
              code: data.code,
              description: data.description || "",
              discount_amount: data.discount_value || 0, // Backend lưu là discount_value
              min_order_value: data.min_order_value || 0,
              min_lifetime_spent: data.min_lifetime_spent || 0,
              usage_limit: data.usage_limit || 1000,
              user_usage_limit: data.user_usage_limit || 1,
              start_date: formatTime(data.start_date),
              end_date: formatTime(data.end_date),
            });

            // Lưu lại số lượt đã dùng để khóa form nếu cần
            setUsedCount(data.used_count || 0);
          }
        } catch (error) {
          console.error("Lỗi lấy chi tiết mã:", error);
          alert("Không thể tải thông tin mã giảm giá này!");
          navigate("/admin/promotions");
        } finally {
          setIsFetching(false);
        }
      };

      fetchCouponDetail();
    }
  }, [id, isEditMode, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.discount_amount || !formData.end_date) {
      alert("Vui lòng điền đầy đủ các thông tin bắt buộc!");
      return;
    }

    if (Number(formData.user_usage_limit) > Number(formData.usage_limit)) {
      alert(
        "Lỗi: Giới hạn cá nhân không thể lớn hơn Tổng số lượng mã phát hành!",
      );
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        code: formData.code.toUpperCase().trim(),
        discount_amount: Number(formData.discount_amount),
        min_order_value: Number(formData.min_order_value),
        min_lifetime_spent: Number(formData.min_lifetime_spent),
        usage_limit: Number(formData.usage_limit),
        user_usage_limit: Number(formData.user_usage_limit),
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
      };

      let res;
      if (isEditMode) {
        // GỌI API PUT ĐỂ UPDATE
        res = await authApi.put(
          `http://localhost:5007/api/coupons/${id}`,
          payload,
        );
      } else {
        // GỌI API POST ĐỂ TẠO MỚI
        res = await authApi.post(
          "http://localhost:5007/api/coupons/create",
          payload,
        );
      }

      if (res.data.success) {
        alert(
          `🎉 Đã ${isEditMode ? "cập nhật" : "phát hành"} mã khuyến mãi thành công!`,
        );
        navigate("/admin/promotions"); // Quay về tab coupon
      }
    } catch (err) {
      console.error("Lỗi thao tác Coupon:", err);
      alert(err.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-gray-500">
        <Loader2 size={40} className="animate-spin text-[#006c49] mb-4" />
        <p>Đang tải dữ liệu mã giảm giá...</p>
      </div>
    );
  }

  // 🌟 Logic: Khóa form nếu mã đã có người sử dụng
  const isLocked = isEditMode && usedCount > 0;

  return (
    <div className="p-6 bg-slate-50 min-h-screen text-left">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/admin/promotions")}
              className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-100 transition"
            >
              <ArrowLeft size={20} className="text-slate-600" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                <Ticket className="text-[#006c49]" />
                {isEditMode
                  ? "Chỉnh sửa mã Voucher"
                  : "Phát hành mã Voucher mới"}
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                {isEditMode
                  ? "Cập nhật lại điều kiện và thời gian của mã."
                  : "Thiết lập điều kiện áp dụng và giới hạn lượt dùng mã."}
              </p>
            </div>
          </div>
        </div>

        {/* 🌟 CẢNH BÁO NẾU MÃ ĐÃ CÓ NGƯỜI DÙNG -> KHÔNG CHO SỬA NỮA */}
        {isLocked && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-start gap-3 shadow-sm animate-fadeIn">
            <AlertTriangle className="shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="font-black">Không thể chỉnh sửa mã này!</h4>
              <p className="text-sm mt-1 font-medium">
                Mã giảm giá này đã có <b>{usedCount} khách hàng</b> sử dụng
                thành công. Để đảm bảo tính minh bạch đối soát dòng tiền, hệ
                thống đã khóa chức năng chỉnh sửa. Vui lòng xóa/tắt mã này đi và
                tạo một mã mới nếu muốn thay đổi chính sách.
              </p>
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 space-y-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* THÔNG TIN CƠ BẢN */}
            <div className="space-y-5">
              <h3 className="text-lg font-black text-[#006c49] border-b pb-2">
                1. Thông tin cơ bản
              </h3>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Mã Voucher (Code) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="code"
                  placeholder="VD: DEMIVIP50"
                  value={formData.code}
                  onChange={handleChange}
                  disabled={isLocked}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#006c49]/20 focus:border-[#006c49] outline-none font-bold uppercase transition disabled:opacity-60"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Mô tả hiển thị cho khách
                </label>
                <textarea
                  name="description"
                  placeholder="Giảm 50K cho hóa đơn từ 200K..."
                  value={formData.description}
                  onChange={handleChange}
                  disabled={isLocked}
                  rows="2"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#006c49]/20 focus:border-[#006c49] outline-none font-medium transition resize-none disabled:opacity-60"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Mức giảm giá (VNĐ) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="discount_amount"
                    value={formData.discount_amount}
                    onChange={handleChange}
                    disabled={isLocked}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#006c49]/20 focus:border-[#006c49] outline-none font-black text-[#006c49] disabled:opacity-60"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Đơn tối thiểu (VNĐ)
                  </label>
                  <input
                    type="number"
                    name="min_order_value"
                    value={formData.min_order_value}
                    onChange={handleChange}
                    disabled={isLocked}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#006c49]/20 focus:border-[#006c49] outline-none font-bold text-slate-700 disabled:opacity-60"
                  />
                </div>
              </div>
            </div>

            {/* ĐIỀU KIỆN ÁP DỤNG & VIP */}
            <div className="space-y-5">
              <h3 className="text-lg font-black text-[#006c49] border-b pb-2">
                2. Giới hạn & Điều kiện VIP
              </h3>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Hạng thành viên áp dụng
                </label>
                <select
                  name="min_lifetime_spent"
                  value={formData.min_lifetime_spent}
                  onChange={handleChange}
                  disabled={isLocked}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#006c49]/20 focus:border-[#006c49] outline-none font-bold text-slate-700 cursor-pointer disabled:opacity-60"
                >
                  <option value={0}>
                    🛒 Tất cả mọi người (Bạc, Vàng, Kim Cương)
                  </option>
                  <option value={5000000}>
                    ⭐ Dành riêng cho hạng VÀNG trở lên
                  </option>
                  <option value={10000000}>
                    💎 Đặc quyền riêng cho hạng KIM CƯƠNG
                  </option>
                </select>
                <p className="flex items-center gap-1.5 mt-1.5 text-xs font-semibold text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-100">
                  <Info size={14} /> Mã sẽ bị ẩn đối với khách hàng không đủ
                  hạng.
                </p>
              </div>

              {/* KHU VỰC THIẾT LẬP GIỚI HẠN */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Tổng phát hành
                  </label>
                  <input
                    type="number"
                    name="usage_limit"
                    value={formData.usage_limit}
                    onChange={handleChange}
                    disabled={isLocked}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#006c49]/20 focus:border-[#006c49] outline-none font-bold text-slate-700 disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1 text-emerald-700">
                    Tối đa/Khách
                  </label>
                  <input
                    type="number"
                    name="user_usage_limit"
                    value={formData.user_usage_limit}
                    onChange={handleChange}
                    disabled={isLocked}
                    className="w-full px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-[#006c49]/20 focus:border-[#006c49] outline-none font-black text-emerald-700 disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Ngày bắt đầu
                  </label>
                  <input
                    type="datetime-local"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleChange}
                    disabled={isLocked}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-bold disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Ngày kết thúc <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleChange}
                    disabled={isLocked}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-bold disabled:opacity-60"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={isLoading || isLocked}
              className="flex items-center gap-2 bg-[#006c49] hover:bg-[#005237] text-white px-8 py-3 rounded-xl font-black uppercase tracking-wider transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Save size={20} />
              )}
              {isEditMode ? "Cập nhật mã" : "Lưu / Phát hành mã"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
