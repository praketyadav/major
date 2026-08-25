package com.recruitr.enrollment.controller;

import com.recruitr.enrollment.dto.*;
import com.recruitr.enrollment.model.DriveCollege;
import com.recruitr.enrollment.model.StudentEnrollment;
import com.recruitr.enrollment.service.EnrollmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    @PostMapping("/enrollment/drive/{driveId}/college/{collegeId}")
    public ResponseEntity<DriveCollege> assignCollege(
            @PathVariable Long driveId,
            @PathVariable Long collegeId,
            @RequestHeader("X-User-Role") String role) {
        if (!"COMPANY_ADMIN".equals(role)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.status(201).body(enrollmentService.assignCollegeToDrive(driveId, collegeId));
    }

    @PostMapping("/enrollment/drive/{driveId}/students")
    public ResponseEntity<StudentEnrollment> enrollStudent(
            @PathVariable Long driveId,
            @RequestBody EnrollStudentRequest request,
            @RequestHeader("X-User-Role") String role) {
        if (!"COLLEGE_ADMIN".equals(role)) {
            return ResponseEntity.status(403).build();
        }
        request.setDriveId(driveId);
        return ResponseEntity.status(201).body(enrollmentService.enrollStudent(request));
    }

    @PostMapping("/enrollment/drive/{driveId}/students/bulk")
    public ResponseEntity<BulkUploadResponse> bulkEnroll(
            @PathVariable Long driveId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "roundId") Long roundId,
            @RequestHeader("X-User-Id") Long userId) {
        BulkUploadResponse response = enrollmentService.bulkEnroll(driveId, roundId, file, userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/eligibility/check")
    public ResponseEntity<EligibilityResponse> checkEligibility(
            @RequestParam Long studentId,
            @RequestParam Long roundId) {
        boolean eligible = enrollmentService.checkEligibility(studentId, roundId);
        return ResponseEntity.ok(EligibilityResponse.builder().eligible(eligible).build());
    }

    @GetMapping("/enrollment/drive/{driveId}/students")
    public ResponseEntity<List<StudentEnrollment>> getEnrolledStudents(
            @PathVariable Long driveId) {
        return ResponseEntity.ok(enrollmentService.getEnrolledStudents(driveId));
    }

    @PatchMapping("/enrollment/{enrollmentId}/status")
    public ResponseEntity<StudentEnrollment> updateStatus(
            @PathVariable Long enrollmentId,
            @RequestBody UpdateStatusRequest request) {
        return ResponseEntity.ok(enrollmentService.updateStatus(enrollmentId, request.getStatus()));
    }
}
