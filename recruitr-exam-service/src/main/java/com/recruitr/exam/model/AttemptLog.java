package com.recruitr.exam.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "attempt_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttemptLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long sessionId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventType eventType;

    @Column(nullable = false)
    private LocalDateTime eventTime;

    @Column
    private String metadata;

    @PrePersist
    protected void onCreate() {
        this.eventTime = LocalDateTime.now();
    }
}
