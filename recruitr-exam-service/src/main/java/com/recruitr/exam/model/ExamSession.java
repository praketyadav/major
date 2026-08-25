package com.recruitr.exam.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "exam_sessions", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"studentId", "roundId"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long studentId;

    @Column(nullable = false)
    private Long roundId;

    @Column
    private LocalDateTime startedAt;

    @Column
    private LocalDateTime submittedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SessionStatus status;

    @Column(nullable = false)
    private Integer tabSwitchCount = 0;

    @Column(nullable = false)
    private Integer fullscreenExitCount = 0;

    @PrePersist
    protected void onCreate() {
        this.startedAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = SessionStatus.IN_PROGRESS;
        }
        if (this.tabSwitchCount == null) {
            this.tabSwitchCount = 0;
        }
        if (this.fullscreenExitCount == null) {
            this.fullscreenExitCount = 0;
        }
    }
}
