package com.recruitr.results.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SubjectiveReviewRequest {
    @NotNull(message = "Question ID is required")
    private Long questionId;

    @NotNull(message = "Marks awarded is required")
    private Double marksAwarded;

    @NotNull(message = "Reviewer ID is required")
    private Long reviewedBy;
}
