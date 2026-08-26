package com.recruitr.enrollment.dto;

import com.recruitr.enrollment.model.EnrollmentStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateStatusRequest {
    @NotNull(message = "Status is required")
    private EnrollmentStatus status;
}
