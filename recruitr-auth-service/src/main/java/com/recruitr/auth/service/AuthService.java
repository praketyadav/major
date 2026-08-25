package com.recruitr.auth.service;

import com.recruitr.auth.dto.*;
import com.recruitr.auth.exception.*;
import com.recruitr.auth.model.Role;
import com.recruitr.auth.model.User;
import com.recruitr.auth.repository.UserRepository;
import com.recruitr.auth.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final BCryptPasswordEncoder passwordEncoder;

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new InvalidCredentialsException(
                        "Invalid email or password"));

        if (!user.isActive()) {
            throw new InvalidCredentialsException(
                    "This account has been deactivated");
        }

        if (!passwordEncoder.matches(
                request.getPassword(), user.getPassword())) {
            throw new InvalidCredentialsException(
                    "Invalid email or password");
        }

        String token = jwtUtil.generateToken(
                user.getId(),
                user.getEmail(),
                user.getRole().name()
        );

        return new LoginResponse(
                token,
                user.getRole().name(),
                user.getId(),
                user.getName()
        );
    }

    public UserResponse register(RegisterRequest request,
                                  String callerRole) {
        // Only SUPER_ADMIN can create SUPER_ADMIN,
        // COMPANY_ADMIN, COLLEGE_ADMIN accounts
        // Only COLLEGE_ADMIN can create STUDENT accounts
        if (request.getRole() == Role.STUDENT) {
            if (!"COLLEGE_ADMIN".equals(callerRole)
                    && !"SUPER_ADMIN".equals(callerRole)) {
                throw new AccessDeniedException(
                    "Only College Admin can register students");
            }
        } else if (request.getRole() == Role.SUPER_ADMIN) {
            throw new AccessDeniedException(
                "Cannot create another Super Admin");
        } else {
            if (!"SUPER_ADMIN".equals(callerRole)) {
                throw new AccessDeniedException(
                    "Only Super Admin can register "
                        + request.getRole());
            }
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException(
                    "User with email " + request.getEmail()
                        + " already exists");
        }

        if (userRepository.existsBySapId(request.getSapId())) {
            throw new UserAlreadyExistsException(
                    "User with SAP ID " + request.getSapId()
                        + " already exists");
        }

        User user = new User();
        user.setSapId(request.getSapId());
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());
        user.setCollegeId(request.getCollegeId());
        user.setCompanyId(request.getCompanyId());
        user.setActive(true);

        User saved = userRepository.save(user);
        return mapToResponse(saved);
    }

    public UserResponse getUserById(Long id, String callerRole) {
        if (!"SUPER_ADMIN".equals(callerRole)) {
            throw new AccessDeniedException(
                "Only Super Admin can view user details");
        }
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found with id: " + id));
        return mapToResponse(user);
    }

    public UserResponse getMe(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found"));
        return mapToResponse(user);
    }

    public UserResponse deactivateUser(Long id, String callerRole) {
        if (!"SUPER_ADMIN".equals(callerRole)) {
            throw new AccessDeniedException(
                "Only Super Admin can deactivate accounts");
        }
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found with id: " + id));
        user.setActive(false);
        userRepository.save(user);
        return mapToResponse(user);
    }

    public Map<String, Long> getAnalytics(String callerRole) {
        if (!"SUPER_ADMIN".equals(callerRole)) {
            throw new AccessDeniedException(
                "Only Super Admin can view analytics");
        }
        long totalColleges = userRepository
            .countByRole(Role.COLLEGE_ADMIN);
        long totalCompanies = userRepository
            .countByRole(Role.COMPANY_ADMIN);
        long totalStudents = userRepository
            .countByRole(Role.STUDENT);

        return Map.of(
            "totalColleges", totalColleges,
            "totalCompanies", totalCompanies,
            "totalStudents", totalStudents
        );
    }

    private UserResponse mapToResponse(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setSapId(user.getSapId());
        response.setName(user.getName());
        response.setEmail(user.getEmail());
        response.setRole(user.getRole());
        response.setCollegeId(user.getCollegeId());
        response.setCompanyId(user.getCompanyId());
        response.setActive(user.isActive());
        response.setCreatedAt(user.getCreatedAt());
        return response;
    }
}
