package com.recruitr.exam.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class StartExamResponse {
    private Long sessionId;
    private Long roundId;
    private Integer durationMinutes;
    private LocalDateTime startedAt;
    private List<QuestionDto> questions;
}
