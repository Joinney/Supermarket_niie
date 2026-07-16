package com.example.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class NotificationResponse {
    private String id;
    private String title;
    private String description;
    private String time;
}
