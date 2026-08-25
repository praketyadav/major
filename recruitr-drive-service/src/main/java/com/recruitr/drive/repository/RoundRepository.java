package com.recruitr.drive.repository;

import com.recruitr.drive.model.Round;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RoundRepository extends JpaRepository<Round, Long> {
    List<Round> findByDriveIdOrderByRoundNumberAsc(Long driveId);
    long countByDriveId(Long driveId);
}
