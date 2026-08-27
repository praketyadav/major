package com.recruitr.exam.dto;

import lombok.Data;
import java.util.List;

@Data
public class SubmitExamRequest {
    private List<StudentResponseDto> responses;
}
