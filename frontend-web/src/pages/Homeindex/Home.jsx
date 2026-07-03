import React, { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ChevronRight,
  ArrowRight,
  Star,
  QrCode,
  Zap,
  AlertCircle,
  Flame,
  Timer,
  Trophy,
  Sparkles,
  TrendingUp,
  ShoppingBag,
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { useStore } from "../../context/StoreContext";
import { productApi, promotionApi } from "../../api/axios";
import ProductCard from "../../components/Product/ProductCard";
import QuangCao from "./quangcao";

export default function Home() {
  const { t } = useLanguage();
  const { currentStore } = useStore();
  const { country_code } = useParams();

  // State cho Sản phẩm thường
  const [apiProducts, setApiProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productError, setProductError] = useState(null);

  // State riêng cho Flash Sale
  const [flashSaleData, setFlashSaleData] = useState([]);
  const [loadingFlashSale, setLoadingFlashSale] = useState(true);

  const favRef = useRef(null);

  const [activeMainTab, setActiveMainTab] = useState("recommend");
  const [activeRankTab, setActiveRankTab] = useState("best");

  // ĐỒNG HỒ "NHỊP TIM" CHUNG CHO TOÀN BỘ COMPONENT
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // LỌC DỮ LIỆU DỰA TRÊN THỜI GIAN THỰC TẾ
  const runningPromos = flashSaleData.filter(
    (item) =>
      new Date(item.chuong_trinh.thoi_gian_bat_dau) <= currentTime &&
      new Date(item.chuong_trinh.thoi_gian_ket_thuc) >= currentTime,
  );

  const upcomingPromos = flashSaleData.filter(
    (item) => new Date(item.chuong_trinh.thoi_gian_bat_dau) > currentTime,
  );

  // HÀM HỖ TRỢ HIỂN THỊ THỜI GIAN ĐẾM NGƯỢC CHO TỪNG CHƯƠNG TRÌNH
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

  // 🌟 TÁCH RỜI LUỒNG GỌI API
  useEffect(() => {
    window.scrollTo(0, 0);

    const targetCountry = country_code || currentStore?.code || "vn";

    const fetchGeneralProducts = async () => {
      try {
        setLoadingProducts(true);
        const response = await productApi.get(
          `/products?role=client&limit=12&country=${targetCountry}`,
        );
        setApiProducts(response.data);
        setProductError(null);
      } catch (err) {
        console.error("Lỗi API Sản phẩm:", err);
        setProductError(
          err.response?.data?.message || "Không thể đồng bộ dữ liệu trang chủ",
        );
      } finally {
        setLoadingProducts(false);
      }
    };

    const fetchFlashSale = async () => {
      try {
        setLoadingFlashSale(true);
        const response = await promotionApi.get("/client/flash-sale/active");
        if (response.data && response.data.success && response.data.data) {
          setFlashSaleData(response.data.data);
        } else {
          setFlashSaleData([]);
        }
      } catch (err) {
        console.error("Lỗi API Khuyến mãi:", err);
        setFlashSaleData([]);
      } finally {
        setLoadingFlashSale(false);
      }
    };

    fetchGeneralProducts();
    fetchFlashSale();
  }, [country_code, currentStore?.code]);

  // AUTO-SCROLL CAROUSEL
  useEffect(() => {
    const container = favRef.current;
    if (!container) return;

    let intervalId = null;

    const computeItemWidth = () => {
      const first = container.firstElementChild;
      if (!first) return 0;
      const gap = parseFloat(getComputedStyle(container).gap) || 0;
      return Math.round(first.getBoundingClientRect().width + gap);
    };

    let itemWidth = computeItemWidth();

    const step = () => {
      if (!container) return;
      const maxScroll = container.scrollWidth - container.clientWidth;
      if (!itemWidth) itemWidth = computeItemWidth();
      if (Math.abs(container.scrollLeft - maxScroll) < 5) {
        container.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        container.scrollBy({ left: itemWidth, behavior: "smooth" });
      }
    };

    intervalId = setInterval(step, 2000);

    const onResize = () => {
      itemWidth = computeItemWidth();
    };
    window.addEventListener("resize", onResize);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("resize", onResize);
    };
  }, [flashSaleData]);

  const getCleanProductList = () => {
    if (!apiProducts) return [];
    if (Array.isArray(apiProducts)) return apiProducts;
    if (apiProducts.data && Array.isArray(apiProducts.data))
      return apiProducts.data;
    if (apiProducts.products && Array.isArray(apiProducts.products))
      return apiProducts.products;
    return [];
  };

  const cleanProducts = getCleanProductList();

  return (
    <div className="space-y-12 pb-20 bg-[#fafbfc] font-sans pt-[10px] selection:bg-[#006c49] selection:text-white">
      <QuangCao t={t} />

      {/* ========================================================== */}
      {/* KHỐI 1: KHUYẾN MÃI NHANH (FLASH SALE) */}
      {/* ========================================================== */}
      <section className="mx-6 md:mx-10 space-y-6">
        {loadingFlashSale ? (
          <div className="h-40 bg-slate-100 rounded-[40px] animate-pulse"></div>
        ) : (
          <>
            {/* 1.1 DANH SÁCH ĐANG CHẠY */}
            {runningPromos.length > 0 ? (
              runningPromos.map((promo, idx) => {
                const timeLeft = formatTimeLeft(
                  promo.chuong_trinh.thoi_gian_ket_thuc,
                );
                return (
                  <div
                    key={idx}
                    className="bg-white border-2 border-[#f05a28] rounded-[40px] p-6 sm:p-8 shadow-[0_12px_40px_rgba(240,90,40,0.05)]"
                  >
                    <div className="flex flex-row items-center justify-between gap-4 mb-6 pb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#f05a28] rounded-full flex items-center justify-center text-white shadow-sm shadow-orange-200">
                          <Flame size={20} className="fill-white" />
                        </div>
                        <div className="flex flex-col items-start gap-1">
                          <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-black text-[#f05a28] tracking-tight uppercase italic font-sans">
                              {promo.chuong_trinh.ten_chuong_trinh ||
                                "Khuyến mãi nhanh"}
                            </h2>
                            <span className="bg-[#f05a28] text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wide">
                              GOLD DEALS
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-bold">
                            <span className="text-xs text-slate-400 font-medium">
                              Sắp kết thúc:
                            </span>
                            <div className="flex items-center gap-1 font-sans">
                              <span className="bg-white text-[#ea580c] border border-orange-100 px-2 py-0.5 rounded font-black text-xs min-w-[24px] text-center shadow-sm">
                                {timeLeft.hh}
                              </span>
                              <span className="text-[#ea580c] font-black text-xs">
                                :
                              </span>
                              <span className="bg-white text-[#ea580c] border border-orange-100 px-2 py-0.5 rounded font-black text-xs min-w-[24px] text-center shadow-sm">
                                {timeLeft.mm}
                              </span>
                              <span className="text-[#ea580c] font-black text-xs">
                                :
                              </span>
                              <span className="bg-white text-[#ea580c] border border-orange-100 px-2 py-0.5 rounded font-black text-xs min-w-[24px] text-center shadow-sm">
                                {timeLeft.ss}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Link
                        to="/category/khuyen-mai"
                        className="text-xs font-black text-[#f05a28] uppercase tracking-wider flex items-center gap-1.5 bg-[#fff1f0] hover:bg-[#ffe4e1] px-5 py-2.5 rounded-2xl transition-all border border-orange-50 shadow-sm"
                      >
                        Săn ngay{" "}
                        <span className="text-sm font-bold">&rarr;</span>
                      </Link>
                    </div>

                    {/* Carousel Sản phẩm của chương trình hiện tại */}
                    <div
                      ref={favRef}
                      className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
                    >
                      {promo.products?.map((p, pIdx) => (
                        <div
                          key={`flash-${promo.chuong_trinh.ma_khuyen_mai}-${p.ma_san_pham}-${pIdx}`}
                          className="min-w-[180px] md:min-w-[220px] bg-white border border-slate-100 rounded-[28px] p-3 hover:shadow-xl hover:border-slate-200/60 transition-all duration-300 relative group text-left flex flex-col justify-between"
                        >
                          <div className="absolute top-4 left-4 z-10 bg-red-500 text-white font-black text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wide shadow-sm">
                            -HOT
                          </div>
                          <ProductCard p={p} />
                          <div className="mt-3 space-y-1 w-full px-1">
                            <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                              <span>
                                Đã bán {p.thong_tin_sale?.da_ban || 0}
                              </span>
                              <span className="text-red-500 font-extrabold">
                                Hot 🔥
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
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
              <div className="text-center py-6 text-slate-400 italic font-medium">
                Không có chương trình nào đang diễn ra.
              </div>
            )}

            {/* 1.2 DANH SÁCH SẮP DIỄN RA */}
            {upcomingPromos.length > 0 && (
              <div className="bg-white border border-blue-100 rounded-[30px] p-6 shadow-sm">
                <h3 className="font-black text-blue-900 mb-4 uppercase text-sm tracking-widest flex items-center gap-2">
                  <Timer size={16} className="text-blue-500" /> Sắp diễn ra:
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {upcomingPromos.map((promo, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl border border-blue-100"
                    >
                      <div>
                        <p className="font-bold text-blue-900 text-sm">
                          {promo.chuong_trinh.ten_chuong_trinh}
                        </p>
                        <p className="text-[11px] text-blue-600 mt-1">
                          Bắt đầu:{" "}
                          {new Date(
                            promo.chuong_trinh.thoi_gian_bat_dau,
                          ).toLocaleString()}
                        </p>
                      </div>
                      <span className="text-[10px] font-black bg-blue-200 text-blue-800 px-3 py-1 rounded-full uppercase">
                        Sắp tới
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* ========================================================== */}
      {/* 3. SẢN PHẨM THỊNH HÀNH (SỬ DỤNG DỮ LIỆU SẢN PHẨM THƯỜNG) */}
      {/* ========================================================== */}
      <section className="px-6 md:px-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-[#006c49] rounded-full"></div>
            <h2 className="text-2xl font-black text-[#161b22] tracking-tight uppercase">
              {t("favorites_title")}
            </h2>
          </div>
          <Link
            to="/category/tat-ca"
            className="flex items-center gap-2 text-xs font-black text-[#006c49] bg-[#e6f0ed] px-6 py-2.5 rounded-2xl hover:bg-[#006c49] hover:text-white transition-all shadow-sm active:scale-95 uppercase tracking-widest"
          >
            {t("see_more")} <ChevronRight size={14} />
          </Link>
        </div>

        <div className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4">
          {loadingProducts ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="min-w-[170px] md:min-w-[210px] space-y-4">
                <div className="aspect-square bg-slate-100 rounded-[32px] animate-pulse"></div>
                <div className="h-4 bg-slate-100 rounded w-3/4 animate-pulse"></div>
              </div>
            ))
          ) : productError ? (
            <div className="w-full py-10 flex flex-col items-center text-slate-400 gap-2">
              <AlertCircle size={40} />
              <p className="font-bold">Ối! {productError}</p>
              <button
                onClick={() => window.location.reload()}
                className="text-[#006c49] underline text-sm"
              >
                Thử lại
              </button>
            </div>
          ) : (
            cleanProducts.map((p, idx) => (
              <div
                key={`trending-${p.ma_san_pham || "empty"}-${idx}`}
                className="min-w-[170px] md:min-w-[210px] transition-all duration-300 hover:-translate-y-1"
              >
                {" "}
                <ProductCard p={p} />
              </div>
            ))
          )}

          {!loadingProducts && !productError && (
            <Link
              to="/category/tat-ca"
              className="min-w-[120px] flex items-center justify-center text-[#006c49] font-black text-xs cursor-pointer hover:underline uppercase tracking-widest group"
            >
              Xem Tất Cả{" "}
              <ArrowRight
                size={16}
                className="ml-2 group-hover:translate-x-2 transition-transform"
              />
            </Link>
          )}
        </div>
      </section>

      {/* ========================================================== */}
      {/* KHỐI 2: KHÁM PHÁ BỘ SƯU TẬP */}
      {/* ========================================================== */}
      <section className="px-6 md:px-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
          <div className="flex items-center gap-2.5 text-left">
            <div className="w-8 h-8 bg-gradient-to-tr from-[#f4faf7] to-white rounded-xl border border-[#d6ede4] flex items-center justify-center text-[#006c49]">
              <Sparkles size={16} className="fill-[#006c49]/10" />
            </div>
            <h2 className="text-2xl font-black text-[#161b22] uppercase tracking-tight italic">
              Khám phá bộ sưu tập
            </h2>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1 bg-slate-100/70 border border-slate-200/40 p-1.5 rounded-2xl max-w-full">
            {[
              { id: "recommend", label: "Gợi ý cho bạn" },
              { id: "chosen", label: "Chúng tôi chọn" },
              { id: "new_release", label: "Hàng mới về" },
              { id: "good_price", label: "Giá tốt mỗi ngày" },
              { id: "week_new", label: "Mới về tuần này" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveMainTab(tab.id)}
                className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 whitespace-nowrap ${
                  activeMainTab === tab.id
                    ? "bg-[#006c49] text-white shadow-md shadow-[#006c49]/15"
                    : "text-slate-500 hover:text-slate-800 hover:bg-white/60"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-5 md:gap-6">
          {loadingProducts
            ? [...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="aspect-[3/4] bg-slate-50 border border-slate-100 rounded-3xl animate-pulse"
                ></div>
              ))
            : cleanProducts.slice(0, 12).map((p, idx) => (
                <div
                  key={`collection-${p.ma_san_pham || "empty"}-${idx}`}
                  className="w-full bg-white rounded-[28px] border border-slate-100/80 p-1 hover:shadow-xl hover:border-slate-200/50 transition-all duration-300 hover:-translate-y-1"
                >
                  <ProductCard p={p} />
                </div>
              ))}
        </div>
      </section>

      {/* 4. BANNER NGANG */}
      <div className="mx-6 md:mx-10 h-32 bg-[#006c49] rounded-[36px] flex items-center justify-between px-6 md:px-16 border border-[#006c49] group cursor-pointer shadow-xl shadow-[#006c49]/15 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-12 relative z-10 text-left">
          <h2 className="text-xl md:text-3xl font-black text-white tracking-tighter uppercase italic flex items-center gap-2">
            Tuần lễ Việt Nam Toàn Cầu+{" "}
            <span className="bg-[#fea619] text-[#684000] text-[9px] not-italic px-2 py-0.5 rounded font-black tracking-widest uppercase">
              Special
            </span>
          </h2>
          <p className="text-xs md:text-sm text-white/70 font-black uppercase tracking-widest hidden md:block">
            Khám phá hương vị không biên giới!
          </p>
        </div>
        <button className="w-12 h-12 rounded-2xl bg-white text-[#006c49] flex items-center justify-center group-hover:translate-x-3 transition-all duration-300 shadow-xl active:scale-90 relative z-10 border border-white/20">
          <ArrowRight size={24} strokeWidth={3} />
        </button>
      </div>

      {/* ========================================================== */}
      {/* KHỐI 3: GLOBAL+ BẢNG XẾP HẠNG */}
      {/* ========================================================== */}
      <section className="px-6 md:px-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4 bg-white border border-slate-100 rounded-[36px] p-6 text-left shadow-[0_12px_40px_rgba(0,0,0,0.015)] space-y-4 lg:sticky lg:top-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-tr from-amber-500 to-yellow-400 rounded-2xl flex items-center justify-center text-white shadow-md shadow-yellow-100">
              <Trophy size={20} className="fill-white/20" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#161b22] uppercase tracking-tight italic">
                Global+ Bảng xếp hạng
              </h2>
              <p className="text-[10px] text-[#006c49] font-black uppercase tracking-wider">
                Cập nhật mỗi ngày
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed font-medium">
            Khám phá xu hướng mua sắm của cộng đồng quốc tế tại Demi Mart tuần
            này để lựa chọn những sản phẩm tốt nhất.
          </p>

          <div className="flex flex-col gap-2 pt-2">
            {[
              { id: "best", label: "🔥 Bán chạy nhất", icon: Flame },
              { id: "trend", label: "📈 Xu hướng tìm kiếm", icon: TrendingUp },
              { id: "daily", label: "🎁 Ưu đãi mỗi ngày", icon: Sparkles },
            ].map((menu) => (
              <button
                key={menu.id}
                onClick={() => setActiveRankTab(menu.id)}
                className={`w-full px-4 py-3.5 text-xs font-black uppercase tracking-wide rounded-2xl flex items-center justify-between border transition-all duration-300 ${
                  activeRankTab === menu.id
                    ? "bg-[#f4faf7] border-[#d6ede4] text-[#006c49] shadow-sm scale-[1.01]"
                    : "bg-transparent border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <span className="flex items-center gap-2">{menu.label}</span>
                <ChevronRight
                  size={14}
                  className={
                    activeRankTab === menu.id
                      ? "translate-x-1 transition-transform"
                      : ""
                  }
                />
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
          {loadingProducts
            ? [...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="aspect-[3/4] bg-slate-50 border border-slate-100 rounded-[32px] animate-pulse"
                ></div>
              ))
            : cleanProducts.slice(0, 3).map((p, index) => {
                const medalColors =
                  index === 0
                    ? "from-yellow-50/60 to-amber-100/30 border-yellow-200/70 shadow-yellow-100/40 shadow-xl"
                    : index === 1
                      ? "from-slate-50 to-slate-200/30 border-slate-200/70"
                      : "from-amber-50 to-amber-200/20 border-amber-200/50";

                return (
                  <div
                    network_id={p.ma_san_pham || index}
                    key={`rank-${p.ma_san_pham || "empty"}-${index}`}
                    className={`bg-gradient-to-b ${medalColors} border rounded-[36px] p-4 relative transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5 group text-left`}
                  >
                    <div
                      className={`absolute -top-3.5 -left-2.5 w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs text-white shadow-md border border-white/20 ${
                        index === 0
                          ? "bg-gradient-to-r from-yellow-500 to-amber-500"
                          : index === 1
                            ? "bg-slate-400"
                            : "bg-amber-700"
                      }`}
                    >
                      #{index + 1}
                    </div>

                    <div className="bg-white rounded-[28px] p-1 border border-slate-100 shadow-sm overflow-hidden">
                      <ProductCard p={p} />
                    </div>

                    <div className="mt-4 px-1.5 pb-0.5 text-[10px] text-slate-400 font-black uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <ShoppingBag size={11} /> Đã bán tuần này
                      </span>
                      <span className="text-[#006c49] font-black text-xs">
                        {9.5 - index * 2}k+ đơn
                      </span>
                    </div>
                  </div>
                );
              })}
        </div>
      </section>
    </div>
  );
}
