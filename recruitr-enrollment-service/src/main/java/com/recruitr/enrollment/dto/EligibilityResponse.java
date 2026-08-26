package com.recruitr.enrollment.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class EligibilityResponse {
    private boolean eligible;
    private String reason;
}
