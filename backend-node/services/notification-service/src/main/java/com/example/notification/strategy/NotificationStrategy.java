package com.example.notification.strategy;

import com.example.notification.dto.NotificationRequest;

public interface NotificationStrategy {
    void send(NotificationRequest request);
    boolean supports(String channel);
}