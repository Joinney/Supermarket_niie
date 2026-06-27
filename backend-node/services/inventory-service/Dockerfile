# ========================================================
# 🏗️ STAGE 1: BUILD ỨNG DỤNG (NÂNG LÊN GO 1.26)
# ========================================================
FROM golang:1.26-alpine AS builder

# Cài đặt các công cụ biên dịch thiết yếu
RUN apk add --no-cache git build-base

WORKDIR /app

# Copy các file cấu hình thư viện trước để tận dụng Docker Cache
COPY go.mod go.sum ./
RUN go mod download

# Tải công cụ swag để tự động tạo tài liệu API
RUN go install github.com/swaggo/swag/cmd/swag@latest

# Copy toàn bộ mã nguồn của service vào container
COPY . .

# Tự động generate swagger docs
RUN swag init

# 🌟 ĐỒNG BỘ: Chạy lệnh đồng bộ thư viện tránh lỗi lệch pha go.sum trong container
RUN go mod tidy

# Biên dịch ứng dụng theo thư mục hiện hành (.) thay vì chỉ định đích danh file lẻ
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# ========================================================
# 🚀 STAGE 2: MÔI TRƯỜNG RUNTIME SIÊU GỌN (ALPINE LINUX)
# ========================================================
FROM alpine:latest  

RUN apk --no-cache add ca-certificates tzdata

WORKDIR /root/

# Copy file thực thi độc lập từ Stage 1 sang
COPY --from=builder /app/main .
COPY --from=builder /app/docs ./docs

# Cổng kết nối
EXPOSE 5006

CMD ["./main"]