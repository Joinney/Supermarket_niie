package com.example.notification.controller;

import com.example.notification.dto.NotificationRequest;
import com.example.notification.entity.Notification;
import com.example.notification.service.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;

import java.util.List;

@RestController
@CrossOrigin(origins = "http://localhost:5173", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.OPTIONS})
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * Giao diện HTML đồng bộ tông màu #006c49 khi truy cập cổng http://localhost:8085
     */
    @GetMapping(value = "/", produces = MediaType.TEXT_HTML_VALUE)
    public String home() {
        return """
            <!DOCTYPE html>
            <html lang="vi">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Demi Mart - Notification Service</title>
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
                <style>
                    body {
                        font-family: 'Plus Jakarta Sans', sans-serif;
                        background-color: #f4f7f6;
                        margin: 0;
                        padding: 0;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                    }
                    .card {
                        background-color: #ffffff;
                        padding: 50px 40px;
                        border-radius: 20px;
                        box-shadow: 0 10px 25px -5px rgba(0, 108, 73, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
                        text-align: center;
                        max-width: 500px;
                        width: 90%;
                    }
                    h1 { color: #006c49; font-size: 2.2rem; margin-top: 0; font-weight: 700; }
                    p { color: #64748b; font-size: 1.1rem; line-height: 1.6; margin-bottom: 30px; }
                    .btn-swagger {
                        display: inline-block;
                        background-color: #006c49;
                        color: #ffffff;
                        padding: 14px 28px;
                        border-radius: 10px;
                        font-weight: 700;
                        text-decoration: none;
                        transition: all 0.2s ease;
                        box-shadow: 0 4px 12px rgba(0, 108, 73, 0.25);
                    }
                    .btn-swagger:hover {
                        background-color: #005237;
                        transform: translateY(-2px);
                        box-shadow: 0 6px 16px rgba(0, 108, 73, 0.35);
                    }
                </style>
            </head>
            <body>
                <div class="card">
                    <h1>Demi Mart Notification Service</h1>
                    <p>Hệ thống dịch vụ thông báo (Spring Boot) đang hoạt động xanh mướt! 🚀</p>
                    <a href="/swagger-ui/index.html" class="btn-swagger">Vào Swagger xem API →</a>
                </div>
            </body>
            </html>
        """;
    }

    /**
     * Redirect đường dẫn /api-docs sang Swagger UI chính thức của Spring Boot
     */
    @GetMapping("/api-docs")
    public ResponseEntity<Void> redirectToSwagger() {
        return ResponseEntity.status(HttpStatus.FOUND)
                .header("Location", "/swagger-ui/index.html")
                .build();
    }

    /**
     * API tiếp nhận yêu cầu gửi thông báo bất đồng bộ qua RabbitMQ
     */
    @PostMapping("/api/v1/notifications/send")
    public ResponseEntity<String> sendNotification(@RequestBody NotificationRequest request) {
        notificationService.queueNotification(request);
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body("Yêu cầu gửi thông báo đã được tiếp nhận (Bất đồng bộ).");
    }

    /**
     * API lấy danh sách lịch sử thông báo từ MongoDB theo userId
     */
    @GetMapping("/api/v1/notifications/user/{userId}")
    public ResponseEntity<List<Notification>> getNotificationsByUser(@PathVariable String userId) {
        List<Notification> notifications = notificationService.getNotificationsByUserId(userId);
        return ResponseEntity.ok(notifications);
    }

    /**
     * API đánh dấu một thông báo là đã đọc
     */
    @PutMapping("/api/v1/notifications/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable String id) {
        notificationService.markAsRead(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * API đánh dấu tất cả thông báo của một user là đã đọc
     */
    @PutMapping("/api/v1/notifications/user/{userId}/read-all")
    public ResponseEntity<Void> markAllAsRead(@PathVariable String userId) {
        notificationService.markAllAsRead(userId);
        return ResponseEntity.noContent().build();
    }
}