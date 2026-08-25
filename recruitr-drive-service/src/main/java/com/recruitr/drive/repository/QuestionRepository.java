package com.recruitr.drive.repository;

import com.recruitr.drive.model.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface QuestionRepository
        extends JpaRepository<Question, Long> {
    List<Question> findByCompanyId(Long companyId);
}
