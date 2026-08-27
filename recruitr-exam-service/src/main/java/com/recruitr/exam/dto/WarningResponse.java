package com.recruitr.exam.dto;

import lombok.Data;

@Data
public class WarningResponse {
    private Long sessionId;
    private int totalWarnings;
    private boolean autoSubmitted;
    private String message;
}
