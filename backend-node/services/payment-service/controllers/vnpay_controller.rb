require_relative '../lib/payment_gateway'
require_relative '../configs/database'
require_relative '../models/payment_transaction'
require 'openssl'
require 'uri'
require 'json'

class VnpayController
  # 1. Khởi tạo link thanh toán VNPay
  def self.init_payment(req_params, client_ip)
    ma_don_hang = req_params['ma_don_hang']
    tong_thanh_toan = req_params['tong_thanh_toan'] || 0

    begin
      ma_giao_dich_vnp = "MPM#{Time.now.to_i}#{rand(100..999)}"
      PaymentTransaction.create(
        id: ma_giao_dich_vnp,
        ma_don_hang: ma_don_hang,
        phuong_thuc_thanh_toan: 'VNPay',
        so_tien: tong_thanh_toan.to_f,
        tien_te: 'VND',
        trang_thai: 'pending',
        client_ip: '127.0.0.1' # Phát triển sau theo yêu cầu
      )
    rescue => e
      puts "🔥 Lỗi ghi log VNPay ban đầu: #{e.message}"
    end

    url = PaymentGateway.create_vnpay_url(req_params, client_ip)
    { success: true, phuong_thuc_thanh_toan: 'VNPay', paymentUrl: url }
  end

  # 2. Đối soát khi khách hàng được VNPay đá về Web
def self.verify_return(query_params)
    params_clean = query_params.dup
    secure_hash = params_clean.delete('vnp_SecureHash')
    params_clean.delete('vnp_SecureHashType')

    # VNPay trả về tham số đã được encode theo chuẩn của họ.
    # Ruby cần sort và tạo chuỗi đúng thứ tự tham số.
    sorted_params = params_clean.sort.to_h
    
    # 🎯 FIX CHÍ MẠNG: Không dùng gsub, dùng đúng chuẩn encode_www_form
    # VNPay gửi dấu + cho khoảng trắng, URI.encode_www_form sẽ tạo ra đúng như vậy.
    query_string = URI.encode_www_form(sorted_params)

    secret_key = 'F6GIYA4894EW07CHMUOXODSXCTY87JQ6'
    check_hash = OpenSSL::HMAC.hexdigest(OpenSSL::Digest.new('sha512'), secret_key, query_string)

    # Log debug để kiểm tra chữ ký server VNPay trả về và chữ ký Ruby tính ra
    puts "DEBUG: SecureHash from VNPAY: #{secure_hash}"
    puts "DEBUG: My Hash calculated: #{check_hash}"

    if secure_hash != check_hash
      return { success: false, message: 'Chữ ký bảo mật VNPay không hợp lệ!' }
    end
    # ... code còn lại ...

    txn_ref = query_params['vnp_TxnRef'] || ''
    ma_don_hang = txn_ref.split('_')[0]
    response_code = query_params['vnp_ResponseCode']

    if response_code == '00'
      begin
        record = PaymentTransaction.where(ma_don_hang: ma_don_hang, phuong_thuc_thanh_toan: 'VNPay').first
        if record
          record.update(trang_thai: 'completed', gateway_response_code: response_code)
        end
        { success: true, ma_don_hang: ma_don_hang, message: 'Thanh toán VNPay thành công!' }
      rescue => e
        { success: false, message: "Lỗi DB: #{e.message}" }
      end
    else
      { success: false, ma_don_hang: ma_don_hang, message: "Giao dịch hủy hoặc thất bại (Mã: #{response_code})" }
    end
  end
end