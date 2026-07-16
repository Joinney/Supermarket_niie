package com.example.notification.consumer;

import com.example.notification.dto.NotificationResponse;
import com.example.notification.entity.Notification;
import com.example.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationConsumer {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

   @RabbitListener(queues = "${notification.rabbitmq.queue.login}")
    public void consumeLoginEvent(Map<String, Object> loginEvent) {
    try {
        log.info("Nhận sự kiện đăng nhập từ RabbitMQ: {}", loginEvent);

        String username = (String) loginEvent.get("username");
        String userId = (String) loginEvent.get("userId");
        
        if (userId == null || userId.trim().isEmpty()) {
            log.warn("Sự kiện đăng nhập không có userId hợp lệ, bỏ qua.");
            return;
        }

        // 🌟 CHUẨN HÓA: Tìm và xóa toàn bộ thông báo đăng nhập cũ của User này trong MongoDB
        // Tiêu đề để nhận diện là "Thiết bị mới đăng nhập"
        try {
            notificationRepository.deleteByUserIdAndTitle(userId, "Thiết bị mới đăng nhập");
            log.info("🧹 Đã dọn dẹp các thông báo đăng nhập cũ của user: {}", userId);
        } catch (Exception dbEx) {
            log.error("Không thể xóa thông báo cũ: {}", dbEx.getMessage());
        }

        String id = UUID.randomUUID().toString();
        String title = "Thiết bị mới đăng nhập";
        String desc = "Tài khoản " + username + " vừa đăng nhập thành công vào hệ thống.";

        // 1. Lưu thông báo mới duy nhất vào MongoDB
        Notification notification = new Notification(
                id,
                userId,
                title,
                desc,
                LocalDateTime.now(),
                false,
                loginEvent 
        );
        notificationRepository.save(notification);
        log.info("Đã lưu thông báo đăng nhập mới nhất vào MongoDB với ID: {}", id);

        // 2. Chuyển đổi định dạng và bắn tín hiệu qua WebSocket tới React Client
        String formattedTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm"));
        NotificationResponse responseDto = new NotificationResponse(id, title, desc, formattedTime);
        
        // Đẩy dữ liệu qua kênh cá nhân hóa của user
        messagingTemplate.convertAndSend("/topic/user/" + userId, responseDto);
        log.info("Đã gửi thông báo Real-time qua WebSocket tới user: {}", userId);

    } catch (Exception e) {
        log.error("Lỗi khi xử lý sự kiện thông báo đăng nhập: {}", e.getMessage(), e);
    }
}
}