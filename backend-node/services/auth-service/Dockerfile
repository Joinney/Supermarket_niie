FROM node:18-alpine

# Cài đặt các công cụ build cho Linux
RUN apk add --no-cache make gcc g++ python3

WORKDIR /app

# Chỉ copy package.json để install trước
COPY package*.json ./

# 🎯 SỬA CHỖ NÀY: Ép Docker luôn luôn cài đặt socket.io trực tiếp trong môi trường build
RUN npm install socket.io --save
RUN npm install

COPY . .

EXPOSE 5001

CMD ["node", "server.js"]