require 'rubygems'
require 'bundler/setup'
require 'swagger/blocks'

class SwaggerConfig
  include Swagger::Blocks

  # ========================================================
  # 🌐 THÔNG TIN GỐC HỆ THỐNG (SWAGGER ROOT)
  # ========================================================
  swagger_root do
    key :swagger, '2.0'
    info do
      key :version, '1.0.0'
      key :title, 'Demi Mart Payment Service API'
      key :description, 'Microservice xử lý thanh toán VNPay & PayPal tích hợp mã giao dịch tự động dạng chuỗi MPM...'
    end
    key :basePath, '/'
    key :consumes, ['application/json']
    key :produces, ['application/json']
  end

  # ========================================================
  # 🔀 ENDPOINT 1: POST /payment/process
  # ========================================================
  swagger_path '/payment/process' do
    operation :post do
      key :summary, 'Khởi tạo luồng giao dịch thanh toán'
      key :description, 'Ghi nhận giao dịch thô trạng thái pending với ID tự sinh (MPM...) lên Supabase và trả về URL thanh toán từ Gateway.'
      
      parameter do
        key :name, :body
        key :in, :body
        key :description, 'Thông tin đơn hàng từ Frontend gửi lên để xử lý thanh toán'
        key :required, true
        schema do
          key :type, :object
          property :ma_don_hang do
            key :type, :string
            key :example, 'DM123456'
          end
          property :phuong_thuc_thanh_toan do
            key :type, :string
            key :example, 'VNPay'
          end
          property :tong_thanh_toan do
            key :type, :integer
            key :example, 250000
          end
        end
      end

      response 200 do
        key :description, 'Khởi tạo link thanh toán từ Cổng dịch vụ thành công'
        schema do
          key :type, :object
          property :success do; key :type, :boolean; key :example, true; end
          property :phuong_thuc_thanh_toan do; key :type, :string; key :example, 'VNPay'; end
          property :paymentUrl do; key :type, :string; key :example, 'https://sandbox.vnpayment.vn/...'; end
        end
      end

      response 400 do
        key :description, 'Dữ liệu đầu vào không hợp lệ hoặc phương thức không hỗ trợ'
      end
    end
  end

  # ========================================================
  # 🛡️ ENDPOINT 2: GET /payment/vnpay-callback
  # ========================================================
  swagger_path '/payment/vnpay-callback' do
    operation :get do
      key :summary, 'Tiếp nhận phản hồi IPN / Callback từ VNPay'
      key :description, 'Xác thực chữ ký bảo mật Checksum bằng mã bí mật Hash Secret, cập nhật trạng thái bảng payment_transactions độc lập và đồng bộ trạng thái đơn hàng.'
      
      response 200 do
        key :description, 'Xử lý thông tin đối soát từ cổng thanh toán thành công, cập nhật Supabase và điều hướng về Frontend'
      end

      response 400 do
        key :description, 'Chữ ký Checksum không hợp lệ (Mã hash sai lệch)'
      end
    end
  end

  # ========================================================
  # 🏗️ HÀM BIÊN DỊCH DỮ LIỆU SANG JSON
  # ========================================================
  def self.generate_json
    Swagger::Blocks.build_root_json([SwaggerConfig])
  end
end