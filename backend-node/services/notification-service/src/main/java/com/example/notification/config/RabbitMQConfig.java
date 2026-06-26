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

    @Value("${notification.rabbitmq.queue.email}")
    private String emailQueue;

    @Value("${notification.rabbitmq.routing.email}")
    private String emailRoutingKey;

    @Bean
    public TopicExchange notificationExchange() {
        return new TopicExchange(exchange);
    }

    @Bean
    public Queue emailQueue() {
        return new Queue(emailQueue, true);
    }

    @Bean
    public Binding bindingEmail() {
        return BindingBuilder.bind(emailQueue()).to(notificationExchange()).with(emailRoutingKey);
    }

    // Giúp tự động chuyển đổi Object Java sang JSON khi gửi qua RabbitMQ và ngược lại
    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}