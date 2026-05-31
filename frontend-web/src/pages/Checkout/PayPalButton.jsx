import React from 'react';
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";

export default function PayPalButton({ amount, onSuccess, onError }) {
  
  // Lấy an toàn chuỗi Client ID từ file .env thông qua trình cấu hình của Vite
  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;

  // Cấu hình các tùy chọn khởi tạo ban đầu cho SDK PayPal
  const initialOptions = {
    "client-id": paypalClientId,
    currency: "USD", // PayPal Sandbox ép buộc dùng USD làm đơn vị quy đổi giao dịch quốc tế
    intent: "capture"
  };

  return (
    <PayPalScriptProvider options={initialOptions}>
      <div className="w-full relative z-10">
        <PayPalButtons
          style={{ 
            layout: "vertical", // Bố cục nút dọc chuẩn UI thanh toán hiện đại
            color: "gold",      // Tông màu vàng đặc trưng sang trọng của PayPal
            shape: "rect",      // Bo góc vuông tinh tế khớp với cấu trúc nút bấm của Demi Mart
            label: "pay"        // Hiển thị chữ "Pay" dứt khoát
          }}
          disabled={!amount || amount <= 0}
          
          // 1. Khởi tạo đơn hàng ảo gửi lên máy chủ PayPal để hiển thị hóa đơn pop-up
          createOrder={(data, actions) => {
            // Quy đổi dòng tiền VND sang USD an toàn (Lấy tỷ giá tạm tính 1 USD = 25,000đ)
            const amountInUSD = (Number(amount) / 25000).toFixed(2);
            
            return actions.order.create({
              purchase_units: [
                {
                  description: "Thanh toán hóa đơn mua sắm tại Demi Mart",
                  amount: {
                    currency_code: "USD",
                    value: amountInUSD,
                  },
                },
              ],
            });
          }}
          
          // 2. Bắt sự kiện khi người dùng nhập pass/quét vân tay ví PayPal thành công
          onApprove={async (data, actions) => {
            const details = await actions.order.capture();
            if (details.status === "COMPLETED" || details.status === "APPROVED") {
              console.log("🔒 Giao dịch PayPal hoàn tất:", details);
              // Kích hoạt hàm gọi ngược về Checkout để dọn dẹp giỏ hàng MongoDB (clearPurchasedItems)
              onSuccess(details);
            }
          }}
          
          // 3. Xử lý khi xảy ra lỗi hệ thống hoặc lỗi mạng ngắt kết nối
          onError={(err) => {
            console.error("❌ Lỗi hệ thống PayPal SDK:", err);
            if (onError) onError(err);
          }}
        />
      </div>
    </PayPalScriptProvider>
  );
}