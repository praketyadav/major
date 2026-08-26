package com.recruitr.enrollment.dto;

import lombok.Data;
import java.util.List;

@Data
public class BulkEnrollmentResponse {
    private int success;
    private int failed;
    private List<String> errors;
}
