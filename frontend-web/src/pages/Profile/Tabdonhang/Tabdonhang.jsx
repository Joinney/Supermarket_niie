import React, { useState } from "react";
import { Package, MapPin, ChevronDown, ChevronUp, Trash2, FileText, Star } from "lucide-react";
import ModalLoTrinh from "./ModalLoTrinh";

export default function Tabdonhang({ orders, onCancelOrder, onReviewOrder, onViewDetails }) {
  const [selectedOrderForMap, setSelectedOrderForMap] = useState(null);
  const [expandedOrders, setExpandedOrders] = useState({});

  const toggleOrderExpand = (orderId) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 space-y-2">
        <Package className="w-12 h-12 mx-auto opacity-40" />
        <p className="text-sm font-bold">Bạn chưa có đơn hàng mua sắm nào.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      <h2 className="text-xl font-black text-slate-900 border-b border-slate-50 pb-4">
        Lịch sử giao dịch vận đơn
      </h2>
      <div className="space-y-4">
        {orders.map((order) => {
          const items = order.items || [];

          // 🌟 THUẬT TOÁN GOM NHÓM: Gom các biến thể cùng 1 sản phẩm lại với nhau
          const groupedItemsMap = {};
          items.forEach((item) => {
            const key = item.ma_san_pham || item.product_name || "unknown";
            if (!groupedItemsMap[key]) {
              groupedItemsMap[key] = {
                product_name: item.product_name || "Kiện hàng Demi Mart",
                image_url: item.image_url,
                variants: [],
              };
            }
            groupedItemsMap[key].variants.push({
              name: item.variant_name || "Mặc định",
              qty: item.quantity || 1,
            });
          });

          const groupedItems = Object.values(groupedItemsMap);
          const firstGroup = groupedItems[0];

          const statusText = order.trang_thai_don_hang || "Chờ xử lý";
          const orderIdStr = order.id || order.ma_don_hang;
          const isExpanded = !!expandedOrders[orderIdStr];

          if (!firstGroup) return null;

          return (
            <div
              key={orderIdStr}
              className="p-5 rounded-3xl bg-white border border-slate-100 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                <div>
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                    Mã đơn: #{order.ma_don_hang}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">
                    Đặt lúc:{" "}
                    {new Date(
                      order.ngay_tao || order.created_at || Date.now(),
                    ).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                <span className="text-[10px] px-3 py-1 rounded-full font-black uppercase bg-emerald-50 text-[#006c49] border border-emerald-100">
                  {statusText}
                </span>
              </div>

              {/* 🌟 RENDER SẢN PHẨM ĐẦU TIÊN */}
              <div className="flex gap-4 items-center">
                <img
                  src={
                    firstGroup.image_url ||
                    "https://images.unsplash.com/photo-1542838132-92c53300491e?w=150"
                  }
                  className="w-16 h-16 rounded-2xl object-cover border border-slate-100 bg-slate-50 shrink-0"
                  alt="prod"
                />
                <div className="flex-1 min-w-0 text-left">
                  <h4 className="font-bold text-slate-800 text-sm truncate">
                    {firstGroup.product_name}
                  </h4>

                  <p className="text-xs text-slate-400 font-medium mt-0.5 leading-relaxed">
                    Phân loại:{" "}
                    {firstGroup.variants.map((v, i) => (
                      <span key={i}>
                        {v.name} • <b className="text-slate-700">x{v.qty}</b>
                        {i < firstGroup.variants.length - 1 ? ", " : ""}
                      </span>
                    ))}
                  </p>

                  {groupedItems.length > 1 && (
                    <button
                      onClick={() => toggleOrderExpand(orderIdStr)}
                      className="text-[10px] text-[#006c49] font-bold italic flex items-center mt-1.5 hover:underline"
                    >
                      {isExpanded ? (
                        <>
                          Thu gọn <ChevronUp size={12} className="ml-0.5" />
                        </>
                      ) : (
                        <>
                          Xem thêm {groupedItems.length - 1} sản phẩm khác{" "}
                          <ChevronDown size={12} className="ml-0.5" />
                        </>
                      )}
                    </button>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs text-slate-400 block font-medium">
                    Tổng tiền
                  </span>
                  <span className="text-base font-black text-[#006c49]">
                    {(Number(order.tong_thanh_toan) || 0).toLocaleString(
                      "vi-VN",
                    )}
                    đ
                  </span>
                </div>
              </div>

              {/* 🌟 RENDER CÁC SẢN PHẨM KHÁC */}
              {isExpanded && groupedItems.length > 1 && (
                <div className="mt-2 pt-2 border-t border-dashed border-slate-200 flex flex-col gap-3 pl-4 animate-fadeIn">
                  {groupedItems.slice(1).map((group, idx) => (
                    <div
                      key={idx}
                      className="flex gap-4 items-center opacity-80"
                    >
                      <img
                        src={
                          group.image_url ||
                          "https://images.unsplash.com/photo-1542838132-92c53300491e?w=150"
                        }
                        className="w-12 h-12 rounded-xl object-cover border border-slate-100 bg-slate-50 shrink-0"
                        alt="prod"
                      />
                      <div className="flex-1 min-w-0 text-left">
                        <h4 className="font-bold text-slate-800 text-xs truncate">
                          {group.product_name}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5 leading-relaxed">
                          Phân loại:{" "}
                          {group.variants.map((v, i) => (
                            <span key={i}>
                              {v.name} •{" "}
                              <b className="text-slate-700">x{v.qty}</b>
                              {i < group.variants.length - 1 ? ", " : ""}
                            </span>
                          ))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 🌟 KHU VỰC THAY ĐỔI NÚT CHỨC NĂNG DỰA TRÊN TRẠNG THÁI ĐƠN HÀNG */}
              <div className="border-t border-slate-50 pt-3 flex justify-between items-center gap-2">
                <span className="text-[11px] text-slate-500 font-semibold truncate max-w-[40%]">
                  🚀 Giao bởi: {order.don_vi_van_chuyen || "Siêu thị Demi"}
                </span>

                <div className="flex items-center gap-2 shrink-0">
                  {/* TRẠNG THÁI: CHỜ XÁC NHẬN -> Hiện nút Hủy đơn sáng */}
                  {statusText === "Chờ xác nhận" && (
                    <button
                      onClick={() => onCancelOrder && onCancelOrder(order)}
                      className="bg-red-50 hover:bg-red-600 text-red-600 hover:text-white px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border border-red-200/60 cursor-pointer"
                    >
                      <Trash2 size={12} /> Hủy đơn hàng
                    </button>
                  )}

                  {/* TRẠNG THÁI: XÁC NHẬN -> Làm mờ nút Hủy đơn hoàn toàn */}
                  {statusText === "Xác nhận" && (
                    <button
                      disabled
                      className="bg-slate-100 text-slate-400 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 border border-slate-200 opacity-60 cursor-not-allowed"
                    >
                      <Trash2 size={12} /> Hủy đơn hàng
                    </button>
                  )}

                  {/* TRẠNG THÁI: ĐANG GIAO -> Hiện nút Theo dõi lộ trình */}
                  {statusText === "Đang giao" && (
                    <button
                      onClick={() => setSelectedOrderForMap(order)}
                      className="bg-emerald-50 hover:bg-[#006c49] text-[#006c49] hover:text-white px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border border-emerald-200/60 cursor-pointer"
                    >
                      <MapPin size={12} /> Theo dõi lộ trình
                    </button>
                  )}

                  {/* TRẠNG THÁI: ĐÃ GIAO -> Hiện bộ đôi nút Chi tiết và Đánh giá */}
                  {statusText === "Đã giao" && (
                    <>
                      <button
                        onClick={() => onViewDetails && onViewDetails(order)}
                        className="bg-slate-50 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border border-slate-200 cursor-pointer"
                      >
                        <FileText size={12} /> Chi tiết
                      </button>
                      <button
                        onClick={() => onReviewOrder && onReviewOrder(order)}
                        className="bg-amber-50 hover:bg-amber-500 text-amber-700 hover:text-white px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1 border border-amber-200 cursor-pointer"
                      >
                        <Star size={12} /> Đánh giá
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <ModalLoTrinh
        isOpen={!!selectedOrderForMap}
        order={selectedOrderForMap}
        onClose={() => setSelectedOrderForMap(null)}
      />
    </div>
  );
}