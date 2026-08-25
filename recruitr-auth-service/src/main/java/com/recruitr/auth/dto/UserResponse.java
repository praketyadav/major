package com.recruitr.auth.dto;

import com.recruitr.auth.model.Role;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UserResponse {
    private Long id;
    private String sapId;
    private String name;
    private String email;
    private Role role;
    private Long collegeId;
    private Long companyId;
    private boolean active;
    private LocalDateTime createdAt;
}
