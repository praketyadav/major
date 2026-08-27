package com.recruitr.exam.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "attempt_logs")
@Data
@NoArgsConstructor
public class AttemptLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_id", nullable = false)
    private Long sessionId;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false)
    private EventType eventType;

    @Column(name = "event_time")
    private LocalDateTime eventTime;

    private String metadata;

    @PrePersist
    protected void onCreate() {
        this.eventTime = LocalDateTime.now();
    }
}
