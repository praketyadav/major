package com.recruitr.results.service;

import com.recruitr.results.dto.*;
import com.recruitr.results.exception.*;
import com.recruitr.results.model.*;
import com.recruitr.results.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ResultsService {

    private final ResultRepository resultRepository;
    private final SubjectiveReviewRepository
            subjectiveReviewRepository;
    private final NotificationRepository notificationRepository;
    private final RestTemplate restTemplate;

    @Value("${services.exam-url}")
    private String examUrl;

    @Value("${services.drive-url}")
    private String driveUrl;

    @Value("${services.enrollment-url}")
    private String enrollmentUrl;

    // ── Score MCQ on Submission ──────────────────────────

    @Transactional
    public ScoreResponse scoreMcq(ScoreRequest request) {

        // Skip if result already exists (idempotent)
        if (resultRepository.existsByStudentIdAndRoundId(
                request.getStudentId(), request.getRoundId())) {
            Result existing = resultRepository
                .findByStudentIdAndRoundId(
                    request.getStudentId(),
                    request.getRoundId()).get();
            ScoreResponse r = new ScoreResponse();
            r.setResultId(existing.getId());
            r.setMcqScore(existing.getMcqScore());
            r.setMessage("Result already computed.");
            return r;
        }

        // 1. Fetch student responses from Exam Service
        List<?> rawResponses = restTemplate.getForObject(
            examUrl + "/api/v1/session/"
                + request.getSessionId() + "/responses",
            List.class);

        List<Map<?, ?>> responses = rawResponses != null
            ? rawResponses.stream()
                .map(r -> (Map<?, ?>) r)
                .collect(Collectors.toList())
            : new ArrayList<>();

        // 2. Fetch round data from Drive Service
        Map<?, ?> roundData = null;
        try {
            roundData = restTemplate.getForObject(
                driveUrl + "/api/v1/drives/0/rounds/"
                    + request.getRoundId(),
                Map.class);
        } catch (Exception ignored) {}

        Long driveId = roundData != null
                && roundData.get("driveId") != null
            ? ((Number) roundData.get("driveId")).longValue()
            : 0L;

        // 3. Fetch questions with correct answers
        List<?> rawQuestions = null;
        try {
            rawQuestions = restTemplate.getForObject(
                driveUrl + "/api/v1/drives/" + driveId
                    + "/rounds/" + request.getRoundId()
                    + "/questions",
                List.class);
        } catch (Exception ignored) {}

        List<Map<?, ?>> questions = rawQuestions != null
            ? rawQuestions.stream()
                .map(q -> (Map<?, ?>) q)
                .collect(Collectors.toList())
            : new ArrayList<>();

        // 4. Build answer key map: questionId → correctOption
        Map<Long, String> answerKey = new HashMap<>();
        Map<Long, Double> marksMap = new HashMap<>();
        for (Map<?, ?> q : questions) {
            if (q.get("id") != null) {
                Long qId = ((Number) q.get("id")).longValue();
                String correct = q.get("correctOption") != null
                    ? q.get("correctOption").toString() : null;
                Double marks = q.get("marks") != null
                    ? ((Number) q.get("marks")).doubleValue()
                    : 0.0;
                answerKey.put(qId, correct);
                marksMap.put(qId, marks);
            }
        }

        // 5. Compute MCQ score
        double mcqScore = 0.0;
        for (Map<?, ?> response : responses) {
            if (response.get("questionId") == null) continue;
            Long qId = ((Number) response.get("questionId"))
                    .longValue();
            String selected =
                response.get("selectedOption") != null
                    ? response.get("selectedOption").toString()
                    : null;
            String correct = answerKey.get(qId);

            if (selected != null && selected.equals(correct)) {
                mcqScore += marksMap.getOrDefault(qId, 0.0);
            }
        }

        // 6. Save Result
        Result result = new Result();
        result.setStudentId(request.getStudentId());
        result.setRoundId(request.getRoundId());
        result.setSessionId(request.getSessionId());
        result.setMcqScore(mcqScore);
        result.setSubjectiveScore(0.0);
        result.setTotalScore(mcqScore);
        Result saved = resultRepository.save(result);

        // 7. Create notification for student
        createNotification(
            request.getStudentId(),
            "Exam Submitted",
            "Your exam submission has been received. "
                + "MCQ Score: " + mcqScore);

        ScoreResponse scoreResp = new ScoreResponse();
        scoreResp.setResultId(saved.getId());
        scoreResp.setMcqScore(mcqScore);
        scoreResp.setMessage(
            "MCQ scoring complete. Subjective pending review.");
        return scoreResp;
    }

    // ── Get Result for Student ───────────────────────────

    public ResultResponse getResultForStudent(
            Long studentId, Long roundId) {
        Result result = resultRepository
            .findByStudentIdAndRoundId(studentId, roundId)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Result not found for student "
                    + studentId + " round " + roundId));
        return mapToResponse(result);
    }

    // ── Get All Results for Round ────────────────────────

    public RoundResultSummary getResultsForRound(
            Long roundId, String callerRole) {
        if (!"COMPANY_ADMIN".equals(callerRole)
                && !"SUPER_ADMIN".equals(callerRole)) {
            throw new AccessDeniedException(
                "Only Company Admin can view round results");
        }
        List<Result> results =
            resultRepository.findByRoundId(roundId);

        double avg = results.stream()
            .mapToDouble(Result::getTotalScore)
            .average().orElse(0.0);

        RoundResultSummary summary = new RoundResultSummary();
        summary.setRoundId(roundId);
        summary.setTotalAttempted(results.size());
        summary.setAverageScore(avg);
        summary.setResults(results.stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList()));
        return summary;
    }

    // ── Release Result Key ───────────────────────────────

    @Transactional
    public void releaseResultKey(Long roundId,
            String callerRole) {
        if (!"COMPANY_ADMIN".equals(callerRole)) {
            throw new AccessDeniedException(
                "Only Company Admin can release result keys");
        }
        List<Result> results =
            resultRepository.findByRoundId(roundId);
        if (results.isEmpty()) {
            throw new ResourceNotFoundException(
                "No results found for round: " + roundId);
        }
        results.forEach(r -> r.setResultKeyReleased(true));
        resultRepository.saveAll(results);

        // Notify all students
        results.forEach(r -> createNotification(
            r.getStudentId(),
            "Result Key Released",
            "The result key for your exam has been released. "
                + "View your full scorecard now."));
    }

    // ── Advance Students in Round ────────────────────────

    @Transactional
    public RoundResultSummary advanceStudents(
            Long roundId, AdvanceRoundRequest request,
            String callerRole) {
        if (!"COMPANY_ADMIN".equals(callerRole)) {
            throw new AccessDeniedException(
                "Only Company Admin can advance students");
        }
        List<Result> results =
            resultRepository.findByRoundId(roundId);
        if (results.isEmpty()) {
            throw new ResourceNotFoundException(
                "No results found for round: " + roundId);
        }

        double cutoff = request.getCutoffScore() != null
            ? request.getCutoffScore() : 0.0;

        int totalAttempted = results.size();
        int advanced = 0;
        int eliminated = 0;

        for (Result r : results) {
            // Compute percentile
            long countLower = results.stream()
                .filter(other -> other.getTotalScore()
                    < r.getTotalScore())
                .count();
            double percentile = totalAttempted > 0
                ? ((double) countLower / totalAttempted) * 100.0
                : 0.0;
            r.setPercentile(percentile);
            resultRepository.save(r);

            // Find enrollment and update status
            try {
                List<?> enrollments = restTemplate.getForObject(
                    enrollmentUrl
                        + "/api/v1/enrollment/student/"
                        + r.getStudentId(),
                    List.class);

                if (enrollments != null) {
                    for (Object e : enrollments) {
                        Map<?, ?> enrollment = (Map<?, ?>) e;
                        if (enrollment.get("roundId") != null
                            && ((Number) enrollment
                                .get("roundId")).longValue()
                                == roundId) {

                            Long enrollmentId =
                                ((Number) enrollment.get("id"))
                                    .longValue();

                            String newStatus =
                                r.getTotalScore() >= cutoff
                                    ? "ADVANCED" : "ELIMINATED";

                            Map<String, String> statusBody =
                                Map.of("status", newStatus);
                            HttpHeaders headers =
                                new HttpHeaders();
                            headers.setContentType(
                                MediaType.APPLICATION_JSON);
                            HttpEntity<Map<String, String>>
                                entity = new HttpEntity<>(
                                    statusBody, headers);

                            restTemplate.exchange(
                                enrollmentUrl
                                    + "/api/v1/enrollment/"
                                    + enrollmentId + "/status",
                                HttpMethod.PATCH,
                                entity, Map.class);

                            if ("ADVANCED".equals(newStatus)) {
                                advanced++;
                                createNotification(
                                    r.getStudentId(),
                                    "Round Result",
                                    "Congratulations! You have "
                                        + "advanced to the next "
                                        + "round. Score: "
                                        + r.getTotalScore()
                                        + ", Percentile: "
                                        + String.format("%.1f",
                                            percentile) + "%");
                            } else {
                                eliminated++;
                                createNotification(
                                    r.getStudentId(),
                                    "Round Result",
                                    "Thank you for attempting "
                                        + "the assessment. "
                                        + "You have not advanced "
                                        + "to the next round. "
                                        + "Score: "
                                        + r.getTotalScore());
                            }
                            break;
                        }
                    }
                }
            } catch (Exception e) {
                System.err.println(
                    "Warning: Could not update enrollment "
                        + "for student " + r.getStudentId()
                        + ": " + e.getMessage());
            }
        }

        RoundResultSummary summary = new RoundResultSummary();
        summary.setRoundId(roundId);
        summary.setTotalAttempted(totalAttempted);
        summary.setAdvanced(advanced);
        summary.setEliminated(eliminated);
        summary.setResults(results.stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList()));
        return summary;
    }

    // ── Subjective Review ────────────────────────────────

    @Transactional
    public ResultResponse reviewSubjective(
            Long resultId,
            SubjectiveReviewRequest request,
            String callerRole) {
        if (!"COMPANY_ADMIN".equals(callerRole)) {
            throw new AccessDeniedException(
                "Only Company Admin can review "
                    + "subjective answers");
        }
        Result result = resultRepository.findById(resultId)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Result not found: " + resultId));

        // Save review
        SubjectiveReview review = new SubjectiveReview();
        review.setResultId(resultId);
        review.setQuestionId(request.getQuestionId());
        review.setMarksAwarded(request.getMarksAwarded());
        review.setReviewedBy(request.getReviewedBy());
        subjectiveReviewRepository.save(review);

        // Recalculate subjective total
        List<SubjectiveReview> allReviews =
            subjectiveReviewRepository.findByResultId(resultId);
        double subjectiveTotal = allReviews.stream()
            .mapToDouble(SubjectiveReview::getMarksAwarded)
            .sum();

        result.setSubjectiveScore(subjectiveTotal);
        result.setTotalScore(
            result.getMcqScore() + subjectiveTotal);
        result.setSubjectiveReviewed(true);
        resultRepository.save(result);

        return mapToResponse(result);
    }

    // ── Notifications ────────────────────────────────────

    public List<NotificationResponse> getNotifications(
            Long userId) {
        List<Notification> notifications =
            notificationRepository
                .findByUserIdOrderByCreatedAtDesc(userId);
        if (notifications == null || notifications.isEmpty()) {
            return Collections.emptyList();
        }
        return notifications.stream()
            .map(this::mapNotificationToResponse)
            .collect(Collectors.toList());
    }

    public NotificationResponse markNotificationRead(
            Long notificationId) {
        Notification notification = notificationRepository
            .findById(notificationId)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Notification not found: " + notificationId));
        notification.setRead(true);
        return mapNotificationToResponse(
            notificationRepository.save(notification));
    }

    // ── Private Helpers ──────────────────────────────────

    private void createNotification(Long userId,
            String title, String message) {
        Notification n = new Notification();
        n.setUserId(userId);
        n.setTitle(title);
        n.setMessage(message);
        n.setRead(false);
        notificationRepository.save(n);
    }

    private ResultResponse mapToResponse(Result r) {
        ResultResponse resp = new ResultResponse();
        resp.setId(r.getId());
        resp.setStudentId(r.getStudentId());
        resp.setRoundId(r.getRoundId());
        resp.setSessionId(r.getSessionId());
        resp.setMcqScore(r.getMcqScore());
        resp.setSubjectiveScore(r.getSubjectiveScore());
        resp.setTotalScore(r.getTotalScore());
        resp.setPercentile(r.getPercentile());
        resp.setSubjectiveReviewed(r.isSubjectiveReviewed());
        resp.setResultKeyReleased(r.isResultKeyReleased());
        resp.setCreatedAt(r.getCreatedAt());
        return resp;
    }

    private NotificationResponse mapNotificationToResponse(
            Notification n) {
        NotificationResponse resp = new NotificationResponse();
        resp.setId(n.getId());
        resp.setUserId(n.getUserId());
        resp.setTitle(n.getTitle());
        resp.setMessage(n.getMessage());
        resp.setRead(n.isRead());
        resp.setCreatedAt(n.getCreatedAt());
        return resp;
    }
}
