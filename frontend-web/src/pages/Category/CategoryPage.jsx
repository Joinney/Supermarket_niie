import React, { useState, useEffect, useRef } from "react";
import {
  useParams,
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  ChevronRight,
  ChevronLeft,
  Home,
  AlertCircle,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { productApi } from "../../api/axios";
import ProductCard from "../../components/Product/ProductCard";
import { useStore } from "../../context/StoreContext";
import { io } from "socket.io-client";

export default function CategoryPage() {
  const { country_code, parentSlug, slug } = useParams();
  const navigate = useNavigate();

  const { currentStore, formatPrice } = useStore();

  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSort = searchParams.get("sort") || "noi-bat";
  const selectedPrice = searchParams.get("price") || "tat-ca";
  // Đã xóa selectedOrigin
  const freshShipping = searchParams.get("fresh") === "true";
  const globalShipping = searchParams.get("global") === "true";
  const currentPage = parseInt(searchParams.get("page")) || 1;

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryName, setCategoryName] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [subCategories, setSubCategories] = useState([]);
  const [activeSubCategory, setActiveSubCategory] = useState(null);

  const sliderRef = useRef(null);
  const viewedCategoryIds = useRef([]);

  const formatSlugName = (s) =>
    s === "tat-ca" ? "Tất cả sản phẩm" : s?.replace(/-/g, " ") || "";

  const priceFilters = [
    { label: "Tất cả khoảng giá", value: "tat-ca" },
    { label: `Dưới ${formatPrice(50000)}`, value: "0-50000" },
    {
      label: `${formatPrice(50000)} - ${formatPrice(100000)}`,
      value: "50000-100000",
    },
    {
      label: `${formatPrice(100000)} - ${formatPrice(200000)}`,
      value: "100000-200000",
    },
    {
      label: `${formatPrice(200000)} - ${formatPrice(500000)}`,
      value: "200000-500000",
    },
    {
      label: `${formatPrice(500000)} - ${formatPrice(800000)}`,
      value: "500000-800000",
    },
    {
      label: `${formatPrice(800000)} - ${formatPrice(1000000)}`,
      value: "800000-1000000",
    },
    { label: `Trên ${formatPrice(1000000)}`, value: "1000000-up" },
  ];

  const updateFilter = (key, value) => {
    const currentParams = Object.fromEntries([...searchParams]);

    if (
      !value ||
      value === "tat-ca" ||
      value === "noi-bat" ||
      value === false
    ) {
      delete currentParams[key];
    } else {
      currentParams[key] = String(value);
    }

    if (key !== "page") {
      delete currentParams.page;
    }

    setSearchParams(currentParams);
  };

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      updateFilter("page", pageNumber);
    }
  };

  useEffect(() => {
    const apiUrl =
      import.meta.env.VITE_API_PRODUCT_URL || "http://localhost:5002";
    const socket = io(apiUrl);

    socket.on("category_status_changed", (data) => {
      if (data.trang_thai === false) {
        const incomingId = String(data.ma_danh_muc);
        const isMatch = viewedCategoryIds.current.includes(incomingId);
        if (isMatch) {
          console.log(
            "⚡ [Real-time] Danh mục đang xem bị Admin khóa. Văng trang!",
          );
          window.location.href = "/";
        } else {
          setSubCategories((prev) =>
            prev.filter(
              (c) =>
                String(c.id) !== incomingId &&
                String(c.ma_dm_con) !== incomingId &&
                String(c.ma_danh_muc) !== incomingId,
            ),
          );
        }
      }
    });

    socket.on("product_status_changed", (data) => {
      if (data.trang_thai === false) {
        setProducts((prevProducts) =>
          prevProducts.filter(
            (p) => String(p.ma_san_pham) !== String(data.ma_san_pham),
          ),
        );
      }
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    const fetchSubCategories = async () => {
      try {
        const targetParentSlug = parentSlug || slug;
        if (targetParentSlug === "tat-ca" || !targetParentSlug) {
          setSubCategories([]);
          viewedCategoryIds.current = [];
          return;
        }

        const targetCountry = country_code || currentStore?.code || "vn";
        const response = await productApi.get(
          `/categories/tree?country=${targetCountry}&role=client`,
        );
        const allCategories = response.data;

        const currentCategory = allCategories.find(
          (c) => c.slug === targetParentSlug,
        );

        if (!currentCategory || currentCategory.trang_thai === false) {
          window.location.href = "/";
          return;
        }

        let activeIds = [];
        ["id", "ma_dm_cha", "ma_danh_muc", "_id"].forEach((key) => {
          if (currentCategory[key])
            activeIds.push(String(currentCategory[key]));
        });

        if (currentCategory.children) {
          const activeChildren = currentCategory.children.filter(
            (c) => c.trang_thai !== false,
          );
          setSubCategories(activeChildren);

          if (slug && slug !== targetParentSlug) {
            const activeSub = currentCategory.children.find(
              (c) => c.slug === slug,
            );

            if (!activeSub || activeSub.trang_thai === false) {
              window.location.href = "/";
              return;
            }

            ["id", "ma_dm_con", "ma_danh_muc", "_id"].forEach((key) => {
              if (activeSub[key]) activeIds.push(String(activeSub[key]));
            });
          }
        } else {
          setSubCategories([]);
        }

        viewedCategoryIds.current = activeIds;
      } catch (err) {
        console.error("Lỗi lấy danh mục:", err);
      }
    };

    fetchSubCategories();
  }, [parentSlug, slug, country_code, currentStore?.code]);

  useEffect(() => {
    if (parentSlug && slug) {
      setActiveSubCategory(slug);
    } else {
      setActiveSubCategory(null);
    }
  }, [parentSlug, slug]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    const fetchCategoryProducts = async () => {
      try {
        setLoading(true);
        const currentCountry = country_code || currentStore?.code || "vn";
        const targetSlug = slug || "tat-ca";

        const response = await productApi.get(
          `/products/category/${targetSlug}`,
          {
            params: {
              country: currentCountry,
              role: "client",
              sort: selectedSort,
              price: selectedPrice,
              fresh: freshShipping,
              global: globalShipping,
              page: currentPage,
              limit: 12,
            },
          },
        );

        setProducts(response.data.products || response.data);
        if (response.data.totalPages) {
          setTotalPages(response.data.totalPages);
        }

        if (response.data.length > 0 && targetSlug !== "tat-ca") {
          setCategoryName(response.data[0].ten_danh_muc);
        } else {
          setCategoryName(formatSlugName(targetSlug));
        }
        setError(null);
      } catch (err) {
        console.error("Lỗi tải sản phẩm:", err);
        setError("Không thể tải danh sách sản phẩm lúc này.");
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryProducts();
  }, [
    slug,
    parentSlug,
    country_code,
    currentStore?.code,
    selectedSort,
    selectedPrice,
    freshShipping,
    globalShipping,
    currentPage,
  ]);

  const handleScroll = (direction) => {
    if (sliderRef.current) {
      const { scrollLeft, clientWidth } = sliderRef.current;
      const offset =
        direction === "left" ? -(clientWidth * 0.6) : clientWidth * 0.6;
      sliderRef.current.scrollTo({
        left: scrollLeft + offset,
        behavior: "smooth",
      });
    }
  };

  const handleSubCategoryClick = (subSlug) => {
    const mainSlug = parentSlug || slug;
    const prefix = country_code ? `/${String(country_code).toLowerCase()}` : "";

    if (activeSubCategory === subSlug) {
      navigate(`${prefix}/category/${mainSlug}`);
    } else {
      navigate(`${prefix}/category/${mainSlug}/${subSlug}`);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-6 font-sans bg-white min-h-screen">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-4 uppercase tracking-wider">
        <Link
          to={country_code ? `/${String(country_code).toLowerCase()}` : "/"}
          className="hover:text-[#006c49] flex items-center gap-1 transition-colors"
        >
          <Home size={14} /> Trang chủ
        </Link>
        <ChevronRight size={14} />
        <span>Danh mục</span>
        <ChevronRight size={14} />
        <span className="text-[#006c49] font-semibold">
          {categoryName || formatSlugName(slug)}
        </span>
      </div>

      {subCategories.length > 0 && (
        <div className="relative w-full mb-6 group/subnav">
          <button
            onClick={() => handleScroll("left")}
            className="absolute left-[-14px] top-1/2 -translate-y-1/2 bg-[#f3f5f9] text-slate-900 border-4 border-white w-12 h-12 rounded-full shadow-[0_3px_10px_rgba(0,0,0,0.14)] flex items-center justify-center z-30 hover:bg-white transition-all duration-200 opacity-0 group-hover/subnav:opacity-100 active:scale-95"
          >
            <ChevronLeft size={20} strokeWidth={3} />
          </button>

          <div
            ref={sliderRef}
            className="flex gap-3.5 overflow-x-auto pb-3 pt-1 snap-x scroll-smooth"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <style>{`div::-webkit-scrollbar { display: none !important; }`}</style>

            {subCategories.map((sub) => {
              const isActive = activeSubCategory === sub.slug;
              const imageUrl = sub.Hinh_anh || sub.image || sub.hinhanh;

              return (
                <button
                  key={sub.id || sub.ma_dm_con}
                  onClick={() => handleSubCategoryClick(sub.slug)}
                  className={`flex items-center justify-between rounded-2xl border min-w-[215px] max-w-[215px] h-[74px] flex-shrink-0 transition-all snap-start text-left relative overflow-hidden group
                    ${
                      isActive
                        ? "border-[#006c49] ring-2 ring-[#006c49]/20 shadow-md"
                        : "border-slate-100 bg-[#f4f6fa] hover:bg-slate-200/50 hover:border-slate-200 shadow-sm"
                    }`}
                >
                  <div className="absolute inset-0 w-full h-full z-0 bg-white">
                    {imageUrl && imageUrl !== "[null]" ? (
                      <img
                        src={imageUrl}
                        alt={sub.name || sub.ten_danh_muc_con}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src =
                            "https://placehold.co/200x100/f1f5f9/94a3b8?text=No+Image";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200" />
                    )}
                  </div>

                  <div className="absolute left-2.5 top-1/2 -translate-y-1/2 max-w-[140px] z-10">
                    <span className="inline-block bg-white/50 backdrop-blur-sm text-slate-900 text-xs font-bold px-3 py-2 rounded-xl border border-white/20 shadow-[0_2px_8px_rgba(0,0,0,0.05)] line-clamp-2 leading-tight">
                      {sub.name || sub.ten_danh_muc_con}
                    </span>
                  </div>

                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#006c49] z-20 rounded-b-2xl" />
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => handleScroll("right")}
            className="absolute right-[-14px] top-1/2 -translate-y-1/2 bg-[#f3f5f9] text-slate-900 border-4 border-white w-12 h-12 rounded-full shadow-[0_3px_10px_rgba(0,0,0,0.14)] flex items-center justify-center z-30 hover:bg-white transition-all duration-200 opacity-0 group-hover/subnav:opacity-100 active:scale-95"
          >
            <ChevronRight size={20} strokeWidth={3} />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div className="text-sm font-semibold text-slate-600">
          {products.length} kết quả
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Sắp xếp:</span>
          <select
            value={selectedSort}
            onChange={(e) => updateFilter("sort", e.target.value)}
            className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:border-[#006c49]"
          >
            <option value="noi-bat">Nổi bật (mặc định)</option>
            <option value="gia-thap">Giá: Thấp đến Cao</option>
            <option value="gia-cao">Giá: Cao đến Thấp</option>
            <option value="ban-chay">Bán chạy nhất</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="flex-1 w-full order-2 lg:order-1 border border-slate-100 rounded-2xl p-4 bg-white shadow-sm flex flex-col justify-between min-h-[550px]">
          <div>
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="space-y-4">
                    <div className="aspect-square bg-slate-100 rounded-2xl animate-pulse"></div>
                    <div className="h-4 bg-slate-100 rounded w-3/4 animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="w-full py-20 flex flex-col items-center text-slate-400 gap-3">
                <AlertCircle size={48} className="text-red-400" />
                <p className="font-bold text-lg text-slate-600">Ối! {error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="text-[#006c49] underline font-bold mt-2"
                >
                  Thử lại
                </button>
              </div>
            ) : products.length === 0 ? (
              <div className="w-full py-20 flex flex-col items-center text-slate-400 gap-3 bg-slate-50 rounded-3xl">
                <p className="font-bold text-lg text-slate-500">
                  Chưa có sản phẩm nào phù hợp bộ lọc.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {products.map((p) => (
                  <ProductCard
                    key={p.ma_san_pham}
                    p={p}
                    categoryName={categoryName || formatSlugName(slug)}
                    categorySlug={slug || "tat-ca"}
                  />
                ))}
              </div>
            )}
          </div>

          {!loading && products.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-10 pt-5 border-t border-slate-100 w-full select-none">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-colors"
              >
                <ChevronsLeft size={16} />
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1 text-xs font-semibold"
              >
                <ChevronLeft size={16} /> Trước
              </button>
              {[...Array(totalPages)].map((_, index) => {
                const pageNum = index + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-9 h-9 rounded-lg border text-xs font-bold transition-all ${
                      currentPage === pageNum
                        ? "bg-[#006c49] border-[#006c49] text-white shadow-sm shadow-emerald-700/20"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1 text-xs font-semibold"
              >
                Sau <ChevronRight size={16} />
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-colors"
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="w-full lg:w-64 border border-slate-100 rounded-xl p-4 bg-white shadow-sm order-1 lg:order-2 sticky top-4">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm">Chọn lọc</h3>
            <button
              onClick={() => setSearchParams({})}
              className="text-xs text-slate-400 hover:text-red-500 transition-colors"
            >
              Đặt lại
            </button>
          </div>

          <div className="mb-5">
            <h4 className="text-xs font-bold text-slate-700 mb-2">
              Phương thức giao hàng
            </h4>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={freshShipping}
                  onChange={(e) => updateFilter("fresh", e.target.checked)}
                  className="rounded text-[#006c49] focus:ring-[#006c49] w-3.5 h-3.5"
                />{" "}
                Giao hàng hoả tốc
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={globalShipping}
                  onChange={(e) => updateFilter("global", e.target.checked)}
                  className="rounded text-[#006c49] focus:ring-[#006c49] w-3.5 h-3.5"
                />{" "}
                <span className="bg-orange-500 text-white text-[10px] px-1 rounded font-black scale-90">
                  GLOBAL
                </span>
              </label>
            </div>
          </div>

          <div className="mb-5">
            <h4 className="text-xs font-bold text-slate-700 mb-2">Giá bán</h4>
            <div className="space-y-2">
              {priceFilters.map((item) => (
                <label
                  key={item.value}
                  className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="price-filter"
                    value={item.value}
                    checked={selectedPrice === item.value}
                    onChange={() => updateFilter("price", item.value)}
                    className="text-[#006c49] focus:ring-[#006c49] w-3.5 h-3.5"
                  />{" "}
                  {item.label}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
