import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { paymentApi } from '../../api/axios';
import { useCart } from '../../context/CartContext';

export default function VnpayReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearPurchasedItems } = useCart();
  
  // 🌟 Dùng useRef để giữ trạng thái kiểm soát, tránh bị gọi trùng lặp 2 lần liên tiếp
  const hasCalledAPI = useRef(false);

  useEffect(() => {
    const verifyTransaction = async () => {
      // Nếu đã gọi API rồi thì thoát ra ngay, chặn đứng lần gọi thứ 2
      if (hasCalledAPI.current) return;
      hasCalledAPI.current = true;

      try {
        const queryString = searchParams.toString();
        // Gửi toàn bộ tham số URL sang Ruby kiểm tra chữ ký
        const res = await paymentApi.get(`/vnpay-return?${queryString}`);
        
        if (res.data.success) {
          // Xóa giỏ hàng local
          const pendingIds = JSON.parse(localStorage.getItem('vnpay_pending_variants') || '[]');
          if (clearPurchasedItems && pendingIds.length > 0) {
            await clearPurchasedItems(pendingIds);
          }
          localStorage.removeItem('vnpay_pending_variants');
          localStorage.removeItem('checkoutItems');

          alert("🎉 Thanh toán VNPay thành công rực rỡ!");
          navigate('/profile/orders', { replace: true });
        }
      } catch (err) {
        alert("❌ Giao dịch thất bại hoặc chữ ký không hợp lệ!");
        navigate('/checkout', { replace: true });
      }
    };

    if (searchParams.toString()) {
      verifyTransaction();
    }
  }, [searchParams, navigate, clearPurchasedItems]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="p-8 bg-white rounded-2xl shadow font-black text-[#006c49] animate-pulse">
         Đang đối soát kết quả giao dịch từ ngân hàng VNPay...
      </div>
    </div>
  );
}