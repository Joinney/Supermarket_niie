package com.example.notification;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@ComponentScan(basePackages = "com.example.notification") // Đảm bảo Spring quét và khởi tạo toàn bộ Bean (WebSocket, RabbitMQ, Service, Controller...)
@EnableAsync // Bắt buộc có để cho phép gửi Email bất đồng bộ (chạy ngầm, không làm nghẽn luồng nhận tin nhắn)
@EnableScheduling // Cho phép chạy các tác vụ lên lịch tự động (như dọn dẹp thông báo rác, retry gửi email lỗi...)
public class NotificationServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(NotificationServiceApplication.class, args);
        System.out.println("==================================================");
        System.out.println("🚀 NOTIFICATION SERVICE IS RUNNING SUCCESSFULLY!");
        System.out.println("📧 Mail Service & 🔌 WebSocket & 🐰 RabbitMQ Ready");
        System.out.println("==================================================");
    }
}