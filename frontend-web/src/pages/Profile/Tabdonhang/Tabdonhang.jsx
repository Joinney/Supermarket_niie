import React, { useState } from "react";
import { 
  Package, 
  MapPin, 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  FileText, 
  Star,
  ClipboardCheck, 
  Bike,          
  Home            
} from "lucide-react";
import ModalLoTrinh from "./ModalLoTrinh";

const ORDER_STEPS = [
  { id: "step_init", icon: ClipboardCheck, matchStatuses: ["Chờ xác nhận", "Xác nhận"] },
  { label: "Lấy hàng", icon: Package, matchStatuses: ["Lấy hàng"] }, 
  { label: "Đang giao", icon: Bike, matchStatuses: ["Đang giao"] },
  { label: "Đã giao", icon: Home, matchStatuses: ["Đã giao"] },
];

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
      <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 space-y-2">
        <Package className="w-10 h-12 mx-auto opacity-40" />
        <p className="text-sm font-bold">Bạn chưa có đơn hàng mua sắm nào.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-left max-w-4xl mx-auto">
      <h2 className="text-lg font-black text-slate-900 border-b border-slate-50 pb-3">
        Lịch sử giao dịch vận đơn
      </h2>
      <div className="space-y-3.5">
        {orders.map((order) => {
          const items = order.items || [];

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

          const statusText = order.trang_thai_don_hang || "Chờ xác nhận";
          const orderIdStr = order.id || order.ma_don_hang;
          const isExpanded = !!expandedOrders[orderIdStr];

          const currentStepIndex = ORDER_STEPS.findIndex(step => 
            step.matchStatuses.includes(statusText)
          );

          if (!firstGroup) return null;

          return (
            <div
              key={orderIdStr}
              className="p-4 rounded-2xl bg-white border border-slate-100 flex flex-col gap-3.5 shadow-xs hover:shadow-sm transition-all"
            >
              {/* Header đơn hàng tinh gọn */}
              <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                <div>
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                    Mã đơn: #{order.ma_don_hang}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">
                    Đặt lúc: {new Date(order.ngay_tao || order.created_at || Date.now()).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase bg-emerald-50 text-[#006c49] border border-emerald-100/60">
                  {statusText}
                </span>
              </div>

              {/* Thông tin sản phẩm */}
              <div className="flex gap-3.5 items-center">
                <img src={firstGroup.image_url || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=150"} className="w-14 h-14 rounded-xl object-cover border border-slate-100 bg-slate-50 shrink-0" alt="prod" />
                <div className="flex-1 min-w-0 text-left">
                  <h4 className="font-bold text-slate-800 text-xs truncate">
                    {firstGroup.product_name}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    Phân loại: {firstGroup.variants.map((v, i) => (
                      <span key={i}>{v.name} • <b className="text-slate-700">x{v.qty}</b>{i < firstGroup.variants.length - 1 ? ", " : ""}</span>
                    ))}
                  </p>

                  {groupedItems.length > 1 && (
                    <button onClick={() => toggleOrderExpand(orderIdStr)} className="text-[10px] text-[#006c49] font-bold italic flex items-center mt-1 hover:underline">
                      {isExpanded ? <>Thu gọn <ChevronUp size={11} className="ml-0.5" /></> : <>Xem thêm {groupedItems.length - 1} sản phẩm khác <ChevronDown size={11} className="ml-0.5" /></>}
                    </button>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[11px] text-slate-400 block font-medium">Tổng tiền</span>
                  <span className="text-sm font-black text-[#006c49]">
                    {(Number(order.tong_thanh_toan) || 0).toLocaleString("vi-VN")} đ
                  </span>
                </div>
              </div>

              {/* Danh sách mở rộng tinh gọn */}
              {isExpanded && groupedItems.length > 1 && (
                <div className="pt-1.5 border-t border-dashed border-slate-100 flex flex-col gap-2.5 pl-4 animate-fadeIn">
                  {groupedItems.slice(1).map((group, idx) => (
                    <div key={idx} className="flex gap-3 items-center opacity-80">
                      <img src={group.image_url || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=150"} className="w-10 h-10 rounded-lg object-cover border border-slate-100 bg-slate-50 shrink-0" alt="prod" />
                      <div className="flex-1 min-w-0 text-left">
                        <h4 className="font-bold text-slate-800 text-[11px] truncate">{group.product_name}</h4>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                          Phân loại: {group.variants.map((v, i) => (
                            <span key={i}>{v.name} • <b className="text-slate-700">x{v.qty}</b>{i < group.variants.length - 1 ? ", " : ""}</span>
                          ))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* STEPPER THU GỌN KHÔNG GIAN DỌC */}
              <div className="py-2 px-1 flex items-center justify-between relative w-full select-none">
                {ORDER_STEPS.map((step, index) => {
                  const StepIcon = step.icon;
                  const isVisited = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;

                  let stepLabel = step.label;
                  if (step.id === "step_init") {
                    stepLabel = (statusText === "Xác nhận") ? "Xác nhận" : "Chờ xác nhận";
                  }

                  let lineWidthClass = "w-0";
                  if (index < currentStepIndex) {
                    lineWidthClass = "w-full";
                  } else if (index === currentStepIndex) {
                    if (step.id === "step_init" && statusText === "Chờ xác nhận") {
                      lineWidthClass = "w-0";
                    } else {
                      lineWidthClass = "w-1/2 animate-pulse bg-gradient-to-r from-orange-500 to-orange-300";
                    }
                  }

                  return (
                    <React.Fragment key={index}>
                      <div className="flex flex-col items-center relative z-10">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-500 shadow-xs ${
                            isVisited ? "bg-orange-500 text-white" : "bg-slate-50 text-slate-400"
                          }`}
                        >
                          <StepIcon className={`w-4 h-4 ${isCurrent && statusText !== "Chờ xác nhận" ? "animate-pulse" : ""}`} />
                        </div>
                        <span className={`text-[9px] font-bold mt-1 transition-colors ${isVisited ? "text-orange-600" : "text-slate-400"}`}>
                          {stepLabel}
                        </span>
                      </div>

                      {index < ORDER_STEPS.length - 1 && (
                        <div className="flex-1 h-[3px] mx-1 bg-slate-50 rounded-full overflow-hidden relative">
                          <div className={`absolute top-0 left-0 h-full bg-orange-500 rounded-full transition-all duration-700 ease-out ${lineWidthClass}`} />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Footer đơn hàng và Nút bấm nằm gọn một dòng */}
              <div className="border-t border-slate-50 pt-2 flex justify-between items-center gap-2">
                <span className="text-[10px] text-slate-400 font-semibold truncate max-w-[40%]">
                  🚀 Giao bởi: {order.don_vi_van_chuyen || "Siêu thị Demi"}
                </span>

                <div className="flex items-center gap-1.5 shrink-0">
                  {statusText === "Chờ xác nhận" && (
                    <button onClick={() => onCancelOrder && onCancelOrder(order)} className="bg-red-50 hover:bg-red-600 text-red-600 hover:text-white px-3 py-1.5 rounded-lg text-[11px] font-black transition-all border border-red-100 cursor-pointer">
                      Hủy đơn hàng
                    </button>
                  )}

                  {statusText === "Xác nhận" && (
                    <button disabled className="bg-slate-50 text-slate-400 px-3 py-1.5 rounded-lg text-[11px] font-black border border-slate-100 opacity-60 cursor-not-allowed">
                      Hủy đơn hàng
                    </button>
                  )}

                  {/* CHỈ ĐỂ LẠI TRẠNG THÁI "ĐANG GIAO" ĐƯỢC PHÉP XEM LỘ TRÌNH VÌ XE ĐÃ DI CHUYỂN THỰC TẾ */}
                  {statusText === "Đang giao" && (
                    <button onClick={() => setSelectedOrderForMap(order)} className="bg-emerald-50 hover:bg-emerald-600 text-[#006c49] hover:text-white px-3 py-1.5 rounded-lg text-[11px] font-black transition-all flex items-center gap-1 border border-emerald-100 cursor-pointer">
                      <MapPin size={11} /> Theo dõi lộ trình
                    </button>
                  )}

                  {statusText === "Đã giao" && (
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => onViewDetails && onViewDetails(order)} 
                        className="bg-slate-50 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 border border-slate-200 cursor-pointer h-8"
                      >
                        <FileText size={12} className="shrink-0" /> <span className="whitespace-nowrap">Thông tin chi tiết</span>
                      </button>
                      <button 
                        onClick={() => onReviewOrder && onReviewOrder(order)} 
                        className="bg-amber-50 hover:bg-amber-500 text-amber-700 hover:text-white px-3 py-1.5 rounded-lg text-[11px] font-black transition-all flex items-center justify-center gap-1 border border-amber-100 cursor-pointer h-8"
                      >
                        <Star size={12} className="shrink-0" /> <span className="whitespace-nowrap">Đánh giá</span>
                      </button>
                    </div>
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