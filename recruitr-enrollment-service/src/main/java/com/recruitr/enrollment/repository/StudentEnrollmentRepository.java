package com.recruitr.enrollment.repository;

import com.recruitr.enrollment.model.EnrollmentStatus;
import com.recruitr.enrollment.model.StudentEnrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface StudentEnrollmentRepository
        extends JpaRepository<StudentEnrollment, Long> {

    Optional<StudentEnrollment> findByStudentIdAndRoundId(
            Long studentId, Long roundId);

    List<StudentEnrollment> findByDriveId(Long driveId);

    List<StudentEnrollment> findByStudentId(Long studentId);

    boolean existsByStudentIdAndRoundId(
            Long studentId, Long roundId);
}
