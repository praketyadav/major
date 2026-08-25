package com.recruitr.drive.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DriveRequest {
    @NotBlank(message = "Title is required")
    private String title;
    private String description;
}
