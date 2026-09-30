package com.recruitr.drive.controller;

import com.recruitr.drive.dto.*;
import com.recruitr.drive.service.DriveService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class DriveController {

    private final DriveService driveService;

    @PostMapping("/drives")
    public ResponseEntity<DriveResponse> createDrive(
            @Valid @RequestBody DriveRequest request,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String role) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(driveService.createDrive(
                    request, Long.parseLong(userId), role));
    }

    @GetMapping({"/drives", "/drives/company"})
    public ResponseEntity<List<DriveResponse>> getDrives(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String role) {
        return ResponseEntity.ok(
                driveService.getDrivesForCompany(
                    Long.parseLong(userId), role));
    }

    @GetMapping("/drives/{id}")
    public ResponseEntity<DriveResponse> getDriveById(
            @PathVariable Long id) {
        return ResponseEntity.ok(driveService.getDriveById(id));
    }

    @PatchMapping("/drives/{id}/publish")
    public ResponseEntity<DriveResponse> publishDrive(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String role) {
        return ResponseEntity.ok(driveService.publishDrive(
                id, Long.parseLong(userId), role));
    }

    @PatchMapping("/drives/{id}/close")
    public ResponseEntity<DriveResponse> closeDrive(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String role) {
        return ResponseEntity.ok(driveService.closeDrive(
                id, Long.parseLong(userId), role));
    }

    @DeleteMapping("/drives/{id}")
    public ResponseEntity<Void> deleteDrive(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String role) {
        driveService.deleteDrive(
                id, Long.parseLong(userId), role);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/drives/{driveId}/rounds")
    public ResponseEntity<RoundResponse> addRound(
            @PathVariable Long driveId,
            @Valid @RequestBody RoundRequest request,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String role) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(driveService.addRound(
                    driveId, request,
                    Long.parseLong(userId), role));
    }

    @GetMapping("/drives/{driveId}/rounds")
    public ResponseEntity<List<RoundResponse>> getRounds(
            @PathVariable Long driveId) {
        return ResponseEntity.ok(
                driveService.getRoundsForDrive(driveId));
    }

    @PatchMapping("/drives/{driveId}/rounds/{roundId}/activate")
    public ResponseEntity<RoundResponse> activateRound(
            @PathVariable Long driveId,
            @PathVariable Long roundId,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String role) {
        return ResponseEntity.ok(driveService.activateRound(
                driveId, roundId,
                Long.parseLong(userId), role));
    }

    @PostMapping(
        "/drives/{driveId}/rounds/{roundId}/questions")
    public ResponseEntity<List<QuestionResponse>>
            assignQuestions(
            @PathVariable Long driveId,
            @PathVariable Long roundId,
            @Valid @RequestBody AssignQuestionsRequest request,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String role) {
        return ResponseEntity.ok(
                driveService.assignQuestionsToRound(
                    driveId, roundId, request,
                    Long.parseLong(userId), role));
    }

    @GetMapping(
        "/drives/{driveId}/rounds/{roundId}/questions")
    public ResponseEntity<List<QuestionResponse>>
            getQuestionsForRound(
            @PathVariable Long driveId,
            @PathVariable Long roundId) {
        return ResponseEntity.ok(
                driveService.getQuestionsForRound(roundId));
    }

    @GetMapping("/drives/count/active")
    public ResponseEntity<Map<String, Long>> countActiveDrives() {
        return ResponseEntity.ok(
                Map.of("activeDrives",
                    driveService.countActiveDrives()));
    }

    @GetMapping("/drives/{driveId}/rounds/{roundId}")
    public ResponseEntity<RoundResponse> getRoundById(
            @PathVariable Long driveId,
            @PathVariable Long roundId) {
        return ResponseEntity.ok(
                driveService.getRoundById(roundId));
    }
}
