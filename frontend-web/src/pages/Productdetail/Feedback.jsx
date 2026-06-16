import React, { useState } from 'react';
import { Star, ThumbsUp, Video, Calendar, Box, MessageSquare } from 'lucide-react';

export default function Feedback({ selectedVariant, mainMedia }) {
  // Quản lý trạng thái bộ lọc đang chọn (Mặc định là 'all')
  const [activeFilter, setActiveFilter] = useState('all');
  // Quản lý ảnh đang được chọn để xem lớn cho từng review (key-value: reviewId - imageIndex)
  const [activeImageMap, setActiveImageMap] = useState({});

  // Danh sách cấu hình các nút bấm bộ lọc
  const filterOptions = [
    { id: 'all', label: 'Tất Cả', count: null },
    { id: '5star', label: '5 Sao', count: '12,1k' },
    { id: '4star', label: '4 Sao', count: '1,1k' },
    { id: '3star', label: '3 Sao', count: '369' },
    { id: '2star', label: '2 Sao', count: '106' },
    { id: '1star', label: '1 Sao', count: '180' },
    { id: 'comment', label: 'Có Bình Luận', count: '4,1k' },
    { id: 'media', label: 'Có Hình Ảnh / Video', count: '1,5k' },
  ];

  // Dữ liệu đánh giá mẫu dữ liệu gốc của bạn
  const staticReviews = [
    {
      id: 1,
      username: "tukhanjluu",
      rating: 5,
      date: "2026-06-02 10:52",
      variantInfo: selectedVariant?.ten_bien_the || "Đen, 41",
      criteria: [
        { label: "Độ êm", value: "Tôi cảm nhận dép đi rất êm chân" },
        { label: "Chất liệu", value: "chất liệu nhựa dày dặn chắc chắn" },
        { label: "Màu sắc", value: "có nhiều màu sắc đẹp mắt" }
      ],
      comment: "Dép đẹp shop Giao hàng nhanh đóng gói cẩn thận size lớn đúng số lượng tôi sẽ mua nữa cho shop 5 sao",
      likes: 2,
      images: [
        mainMedia?.duong_dan_url || "https://placehold.co/400x400?text=Review+1",
        mainMedia?.duong_dan_url || "https://placehold.co/400x400?text=Review+2",
        "https://placehold.co/400x400?text=Review+3"
      ],
      hasVideo: true,
      videoDuration: "0:33",
      sellerReply: "Chúng tôi xin cảm ơn đánh giá của bạn. Nếu có vấn đề cần thắc mắc, bạn hãy nhắn tin trực tiếp với shop, chúng tôi sẽ hỗ trợ bạn nhiệt tình. Cảm ơn bạn đã tin tưởng sử dụng sản phẩm của shop. Chúc bạn luôn vui vẻ và sẽ sớm tiếp tục ủng hộ Shop ở các sản phẩm khác nhé!"
    },
    {
      id: 2,
      username: "minh_hoang99",
      rating: 5,
      date: "2026-05-28 14:15",
      variantInfo: "Mặc định",
      criteria: [],
      comment: "Sản phẩm tuyệt vời hảo hạng. Đúng tiêu chuẩn Demi Fresh sạch sẽ, tươi ngon, đóng thùng xốp mát lạnh khi vận chuyển đến nhà. Shop làm ăn uy tín lắm nha mọi người nên mua thử ạ!",
      likes: 0,
      images: [],
      hasVideo: false,
      sellerReply: null
    }
  ];

  // Hàm xử lý khi click chọn xem ảnh trong bài review
  const handleImageClick = (reviewId, imgIndex) => {
    setActiveImageMap(prev => ({
      ...prev,
      // Nếu click lại đúng ảnh đang mở thì đóng lại (set null), ngược lại thì mở ảnh đó
      [reviewId]: prev[reviewId] === imgIndex ? null : imgIndex
    }));
  };

  return (
    <div className="mt-16 bg-white border border-slate-100 rounded-2xl p-5 sm:p-8 text-left shadow-sm">
      <div className="flex items-center gap-2.5 mb-6 border-b border-slate-100 pb-4">
        <MessageSquare size={20} className="text-slate-700" />
        <h2 className="text-base sm:text-lg font-black text-slate-800 uppercase tracking-wider">
          Đánh giá sản phẩm
        </h2>
      </div>
      
      {/* 1. HỘP TỔNG QUAN & BỘ LỌC ĐÁNH GIÁ ĐỒNG BỘ MÀU XANH #006c49 */}
      <div className="bg-[#f4faf7] border border-[#d6ede4] rounded-xl p-6 flex flex-col lg:flex-row gap-6 items-center mb-8 shadow-sm">
        {/* Điểm số tổng quát bên trái */}
        <div className="text-center lg:pr-8 lg:border-r lg:border-[#d6ede4] flex flex-col items-center justify-center min-w-[160px]">
          <div className="text-3xl sm:text-4xl font-extrabold text-[#006c49] flex items-baseline gap-1">
            4.8 <span className="text-sm font-normal text-slate-400">/ 5</span>
          </div>
          <div className="flex gap-0.5 mt-1.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={18} className="fill-[#006c49] text-[#006c49]" />
            ))}
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">(13,8k đánh giá thực tế)</p>
        </div>

        {/* Tiến trình phân bổ sao trực quan ở giữa */}
        <div className="hidden sm:flex flex-col gap-1 w-full max-w-[200px] text-[11px] text-slate-500">
          {[5, 4, 3, 2, 1].map((star) => (
            <div key={star} className="flex items-center gap-2">
              <span className="w-3 text-right font-medium">{star}</span>
              <Star size={10} className="fill-slate-400 text-slate-400" />
              <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#006c49] rounded-full" 
                  style={{ width: star === 5 ? '88%' : star === 4 ? '8%' : '2%' }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* Các nút bấm Filter Động màu #006c49 */}
        <div className="flex-1 flex flex-wrap gap-2 w-full">
          {filterOptions.map((filter) => {
            const isActive = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-4 py-2 border text-xs font-semibold rounded transition-all duration-200 shadow-sm uppercase tracking-wider ${
                  isActive
                    ? 'border-[#006c49] bg-[#006c49] text-white font-black scale-[1.02]'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-[#006c49] hover:text-[#006c49] hover:bg-slate-50/50'
                }`}
              >
                {filter.label} {filter.count ? `(${filter.count})` : ''}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. DANH SÁCH CÁC BÌNH LUẬN CHI TIẾT */}
      <div className="space-y-6 divide-y divide-slate-100">
        {staticReviews.map((review) => {
          const currentActiveImgIdx = activeImageMap[review.id];

          return (
            <div key={review.id} className="flex gap-4 pt-6 first:pt-0">
              {/* Avatar người dùng */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex-shrink-0 flex items-center justify-center text-slate-500 font-bold text-sm uppercase shadow-inner">
                {review.username.charAt(0)}
              </div>
              
              <div className="flex-1 space-y-2">
                {/* Tên tài khoản & Sao hệ màu vàng gold chuẩn tinh tế */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 hover:text-[#006c49] cursor-pointer transition-colors">
                      {review.username}
                    </span>
                    <div className="flex gap-0.5 mt-0.5">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} size={11} className="fill-[#ffb800] text-[#ffb800]" />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Meta info: Thời gian & Phân loại hàng */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-400 font-medium">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} strokeWidth={1.8} />
                    {review.date}
                  </span>
                  <span className="text-slate-200">|</span>
                  <span className="flex items-center gap-1 text-[#006c49] bg-[#f4faf7] border border-[#e1f2ec] px-1.5 py-0.5 rounded font-semibold">
                    <Box size={12} strokeWidth={1.8} />
                    Phân loại: {review.variantInfo}
                  </span>
                </div>

                {/* Tiêu chí đặc tính đánh giá dạng Tag Chips màu lục nhẹ */}
                {review.criteria.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {review.criteria.map((criterion, idx) => (
                      <span key={idx} className="text-[11px] text-slate-600 bg-slate-100/70 border border-slate-200/50 px-2.5 py-0.5 rounded-full">
                        <strong className="text-slate-400 font-normal">{criterion.label}:</strong> {criterion.value}
                      </span>
                    ))}
                  </div>
                )}

                {/* Nội dung text bình luận của khách */}
                <p className="text-xs sm:text-sm text-slate-800 pt-1 leading-relaxed font-normal">
                  {review.comment}
                </p>

                {/* Khối Ảnh / Video đính kèm review có tương tác click zoom */}
                {review.images.length > 0 && (
                  <div className="space-y-3 pt-1">
                    {/* Hàng ảnh Thumbnails */}
                    <div className="flex gap-2 flex-wrap">
                      {review.images.map((imgUrl, idx) => {
                        const isVideoThumb = idx === 0 && review.hasVideo;
                        const isSelected = currentActiveImgIdx === idx;

                        return (
                          <div 
                            key={idx}
                            onClick={() => handleImageClick(review.id, idx)}
                            className={`w-18 h-18 rounded-lg relative overflow-hidden cursor-pointer border-2 transition-all duration-200 bg-slate-50 flex-shrink-0 ${
                              isSelected ? 'border-[#006c49] ring-2 ring-emerald-50 scale-95' : 'border-slate-200 hover:opacity-90'
                            }`}
                          >
                            <img src={imgUrl} className="w-full h-full object-cover" alt={`review-thumb-${idx}`} />
                            
                            {/* Nhãn hiển thị nếu là video */}
                            {isVideoThumb && (
                              <span className="absolute bottom-1 left-1 text-[9px] font-medium bg-black/60 text-white px-1.5 py-0.5 rounded flex items-center gap-1 backdrop-blur-[1px]">
                                <Video size={10} className="fill-white" />
                                {review.videoDuration}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Vùng hiển thị ảnh phóng to mượt mà khi người dùng click chọn */}
                    {currentActiveImgIdx !== undefined && currentActiveImgIdx !== null && (
                      <div className="w-full max-w-[340px] aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-900 shadow-md relative animate-fadeIn">
                        <img 
                          src={review.images[currentActiveImgIdx]} 
                          className="w-full h-full object-contain" 
                          alt="Expanded preview" 
                        />
                        <button 
                          onClick={() => handleImageClick(review.id, currentActiveImgIdx)}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center text-xs hover:bg-black/70 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Phần phản hồi của người bán tinh tế màu nền dịu mắt */}
                {review.sellerReply && (
                  <div className="bg-[#fcfcfc] border border-slate-100 p-4 rounded-xl mt-3 text-xs space-y-1.5 text-left relative before:absolute before:left-4 before:-top-2 before:w-3 before:h-3 before:bg-[#fcfcfc] before:border-l before:border-t before:border-slate-100 before:rotate-45">
                    <span className="font-bold text-slate-700 block tracking-wide uppercase text-[10px] border-l-2 border-[#006c49] pl-1.5">
                      Phản Hồi Của Người Bán
                    </span>
                    <p className="text-slate-500 leading-relaxed font-normal">
                      {review.sellerReply}
                    </p>
                  </div>
                )}

                {/* Nút thích đánh giá (Like button) */}
                <div className="pt-2">
                  <button className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all duration-200 ${
                    review.likes > 0 
                      ? 'text-[#006c49] bg-[#f4faf7] border-[#d6ede4] hover:bg-[#eaf5f0]' 
                      : 'text-slate-400 border-slate-100 hover:text-slate-600 hover:border-slate-200'
                  }`}>
                    <ThumbsUp size={12} className={review.likes > 0 ? 'fill-[#006c49]' : ''} />
                    <span>{review.likes > 0 ? review.likes : "Hữu ích"}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. PHÂN TRANG ĐÁNH GIÁ ĐỒNG BỘ MÀU #006c49 */}
      <div className="flex items-center justify-center gap-1.5 mt-10 pt-5 border-t border-slate-100">
        <button className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#006c49] hover:bg-slate-50 rounded transition-colors text-sm font-light">
          &lt;
        </button>
        <button className="w-8 h-8 bg-[#006c49] text-white rounded text-xs font-bold flex items-center justify-center shadow-sm shadow-emerald-100 transition-transform active:scale-95">
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
    </div>
  );
}