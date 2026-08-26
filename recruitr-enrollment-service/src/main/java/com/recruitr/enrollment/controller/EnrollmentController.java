package com.recruitr.enrollment.controller;

import com.recruitr.enrollment.dto.*;
import com.recruitr.enrollment.service.EnrollmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    // Assign college to drive (COMPANY_ADMIN)
    @PostMapping("/enrollment/drive/{driveId}/college/{collegeId}")
    public ResponseEntity<Void> assignCollege(
            @PathVariable Long driveId,
            @PathVariable Long collegeId,
            @RequestHeader("X-User-Role") String role) {
        enrollmentService.assignCollegeToDrive(
                driveId, collegeId, role);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    // Enroll single student (COLLEGE_ADMIN)
    @PostMapping("/enrollment/drive/{driveId}/students")
    public ResponseEntity<EnrollmentResponse> enrollStudent(
            @PathVariable Long driveId,
            @Valid @RequestBody EnrollStudentRequest request,
            @RequestHeader("X-User-Role") String role) {
        request.setDriveId(driveId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(enrollmentService.enrollStudent(
                    request, role));
    }

    // CSV bulk upload (COLLEGE_ADMIN)
    @PostMapping(
        value = "/enrollment/drive/{driveId}/students/bulk",
        consumes = "multipart/form-data")
    public ResponseEntity<BulkEnrollmentResponse> bulkEnroll(
            @PathVariable Long driveId,
            @RequestParam("roundId") Long roundId,
            @RequestParam("file") MultipartFile file,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String role) {
        return ResponseEntity.ok(
                enrollmentService.bulkEnrollFromCsv(
                    driveId, roundId,
                    Long.parseLong(userId), file, role));
    }

    // Check eligibility (internal — called by Exam Service)
    @GetMapping("/eligibility/check")
    public ResponseEntity<EligibilityResponse> checkEligibility(
            @RequestParam Long studentId,
            @RequestParam Long roundId) {
        return ResponseEntity.ok(
                enrollmentService.checkEligibility(
                    studentId, roundId));
    }

    // Get all enrolled students for a drive
    @GetMapping("/enrollment/drive/{driveId}/students")
    public ResponseEntity<List<EnrollmentResponse>>
            getEnrolledStudents(
            @PathVariable Long driveId,
            @RequestHeader("X-User-Role") String role) {
        return ResponseEntity.ok(
                enrollmentService.getEnrolledStudents(
                    driveId, role));
    }

    // Update enrollment status (called by Results Service)
    @PatchMapping("/enrollment/{enrollmentId}/status")
    public ResponseEntity<EnrollmentResponse> updateStatus(
            @PathVariable Long enrollmentId,
            @Valid @RequestBody UpdateStatusRequest request) {
        return ResponseEntity.ok(
                enrollmentService.updateEnrollmentStatus(
                    enrollmentId, request));
    }

    // Get all enrollments for a student
    @GetMapping("/enrollment/student/{studentId}")
    public ResponseEntity<List<EnrollmentResponse>>
            getStudentEnrollments(
            @PathVariable Long studentId) {
        return ResponseEntity.ok(
                enrollmentService.getEnrollmentsForStudent(
                    studentId));
    }
}
