package com.recruitr.enrollment.repository;

import com.recruitr.enrollment.model.DriveCollege;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DriveCollegeRepository extends JpaRepository<DriveCollege, Long> {
    List<DriveCollege> findByDriveId(Long driveId);
    boolean existsByDriveIdAndCollegeId(Long driveId, Long collegeId);
}
