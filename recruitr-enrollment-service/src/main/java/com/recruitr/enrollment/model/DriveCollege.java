package com.recruitr.enrollment.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "drive_colleges",
    uniqueConstraints = @UniqueConstraint(
        columnNames = {"drive_id", "college_id"}))
@Data
@NoArgsConstructor
public class DriveCollege {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "drive_id", nullable = false)
    private Long driveId;

    @Column(name = "college_id", nullable = false)
    private Long collegeId;

    @Column(name = "assigned_at")
    private LocalDateTime assignedAt;

    @PrePersist
    protected void onCreate() {
        this.assignedAt = LocalDateTime.now();
    }
}
