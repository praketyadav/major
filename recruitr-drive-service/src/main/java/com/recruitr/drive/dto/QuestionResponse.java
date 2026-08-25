package com.recruitr.drive.dto;

import com.recruitr.drive.model.QuestionType;
import lombok.Data;

@Data
public class QuestionResponse {
    private Long id;
    private Long companyId;
    private String questionText;
    private QuestionType questionType;
    private String optionA;
    private String optionB;
    private String optionC;
    private String optionD;
    private String correctOption;
    private Double marks;
    private String tags;
}
