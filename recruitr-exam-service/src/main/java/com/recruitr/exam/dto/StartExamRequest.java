package com.recruitr.exam.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class StartExamRequest {
    @NotNull(message = "Student ID is required")
    private Long studentId;

    @NotNull(message = "Round ID is required")
    private Long roundId;
}
