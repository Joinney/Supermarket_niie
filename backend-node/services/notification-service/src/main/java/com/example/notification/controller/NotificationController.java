package com.example.notification.controller;

import com.example.notification.dto.NotificationRequest;
import com.example.notification.entity.Notification;
import com.example.notification.service.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
// ĐỒNG BỘ HOÀN TOÀN: Cho phép React Client gọi API và các phương thức cần thiết
@CrossOrigin(origins = "http://localhost:5173", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.OPTIONS})
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * API tiếp nhận yêu cầu gửi thông báo bất đồng bộ qua RabbitMQ
     */
    @PostMapping("/send")
    public ResponseEntity<String> sendNotification(@RequestBody NotificationRequest request) {
        notificationService.queueNotification(request);
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body("Yêu cầu gửi thông báo đã được tiếp nhận (Bất đồng bộ).");
    }

    /**
     * API lấy danh sách lịch sử thông báo từ MongoDB theo userId (sắp xếp mới nhất lên đầu)
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Notification>> getNotificationsByUser(@PathVariable String userId) {
        List<Notification> notifications = notificationService.getNotificationsByUserId(userId);
        return ResponseEntity.ok(notifications);
    }

    /**
     * API đánh dấu một thông báo là đã đọc
     * ĐỒNG BỘ HOÀN TOÀN: Đổi sang @PutMapping để khớp với axios.put của React Client
     */
    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable String id) {
        notificationService.markAsRead(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * API đánh dấu tất cả thông báo của một user là đã đọc
     * ĐỒNG BỘ HOÀN TOÀN: Đổi sang @PutMapping để khớp với axios.put của React Client
     */
    @PutMapping("/user/{userId}/read-all")
    public ResponseEntity<Void> markAllAsRead(@PathVariable String userId) {
        notificationService.markAllAsRead(userId);
        return ResponseEntity.noContent().build();
    }
}