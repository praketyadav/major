package com.recruitr.auth.repository;

import com.recruitr.auth.model.Role;
import com.recruitr.auth.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsBySapId(String sapId);
    boolean existsByRole(Role role);
    long countByRole(Role role);
}
