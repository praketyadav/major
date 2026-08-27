package com.recruitr.exam.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class WarningRequest {
    @NotBlank(message = "Warning type is required")
    private String warningType;
}
