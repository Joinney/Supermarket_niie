require 'digest'
require 'uri'
require 'net/http'
require 'json'

module PaymentGateway
  # ========================================================
  # 🔑 1. CỔNG THANH TOÁN VNPAY (Version 2.1.0)
  # ========================================================
def self.create_vnpay_url(data, client_ip)
    ma_don_hang = data['ma_don_hang']
    tong_thanh_toan = data['tong_thanh_toan'].to_i

    # 🎯 FIX CHÍ MẠNG: Xóa bỏ ENV, gán chết chuỗi thật 100% không cho bốc biến môi trường cũ
    tmn_code = 'R1GZ045M'
    secret_key = 'F6GIYA4894EW07CHMUOXODSXCTY87JQ6'
    
    vnp_url = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'
    return_url = 'http://localhost:5173/checkout/vnpay-return'

    vnp_params = {
      'vnp_Version' => '2.1.0',
      'vnp_Command' => 'pay',
      'vnp_TmnCode' => tmn_code,
      'vnp_Locale' => 'vn',
      'vnp_CurrCode' => 'VND',
      'vnp_TxnRef' => "#{ma_don_hang}_#{Time.now.to_i}", 
      'vnp_OrderInfo' => "Thanh toan don hang Demi Mart #{ma_don_hang}", 
      'vnp_OrderType' => 'other',
      'vnp_Amount' => (tong_thanh_toan * 100).to_s, 
      'vnp_ReturnUrl' => return_url,
      'vnp_IpAddr' => client_ip,
      'vnp_CreateDate' => Time.now.strftime('%Y%m%d%H%M%S')
    }

    sorted_params = vnp_params.sort.to_h
    query_string = URI.encode_www_form(sorted_params)
    hmac = OpenSSL::HMAC.hexdigest(OpenSSL::Digest.new('sha512'), secret_key, query_string)
    
    # 🚨 BẮT ĐẶT CAMERA GIÁM SÁT NGẦM (NẾU VẪN LỖI 70 COPY DÒNG NÀY ĐƯA MÌNH)
    puts "\n================== [VNPAY CAMERA DEBUG] =================="
    puts "👉 CHUỖI ĐEM BĂM: #{query_string}"
    puts "👉 MÁY CHỦ RUBY BĂM RA HMAC: #{hmac}"
    puts "==========================================================\n"

    "#{vnp_url}?#{query_string}&vnp_SecureHash=#{hmac}"
  end

  # ========================================================
  # 💳 2. CỔNG THANH TOÁN PAYPAL (Khởi tạo Transaction)
  # ========================================================
  def self.create_paypal_transaction(data)
    # Demi điền Client ID và Secret của Sandbox PayPal vào đây hoặc file .env
    client_id = ENV['PAYPAL_CLIENT_ID'] || 'YOUR_PAYPAL_CLIENT_ID'
    secret = ENV['PAYPAL_SECRET'] || 'YOUR_PAYPAL_SECRET'
    api_url = 'https://api-m.sandbox.paypal.com' # Môi trường thử nghiệm

    tong_thanh_toan = data['tong_thanh_toan'].to_f
    # Quy đổi tạm thời VND -> USD nếu cần vì PayPal không hỗ trợ trực tiếp VND (Ví dụ: 1 USD = 25000 VND)
    amount_in_usd = (tong_thanh_toan / 25000.0).round(2)

    begin
      # Bước A: Lấy Access Token từ PayPal API
      token_uri = URI("#{api_url}/v1/oauth2/token")
      token_req = Net::HTTP::Post.new(token_uri)
      token_req.basic_auth(client_id, secret)
      token_req.set_form_data('grant_type' => 'client_credentials')

      token_res = Net::HTTP.start(token_uri.hostname, token_uri.port, use_ssl: true) do |http|
        http.request(token_req)
      end
      
      access_token = JSON.parse(token_res.body)['access_token']

      # Bước B: Khởi tạo Order với PayPal
      order_uri = URI("#{api_url}/v2/checkout/orders")
      order_req = Net::HTTP::Post.new(order_uri)
      order_req['Authorization'] = "Bearer #{access_token}"
      order_req['Content-Type'] = 'application/json'
      
      order_req.body = {
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: data['ma_don_hang'],
          amount: {
            currency_code: 'USD',
            value: amount_in_usd.to_s
          }
        }],
        application_context: {
          return_url: ENV['PAYPAL_RETURN_URL'] || 'http://localhost:5173/checkout/paypal-return',
          cancel_url: ENV['PAYPAL_CANCEL_URL'] || 'http://localhost:5173/checkout/paypal-failed'
        }
      }.to_json

      order_res = Net::HTTP.start(order_uri.hostname, order_uri.port, use_ssl: true) do |http|
        http.request(order_req)
      end

      paypal_order = JSON.parse(order_res.body)
      
      # Tìm link redirect sang trang phê duyệt (approve link) của PayPal
      approve_url = paypal_order['links'].find { |link| link['rel'] == 'approve' }['href']

      { status: 'success', payUrl: approve_url, paypal_order_id: paypal_order['id'] }
    rescue => e
      # Fallback nếu lỗi kết nối API PayPal bên ngoài
      { status: 'error', message: e.message }
    end
  end
end