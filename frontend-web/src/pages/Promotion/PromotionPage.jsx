import React, { useState, useEffect } from "react";
import { Timer, Zap, Flame, Clock, Sparkles, ChevronRight } from "lucide-react";
import { promotionApi } from "../../api/axios";
import ProductCard from "../../components/Product/ProductCard";

export default function Promotion() {
  const [flashSaleData, setFlashSaleData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Đồng hồ nhịp tim
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch API Flash Sale
  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchFlashSale = async () => {
      try {
        setLoading(true);
        const response = await promotionApi.get("/client/flash-sale/active");
        if (response.data && response.data.success) {
          setFlashSaleData(response.data.data);
        }
      } catch (err) {
        console.error("Lỗi tải trang Khuyến mãi:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFlashSale();
  }, []);

  // Lọc chiến dịch đang & sắp diễn ra
  const runningPromos = flashSaleData.filter(
    (item) =>
      new Date(item.chuong_trinh.thoi_gian_bat_dau) <= currentTime &&
      new Date(item.chuong_trinh.thoi_gian_ket_thuc) >= currentTime
  );

  const upcomingPromos = flashSaleData.filter(
    (item) => new Date(item.chuong_trinh.thoi_gian_bat_dau) > currentTime
  );

  // Format thời gian đếm ngược
  const formatTimeLeft = (endTime) => {
    const diff = new Date(endTime) - currentTime;
    if (diff <= 0) return { dd: "00", hh: "00", mm: "00", ss: "00" };
    return {
      dd: Math.floor(diff / (1000 * 60 * 60 * 24))
        .toString()
        .padStart(2, "0"),
      hh: Math.floor((diff / (1000 * 60 * 60)) % 24)
        .toString()
        .padStart(2, "0"),
      mm: Math.floor((diff / 1000 / 60) % 60)
        .toString()
        .padStart(2, "0"),
      ss: Math.floor((diff / 1000) % 60)
        .toString()
        .padStart(2, "0"),
    };
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#f05a28] border-t-transparent rounded-full animate-spin"></div>
        <p className="font-extrabold text-slate-600 tracking-wide animate-pulse">
          Đang săn siêu deal hot nhất...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24 font-sans">
      {/* BANNER / HEADER HERO */}
      <div className="bg-gradient-to-r from-[#005137] via-[#006c49] to-[#04885d] text-white py-10 px-4 mb-8 shadow-md">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-emerald-200 border border-white/10">
              <Sparkles size={14} className="animate-spin" /> Mua Nhiều Giảm Sâu
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight uppercase flex items-center justify-center md:justify-start gap-3">
              Siêu Khuyến Mãi
              <Zap size={36} className="text-yellow-400 fill-yellow-400 animate-bounce" />
            </h1>
            <p className="text-emerald-100 text-sm md:text-base font-medium max-w-lg">
              Đừng bỏ lỡ hàng ngàn ưu đãi chớp nhoáng với mức giá độc quyền giới hạn theo khung giờ!
            </p>
          </div>

          {/* Tag nhấp nháy LIVE SALE */}
          {runningPromos.length > 0 && (
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 shadow-inner">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="font-black tracking-wider uppercase text-xs md:text-sm">
                Đang có {runningPromos.length} sự kiện cực HOT
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 md:px-6 space-y-12">
        {/* ============================================== */}
        {/* KHỐI ĐANG DIỄN RA (RUNNING PROMOS) */}
        {/* ============================================== */}
        {runningPromos.length > 0 ? (
          runningPromos.map((promo, idx) => {
            const timeLeft = formatTimeLeft(
              promo.chuong_trinh.thoi_gian_ket_thuc
            );
            return (
              <section
                key={`running-${idx}`}
                className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 relative overflow-hidden"
              >
                {/* Viền gradient trên đầu card */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#f05a28] via-amber-500 to-[#006c49]"></div>

                {/* Header Chiến Dịch */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 pb-6 border-b border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-tr from-[#f05a28] to-[#ff7a52] rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
                      <Flame size={28} className="text-white fill-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight">
                        {promo.chuong_trinh.ten_chuong_trinh}
                      </h2>
                      <p className="text-xs md:text-sm text-slate-500 font-medium mt-1 flex items-center gap-1">
                        Săn deal chớp nhoáng <span className="inline-block">•</span> Số lượng có hạn
                      </p>
                    </div>
                  </div>

                  {/* Đồng hồ đếm ngược */}
                  <div className="flex items-center gap-3 bg-gradient-to-r from-orange-50 to-red-50 px-5 py-3 rounded-2xl border border-orange-100/80 shadow-xs">
                    <span className="text-xs font-extrabold text-[#f05a28] uppercase tracking-widest hidden sm:block">
                      Kết thúc sau
                    </span>
                    <div className="flex items-center gap-1.5 text-[#f05a28] font-black text-base md:text-lg">
                      {timeLeft.dd !== "00" && (
                        <>
                          <div className="bg-white px-2.5 py-1 rounded-xl shadow-xs border border-orange-100">
                            {timeLeft.dd}<span className="text-xs ml-0.5 text-slate-400 font-normal">ngày</span>
                          </div>
                          <span className="font-black text-orange-400">:</span>
                        </>
                      )}
                      <div className="bg-white px-2.5 py-1 rounded-xl shadow-xs border border-orange-100 min-w-[40px] text-center">
                        {timeLeft.hh}
                      </div>
                      <span className="font-black text-orange-400">:</span>
                      <div className="bg-white px-2.5 py-1 rounded-xl shadow-xs border border-orange-100 min-w-[40px] text-center">
                        {timeLeft.mm}
                      </div>
                      <span className="font-black text-orange-400">:</span>
                      <div className="bg-white px-2.5 py-1 rounded-xl shadow-xs border border-orange-100 min-w-[40px] text-center bg-orange-500 text-white animate-pulse">
                        {timeLeft.ss}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Danh sách sản phẩm GRID */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                  {promo.products?.map((p, pIdx) => {
                    const remaining =
                      (p.thong_tin_sale?.so_luong_gioi_han || 0) -
                      (p.thong_tin_sale?.da_ban || 0);
                    const isAlmostSoldOut = remaining <= 5 && remaining > 0;

                    return (
                      <div
                        key={`promo-${p.ma_san_pham}-${pIdx}`}
                        className="bg-white border border-slate-100 rounded-2xl p-2.5 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group"
                      >
                        <ProductCard
                          p={p}
                          categoryName="Siêu Sale"
                          categorySlug="khuyen-mai"
                        />

                        {/* Thanh tiến trình bán hàng */}
                        <div className="mt-4 px-1 pb-1">
                          <div className="flex justify-between items-center text-[11px] font-bold uppercase mb-1.5">
                            <span className="text-slate-400">
                              Đã bán {p.thong_tin_sale?.da_ban || 0}
                            </span>
                            <span className={isAlmostSoldOut ? "text-red-500 font-extrabold animate-pulse" : "text-[#f05a28]"}>
                              {isAlmostSoldOut ? "SẮP HẾT" : `CÒN ${remaining}`}
                            </span>
                          </div>
                          
                          {/* Progress Bar Container */}
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden p-0.5">
                            <div
                              className="h-full bg-gradient-to-r from-amber-400 to-[#f05a28] rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(p.thong_tin_sale?.phan_tram_da_ban || 0, 100)}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })
        ) : (
          <div className="w-full bg-white border border-slate-100 rounded-3xl py-16 px-4 flex flex-col items-center justify-center text-center shadow-xs">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
              <Zap size={32} />
            </div>
            <h3 className="font-extrabold text-slate-700 text-lg">Chưa có sự kiện Flash Sale nào đang diễn ra</h3>
            <p className="text-slate-400 text-sm mt-1 max-w-md">Hãy quay lại sau hoặc theo dõi danh sách các chương trình sắp diễn ra ở bên dưới nhé!</p>
          </div>
        )}

        {/* ============================================== */}
        {/* KHỐI SẮP DIỄN RA (UPCOMING PROMOS) */}
        {/* ============================================== */}
        {upcomingPromos.length > 0 && (
          <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 md:p-8 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-xl uppercase tracking-wider flex items-center gap-2.5 text-emerald-400">
                <Timer size={24} className="animate-pulse" /> Sắp Diễn Ra
              </h3>
              <span className="text-xs text-slate-400 font-medium hidden sm:inline-block">
                Chuẩn bị sẵn sàng để săn deal hot
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {upcomingPromos.map((promo, idx) => (
                <div
                  key={`upcoming-${idx}`}
                  className="flex items-center justify-between p-5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 hover:bg-white/10 transition-all duration-300 group"
                >
                  <div className="space-y-2">
                    <p className="font-black text-white text-base group-hover:text-emerald-300 transition-colors">
                      {promo.chuong_trinh.ten_chuong_trinh}
                    </p>
                    <div className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                      <Clock size={14} className="text-emerald-400" />
                      <span>
                        {new Date(
                          promo.chuong_trinh.thoi_gian_bat_dau
                        ).toLocaleString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                  
                  <button className="px-3 py-2 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-white border border-emerald-500/30 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 shrink-0 flex items-center gap-1">
                    Nhắc tôi <ChevronRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}