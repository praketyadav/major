package com.recruitr.exam.dto;

import lombok.Data;

@Data
public class StudentResponseDto {
    private Long questionId;
    private String selectedOption;
    private String subjectiveAnswer;
}
