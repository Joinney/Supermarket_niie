# 1. Sử dụng image Node.js phiên bản ổn định
FROM node:20-alpine

# 2. Cài đặt các công cụ cần thiết (nếu service của bạn có dùng native modules)
RUN apk add --no-cache python3 make g++

# 3. Thiết lập thư mục làm việc trong container
WORKDIR /app

# 4. Copy package.json và package-lock.json để cài đặt dependencies trước (tối ưu cache)
COPY package*.json ./

# 5. ÉP CÀI ĐẶT AXIOS VÀO LAYER BUILD (Cài dependencies gốc + cài cứng axios)
RUN npm install && npm install axios

# 6. Copy toàn bộ mã nguồn còn lại
COPY . .

# 7. Mở cổng mà service của bạn đang lắng nghe (Cổng 5003 dịch vụ Giỏ hàng)
EXPOSE 5003

# 8. Lệnh khởi chạy server chuẩn (Duy nhất, dọn sạch chữ thừa phía sau)
CMD ["node", "server.js"]