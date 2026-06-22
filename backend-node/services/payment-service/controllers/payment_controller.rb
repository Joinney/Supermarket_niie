require_relative '../lib/payment_gateway'
require_relative '../configs/database'
require_relative '../models/payment_transaction' # Bảo đảm nạp Model an toàn độc lập
require 'openssl'
require 'uri'
require 'json'
require 'net/http'

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
        ma_giao_dich_vnp = "MPM#{Time.now.to_i}#{rand(100..999)}"
        PaymentTransaction.create(
          id: ma_giao_dich_vnp,
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
          ma_giao_dich_paypal = "MPM#{Time.now.to_i}#{rand(100..999)}"
          PaymentTransaction.create(
            id: ma_giao_dich_paypal,
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
    params_clean = query_params.dup
    secure_hash = params_clean.delete('vnp_SecureHash')
    params_clean.delete('vnp_SecureHashType')

    sorted_params = params_clean.sort.to_h
    query_string = URI.encode_www_form(sorted_params)

    secret_key = ENV['VNP_HASH_SECRET'] || '9O6E27MXV4LCOZJWQ4M9RFEZ9C1QW2L4'
    check_hash = OpenSSL::HMAC.hexdigest(OpenSSL::Digest.new('sha512'), secret_key, query_string)

    if secure_hash != check_hash
      puts "⚠️ Cảnh báo: Chữ ký VNPay không khớp mã Hash Checksum!"
      return { success: false, message: 'Invalid Signature Checksum' }
    end

    txn_ref = query_params['vnp_TxnRef']
    ma_don_hang = txn_ref.split('_')[0]
    response_code = query_params['vnp_ResponseCode']
    transaction_no = query_params['vnp_TransactionNo']

    frontend_url = ENV['FRONTEND_URL'] || 'http://localhost:5173'

    if response_code == '00'
      begin
        PaymentTransaction.where(ma_don_hang: ma_don_hang, phuong_thuc_thanh_toan: 'VNPay').update(
          trang_thai: 'completed',
          gateway_transaction_id: transaction_no,
          gateway_response_code: response_code,
          raw_response: query_params.to_json
        )

        sync_order_status_to_completed(ma_don_hang, 'VNPay')
        
        puts "🔒 Đơn hàng VNPay #{ma_don_hang} đã cập nhật lịch sử hệ thống thành công!"
        { success: true, ma_don_hang: ma_don_hang, redirect_url: "#{frontend_url}/payment-success?order=#{ma_don_hang}" }
      rescue => e
        puts "🔥 Lỗi khi xử lý hậu VNPay thành công: #{e.message}"
        { success: false, message: 'Payment Processing Error' }
      end
    else
      begin
        PaymentTransaction.where(ma_don_hang: ma_don_hang, phuong_thuc_thanh_toan: 'VNPay').update(
          trang_thai: 'failed',
          gateway_response_code: response_code,
          raw_response: query_params.to_json
        )
      rescue => e
        puts "🔥 Lỗi khi ghi nhận log giao dịch VNPay thất bại: #{e.message}"
      end
      { success: false, ma_don_hang: ma_don_hang, redirect_url: "#{frontend_url}/payment-failed?order=#{ma_don_hang}" }
    end
  end

  # ========================================================
  # 🛡️ 3. ĐỐI SOÁT PAYPAL CẬP NHẬT LỊCH SỬ CHUẨN XÁC VÀ AN TOÀN
  # ========================================================
  def self.handle_paypal_callback(ma_don_hang, paypal_order_id, so_tien, capture_data)
    status = capture_data['status'] || (capture_data['data']['status'] rescue nil) || (capture_data['raw_body']['status'] rescue nil)
    status = status.to_s.upcase
    
    capture_id = nil
    begin
      capture_id = capture_data['purchase_units'][0]['payments']['captures'][0]['id']
    rescue
      capture_id = capture_data['id'] || (capture_data['raw_body']['id'] rescue nil) || "PAYPAL_ID_#{Time.now.to_i}"
    end

    # Ép kiểu số tiền an toàn về dạng Float để tương thích với trường Numeric(12,2) trong DB Postgres
    final_amount = so_tien.to_f > 0 ? so_tien.to_f : 100000.0

    if status == 'COMPLETED' || status == 'APPROVED'
      begin
        transaction_record = PaymentTransaction.where(gateway_order_id: paypal_order_id, phuong_thuc_thanh_toan: 'PayPal')

        if transaction_record.first
          transaction_record.update(
            trang_thai: 'completed',
            gateway_transaction_id: capture_id,
            gateway_response_code: '200',
            raw_response: capture_data.to_json
          )
        else
          # Tạo mới hoàn chỉnh bản ghi completed vào bảng payment_transactions
          ma_giao_dich_bu = "MPM#{Time.now.to_i}#{rand(100..999)}"
          
          PaymentTransaction.create(
            id: ma_giao_dich_bu,
            ma_don_hang: ma_don_hang,
            phuong_thuc_thanh_toan: 'PayPal',
            so_tien: final_amount,
            tien_te: 'USD',
            trang_thai: 'completed',
            gateway_order_id: paypal_order_id,
            gateway_transaction_id: capture_id,
            gateway_response_code: '200',
            raw_response: capture_data.to_json
          )
        end

        puts "🔒 [DATABASE SUCCESS] Đã ghi nhận lịch sử giao dịch thành công cho đơn: #{ma_don_hang}"
        { success: true, message: 'Giao dịch hoàn tất!' }
      rescue => e
        puts "🔥 Lỗi ghi dữ liệu lịch sử vào Postgres: #{e.message}"
        { success: false, message: "Lỗi ghi DB: #{e.message}" }
      end
    else
      { success: false, message: "Trạng thái PayPal không hợp lệ: #{status}" }
    end
  end

  # ========================================================
  # 🚀 HELPER NỘI BỘ: ĐỒNG BỘ TRẠNG THÁI SANG ORDER-SERVICE QUA HTTP
  # ========================================================
  def self.sync_order_status_to_completed(ma_don_hang, phuong_thuc)
    begin
      uri = URI("http://localhost:5005/api/orders/internal/update-status")
      req = Net::HTTP::Post.new(uri, 'Content-Type' => 'application/json')
      req.body = { ma_don_hang: ma_don_hang, trang_thai_thanh_toan: 'completed', phuong_thuc: phuong_thuc }.to_json
      
      res = Net::HTTP.start(uri.hostname, uri.port) do |http|
        http.request(req)
      end
      puts "🔄 Đồng bộ trạng thái đơn hàng sang Order-Service phản hồi: #{res.code}"
    rescue => e
      puts "⚠️ Cảnh báo: Không thể kết nối gọi API sang Order-Service để đồng bộ: #{e.message}"
    end
  end
end