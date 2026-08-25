package com.recruitr.enrollment.service;

import com.recruitr.enrollment.dto.BulkUploadResponse;
import com.recruitr.enrollment.dto.EnrollStudentRequest;
import com.recruitr.enrollment.model.DriveCollege;
import com.recruitr.enrollment.model.EnrollmentStatus;
import com.recruitr.enrollment.model.StudentEnrollment;
import com.recruitr.enrollment.repository.DriveCollegeRepository;
import com.recruitr.enrollment.repository.StudentEnrollmentRepository;
import lombok.RequiredArgsConstructor;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStreamReader;
import java.io.Reader;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class EnrollmentService {

    private final DriveCollegeRepository driveCollegeRepository;
    private final StudentEnrollmentRepository studentEnrollmentRepository;
    private final RestTemplate restTemplate;

    public DriveCollege assignCollegeToDrive(Long driveId, Long collegeId) {
        DriveCollege driveCollege = DriveCollege.builder()
                .driveId(driveId)
                .collegeId(collegeId)
                .build();
        return driveCollegeRepository.save(driveCollege);
    }

    public StudentEnrollment enrollStudent(EnrollStudentRequest request) {
        StudentEnrollment enrollment = StudentEnrollment.builder()
                .studentId(request.getStudentId())
                .driveId(request.getDriveId())
                .roundId(request.getRoundId())
                .status(EnrollmentStatus.ENROLLED)
                .build();
        return studentEnrollmentRepository.save(enrollment);
    }

    public BulkUploadResponse bulkEnroll(Long driveId, Long roundId, MultipartFile file, Long collegeId) {
        int success = 0;
        int failed = 0;
        List<String> errors = new ArrayList<>();

        try {
            Reader reader = new InputStreamReader(file.getInputStream());
            CSVParser parser = CSVFormat.DEFAULT
                    .withFirstRecordAsHeader()
                    .withIgnoreHeaderCase()
                    .withTrim()
                    .parse(reader);

            for (CSVRecord record : parser) {
                try {
                    String sapId = record.get("sapId");
                    String name = record.get("name");
                    String email = record.get("email");
                    String branch = record.get("branch");

                    // Call Auth Service to register the student
                    Map<String, Object> registerRequest = Map.of(
                            "sapId", sapId,
                            "name", name,
                            "email", email,
                            "password", sapId, // default password = sapId
                            "role", "STUDENT",
                            "collegeId", collegeId
                    );

                    HttpHeaders headers = new HttpHeaders();
                    headers.setContentType(MediaType.APPLICATION_JSON);
                    HttpEntity<Map<String, Object>> entity = new HttpEntity<>(registerRequest, headers);

                    ResponseEntity<Map> response = restTemplate.exchange(
                            "http://localhost:8081/api/v1/auth/register",
                            HttpMethod.POST,
                            entity,
                            Map.class
                    );

                    if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                        Long studentId = Long.valueOf(response.getBody().get("id").toString());

                        // Enroll the student
                        StudentEnrollment enrollment = StudentEnrollment.builder()
                                .studentId(studentId)
                                .driveId(driveId)
                                .roundId(roundId)
                                .status(EnrollmentStatus.ENROLLED)
                                .build();
                        studentEnrollmentRepository.save(enrollment);
                        success++;
                    }
                } catch (Exception e) {
                    failed++;
                    errors.add("Row " + record.getRecordNumber() + ": " + e.getMessage());
                }
            }
        } catch (Exception e) {
            errors.add("Failed to parse CSV: " + e.getMessage());
        }

        return BulkUploadResponse.builder()
                .success(success)
                .failed(failed)
                .errors(errors)
                .build();
    }

    public boolean checkEligibility(Long studentId, Long roundId) {
        return studentEnrollmentRepository.existsByStudentIdAndRoundIdAndStatusIn(
                studentId, roundId,
                List.of(EnrollmentStatus.ENROLLED, EnrollmentStatus.ADVANCED)
        );
    }

    public List<StudentEnrollment> getEnrolledStudents(Long driveId) {
        return studentEnrollmentRepository.findByDriveId(driveId);
    }

    public StudentEnrollment updateStatus(Long enrollmentId, String status) {
        StudentEnrollment enrollment = studentEnrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new RuntimeException("Enrollment not found with id: " + enrollmentId));
        enrollment.setStatus(EnrollmentStatus.valueOf(status));
        return studentEnrollmentRepository.save(enrollment);
    }
}
