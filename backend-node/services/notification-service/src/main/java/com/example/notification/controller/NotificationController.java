package com.example.notification.controller;

import com.example.notification.dto.NotificationRequest;
import com.example.notification.service.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping("/send")
    public ResponseEntity<String> sendNotification(@RequestBody NotificationRequest request) {
        notificationService.queueNotification(request);
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body("Yêu cầu gửi thông báo đã được tiếp nhận (Bất đồng bộ).");
    }
}