import React, { useState, useContext, useEffect } from "react";
import {
  Ticket,
  Copy,
  Lock,
  Sparkles,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { AuthContext } from "../../../context/AuthContext";
import { authApi, orderApi, couponApi } from "../../../api/axios";

export default function Tabvoucher() {
  const { user, getMembershipTier } = useContext(AuthContext);

  // Hạng chính thức (Lấy từ Database, luôn được bảo vệ không bị rớt ngay lập tức)
  const tier = getMembershipTier ? getMembershipTier() : "BẠC";

  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  // State quản lý dữ liệu động
  const [totalSpent, setTotalSpent] = useState(0);
  const [vipThresholds, setVipThresholds] = useState({
    vang: 5000000,
    kimcuong: 10000000,
  });

  useEffect(() => {
    if (!user || String(user.role).toLowerCase() !== "buyer") {
      setLoading(false);
      return;
    }

    const fetchAllData = async () => {
      setLoading(true);
      try {
        // Tải 3 luồng dữ liệu song song cực nhanh
        const [couponRes, settingsRes, spentRes] = await Promise.all([
          couponApi.get("/").catch(() => null),

          authApi.get("/auth/settings/vip").catch((err) => {
            console.error("❌ Gọi API VIP lỗi:", err);
            return null;
          }),
          orderApi
            .get(`/orders/internal/user-spent/${user.id}`)
            .catch(() => null),
        ]);

        if (couponRes?.data?.success) {
          setCoupons(couponRes.data.data.filter((c) => c.is_active));
        }

        if (settingsRes?.data?.success) {
          setVipThresholds({
            vang: Number(settingsRes.data.data.vang),
            kimcuong: Number(settingsRes.data.data.kimcuong),
          });
        }

        if (spentRes?.data?.success) {
          setTotalSpent(Number(spentRes.data.total_spent || 0));
        }
      } catch (err) {
        console.error("Lỗi đồng bộ dữ liệu Voucher & VIP:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [user]);

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    alert(`Đã copy mã: ${code}`);
  };

  // 🌟 LOGIC TÍNH % VÀ HIỂN THỊ TRẠNG THÁI (CÓ BẢO LƯU HẠNG)
  const calculateProgress = () => {
    const tierWeight = { BẠC: 1, VÀNG: 2, "KIM CƯƠNG": 3 };
    const currentWeight = tierWeight[tier] || 1;

    // Tính hạng thực tế theo số tiền hiện tại và mốc Admin mới cài
    let actualTier = "BẠC";
    if (totalSpent >= vipThresholds.kimcuong) actualTier = "KIM CƯƠNG";
    else if (totalSpent >= vipThresholds.vang) actualTier = "VÀNG";

    const actualWeight = tierWeight[actualTier] || 1;

    let percent = 0;
    let nextTierText = "";
    let neededText = "";
    let isGracePeriod = false;

    if (currentWeight > actualWeight) {
      // 🛡️ TRẠNG THÁI BẢO LƯU: Hạng chính thức cao hơn hạng thực tế
      isGracePeriod = true;
      if (tier === "VÀNG") {
        percent = (totalSpent / vipThresholds.vang) * 100;
        nextTierText = "Duy trì VÀNG";
        neededText = `Cần ${(vipThresholds.vang - totalSpent).toLocaleString()}đ để duy trì`;
      } else if (tier === "KIM CƯƠNG") {
        percent = (totalSpent / vipThresholds.kimcuong) * 100;
        nextTierText = "Duy trì KIM CƯƠNG";
        neededText = `Cần ${(vipThresholds.kimcuong - totalSpent).toLocaleString()}đ để duy trì`;
      }
    } else {
      // 🚀 TRẠNG THÁI BÌNH THƯỜNG: Đang tiến lên hạng tiếp theo
      if (tier === "KIM CƯƠNG") {
        percent = 100;
        nextTierText = "Hạng Cao Nhất";
      } else if (tier === "VÀNG") {
        const required = vipThresholds.kimcuong - vipThresholds.vang;
        const current = totalSpent - vipThresholds.vang;
        percent = (current / required) * 100;
        nextTierText = "Lên KIM CƯƠNG";
        neededText = `Cần thêm ${(vipThresholds.kimcuong - totalSpent).toLocaleString()}đ`;
      } else {
        percent = (totalSpent / vipThresholds.vang) * 100;
        nextTierText = "Lên VÀNG";
        neededText = `Cần thêm ${(vipThresholds.vang - totalSpent).toLocaleString()}đ`;
      }
    }

    return {
      percent: Math.max(0, Math.min(100, percent)),
      nextTierText,
      neededText,
      isGracePeriod,
    };
  };

  const progressData = calculateProgress();

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. HEADER & PROGRESS BAR */}
      <div className="bg-gradient-to-r from-[#006c49] to-[#004d35] p-6 rounded-3xl text-white shadow-lg relative overflow-hidden">
        <h2 className="text-xl font-black flex items-center gap-2 mb-1">
          <Ticket size={20} /> Ưu đãi độc quyền của bạn
        </h2>

        <div className="flex justify-between items-end mb-4 relative z-10">
          <p className="text-xs opacity-80 flex flex-col gap-1">
            <span>
              Hạng hiện tại: <span className="font-bold uppercase">{tier}</span>
            </span>
            {progressData.isGracePeriod && (
              <span className="text-[9px] bg-amber-500/20 text-amber-200 px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1 font-bold">
                <ShieldAlert size={10} /> Đang bảo lưu hạng
              </span>
            )}
          </p>
          <p className="text-[11px] font-bold text-emerald-200 bg-black/20 px-2 py-1 rounded-lg shadow-inner border border-white/10">
            Đã chi tiêu: {totalSpent.toLocaleString()}đ
          </p>
        </div>

        <div className="bg-white/10 p-4 rounded-2xl border border-white/20 relative z-10">
          <div className="flex justify-between text-[10px] font-black uppercase mb-2">
            <span>Tiến độ thăng hạng</span>
            <span
              className={progressData.isGracePeriod ? "text-amber-300" : ""}
            >
              {progressData.nextTierText}
            </span>
          </div>

          <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden relative group cursor-help">
            <div
              className={`${progressData.isGracePeriod ? "bg-amber-400 shadow-[0_0_10px_#fbbf24]" : "bg-[#fea619] shadow-[0_0_10px_#fea619]"} h-full rounded-full transition-all duration-1000 ease-out`}
              style={{ width: `${progressData.percent}%` }}
            ></div>

            {progressData.neededText && (
              <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[8px] font-black text-white bg-black/60 px-2 rounded backdrop-blur-sm tracking-wider">
                  {progressData.neededText}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. GRID DANH SÁCH VOUCHER */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full flex flex-col items-center justify-center py-10 gap-2">
            <Loader2 className="animate-spin text-[#006c49]" size={28} />
            <p className="font-bold text-slate-400 text-sm">
              Đang đồng bộ dữ liệu ưu đãi...
            </p>
          </div>
        ) : coupons.length === 0 ? (
          <p className="col-span-full text-center py-10 font-bold text-slate-400 bg-white rounded-2xl border-2 border-dashed border-slate-200">
            Hiện không có mã giảm giá nào đang phát hành.
          </p>
        ) : (
          coupons.map((coupon) => {
            const reqSpent = Number(coupon.min_lifetime_spent);

            // Logic mở khóa Voucher sử dụng đúng mốc VIP động mới nhất
            const isEligible =
              tier === "KIM CƯƠNG" ||
              reqSpent === 0 ||
              (tier === "VÀNG" && reqSpent <= vipThresholds.vang);

            return (
              <div
                key={coupon.id}
                className={`p-4 rounded-2xl border-2 flex items-center justify-between transition-all duration-300 ${isEligible ? "bg-white border-emerald-100 hover:border-[#006c49] shadow-sm group" : "bg-slate-50 border-slate-200 opacity-60 grayscale-[50%]"}`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3 rounded-xl transition-colors ${isEligible ? "bg-emerald-50 text-[#006c49] group-hover:bg-[#006c49] group-hover:text-white" : "bg-slate-200 text-slate-500"}`}
                  >
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h4
                      className={`font-black text-sm ${isEligible ? "text-[#006c49]" : "text-slate-600"}`}
                    >
                      {coupon.code}
                    </h4>
                    <p
                      className="text-[10px] text-gray-500 font-bold mt-0.5 line-clamp-1"
                      title={coupon.description}
                    >
                      {coupon.description ||
                        `Giảm ${Number(coupon.discount_value).toLocaleString()}đ`}
                    </p>
                    <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold flex items-center gap-1">
                      <Lock
                        size={10}
                        className={isEligible ? "hidden" : "inline-block"}
                      />
                      HSD:{" "}
                      {new Date(coupon.end_date).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                </div>

                {isEligible ? (
                  <button
                    onClick={() => handleCopy(coupon.code)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#006c49] text-white text-[10px] font-black uppercase rounded-lg hover:bg-[#005237] transition shadow-sm active:scale-95 shrink-0"
                  >
                    <Copy size={12} /> Copy
                  </button>
                ) : (
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                      Yêu cầu hạng cao hơn
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
