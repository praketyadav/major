package com.recruitr.results.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "results",
    uniqueConstraints = @UniqueConstraint(
        columnNames = {"student_id", "round_id"}))
@Data
@NoArgsConstructor
public class Result {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "round_id", nullable = false)
    private Long roundId;

    @Column(name = "session_id", nullable = false)
    private Long sessionId;

    @Column(name = "mcq_score", nullable = false)
    private Double mcqScore = 0.0;

    @Column(name = "subjective_score", nullable = false)
    private Double subjectiveScore = 0.0;

    @Column(name = "total_score", nullable = false)
    private Double totalScore = 0.0;

    @Column(name = "percentile")
    private Double percentile;

    @Column(name = "subjective_reviewed", nullable = false)
    private boolean subjectiveReviewed = false;

    @Column(name = "result_key_released", nullable = false)
    private boolean resultKeyReleased = false;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
