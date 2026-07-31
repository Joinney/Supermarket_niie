package com.example.notification.consumer;

import com.example.notification.dto.NotificationRequest;
import com.example.notification.dto.NotificationResponse;
import com.example.notification.entity.Notification;
import com.example.notification.repository.NotificationRepository;
import com.example.notification.service.EmailService;

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
    private final EmailService emailService;

    @RabbitListener(queues = "${notification.rabbitmq.queue.login:loginQueue}")
    public void consumeLoginEvent(Map<String, Object> loginEvent) {
        try {
            log.info("📩 Nhận sự kiện đăng nhập từ RabbitMQ: {}", loginEvent);

            String username = parseString(loginEvent.get("username"));
            String userId = parseString(loginEvent.get("userId"));
            
            // 🌟 CẢI TIẾN: Quét tìm Email ở tất cả các tên key phổ biến mà auth-service có thể gửi
            String email = extractEmail(loginEvent);

            if (userId == null || userId.trim().isEmpty()) {
                log.warn("⚠️ Sự kiện đăng nhập không có userId hợp lệ, bỏ qua.");
                return;
            }

            // 1. Dọn dẹp thông báo cũ cùng tiêu đề trong MongoDB
            try {
                notificationRepository.deleteByUserIdAndTitle(userId, "Thiết bị mới đăng nhập");
                log.info("🧹 Đã dọn dẹp các thông báo đăng nhập cũ của user: {}", userId);
            } catch (Exception dbEx) {
                log.error("❌ Lỗi khi xóa thông báo cũ: {}", dbEx.getMessage());
            }

            String id = UUID.randomUUID().toString();
            String title = "Thiết bị mới đăng nhập";
            String desc = "Tài khoản " + (username != null ? username : userId) + " vừa đăng nhập thành công vào hệ thống Demi Mart.";

            // 2. Lưu thông báo mới vào MongoDB
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
            log.info("💾 Đã lưu thông báo mới vào MongoDB (ID: {})", id);

            // 3. Bắn Realtime qua WebSocket cho React Client
            String formattedTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm - dd/MM/yyyy"));
            NotificationResponse responseDto = new NotificationResponse(id, title, desc, formattedTime);
            
            messagingTemplate.convertAndSend("/topic/user/" + userId, responseDto);
            log.info("📡 Đã gửi WebSocket thành công tới /topic/user/{}", userId);

            // 4. 📧 TỰ ĐỘNG GỬI EMAIL CẢNH BÁO
            if (email != null && !email.trim().isEmpty() && email.contains("@")) {
                log.info("🚀 Đang tiến hành gửi email tới địa chỉ: {}", email);
                emailService.sendHtmlEmail(
                    email,
                    "[Demi Mart Security] Cảnh báo đăng nhập tài khoản",
                    title,
                    desc + "<br/><br/><b>Thời gian:</b> " + formattedTime + "<br/>Nếu đây không phải là bạn, vui lòng đổi mật khẩu ngay lập tức!"
                );
            } else {
                log.warn("⚠️ KHÔNG THỂ GỬI MAIL: Không tìm thấy email hợp lệ trong Map sự kiện RabbitMQ! Các keys nhận được: {}", loginEvent.keySet());
            }

        } catch (Exception e) {
            log.error("💥 Lỗi nghiêm trọng khi xử lý sự kiện đăng nhập: {}", e.getMessage(), e);
        }
    }

@RabbitListener(queues = "${notification.rabbitmq.queue.inapp:inappQueue}")
    public void consumeInAppNotification(NotificationRequest request) {
        try {
            log.info("📩 Nhận thông báo In-App từ RabbitMQ: {}", request.getTitle());

            String userId = request.getUserId();
            if (userId == null || userId.trim().isEmpty()) {
                log.warn("⚠️ Bỏ qua thông báo vì không có userId hợp lệ");
                return;
            }

            String id = UUID.randomUUID().toString();
            String title = request.getTitle();
            String desc = request.getContent(); // Dùng hàm tiện ích cực hay từ DTO của bạn
            String type = request.getType() != null ? request.getType() : "system";

            // Đưa thông tin type vào Map để tương thích với cấu trúc lưu MongoDB
            Map<String, Object> additionalData = new java.util.HashMap<>();
            additionalData.put("type", type);

            // 1. Lưu MongoDB
            Notification notification = new Notification(
                    id, userId, title, desc, LocalDateTime.now(), false, additionalData
            );
            notificationRepository.save(notification);
            log.info("💾 Đã lưu thông báo In-App vào MongoDB (ID: {})", id);

            // 2. Bắn Realtime qua WebSocket cho React Client
            // Tạo Map payload khớp 100% với giao diện Frontend cần để hiện đúng Icon
            Map<String, Object> wsPayload = new java.util.HashMap<>();
            wsPayload.put("id", id);
            wsPayload.put("title", title);
            wsPayload.put("description", desc);
            wsPayload.put("type", type);
            wsPayload.put("isRead", false);
            wsPayload.put("createdAt", LocalDateTime.now().toString());

            messagingTemplate.convertAndSend("/topic/user/" + userId, wsPayload);
            log.info("📡 Đã gửi WebSocket In-App thành công tới /topic/user/{}", userId);

        } catch (Exception e) {
            log.error("💥 Lỗi khi xử lý thông báo In-App: {}", e.getMessage(), e);
        }
    }

    /**
     * Hàm phụ trợ lấy Email từ Map với nhiều Key linh hoạt
     */
    private String extractEmail(Map<String, Object> map) {
        String[] possibleKeys = {"email", "recipient", "userEmail", "mail", "gmail"};
        for (String key : possibleKeys) {
            Object val = map.get(key);
            if (val != null) {
                String strVal = val.toString().trim();
                if (strVal.contains("@")) {
                    return strVal;
                }
            }
        }
        return null;
    }

    /**
     * Ép kiểu Object sang String an toàn
     */
    private String parseString(Object obj) {
        return obj != null ? obj.toString().trim() : null;
    }
}