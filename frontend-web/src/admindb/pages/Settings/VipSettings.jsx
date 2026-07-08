import React, { useState, useEffect } from "react";
import { Save, Award, Loader2, Info, AlertCircle } from "lucide-react"; // 🌟 Đã fix: Bổ sung AlertCircle
import { authApi } from "../../../api/axios";

export default function VipSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const [vipConfig, setVipConfig] = useState({
    vang: 5000000,
    kimcuong: 10000000,
  });

  // 1. Tải cấu hình từ Backend (Auth Service)
  useEffect(() => {
    const fetchVipConfig = async () => {
      try {
        // 🌟 Đã fix: Thêm /auth/ vào trước để khớp với authRoutes.js của backend
        const res = await authApi.get("/auth/settings/vip");
        if (res.data && res.data.success) {
          setVipConfig({
            vang: Number(res.data.data.vang),
            kimcuong: Number(res.data.data.kimcuong),
          });
        }
      } catch (err) {
        console.error("Lỗi lấy cấu hình VIP:", err);
        setMessage({ text: "Không thể tải cấu hình hiện tại.", type: "error" });
      } finally {
        setLoading(false);
      }
    };
    fetchVipConfig();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setVipConfig((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 2. Lưu cấu hình mới
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });
    setSaving(true);

    if (Number(vipConfig.vang) >= Number(vipConfig.kimcuong)) {
      setMessage({
        text: "Lỗi: Mức chi tiêu của Hạng Kim Cương phải lớn hơn Hạng Vàng!",
        type: "error",
      });
      setSaving(false);
      return;
    }

    try {
      // 🌟 Đã fix: Thêm /auth/ vào trước
      const res = await authApi.put("/auth/settings/vip", {
        vang: Number(vipConfig.vang),
        kimcuong: Number(vipConfig.kimcuong),
      });

      if (res.data.success) {
        setMessage({
          text: "🎉 Cập nhật mốc thăng hạng thành công!",
          type: "success",
        });
      }
    } catch (err) {
      console.error("Lỗi lưu cấu hình VIP:", err);
      setMessage({
        text: err.response?.data?.message || "Lỗi hệ thống khi lưu cấu hình.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-[#006c49] font-bold">
        <Loader2 className="animate-spin mr-2" size={24} /> Đang tải cấu hình hệ
        thống...
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen text-left">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Award className="text-[#006c49]" /> Cấu hình Hạng thành viên VIP
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Thiết lập mốc tổng chi tiêu tích lũy để khách hàng được thăng hạng
            tự động.
          </p>
        </div>

        {/* Form Cấu hình */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
          <div className="bg-blue-50 border border-blue-100 text-blue-700 p-4 rounded-xl mb-8 flex gap-3 text-sm font-medium">
            <Info className="shrink-0 mt-0.5" size={18} />
            <p>
              <strong>Lưu ý quan trọng:</strong> Khi bạn thay đổi mốc tiền ở
              đây, các khách hàng đang ở hạng cao (vd: Kim Cương) sẽ{" "}
              <strong>không bị giáng cấp</strong> ngay lập tức. Cấu hình này chỉ
              áp dụng làm mốc xét duyệt cho những đơn đặt hàng mới phát sinh kể
              từ lúc này.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* HẠNG VÀNG */}
              <div className="bg-gradient-to-b from-amber-50/50 to-white border border-amber-200 p-6 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-amber-400 text-white text-[10px] font-black px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                  Mức 2
                </div>
                <h3 className="text-lg font-black text-amber-600 mb-4 flex items-center gap-2">
                  ⭐ Hạng VÀNG
                </h3>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                  Mốc chi tiêu tối thiểu (VNĐ)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="vang"
                    value={vipConfig.vang}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none font-black text-amber-700 text-lg transition shadow-sm"
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-amber-400">
                    VNĐ
                  </span>
                </div>
              </div>

              {/* HẠNG KIM CƯƠNG */}
              <div className="bg-gradient-to-b from-[#006c49]/5 to-white border border-[#006c49]/20 p-6 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-[#006c49] text-white text-[10px] font-black px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                  Mức 3 (Tối đa)
                </div>
                <h3 className="text-lg font-black text-[#006c49] mb-4 flex items-center gap-2">
                  💎 Hạng KIM CƯƠNG
                </h3>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                  Mốc chi tiêu tối thiểu (VNĐ)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="kimcuong"
                    value={vipConfig.kimcuong}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-[#006c49]/20 rounded-xl focus:ring-2 focus:ring-[#006c49]/20 focus:border-[#006c49] outline-none font-black text-[#006c49] text-lg transition shadow-sm"
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-[#006c49]/40">
                    VNĐ
                  </span>
                </div>
              </div>
            </div>

            {/* Thông báo trạng thái */}
            {message.text && (
              <div
                className={`p-4 rounded-xl text-sm font-bold flex items-center gap-2 ${message.type === "error" ? "bg-red-50 text-red-600 border border-red-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"}`}
              >
                {message.type === "error" ? (
                  <AlertCircle size={18} />
                ) : (
                  <Award size={18} />
                )}
                {message.text}
              </div>
            )}

            {/* Nút Submit */}
            <div className="pt-6 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-[#006c49] hover:bg-[#005237] text-white px-8 py-3 rounded-xl font-black uppercase tracking-wider transition-all shadow-md disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Save size={20} />
                )}
                Lưu cấu hình hệ thống
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
