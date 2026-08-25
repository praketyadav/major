package com.recruitr.drive.repository;

import com.recruitr.drive.model.RoundQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RoundQuestionRepository
        extends JpaRepository<RoundQuestion, Long> {
    List<RoundQuestion> findByRoundId(Long roundId);
    void deleteByRoundId(Long roundId);
}
