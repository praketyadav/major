package com.recruitr.exam.service;

import com.recruitr.exam.dto.*;
import com.recruitr.exam.exception.*;
import com.recruitr.exam.model.*;
import com.recruitr.exam.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExamService {

    private final ExamSessionRepository sessionRepository;
    private final ResponseRepository responseRepository;
    private final AttemptLogRepository attemptLogRepository;
    private final RestTemplate restTemplate;

    @Value("${services.enrollment-url}")
    private String enrollmentUrl;

    @Value("${services.drive-url}")
    private String driveUrl;

    @Value("${services.results-url}")
    private String resultsUrl;

    // ── Start Exam ───────────────────────────────────────

    @Transactional
    public StartExamResponse startExam(StartExamRequest request) {

        // 1. Check eligibility via Enrollment Service
        String eligibilityUrl = enrollmentUrl
            + "/api/v1/eligibility/check?studentId="
            + request.getStudentId()
            + "&roundId=" + request.getRoundId();

        Map<?, ?> eligibility = restTemplate.getForObject(
                eligibilityUrl, Map.class);

        if (eligibility == null
                || !Boolean.TRUE.equals(
                    eligibility.get("eligible"))) {
            String reason = eligibility != null
                ? (String) eligibility.get("reason")
                : "Eligibility check failed";
            throw new AccessDeniedException(
                "Student is not eligible: " + reason);
        }

        // 2. Check attempt locking
        if (sessionRepository.existsByStudentIdAndRoundId(
                request.getStudentId(), request.getRoundId())) {
            throw new ConflictException(
                "Attempt already exists for this student "
                    + "and round. Re-attempting is not allowed.");
        }

        // 3. Fetch round details from Drive Service
        String roundUrl = driveUrl
            + "/api/v1/drives/0/rounds/"
            + request.getRoundId();

        Map<?, ?> roundData = restTemplate.getForObject(
                roundUrl, Map.class);

        Integer durationMinutes = roundData != null
            ? (Integer) roundData.get("durationMinutes")
            : 60;

        Long driveId = roundData != null
                && roundData.get("driveId") != null
            ? Long.valueOf(roundData.get("driveId").toString())
            : null;

        // 4. Fetch questions for the round
        String questionsUrl = driveUrl
            + "/api/v1/drives/"
            + (driveId != null ? driveId : "0")
            + "/rounds/" + request.getRoundId()
            + "/questions";

        List<?> rawQuestions = restTemplate.getForObject(
                questionsUrl, List.class);

        List<Map<?, ?>> questions = rawQuestions != null
            ? rawQuestions.stream()
                .map(q -> (Map<?, ?>) q)
                .collect(Collectors.toList())
            : new ArrayList<>();

        // 5. Shuffle using Fisher-Yates seeded with studentId
        List<Map<?, ?>> shuffled = new ArrayList<>(questions);
        Random rng = new Random(request.getStudentId());
        for (int i = shuffled.size() - 1; i > 0; i--) {
            int j = rng.nextInt(i + 1);
            Map<?, ?> temp = shuffled.get(i);
            shuffled.set(i, shuffled.get(j));
            shuffled.set(j, temp);
        }

        // 6. Create exam session
        ExamSession session = new ExamSession();
        session.setStudentId(request.getStudentId());
        session.setRoundId(request.getRoundId());
        session.setStatus(SessionStatus.IN_PROGRESS);
        session.setTabSwitchCount(0);
        session.setFullscreenExitCount(0);
        ExamSession saved = sessionRepository.save(session);

        // 7. Log EXAM_STARTED event
        logEvent(saved.getId(), EventType.EXAM_STARTED,
                "Exam started for student "
                    + request.getStudentId());

        // 8. Map questions to DTO — exclude correctOption
        List<QuestionDto> questionDtos = shuffled.stream()
            .map(q -> {
                QuestionDto dto = new QuestionDto();
                if (q.get("id") != null) {
                    dto.setId(Long.valueOf(
                        q.get("id").toString()));
                }
                dto.setQuestionText(
                    (String) q.get("questionText"));
                dto.setQuestionType(
                    q.get("questionType") != null
                        ? q.get("questionType").toString()
                        : null);
                dto.setOptionA((String) q.get("optionA"));
                dto.setOptionB((String) q.get("optionB"));
                dto.setOptionC((String) q.get("optionC"));
                dto.setOptionD((String) q.get("optionD"));
                if (q.get("marks") != null) {
                    dto.setMarks(Double.valueOf(
                        q.get("marks").toString()));
                }
                dto.setTags((String) q.get("tags"));
                // correctOption intentionally excluded
                return dto;
            })
            .collect(Collectors.toList());

        // 9. Build response
        StartExamResponse response = new StartExamResponse();
        response.setSessionId(saved.getId());
        response.setRoundId(request.getRoundId());
        response.setDurationMinutes(durationMinutes);
        response.setStartedAt(saved.getStartedAt());
        response.setQuestions(questionDtos);
        return response;
    }

    // ── Process Warning ──────────────────────────────────

    @Transactional
    public WarningResponse processWarning(Long sessionId,
            WarningRequest request) {

        ExamSession session = findActiveSession(sessionId);

        if ("TAB_SWITCH".equals(request.getWarningType())) {
            session.setTabSwitchCount(
                session.getTabSwitchCount() + 1);
            logEvent(sessionId, EventType.TAB_SWITCHED,
                "Tab switch #" + session.getTabSwitchCount());
        } else if ("FULLSCREEN_EXIT".equals(
                request.getWarningType())) {
            session.setFullscreenExitCount(
                session.getFullscreenExitCount() + 1);
            logEvent(sessionId, EventType.FULLSCREEN_EXIT,
                "Fullscreen exit #"
                    + session.getFullscreenExitCount());
        }

        int totalWarnings = session.getTabSwitchCount()
                + session.getFullscreenExitCount();

        logEvent(sessionId, EventType.WARNING_ISSUED,
            "Total warnings: " + totalWarnings);

        sessionRepository.save(session);

        WarningResponse response = new WarningResponse();
        response.setSessionId(sessionId);
        response.setTotalWarnings(totalWarnings);

        // Auto-submit if 3 or more total warnings
        if (totalWarnings >= 3) {
            autoSubmit(session);
            response.setAutoSubmitted(true);
            response.setMessage(
                "Exam auto-submitted due to repeated "
                    + "integrity violations.");
        } else {
            response.setAutoSubmitted(false);
            response.setMessage("Warning recorded. "
                + (3 - totalWarnings)
                + " warning(s) remaining before auto-submit.");
        }

        return response;
    }

    // ── Submit Exam ──────────────────────────────────────

    @Transactional
    public SubmitExamResponse submitExam(Long sessionId,
            SubmitExamRequest request) {

        ExamSession session = sessionRepository
                .findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                    "Session not found: " + sessionId));

        if (session.getStatus() == SessionStatus.SUBMITTED
                || session.getStatus()
                    == SessionStatus.AUTO_SUBMITTED) {
            throw new ConflictException(
                "Exam has already been submitted.");
        }

        // Save all responses
        if (request.getResponses() != null) {
            List<Response> responses = request.getResponses()
                    .stream()
                    .map(r -> {
                        Response resp = new Response();
                        resp.setSessionId(sessionId);
                        resp.setQuestionId(r.getQuestionId());
                        resp.setSelectedOption(
                            r.getSelectedOption());
                        resp.setSubjectiveAnswer(
                            r.getSubjectiveAnswer());
                        return resp;
                    })
                    .collect(Collectors.toList());
            responseRepository.saveAll(responses);
        }

        // Update session
        session.setStatus(SessionStatus.SUBMITTED);
        session.setSubmittedAt(LocalDateTime.now());
        sessionRepository.save(session);

        logEvent(sessionId, EventType.SUBMITTED,
            "Student submitted the exam manually.");

        // Trigger scoring in Results Service asynchronously
        // (fire and forget — we don't block on the result)
        try {
            Map<String, Object> scoreRequest = Map.of(
                "sessionId", sessionId,
                "studentId", session.getStudentId(),
                "roundId",   session.getRoundId()
            );
            restTemplate.postForObject(
                resultsUrl + "/api/v1/results/score",
                scoreRequest, Map.class);
        } catch (Exception e) {
            // Log but don't fail the submission if
            // results service is temporarily unavailable
            System.err.println(
                "Warning: Could not trigger scoring: "
                    + e.getMessage());
        }

        SubmitExamResponse response = new SubmitExamResponse();
        response.setMessage("Exam submitted successfully.");
        response.setSubmittedAt(session.getSubmittedAt());
        response.setSessionId(sessionId);
        return response;
    }

    // ── Get Session ──────────────────────────────────────

    public ExamSession getSession(Long sessionId) {
        return sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                    "Session not found: " + sessionId));
    }

    // ── Get Responses for Session ────────────────────────

    public List<Response> getResponsesForSession(
            Long sessionId) {
        return responseRepository.findBySessionId(sessionId);
    }

    // ── Private Helpers ──────────────────────────────────

    private ExamSession findActiveSession(Long sessionId) {
        ExamSession session = sessionRepository
                .findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                    "Session not found: " + sessionId));
        if (session.getStatus() != SessionStatus.IN_PROGRESS) {
            throw new BadRequestException(
                "Session is no longer active. Status: "
                    + session.getStatus());
        }
        return session;
    }

    private void autoSubmit(ExamSession session) {
        session.setStatus(SessionStatus.AUTO_SUBMITTED);
        session.setSubmittedAt(LocalDateTime.now());
        sessionRepository.save(session);
        logEvent(session.getId(), EventType.AUTO_SUBMITTED,
            "Auto-submitted due to warning limit reached.");

        // Trigger scoring
        try {
            Map<String, Object> scoreRequest = Map.of(
                "sessionId", session.getId(),
                "studentId", session.getStudentId(),
                "roundId",   session.getRoundId()
            );
            restTemplate.postForObject(
                resultsUrl + "/api/v1/results/score",
                scoreRequest, Map.class);
        } catch (Exception e) {
            System.err.println(
                "Warning: Could not trigger scoring "
                    + "after auto-submit: " + e.getMessage());
        }
    }

    private void logEvent(Long sessionId,
            EventType eventType, String metadata) {
        AttemptLog log = new AttemptLog();
        log.setSessionId(sessionId);
        log.setEventType(eventType);
        log.setMetadata(metadata);
        attemptLogRepository.save(log);
    }
}
