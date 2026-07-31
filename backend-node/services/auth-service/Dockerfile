# Stage 1: Build & Install dependencies
FROM node:18-alpine AS builder

# Cài đặt công cụ build cần thiết cho alpine
RUN apk add --no-cache make gcc g++ python3

WORKDIR /app

# Copy các file khai báo dependencies
COPY package*.json ./

# Cài đặt toàn bộ dependencies (bao gồm cả dev) và dọn dẹp cache
RUN npm ci && npm cache clean --force

# Copy toàn bộ code vào
COPY . .

# =========================================================
# Stage 2: Runtime Image (Nhẹ & Tối ưu)
FROM node:18-alpine AS runner

WORKDIR /app

# Đặt môi trường production
ENV NODE_ENV=production

# Copy duy nhất thư mục app từ Stage 1 sang Stage 2
COPY --from=builder /app ./

EXPOSE 5001

CMD ["node", "server.js"]