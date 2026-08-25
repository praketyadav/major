package com.recruitr.exam.service;

import com.recruitr.exam.dto.*;
import com.recruitr.exam.exception.ConflictException;
import com.recruitr.exam.exception.ResourceNotFoundException;
import com.recruitr.exam.model.*;
import com.recruitr.exam.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ExamService {

    private final ExamSessionRepository sessionRepository;
    private final ResponseRepository responseRepository;
    private final AttemptLogRepository attemptLogRepository;
    private final RestTemplate restTemplate;

    public StartExamResponse startExam(StartExamRequest request) {
        Long studentId = request.getStudentId();
        Long roundId = request.getRoundId();

        // 1. Check eligibility via Enrollment Service
        String eligibilityUrl = "http://localhost:8083/api/v1/eligibility/check?studentId=" + studentId + "&roundId=" + roundId;
        try {
            ResponseEntity<Map> eligResp = restTemplate.getForEntity(eligibilityUrl, Map.class);
            if (eligResp.getBody() == null || !Boolean.TRUE.equals(eligResp.getBody().get("eligible"))) {
                throw new RuntimeException("Student is not eligible for this round");
            }
        } catch (Exception e) {
            throw new RuntimeException("Eligibility check failed: " + e.getMessage());
        }

        // 2. Check if ExamSession already exists for (studentId, roundId)
        if (sessionRepository.existsByStudentIdAndRoundId(studentId, roundId)) {
            throw new ConflictException("Attempt already exists");
        }

        // 3. Create ExamSession
        ExamSession session = ExamSession.builder()
                .studentId(studentId)
                .roundId(roundId)
                .status(SessionStatus.IN_PROGRESS)
                .tabSwitchCount(0)
                .fullscreenExitCount(0)
                .build();
        session = sessionRepository.save(session);

        // Log EXAM_STARTED
        attemptLogRepository.save(AttemptLog.builder()
                .sessionId(session.getId())
                .eventType(EventType.EXAM_STARTED)
                .eventTime(LocalDateTime.now())
                .metadata("Exam started by student " + studentId)
                .build());

        // 4. Fetch questions from Drive Service
        Long driveId = request.getDriveId();
        String questionsUrl = "http://localhost:8082/api/v1/drives/" + driveId + "/rounds/" + roundId + "/questions";
        List<Map<String, Object>> questions = new ArrayList<>();
        try {
            ResponseEntity<List> qResp = restTemplate.getForEntity(questionsUrl, List.class);
            if (qResp.getBody() != null) {
                for (Object item : qResp.getBody()) {
                    if (item instanceof Map) {
                        Map<String, Object> qMap = new HashMap<>((Map<String, Object>) item);
                        // Hide correctOption from student
                        qMap.remove("correctOption");
                        questions.add(qMap);
                    }
                }
            }
        } catch (Exception e) {
            // fallback empty list if error
        }

        // 5. Shuffle questions using Fisher-Yates seeded with studentId
        Collections.shuffle(questions, new Random(studentId));

        // Fetch round details to get duration
        Integer durationMinutes = 60; // default fallback
        try {
            String roundUrl = "http://localhost:8082/api/v1/drives/" + driveId + "/rounds";
            ResponseEntity<List> roundsResp = restTemplate.getForEntity(roundUrl, List.class);
            if (roundsResp.getBody() != null) {
                for (Object item : roundsResp.getBody()) {
                    if (item instanceof Map) {
                        Map rMap = (Map) item;
                        if (roundId.equals(Long.valueOf(rMap.get("id").toString()))) {
                            durationMinutes = Integer.valueOf(rMap.get("durationMinutes").toString());
                            break;
                        }
                    }
                }
            }
        } catch (Exception e) {
            // fallback default
        }

        return StartExamResponse.builder()
                .sessionId(session.getId())
                .questions(questions)
                .durationMinutes(durationMinutes)
                .startedAt(session.getStartedAt())
                .build();
    }

    public WarningResponse issueWarning(Long sessionId, WarningRequest request) {
        ExamSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found: " + sessionId));

        String warningType = request.getWarningType();
        EventType eventType;
        if ("TAB_SWITCH".equalsIgnoreCase(warningType)) {
            session.setTabSwitchCount(session.getTabSwitchCount() + 1);
            eventType = EventType.TAB_SWITCHED;
        } else {
            session.setFullscreenExitCount(session.getFullscreenExitCount() + 1);
            eventType = EventType.FULLSCREEN_EXIT;
        }

        int totalWarnings = session.getTabSwitchCount() + session.getFullscreenExitCount();

        attemptLogRepository.save(AttemptLog.builder()
                .sessionId(sessionId)
                .eventType(eventType)
                .eventTime(LocalDateTime.now())
                .metadata("Warning count: " + totalWarnings)
                .build());

        boolean autoSubmitted = false;
        if (totalWarnings >= 3) {
            session.setStatus(SessionStatus.AUTO_SUBMITTED);
            session.setSubmittedAt(LocalDateTime.now());
            autoSubmitted = true;

            attemptLogRepository.save(AttemptLog.builder()
                    .sessionId(sessionId)
                    .eventType(EventType.AUTO_SUBMITTED)
                    .eventTime(LocalDateTime.now())
                    .metadata("Auto submitted due to 3 warnings")
                    .build());

            // Trigger scoring via Results Service
            triggerScoring(session.getId(), session.getStudentId(), session.getRoundId());
        }

        sessionRepository.save(session);

        return WarningResponse.builder()
                .warningCount(totalWarnings)
                .autoSubmitted(autoSubmitted)
                .build();
    }

    public SubmitExamResponse submitExam(Long sessionId, SubmitExamRequest request) {
        ExamSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found: " + sessionId));

        if (session.getStatus() == SessionStatus.SUBMITTED || session.getStatus() == SessionStatus.AUTO_SUBMITTED) {
            throw new ConflictException("Exam already submitted");
        }

        if (request != null && request.getResponses() != null) {
            for (SubmitExamRequest.SingleResponseDto dto : request.getResponses()) {
                Response resp = Response.builder()
                        .sessionId(sessionId)
                        .questionId(dto.getQuestionId())
                        .selectedOption(dto.getSelectedOption())
                        .subjectiveAnswer(dto.getSubjectiveAnswer())
                        .answeredAt(LocalDateTime.now())
                        .build();
                responseRepository.save(resp);
            }
        }

        session.setStatus(SessionStatus.SUBMITTED);
        session.setSubmittedAt(LocalDateTime.now());
        sessionRepository.save(session);

        attemptLogRepository.save(AttemptLog.builder()
                .sessionId(sessionId)
                .eventType(EventType.SUBMITTED)
                .eventTime(LocalDateTime.now())
                .metadata("Exam submitted successfully by student")
                .build());

        // Trigger scoring
        triggerScoring(session.getId(), session.getStudentId(), session.getRoundId());

        return SubmitExamResponse.builder()
                .message("Submitted successfully")
                .submittedAt(session.getSubmittedAt())
                .build();
    }

    public ExamSession getSession(Long sessionId) {
        return sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found: " + sessionId));
    }

    public List<Response> getResponsesForSession(Long sessionId) {
        return responseRepository.findBySessionId(sessionId);
    }

    private void triggerScoring(Long sessionId, Long studentId, Long roundId) {
        try {
            String scoreUrl = "http://localhost:8085/api/v1/results/score";
            Map<String, Object> body = Map.of(
                    "sessionId", sessionId,
                    "studentId", studentId,
                    "roundId", roundId
            );
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            restTemplate.postForEntity(scoreUrl, entity, Map.class);
        } catch (Exception e) {
            // Log scoring trigger failure
        }
    }
}
