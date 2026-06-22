require 'sinatra/base'
require 'json'
require_relative '../controllers/payment_controller'

class PaymentRoutes < Sinatra::Base
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
  # Endpoint: POST http://localhost:5004/api/payments/create-transaction
  post '/create-transaction' do
    begin
      # Đọc và phân tách dữ liệu JSON gửi lên từ Frontend
      request_body = request.body.read
      if request_body.empty?
        status 400
        return { success: false, message: 'Dữ liệu đầu vào trống (Body empty)!' }.to_json
      end

      request_payload = JSON.parse(request_body)
      
      # Lấy địa chỉ IP của Client một cách an toàn để truyền sang cổng VNPay
      client_ip = request.env['HTTP_X_FORWARDED_FOR'] || request.env['REMOTE_ADDR'] || '127.0.0.1'
      # Xử lý chuỗi nếu đi qua các lớp Proxy/Gateway (lấy IP đầu tiên)
      client_ip = client_ip.split(',').first.strip if client_ip.include?(',')

      # Gọi tầng Controller để xử lý nghiệp vụ sinh link thanh toán
      result = PaymentController.process_payment(request_payload, client_ip)
      
      if result[:success]
        status 200
      else
        status 400
      end
      
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
  # Endpoint: GET http://localhost:5004/api/payments/vnpay-callback
  get '/vnpay-callback' do
    # Chuyển đổi đối tượng params của Sinatra thành Hash thuần ký tự String để dễ đối soát
    query_params = params.transform_keys(&:to_s)
    
    # Gửi sang Controller thực hiện check chữ ký (Checksum) và cập nhật Database
    result = PaymentController.handle_vnpay_callback(query_params)
    
    if result[:redirect_url]
      # Nếu có link redirect (thành công hoặc thất bại), điều hướng trình duyệt của User về Frontend luôn
      redirect result[:redirect_url]
    else
      # Nếu lỗi chữ ký signature hoặc lỗi kết nối DB
      status 400
      content_type :json
      { success: false, message: result[:message] }.to_json
    end
  end
end