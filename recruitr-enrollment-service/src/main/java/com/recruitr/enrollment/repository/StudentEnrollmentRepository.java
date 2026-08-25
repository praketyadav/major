package com.recruitr.enrollment.repository;

import com.recruitr.enrollment.model.EnrollmentStatus;
import com.recruitr.enrollment.model.StudentEnrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentEnrollmentRepository extends JpaRepository<StudentEnrollment, Long> {
    List<StudentEnrollment> findByDriveId(Long driveId);
    Optional<StudentEnrollment> findByStudentIdAndRoundId(Long studentId, Long roundId);
    boolean existsByStudentIdAndRoundIdAndStatusIn(Long studentId, Long roundId, List<EnrollmentStatus> statuses);
}
