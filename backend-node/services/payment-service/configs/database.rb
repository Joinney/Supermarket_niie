require 'sequel'
require 'pg'

# Kết nối trực tiếp đến AWS Cloud Pooler của Supabase thông qua biến môi trường
DB = Sequel.connect(
  adapter:  'postgres',
  host:     ENV['DB_HOST'] || 'aws-1-ap-southeast-1.pooler.supabase.com',
  port:     ENV['DB_PORT'] || 5432,
  user:     ENV['DB_USER'] || 'postgres.aiesurvlmtrrgdiwxtma',
  password: ENV['DB_PASSWORD'] || 'demimart@2026',
  database: ENV['DB_NAME'] || 'demi_payment_db'
)

def db_connect
  DB
end
# 🌟 Tự động nạp Model giao dịch thanh toán
require_relative '../models/payment_transaction'