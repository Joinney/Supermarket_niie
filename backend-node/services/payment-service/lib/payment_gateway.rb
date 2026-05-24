module PaymentGateway
  def self.create_transaction(data)
    # Logic kết nối ví điện tử ở đây
    # Ví dụ trả về URL thanh toán giả lập
    { 
      status: "success", 
      payUrl: "https://sandbox.vnpayment.vn/payment/v2/checkout?id=#{rand(1000)}" 
    }
  end
end