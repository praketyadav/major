package com.recruitr.exam.dto;

import lombok.Data;

@Data
public class StartExamRequest {
    private Long studentId;
    private Long driveId;
    private Long roundId;
}
