package com.recruitr.results.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ResultResponse {
    private Long id;
    private Long studentId;
    private Long roundId;
    private Long sessionId;
    private Double mcqScore;
    private Double subjectiveScore;
    private Double totalScore;
    private Double percentile;
    private boolean subjectiveReviewed;
    private boolean resultKeyReleased;
    private LocalDateTime createdAt;
}
