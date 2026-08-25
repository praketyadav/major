package com.recruitr.drive.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;
import java.util.List;

@Data
public class AssignQuestionsRequest {
    @NotEmpty(message = "Question IDs list cannot be empty")
    private List<Long> questionIds;
}
