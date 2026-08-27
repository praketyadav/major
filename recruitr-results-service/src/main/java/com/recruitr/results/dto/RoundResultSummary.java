package com.recruitr.results.dto;

import lombok.Data;
import java.util.List;

@Data
public class RoundResultSummary {
    private Long roundId;
    private int totalAttempted;
    private Double averageScore;
    private int advanced;
    private int eliminated;
    private List<ResultResponse> results;
}
