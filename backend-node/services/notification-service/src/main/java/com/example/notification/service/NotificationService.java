package com.example.notification.service;

import com.example.notification.dto.NotificationRequest;
import com.example.notification.entity.Notification;
import com.example.notification.repository.NotificationRepository;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final RabbitTemplate rabbitTemplate;
    private final NotificationRepository notificationRepository;

    @Value("${notification.rabbitmq.exchange}")
    private String exchange;

    @Value("${notification.rabbitmq.routing.email}")
    private String emailRoutingKey;

    /**
     * Đưa yêu cầu thông báo bất đồng bộ vào hàng đợi RabbitMQ (Gửi Mail)
     */
    public void queueNotification(NotificationRequest request) {
        String channel = request.getChannel() != null ? request.getChannel().toLowerCase() : "all";

        if ("email".equals(channel)) {
            log.info("-> Đang xếp hàng đợi gửi email cho: {}", request.getTargetEmail());
            rabbitTemplate.convertAndSend(exchange, emailRoutingKey, request);
            
        } else if ("websocket".equals(channel) || "inapp".equals(channel)) {
            log.info("-> Đang xếp hàng gửi thông báo in-app cho user: {}", request.getUserId());
            rabbitTemplate.convertAndSend(exchange, "inapp.notification.routing", request);
            
        } else if ("all".equals(channel)) {
            log.info("-> Đang xếp hàng gửi đa kênh (email + in-app) cho user: {}", request.getUserId());
            rabbitTemplate.convertAndSend(exchange, emailRoutingKey, request);
            rabbitTemplate.convertAndSend(exchange, "inapp.notification.routing", request);
            
        } else {
            log.error("Kênh này chưa được cấu hình queue: {}", channel);
            throw new IllegalArgumentException("Kênh này chưa được cấu hình queue: " + channel);
        }
    }

    /**
     * Lấy danh sách lịch sử thông báo từ MongoDB theo User ID (sắp xếp mới nhất lên đầu)
     */
    public List<Notification> getNotificationsByUserId(String userId) {
        log.info("Đang truy vấn lịch sử thông báo của User ID: {}", userId);
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    /**
     * Đánh dấu một thông báo cụ thể là đã đọc theo ID
     */
    public void markAsRead(String id) {
        log.info("Đang đánh dấu đã đọc cho thông báo ID: {}", id);
        notificationRepository.findById(id).ifPresent(notification -> {
            // SỬA TẠI ĐÂY: Sử dụng đúng hàm setIsRead đã định nghĩa ở Entity
            notification.setIsRead(true); 
            notificationRepository.save(notification);
        });
    }

    /**
     * Đánh dấu tất cả các thông báo của một người dùng là đã đọc
     */
    public void markAllAsRead(String userId) {
        log.info("Đang đánh dấu đã đọc toàn bộ thông báo của User ID: {}", userId);
        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        
        // SỬA TẠI ĐÂY: Sử dụng đúng hàm setIsRead đã định nghĩa ở Entity
        notifications.forEach(notification -> notification.setIsRead(true)); 
        notificationRepository.saveAll(notifications);
    }
}