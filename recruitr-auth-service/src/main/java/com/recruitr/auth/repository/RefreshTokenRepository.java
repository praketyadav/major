package com.recruitr.auth.repository;

import com.recruitr.auth.model.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RefreshTokenRepository
        extends JpaRepository<RefreshToken, Long> {
}
