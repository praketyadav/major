package com.recruitr.exam.repository;

import com.recruitr.exam.model.ExamSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ExamSessionRepository extends JpaRepository<ExamSession, Long> {
    Optional<ExamSession> findByStudentIdAndRoundId(Long studentId, Long roundId);
    boolean existsByStudentIdAndRoundId(Long studentId, Long roundId);
}
