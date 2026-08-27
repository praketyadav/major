package com.recruitr.results.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "subjective_reviews")
@Data
@NoArgsConstructor
public class SubjectiveReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "result_id", nullable = false)
    private Long resultId;

    @Column(name = "question_id", nullable = false)
    private Long questionId;

    @Column(name = "reviewed_answer", columnDefinition = "TEXT")
    private String reviewedAnswer;

    @Column(name = "marks_awarded", nullable = false)
    private Double marksAwarded;

    @Column(name = "reviewed_by", nullable = false)
    private Long reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @PrePersist
    protected void onCreate() {
        this.reviewedAt = LocalDateTime.now();
    }
}
