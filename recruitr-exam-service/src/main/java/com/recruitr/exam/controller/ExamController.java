package com.recruitr.exam.controller;

import com.recruitr.exam.dto.*;
import com.recruitr.exam.model.ExamSession;
import com.recruitr.exam.model.Response;
import com.recruitr.exam.service.ExamService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ExamController {

    private final ExamService examService;

    @PostMapping("/exam/start")
    public ResponseEntity<StartExamResponse> startExam(@RequestBody StartExamRequest request) {
        return ResponseEntity.ok(examService.startExam(request));
    }

    @PostMapping("/exam/session/{sessionId}/warning")
    public ResponseEntity<WarningResponse> issueWarning(
            @PathVariable Long sessionId,
            @RequestBody WarningRequest request) {
        return ResponseEntity.ok(examService.issueWarning(sessionId, request));
    }

    @PostMapping("/exam/session/{sessionId}/submit")
    public ResponseEntity<SubmitExamResponse> submitExam(
            @PathVariable Long sessionId,
            @RequestBody SubmitExamRequest request) {
        return ResponseEntity.ok(examService.submitExam(sessionId, request));
    }

    @GetMapping("/session/{sessionId}")
    public ResponseEntity<ExamSession> getSession(@PathVariable Long sessionId) {
        return ResponseEntity.ok(examService.getSession(sessionId));
    }

    // Endpoint for Results Service to fetch responses
    @GetMapping("/session/{sessionId}/responses")
    public ResponseEntity<List<Response>> getResponses(@PathVariable Long sessionId) {
        return ResponseEntity.ok(examService.getResponsesForSession(sessionId));
    }
}
