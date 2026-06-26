package com.example.notification.strategy;

import com.example.notification.dto.NotificationRequest;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender; // <--- KIỂM TRA KỸ DÒNG NÀY (phải có chữ .javamail)
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class EmailNotificationStrategy implements NotificationStrategy {

    private final JavaMailSender mailSender; // <--- Không có chữ @ hay ký tự lạ nào ở đầu

    @Override
    public void send(NotificationRequest request) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(request.getRecipient());
        message.setSubject(request.getTitle());
        message.setText(request.getMessage());
        
        mailSender.send(message);
        System.out.println("-> [Email] Đã gửi mail thành công tới: " + request.getRecipient());
    }

    @Override
    public boolean supports(String channel) {
        return "email".equalsIgnoreCase(channel);
    }
}