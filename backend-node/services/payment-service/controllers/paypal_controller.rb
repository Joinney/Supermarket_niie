require_relative '../lib/payment_gateway'
require_relative '../configs/database'
require_relative '../models/payment_transaction'
require 'json'

class PaypalController
  # ============================================================================
  # NHỊP 1: Khởi tạo Order ảo sang PayPal & Ghi nhận DB PENDING + Log Hộp đen
  # ============================================================================
  def self.init_payment(req_params, client_ip)
    ma_don_hang = req_params['ma_don_hang']
    tong_thanh_toan = req_params['tong_thanh_toan'] || 0

    result = PaymentGateway.create_paypal_transaction(req_params)

    if result[:status] == 'success'
      begin
        # BƯỚC 1: Tạo bản ghi mẹ (Để PostgreSQL tự động nhảy số id BIGSERIAL)
        record = PaymentTransaction.create(
          ma_don_hang: ma_don_hang,
          phuong_thuc: 'PayPal',
          so_tien: tong_thanh_toan.to_f,
          tien_te: 'USD',
          trang_thai: 'PENDING',
          gateway_order_id: result[:paypal_order_id],
          client_ip: client_ip
        )

        # BƯỚC 2: Ghi hộp đen máy bay nhật ký xin URL
        PaymentTransaction.db[
          "INSERT INTO payment_gateway_logs (payment_transaction_id, gateway_name, event_type, http_status, request_payload, response_payload, ip_address) 
           VALUES (?, ?, ?, ?, cast(? as jsonb), cast(? as jsonb), ?)",
          record.id, 'PayPal', 'CREATE_ORDER_SDK', 200, req_params.to_json, result.to_json, client_ip
        ].insert

      rescue => e
        puts "🔥 [PayPal Init Log Error]: #{e.message}"
      end

      { success: true, phuong_thuc_thanh_toan: 'PayPal', paymentUrl: result[:payUrl], paypal_order_id: result[:paypal_order_id] }
    else
      { success: false, message: "Lỗi khởi tạo PayPal: #{result[:message]}" }
    end
  end

  # ============================================================================
  # NHỊP 2: Khách duyệt xong trên ví -> Client gửi tín hiệu Capture về chốt sổ
  # ============================================================================
  def self.capture(req_params, client_ip)
    ma_don_hang = req_params['ma_don_hang']
    paypal_order_id = req_params['paypal_order_id']
    so_tien_vnd = req_params['so_tien'] || 0
    capture_data = req_params['capture_data'] || {}

    capture_id = capture_data['id'] || paypal_order_id
    status_paypal = capture_data['status'] # Thường là 'COMPLETED'

    begin
      # Tìm lại đơn hàng PENDING ở Nhịp 1
      record = PaymentTransaction.where(gateway_order_id: paypal_order_id, phuong_thuc: 'PayPal').first
      record ||= PaymentTransaction.where(ma_don_hang: ma_don_hang, phuong_thuc: 'PayPal').first

      if record
        record.update(
          trang_thai: 'COMPLETED',
          gateway_transaction_id: capture_id
        )

        PaymentTransaction.db[
          "INSERT INTO payment_gateway_logs (payment_transaction_id, gateway_name, event_type, http_status, request_payload, response_payload, ip_address) 
           VALUES (?, ?, ?, ?, cast(? as jsonb), cast(? as jsonb), ?)",
          record.id, 'PayPal', 'CAPTURE_SUCCESS', 200, req_params.to_json, capture_data.to_json, client_ip
        ].insert
      else
        # Fallback siêu an toàn: Khách mua nhanh bỏ qua bước Init, tự tạo dòng COMPLETED mới
        new_rec = PaymentTransaction.create(
          ma_don_hang: ma_don_hang,
          phuong_thuc: 'PayPal',
          so_tien: so_tien_vnd.to_f,
          tien_te: 'USD',
          trang_thai: 'COMPLETED',
          gateway_order_id: paypal_order_id,
          gateway_transaction_id: capture_id,
          client_ip: client_ip
        )

        PaymentTransaction.db[
          "INSERT INTO payment_gateway_logs (payment_transaction_id, gateway_name, event_type, http_status, request_payload, response_payload, ip_address) 
           VALUES (?, ?, ?, ?, cast(? as jsonb), cast(? as jsonb), ?)",
          new_rec.id, 'PayPal', 'DIRECT_CAPTURE_SUCCESS', 200, req_params.to_json, capture_data.to_json, client_ip
        ].insert
      end

      puts "🔒 [DATABASE PAYPAL SUCCESS]: Đã chốt sổ thành công đơn #{ma_don_hang}!"
      { success: true, ma_don_hang: ma_don_hang, message: 'Ghi nhận giao dịch PayPal hoàn tất!' }

    rescue => e
      puts "🔥 [FATAL PAYPAL CAPTURE]: #{e.message}"
      puts e.backtrace.join("\n")
      { success: false, message: "Lỗi lưu DB PayPal: #{e.message}" }
    end
  end
end