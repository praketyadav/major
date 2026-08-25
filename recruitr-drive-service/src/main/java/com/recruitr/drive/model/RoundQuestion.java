package com.recruitr.drive.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "round_questions",
    uniqueConstraints = @UniqueConstraint(
        columnNames = {"round_id", "question_id"}))
@Data
@NoArgsConstructor
public class RoundQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "round_id", nullable = false)
    private Long roundId;

    @Column(name = "question_id", nullable = false)
    private Long questionId;
}
