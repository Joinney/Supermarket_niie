# Sử dụng phiên bản Node.js ổn định
FROM node:20-alpine

# Thiết lập thư mục làm việc bên trong container
WORKDIR /app

# Copy file package.json và package-lock.json để cài đặt dependency trước
# Việc này giúp tận dụng Docker cache, giúp build nhanh hơn cho các lần sau
COPY package*.json ./

# Cài đặt các thư viện định nghĩa trong package.json trước
RUN npm install --legacy-peer-deps

# 🌟 ÉP CÀI ĐẶT BỔ SUNG SOCKET.IO ĐỂ KHÔNG BỊ SÓT TRONG CONTAINER
RUN npm install socket.io --legacy-peer-deps

# Copy toàn bộ mã nguồn của order-service vào container
COPY . .

# Mở cổng ứng dụng
EXPOSE 5005

# Lệnh khởi chạy ứng dụng
CMD ["npm", "start"]