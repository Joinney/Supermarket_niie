package com.example.notification.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    @Value("${notification.rabbitmq.exchange}")
    private String exchange;

    // --- CẤU HÌNH CHO EMAIL ---
    @Value("${notification.rabbitmq.queue.email}")
    private String emailQueue;

    @Value("${notification.rabbitmq.routing.email}")
    private String emailRoutingKey;

    // --- CẤU HÌNH CHO ĐĂNG NHẬP (REAL-TIME) ---
    @Value("${notification.rabbitmq.queue.login}")
    private String loginQueue;

    // Định nghĩa Routing Key cho sự kiện đăng nhập
    private final String loginRoutingKey = "login.notification.routing";

    /**
     * Khai báo Topic Exchange dùng chung cho toàn bộ hệ thống thông báo
     */
    @Bean
    public TopicExchange notificationExchange() {
        return new TopicExchange(exchange);
    }

    /**
     * Khai báo Queue xử lý gửi Email
     */
    @Bean
    public Queue emailQueue() {
        return new Queue(emailQueue, true);
    }

    /**
     * Khai báo Queue xử lý thông báo đăng nhập (Đẩy qua WebSocket)
     */
    @Bean
    public Queue loginQueue() {
        return new Queue(loginQueue, true);
    }

    /**
     * Binding kết nối Email Queue với Exchange thông qua Email Routing Key
     */
    @Bean
    public Binding bindingEmail() {
        return BindingBuilder.bind(emailQueue())
                .to(notificationExchange())
                .with(emailRoutingKey);
    }

    /**
     * Binding kết nối Login Queue với Exchange thông qua Login Routing Key
     */
    @Bean
    public Binding bindingLogin() {
        return BindingBuilder.bind(loginQueue())
                .to(notificationExchange())
                .with(loginRoutingKey);
    }

    /**
     * Giúp tự động chuyển đổi Object Java sang JSON khi gửi qua RabbitMQ và ngược lại
     */
    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}