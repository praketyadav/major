package com.recruitr.drive.dto;

import com.recruitr.drive.model.RoundStatus;
import lombok.Data;

@Data
public class RoundResponse {
    private Long id;
    private Long driveId;
    private Integer roundNumber;
    private String title;
    private Integer durationMinutes;
    private Double cutoffScore;
    private RoundStatus status;
}
