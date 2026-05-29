require 'sequel'

# Đọc URL kết nối từ biến môi trường (đã cấu hình trong docker-compose)
# Định dạng: postgres://user:password@hostname:port/database_name
DB_URL = ENV['DATABASE_URL'] || 'postgres://supermarket_db_exvs_user:u0tGq1rZG5nb84Ek2siWlqzIDb9W8qO7@db:5432/supermarket_db_exvs'

begin
  # Thiết lập kết nối
  DB = Sequel.connect(DB_URL)
  
  # Kiểm tra kết nối
  DB.test_connection
  puts "Kết nối Database thành công!"
rescue => e
  puts "Lỗi kết nối Database: #{e.message}"
  exit
end