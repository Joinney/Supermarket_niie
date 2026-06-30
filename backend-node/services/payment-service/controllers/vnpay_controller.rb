require_relative '../lib/payment_gateway'
require_relative '../configs/database'
require_relative '../models/payment_transaction'
require 'openssl'
require 'uri'
require 'json'

class VnpayController
  # ============================================================================
  # 1. Khởi tạo link thanh toán VNPay & Lưu thông tin PENDING + Log Hộp Đen
  # ============================================================================
  def self.init_payment(req_params, client_ip)
    ma_don_hang = req_params['ma_don_hang']
    tong_thanh_toan = req_params['tong_thanh_toan'] || 0

    url = PaymentGateway.create_vnpay_url(req_params, client_ip)

    begin
      uri = URI.parse(url)
      uri_params = URI.decode_www_form(uri.query).to_h
      vnp_txn_ref = uri_params['vnp_TxnRef']

      record = PaymentTransaction.create(
        ma_don_hang: ma_don_hang,
        phuong_thuc: 'VNPay',
        so_tien: tong_thanh_toan.to_f,
        tien_te: 'VND',
        trang_thai: 'PENDING',
        gateway_order_id: vnp_txn_ref,
        client_ip: client_ip
      )

      PaymentTransaction.db[
        "INSERT INTO payment_gateway_logs (payment_transaction_id, gateway_name, event_type, http_status, request_payload, response_payload, ip_address) 
         VALUES (?, ?, ?, ?, cast(? as jsonb), cast(? as jsonb), ?)",
        record.id, 'VNPay', 'CREATE_URL', 200, req_params.to_json, { payment_url: url }.to_json, client_ip
      ].insert

    rescue => e
      puts "🔥 [FinTech Sequel Log Error] Khởi tạo giao dịch VNPay thất bại: #{e.message}"
    end

    { success: true, phuong_thuc_thanh_toan: 'VNPay', paymentUrl: url }
  end

  # ============================================================================
  # 2. Đối soát khi khách hàng được VNPay đá về Web (Đã gỡ bẫy setter raw_response)
  # ============================================================================
  def self.verify_return(query_params)
    begin
      params_clean = query_params.dup
      secure_hash = params_clean.delete('vnp_SecureHash')
      params_clean.delete('vnp_SecureHashType')

      sorted_params = params_clean.sort.to_h
      query_string = URI.encode_www_form(sorted_params)

      secret_key = 'F6GIYA4894EW07CHMUOXODSXCTY87JQ6'
      check_hash = OpenSSL::HMAC.hexdigest(OpenSSL::Digest.new('sha512'), secret_key, query_string)

      txn_ref = query_params['vnp_TxnRef'] || ''
      ma_don_hang = txn_ref.split('_')[0]
      response_code = query_params['vnp_ResponseCode']
      vnp_transaction_no = query_params['vnp_TransactionNo']
      vnp_amount = query_params['vnp_Amount'].to_f / 100.0

      if secure_hash != check_hash
        return { success: false, message: 'Chữ ký bảo mật VNPay không hợp lệ!' }
      end

      record = PaymentTransaction.where(gateway_order_id: txn_ref, phuong_thuc: 'VNPay').first
      record ||= PaymentTransaction.where(ma_don_hang: ma_don_hang, phuong_thuc: 'VNPay').first

      if response_code == '00'
        if record
          # 🎯 Cập nhật database nội bộ của Payment Service
          record.update(
            trang_thai: 'COMPLETED',
            gateway_transaction_id: vnp_transaction_no
          )
          parent_id = record.id
          event_name = 'RETURN_URL_CALLBACK_SUCCESS'
        else
          new_parent = PaymentTransaction.create(
            ma_don_hang: ma_don_hang,
            phuong_thuc: 'VNPay',
            so_tien: vnp_amount,
            tien_te: 'VND',
            trang_thai: 'COMPLETED',
            gateway_order_id: txn_ref,
            gateway_transaction_id: vnp_transaction_no,
            client_ip: '127.0.0.1'
          )
          parent_id = new_parent.id
          event_name = 'DIRECT_RETURN_FALLBACK_SUCCESS'
        end

        # ============================================================================
        # 🚀 BỔ SUNG: BẮN ĐỒNG BỘ TRẠNG THÁI SANG ORDER-SERVICE (CỔNG 5005)
        # ============================================================================
        begin
          require 'net/http'
          order_service_url = URI.parse('http://demi_order_service:5005/api/orders/internal/update-status')
          
          http = Net::HTTP.new(order_service_url.host, order_service_url.port)
          request = Net::HTTP::Post.new(order_service_url.path, { 'Content-Type' => 'application/json' })
          
          # Payload gửi đi khớp hoàn toàn với hàm updateInternalOrderStatus bên Node.js
          request.body = {
            ma_don_hang: ma_don_hang.to_s,
            trang_thai_thanh_toan: 'completed' # Trùng với chữ thường/hoa trong DB xử lý của bạn
          }.to_json

          response = http.request(request)
          puts "🔒 [VNPAY MICROSERVICE SYNC]: Đã đồng bộ sang Order-Service. Kết quả: #{response.code} - #{response.body}"
        rescue => sync_err
          puts "⚠️ [VNPAY SYNC WARNING]: Không thể kết nối để đồng bộ trạng thái sang Order-Service: #{sync_err.message}"
        end
        # ============================================================================

        # Ghi vào bảng Hộp Đen log hệ thống
        PaymentTransaction.db[
          "INSERT INTO payment_gateway_logs (payment_transaction_id, gateway_name, event_type, http_status, request_payload, response_payload, ip_address) 
           VALUES (?, ?, ?, ?, cast(? as jsonb), cast(? as jsonb), ?)",
          parent_id, 'VNPay', event_name, 200, {}.to_json, query_params.to_json, '127.0.0.1'
        ].insert

        puts "🔒 [DATABASE VNPAY CHỐT ĐƠN]: Thành công rực rỡ đơn #{ma_don_hang} (ID Mẹ: #{parent_id})!"
        { success: true, ma_don_hang: ma_don_hang, message: 'Thanh toán VNPay thành công!' }
      else
        if record
          record.update(trang_thai: 'FAILED')
          parent_id = record.id
        else
          new_fail = PaymentTransaction.create(
            ma_don_hang: ma_don_hang, phuong_thuc: 'VNPay', so_tien: vnp_amount, trang_thai: 'FAILED', gateway_order_id: txn_ref
          )
          parent_id = new_fail.id
        end

        PaymentTransaction.db[
          "INSERT INTO payment_gateway_logs (payment_transaction_id, gateway_name, event_type, http_status, request_payload, response_payload, ip_address) 
           VALUES (?, ?, ?, ?, cast(? as jsonb), cast(? as jsonb), ?)",
          parent_id, 'VNPay', 'RETURN_URL_CALLBACK_FAILED', 200, {}.to_json, query_params.to_json, '127.0.0.1'
        ].insert

        { success: false, ma_don_hang: ma_don_hang, message: "Giao dịch hủy hoặc thất bại (Mã: #{response_code})" }
      end

    rescue => e
      puts "🔥 [FATAL SEQUEL CRASH VNPAY RETURN]: #{e.message}"
      puts e.backtrace.join("\n")
      { success: false, message: "Lỗi xử lý hệ thống nội bộ Backend: #{e.message}" }
    end
  end
end