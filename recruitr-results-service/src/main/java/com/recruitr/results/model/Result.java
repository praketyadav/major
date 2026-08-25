package com.recruitr.results.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "results", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"studentId", "roundId"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Result {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long studentId;

    @Column(nullable = false)
    private Long roundId;

    @Column(nullable = false)
    private Long sessionId;

    @Column(nullable = false)
    private Double mcqScore = 0.0;

    @Column(nullable = false)
    private Double subjectiveScore = 0.0;

    @Column(nullable = false)
    private Double totalScore = 0.0;

    @Column
    private Double percentile;

    @Column(nullable = false)
    private boolean subjectiveReviewed = false;

    @Column(nullable = false)
    private boolean resultKeyReleased = false;

    @Column
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.mcqScore == null) this.mcqScore = 0.0;
        if (this.subjectiveScore == null) this.subjectiveScore = 0.0;
        if (this.totalScore == null) this.totalScore = 0.0;
    }
}
