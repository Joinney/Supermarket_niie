FROM ghcr.io/cirruslabs/flutter:latest AS build

WORKDIR /app

# Sao chép file cấu hình dependencies
COPY pubspec.* ./
RUN flutter pub get

# Sao chép toàn bộ mã nguồn và build phiên bản Web
COPY . .
RUN flutter build web --release

# Sử dụng Nginx nhẹ để serve bản build
FROM nginx:alpine
COPY --from=build /app/build/web /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]