package com.recruitr.enrollment.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class EnrollStudentRequest {
    @NotNull(message = "Student ID is required")
    private Long studentId;

    @NotNull(message = "Drive ID is required")
    private Long driveId;

    @NotNull(message = "Round ID is required")
    private Long roundId;
}
