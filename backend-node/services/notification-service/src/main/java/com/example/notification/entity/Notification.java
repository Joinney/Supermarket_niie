package com.example.notification.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "notifications")
public class Notification {

    @Id
    private String id;

    @Field("user_id")
    private String userId;

    private String title;
    
    private String description;

    @Field("created_at")
    private LocalDateTime createdAt;

    @Field("is_read")
    private boolean isRead;

    private Map<String, Object> metadata;

    /**
     * Viết đè thủ công phương thức Setter này để tương thích với cả 
     * hai cách viết setRead() (Lombok tự sinh) và setIsRead() (gọi thủ công trong Service).
     */
    public void setIsRead(boolean isRead) {
        this.isRead = isRead;
    }
}