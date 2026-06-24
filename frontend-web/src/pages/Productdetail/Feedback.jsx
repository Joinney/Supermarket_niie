import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Star,
  ThumbsUp,
  Video,
  Calendar,
  Box,
  MessageSquare,
} from "lucide-react";
import { productApi } from "../../api/axios";

export default function Feedback({ selectedVariant, mainMedia }) {
  const { id } = useParams(); // Tự động lấy id sản phẩm từ thanh địa chỉ URL
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeImageMap, setActiveImageMap] = useState({});
  const [data, setData] = useState({ summary: null, reviews: [] });
  const [loading, setLoading] = useState(true);

  // 1. GỌI API LẤY ĐÁNH GIÁ KHI VÀO TRANG
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    productApi
      .get(`/products/${id}/reviews`)
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Lỗi tải đánh giá:", err);
        setLoading(false);
      });
  }, [id]);

  const { summary, reviews } = data;

  // 2. KHỞI TẠO BỘ LỌC ĐỘNG TỪ DỮ LIỆU API
  const filterOptions = [
    { id: "all", label: "Tất Cả", count: summary?.total || 0 },
    { id: "5star", label: "5 Sao", count: summary?.["5"] || 0 },
    { id: "4star", label: "4 Sao", count: summary?.["4"] || 0 },
    { id: "3star", label: "3 Sao", count: summary?.["3"] || 0 },
    { id: "2star", label: "2 Sao", count: summary?.["2"] || 0 },
    { id: "1star", label: "1 Sao", count: summary?.["1"] || 0 },
    { id: "comment", label: "Có Bình Luận", count: summary?.hasComment || 0 },
    {
      id: "media",
      label: "Có Hình Ảnh / Video",
      count: summary?.hasMedia || 0,
    },
  ];

  // 3. XỬ LÝ LỌC ĐÁNH GIÁ (FILTER)
  const filteredReviews = reviews.filter((r) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "media") return r.media && r.media.length > 0;
    if (activeFilter === "comment")
      return r.noi_dung && r.noi_dung.trim() !== "";
    if (activeFilter.endsWith("star"))
      return r.so_sao === parseInt(activeFilter.charAt(0));
    return true;
  });

  const handleImageClick = (reviewId, imgIndex) => {
    setActiveImageMap((prev) => ({
      ...prev,
      [reviewId]: prev[reviewId] === imgIndex ? null : imgIndex,
    }));
  };

  if (loading) {
    return (
      <div className="mt-0 bg-white border border-slate-100 rounded-2xl p-5 sm:p-8 text-left shadow-sm animate-pulse">
        <div className="h-6 w-48 bg-slate-200 rounded mb-6"></div>
        <div className="h-32 w-full bg-[#f4faf7] rounded-xl mb-8"></div>
        <div className="space-y-4">
          <div className="h-20 bg-slate-50 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-0 bg-white border border-slate-100 rounded-2xl p-5 sm:p-8 text-left shadow-sm">
      {/* 🎯 ĐỒNG BỘ: min-h-[40px] giúp ép chung mặt sàn ngang đối xứng với hộp bên phải */}
      <div className="flex items-center gap-2.5 mb-6 border-b border-slate-100 pb-4 min-h-[40px]">
        <MessageSquare size={20} className="text-slate-700 flex-shrink-0" />
        <h2 className="text-base sm:text-lg font-black text-slate-800 uppercase tracking-wider m-0 leading-none">
          Đánh giá sản phẩm
        </h2>
      </div>

      {/* 1. HỘP TỔNG QUAN */}
      <div className="bg-[#f4faf7] border border-[#d6ede4] rounded-xl p-6 flex flex-col lg:flex-row gap-6 items-center mb-8 shadow-sm">
        <div className="text-center lg:pr-8 lg:border-r lg:border-[#d6ede4] flex flex-col items-center justify-center min-w-[160px]">
          <div className="text-3xl sm:text-4xl font-extrabold text-[#006c49] flex items-baseline gap-1">
            {summary?.avgRating || 0}{" "}
            <span className="text-sm font-normal text-slate-400">/ 5</span>
          </div>
          <div className="flex gap-0.5 mt-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={18}
                className={
                  star <= (summary?.avgRating || 0)
                    ? "fill-[#006c49] text-[#006c49]"
                    : "fill-slate-200 text-slate-200"
                }
              />
            ))}
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            ({summary?.total || 0} đánh giá thực tế)
          </p>
        </div>

        {/* Thanh tiến trình hiển thị phần trăm sao (Tạm tính đều nếu chưa có data chi tiết) */}
        <div className="hidden sm:flex flex-col gap-1 w-full max-w-[200px] text-[11px] text-slate-500">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = summary?.[star] || 0;
            const percent =
              summary?.total > 0 ? (count / summary.total) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2">
                <span className="w-3 text-right font-medium">{star}</span>
                <Star size={10} className="fill-slate-400 text-slate-400" />
                <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#006c49] rounded-full transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex-1 flex flex-wrap gap-2 w-full">
          {filterOptions.map((filter) => {
            const isActive = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-4 py-2 border text-xs font-semibold rounded transition-all duration-200 shadow-sm uppercase tracking-wider ${
                  isActive
                    ? "border-[#006c49] bg-[#006c49] text-white font-black scale-[1.02]"
                    : "border-slate-200 bg-white text-slate-600 hover:border-[#006c49] hover:text-[#006c49] hover:bg-slate-50/50"
                }`}
              >
                {filter.label} {filter.count ? `(${filter.count})` : ""}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. DANH SÁCH BÌNH LUẬN */}
      <div className="space-y-6 divide-y divide-slate-100">
        {filteredReviews.length === 0 ? (
          <p className="text-center text-slate-400 py-10 font-medium">
            Chưa có đánh giá nào phù hợp với bộ lọc.
          </p>
        ) : (
          filteredReviews.map((review) => {
            const currentActiveImgIdx = activeImageMap[review.ma_danh_gia];

            return (
              <div
                key={review.ma_danh_gia}
                className="flex gap-4 pt-6 first:pt-0"
              >
                {/* Ảnh đại diện User */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex-shrink-0 flex items-center justify-center text-slate-500 font-bold text-sm uppercase shadow-inner overflow-hidden">
                  {review.user?.avatar_url ? (
                    <img
                      src={review.user.avatar_url}
                      className="w-full h-full object-cover"
                      alt="avatar"
                    />
                  ) : (
                    review.user?.username?.charAt(0) || "U"
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 hover:text-[#006c49] cursor-pointer transition-colors">
                        {review.user?.username || "Khách hàng ẩn danh"}
                      </span>
                      <div className="flex gap-0.5 mt-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={11}
                            className={
                              star <= review.so_sao
                                ? "fill-[#ffb800] text-[#ffb800]"
                                : "fill-slate-200 text-slate-200"
                            }
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} strokeWidth={1.8} />
                      {new Date(review.ngay_tao).toLocaleString("vi-VN")}
                    </span>
                    {review.ten_bien_the && (
                      <>
                        <span className="text-slate-200">|</span>
                        <span className="flex items-center gap-1 text-[#006c49] bg-[#f4faf7] border border-[#e1f2ec] px-1.5 py-0.5 rounded font-semibold">
                          <Box size={12} strokeWidth={1.8} />
                          Phân loại: {review.ten_bien_the}
                        </span>
                      </>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-800 pt-1 leading-relaxed font-normal">
                    {review.noi_dung}
                  </p>

                  {/* Hiển thị Hình ảnh / Video của Đánh giá */}
                  {review.media && review.media.length > 0 && (
                    <div className="space-y-3 pt-1">
                      <div className="flex gap-2 flex-wrap">
                        {review.media.map((mediaItem, idx) => {
                          const isVideoThumb = mediaItem.type === "video";
                          const isSelected = currentActiveImgIdx === idx;

                          return (
                            <div
                              key={idx}
                              onClick={() =>
                                handleImageClick(review.ma_danh_gia, idx)
                              }
                              className={`w-18 h-18 rounded-lg relative overflow-hidden cursor-pointer border-2 transition-all duration-200 bg-slate-50 flex-shrink-0 ${
                                isSelected
                                  ? "border-[#006c49] ring-2 ring-emerald-50 scale-95"
                                  : "border-slate-200 hover:opacity-90"
                              }`}
                            >
                              {isVideoThumb ? (
                                <>
                                  <video
                                    src={mediaItem.url}
                                    className="w-full h-full object-cover"
                                  />
                                  <span className="absolute bottom-1 left-1 text-[9px] font-medium bg-black/60 text-white px-1.5 py-0.5 rounded flex items-center gap-1 backdrop-blur-[1px]">
                                    <Video size={10} className="fill-white" />
                                    {mediaItem.duration || "0:00"}
                                  </span>
                                </>
                              ) : (
                                <img
                                  src={mediaItem.url}
                                  className="w-full h-full object-cover"
                                  alt={`review-thumb-${idx}`}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Khung Zoom Ảnh/Video */}
                      {currentActiveImgIdx !== undefined &&
                        currentActiveImgIdx !== null && (
                          <div className="w-full max-w-[340px] aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-900 shadow-md relative">
                            {review.media[currentActiveImgIdx].type ===
                            "video" ? (
                              <video
                                src={review.media[currentActiveImgIdx].url}
                                controls
                                autoPlay
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <img
                                src={review.media[currentActiveImgIdx].url}
                                className="w-full h-full object-contain"
                                alt="Expanded preview"
                              />
                            )}
                            <button
                              onClick={() =>
                                handleImageClick(
                                  review.ma_danh_gia,
                                  currentActiveImgIdx,
                                )
                              }
                              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center text-xs hover:bg-black/70 transition-colors z-10"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                    </div>
                  )}

                  {/* Phản hồi của Shop */}
                  {review.phan_hoi_nguoi_ban && (
                    <div className="bg-[#fcfcfc] border border-slate-100 p-4 rounded-xl mt-3 text-xs space-y-1.5 text-left relative before:absolute before:left-4 before:-top-2 before:w-3 before:h-3 before:bg-[#fcfcfc] before:border-l before:border-t before:border-slate-100 before:rotate-45">
                      <span className="font-bold text-slate-700 block tracking-wide uppercase text-[10px] border-l-2 border-[#006c49] pl-1.5">
                        Phản Hồi Của Người Bán
                      </span>
                      <p className="text-slate-500 leading-relaxed font-normal">
                        {review.phan_hoi_nguoi_ban}
                      </p>
                    </div>
                  )}

                  {/* Nút Hữu ích */}
                  <div className="pt-2">
                    <button
                      className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all duration-200 ${
                        review.luot_huu_ich > 0
                          ? "text-[#006c49] bg-[#f4faf7] border-[#d6ede4] hover:bg-[#eaf5f0]"
                          : "text-slate-400 border-slate-100 hover:text-slate-600 hover:border-slate-200"
                      }`}
                    >
                      <ThumbsUp
                        size={12}
                        className={
                          review.luot_huu_ich > 0 ? "fill-[#006c49]" : ""
                        }
                      />
                      <span>
                        {review.luot_huu_ich > 0
                          ? review.luot_huu_ich
                          : "Hữu ích"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 3. PHÂN TRANG (Giữ nguyên cấu trúc giao diện tĩnh) */}
      {filteredReviews.length > 0 && (
        <div className="flex items-center justify-center gap-1.5 mt-10 pt-5 border-t border-slate-100">
          <button className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#006c49] hover:bg-slate-50 rounded transition-colors text-sm font-light">
            &lt;
          </button>
          <button className="w-8 h-8 bg-[#006c49] text-white rounded text-xs font-bold flex items-center justify-center shadow-sm shadow-emerald-100">
            1
          </button>
          {[2, 3, 4, 5].map((page) => (
            <button
              key={page}
              className="w-8 h-8 text-slate-600 hover:text-[#006c49] hover:bg-[#f4faf7] rounded text-xs font-semibold flex items-center justify-center transition-colors"
            >
              {page}
            </button>
          ))}
          <span className="text-slate-300 text-xs px-1 select-none">...</span>
          <button className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#006c49] hover:bg-slate-50 rounded transition-colors text-sm font-light">
            &gt;
          </button>
        </div>
      )}
    </div>
  );
}
