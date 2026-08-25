package com.recruitr.results.controller;

import com.recruitr.results.dto.*;
import com.recruitr.results.model.Notification;
import com.recruitr.results.model.Result;
import com.recruitr.results.service.ResultsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ResultsController {

    private final ResultsService resultsService;

    @PostMapping("/results/score")
    public ResponseEntity<ScoreResponse> calculateScore(@RequestBody ScoreRequest request) {
        return ResponseEntity.ok(resultsService.calculateScore(request));
    }

    @GetMapping("/results/student/{studentId}/round/{roundId}")
    public ResponseEntity<Result> getStudentResult(
            @PathVariable Long studentId,
            @PathVariable Long roundId) {
        return ResponseEntity.ok(resultsService.getStudentResult(studentId, roundId));
    }

    @GetMapping("/results/round/{roundId}")
    public ResponseEntity<List<Result>> getRoundResults(
            @PathVariable Long roundId,
            @RequestHeader("X-User-Role") String role) {
        if (!"COMPANY_ADMIN".equals(role)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(resultsService.getRoundResults(roundId));
    }

    @PostMapping("/results/round/{roundId}/release-key")
    public ResponseEntity<String> releaseKey(
            @PathVariable Long roundId,
            @RequestHeader("X-User-Role") String role) {
        if (!"COMPANY_ADMIN".equals(role)) {
            return ResponseEntity.status(403).build();
        }
        resultsService.releaseResultKey(roundId);
        return ResponseEntity.ok("Result key released successfully");
    }

    @PostMapping("/results/round/{roundId}/advance")
    public ResponseEntity<String> advanceRound(
            @PathVariable Long roundId,
            @RequestHeader("X-User-Role") String role) {
        if (!"COMPANY_ADMIN".equals(role)) {
            return ResponseEntity.status(403).build();
        }
        resultsService.advanceStudents(roundId);
        return ResponseEntity.ok("Students evaluated and advanced successfully");
    }

    @PostMapping("/results/{resultId}/subjective-review")
    public ResponseEntity<Result> reviewSubjective(
            @PathVariable Long resultId,
            @RequestBody SubjectiveReviewRequest request,
            @RequestHeader("X-User-Role") String role) {
        if (!"COMPANY_ADMIN".equals(role)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(resultsService.reviewSubjective(resultId, request));
    }

    @GetMapping("/notifications/{userId}")
    public ResponseEntity<List<Notification>> getNotifications(@PathVariable Long userId) {
        return ResponseEntity.ok(resultsService.getUserNotifications(userId));
    }

    @PatchMapping("/notifications/{notificationId}/read")
    public ResponseEntity<Notification> markRead(@PathVariable Long notificationId) {
        return ResponseEntity.ok(resultsService.markNotificationRead(notificationId));
    }
}
