package com.example.notification.repository;

import com.example.notification.entity.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends MongoRepository<Notification, String> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(String userId);
    // 🌟 THÊM DÒNG NÀY: Tự động dọn dẹp thông báo theo userId và Title
    void deleteByUserIdAndTitle(String userId, String title);

}
