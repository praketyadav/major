package com.recruitr.exam.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "exam_sessions",
    uniqueConstraints = @UniqueConstraint(
        columnNames = {"student_id", "round_id"}))
@Data
@NoArgsConstructor
public class ExamSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "round_id", nullable = false)
    private Long roundId;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SessionStatus status = SessionStatus.IN_PROGRESS;

    @Column(name = "tab_switch_count", nullable = false)
    private Integer tabSwitchCount = 0;

    @Column(name = "fullscreen_exit_count", nullable = false)
    private Integer fullscreenExitCount = 0;

    @PrePersist
    protected void onCreate() {
        this.startedAt = LocalDateTime.now();
    }
}
