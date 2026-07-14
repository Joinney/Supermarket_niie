import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Award, Loader2, Info, AlertCircle } from "lucide-react"; 
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
        setLoading(true);
        const res = await authApi.get("/auth/settings/vip");
        if (res.data && res.data.success) {
          setVipConfig({
            vang: Number(res.data.data.vang),
            kimcuong: Number(res.data.data.kimcuong),
          });
        }
      } catch (err) {
        console.error("Lỗi lấy cấu hình VIP:", err);
        setMessage({ text: "Không thể nạp dữ liệu mốc cấu hình hiện tại từ máy chủ!", type: "error" });
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
        text: "Lỗi cấu trúc: Mức chi tiêu của Hạng Kim Cương phải lớn hơn Hạng Vàng!",
        type: "error",
      });
      setSaving(false);
      return;
    }

    try {
      const res = await authApi.put("/auth/settings/vip", {
        vang: Number(vipConfig.vang),
        kimcuong: Number(vipConfig.kimcuong),
      });

      if (res.data.success) {
        setMessage({
          text: "Cập nhật mốc thăng hạng thành viên tự động thành công!",
          type: "success",
        });
      }
    } catch (err) {
      console.error("Lỗi lưu cấu hình VIP:", err);
      setMessage({
        text: err.response?.data?.message || "Lỗi đồng bộ hệ thống khi lưu cấu hình.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-10 flex justify-center text-emerald-600 font-bold text-sm animate-pulse">
        <Loader2 className="animate-spin mr-2" size={20} /> Đang nạp dữ liệu cấu hình hệ thống...
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      /* 🌟 ĐỒNG BỘ HOÀN HẢO: Trải phẳng bằng p-1, màu nền #fafafa giống hệt file Dashboard */
      className="w-full min-h-screen bg-[#fafafa] font-sans text-left text-slate-700 selection:bg-emerald-100 p-1 antialiased overflow-y-auto"
    >
      <div className="w-full">
        {/* ---------------- HEADER AREA ---------------- */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Cấu hình Hạng VIP
            </h1>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mt-1 select-none">
              <span>Tổng hành dinh</span>
              <span>❯</span>
              <span>Cấu hình chung</span>
              <span>❯</span>
              <span className="text-emerald-700 font-bold">Mốc thành viên VIP</span>
            </div>
          </div>
        </div>

        {/* ---------------- FORM CONTENT BLOCK ---------------- */}
        <div className="w-full bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100 relative">
          
          {/* Hộp thông tin ghi chú nghiệp vụ */}
          <div className="bg-blue-50/50 border border-blue-100/60 text-blue-700 p-4 rounded-xl mb-6 flex gap-3 text-xs font-semibold leading-relaxed">
            <Info className="shrink-0 mt-0.5 text-blue-500" size={16} />
            <p>
              <strong className="text-blue-900">Lưu ý nghiệp vụ vận hành:</strong> Khi bạn thay đổi mốc tiền chi tiêu tích lũy ở đây, các khách hàng hiện tại đang ở hạng cao (Ví dụ: Kim Cương) sẽ <strong className="text-blue-900">không bị giáng cấp ngược</strong> ngay lập tức. Cấu hình phân vị thăng hạng này chỉ áp dụng làm mốc xét duyệt thăng hạng tự động cho những hóa đơn đặt hàng mới phát sinh kể từ lúc này.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* CARD: HẠNG VÀNG */}
              <div className="bg-gradient-to-b from-amber-50/20 to-white border border-amber-200/60 p-5 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-amber-400 text-white text-[9px] font-black px-2.5 py-0.5 rounded-bl-lg uppercase tracking-wider select-none">
                  Mức 2
                </div>
                <h3 className="text-base font-black text-amber-600 mb-4 flex items-center gap-1.5 select-none">
                  ⭐ Hạng VÀNG
                </h3>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Mốc chi tiêu tối thiểu cấu thành (VNĐ)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="vang"
                      value={vipConfig.vang}
                      onChange={handleChange}
                      className="w-full pl-4 pr-14 py-2 bg-slate-50 border border-amber-200/80 rounded-xl font-mono font-black text-amber-700 text-base outline-none focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition shadow-xs"
                      required
                    />
                    <span className="absolute right-4 top-2 text-xs font-bold text-amber-500/60 select-none">
                      VNĐ
                    </span>
                  </div>
                </div>
              </div>

              {/* CARD: HẠNG KIM CƯƠNG */}
              <div className="bg-gradient-to-b from-emerald-50/10 to-white border border-emerald-100 p-5 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-emerald-700 text-white text-[9px] font-black px-2.5 py-0.5 rounded-bl-lg uppercase tracking-wider select-none">
                  Mức 3 (Tối đa)
                </div>
                <h3 className="text-base font-black text-emerald-700 mb-4 flex items-center gap-1.5 select-none">
                  💎 Hạng KIM CƯƠNG
                </h3>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Mốc chi tiêu tối thiểu cấu thành (VNĐ)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="kimcuong"
                      value={vipConfig.kimcuong}
                      onChange={handleChange}
                      className="w-full pl-4 pr-14 py-2 bg-slate-50 border border-emerald-200/60 rounded-xl font-mono font-black text-emerald-700 text-base outline-none focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-50 transition shadow-xs"
                      required
                    />
                    <span className="absolute right-4 top-2 text-xs font-bold text-emerald-600/60 select-none">
                      VNĐ
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Thông báo trạng thái phản hồi biểu mẫu */}
            {message.text && (
              <div
                className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 border ${
                  message.type === "error" 
                    ? "bg-red-50 text-red-600 border-red-100" 
                    : "bg-emerald-50 text-emerald-700 border-emerald-100"
                }`}
              >
                {message.type === "error" ? (
                  <AlertCircle size={16} className="shrink-0" />
                ) : (
                  <Award size={16} className="shrink-0" />
                )}
                {message.text}
              </div>
            )}

            {/* Thanh điều khiển xác nhận */}
            <div className="pt-4 border-t border-slate-100 flex justify-end text-xs font-bold">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 rounded-xl uppercase tracking-wider shadow-sm hover:shadow transition transform active:scale-98 shrink-0 cursor-pointer"
              >
                {saving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                Lưu cấu hình hệ thống
              </button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
}