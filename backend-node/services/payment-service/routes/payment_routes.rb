require 'sinatra/base'
require 'json'
require_relative '../controllers/payment_controller'
require_relative '../controllers/vnpay_controller'
require_relative '../controllers/paypal_controller'

class PaymentRoutes < Sinatra::Base
  # ========================================================
  # 🛡️ CẤU HÌNH VÔ HIỆU HÓA HOÀN TOÀN LỚP CHẶN BẢO VỆ HOST ĐỐI VỚI DOCKER
  # ========================================================
  set :protection, false # Tắt triệt để mọi lớp chặn trung gian bảo vệ Host của Rack

  # ========================================================
  # 🛡️ MIDDLEWARE CORS CHO RIÊNG CỔNG THANH TOÁN
  # ========================================================
  before do
    content_type :json
    # Cho phép các cổng Frontend React (Vite) của Demi Mart truy cập
    response.headers['Access-Control-Allow-Origin'] = ENV['FRONTEND_URL'] || 'http://localhost:5173'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
    response.headers['Access-Control-Allow-Credentials'] = 'true'
  end

  # Xử lý Request OPTIONS (Preflight) của Browser trước khi gửi POST
  options '*' do
    response.headers['Access-Control-Allow-Origin'] = ENV['FRONTEND_URL'] || 'http://localhost:5173'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    status 200
    ''
  end

  # ========================================================
  # 💳 1. API Khởi tạo thanh toán (VNPay và PayPal sang Controller riêng)
  # ========================================================
  post '/api/create-transaction' do
    begin
      request_body = request.body.read
      return { success: false, message: 'Body trống!' }.to_json if request_body.empty?
      payload = JSON.parse(request_body)

      if payload['phuong_thuc_thanh_toan'] == 'VNPay'
        result = VnpayController.init_payment(payload, '127.0.0.1')
      elsif payload['phuong_thuc_thanh_toan'] == 'PayPal'
        result = PaypalController.init_payment(payload, '127.0.0.1')
      else
        result = PaymentController.process_payment(payload, '127.0.0.1')
      end

      status result[:success] ? 200 : 400
      result.to_json
    rescue => e
      status 500
      { success: false, message: e.message }.to_json
    end
  end

  # ========================================================
  # 💳 2. API Đối soát VNPay trả về từ Trạm trung chuyển React
  # ========================================================
  get '/api/vnpay-return' do
    query_params = params.transform_keys(&:to_s)
    result = VnpayController.verify_return(query_params)
    status result[:success] ? 200 : 400
    result.to_json
  end

  # ========================================================
  # 🚀 3. API TIẾP NHẬN PHẢN HỒI CALLBACK/CAPTURE TỪ PAYPAL SYSTEM
  # ========================================================
  post '/api/paypal-capture' do
    begin
      request_body = request.body.read
      return { success: false, message: 'Dữ liệu đối soát trống!' }.to_json if request_body.empty?

      payload = JSON.parse(request_body)

      # Gọi trực tiếp sang PaypalController đảm bảo nghiệp vụ tách biệt
      result = PaypalController.capture(payload, request.ip || '127.0.0.1')

      status result[:success] ? 200 : 400
      result.to_json
    rescue => e
      status 500
      { success: false, message: e.message }.to_json
    end
  end
end # <--- TỪ KHÓA QUYẾT ĐỊNH: ĐÓNG ĐÚNG CLASS PAYMENTROUTES CHỐNG CRASH DOCKER