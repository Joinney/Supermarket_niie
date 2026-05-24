require 'sinatra'
require 'json'

# 1. Cấu hình server
set :bind, '0.0.0.0'
set :port, 5004

# 2. Thông báo khởi động chuyên nghiệp
puts "========================================="
puts "✅ Payment Service Live: http://localhost:5004"
puts "📝 Health Check:        http://localhost:5004/api/payment/health"
puts "========================================="

# 3. Route trang chủ (tránh lỗi 404 trên trình duyệt)
get '/' do
  'Payment Service is running. Use /api/payment/health for status.'
end

# 4. API kiểm tra trạng thái
get '/api/payment/health' do
  content_type :json
  { status: 'ok', service: 'payment-service', version: '1.0.0' }.to_json
end

# 5. API nhận request thanh toán (có thêm xử lý lỗi)
post '/api/payment/create' do
  content_type :json
  begin
    payload = JSON.parse(request.body.read)
    
    # Logic xử lý thanh toán sẽ gọi ở đây
    # ví dụ: PaymentProcessor.process(payload)
    
    { message: 'Payment process initiated', data: payload }.to_json
  rescue JSON::ParserError
    status 400
    { error: 'Invalid JSON format' }.to_json
  end
end