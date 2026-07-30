package com.example.notification.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    /**
     * @Async giúp gửi email bất đồng bộ, không làm nghẽn/chậm luồng xử lý chính
     */
    @Async
    public void sendHtmlEmail(String toEmail, String subject, String title, String content) {
        if (toEmail == null || toEmail.trim().isEmpty()) {
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject(subject);

            // Mẫu HTML Email thiết kế đẹp mắt theo tone Demi Mart (#006c49)
            String htmlTemplate = """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; }
                        .container { max-width: 550px; background: #ffffff; border-radius: 16px; overflow: hidden; margin: auto; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
                        .header { background-color: #006c49; color: #ffffff; padding: 24px; text-align: center; }
                        .header h1 { margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 1px; }
                        .body { padding: 30px; color: #333333; line-height: 1.6; }
                        .title { font-size: 16px; font-weight: bold; color: #006c49; margin-bottom: 12px; }
                        .footer { background-color: #f8fafc; text-align: center; padding: 15px; font-size: 12px; color: #888888; border-top: 1px solid #edf2f7; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Demi Mart Notification</h1>
                        </div>
                        <div class="body">
                            <div class="title">%s</div>
                            <p>%s</p>
                        </div>
                        <div class="footer">
                            <p>© 2026 Demi Mart. Mọi quyền được bảo lưu.</p>
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(title, content);

            helper.setText(htmlTemplate, true);
            mailSender.send(message);
            System.out.println("✅ Đã gửi email thành công tới: " + toEmail);

        } catch (MessagingException e) {
            System.err.println("❌ Lỗi khi gửi email tới " + toEmail + ": " + e.getMessage());
        }
    }
}