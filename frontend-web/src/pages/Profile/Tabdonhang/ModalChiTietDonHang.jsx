import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  CreditCard,
  Truck,
  Calendar,
  Hash,
  User,
  Package,
  ShieldCheck,
  Loader2,
  Phone,
  MapPin
} from "lucide-react";
import { authApi } from "../../../api/axios";

export default function ModalChiTietDonHang({ isOpen, order, onClose }) {
  const [loading, setLoading] = useState(false);
  const [liveUserAvatar, setLiveUserAvatar] = useState(
    "https://cdn-icons-png.flaticon.com/512/149/149071.png"
  );
  const [addressData, setAddressData] = useState({
    receiver_name: "Khách hàng DemiMart",
    receiver_phone: "Chưa cập nhật SĐT",
    full_address: "Đang kết xuất địa chỉ đặt hàng từ hệ thống...",
  });

  useEffect(() => {
    if (!isOpen || !order) return;

    let isMounted = true;
    setLoading(true);

    const fetchOrderDetailedInfo = async () => {
      try {
        // [1] LUỒNG ĐỒNG BỘ AVATAR KHI CÓ USER_ID (Giống ModalLoTrinh)
        let targetAvatar =
          order?.items?.avatar_url ||
          order?.user_info?.avatar_url ||
          order?.user_info?.avatar ||
          order?.user_info?.image_url ||
          order?.avatar_url;

        if (!targetAvatar && order.user_id) {
          try {
            const userProfileRes = await authApi.get(`/auth/internal/users/${order.user_id}`);
            if (userProfileRes.data?.avatar_url || userProfileRes.data?.avatar || userProfileRes.data?.image_url) {
              targetAvatar =
                userProfileRes.data.avatar_url ||
                userProfileRes.data.avatar ||
                userProfileRes.data.image_url;
            }
          } catch (authFetchErr) {
            console.warn("⚠️ Cảnh báo profile avatar:", authFetchErr.message);
          }
        }
        if (isMounted && targetAvatar && targetAvatar.trim() !== "") {
          setLiveUserAvatar(targetAvatar);
        }

        // [2] ĐỒNG BỘ ĐỊA CHỈ KHÁCH HÀNG TỪ DATABASE CHUẨN (Giống ModalLoTrinh)
        try {
          const addrRes = await authApi.get("/addresses");
          const addrDataList = addrRes.data?.data || addrRes.data || [];
          if (Array.isArray(addrDataList) && addrDataList.length > 0) {
            const matchedAddr =
              addrDataList.find((addr) => Number(addr.district_id) === Number(order.to_district_id)) ||
              addrDataList.find((addr) => addr.is_default) ||
              addrDataList[0];

            if (matchedAddr && isMounted) {
              setAddressData({
                receiver_name: matchedAddr.receiver_name || "Khách hàng DemiMart",
                receiver_phone: matchedAddr.receiver_phone || "Chưa cập nhật SĐT",
                full_address: `${matchedAddr.detail_address}, ${matchedAddr.ward_name}, ${matchedAddr.district_name}, ${matchedAddr.province_name}`,
              });
            }
          }
        } catch (addrErr) {
          console.error("⚠️ Lỗi đồng bộ địa chỉ chi tiết:", addrErr.message);
        }
      } catch (err) {
        console.error("🔥 Lỗi lấy dữ liệu bổ trợ:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOrderDetailedInfo();

    return () => {
      isMounted = false;
    };
  }, [isOpen, order]);

  if (!isOpen || !order) return null;

  const items = order.danh_sach_san_pham || order.items || order.products || [];
  const validShippingCost = Number(order.phi_van_chuyen || 0);
  const discountAmount = Number(order.so_tien_giam_gia || 0);
  const totalItemsPrice = items.reduce(
    (acc, item) => acc + Number(item.price || 0) * Number(item.quantity || item.qty || 1),
    0
  );

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-fadeIn text-slate-800">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] text-left border border-slate-100 relative">
        
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-[#006c49]">
            <Loader2 className="animate-spin w-8 h-8" />
            <span className="text-xs font-black uppercase tracking-widest">
              Đang truy xuất thông tin vận đơn...
            </span>
          </div>
        )}

        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-[#006c49] text-white">
          <div className="flex items-center gap-2">
            <Hash size={18} className="shrink-0" />
            <div>
              <h3 className="text-sm font-black uppercase tracking-tight">
                Chi tiết đơn hàng #{order.ma_don_hang}
              </h3>
              <span className="text-[10px] text-emerald-100 font-bold flex items-center gap-1 mt-0.5">
                <Calendar size={11} /> Đặt lúc: {new Date(order.ngay_tao || order.created_at || Date.now()).toLocaleString("vi-VN")}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          
          {/* Khối Trạng Thái đơn hàng nhanh */}
          <div className="grid grid-cols-2 gap-3 bg-emerald-50/20 p-3 rounded-2xl border border-emerald-100/40">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Trạng thái</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-black uppercase bg-emerald-50 text-[#006c49] border border-emerald-100 inline-block">
                {order.trang_thai_don_hang || "Đã giao"}
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Thanh toán</span>
              <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
                <CreditCard size={12} className="text-slate-400" /> {order.phuong_thuc_thanh_toan || "Thẻ tín dụng / COD"}
              </span>
            </div>
          </div>

          {/* Khối Thông tin khách hàng (Đã được đồng bộ hóa giống hệt ModalLoTrinh) */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-3">
            <h5 className="font-bold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2 border-slate-200/60">
              <User size={14} className="text-slate-500" /> Thông tin người nhận
            </h5>
            <div className="flex gap-3.5 items-center">
              <img
                src={liveUserAvatar}
                className="w-11 h-11 rounded-full object-cover border-2 border-[#006c49] bg-white shrink-0 shadow-sm"
                alt="user avatar"
                onError={(e) => {
                  e.target.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                }}
              />
              <div className="flex-1 min-w-0">
                <span className="text-slate-400 text-[10px] uppercase block font-semibold">Họ và tên</span>
                <span className="font-black text-slate-700 text-xs block leading-tight">
                  {addressData.receiver_name}
                </span>
              </div>
              <div className="text-right shrink-0">
                <span className="text-slate-400 text-[10px] uppercase block font-semibold">Điện thoại</span>
                <span className="font-mono text-slate-700 text-xs font-bold block flex items-center gap-1">
                  <Phone size={11} className="text-slate-400" /> {addressData.receiver_phone}
                </span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-200/40">
              <span className="text-slate-400 text-[10px] uppercase block font-semibold mb-1">Địa chỉ đặt nhận hàng</span>
              <span className="font-medium text-slate-600 text-xs leading-relaxed block bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-xs">
                📍 {addressData.full_address}
              </span>
            </div>
          </div>

          {/* Danh sách sản phẩm mua */}
          <div className="space-y-2">
            <h5 className="font-bold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
              <Package size={14} className="text-slate-500" /> Danh sách sản phẩm mua ({items.length})
            </h5>
            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
              {items.map((item, idx) => {
                const qty = item.quantity || item.qty || 1;
                const price = Number(item.price || 0);
                return (
                  <div key={idx} className="flex gap-3 items-center border-b border-slate-50 pb-2.5 last:border-0 last:pb-0">
                    <img
                      src={item.image_url || item.hinh_anh_chinh || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=150"}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-100 bg-slate-50 shrink-0 shadow-2xs"
                      alt="product"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-800 text-xs truncate">
                        {item.product_name || "Sản phẩm Demi Mart"}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                        Phân loại: <span className="text-slate-600 font-semibold">{item.variant_name || "Mặc định"}</span>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-slate-800 block">
                        {(price * qty).toLocaleString("vi-VN")} đ
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">
                        {price.toLocaleString("vi-VN")} đ x {qty}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Đơn vị vận chuyển */}
          <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-slate-600">
            <Truck size={14} className="text-slate-400 shrink-0" />
            <span className="text-xs font-bold text-slate-500">
              Đơn vị vận chuyển: <b className="text-slate-700">{order.don_vi_van_chuyen || "Siêu thị DemiMart Express"}</b>
            </span>
          </div>
        </div>

        {/* Bill Tính toán dòng tiền */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-2 shrink-0">
          <div className="flex justify-between text-xs text-slate-500 font-bold">
            <span>Tiền hàng ({items.length} món)</span>
            <span>{totalItemsPrice.toLocaleString("vi-VN")} đ</span>
          </div>
          <div className="flex justify-between text-xs text-slate-500 font-bold">
            <span>Phí vận chuyển</span>
            <span>+ {validShippingCost.toLocaleString("vi-VN")} đ</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-xs text-red-500 font-bold">
              <span>Khuyến mãi giảm giá</span>
              <span>- {discountAmount.toLocaleString("vi-VN")} đ</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2 border-t border-slate-200">
            <span className="text-xs font-black text-slate-800">Tổng thanh toán thực tế</span>
            <span className="text-base font-black text-[#006c49]">
              {(Number(order.tong_thanh_toan) || 0).toLocaleString("vi-VN")} đ
            </span>
          </div>
        </div>

        {/* Footer bảo mật */}
        <div className="p-3 bg-white border-t flex items-center gap-1.5 text-[10px] text-slate-400 font-medium shrink-0">
          <ShieldCheck size={14} className="text-[#006c49] shrink-0" />
          Hệ thống bảo mật và đối soát dữ liệu hành trình nội bộ đã được kích hoạt.
        </div>
      </div>
    </div>,
    document.body
  );
}