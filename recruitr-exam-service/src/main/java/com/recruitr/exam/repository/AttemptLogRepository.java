package com.recruitr.exam.repository;

import com.recruitr.exam.model.AttemptLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AttemptLogRepository extends JpaRepository<AttemptLog, Long> {
    List<AttemptLog> findBySessionId(Long sessionId);
}
