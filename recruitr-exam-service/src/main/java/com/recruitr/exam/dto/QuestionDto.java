package com.recruitr.exam.dto;

import lombok.Data;

@Data
public class QuestionDto {
    private Long id;
    private String questionText;
    private String questionType;
    private String optionA;
    private String optionB;
    private String optionC;
    private String optionD;
    private Double marks;
    private String tags;
    // NO correctOption field here — intentional
}
