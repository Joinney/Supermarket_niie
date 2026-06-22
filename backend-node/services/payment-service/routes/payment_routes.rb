require 'sinatra/base'
require 'json'
require_relative '../controllers/payment_controller'

class PaymentRoutes < Sinatra::Base
  # ========================================================
  # 🛡️ CẤU HÌNH VÔ HIỆU HÓA HOÀN TOÀN LỚP CHẶN BẢO VỆ HOST ĐỐI VỚI DOCKER
  # ========================================================
  disable :protection
  set :protection, false # Tắt triệt để mọi lớp chặn trung gian bảo vệ Host của Rack
  set :protection, :except => [:host_authorization, :json_csrf, :remote_token]

  # ========================================================
  # 🛡️ MIDDLEWARE CORS CHO RIÊNG CỔNG THANH TOÁN
  # ========================================================
  before do
    content_type :json
    # Cho phép các cổng Frontend React (Vite) của Demi Mart truy cập
    response.headers['Access-Control-Allow-Origin'] = ENV['FRONTEND_URL'] || 'http://localhost:5173'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
  end

  # Xử lý Request OPTIONS (Preflight) của Browser trước khi gửi POST
  options '*' do
    response.headers['Access-Control-Allow-Origin'] = ENV['FRONTEND_URL'] || 'http://localhost:5173'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
    status 200
    ''
  end

  # ========================================================
  # 💳 1. API KHỞI TẠO GIAO DỊCH (VNPay / PayPal)
  # ========================================================
  post '/create-transaction' do
    begin
      request_body = request.body.read
      if request_body.empty?
        status 400
        return { success: false, message: 'Dữ liệu đầu vào trống (Body empty)!' }.to_json
      end

      request_payload = JSON.parse(request_body)
      
      client_ip = request.env['HTTP_X_FORWARDED_FOR'] || request.env['REMOTE_ADDR'] || '127.0.0.1'
      client_ip = client_ip.split(',').first.strip if client_ip.include?(',')

      result = PaymentController.process_payment(request_payload, client_ip)
      
      status result[:success] ? 200 : 400
      result.to_json
    rescue JSON::ParserError => e
      status 400
      { success: false, message: 'Định dạng JSON gửi lên không hợp lệ!', error: e.message }.to_json
    rescue => e
      status 500
      { success: false, message: 'Lỗi hệ thống xử lý giao dịch nội bộ!', error: e.message }.to_json
    end
  end

  # ========================================================
  # 🔄 2. API TIẾP NHẬN PHẢN HỒI CALLBACK TỪ VNPAY CỔNG CHÍNH
  # ========================================================
  get '/vnpay-callback' do
    query_params = params.transform_keys(&:to_s)
    result = PaymentController.handle_vnpay_callback(query_params)
    
    if result[:redirect_url]
      redirect result[:redirect_url]
    else
      status 400
      content_type :json
      { success: false, message: result[:message] }.to_json
    end
  end

  # ========================================================
  # 🚀 3. API TIẾP NHẬN PHẢN HỒI CALLBACK/CAPTURE TỪ PAYPAL SYSTEM
  # ========================================================
  post '/paypal-capture' do
    begin
      request_body = request.body.read
      if request_body.empty?
        status 400
        return { success: false, message: 'Dữ liệu đối soát trống!' }.to_json
      end

      request_payload = JSON.parse(request_body)
      
      # Cơ chế bóc tách phòng vệ dữ liệu lỏng chống sập log đối soát
      ma_don_hang = request_payload['ma_don_hang'] || "DM_UNKNOWN_#{Time.now.to_i}"
      paypal_order_id = request_payload['paypal_order_id']
      so_tien = request_payload['so_tien'] || 0
      capture_data = request_payload['capture_data']

      if paypal_order_id.nil? || capture_data.nil?
        status 400
        return { success: false, message: 'Thiếu thông tin định danh paypal_order_id!' }.to_json
      end

      result = PaymentController.handle_paypal_callback(ma_don_hang, paypal_order_id, so_tien, capture_data)

      status result[:success] ? 200 : 400
      result.to_json
    rescue JSON::ParserError => e
      status 400
      { success: false, message: 'Dữ liệu JSON gửi lên không hợp lệ!', error: e.message }.to_json
    rescue => e
      status 500
      { success: false, message: 'Gặp sự cố hệ thống phân hệ thanh toán PayPal!', error: e.message }.to_json
    end
  end

end