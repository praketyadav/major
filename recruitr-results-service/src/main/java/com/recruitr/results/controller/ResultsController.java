package com.recruitr.results.controller;

import com.recruitr.results.dto.*;
import com.recruitr.results.service.ResultsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ResultsController {

    private final ResultsService resultsService;

    // Called internally by Exam Engine after submission
    @PostMapping("/results/score")
    public ResponseEntity<ScoreResponse> scoreMcq(
            @RequestBody ScoreRequest request) {
        return ResponseEntity.ok(
                resultsService.scoreMcq(request));
    }

    // Get result for a specific student in a round
    @GetMapping("/results/student/{studentId}/round/{roundId}")
    public ResponseEntity<ResultResponse> getStudentResult(
            @PathVariable Long studentId,
            @PathVariable Long roundId) {
        return ResponseEntity.ok(
                resultsService.getResultForStudent(
                    studentId, roundId));
    }

    // Get all results for a round (COMPANY_ADMIN)
    @GetMapping("/results/round/{roundId}")
    public ResponseEntity<RoundResultSummary> getRoundResults(
            @PathVariable Long roundId,
            @RequestHeader("X-User-Role") String role) {
        return ResponseEntity.ok(
                resultsService.getResultsForRound(
                    roundId, role));
    }

    // Release result key for a round (COMPANY_ADMIN)
    @PostMapping("/results/round/{roundId}/release-key")
    public ResponseEntity<Void> releaseKey(
            @PathVariable Long roundId,
            @RequestHeader("X-User-Role") String role) {
        resultsService.releaseResultKey(roundId, role);
        return ResponseEntity.ok().build();
    }

    // Advance students after round closes (COMPANY_ADMIN)
    @PostMapping("/results/round/{roundId}/advance")
    public ResponseEntity<RoundResultSummary> advanceStudents(
            @PathVariable Long roundId,
            @RequestBody AdvanceRoundRequest request,
            @RequestHeader("X-User-Role") String role) {
        return ResponseEntity.ok(
                resultsService.advanceStudents(
                    roundId, request, role));
    }

    // Submit subjective review (COMPANY_ADMIN)
    @PostMapping("/results/{resultId}/subjective-review")
    public ResponseEntity<ResultResponse> reviewSubjective(
            @PathVariable Long resultId,
            @Valid @RequestBody SubjectiveReviewRequest request,
            @RequestHeader("X-User-Role") String role) {
        return ResponseEntity.ok(
                resultsService.reviewSubjective(
                    resultId, request, role));
    }

    // Get all notifications for a user
    @GetMapping("/notifications/{userId}")
    public ResponseEntity<List<NotificationResponse>>
            getNotifications(@PathVariable Long userId) {
        return ResponseEntity.ok(
                resultsService.getNotifications(userId));
    }

    // Mark notification as read
    @PatchMapping("/notifications/{notificationId}/read")
    public ResponseEntity<NotificationResponse>
            markRead(@PathVariable Long notificationId) {
        return ResponseEntity.ok(
                resultsService.markNotificationRead(
                    notificationId));
    }
}
