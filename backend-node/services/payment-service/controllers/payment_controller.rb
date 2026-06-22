require_relative '../lib/payment_gateway'
require_relative '../configs/database' # Đã tự động nạp require_relative '../models/payment_transaction'
require 'openssl'
require 'uri'
require 'json'

class PaymentController
  # ========================================================
  # 🔀 1. ĐIỀU HƯỚNG TẠO GIAO DỊCH VÀ KHỞI TẠO LOG DATA
  # ========================================================
  def self.process_payment(req_params, client_ip)
    phuong_thuc = req_params['phuong_thuc_thanh_toan']
    ma_don_hang = req_params['ma_don_hang']
    tong_thanh_toan = req_params['tong_thanh_toan'] || 0

    case phuong_thuc
    when 'VNPay'
      begin
        # 🌟 Sử dụng Model PaymentTransaction để ghi nhận giao dịch thô
        # Bỏ trống trường 'id' để Postgres Trigger tự sinh mã định dạng 'MPM04239548'
        PaymentTransaction.create(
          ma_don_hang: ma_don_hang,
          phuong_thuc_thanh_toan: 'VNPay',
          so_tien: tong_thanh_toan,
          trang_thai: 'pending',
          client_ip: client_ip
        )
      rescue => e
        puts "🔥 Lỗi khi ghi log giao dịch VNPay ban đầu: #{e.message}"
      end

      url = PaymentGateway.create_vnpay_url(req_params, client_ip)
      { success: true, phuong_thuc_thanh_toan: 'VNPay', paymentUrl: url }
      
    when 'PayPal'
      result = PaymentGateway.create_paypal_transaction(req_params)
      if result[:status] == 'success'
        begin
          # 🌟 Ghi log giao dịch PayPal bằng Model với mã Token/Order ID trả về từ gateway
          PaymentTransaction.create(
            ma_don_hang: ma_don_hang,
            phuong_thuc_thanh_toan: 'PayPal',
            so_tien: tong_thanh_toan,
            tien_te: 'USD',
            trang_thai: 'pending',
            gateway_order_id: result[:paypal_order_id],
            client_ip: client_ip
          )
        rescue => e
          puts "🔥 Lỗi khi ghi log giao dịch PayPal ban đầu: #{e.message}"
        end

        { 
          success: true, 
          phuong_thuc_thanh_toan: 'PayPal', 
          paymentUrl: result[:payUrl], 
          paypal_order_id: result[:paypal_order_id] 
        }
      else
        { success: false, message: "Lỗi khởi tạo PayPal: #{result[:message]}" }
      end
      
    else
      { success: false, message: "Phương thức thanh toán '#{phuong_thuc}' không được hỗ trợ!" }
    end
  end

  # ========================================================
  # 🛡️ 2. ĐỐI SOÁT & CẬP NHẬT KẾT QUẢ VNPAY CALLBACK
  # ========================================================
  def self.handle_vnpay_callback(query_params)
    # Sao chép query_params để tránh biến đổi dữ liệu gốc ngoài router
    params_clean = query_params.dup
    secure_hash = params_clean.delete('vnp_SecureHash')
    params_clean.delete('vnp_SecureHashType')

    # Sắp xếp các tham số còn lại theo bảng chữ cái từ A-Z
    sorted_params = params_clean.sort.to_h
    query_string = URI.encode_www_form(sorted_params)

    secret_key = ENV['VNP_HASH_SECRET'] || '9O6E27MXV4LCOZJWQ4M9RFEZ9C1QW2L4'
    check_hash = OpenSSL::HMAC.hexdigest(OpenSSL::Digest.new('sha512'), secret_key, query_string)

    # Kiểm tra chữ ký bảo mật từ VNPay gửi về
    if secure_hash != check_hash
      puts "⚠️ Cảnh báo: Chữ ký VNPay không khớp mã Hash Checksum!"
      return { success: false, message: 'Invalid Signature Checksum' }
    end

    txn_ref = query_params['vnp_TxnRef'] # Có dạng: "DM123456_17181920"
    ma_don_hang = txn_ref.split('_')[0]   # Tách lấy mã đơn gốc: "DM123456"
    response_code = query_params['vnp_ResponseCode']
    transaction_no = query_params['vnp_TransactionNo'] # Mã giao dịch từ phía VNPay

    frontend_url = ENV['FRONTEND_URL'] || 'http://localhost:5173'

    if response_code == '00'
      begin
        # 1️⃣ Cập nhật bảng dữ liệu riêng qua Model mã hóa (payment_transactions)
        PaymentTransaction.where(ma_don_hang: ma_don_hang, phuong_thuc_thanh_toan: 'VNPay').update(
          trang_thai: 'completed',
          gateway_transaction_id: transaction_no,
          gateway_response_code: response_code,
          raw_response: query_params.to_json
        )

        # 2️⃣ Đồng bộ cập nhật trạng thái đơn hàng sang bảng orders dùng chung kết nối DB gốc
        db_connect[:orders].where(ma_don_hang: ma_don_hang).update(trang_thai_thanh_toan: 'completed')
        
        puts "🔒 Đơn hàng #{ma_don_hang} đã cập nhật lịch sử mã tự động & Trạng thái Đơn thành công lên Supabase!"
        { success: true, ma_don_hang: ma_don_hang, redirect_url: "#{frontend_url}/payment-success?order=#{ma_don_hang}" }
      rescue => e
        puts "🔥 Lỗi kết nối Supabase khi xử lý hậu thanh toán thành công: #{e.message}"
        { success: false, message: 'Database Update Error' }
      end
    else
      # Giao dịch thất bại hoặc người dùng hủy bỏ giữa chừng
      begin
        PaymentTransaction.where(ma_don_hang: ma_don_hang, phuong_thuc_thanh_toan: 'VNPay').update(
          trang_thai: 'failed',
          gateway_response_code: response_code,
          raw_response: query_params.to_json
        )
      rescue => e
        puts "🔥 Lỗi khi ghi nhận log giao dịch thất bại: #{e.message}"
      end
      
      { success: false, ma_don_hang: ma_don_hang, redirect_url: "#{frontend_url}/payment-failed?order=#{ma_don_hang}" }
    end
  end
end