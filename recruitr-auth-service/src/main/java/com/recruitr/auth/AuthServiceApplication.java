package com.recruitr.auth;

import com.recruitr.auth.model.Role;
import com.recruitr.auth.model.User;
import com.recruitr.auth.repository.UserRepository;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@SpringBootApplication
public class AuthServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(AuthServiceApplication.class, args);
    }

    // Seeds the Super Admin account on first startup
    // If a Super Admin already exists, this does nothing (idempotent)
    @Bean
    public ApplicationRunner seedSuperAdmin(
            UserRepository userRepository,
            BCryptPasswordEncoder passwordEncoder) {
        return args -> {
            boolean superAdminExists = userRepository
                    .existsByRole(Role.SUPER_ADMIN);
            if (!superAdminExists) {
                User superAdmin = new User();
                superAdmin.setSapId("ADMIN001");
                superAdmin.setName("Super Admin");
                superAdmin.setEmail("admin@recruitr.com");
                superAdmin.setPassword(
                        passwordEncoder.encode("admin@123"));
                superAdmin.setRole(Role.SUPER_ADMIN);
                superAdmin.setActive(true);
                userRepository.save(superAdmin);
                System.out.println(
                    "✅ Super Admin seeded: admin@recruitr.com / admin@123");
            } else {
                System.out.println(
                    "✅ Super Admin already exists, skipping seed.");
            }
        };
    }
}
