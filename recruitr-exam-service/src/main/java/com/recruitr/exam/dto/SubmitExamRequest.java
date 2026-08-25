package com.recruitr.exam.dto;

import lombok.Data;
import java.util.List;

@Data
public class SubmitExamRequest {
    private List<SingleResponseDto> responses;

    @Data
    public static class SingleResponseDto {
        private Long questionId;
        private String selectedOption;
        private String subjectiveAnswer;
    }
}
