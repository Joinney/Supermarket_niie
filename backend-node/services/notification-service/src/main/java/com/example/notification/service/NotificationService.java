package com.example.notification.service;

import com.example.notification.dto.NotificationRequest;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final RabbitTemplate rabbitTemplate;

    @Value("${notification.rabbitmq.exchange}")
    private String exchange;

    @Value("${notification.rabbitmq.routing.email}")
    private String emailRoutingKey;

    public void queueNotification(NotificationRequest request) {
        if ("email".equalsIgnoreCase(request.getChannel())) {
            System.out.println("-> Đang xếp hàng đợi gửi email cho: " + request.getRecipient());
            rabbitTemplate.convertAndSend(exchange, emailRoutingKey, request);
        } else {
            throw new IllegalArgumentException("Kênh này chưa được cấu hình queue: " + request.getChannel());
        }
    }
}