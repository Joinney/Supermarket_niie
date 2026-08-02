import React, { useState, useEffect, useRef } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import {
  ChevronRight,
  ArrowRight,
  Star,
  QrCode,
  Zap,
  AlertCircle,
  Flame,
  Timer,
  Clock,
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
import ModalPoster from "./modalquangcao/ModalPoster";

// Import 5 component từ thư mục Khám phá bộ sưu tập
import Goiychoban from "./khamphabosuutap/goiychoban";
import Chungtoichon from "./khamphabosuutap/chungtoichon";
import Hangmoive from "./khamphabosuutap/hangmoive";
import Giatotmoingay from "./khamphabosuutap/giatotmoingay";
import Moivetuannay from "./khamphabosuutap/moivetuannay";

export default function Home() {
  const { t } = useLanguage();
  const { currentStore } = useStore();
  const { country_code, tabSlug } = useParams();

  // State sản phẩm thường (Bộ sưu tập)
  const [apiProducts, setApiProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productError, setProductError] = useState(null);

  // State sản phẩm yêu thích (Top Favorites)
  const [topFavoriteProducts, setTopFavoriteProducts] = useState([]);
  const [loadingTopFavorites, setLoadingTopFavorites] = useState(true);

  // State Flash Sale & Slot lựa chọn
  const [flashSaleData, setFlashSaleData] = useState([]);
  const [loadingFlashSale, setLoadingFlashSale] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState("running");

  const favRef = useRef(null);
  const location = useLocation();

  const TABS = [
    { id: "recommend", slug: "goi_y_cho_ban", label: "Gợi ý cho bạn" },
    { id: "chosen", slug: "chung_toi_chon", label: "Chúng tôi chọn" },
    { id: "new_release", slug: "hang_moi_ve", label: "Hàng mới về" },
    { id: "good_price", slug: "gia_tot_moi_ngay", label: "Giá tốt mỗi ngày" },
    { id: "week_new", slug: "moi_ve_tuan_nay", label: "Mới về tuần này" },
  ];

  const activeTabObj = TABS.find((t) => t.slug === tabSlug) || TABS[0];
  const activeMainTab = activeTabObj.id;
  const [activeRankTab, setActiveRankTab] = useState("best");

  // Đồng hồ thời gian thực
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Lọc chương trình khuyến mãi đang chạy & sắp diễn ra
  const runningPromos = flashSaleData.filter(
    (item) =>
      new Date(item.chuong_trinh.thoi_gian_bat_dau) <= currentTime &&
      new Date(item.chuong_trinh.thoi_gian_ket_thuc) >= currentTime
  );

  const upcomingPromos = flashSaleData.filter(
    (item) => new Date(item.chuong_trinh.thoi_gian_bat_dau) > currentTime
  );

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

  useEffect(() => {
    window.scrollTo(0, 0);
    const targetCountry = country_code || currentStore?.code || "vn";

    const fetchGeneralProducts = async () => {
      try {
        setLoadingProducts(true);
        const response = await productApi.get(
          `/products?role=client&limit=100&country=${targetCountry}`
        );
        setApiProducts(response.data);
        setProductError(null);
      } catch (err) {
        console.error("Lỗi API Sản phẩm:", err);
        setProductError(
          err.response?.data?.message || "Không thể đồng bộ dữ liệu trang chủ"
        );
      } finally {
        setLoadingProducts(false);
      }
    };

    const fetchTopFavorites = async () => {
      try {
        setLoadingTopFavorites(true);
        const res = await productApi.get("/products/top/favorites");

        const rawData = Array.isArray(res.data)
          ? res.data
          : res.data?.data || [];

        const formattedData = rawData.map((item) => ({
          ...item,
          stock: item.stock || item.so_luong_kho || 100,
          da_ban:
            item.da_ban || item.luot_yeu_thich || item.total_favorites || 0,
          thong_tin_sale: {
            ...item.thong_tin_sale,
            da_ban: item.da_ban || item.luot_yeu_thich || 0,
          },
        }));

        setTopFavoriteProducts(formattedData);
      } catch (err) {
        console.error("Lỗi API Top Yêu Thích:", err);
      } finally {
        setLoadingTopFavorites(false);
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
    fetchTopFavorites();
    fetchFlashSale();
  }, [country_code, currentStore?.code]);

  // Auto-scroll Carousel
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
    let rawList = [];
    if (!apiProducts) return [];

    if (Array.isArray(apiProducts)) {
      rawList = apiProducts;
    } else if (apiProducts.data && Array.isArray(apiProducts.data)) {
      rawList = apiProducts.data;
    } else if (apiProducts.products && Array.isArray(apiProducts.products)) {
      rawList = apiProducts.products;
    }

    const uniqueProducts = [];
    const seenIds = new Set();

    for (const item of rawList) {
      if (!seenIds.has(item.ma_san_pham)) {
        seenIds.add(item.ma_san_pham);
        uniqueProducts.push(item);
      }
    }

    return uniqueProducts;
  };

  const cleanProducts = getCleanProductList();

  const currentPrefix = country_code
    ? `/${country_code.toLowerCase()}`
    : `/${currentStore?.code?.toLowerCase() || "vn"}`;

  const activePromo = runningPromos?.[0] || null;
  const activeTimeLeft = activePromo
    ? formatTimeLeft(activePromo.chuong_trinh.thoi_gian_ket_thuc)
    : { dd: "00", hh: "00", mm: "00", ss: "00" };

  return (
    <div className="space-y-12 pb-20 bg-[#fafbfc] font-sans pt-[10px] selection:bg-[#006c49] selection:text-white relative">
      <ModalPoster country_code={country_code} currentStore={currentStore} />

      <QuangCao t={t} />

      {/* ========================================================= */}
      {/* FLASH SALE - NỀN TRẮNG, VIỀN ĐỎ CAM GRADIENT NỔI BẬT */}
      {/* ========================================================= */}
      <section className="mx-4 sm:mx-6 md:mx-10 my-8">
        {loadingFlashSale ? (
          <div className="h-64 bg-slate-100 rounded-[36px] animate-pulse"></div>
        ) : (
          /* Khung ngoài làm dải viền gradient đỏ-cam (padding 3px) */
          <div className="p-[3px] bg-gradient-to-r from-[#ff3b30] via-[#ff6b00] to-[#ff3b30] rounded-[28px] md:rounded-[36px] shadow-xl shadow-red-500/10">
            {/* Khung ruột bên trong màu TRẮNG */}
            <div className="bg-white rounded-[25px] md:rounded-[33px] p-4 sm:p-6 md:p-8">
              {/* HEADER KHU VỰC SALE */}
              <div className="flex flex-col lg:flex-row items-center justify-between gap-5 mb-6 border-b border-slate-100 pb-6">
                {/* Tiêu đề & Countdown */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 md:gap-4 text-slate-900 w-full lg:w-auto">
                  <div className="w-12 h-12 bg-gradient-to-tr from-[#ff3b30] to-[#ff6b00] text-white rounded-2xl flex items-center justify-center shadow-md shadow-red-500/20 shrink-0">
                    <Zap size={28} className="fill-current animate-bounce" />
                  </div>

                  <div className="text-center sm:text-left">
                    <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight italic text-transparent bg-clip-text bg-gradient-to-r from-[#ff3b30] to-[#ff6b00]">
                      GIỜ VÀNG DEAL SỐC
                    </h2>

                    {selectedSlot === "running" && activePromo && (
                      <div className="flex items-center gap-2 mt-1 justify-center sm:justify-start">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-red-500">
                          Kết thúc trong
                        </span>
                        <div className="flex items-center gap-1 font-black text-sm text-white">
                          {activeTimeLeft.dd !== "00" && (
                            <>
                              <span className="bg-slate-900 px-2 py-0.5 rounded-lg min-w-[28px] text-center">
                                {activeTimeLeft.dd}d
                              </span>
                              <span className="text-red-500 font-bold">:</span>
                            </>
                          )}
                          <span className="bg-slate-900 px-2 py-0.5 rounded-lg min-w-[28px] text-center shadow-inner">
                            {activeTimeLeft.hh}
                          </span>
                          <span className="text-red-500 font-bold">:</span>
                          <span className="bg-slate-900 px-2 py-0.5 rounded-lg min-w-[28px] text-center shadow-inner">
                            {activeTimeLeft.mm}
                          </span>
                          <span className="text-red-500 font-bold">:</span>
                          <span className="bg-gradient-to-r from-[#ff3b30] to-[#ff6b00] text-white px-2 py-0.5 rounded-lg min-w-[28px] text-center shadow-inner animate-pulse">
                            {activeTimeLeft.ss}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Thanh chọn khung giờ (Slots) */}
                <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/60 w-full sm:w-auto overflow-x-auto scrollbar-hide justify-between">
                  <button
                    onClick={() => setSelectedSlot("running")}
                    className={`flex-1 sm:flex-initial px-4 sm:px-6 py-2 rounded-xl text-center transition-all duration-300 whitespace-nowrap ${
                      selectedSlot === "running"
                        ? "bg-gradient-to-r from-[#ff3b30] to-[#ff6b00] text-white shadow-md font-black"
                        : "text-slate-600 hover:text-slate-900 font-bold"
                    }`}
                  >
                    <div className="text-xs uppercase tracking-wider opacity-90">
                      Đang diễn ra
                    </div>
                    <div className="text-sm font-extrabold flex items-center justify-center gap-1">
                      <Clock size={12} /> Live
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedSlot("upcoming")}
                    className={`flex-1 sm:flex-initial px-4 sm:px-6 py-2 rounded-xl text-center transition-all duration-300 whitespace-nowrap ${
                      selectedSlot === "upcoming"
                        ? "bg-gradient-to-r from-[#ff3b30] to-[#ff6b00] text-white shadow-md font-black"
                        : "text-slate-600 hover:text-slate-900 font-bold"
                    }`}
                  >
                    <div className="text-xs uppercase tracking-wider opacity-90">
                      Sắp diễn ra
                    </div>
                    <div className="text-sm font-extrabold flex items-center justify-center gap-1">
                      <Clock size={12} /> {upcomingPromos.length} ca
                    </div>
                  </button>
                </div>
              </div>

              {/* DANH SÁCH SẢN PHẨM GRID 6 CỘT */}
              {selectedSlot === "running" ? (
                runningPromos.length > 0 ? (
                  runningPromos.map((promo, idx) => (
                    <div
                      key={`running-promo-${idx}`}
                      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4"
                    >
                      {promo.products?.map((p, pIdx) => {
                        const limit = p.thong_tin_sale?.so_luong_gioi_han || 30;
                        const sold = p.thong_tin_sale?.da_ban || 0;
                        const remaining = Math.max(0, limit - sold);
                        const percent = Math.min(
                          100,
                          Math.round((sold / limit) * 100)
                        );

                        return (
                          <div
                            key={`flash-${promo.chuong_trinh.ma_khuyen_mai}-${p.ma_san_pham}-${pIdx}`}
                            className="bg-white rounded-2xl p-2.5 sm:p-3 shadow-xs border border-slate-100 hover:shadow-xl hover:border-red-200 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group relative"
                          >
                            <ProductCard
                              p={p}
                              categoryName="Siêu Sale"
                              categorySlug="khuyen-mai"
                            />

                            {/* Thanh Tiến Trình "Còn x/y suất" */}
                            <div className="mt-3 w-full">
                              <div className="relative h-6 bg-orange-100/80 rounded-full overflow-hidden flex items-center justify-center border border-orange-200/60 shadow-inner">
                                <div
                                  className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-yellow-400 to-[#ff6b00] transition-all duration-500 rounded-full"
                                  style={{ width: `${percent}%` }}
                                ></div>
                                <div className="relative z-10 flex items-center justify-center gap-1 text-[11px] font-black uppercase text-slate-800 drop-shadow-xs">
                                  <Flame
                                    size={13}
                                    className="text-red-600 fill-red-600 animate-bounce"
                                  />
                                  <span>
                                    {remaining === 0
                                      ? "HẾT HÀNG"
                                      : `Còn ${remaining}/${limit} suất`}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-100">
                    <Zap size={36} className="mx-auto text-amber-500 mb-2" />
                    <p className="font-extrabold text-base text-slate-700">
                      Hiện chưa có chương trình Flash Sale nào đang mở bán.
                    </p>
                  </div>
                )
              ) : (
                /* Khung hiển thị các chương trình sắp diễn ra */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingPromos.length > 0 ? (
                    upcomingPromos.map((promo, idx) => (
                      <div
                        key={`upcoming-${idx}`}
                        className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 text-slate-800 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-black text-base text-[#ff3b30]">
                            {promo.chuong_trinh.ten_chuong_trinh}
                          </p>
                          <p className="text-xs font-semibold mt-1 text-slate-500">
                            Bắt đầu:{" "}
                            {new Date(
                              promo.chuong_trinh.thoi_gian_bat_dau
                            ).toLocaleString("vi-VN")}
                          </p>
                        </div>
                        <span className="text-[10px] font-black bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded-xl uppercase tracking-wider shadow-xs">
                          Sắp mở
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-12 text-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-100">
                      <Clock size={36} className="mx-auto text-slate-400 mb-2" />
                      <p className="font-extrabold text-base text-slate-700">
                        Chưa có lịch Flash Sale sắp tới. Hãy quay lại sau nhé!
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* TOP YÊU THÍCH */}
      <section className="px-6 md:px-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-[#006c49] rounded-full"></div>
            <h2 className="text-2xl font-black text-[#161b22] tracking-tight uppercase">
              {t("favorites_title")}
            </h2>
          </div>
          <Link
            to={`${currentPrefix}/category/tat-ca`}
            className="flex items-center gap-2 text-xs font-black text-[#006c49] bg-[#e6f0ed] px-6 py-2.5 rounded-2xl hover:bg-[#006c49] hover:text-white transition-all shadow-sm active:scale-95 uppercase tracking-widest"
          >
            {t("see_more")} <ChevronRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-5 md:gap-6">
          {loadingTopFavorites ? (
            [...Array(6)].map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] bg-slate-50 border border-slate-100 rounded-3xl animate-pulse"
              ></div>
            ))
          ) : topFavoriteProducts.length === 0 ? (
            <div className="col-span-full py-10 flex flex-col items-center justify-center text-slate-400 gap-2 w-full">
              <p className="font-bold">Chưa có sản phẩm yêu thích nào!</p>
            </div>
          ) : (
            topFavoriteProducts.map((p, idx) => (
              <div
                key={`top-fav-${p.ma_san_pham || "empty"}-${idx}`}
                className="w-full bg-white rounded-[28px] border border-slate-100/80 p-1 hover:shadow-xl hover:border-slate-200/50 transition-all duration-300 hover:-translate-y-1 relative"
              >
                <ProductCard p={p} />
              </div>
            ))
          )}
        </div>
      </section>

      {/* KHÁM PHÁ BỘ SƯU TẬP */}
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
            {TABS.map((tab) => (
              <Link
                key={tab.id}
                to={`${currentPrefix}/${tab.slug}`}
                preventScrollReset={true}
                replace={true}
                className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 whitespace-nowrap ${
                  activeMainTab === tab.id
                    ? "bg-[#006c49] text-white shadow-md shadow-[#006c49]/15"
                    : "text-slate-500 hover:text-slate-800 hover:bg-white/60"
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-5">
          {activeMainTab === "recommend" && (
            <Goiychoban products={cleanProducts} loading={loadingProducts} />
          )}
          {activeMainTab === "chosen" && (
            <Chungtoichon products={cleanProducts} loading={loadingProducts} />
          )}
          {activeMainTab === "new_release" && (
            <Hangmoive products={cleanProducts} loading={loadingProducts} />
          )}
          {activeMainTab === "good_price" && (
            <Giatotmoingay products={cleanProducts} loading={loadingProducts} />
          )}
          {activeMainTab === "week_new" && (
            <Moivetuannay products={cleanProducts} loading={loadingProducts} />
          )}
        </div>
      </section>

      {/* BANNER NGANG */}
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

      {/* BẢNG XẾP HẠNG */}
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