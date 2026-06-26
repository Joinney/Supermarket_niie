package com.example.notification.dto;

import lombok.Data;
import java.io.Serializable;

@Data
public class NotificationRequest implements Serializable {
    private static final long serialVersionUID = 1L;
    
    private String channel; // "email", "sms"
    private String recipient;
    private String title;
    private String message;
}