package com.example.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    // ID của người nhận trong hệ thống (dùng cho WebSocket topic: /topic/user/{userId})
    private String userId;

    // Kênh gửi thông báo: "email", "websocket", "sms", "all" (mặc định nếu để trống là "all")
    private String channel; 

    // Địa chỉ người nhận (Số điện thoại nếu là SMS, Email nếu là Mail, hoặc userId)
    private String recipient;

    // Địa chỉ Email người nhận (Dùng chuyên biệt khi gửi Mail)
    private String email;

    // Tiêu đề thông báo
    private String title;

    // Nội dung chi tiết thông báo
    private String message;

    // Lớp dự phòng tương thích với field 'description'
    private String description;

    // Loại thông báo: "order", "promo", "system"
    private String type;

    // --- CÁC HÀM GETTER BỔ TRỢ ĐỂ ĐẢM BẢO TƯƠNG THÍCH CODE CŨ/MỚI ---

    /**
     * Lấy email chuẩn: Ưu tiên lấy từ trường 'email', nếu trống sẽ lấy từ 'recipient'
     */
    public String getTargetEmail() {
        if (this.email != null && !this.email.trim().isEmpty()) {
            return this.email;
        }
        if (this.recipient != null && this.recipient.contains("@")) {
            return this.recipient;
        }
        return null;
    }

    /**
     * Lấy nội dung thông báo chuẩn: Ưu tiên 'message', nếu trống lấy 'description'
     */
    public String getContent() {
        if (this.message != null && !this.message.trim().isEmpty()) {
            return this.message;
        }
        return this.description;
    }
}