package com.example.notification.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker // Annotation cực kỳ quan trọng để kích hoạt SimpMessagingTemplate
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Kích hoạt một Simple Broker để đẩy tin nhắn về client (React) qua tiền tố /topic
        config.enableSimpleBroker("/topic");
        
        // Tiền tố cho các request gửi từ Client lên Server (nếu có)
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Định nghĩa Endpoint kết nối WebSocket, cho phép React kết nối qua SockJS
        registry.addEndpoint("/ws-notification")
                .setAllowedOriginPatterns("*") // Cho phép Front-end ở port khác (ví dụ: 3000, 5173) truy cập
                .withSockJS();
    }
}