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

# Thiết lập Cổng kết nối và Bind IP phục vụ môi trường Docker / Render
set :port, ENV['PORT'] || 5004
set :bind, '0.0.0.0'

# === 🛡️ CẤU HÌNH CORS VÀ ORIGIN WHITELIST ĐỒNG BỘ MÔI TRƯỜNG ===
set :protection, :origin_whitelist => [
  'http://demi_order_service:5005', 
  'http://localhost:5173', 
  'http://localhost:5005',
  'https://demimart-fe.onrender.com' # 🌟 THÊM MỚI: Cấp quyền cho tên miền Frontend chạy trên Render
]

# Cấu hình CORS xử lý chéo domain trực tiếp tầng HTTP của Sinatra
configure do
  enable :cross_origin
end

before do
  # Cho phép domain Frontend Render hoặc nội bộ gọi vào phân hệ
  response.headers['Access-Control-Allow-Origin'] = 'https://demimart-fe.onrender.com'
  response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
  response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
  response.headers['Access-Control-Allow-Credentials'] = 'true'
end

# 🚀 ĐÁNH CHẶN PREFLIGHT REQUEST: Trả về trạng thái 200 OK ngay lập tức cho phương thức OPTIONS
options '*' do
  response.headers['Access-Control-Allow-Origin'] = 'https://demimart-fe.onrender.com'
  response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
  response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
  response.headers['Access-Control-Allow-Credentials'] = 'true'
  halt 200
end

# ========================================================
# 🛡️ CẤU HÌNH PHÒNG VỆ VÀ NỚI LỎNG BẢO MẬT TẦNG GỐC APP.RB
# ========================================================
if ENV['PORT'] || ENV['RACK_ENV'] == 'production'
  # Cho phép bỏ qua hoàn toàn các bộ lọc check host bảo mật của rack-protection khi chạy trên cloud
  set :protection, :except => [:host_authorization, :json_csrf, :remote_token, :http_origin]
else
  set :protection, :except => [:json_csrf, :host_authorization, :remote_token]

  $stdout.sync = true

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
# 🚀 ĐĂNG KÝ MODULE ROUTE CHO PAYMENT SERVICE
# ========================================================
use PaymentRoutes

# ========================================================
# 📜 ROUTE PHỤC VỤ TÀI LIỆU SWAGGER API (/docs)
# ========================================================

get '/swagger.json' do
  content_type :json
  SwaggerConfig.generate_json.to_json
end

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