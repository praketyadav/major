package com.recruitr.results.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "subjective_reviews")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubjectiveReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long resultId;

    @Column(nullable = false)
    private Long questionId;

    @Column(columnDefinition = "TEXT")
    private String reviewedAnswer;

    @Column
    private Double marksAwarded;

    @Column
    private Long reviewedBy; // companyAdminId

    @Column
    private LocalDateTime reviewedAt;

    @PrePersist
    protected void onCreate() {
        this.reviewedAt = LocalDateTime.now();
    }
}
