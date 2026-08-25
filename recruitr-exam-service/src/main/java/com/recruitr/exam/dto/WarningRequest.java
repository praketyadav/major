package com.recruitr.exam.dto;

import lombok.Data;

@Data
public class WarningRequest {
    private String warningType; // TAB_SWITCH or FULLSCREEN_EXIT
}
