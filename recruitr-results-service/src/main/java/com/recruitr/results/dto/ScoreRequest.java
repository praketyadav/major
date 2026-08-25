package com.recruitr.results.dto;

import lombok.Data;

@Data
public class ScoreRequest {
    private Long sessionId;
    private Long studentId;
    private Long roundId;
}
