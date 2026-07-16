package com.example.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationRequest implements Serializable {
    private static final long serialVersionUID = 1L;
    
    private String channel; // "email", "sms"
    private String recipient;
    private String title;
    private String message;
}