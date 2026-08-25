package com.recruitr.drive.dto;

import com.recruitr.drive.model.QuestionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class QuestionRequest {
    @NotBlank(message = "Question text is required")
    private String questionText;

    @NotNull(message = "Question type is required")
    private QuestionType questionType;

    private String optionA;
    private String optionB;
    private String optionC;
    private String optionD;
    private String correctOption;

    @NotNull(message = "Marks are required")
    private Double marks;

    private String tags;
}
