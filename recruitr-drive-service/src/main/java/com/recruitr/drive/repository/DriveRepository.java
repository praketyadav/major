package com.recruitr.drive.repository;

import com.recruitr.drive.model.Drive;
import com.recruitr.drive.model.DriveStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DriveRepository extends JpaRepository<Drive, Long> {
    List<Drive> findByCompanyId(Long companyId);
    long countByStatus(DriveStatus status);
}
