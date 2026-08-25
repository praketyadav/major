package com.recruitr.results.repository;

import com.recruitr.results.model.Result;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResultRepository extends JpaRepository<Result, Long> {
    Optional<Result> findByStudentIdAndRoundId(Long studentId, Long roundId);
    List<Result> findByRoundId(Long roundId);
}
