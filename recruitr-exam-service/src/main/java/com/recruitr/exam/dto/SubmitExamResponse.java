package com.recruitr.exam.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SubmitExamResponse {
    private String message;
    private LocalDateTime submittedAt;
    private Long sessionId;
}
