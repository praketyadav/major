package com.recruitr.drive.controller;

import com.recruitr.drive.dto.*;
import com.recruitr.drive.service.QuestionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/questions")
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionService questionService;

    @PostMapping
    public ResponseEntity<QuestionResponse> createQuestion(
            @Valid @RequestBody QuestionRequest request,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String role) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(questionService.createQuestion(
                    request, Long.parseLong(userId), role));
    }

    @GetMapping
    public ResponseEntity<List<QuestionResponse>> getQuestions(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String role) {
        return ResponseEntity.ok(
                questionService.getQuestionsForCompany(
                    Long.parseLong(userId), role));
    }

    @PutMapping("/{id}")
    public ResponseEntity<QuestionResponse> updateQuestion(
            @PathVariable Long id,
            @Valid @RequestBody QuestionRequest request,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String role) {
        return ResponseEntity.ok(questionService.updateQuestion(
                id, request, Long.parseLong(userId), role));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuestion(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String role) {
        questionService.deleteQuestion(
                id, Long.parseLong(userId), role);
        return ResponseEntity.noContent().build();
    }
}
