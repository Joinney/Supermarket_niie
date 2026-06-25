FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# Cài đặt toàn bộ thư viện nền tảng trong container
RUN npm install

# Ép buộc cài đặt socket.io-client trực tiếp vào môi trường container
RUN npm install socket.io-client --save

COPY . .

EXPOSE 5173

# 🌟 GIẢI PHÁP TỰ ĐỘNG HÓA HOÀN TOÀN:

CMD ["sh", "-c", "npm install && npm run dev"]