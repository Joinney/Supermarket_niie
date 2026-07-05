import React, { useState, useEffect } from "react";
import { Timer, Zap, Flame } from "lucide-react";
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

  // Gọi API lấy dữ liệu Flash Sale
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

  // Lọc chiến dịch đang diễn ra và sắp diễn ra
  const runningPromos = flashSaleData.filter(
    (item) =>
      new Date(item.chuong_trinh.thoi_gian_bat_dau) <= currentTime &&
      new Date(item.chuong_trinh.thoi_gian_ket_thuc) >= currentTime,
  );

  const upcomingPromos = flashSaleData.filter(
    (item) => new Date(item.chuong_trinh.thoi_gian_bat_dau) > currentTime,
  );

  // 🌟 ĐÃ FIX: Hàm format thời gian (Có chứa "dd")
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
      <div className="min-h-screen flex justify-center mt-20 font-bold text-slate-500">
        Đang tải siêu sale...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20 font-sans">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 pt-8 space-y-10">
        {/* ============================================== */}
        {/* HEADER GỌN GÀNG TINH TẾ CHUẨN DEMI MART */}
        {/* ============================================== */}
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
          <div className="w-1.5 h-6 bg-[#006c49] rounded-full"></div>
          <h1 className="text-2xl font-black text-[#161b22] tracking-tight uppercase flex items-center gap-2">
            Siêu Khuyến Mãi{" "}
            <Zap size={24} className="text-[#f05a28] fill-[#f05a28]" />
          </h1>
        </div>

        {/* ============================================== */}
        {/* KHỐI ĐANG DIỄN RA */}
        {/* ============================================== */}
        {runningPromos.length > 0 ? (
          runningPromos.map((promo, idx) => {
            const timeLeft = formatTimeLeft(
              promo.chuong_trinh.thoi_gian_ket_thuc,
            );
            return (
              <div
                key={`running-${idx}`}
                className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm border border-slate-100"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#f05a28] to-[#ea580c] rounded-2xl flex items-center justify-center shadow-md">
                      <Flame size={24} className="text-white fill-white/20" />
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-black text-[#161b22] uppercase tracking-tight">
                        {promo.chuong_trinh.ten_chuong_trinh}
                      </h2>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Săn deal chớp nhoáng - Số lượng có hạn
                      </p>
                    </div>
                  </div>

                  {/* 🌟 ĐÃ FIX: Đưa timeLeft.dd ra giao diện Đồng hồ đếm ngược */}
                  <div className="flex items-center gap-3 bg-[#fff1f0] px-5 py-2.5 rounded-2xl border border-orange-100">
                    <span className="text-xs font-bold text-[#f05a28] uppercase tracking-widest hidden sm:block">
                      Kết thúc sau
                    </span>
                    <div className="flex gap-1.5 text-[#f05a28] font-black text-lg items-center">
                      {timeLeft.dd !== "00" && (
                        <>
                          <span className="bg-white px-2 py-0.5 rounded-lg shadow-sm text-center">
                            {timeLeft.dd}n
                          </span>
                          <span className="text-[#f05a28] font-black">:</span>
                        </>
                      )}
                      <span className="bg-white px-2 py-0.5 rounded-lg shadow-sm min-w-[36px] text-center">
                        {timeLeft.hh}
                      </span>
                      :
                      <span className="bg-white px-2 py-0.5 rounded-lg shadow-sm min-w-[36px] text-center">
                        {timeLeft.mm}
                      </span>
                      :
                      <span className="bg-white px-2 py-0.5 rounded-lg shadow-sm min-w-[36px] text-center">
                        {timeLeft.ss}
                      </span>
                    </div>
                  </div>
                </div>

                {/* DANH SÁCH SẢN PHẨM DẠNG GRID */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
                  {promo.products?.map((p, pIdx) => (
                    <div
                      key={`promo-${p.ma_san_pham}-${pIdx}`}
                      className="bg-white border border-slate-100/80 rounded-[28px] p-2 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                    >
                      <ProductCard
                        p={p}
                        categoryName="Siêu Sale"
                        categorySlug="khuyen-mai"
                      />

                      {/* Thanh tiến trình bán hàng */}
                      <div className="mt-3 px-2 pb-2">
                        <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 mb-1.5">
                          <span>Đã bán {p.thong_tin_sale?.da_ban}</span>
                          <span className="text-[#f05a28]">
                            CÒN{" "}
                            {p.thong_tin_sale?.so_luong_gioi_han -
                              p.thong_tin_sale?.da_ban}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-orange-400 to-[#f05a28] rounded-full"
                            style={{
                              width: `${p.thong_tin_sale?.phan_tram_da_ban || 0}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="w-full bg-slate-50 border border-slate-100 rounded-3xl py-20 flex flex-col items-center justify-center text-slate-400">
            <p className="font-bold text-lg">
              Hiện không có đợt Sale nào đang diễn ra.
            </p>
          </div>
        )}

        {/* ============================================== */}
        {/* KHỐI SẮP DIỄN RA */}
        {/* ============================================== */}
        {upcomingPromos.length > 0 && (
          <div className="bg-blue-50/50 rounded-[32px] p-6 md:p-8 border border-blue-100 shadow-sm">
            <h3 className="font-black text-blue-900 mb-6 uppercase text-sm tracking-widest flex items-center gap-2">
              <Timer size={20} className="text-blue-500" /> Sắp diễn ra
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {upcomingPromos.map((promo, idx) => (
                <div
                  key={`upcoming-${idx}`}
                  className="flex items-center justify-between p-5 bg-white rounded-2xl border border-blue-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div>
                    <p className="font-black text-blue-900 text-base">
                      {promo.chuong_trinh.ten_chuong_trinh}
                    </p>
                    <p className="text-xs font-bold text-slate-500 mt-1 flex items-center gap-1.5">
                      Bắt đầu lúc:{" "}
                      <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {new Date(
                          promo.chuong_trinh.thoi_gian_bat_dau,
                        ).toLocaleString("vi-VN")}
                      </span>
                    </p>
                  </div>
                  <span className="text-[10px] font-black bg-blue-500 text-white px-3 py-1.5 rounded-xl uppercase tracking-widest shadow-sm">
                    Sắp tới
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
