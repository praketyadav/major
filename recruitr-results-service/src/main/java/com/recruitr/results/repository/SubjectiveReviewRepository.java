package com.recruitr.results.repository;

import com.recruitr.results.model.SubjectiveReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SubjectiveReviewRepository
        extends JpaRepository<SubjectiveReview, Long> {
    List<SubjectiveReview> findByResultId(Long resultId);
}
