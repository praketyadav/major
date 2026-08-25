package com.recruitr.enrollment.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "drive_colleges", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"driveId", "collegeId"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DriveCollege {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long driveId;

    @Column(nullable = false)
    private Long collegeId;

    @Column
    private LocalDateTime assignedAt;

    @PrePersist
    protected void onCreate() {
        this.assignedAt = LocalDateTime.now();
    }
}
