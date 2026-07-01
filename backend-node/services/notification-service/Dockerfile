# Bước 1: Sử dụng Image Maven chạy trên nền Eclipse Temurin cực kỳ phổ biến và chuẩn hóa
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY . .
RUN mvn clean package -DskipTests

# Bước 2: Dùng JRE gọn nhẹ để khởi chạy ứng dụng nhằm giảm dung lượng image
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8085
ENTRYPOINT ["java", "-jar", "app.jar"]