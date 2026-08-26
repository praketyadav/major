package com.recruitr.enrollment.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "student_enrollments",
    uniqueConstraints = @UniqueConstraint(
        columnNames = {"student_id", "round_id"}))
@Data
@NoArgsConstructor
public class StudentEnrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "drive_id", nullable = false)
    private Long driveId;

    @Column(name = "round_id", nullable = false)
    private Long roundId;

    @Column(name = "enrolled_at")
    private LocalDateTime enrolledAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EnrollmentStatus status = EnrollmentStatus.ENROLLED;

    @PrePersist
    protected void onCreate() {
        this.enrolledAt = LocalDateTime.now();
    }
}
