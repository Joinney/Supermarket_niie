FROM node:18-alpine

# Cài đặt các công cụ build cho Linux
RUN apk add --no-cache make gcc g++ python3

WORKDIR /app

# Chỉ copy package.json để install trước
COPY package*.json ./

# Ép install và build lại ngay trong môi trường Linux của Docker
RUN npm install

COPY . .

EXPOSE 5001

CMD ["node", "server.js"]