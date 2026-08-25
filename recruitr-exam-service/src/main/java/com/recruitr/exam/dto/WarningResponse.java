package com.recruitr.exam.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarningResponse {
    private Integer warningCount;
    private boolean autoSubmitted;
}
