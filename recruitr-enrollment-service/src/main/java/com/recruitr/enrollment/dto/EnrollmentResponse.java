package com.recruitr.enrollment.dto;

import com.recruitr.enrollment.model.EnrollmentStatus;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class EnrollmentResponse {
    private Long id;
    private Long studentId;
    private Long driveId;
    private Long roundId;
    private EnrollmentStatus status;
    private LocalDateTime enrolledAt;
}
