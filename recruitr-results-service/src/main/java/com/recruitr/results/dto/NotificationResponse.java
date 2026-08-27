package com.recruitr.results.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class NotificationResponse {
    private Long id;
    private Long userId;
    private String title;
    private String message;
    private boolean read;
    private LocalDateTime createdAt;
}
