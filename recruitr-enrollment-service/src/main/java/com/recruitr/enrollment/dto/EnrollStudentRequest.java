package com.recruitr.enrollment.dto;

import lombok.Data;

@Data
public class EnrollStudentRequest {
    private Long studentId;
    private Long driveId;
    private Long roundId;
}
