require 'sequel'

# 🌟 Cú pháp chuẩn của Sequel để chỉ định chính xác Schema và Tên bảng
# Sử dụng plugin `timestamps` để tự động quản lý created_at và updated_at
class PaymentTransaction < Sequel::Model(Sequel.qualify(:public, :payment_transactions))
  plugin :timestamps, update_on_create: true
end