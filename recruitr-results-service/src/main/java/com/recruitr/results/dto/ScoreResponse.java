package com.recruitr.results.dto;

import lombok.Data;

@Data
public class ScoreResponse {
    private Long resultId;
    private Double mcqScore;
    private String message;
}
