package com.recruitr.drive.dto;

import com.recruitr.drive.model.DriveStatus;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class DriveResponse {
    private Long id;
    private String title;
    private String description;
    private Long companyId;
    private DriveStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
