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

  // Hàm format thời gian đếm ngược
  const formatTimeLeft = (endTime) => {
    const diff = new Date(endTime) - currentTime;
    if (diff <= 0) return { hh: "00", mm: "00", ss: "00" };
    return {
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
    <div className="min-h-screen bg-[#fafbfc] pb-20">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-[#f05a28] to-[#ff7e5f] text-white py-12 text-center">
        <h1 className="text-4xl font-black uppercase italic tracking-wider flex items-center justify-center gap-3">
          <Zap size={36} className="fill-white" /> Siêu Khuyến Mãi
        </h1>
        <p className="mt-2 font-medium opacity-90">
          Săn deal chớp nhoáng - Số lượng có hạn!
        </p>
      </div>

      <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-12">
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
                className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <Flame className="text-[#f05a28]" size={28} />
                    <h2 className="text-2xl font-black text-[#161b22] uppercase">
                      {promo.chuong_trinh.ten_chuong_trinh}
                    </h2>
                  </div>

                  {/* Đồng hồ đếm ngược */}
                  <div className="flex items-center gap-2 bg-[#fff1f0] px-4 py-2 rounded-xl border border-orange-100">
                    <span className="text-sm font-bold text-[#f05a28]">
                      Kết thúc sau:
                    </span>
                    <div className="flex gap-1 text-[#f05a28] font-black">
                      <span className="bg-white px-2 py-1 rounded shadow-sm">
                        {timeLeft.hh}
                      </span>
                      :
                      <span className="bg-white px-2 py-1 rounded shadow-sm">
                        {timeLeft.mm}
                      </span>
                      :
                      <span className="bg-white px-2 py-1 rounded shadow-sm">
                        {timeLeft.ss}
                      </span>
                    </div>
                  </div>
                </div>

                {/* SỬ DỤNG GRID ĐỂ SHOW HẾT SẢN PHẨM */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {promo.products?.map((p, pIdx) => (
                    <div
                      key={`promo-${p.ma_san_pham}-${pIdx}`}
                      className="border border-slate-100 rounded-[24px] p-2 hover:shadow-xl transition-all"
                    >
                      <ProductCard
                        p={p}
                        categoryName="Siêu Sale"
                        categorySlug="khuyen-mai"
                      />

                      {/* Thanh tiến trình bán hàng */}
                      <div className="mt-3 px-1">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                          <span>Đã bán {p.thong_tin_sale?.da_ban}</span>
                          <span>
                            {p.thong_tin_sale?.so_luong_gioi_han} chiếc
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full"
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
          <div className="text-center py-20 text-slate-400 font-bold">
            Hiện không có đợt Sale nào đang diễn ra.
          </div>
        )}

        {/* ============================================== */}
        {/* KHỐI SẮP DIỄN RA */}
        {/* ============================================== */}
        {upcomingPromos.length > 0 && (
          <div className="bg-blue-50/50 rounded-[32px] p-6 border border-blue-100 mt-8 shadow-sm">
            <h3 className="font-black text-blue-900 mb-5 uppercase text-sm tracking-widest flex items-center gap-2">
              <Timer size={20} className="text-blue-500" /> Sắp diễn ra
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      🚀 Bắt đầu lúc:{" "}
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
