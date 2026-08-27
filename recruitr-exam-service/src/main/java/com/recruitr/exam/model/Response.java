package com.recruitr.exam.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "responses")
@Data
@NoArgsConstructor
public class Response {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_id", nullable = false)
    private Long sessionId;

    @Column(name = "question_id", nullable = false)
    private Long questionId;

    @Column(name = "selected_option")
    private String selectedOption;

    @Column(name = "subjective_answer",
            columnDefinition = "TEXT")
    private String subjectiveAnswer;

    @Column(name = "answered_at")
    private LocalDateTime answeredAt;

    @PrePersist
    protected void onCreate() {
        this.answeredAt = LocalDateTime.now();
    }
}
