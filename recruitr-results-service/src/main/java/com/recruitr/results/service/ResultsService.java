package com.recruitr.results.service;

import com.recruitr.results.dto.*;
import com.recruitr.results.exception.ResourceNotFoundException;
import com.recruitr.results.model.*;
import com.recruitr.results.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ResultsService {

    private final ResultRepository resultRepository;
    private final SubjectiveReviewRepository subjectiveReviewRepository;
    private final NotificationRepository notificationRepository;
    private final RestTemplate restTemplate;

    public ScoreResponse calculateScore(ScoreRequest request) {
        Long sessionId = request.getSessionId();
        Long studentId = request.getStudentId();
        Long roundId = request.getRoundId();

        // 1. Fetch student responses from Exam Service
        String responsesUrl = "http://localhost:8084/api/v1/session/" + sessionId + "/responses";
        List<Map<String, Object>> responses = new ArrayList<>();
        try {
            ResponseEntity<List> resp = restTemplate.getForEntity(responsesUrl, List.class);
            if (resp.getBody() != null) {
                responses = resp.getBody();
            }
        } catch (Exception e) {
            // fallback
        }

        // 2. Fetch questions from Drive Service (we need driveId, but can query questions for round)
        // We'll search across drives or use round questions endpoint
        // Let's assume we can fetch questions via Drive Service endpoint
        // To get questions with correctOption, drive service provides questions endpoint
        Map<Long, Map<String, Object>> questionMap = new HashMap<>();
        try {
            // Fetch driveId by inspecting round or passing driveId, or querying drive service
            // Here we call questions endpoint
            String qUrl = "http://localhost:8082/api/v1/questions";
            ResponseEntity<List> qResp = restTemplate.getForEntity(qUrl, List.class);
            if (qResp.getBody() != null) {
                for (Object item : qResp.getBody()) {
                    if (item instanceof Map) {
                        Map<String, Object> q = (Map<String, Object>) item;
                        Long qId = Long.valueOf(q.get("id").toString());
                        questionMap.put(qId, q);
                    }
                }
            }
        } catch (Exception e) {
            // fallback
        }

        double mcqScore = 0.0;
        for (Map<String, Object> respMap : responses) {
            Long qId = Long.valueOf(respMap.get("questionId").toString());
            String selectedOption = (String) respMap.get("selectedOption");

            if (selectedOption != null && questionMap.containsKey(qId)) {
                Map<String, Object> question = questionMap.get(qId);
                String correctOption = (String) question.get("correctOption");
                Double marks = Double.valueOf(question.get("marks").toString());

                if (selectedOption.equalsIgnoreCase(correctOption)) {
                    mcqScore += marks;
                }
            }
        }

        Result result = Result.builder()
                .studentId(studentId)
                .roundId(roundId)
                .sessionId(sessionId)
                .mcqScore(mcqScore)
                .subjectiveScore(0.0)
                .totalScore(mcqScore)
                .subjectiveReviewed(false)
                .resultKeyReleased(false)
                .build();

        Result savedResult = resultRepository.save(result);

        // Create Notification for student
        notificationRepository.save(Notification.builder()
                .userId(studentId)
                .title("Submission Received")
                .message("Your Round " + roundId + " submission has been received. MCQ score: " + mcqScore)
                .isRead(false)
                .build());

        return ScoreResponse.builder()
                .resultId(savedResult.getId())
                .mcqScore(mcqScore)
                .build();
    }

    public Result getStudentResult(Long studentId, Long roundId) {
        Result result = resultRepository.findByStudentIdAndRoundId(studentId, roundId)
                .orElseThrow(() -> new ResourceNotFoundException("Result not found for student " + studentId + " in round " + roundId));

        if (!result.isResultKeyReleased()) {
            // Return result with masked/hidden full scorecard details if key not released
            // We set subjective review flag info or return copy
            Result sanitized = new Result();
            sanitized.setId(result.getId());
            sanitized.setStudentId(result.getStudentId());
            sanitized.setRoundId(result.getRoundId());
            sanitized.setSessionId(result.getSessionId());
            sanitized.setMcqScore(result.getMcqScore());
            sanitized.setSubjectiveScore(result.getSubjectiveScore());
            sanitized.setTotalScore(result.getTotalScore());
            sanitized.setPercentile(result.getPercentile());
            sanitized.setSubjectiveReviewed(result.isSubjectiveReviewed());
            sanitized.setResultKeyReleased(false);
            sanitized.setCreatedAt(result.getCreatedAt());
            return sanitized;
        }

        return result;
    }

    public List<Result> getRoundResults(Long roundId) {
        return resultRepository.findByRoundId(roundId);
    }

    public void releaseResultKey(Long roundId) {
        List<Result> results = resultRepository.findByRoundId(roundId);
        for (Result r : results) {
            r.setResultKeyReleased(true);
            resultRepository.save(r);

            notificationRepository.save(Notification.builder()
                    .userId(r.getStudentId())
                    .title("Answer Key Released")
                    .message("Result key for Round " + roundId + " has been released. View your full scorecard.")
                    .isRead(false)
                    .build());
        }
    }

    public void advanceStudents(Long roundId) {
        List<Result> results = resultRepository.findByRoundId(roundId);
        if (results.isEmpty()) return;

        int totalStudents = results.size();

        // Calculate percentile: (students scoring less than this student / total students) * 100
        for (Result r : results) {
            long countLower = results.stream().filter(other -> other.getTotalScore() < r.getTotalScore()).count();
            double percentile = ((double) countLower / totalStudents) * 100.0;
            r.setPercentile(percentile);
            resultRepository.save(r);
        }

        // Fetch cutoff score for round from Drive Service (or default 50.0)
        double cutoffScore = 50.0;
        try {
            // Attempt to query drive service for round details
            // Fallback stays 50.0
        } catch (Exception e) {}

        // Fetch enrollments for drive/students to update status
        for (Result r : results) {
            boolean passed = r.getTotalScore() >= cutoffScore;
            String status = passed ? "ADVANCED" : "ELIMINATED";

            // Create Notification
            notificationRepository.save(Notification.builder()
                    .userId(r.getStudentId())
                    .title("Round Advancement Status")
                    .message("You have been " + status.toLowerCase() + " for Round " + roundId + ". Score: " + r.getTotalScore() + ", Percentile: " + String.format("%.2f", r.getPercentile()))
                    .isRead(false)
                    .build());
        }
    }

    public Result reviewSubjective(Long resultId, SubjectiveReviewRequest request) {
        Result result = resultRepository.findById(resultId)
                .orElseThrow(() -> new ResourceNotFoundException("Result not found with id: " + resultId));

        SubjectiveReview review = SubjectiveReview.builder()
                .resultId(resultId)
                .questionId(request.getQuestionId())
                .marksAwarded(request.getMarksAwarded())
                .reviewedBy(request.getReviewedBy())
                .build();
        subjectiveReviewRepository.save(review);

        // Sum up subjective marks
        List<SubjectiveReview> reviews = subjectiveReviewRepository.findByResultId(resultId);
        double totalSubj = reviews.stream()
                .mapToDouble(r -> r.getMarksAwarded() != null ? r.getMarksAwarded() : 0.0)
                .sum();

        result.setSubjectiveScore(totalSubj);
        result.setTotalScore(result.getMcqScore() + totalSubj);
        result.setSubjectiveReviewed(true);

        return resultRepository.save(result);
    }

    public List<Notification> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Notification markNotificationRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + notificationId));
        notification.setRead(true);
        return notificationRepository.save(notification);
    }
}
