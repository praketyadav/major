package com.recruitr.enrollment.repository;

import com.recruitr.enrollment.model.DriveCollege;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface DriveCollegeRepository
        extends JpaRepository<DriveCollege, Long> {
    List<DriveCollege> findByCollegeId(Long collegeId);
    List<DriveCollege> findByDriveId(Long driveId);
    Optional<DriveCollege> findByDriveIdAndCollegeId(
            Long driveId, Long collegeId);
}
