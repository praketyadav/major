package com.recruitr.enrollment.service;

import com.recruitr.enrollment.dto.*;
import com.recruitr.enrollment.exception.*;
import com.recruitr.enrollment.model.*;
import com.recruitr.enrollment.repository.*;
import lombok.RequiredArgsConstructor;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EnrollmentService {

    private final DriveCollegeRepository driveCollegeRepository;
    private final StudentEnrollmentRepository
            studentEnrollmentRepository;
    private final RestTemplate restTemplate;

    @Value("${services.auth-url}")
    private String authUrl;

    @Value("${services.drive-url}")
    private String driveUrl;

    // ── Assign College to Drive ──────────────────────────

    public void assignCollegeToDrive(Long driveId,
            Long collegeId, String callerRole) {
        if (!"COMPANY_ADMIN".equals(callerRole)) {
            throw new AccessDeniedException(
                "Only Company Admin can assign colleges to drives");
        }
        if (driveCollegeRepository
                .findByDriveIdAndCollegeId(driveId, collegeId)
                .isPresent()) {
            throw new BadRequestException(
                "College is already assigned to this drive");
        }
        DriveCollege dc = new DriveCollege();
        dc.setDriveId(driveId);
        dc.setCollegeId(collegeId);
        driveCollegeRepository.save(dc);
    }

    // ── Enroll Single Student ────────────────────────────

    public EnrollmentResponse enrollStudent(
            EnrollStudentRequest request, String callerRole) {
        if (!"COLLEGE_ADMIN".equals(callerRole)
                && !"SUPER_ADMIN".equals(callerRole)) {
            throw new AccessDeniedException(
                "Only College Admin can enroll students");
        }
        if (studentEnrollmentRepository
                .existsByStudentIdAndRoundId(
                    request.getStudentId(),
                    request.getRoundId())) {
            throw new BadRequestException(
                "Student is already enrolled in this round");
        }
        StudentEnrollment enrollment = new StudentEnrollment();
        enrollment.setStudentId(request.getStudentId());
        enrollment.setDriveId(request.getDriveId());
        enrollment.setRoundId(request.getRoundId());
        enrollment.setStatus(EnrollmentStatus.ENROLLED);
        return mapToResponse(
                studentEnrollmentRepository.save(enrollment));
    }

    // ── CSV Bulk Enrollment ──────────────────────────────

    public BulkEnrollmentResponse bulkEnrollFromCsv(
            Long driveId, Long roundId,
            Long collegeId, MultipartFile file,
            String callerRole) {
        if (!"COLLEGE_ADMIN".equals(callerRole)) {
            throw new AccessDeniedException(
                "Only College Admin can bulk enroll students");
        }

        BulkEnrollmentResponse result = new BulkEnrollmentResponse();
        List<String> errors = new ArrayList<>();
        int success = 0;
        int failed = 0;

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(
                    file.getInputStream(),
                    StandardCharsets.UTF_8));
             CSVParser csvParser = new CSVParser(reader,
                CSVFormat.DEFAULT.builder()
                    .setHeader()
                    .setSkipHeaderRecord(true)
                    .setIgnoreHeaderCase(true)
                    .setTrim(true)
                    .build())) {

            int rowNum = 1;
            for (CSVRecord record : csvParser) {
                rowNum++;
                try {
                    String sapId = record.get("sapId");
                    String name  = record.get("name");
                    String email = record.get("email");
                    String branch = record.get("branch");

                    if (sapId == null || sapId.isBlank()
                            || name == null || name.isBlank()
                            || email == null || email.isBlank()
                            || branch == null || branch.isBlank()) {
                        errors.add("Row " + rowNum
                            + ": missing required fields");
                        failed++;
                        continue;
                    }

                    // Step 1: Register student via Auth Service
                    Map<String, Object> registerBody = Map.of(
                        "sapId",     sapId,
                        "name",      name,
                        "email",     email,
                        "password",  "Welcome@123",
                        "role",      "STUDENT",
                        "collegeId", collegeId
                    );

                    HttpHeaders headers = new HttpHeaders();
                    headers.setContentType(MediaType.APPLICATION_JSON);
                    headers.set("X-User-Role", "COLLEGE_ADMIN");
                    headers.set("X-User-Id",
                            collegeId.toString());

                    HttpEntity<Map<String, Object>> entity =
                            new HttpEntity<>(registerBody, headers);

                    Map<?, ?> authResponse = restTemplate.postForObject(
                        authUrl + "/api/v1/auth/register",
                        entity, Map.class);

                    if (authResponse == null
                            || authResponse.get("id") == null) {
                        errors.add("Row " + rowNum
                            + ": failed to create account for "
                            + email);
                        failed++;
                        continue;
                    }

                    Long studentId = Long.valueOf(
                        authResponse.get("id").toString());

                    // Step 2: Enroll student in the round
                    if (!studentEnrollmentRepository
                            .existsByStudentIdAndRoundId(
                                studentId, roundId)) {
                        StudentEnrollment enrollment =
                                new StudentEnrollment();
                        enrollment.setStudentId(studentId);
                        enrollment.setDriveId(driveId);
                        enrollment.setRoundId(roundId);
                        enrollment.setStatus(
                                EnrollmentStatus.ENROLLED);
                        studentEnrollmentRepository.save(enrollment);
                    }

                    success++;

                } catch (Exception e) {
                    errors.add("Row " + rowNum + ": "
                        + e.getMessage());
                    failed++;
                }
            }
        } catch (Exception e) {
            throw new BadRequestException(
                "Failed to parse CSV file: " + e.getMessage());
        }

        result.setSuccess(success);
        result.setFailed(failed);
        result.setErrors(errors);
        return result;
    }

    // ── Eligibility Check ────────────────────────────────

    public EligibilityResponse checkEligibility(
            Long studentId, Long roundId) {
        boolean exists = studentEnrollmentRepository
                .existsByStudentIdAndRoundId(studentId, roundId);
        if (!exists) {
            return new EligibilityResponse(false,
                "Student is not enrolled in this round");
        }
        StudentEnrollment enrollment =
                studentEnrollmentRepository
                .findByStudentIdAndRoundId(studentId, roundId)
                .get();

        if (enrollment.getStatus() == EnrollmentStatus.ELIMINATED) {
            return new EligibilityResponse(false,
                "Student has been eliminated from this round");
        }
        if (enrollment.getStatus() == EnrollmentStatus.COMPLETED) {
            return new EligibilityResponse(false,
                "Student has already completed this round");
        }
        return new EligibilityResponse(true, "Eligible");
    }

    // ── Get Enrolled Students for Drive ─────────────────

    public List<EnrollmentResponse> getEnrolledStudents(
            Long driveId, String callerRole) {
        if (!"COMPANY_ADMIN".equals(callerRole)
                && !"COLLEGE_ADMIN".equals(callerRole)
                && !"SUPER_ADMIN".equals(callerRole)) {
            throw new AccessDeniedException(
                "Access denied");
        }
        return studentEnrollmentRepository
                .findByDriveId(driveId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ── Update Enrollment Status ─────────────────────────

    public EnrollmentResponse updateEnrollmentStatus(
            Long enrollmentId,
            UpdateStatusRequest request) {
        StudentEnrollment enrollment =
                studentEnrollmentRepository
                .findById(enrollmentId)
                .orElseThrow(() ->
                    new ResourceNotFoundException(
                        "Enrollment not found: " + enrollmentId));
        enrollment.setStatus(request.getStatus());
        return mapToResponse(
                studentEnrollmentRepository.save(enrollment));
    }

    // ── Get Enrollments for Student ──────────────────────

    public List<EnrollmentResponse> getEnrollmentsForStudent(
            Long studentId) {
        return studentEnrollmentRepository
                .findByStudentId(studentId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ── Helper ───────────────────────────────────────────

    private EnrollmentResponse mapToResponse(
            StudentEnrollment e) {
        EnrollmentResponse r = new EnrollmentResponse();
        r.setId(e.getId());
        r.setStudentId(e.getStudentId());
        r.setDriveId(e.getDriveId());
        r.setRoundId(e.getRoundId());
        r.setStatus(e.getStatus());
        r.setEnrolledAt(e.getEnrolledAt());
        return r;
    }
}
