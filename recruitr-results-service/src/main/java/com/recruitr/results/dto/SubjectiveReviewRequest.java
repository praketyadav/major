package com.recruitr.results.dto;

import lombok.Data;

@Data
public class SubjectiveReviewRequest {
    private Long questionId;
    private Double marksAwarded;
    private Long reviewedBy;
}
