# 1. Sử dụng image Node.js phiên bản ổn định
FROM node:20-alpine

# 2. Cài đặt các công cụ cần thiết (nếu service của bạn có dùng native modules)
RUN apk add --no-cache python3 make g++

# 3. Thiết lập thư mục làm việc trong container
WORKDIR /app

# 4. Copy package.json và package-lock.json để cài đặt dependencies trước (tối ưu cache)
COPY package*.json ./

# 5. Cài đặt các thư viện cần thiết
RUN npm install

# 6. Copy toàn bộ mã nguồn còn lại
COPY . .

# 7. Mở cổng mà service của bạn đang lắng nghe (Ví dụ cổng 5003 như bạn đã nêu)
EXPOSE 5003

# 8. Lệnh khởi chạy server (Thay "node server.js" bằng entry point thực tế của bạn)
CMD ["node", "server.js"]