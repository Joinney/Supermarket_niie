import React from 'react';
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";

export default function PayPalButton({ amount, onSuccess, onError }) {
  // Lấy an toàn chuỗi Client ID từ file .env thông qua cấu hình của Vite
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
          // Chỉ kích hoạt nút bấm khi có số tiền hợp lệ truyền xuống
          disabled={!amount || amount <= 0}
          
          // 1. Khởi tạo đơn hàng ảo gửi lên máy chủ PayPal để hiển thị hóa đơn pop-up
          createOrder={(data, actions) => {
            // Quy đổi dòng tiền VND sang USD an toàn (Lấy tỷ giá tạm tính 1 USD = 25,000đ)
            const amountInUSD = (Number(amount) / 25000).toFixed(2);
            
            console.log(`🚀 Khởi tạo Pop-up thanh toán với số tiền quy đổi: $${amountInUSD} USD`);
            
            return actions.order.create({
              purchase_units: [{
                description: "Thanh toán hóa đơn mua sắm tại Demi Mart",
                amount: {
                  currency_code: "USD",
                  value: amountInUSD,
                },
              }],
            });
          }}
          
          // 2. Bắt sự kiện khi người dùng nhập pass/quét vân tay ví PayPal thành công
          // Thực hiện lệnh capture trực tiếp từ Client với Server PayPal an toàn, tốc độ cực nhanh
          onApprove={async (data, actions) => {
            try {
              console.log("🔒 Khách đã duyệt trên ví PayPal, tiến hành Capture tiền...");
              
              const details = await actions.order.capture();
              
              if (details.status === "COMPLETED" || details.status === "APPROVED") {
                console.log("✅ SDK PayPal trừ tiền thành công! Trả dữ liệu về Checkout xử lý...");
                if (onSuccess) onSuccess(details);
              } else {
                throw new Error("Trạng thái giao dịch PayPal không đạt yêu cầu hoàn tất.");
              }
            } catch (err) {
              console.error("❌ Lỗi xảy ra trong quá trình capture tiền PayPal ở Client:", err);
              if (onError) onError(err);
            }
          }}
          
          // 3. Xử lý khi xảy ra lỗi hệ thống SDK hoặc lỗi mạng ngắt kết nối
          onError={(err) => {
            console.error("❌ Lỗi hệ thống PayPal SDK:", err);
            if (onError) onError(err);
          }}
        />
      </div>
    </PayPalScriptProvider>
  );
}