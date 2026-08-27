package com.recruitr.exam.controller;

import com.recruitr.exam.dto.*;
import com.recruitr.exam.model.ExamSession;
import com.recruitr.exam.model.Response;
import com.recruitr.exam.service.ExamService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ExamController {

    private final ExamService examService;

    // Start exam — called by student
    @PostMapping("/exam/start")
    public ResponseEntity<StartExamResponse> startExam(
            @Valid @RequestBody StartExamRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(examService.startExam(request));
    }

    // Record a warning event
    @PostMapping("/exam/session/{sessionId}/warning")
    public ResponseEntity<WarningResponse> processWarning(
            @PathVariable Long sessionId,
            @Valid @RequestBody WarningRequest request) {
        return ResponseEntity.ok(
                examService.processWarning(sessionId, request));
    }

    // Submit exam
    @PostMapping("/exam/session/{sessionId}/submit")
    public ResponseEntity<SubmitExamResponse> submitExam(
            @PathVariable Long sessionId,
            @RequestBody SubmitExamRequest request) {
        return ResponseEntity.ok(
                examService.submitExam(sessionId, request));
    }

    // Get session details
    @GetMapping("/session/{sessionId}")
    public ResponseEntity<ExamSession> getSession(
            @PathVariable Long sessionId) {
        return ResponseEntity.ok(
                examService.getSession(sessionId));
    }

    // Get responses for a session
    // (called internally by Results Service)
    @GetMapping("/session/{sessionId}/responses")
    public ResponseEntity<List<Response>> getResponses(
            @PathVariable Long sessionId) {
        return ResponseEntity.ok(
                examService.getResponsesForSession(sessionId));
    }
}
