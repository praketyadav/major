package com.recruitr.exam.repository;

import com.recruitr.exam.model.AttemptLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AttemptLogRepository
        extends JpaRepository<AttemptLog, Long> {
}
