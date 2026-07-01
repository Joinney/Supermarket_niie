require 'sinatra'
require 'json'
require 'dotenv/load'
require 'rubygems'
require 'bundler/setup'

# Load các gem mặc định từ Gemfile (Đã bao gồm swagger-blocks)
Bundler.require(:default)

# Load cấu hình nội bộ hệ thống dữ liệu & tài liệu API
require_relative 'configs/database'
require_relative 'configs/swagger_config'
require_relative 'routes/payment_routes'

# Thiết lập Cổng kết nối và Bind IP phục vụ môi trường Docker Container
set :port, ENV['PORT'] || 5004
set :bind, '0.0.0.0'
set :protection, :origin_whitelist => ['http://demi_order_service:5005', 'http://localhost:5173', 'http://localhost:5005']

# ========================================================
# 🛡️ CẤU HÌNH PHÒNG VỆ VÀ NỚI LỎNG BẢO MẬT TẦNG GỐC APP.RB
# ========================================================
# Kiểm tra nếu có PORT (môi trường Render/Docker deploy) hoặc production
if ENV['PORT'] || ENV['RACK_ENV'] == 'production'
  # Cho phép bỏ qua hoàn toàn các bộ lọc check host bảo mật của rack-protection
  set :protection, :except => [:host_authorization, :json_csrf, :remote_token]
else
  # 🎯 FIX CHÍ MẠNG: Thêm :host_authorization và :remote_token để thông mạch cuộc gọi nội bộ Docker
  set :protection, :except => [:json_csrf, :host_authorization, :remote_token]

  $stdout.sync = true

  # Hiển thị tường minh đường dẫn localhost dễ dàng click trên terminal máy local
  configure do
    puts "\n"
    puts "========================================================"
    puts "🚀 Demi Mart Payment Service đã sẵn sàng dưới local!"
    puts "👉 Truy cập Local ứng dụng tại: http://localhost:#{settings.port}"
    puts "========================================================"
    puts "\n"
  end
end

# ========================================================
# 🚀 ĐĂNG KÝ MODULE ROUTE CHO PAYMENT SERVICE (SỬA LỖI MAP)
# ========================================================
# Sử dụng phương thức Sinatra để bọc class định tuyến an toàn không lo sập app
use PaymentRoutes

# ========================================================
# 📜 ROUTE PHỤC VỤ TÀI LIỆU SWAGGER API (/docs)
# ========================================================

# 1. Trả về cấu trúc JSON đặc tả thiết kế hệ thống API
get '/swagger.json' do
  content_type :json
  SwaggerConfig.generate_json.to_json
end

# 2. Render giao diện Swagger UI trực tiếp từ hệ thống CDN 
get '/docs' do
  content_type :html
  <<-HTML
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>Demi Mart Payment API Docs</title>
      <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
      <style>
        html { box-sizing: border-box; overflow-y: scroll; }
        *, *:before, *:after { box-sizing: inherit; }
        body { margin: 0; background: #fafafa; }
        .swagger-ui .topbar { background-color: #006c49; }
      </style>
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
      <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
      <script>
        window.onload = function() {
          const ui = SwaggerUIBundle({
            url: "/swagger.json",
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [
              SwaggerUIBundle.presets.apis,
              SwaggerUIStandalonePreset
            ],
            plugins: [
              SwaggerUIBundle.plugins.DownloadUrl
            ],
            layout: "BaseLayout"
          });
          window.ui = ui;
        };
      </script>
    </body>
    </html>
  HTML
end

# ========================================================
# 🩺 ENDPOINT KIỂM TRA TRẠNG THÁI HỆ THỐNG (HEALTH CHECK)
# ========================================================
get '/health' do
  content_type :json
  { 
    status: "OK", 
    service: "Demi Mart Payment Service",
    message: "Hệ thống cổng thanh toán đang hoạt động xanh mướt! 🚀💳" 
  }.to_json
end

# ========================================================
# 🏠 GIAO DIỆN TRANG CHỦ CHÀO MỪNG CHUẨN MÀU #006c49
# ========================================================
get '/' do
  content_type :html
  <<-HTML
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>Demi Mart Payment Service</title>
      <style>
        body {
          background-color: #f8fafc;
          margin: 0;
          padding: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .container {
          text-align: center;
          background-color: #ffffff;
          padding: 50px 40px;
          border-radius: 12px;
          max-width: 700px;
          width: 90%;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
        }
        h1 {
          color: #006c49;
          font-size: 2.8rem;
          margin-top: 0;
          margin-bottom: 20px;
          font-weight: 700;
        }
        p {
          color: #64748b;
          font-size: 1.25rem;
          margin-bottom: 35px;
          line-height: 1.6;
        }
        .btn-swagger {
          display: inline-block;
          background-color: #006c49;
          color: white;
          padding: 14px 32px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 1.1rem;
          text-decoration: none;
          transition: background-color 0.2s ease, transform 0.1s ease;
          box-shadow: 0 4px 6px -1px rgba(0, 108, 73, 0.2);
        }
        .btn-swagger:hover {
          background-color: #005439;
        }
        .btn-swagger:active {
          transform: scale(0.98);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Demi Mart Payment Service</h1>
        <p>Hệ thống đang hoạt động xanh mướt! 🚀</p>
        <a href="/docs" class="btn-swagger">Vào Swagger xem API &rarr;</a>
      </div>
    </body>
    </html>
  HTML
end