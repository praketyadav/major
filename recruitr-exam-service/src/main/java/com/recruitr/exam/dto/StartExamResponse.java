package com.recruitr.exam.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StartExamResponse {
    private Long sessionId;
    private List<Map<String, Object>> questions;
    private Integer durationMinutes;
    private LocalDateTime startedAt;
}
