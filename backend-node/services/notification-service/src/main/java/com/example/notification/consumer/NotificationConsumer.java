package com.example.notification.consumer;

import com.example.notification.dto.NotificationRequest;
import com.example.notification.strategy.NotificationStrategy;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;
import java.util.List;

@Component
@RequiredArgsConstructor
public class NotificationConsumer {

    private final List<NotificationStrategy> strategies;

    @RabbitListener(queues = "${notification.rabbitmq.queue.email}")
    public void consumeNotification(NotificationRequest request) {
        System.out.println("-> [RabbitMQ] Nhận yêu cầu từ hàng đợi cho: " + request.getRecipient());
        
        NotificationStrategy strategy = strategies.stream()
                .filter(s -> s.supports(request.getChannel()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bộ xử lý cho: " + request.getChannel()));
        
        strategy.send(request);
    }
}