import React, { useState, useEffect } from "react";
import { X, Camera, Video, Star, ChevronDown } from "lucide-react";
import ReactDOM from "react-dom";
import { productApi } from "../../api/axios";

export default function ReviewModal({
  isOpen,
  onClose,
  orderId,
  productsToReview,
  onSuccess,
}) {
  const [reviews, setReviews] = useState([]);
  const [hoverRatings, setHoverRatings] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAnonymous, setShowAnonymous] = useState(false);

  useEffect(() => {
    if (isOpen && productsToReview && productsToReview.length > 0) {
      console.log("Dữ liệu sản phẩm truyền vào Modal:", productsToReview);
      setReviews(
        productsToReview.map((p) => ({
          ma_san_pham: p.ma_san_pham || p.productId,
          ma_bien_the: p.ma_bien_the || p.variantId,
          ten_san_pham: p.product_name || p.ten_san_pham || "Sản phẩm",
          ten_bien_the:
            p.variant_name || p.ten_bien_the || p.phan_loai || "Mặc định",
          hinh_anh:
            p.hinh_anh_chinh || p.image_url || p.image || p.hinh_anh || "",
          rating: 5,
          // 🌟 THÊM STATE CHO CÁC TRƯỜNG ĐÁNH GIÁ CHI TIẾT
          chatLieu: "",
          mauSac: "",
          thietKe: "",
          comment: "",
          media: [],
        })),
      );
      setHoverRatings({});
      setShowAnonymous(false);
    }
  }, [isOpen, productsToReview]);

  if (!isOpen || !productsToReview || productsToReview.length === 0) {
    return null;
  }

  const handleRatingChange = (index, value) => {
    const newReviews = [...reviews];
    newReviews[index].rating = value;
    setReviews(newReviews);
  };

  // 🌟 HÀM DÙNG CHUNG ĐỂ UPDATE TEXT CHO TỪNG TRƯỜNG
  const handleFieldChange = (index, field, value) => {
    const newReviews = [...reviews];
    newReviews[index][field] = value;
    setReviews(newReviews);
  };

  const getRatingText = (rating) => {
    switch (rating) {
      case 5:
        return "Tuyệt vời";
      case 4:
        return "Rất tốt";
      case 3:
        return "Bình thường";
      case 2:
        return "Tệ";
      case 1:
        return "Rất tệ";
      default:
        return "";
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      for (const review of reviews) {
        // 🌟 GỘP CÁC TRƯỜNG LẠI THÀNH 1 CHUỖI ĐỂ GỬI LÊN BACKEND
        let finalNoiDung = "";
        if (review.chatLieu) finalNoiDung += `Chất liệu: ${review.chatLieu}\n`;
        if (review.mauSac) finalNoiDung += `Màu sắc: ${review.mauSac}\n`;
        if (review.thietKe) finalNoiDung += `Thiết kế: ${review.thietKe}\n`;
        if (review.comment) finalNoiDung += `\n${review.comment}`;

        const payload = {
          ma_san_pham: review.ma_san_pham,
          ma_bien_the: review.ma_bien_the,
          ma_don_hang: String(orderId),
          so_sao: review.rating,
          noi_dung: finalNoiDung.trim() || "Sản phẩm tuyệt vời!",
          // an_danh: showAnonymous // Mở ra nếu Backend có hỗ trợ
        };
        await productApi.post("/reviews", payload);
      }

      alert("🎉 Đánh giá thành công! Cảm ơn bạn đã mua sắm tại Demi Mart.");
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Lỗi đánh giá:", error);
      alert(
        error.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại sau.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh] animate-fade-in-up">
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-wide">
            Đánh Giá Sản Phẩm
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 p-2 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-6 overflow-y-auto bg-slate-50/50 flex-1 custom-scrollbar">
          {/* Banner thưởng xu */}
          <div className="mb-6 flex items-center justify-between p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 bg-amber-400 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm">
                D
              </span>
              <span>
                Xem Hướng dẫn đánh giá chuẩn để nhận đến{" "}
                <b className="text-amber-600 font-black">200 xu</b>!
              </span>
            </div>
            <button className="text-amber-700 hover:text-amber-800 bg-amber-100/50 p-1 rounded-md">
              <ChevronDown size={18} />
            </button>
          </div>

          {reviews.map((review, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6"
            >
              {/* Thông tin sản phẩm */}
              <div className="flex gap-4 items-center mb-6">
                <img
                  src={
                    review.hinh_anh ||
                    "https://images.unsplash.com/photo-1542838132-92c53300491e?w=150"
                  }
                  alt={review.ten_san_pham}
                  onError={(e) => {
                    e.target.onerror = null; // Tránh vòng lặp lỗi
                    e.target.src =
                      "https://images.unsplash.com/photo-1542838132-92c53300491e?w=150";
                  }}
                  className="w-16 h-16 object-cover rounded-xl border border-slate-100 bg-slate-50 shrink-0"
                />
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    {review.ten_san_pham}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 font-medium bg-slate-100 inline-block px-2.5 py-0.5 rounded-md">
                    Phân loại: {review.ten_bien_the}
                  </p>
                </div>
              </div>

              {/* Đánh giá sao */}
              <div className="flex items-center gap-4 mb-6 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                <span className="text-sm text-slate-700 font-bold ml-2">
                  Chất lượng sản phẩm
                </span>
                <div className="flex gap-1 ml-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRatingChange(index, star)}
                      onMouseEnter={() =>
                        setHoverRatings({ ...hoverRatings, [index]: star })
                      }
                      onMouseLeave={() =>
                        setHoverRatings({ ...hoverRatings, [index]: 0 })
                      }
                      className="focus:outline-none transition-transform hover:scale-125 hover:-translate-y-1"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= (hoverRatings[index] || review.rating)
                            ? "fill-amber-400 text-amber-400"
                            : "fill-slate-200 text-slate-200"
                        } transition-colors drop-shadow-sm`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-sm font-black text-amber-500 w-24 ml-2">
                  {getRatingText(hoverRatings[index] || review.rating)}
                </span>
              </div>

              {/* 🌟 KHU VỰC NHẬP LIỆU GIỐNG SHOPEE */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 relative shadow-sm">
                {/* 3 Trường chi tiết */}
                <div className="flex flex-col gap-3 mb-4">
                  <div className="flex gap-3 items-start">
                    <span className="text-sm font-bold text-slate-700 min-w-[70px] mt-0.5">
                      Chất liệu:
                    </span>
                    <input
                      type="text"
                      placeholder="VD: Tôi thích chất liệu nhựa mềm và cầm rất êm."
                      value={review.chatLieu}
                      onChange={(e) =>
                        handleFieldChange(index, "chatLieu", e.target.value)
                      }
                      className="flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder-slate-300"
                    />
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="text-sm font-bold text-slate-700 min-w-[70px] mt-0.5">
                      Màu sắc:
                    </span>
                    <input
                      type="text"
                      placeholder="VD: Màu sắc sản phẩm tươi sáng và bắt mắt."
                      value={review.mauSac}
                      onChange={(e) =>
                        handleFieldChange(index, "mauSac", e.target.value)
                      }
                      className="flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder-slate-300"
                    />
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="text-sm font-bold text-slate-700 min-w-[70px] mt-0.5">
                      Thiết kế:
                    </span>
                    <input
                      type="text"
                      placeholder="VD: Thiết kế rất đáng yêu và sinh động."
                      value={review.thietKe}
                      onChange={(e) =>
                        handleFieldChange(index, "thietKe", e.target.value)
                      }
                      className="flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder-slate-300"
                    />
                  </div>
                </div>

                <div className="h-px bg-slate-100 my-4 w-full"></div>

                {/* Bình luận chung */}
                <textarea
                  rows="3"
                  placeholder="Hãy chia sẻ những điều bạn thích về sản phẩm này với những người mua khác nhé."
                  value={review.comment}
                  onChange={(e) =>
                    handleFieldChange(index, "comment", e.target.value)
                  }
                  className="w-full bg-transparent text-sm text-slate-800 outline-none resize-none placeholder-slate-300 font-medium"
                />

                {/* Nút thêm ảnh / video */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                  <div className="flex gap-2">
                    <button className="flex items-center gap-1.5 px-3 py-2 border border-[#006c49] text-[#006c49] rounded-lg text-xs font-bold hover:bg-[#006c49] hover:text-white transition-colors">
                      <Camera size={14} /> Thêm Hình ảnh
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-2 border border-[#006c49] text-[#006c49] rounded-lg text-xs font-bold hover:bg-[#006c49] hover:text-white transition-colors">
                      <Video size={14} /> Thêm Video
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium hidden sm:block">
                    Thêm 50 ký tự và 1 hình ảnh để nhận{" "}
                    <b className="text-amber-500 font-bold">200 xu</b>
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Tùy chọn Ẩn danh */}
          <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-2">
            <input
              type="checkbox"
              id="anonymous"
              checked={showAnonymous}
              onChange={(e) => setShowAnonymous(e.target.checked)}
              className="w-5 h-5 text-[#006c49] border-slate-300 rounded focus:ring-[#006c49] accent-[#006c49] cursor-pointer"
            />
            <label
              htmlFor="anonymous"
              className="text-sm text-slate-700 cursor-pointer select-none"
            >
              <span className="font-bold block text-slate-800">
                Hiển thị tên đăng nhập trên đánh giá này
              </span>
              <span className="text-xs text-slate-500 block mt-1 font-medium">
                Tên tài khoản sẽ được hiển thị như d***m
              </span>
            </label>
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 bg-white flex justify-end gap-3 border-t border-slate-100 shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-slate-600 font-black text-xs hover:bg-slate-100 transition-colors rounded-xl uppercase tracking-wider"
          >
            Trở lại
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`px-8 py-2.5 font-black text-xs text-white rounded-xl transition-colors uppercase tracking-wider shadow-md ${
              isSubmitting
                ? "bg-[#006c49]/60 cursor-not-allowed"
                : "bg-[#006c49] hover:bg-[#005236] hover:shadow-lg hover:-translate-y-0.5"
            }`}
          >
            {isSubmitting ? "Đang gửi..." : "Hoàn thành"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
