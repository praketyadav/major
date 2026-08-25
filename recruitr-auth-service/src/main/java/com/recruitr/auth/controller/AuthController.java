package com.recruitr.auth.controller;

import com.recruitr.auth.dto.*;
import com.recruitr.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // PUBLIC - no token required (gateway allows through)
    @PostMapping("/auth/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    // Requires X-User-Role: SUPER_ADMIN or COLLEGE_ADMIN
    @PostMapping("/auth/register")
    public ResponseEntity<UserResponse> register(
            @Valid @RequestBody RegisterRequest request,
            @RequestHeader("X-User-Role") String callerRole) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(authService.register(request, callerRole));
    }

    // Requires X-User-Role: SUPER_ADMIN
    @GetMapping("/users/{id}")
    public ResponseEntity<UserResponse> getUserById(
            @PathVariable Long id,
            @RequestHeader("X-User-Role") String callerRole) {
        return ResponseEntity.ok(
                authService.getUserById(id, callerRole));
    }

    // Any authenticated user can call this
    @GetMapping("/users/me")
    public ResponseEntity<UserResponse> getMe(
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(
                authService.getMe(Long.parseLong(userId)));
    }

    // Requires X-User-Role: SUPER_ADMIN
    @PatchMapping("/users/{id}/deactivate")
    public ResponseEntity<UserResponse> deactivateUser(
            @PathVariable Long id,
            @RequestHeader("X-User-Role") String callerRole) {
        return ResponseEntity.ok(
                authService.deactivateUser(id, callerRole));
    }

    // Requires X-User-Role: SUPER_ADMIN
    @GetMapping("/users/analytics")
    public ResponseEntity<Map<String, Long>> getAnalytics(
            @RequestHeader("X-User-Role") String callerRole) {
        return ResponseEntity.ok(
                authService.getAnalytics(callerRole));
    }
}
